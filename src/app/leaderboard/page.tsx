"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useUser } from "@/lib/useUser";
import { NavDrawer } from "@/components/NavDrawer";

type OfficialTeam = {
  id: string; name: string; color: string; emoji: string;
  official_team_members: { user_id: string; users: { username: string } | null }[];
};
type TTeam = { id: string; official_team_id: string | null; points: number };
type Match = { id: string; team_a_id: string | null; team_b_id: string | null; score_a: number; score_b: number; status: string };
type TeamStats = { team: OfficialTeam; totalPoints: number; wins: number; draws: number; losses: number; members: string[] };

const TEAM_COLORS = ["#1e88e5","#e53935","#43a047","#fdd835","#8e24aa","#fb8c00","#e91e63","#00acc1"];
const TEAM_EMOJIS = ["🔵","🔴","🟢","🟡","🟣","🟠","💗","🩵"];

export default function LeaderboardPage() {
  const me = useUser();
  const [stats, setStats] = useState<TeamStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [showRandomize, setShowRandomize] = useState(false);
  const [teamCount, setTeamCount] = useState(4);
  const [teamNames, setTeamNames] = useState<string[]>(["Lag 1","Lag 2","Lag 3","Lag 4"]);
  const [randomizing, setRandomizing] = useState(false);

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
  }

  useEffect(() => {
    fetchData();
    const ch = supabase.channel("leaderboard")
      .on("postgres_changes", { event: "*", schema: "public", table: "matches" }, fetchData)
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, []);

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
            {stats.map((s, i) => (
              <div key={s.team.id} className="card overflow-hidden">
                <div className="px-4 py-3 flex items-center gap-3" style={{ background: s.team.color }}>
                  <span className="text-xl">{medals[i] ?? String(i + 1)}</span>
                  <span className="text-lg">{s.team.emoji}</span>
                  <span className="font-bold text-white text-base flex-1">{s.team.name}</span>
                  <span className="font-bold text-white text-2xl">{s.totalPoints}p</span>
                </div>
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
            ))}
          </div>
        )}
      </div>
    </NavDrawer>
  );
}
