"use client";

import { useEffect, useState, use } from "react";
import { supabase } from "@/lib/supabase";
import BottomNav from "@/components/BottomNav";

type Tournament = { id: string; name: string; game: string; format: string; status: string };
type TournamentTeam = { id: string; name: string; color: string | null; points: number };
type Match = {
  id: string;
  tournament_id: string;
  team_a_id: string | null;
  team_b_id: string | null;
  score_a: number;
  score_b: number;
  status: string;
  round: number;
  bracket_position: number | null;
};

const statusColors: Record<string, string> = {
  pending: "#e5e7eb",
  active: "#f5c842",
  completed: "#c5e8a0",
};

export default function TurneringDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [tournament, setTournament] = useState<Tournament | null>(null);
  const [teams, setTeams] = useState<TournamentTeam[]>([]);
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);

  async function fetchData() {
    const [{ data: t }, { data: tt }, { data: m }] = await Promise.all([
      supabase.from("tournaments").select("*").eq("id", id).single(),
      supabase.from("tournament_teams").select("*").eq("tournament_id", id),
      supabase.from("matches").select("*").eq("tournament_id", id).order("round").order("bracket_position"),
    ]);
    setTournament(t);
    setTeams(tt ?? []);
    setMatches(m ?? []);
    setLoading(false);
  }

  useEffect(() => {
    fetchData();

    const channel = supabase
      .channel(`matches-${id}`)
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "matches", filter: `tournament_id=eq.${id}` },
        () => { fetchData(); }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [id]);

  async function updateScore(matchId: string, field: "score_a" | "score_b", delta: number) {
    const match = matches.find((m) => m.id === matchId);
    if (!match) return;
    const newVal = Math.max(0, (match[field] ?? 0) + delta);
    await fetch(`/api/matches/${matchId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ [field]: newVal }),
    });
    setMatches((prev) => prev.map((m) => m.id === matchId ? { ...m, [field]: newVal } : m));
  }

  async function finishMatch(matchId: string) {
    await fetch(`/api/matches/${matchId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "completed" }),
    });
    await fetchData();
  }

  const teamMap = new Map(teams.map((t) => [t.id, t]));
  const rounds = [...new Set(matches.map((m) => m.round))].sort((a, b) => a - b);

  if (loading) {
    return (
      <main className="min-h-screen pb-28 midsommar-bg">
        <div className="max-w-lg mx-auto p-4 text-center mt-20 text-gray-400">Laddar...</div>
        <BottomNav />
      </main>
    );
  }

  return (
    <main className="min-h-screen pb-28 midsommar-bg">
      <div className="max-w-lg mx-auto p-4">
        <div className="rounded-2xl p-4 mb-6" style={{ background: "#2d6a1f" }}>
          <h1 className="text-2xl font-bold text-white">{tournament?.name}</h1>
          <p className="text-green-200 text-sm">{tournament?.game}</p>
        </div>

        {rounds.length === 0 && (
          <div className="card p-6 text-center text-gray-400">Inga matcher än</div>
        )}

        {rounds.map((round) => (
          <div key={round} className="mb-5">
            <h2 className="font-bold text-base mb-2" style={{ color: "#2d6a1f" }}>Omgång {round}</h2>
            <div className="flex flex-col gap-3">
              {matches
                .filter((m) => m.round === round)
                .map((match) => {
                  const teamA = match.team_a_id ? teamMap.get(match.team_a_id) : null;
                  const teamB = match.team_b_id ? teamMap.get(match.team_b_id) : null;
                  const isActive = match.status === "active";

                  return (
                    <div
                      key={match.id}
                      className="card p-4 border-2"
                      style={{ borderColor: "#c5e8a0", background: statusColors[match.status] ?? "white" }}
                    >
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2 flex-1">
                          {teamA?.color && (
                            <div className="w-3 h-3 rounded-full" style={{ background: teamA.color }} />
                          )}
                          <span className="font-semibold text-sm">{teamA?.name ?? "TBD"}</span>
                        </div>
                        <div className="flex items-center gap-3 px-2">
                          <span className="text-xl font-bold" style={{ color: "#2d6a1f" }}>{match.score_a}</span>
                          <span className="text-gray-400">–</span>
                          <span className="text-xl font-bold" style={{ color: "#2d6a1f" }}>{match.score_b}</span>
                        </div>
                        <div className="flex items-center gap-2 flex-1 justify-end">
                          <span className="font-semibold text-sm">{teamB?.name ?? "TBD"}</span>
                          {teamB?.color && (
                            <div className="w-3 h-3 rounded-full" style={{ background: teamB.color }} />
                          )}
                        </div>
                      </div>

                      {isActive && (
                        <div className="flex gap-2 mt-2">
                          <div className="flex items-center gap-1 flex-1">
                            <button
                              onClick={() => updateScore(match.id, "score_a", -1)}
                              className="w-8 h-8 rounded-lg font-bold text-white text-lg flex items-center justify-center"
                              style={{ background: "#2d6a1f" }}
                            >–</button>
                            <button
                              onClick={() => updateScore(match.id, "score_a", 1)}
                              className="w-8 h-8 rounded-lg font-bold text-white text-lg flex items-center justify-center"
                              style={{ background: "#2d6a1f" }}
                            >+</button>
                          </div>
                          <button
                            onClick={() => finishMatch(match.id)}
                            className="px-3 py-1 rounded-lg text-xs font-bold text-white"
                            style={{ background: "#c45000" }}
                          >
                            Avsluta
                          </button>
                          <div className="flex items-center gap-1 flex-1 justify-end">
                            <button
                              onClick={() => updateScore(match.id, "score_b", 1)}
                              className="w-8 h-8 rounded-lg font-bold text-white text-lg flex items-center justify-center"
                              style={{ background: "#2d6a1f" }}
                            >+</button>
                            <button
                              onClick={() => updateScore(match.id, "score_b", -1)}
                              className="w-8 h-8 rounded-lg font-bold text-white text-lg flex items-center justify-center"
                              style={{ background: "#2d6a1f" }}
                            >–</button>
                          </div>
                        </div>
                      )}

                      {!isActive && (
                        <div className="text-center text-xs text-gray-500 mt-1">
                          {match.status === "completed" ? "Avslutad" : match.status === "pending" ? "Ej startad" : ""}
                        </div>
                      )}
                    </div>
                  );
                })}
            </div>
          </div>
        ))}
      </div>
      <BottomNav />
    </main>
  );
}
