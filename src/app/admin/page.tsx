"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

type Tournament = {
  id: string;
  name: string;
  game: string;
  format: string;
  status: string;
};

const statusColors: Record<string, string> = {
  draft: "#888",
  active: "#c45000",
  completed: "#2d6a1f",
};

const formatLabels: Record<string, string> = {
  bracket: "Bracket",
  round_robin: "Round Robin",
  free: "Fri",
};

export default function AdminPage() {
  const router = useRouter();
  const [userCount, setUserCount] = useState(0);
  const [teamCount, setTeamCount] = useState(0);
  const [tournaments, setTournaments] = useState<Tournament[]>([]);

  useEffect(() => {
    supabase.from("users").select("id", { count: "exact", head: true }).then(({ count }) => {
      setUserCount(count ?? 0);
    });
    supabase.from("official_teams").select("id", { count: "exact", head: true }).then(({ count }) => {
      setTeamCount(count ?? 0);
    });
    supabase.from("tournaments").select("*").order("created_at", { ascending: false }).then(({ data }) => {
      setTournaments(data ?? []);
    });
  }, []);

  return (
    <main className="min-h-screen p-4" style={{ background: "#fff7f0" }}>
      <div className="max-w-lg mx-auto">
        <div className="rounded-2xl p-4 mb-6 border-2" style={{ background: "#c45000", borderColor: "#a03800" }}>
          <h1 className="text-2xl font-bold text-white">Admin</h1>
          <p className="text-orange-100 text-sm">Midsommar 2026</p>
        </div>

        <div className="grid grid-cols-2 gap-3 mb-6">
          <div className="card p-4 text-center" style={{ borderColor: "#c45000", borderWidth: 2 }}>
            <div className="text-3xl font-bold" style={{ color: "#c45000" }}>{userCount}</div>
            <div className="text-sm text-gray-500 mt-1">Deltagare</div>
          </div>
          <div className="card p-4 text-center" style={{ borderColor: "#c45000", borderWidth: 2 }}>
            <div className="text-3xl font-bold" style={{ color: "#c45000" }}>{teamCount}</div>
            <div className="text-sm text-gray-500 mt-1">Lag</div>
          </div>
        </div>

        <div className="flex gap-3 mb-6">
          <button
            onClick={() => router.push("/admin/lag")}
            className="flex-1 py-3 rounded-2xl font-bold text-white"
            style={{ background: "#c45000" }}
          >
            Hantera lag
          </button>
          <button
            onClick={() => router.push("/admin/turnering/ny")}
            className="flex-1 py-3 rounded-2xl font-bold text-white"
            style={{ background: "#c45000" }}
          >
            Ny turnering
          </button>
        </div>

        <h2 className="text-lg font-bold mb-3" style={{ color: "#c45000" }}>Turneringar</h2>
        {tournaments.length === 0 ? (
          <div className="card p-6 text-center text-gray-400">Inga turneringar än</div>
        ) : (
          <div className="flex flex-col gap-3">
            {tournaments.map((t) => (
              <button
                key={t.id}
                onClick={() => router.push(`/admin/turnering/${t.id}`)}
                className="card p-4 text-left w-full"
                style={{ borderColor: "#e8c4a0", borderWidth: 2 }}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-bold text-gray-800">{t.name}</span>
                  <span
                    className="text-xs px-2 py-0.5 rounded-full text-white font-medium"
                    style={{ background: statusColors[t.status] ?? "#888" }}
                  >
                    {t.status}
                  </span>
                </div>
                <div className="flex gap-2 text-sm text-gray-500">
                  <span>{t.game}</span>
                  <span>·</span>
                  <span>{formatLabels[t.format] ?? t.format}</span>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
