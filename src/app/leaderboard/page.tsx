"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import BottomNav from "@/components/BottomNav";

type OfficialTeam = {
  id: string;
  name: string;
  color: string;
  emoji: string;
  official_team_members: { user_id: string; users: { username: string } | null }[];
};

type TournamentTeam = {
  id: string;
  official_team_id: string | null;
  points: number;
};

type Match = {
  id: string;
  team_a_id: string | null;
  team_b_id: string | null;
  score_a: number;
  score_b: number;
  status: string;
};

type TeamStats = {
  team: OfficialTeam;
  totalPoints: number;
  wins: number;
  draws: number;
  losses: number;
  members: string[];
};

export default function LeaderboardPage() {
  const [stats, setStats] = useState<TeamStats[]>([]);
  const [loading, setLoading] = useState(true);

  async function fetchData() {
    const [{ data: officialTeams }, { data: tournamentTeams }, { data: matches }] = await Promise.all([
      supabase.from("official_teams").select("*, official_team_members(user_id, users(username))"),
      supabase.from("tournament_teams").select("id, official_team_id, points"),
      supabase.from("matches").select("*").eq("status", "completed"),
    ]);

    const teams = (officialTeams as OfficialTeam[]) ?? [];
    const ttList = (tournamentTeams as TournamentTeam[]) ?? [];
    const matchList = (matches as Match[]) ?? [];

    const ttMap = new Map<string, TournamentTeam[]>();
    for (const tt of ttList) {
      if (!tt.official_team_id) continue;
      const arr = ttMap.get(tt.official_team_id) ?? [];
      arr.push(tt);
      ttMap.set(tt.official_team_id, arr);
    }

    const ttIdSet = new Map<string, string>();
    for (const tt of ttList) {
      if (tt.official_team_id) ttIdSet.set(tt.id, tt.official_team_id);
    }

    const teamStats: TeamStats[] = teams.map((team) => {
      const myTTs = ttMap.get(team.id) ?? [];
      const totalPoints = myTTs.reduce((sum, tt) => sum + (tt.points ?? 0), 0);
      const myTTIds = new Set(myTTs.map((tt) => tt.id));

      let wins = 0, draws = 0, losses = 0;
      for (const match of matchList) {
        const aIsMe = match.team_a_id && myTTIds.has(match.team_a_id);
        const bIsMe = match.team_b_id && myTTIds.has(match.team_b_id);
        if (!aIsMe && !bIsMe) continue;

        if (match.score_a === match.score_b) {
          draws++;
        } else {
          const aWon = match.score_a > match.score_b;
          if ((aIsMe && aWon) || (bIsMe && !aWon)) wins++;
          else losses++;
        }
      }

      const members = team.official_team_members.map((m) => m.users?.username ?? m.user_id);

      return { team, totalPoints, wins, draws, losses, members };
    });

    teamStats.sort((a, b) => b.totalPoints - a.totalPoints);
    setStats(teamStats);
    setLoading(false);
  }

  useEffect(() => {
    fetchData();

    const channel = supabase
      .channel("leaderboard-matches")
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "matches" }, () => {
        fetchData();
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

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
          <h1 className="text-2xl font-bold text-white">Poängtavla</h1>
          <p className="text-green-200 text-sm">Midsommar 2026</p>
        </div>

        {stats.length === 0 ? (
          <div className="card p-8 text-center text-gray-400">Inga lag än</div>
        ) : (
          <div className="flex flex-col gap-3">
            {stats.map((s, i) => (
              <div
                key={s.team.id}
                className="card overflow-hidden border-2"
                style={{ borderColor: s.team.color }}
              >
                <div className="px-4 py-3 flex items-center gap-3" style={{ background: s.team.color }}>
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm"
                    style={{ background: i === 0 ? "#f5c842" : i === 1 ? "#c0c0c0" : i === 2 ? "#cd7f32" : "rgba(255,255,255,0.3)" }}
                  >
                    {i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : i + 1}
                  </div>
                  <span className="text-lg">{s.team.emoji}</span>
                  <span className="font-bold text-white text-lg flex-1">{s.team.name}</span>
                  <span className="font-bold text-white text-2xl">{s.totalPoints}p</span>
                </div>
                <div className="px-4 py-3 bg-white">
                  <div className="flex gap-4 text-sm text-gray-600 mb-2">
                    <span className="font-semibold" style={{ color: "#2d6a1f" }}>{s.wins}V</span>
                    <span className="font-semibold text-gray-400">{s.draws}O</span>
                    <span className="font-semibold text-red-500">{s.losses}F</span>
                  </div>
                  {s.members.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {s.members.map((name) => (
                        <span
                          key={name}
                          className="text-xs px-2 py-0.5 rounded-full"
                          style={{ background: s.team.color + "22", color: s.team.color }}
                        >
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
      <BottomNav />
    </main>
  );
}
