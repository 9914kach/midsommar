"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useUser } from "@/lib/useUser";
import { NavDrawer } from "@/components/NavDrawer";
import { usePartyUnlocked } from "@/lib/PartyContext";

type OfficialTeam = {
  id: string; name: string; color: string; emoji: string;
  official_team_members: { user_id: string; users: { username: string } | null }[];
};
type TTeam = { id: string; official_team_id: string | null; points: number };
type Match = { id: string; team_a_id: string | null; team_b_id: string | null; score_a: number; score_b: number; status: string };
type TeamStats = { team: OfficialTeam; totalPoints: number; wins: number; draws: number; losses: number; members: string[] };
type AnyUser = { id: string; username: string };

const TEAM_COLORS = ["#1e88e5","#e53935","#43a047","#fdd835","#8e24aa","#fb8c00","#e91e63","#00acc1"];
const TEAM_EMOJIS = ["🔵","🔴","🟢","🟡","🟣","🟠","💗","🩵"];

function LockedScreen() {
  return (
    <div className="page-bg flex items-center justify-center px-8" style={{ minHeight: "calc(100dvh - 56px)" }}>
      <div className="text-center">
        <div className="text-6xl mb-5">🌸</div>
        <h2 className="text-xl font-bold mb-2" style={{ color: "var(--blue-deep)" }}>Snart dags!</h2>
        <p className="text-sm" style={{ color: "var(--text-muted)" }}>
          Den här funktionen låses upp på midsommarafton.
        </p>
      </div>
    </div>
  );
}

