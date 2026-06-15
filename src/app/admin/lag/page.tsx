"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

const PRESET_COLORS = [
  { label: "Röd", value: "#e53935" },
  { label: "Blå", value: "#1e88e5" },
  { label: "Grön", value: "#43a047" },
  { label: "Gul", value: "#fdd835" },
  { label: "Lila", value: "#8e24aa" },
  { label: "Orange", value: "#fb8c00" },
  { label: "Rosa", value: "#e91e63" },
  { label: "Turkos", value: "#00acc1" },
];

const DEFAULT_EMOJIS = ["🔴", "🔵", "🟢", "🟡", "🟣", "🟠", "🌸", "🩵"];
const DEFAULT_NAMES = ["Röda", "Blåa", "Gröna", "Gula", "Lila", "Orange", "Rosa", "Turkosa"];

type OfficialTeam = {
  id: string;
  name: string;
  color: string;
  emoji: string;
  official_team_members: { user_id: string; users: { username: string } | null }[];
};

export default function AdminLagPage() {
  const [teams, setTeams] = useState<OfficialTeam[]>([]);
  const [loading, setLoading] = useState(true);
  const [teamCount, setTeamCount] = useState(4);
  const [teamNames, setTeamNames] = useState<string[]>(DEFAULT_NAMES.slice(0, 4));
  const [teamColors, setTeamColors] = useState<string[]>(PRESET_COLORS.slice(0, 4).map((c) => c.value));
  const [teamEmojis, setTeamEmojis] = useState<string[]>(DEFAULT_EMOJIS.slice(0, 4));
  const [saving, setSaving] = useState(false);

  async function fetchTeams() {
    const { data } = await supabase
      .from("official_teams")
      .select("*, official_team_members(user_id, users(username))");
    setTeams((data as OfficialTeam[]) ?? []);
    setLoading(false);
  }

  useEffect(() => {
    fetchTeams();
  }, []);

  function handleCountChange(count: number) {
    setTeamCount(count);
    setTeamNames(DEFAULT_NAMES.slice(0, count));
    setTeamColors(PRESET_COLORS.slice(0, count).map((c) => c.value));
    setTeamEmojis(DEFAULT_EMOJIS.slice(0, count));
  }

  async function handleRandomize() {
    setSaving(true);
    const res = await fetch("/api/admin/teams/randomize", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ teamNames, teamColors, teamEmojis }),
    });
    setSaving(false);
    if (res.ok) {
      await fetchTeams();
    }
  }

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
          <h1 className="text-2xl font-bold text-white">Laghantering</h1>
        </div>

        {teams.length === 0 ? (
          <div className="card p-5" style={{ borderColor: "#e8c4a0", borderWidth: 2 }}>
            <h2 className="font-bold text-lg mb-4" style={{ color: "#c45000" }}>Slumpa lag</h2>

            <label className="block mb-2 font-medium text-sm text-gray-700">
              Antal lag: {teamCount}
            </label>
            <input
              type="range"
              min={2}
              max={8}
              value={teamCount}
              onChange={(e) => handleCountChange(Number(e.target.value))}
              className="w-full mb-4"
            />

            <div className="flex flex-col gap-3 mb-4">
              {Array.from({ length: teamCount }).map((_, i) => (
                <div key={i} className="flex items-center gap-2">
                  <input
                    type="text"
                    value={teamNames[i] ?? ""}
                    onChange={(e) => {
                      const next = [...teamNames];
                      next[i] = e.target.value;
                      setTeamNames(next);
                    }}
                    className="flex-1 border rounded-lg px-3 py-2 text-sm"
                    style={{ borderColor: "#e8c4a0" }}
                    placeholder={`Lag ${i + 1}`}
                  />
                  <div className="flex gap-1 flex-wrap">
                    {PRESET_COLORS.map((c) => (
                      <button
                        key={c.value}
                        onClick={() => {
                          const next = [...teamColors];
                          next[i] = c.value;
                          setTeamColors(next);
                        }}
                        title={c.label}
                        className="w-5 h-5 rounded-full border-2"
                        style={{
                          background: c.value,
                          borderColor: teamColors[i] === c.value ? "#333" : "transparent",
                        }}
                      />
                    ))}
                  </div>
                  <div
                    className="w-6 h-6 rounded-full border-2 border-gray-300"
                    style={{ background: teamColors[i] ?? "#888" }}
                  />
                </div>
              ))}
            </div>

            <button
              onClick={handleRandomize}
              disabled={saving}
              className="w-full py-3 rounded-xl font-bold text-white"
              style={{ background: saving ? "#e8945a" : "#c45000" }}
            >
              {saving ? "Slumpar..." : "Slumpa lag!"}
            </button>
          </div>
        ) : (
          <>
            <div className="flex flex-col gap-4 mb-6">
              {teams.map((team) => (
                <div
                  key={team.id}
                  className="rounded-2xl overflow-hidden shadow"
                  style={{ border: `2px solid ${team.color}` }}
                >
                  <div className="px-4 py-3 font-bold text-white text-lg" style={{ background: team.color }}>
                    {team.emoji} {team.name}
                  </div>
                  <div className="p-3 bg-white">
                    {team.official_team_members.length === 0 ? (
                      <p className="text-gray-400 text-sm">Inga medlemmar</p>
                    ) : (
                      <div className="flex flex-wrap gap-2">
                        {team.official_team_members.map((m) => (
                          <span
                            key={m.user_id}
                            className="text-sm px-2 py-1 rounded-full"
                            style={{ background: team.color + "22", color: team.color }}
                          >
                            {m.users?.username ?? m.user_id}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <button
              onClick={handleRandomize}
              disabled={saving}
              className="w-full py-3 rounded-xl font-bold text-white"
              style={{ background: saving ? "#e8945a" : "#c45000" }}
            >
              {saving ? "Slumpar om..." : "Slumpa om"}
            </button>
          </>
        )}
      </div>
    </main>
  );
}
