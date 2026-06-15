"use client";

import { useEffect, useState, use } from "react";
import { supabase } from "@/lib/supabase";

type Tournament = { id: string; name: string; game: string; format: string; status: string };
type OfficialTeam = { id: string; name: string; color: string; emoji: string };
type TournamentTeam = { id: string; name: string; color: string | null; official_team_id: string | null; points: number };
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
  pending: "#888",
  active: "#c45000",
  completed: "#2d6a1f",
};

export default function AdminTurneringPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [tournament, setTournament] = useState<Tournament | null>(null);
  const [officialTeams, setOfficialTeams] = useState<OfficialTeam[]>([]);
  const [tournamentTeams, setTournamentTeams] = useState<TournamentTeam[]>([]);
  const [matches, setMatches] = useState<Match[]>([]);
  const [scores, setScores] = useState<Record<string, { score_a: number; score_b: number; status: string }>>({});
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [addingTeams, setAddingTeams] = useState(false);

  async function fetchAll() {
    const [{ data: t }, { data: ot }, { data: tt }, { data: m }] = await Promise.all([
      supabase.from("tournaments").select("*").eq("id", id).single(),
      supabase.from("official_teams").select("*"),
      supabase.from("tournament_teams").select("*").eq("tournament_id", id),
      supabase.from("matches").select("*").eq("tournament_id", id).order("round").order("bracket_position"),
    ]);
    setTournament(t);
    setOfficialTeams(ot ?? []);
    setTournamentTeams(tt ?? []);
    const matchList = m ?? [];
    setMatches(matchList);
    const initialScores: Record<string, { score_a: number; score_b: number; status: string }> = {};
    matchList.forEach((match: Match) => {
      initialScores[match.id] = { score_a: match.score_a, score_b: match.score_b, status: match.status };
    });
    setScores(initialScores);
    setLoading(false);
  }

  useEffect(() => {
    fetchAll();
  }, [id]);

  async function addOfficialTeams() {
    setAddingTeams(true);
    const existingOfficialIds = new Set(tournamentTeams.map((t) => t.official_team_id));
    const toAdd = officialTeams.filter((ot) => !existingOfficialIds.has(ot.id));

    for (const ot of toAdd) {
      const { data: members } = await supabase
        .from("official_team_members")
        .select("user_id")
        .eq("team_id", ot.id);
      const memberUserIds = members?.map((m) => m.user_id) ?? [];
      await fetch(`/api/admin/tournaments/${id}/teams`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: ot.name,
          color: ot.color,
          official_team_id: ot.id,
          memberUserIds,
        }),
      });
    }
    setAddingTeams(false);
    await fetchAll();
  }

  async function generateMatches() {
    setGenerating(true);
    await fetch(`/api/admin/tournaments/${id}/generate`, { method: "POST" });
    setGenerating(false);
    await fetchAll();
  }

  async function saveMatch(matchId: string) {
    const s = scores[matchId];
    if (!s) return;
    await fetch(`/api/matches/${matchId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ score_a: s.score_a, score_b: s.score_b, status: s.status }),
    });
    await fetchAll();
  }

  const teamMap = new Map(tournamentTeams.map((t) => [t.id, t]));

  const rounds = [...new Set(matches.map((m) => m.round))].sort((a, b) => a - b);

  if (loading) {
    return (
      <main className="min-h-screen p-4" style={{ background: "#fff7f0" }}>
        <div className="max-w-lg mx-auto text-center mt-20 text-gray-400">Laddar...</div>
      </main>
    );
  }

  return (
    <main className="min-h-screen p-4 pb-8" style={{ background: "#fff7f0" }}>
      <div className="max-w-lg mx-auto">
        <div className="rounded-2xl p-4 mb-6 border-2" style={{ background: "#c45000", borderColor: "#a03800" }}>
          <h1 className="text-2xl font-bold text-white">{tournament?.name}</h1>
          <p className="text-orange-100 text-sm">{tournament?.game} · {tournament?.format}</p>
        </div>

        <section className="card p-4 mb-4" style={{ borderColor: "#e8c4a0", borderWidth: 2 }}>
          <h2 className="font-bold text-base mb-3" style={{ color: "#c45000" }}>Lag i turneringen</h2>

          {tournamentTeams.length === 0 ? (
            <p className="text-gray-400 text-sm mb-3">Inga lag tillagda ännu</p>
          ) : (
            <div className="flex flex-col gap-2 mb-3">
              {tournamentTeams.map((t) => (
                <div
                  key={t.id}
                  className="flex items-center gap-2 rounded-xl px-3 py-2"
                  style={{ background: (t.color ?? "#888") + "22", border: `1px solid ${t.color ?? "#888"}` }}
                >
                  <div className="w-3 h-3 rounded-full" style={{ background: t.color ?? "#888" }} />
                  <span className="font-medium text-sm">{t.name}</span>
                  <span className="ml-auto text-xs text-gray-400">{t.points} p</span>
                </div>
              ))}
            </div>
          )}

          {officialTeams.length > 0 && (
            <button
              onClick={addOfficialTeams}
              disabled={addingTeams}
              className="w-full py-2 rounded-xl font-bold text-white text-sm"
              style={{ background: addingTeams ? "#e8945a" : "#c45000" }}
            >
              {addingTeams ? "Lägger till..." : "Lägg till officiella lag"}
            </button>
          )}
        </section>

        <section className="card p-4" style={{ borderColor: "#e8c4a0", borderWidth: 2 }}>
          <h2 className="font-bold text-base mb-3" style={{ color: "#c45000" }}>Matcher</h2>

          {matches.length === 0 && tournamentTeams.length > 1 && (
            <button
              onClick={generateMatches}
              disabled={generating}
              className="w-full py-3 rounded-xl font-bold text-white mb-4"
              style={{ background: generating ? "#e8945a" : "#c45000" }}
            >
              {generating ? "Genererar..." : "Generera matcher"}
            </button>
          )}

          {matches.length === 0 && tournamentTeams.length <= 1 && (
            <p className="text-gray-400 text-sm">Lägg till minst 2 lag för att generera matcher</p>
          )}

          {rounds.map((round) => (
            <div key={round} className="mb-4">
              <h3 className="font-semibold text-sm mb-2 text-gray-600">Omgång {round}</h3>
              <div className="flex flex-col gap-3">
                {matches
                  .filter((m) => m.round === round)
                  .map((match) => {
                    const s = scores[match.id] ?? { score_a: match.score_a, score_b: match.score_b, status: match.status };
                    const teamA = match.team_a_id ? teamMap.get(match.team_a_id) : null;
                    const teamB = match.team_b_id ? teamMap.get(match.team_b_id) : null;
                    return (
                      <div
                        key={match.id}
                        className="rounded-xl p-3 border"
                        style={{ borderColor: "#e8c4a0" }}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-medium text-sm">{teamA?.name ?? "TBD"} vs {teamB?.name ?? "TBD"}</span>
                          <span
                            className="text-xs px-2 py-0.5 rounded-full text-white"
                            style={{ background: statusColors[s.status] ?? "#888" }}
                          >
                            {s.status}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 mb-2">
                          <input
                            type="number"
                            min={0}
                            value={s.score_a}
                            onChange={(e) => setScores((prev) => ({ ...prev, [match.id]: { ...s, score_a: Number(e.target.value) } }))}
                            className="w-16 border rounded-lg px-2 py-1 text-center text-sm"
                            style={{ borderColor: "#e8c4a0" }}
                          />
                          <span className="text-gray-400 text-sm">–</span>
                          <input
                            type="number"
                            min={0}
                            value={s.score_b}
                            onChange={(e) => setScores((prev) => ({ ...prev, [match.id]: { ...s, score_b: Number(e.target.value) } }))}
                            className="w-16 border rounded-lg px-2 py-1 text-center text-sm"
                            style={{ borderColor: "#e8c4a0" }}
                          />
                          <select
                            value={s.status}
                            onChange={(e) => setScores((prev) => ({ ...prev, [match.id]: { ...s, status: e.target.value } }))}
                            className="border rounded-lg px-2 py-1 text-sm ml-auto"
                            style={{ borderColor: "#e8c4a0" }}
                          >
                            <option value="pending">Pending</option>
                            <option value="active">Active</option>
                            <option value="completed">Completed</option>
                          </select>
                        </div>
                        <button
                          onClick={() => saveMatch(match.id)}
                          className="w-full py-1.5 rounded-lg font-bold text-white text-sm"
                          style={{ background: "#c45000" }}
                        >
                          Spara
                        </button>
                      </div>
                    );
                  })}
              </div>
            </div>
          ))}
        </section>
      </div>
    </main>
  );
}