export default function LeaderboardPage() {
  const me = useUser();
  const partyUnlocked = usePartyUnlocked();
  const [stats, setStats] = useState<TeamStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [showRandomize, setShowRandomize] = useState(false);
  const [teamCount, setTeamCount] = useState(4);
  const [teamNames, setTeamNames] = useState<string[]>(["Lag 1","Lag 2","Lag 3","Lag 4"]);
  const [randomizing, setRandomizing] = useState(false);

  const [editingTeamId, setEditingTeamId] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState<{ name: string; color: string; emoji: string } | null>(null);
  const [allUsers, setAllUsers] = useState<AnyUser[]>([]);
  const [memberUserIds, setMemberUserIds] = useState<Record<string, string[]>>({});
  const [savingTeam, setSavingTeam] = useState(false);

  async function fetchData() {
    const [{ data: ot }, { data: tt }, { data: m }] = await Promise.all([
      supabase.from("official_teams").select("*, official_team_members(user_id, users(username))"),
      supabase.from("tournament_teams").select("id, official_team_id, points"),
      supabase.from("matches").select("*").eq("status", "completed"),
    ]);
    const teams = (ot as OfficialTeam[]) ?? [];
    const ttList = (tt as TTeam[]) ?? [];
    const matchList = (m as Match[]) ?? [];

    const ttMap = new Map<string, TTeam[]>();
    for (const t of ttList) {
      if (!t.official_team_id) continue;
      const arr = ttMap.get(t.official_team_id) ?? [];
      arr.push(t);
      ttMap.set(t.official_team_id, arr);
    }

    const result: TeamStats[] = teams.map((team) => {
      const myTTs = ttMap.get(team.id) ?? [];
      const totalPoints = myTTs.reduce((s, t) => s + (t.points ?? 0), 0);
      const myIds = new Set(myTTs.map((t) => t.id));
      let wins = 0, draws = 0, losses = 0;
      for (const match of matchList) {
        const aMe = match.team_a_id && myIds.has(match.team_a_id);
        const bMe = match.team_b_id && myIds.has(match.team_b_id);
        if (!aMe && !bMe) continue;
        if (match.score_a === match.score_b) { draws++; continue; }
        const aWon = match.score_a > match.score_b;
        if ((aMe && aWon) || (bMe && !aWon)) wins++; else losses++;
      }
      const members = team.official_team_members.map((m) => m.users?.username ?? "?");
      return { team, totalPoints, wins, draws, losses, members };
    });

    result.sort((a, b) => b.totalPoints - a.totalPoints);
    setStats(result);
    setLoading(false);

    const ids: Record<string, string[]> = {};
    for (const team of teams) {
      ids[team.id] = team.official_team_members.map((m) => m.user_id);
    }
    setMemberUserIds(ids);
  }

  useEffect(() => {
    fetchData();
    const ch = supabase.channel("leaderboard")
      .on("postgres_changes", { event: "*", schema: "public", table: "matches" }, fetchData)
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, []);

  useEffect(() => {
    if (me.is("lekledare")) {
      supabase.from("users").select("id, username").order("username").then(({ data }) => {
        setAllUsers((data as AnyUser[]) ?? []);
      });
    }
  }, [me.id]);

  function openEdit(s: TeamStats) {
    setEditingTeamId(s.team.id);
    setEditDraft({ name: s.team.name, color: s.team.color, emoji: s.team.emoji });
  }

  async function saveTeam(teamId: string) {
    if (!editDraft) return;
    setSavingTeam(true);
    await fetch(`/api/admin/teams/${teamId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(editDraft),
    });
    await fetchData();
    setEditingTeamId(null);
    setSavingTeam(false);
  }

  async function addMember(teamId: string, userId: string) {
    await fetch(`/api/admin/teams/${teamId}/members`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId }),
    });
    await fetchData();
  }

  async function removeMember(teamId: string, userId: string) {
    await fetch(`/api/admin/teams/${teamId}/members`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId }),
    });
    await fetchData();
  }

  function updateTeamCount(n: number) {
    setTeamCount(n);
    setTeamNames((prev) => {
      const next = [...prev];
      while (next.length < n) next.push(`Lag ${next.length + 1}`);
      return next.slice(0, n);
    });
  }

  async function randomize() {
    setRandomizing(true);
    await fetch("/api/admin/teams/randomize", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        teamNames,
        teamColors: TEAM_COLORS.slice(0, teamCount),
        teamEmojis: TEAM_EMOJIS.slice(0, teamCount),
      }),
    });
    setShowRandomize(false);
    setRandomizing(false);
    await fetchData();
  }

  const medals = ["🥇","🥈","🥉"];
  const allMemberIds = new Set(Object.values(memberUserIds).flat());

  if (!partyUnlocked && !me.is("värd")) {
    return <NavDrawer><LockedScreen /></NavDrawer>;
  }

  return (
    <NavDrawer>
      <div className="page-bg px-4 pt-6 pb-10 max-w-md mx-auto">
        <div className="flex items-baseline justify-between mb-1">
          <h1 className="page-title">Leaderboard</h1>
          {me.is("admin") && (
            <button onClick={() => setShowRandomize((v) => !v)}
              className="text-sm font-medium" style={{ color: "var(--gold)" }}>
              {showRandomize ? "Stäng" : "⚡ Slumpa lag"}
            </button>
          )}
        </div>
        <div className="gold-rule" />

        {me.is("admin") && showRandomize && (
          <div className="card p-4 mb-5 space-y-4">
            <p className="text-xs font-semibold uppercase" style={{ color: "var(--text-muted)", letterSpacing: "0.08em" }}>
              Slumpa officiella lag
            </p>
            <div className="flex items-center gap-3">
              <span className="text-sm" style={{ color: "var(--text-muted)" }}>Antal lag:</span>
              {[2,3,4,5,6,7,8].map((n) => (
                <button key={n} onClick={() => updateTeamCount(n)}
                  className="w-8 h-8 rounded-lg text-sm font-semibold"
                  style={{ background: teamCount === n ? "var(--blue-deep)" : "var(--birch)", color: teamCount === n ? "white" : "var(--text-muted)", border: "1px solid var(--border)" }}>
                  {n}
                </button>
              ))}
            </div>
            <div className="space-y-2">
              {teamNames.map((name, i) => (
                <div key={i} className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full shrink-0" style={{ background: TEAM_COLORS[i] }} />
                  <input value={name}
                    onChange={(e) => setTeamNames((prev) => prev.map((n, j) => j === i ? e.target.value : n))}
                    className="flex-1 px-3 py-1.5 rounded-lg border text-sm outline-none"
                    style={{ borderColor: "var(--border)", background: "var(--birch)" }}
                  />
                </div>
              ))}
            </div>
            <p className="text-xs" style={{ color: "var(--text-muted)" }}>
              ⚠️ Raderar befintliga lag och slumpar om alla registrerade användare
            </p>
            <button onClick={randomize} disabled={randomizing} className="btn-primary">
              {randomizing ? "Slumpar..." : "🎲 Slumpa nu"}
            </button>
          </div>
        )}

        {loading ? (
          <p className="text-center mt-10" style={{ color: "var(--text-muted)" }}>Laddar...</p>
        ) : stats.length === 0 ? (
          <div className="card p-8 text-center" style={{ color: "var(--text-muted)" }}>
            {me.is("admin") ? "Slumpa lag för att starta" : "Inga lag än"}
          </div>
        ) : (
          <div className="space-y-3 mt-4">
            {stats.map((s, i) => {
              const isEditing = editingTeamId === s.team.id;
              const teamMemberIds = memberUserIds[s.team.id] ?? [];
              const unassigned = allUsers.filter((u) => !allMemberIds.has(u.id));

              return (
                <div key={s.team.id} className="card overflow-hidden">
                  <div className="px-4 py-3 flex items-center gap-3" style={{ background: isEditing && editDraft ? editDraft.color : s.team.color }}>
                    <span className="text-xl">{medals[i] ?? String(i + 1)}</span>
                    <span className="text-lg">{isEditing && editDraft ? editDraft.emoji : s.team.emoji}</span>
                    <span className="font-bold text-white text-base flex-1">
                      {isEditing && editDraft ? editDraft.name : s.team.name}
                    </span>
                    <span className="font-bold text-white text-2xl">{s.totalPoints}p</span>
                    {me.is("lekledare") && !isEditing && (
                      <button
                        onClick={() => openEdit(s)}
                        className="text-white opacity-70 hover:opacity-100 text-lg leading-none"
                        aria-label="Redigera lag"
                      >
                        ✏️
                      </button>
                    )}
                    {isEditing && (
                      <button onClick={() => setEditingTeamId(null)} className="text-white opacity-70 hover:opacity-100 text-base">✕</button>
                    )}
                  </div>

                  {isEditing && editDraft && (
                    <div className="px-4 py-3 space-y-3 border-b" style={{ borderColor: "var(--border)" }}>
                      <input
                        value={editDraft.name}
                        onChange={(e) => setEditDraft((d) => d ? { ...d, name: e.target.value } : d)}
                        className="w-full px-3 py-1.5 rounded-lg border text-sm outline-none"
                        style={{ borderColor: "var(--border)", background: "var(--birch)" }}
                        placeholder="Lagnamn"
                      />
                      <div className="grid grid-cols-4 gap-3">
                        {TEAM_COLORS.map((c) => (
                          <button key={c} onClick={() => setEditDraft((d) => d ? { ...d, color: c } : d)}
                            className="w-10 h-10 rounded-full"
                            style={{ background: c, outline: editDraft.color === c ? "2px solid white" : "none", outlineOffset: "3px", boxShadow: editDraft.color === c ? `0 0 0 4px ${c}` : "none" }}
                          />
                        ))}
                      </div>
                      <div className="grid grid-cols-4 gap-2">
                        {TEAM_EMOJIS.map((e) => (
                          <button key={e} onClick={() => setEditDraft((d) => d ? { ...d, emoji: e } : d)}
                            className="w-10 h-10 rounded-xl text-xl flex items-center justify-center"
                            style={{ background: editDraft.emoji === e ? "var(--blue-deep)" : "var(--birch)", border: `1px solid ${editDraft.emoji === e ? "var(--blue-deep)" : "var(--border)"}` }}
                          >
                            {e}
                          </button>
                        ))}
                      </div>

                      <div>
                        <p className="text-xs font-semibold mb-1" style={{ color: "var(--text-muted)" }}>Medlemmar</p>
                        <div className="space-y-0.5">
                          {s.members.map((name) => {
                            const u = allUsers.find((u) => u.username === name);
                            return (
                              <div key={name} className="flex items-center justify-between py-2 text-sm">
                                <span style={{ color: "var(--text-dark)" }}>{name}</span>
                                {u && (
                                  <button onClick={() => removeMember(s.team.id, u.id)}
                                    className="text-xs px-3 py-1.5 rounded-lg font-medium"
                                    style={{ color: "var(--lingon)", background: "rgba(139,38,53,0.08)" }}>
                                    Ta bort
                                  </button>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      {unassigned.length > 0 && (
                        <div>
                          <p className="text-xs font-semibold mb-1" style={{ color: "var(--text-muted)" }}>Lägg till</p>
                          <div className="space-y-0.5">
                            {unassigned.map((u) => (
                              <button key={u.id} onClick={() => addMember(s.team.id, u.id)}
                                className="w-full flex items-center gap-2 py-2 px-3 rounded-lg text-sm text-left"
                                style={{ background: "rgba(27,63,110,0.05)", color: "var(--blue-deep)", border: "1px solid var(--border)" }}>
                                <span className="font-bold">+</span> {u.username}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}

                      <button onClick={() => saveTeam(s.team.id)} disabled={savingTeam}
                        className="btn-primary" style={{ fontSize: "13px", padding: "8px" }}>
                        {savingTeam ? "Sparar..." : "Spara ändringar"}
                      </button>
                    </div>
                  )}

                  <div className="px-4 py-3">
                    <div className="flex gap-4 text-sm mb-2">
                      <span className="font-semibold" style={{ color: "var(--leaf)" }}>{s.wins}V</span>
                      <span className="font-semibold" style={{ color: "var(--text-muted)" }}>{s.draws}O</span>
                      <span className="font-semibold" style={{ color: "var(--lingon)" }}>{s.losses}F</span>
                    </div>
                    {s.members.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {s.members.map((name) => (
                          <span key={name} className="text-xs px-2 py-0.5 rounded-full"
                            style={{ background: s.team.color + "22", color: s.team.color }}>
                            {name}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </NavDrawer>
  );
}
