"use client";

import { useEffect, useState, use } from "react";
import { supabase } from "@/lib/supabase";
import { useUser } from "@/lib/useUser";
import { NavDrawer } from "@/components/NavDrawer";

type Tournament = { id: string; name: string; game: string; format: string; status: string };
type TTeam = { id: string; name: string; color: string | null; points: number };
type Match = {
  id: string; tournament_id: string; team_a_id: string | null; team_b_id: string | null;
  score_a: number; score_b: number; status: string; round: number; bracket_position: number | null;
};
type OfficialTeam = { id: string; name: string; color: string; emoji: string };

const statusBg: Record<string, string> = {
  pending: "var(--birch)", active: "rgba(200,168,75,0.10)", completed: "rgba(61,107,58,0.08)",
};

export default function TurneringDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const me = useUser();
  const [tournament, setTournament] = useState<Tournament | null>(null);
  const [teams, setTeams] = useState<TTeam[]>([]);
  const [matches, setMatches] = useState<Match[]>([]);
  const [officialTeams, setOfficialTeams] = useState<OfficialTeam[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddTeam, setShowAddTeam] = useState(false);
  const [generating, setGenerating] = useState(false);

  async function fetchData() {
    const [{ data: t }, { data: tt }, { data: m }, { data: ot }] = await Promise.all([
      supabase.from("tournaments").select("*").eq("id", id).single(),
      supabase.from("tournament_teams").select("*").eq("tournament_id", id),
      supabase.from("matches").select("*").eq("tournament_id", id).order("round").order("bracket_position"),
      supabase.from("official_teams").select("*"),
    ]);
    setTournament(t);
    setTeams((tt as TTeam[]) ?? []);
    setMatches((m as Match[]) ?? []);
    setOfficialTeams((ot as OfficialTeam[]) ?? []);
    setLoading(false);
  }

  useEffect(() => {
    fetchData();
    const ch = supabase.channel(`matches-${id}`)
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "matches", filter: `tournament_id=eq.${id}` }, fetchData)
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [id]);

  async function addOfficialTeams() {
    const existing = new Set(teams.map((t) => t.id));
    for (const ot of officialTeams) {
      if (teams.some((t) => t.name === ot.name)) continue;
      await fetch(`/api/admin/tournaments/${id}/teams`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: ot.name, color: ot.color, official_team_id: ot.id }),
      });
    }
    void existing;
    await fetchData();
    setShowAddTeam(false);
  }

  async function generateMatches() {
    setGenerating(true);
    await fetch(`/api/admin/tournaments/${id}/generate`, { method: "POST" });
    await fetchData();
    setGenerating(false);
  }

  async function updateScore(matchId: string, field: "score_a" | "score_b", delta: number) {
    const match = matches.find((m) => m.id === matchId);
    if (!match) return;
    const val = Math.max(0, (match[field] ?? 0) + delta);
    setMatches((prev) => prev.map((m) => m.id === matchId ? { ...m, [field]: val } : m));
    await fetch(`/api/matches/${matchId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ [field]: val }),
    });
  }

  async function setMatchStatus(matchId: string, status: string) {
    await fetch(`/api/matches/${matchId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    await fetchData();
  }

  const teamMap = new Map(teams.map((t) => [t.id, t]));
  const rounds = [...new Set(matches.map((m) => m.round))].sort((a, b) => a - b);
  const isLekledare = me.is("lekledare");
  const noMatches = matches.length === 0;
  const hasTeams = teams.length >= 2;

  if (loading) return (
    <NavDrawer>
      <div className="page-bg flex items-center justify-center min-h-screen">
        <p style={{ color: "var(--text-muted)" }}>Laddar...</p>
      </div>
    </NavDrawer>
  );

  return (
    <NavDrawer>
      <div className="page-bg px-4 pt-6 pb-10 max-w-md mx-auto">
        <p className="page-subtitle mb-1">{tournament?.game}</p>
        <h1 className="page-title">{tournament?.name}</h1>
        <div className="gold-rule" />

        {isLekledare && (
          <div className="card p-4 mb-5 space-y-3">
            <p className="text-xs font-semibold uppercase" style={{ color: "var(--text-muted)", letterSpacing: "0.08em" }}>
              Lekledare
            </p>
            <div className="flex gap-2 flex-wrap">
              <button
                onClick={() => setShowAddTeam((v) => !v)}
                className="btn-outline text-sm py-2 px-3"
                style={{ width: "auto" }}
              >
                {showAddTeam ? "Stäng" : "+ Lägg till lag"}
              </button>
              {hasTeams && noMatches && (
                <button
                  onClick={generateMatches}
                  disabled={generating}
                  className="btn-primary text-sm py-2 px-3"
                  style={{ width: "auto" }}
                >
                  {generating ? "Genererar..." : "⚡ Generera matcher"}
                </button>
              )}
            </div>

            {showAddTeam && officialTeams.length > 0 && (
              <div>
                <p className="text-xs mb-2" style={{ color: "var(--text-muted)" }}>
                  Officiella lag: {officialTeams.map((o) => o.emoji + " " + o.name).join(", ")}
                </p>
                <button onClick={addOfficialTeams} className="btn-gold text-sm py-2">
                  Lägg till alla officiella lag
                </button>
              </div>
            )}

            {teams.length > 0 && (
              <div className="flex gap-2 flex-wrap">
                {teams.map((t) => (
                  <span key={t.id} className="text-xs px-2 py-1 rounded-full font-medium"
                    style={{ background: (t.color ?? "#888") + "22", color: t.color ?? "#888" }}>
                    {t.name}
                  </span>
                ))}
              </div>
            )}
          </div>
        )}

        {rounds.length === 0 ? (
          <div className="card p-8 text-center" style={{ color: "var(--text-muted)" }}>
            {hasTeams ? "Tryck 'Generera matcher' för att starta" : "Lägg till lag för att börja"}
          </div>
        ) : (
          rounds.map((round) => (
            <div key={round} className="mb-5">
              <p className="text-xs font-semibold uppercase mb-2" style={{ color: "var(--text-muted)", letterSpacing: "0.08em" }}>
                Omgång {round}
              </p>
              <div className="space-y-3">
                {matches.filter((m) => m.round === round).map((match) => {
                  const tA = match.team_a_id ? teamMap.get(match.team_a_id) : null;
                  const tB = match.team_b_id ? teamMap.get(match.team_b_id) : null;
                  const isActive = match.status === "active";
                  const isDone = match.status === "completed";

                  return (
                    <div key={match.id} className="card p-4" style={{ background: statusBg[match.status] ?? "var(--birch)" }}>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                          {tA?.color && <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: tA.color }} />}
                          <span className="font-semibold text-sm truncate" style={{ color: "var(--text-dark)" }}>
                            {tA?.name ?? "TBD"}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 px-3 shrink-0">
                          <span className="text-xl font-bold tabular-nums" style={{ color: "var(--blue-deep)" }}>{match.score_a}</span>
                          <span style={{ color: "var(--border)" }}>–</span>
                          <span className="text-xl font-bold tabular-nums" style={{ color: "var(--blue-deep)" }}>{match.score_b}</span>
                        </div>
                        <div className="flex items-center gap-2 flex-1 min-w-0 justify-end">
                          <span className="font-semibold text-sm truncate" style={{ color: "var(--text-dark)" }}>
                            {tB?.name ?? "TBD"}
                          </span>
                          {tB?.color && <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: tB.color }} />}
                        </div>
                      </div>

                      {isActive && (
                        <div className="flex gap-2 mt-3">
                          <div className="flex gap-1 flex-1">
                            <button onClick={() => updateScore(match.id, "score_a", -1)}
                              className="w-9 h-9 rounded-lg font-bold text-lg flex items-center justify-center"
                              style={{ background: "var(--border)", color: "var(--text-dark)" }}>–</button>
                            <button onClick={() => updateScore(match.id, "score_a", 1)}
                              className="w-9 h-9 rounded-lg font-bold text-lg flex items-center justify-center"
                              style={{ background: "var(--blue-deep)", color: "white" }}>+</button>
                          </div>
                          {isLekledare && (
                            <button onClick={() => setMatchStatus(match.id, "completed")}
                              className="px-3 py-1 rounded-lg text-xs font-semibold"
                              style={{ background: "var(--leaf)", color: "white" }}>
                              Avsluta
                            </button>
                          )}
                          <div className="flex gap-1 flex-1 justify-end">
                            <button onClick={() => updateScore(match.id, "score_b", 1)}
                              className="w-9 h-9 rounded-lg font-bold text-lg flex items-center justify-center"
                              style={{ background: "var(--blue-deep)", color: "white" }}>+</button>
                            <button onClick={() => updateScore(match.id, "score_b", -1)}
                              className="w-9 h-9 rounded-lg font-bold text-lg flex items-center justify-center"
                              style={{ background: "var(--border)", color: "var(--text-dark)" }}>–</button>
                          </div>
                        </div>
                      )}

                      {match.status === "pending" && isLekledare && (
                        <button onClick={() => setMatchStatus(match.id, "active")}
                          className="w-full mt-3 py-1.5 rounded-lg text-xs font-semibold"
                          style={{ background: "rgba(200,168,75,0.2)", color: "#7a6010" }}>
                          ▶ Starta match
                        </button>
                      )}

                      {isDone && (
                        <p className="text-center text-xs mt-2" style={{ color: "var(--text-muted)" }}>
                          ✓ Avslutad
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))
        )}
      </div>
    </NavDrawer>
  );
}
