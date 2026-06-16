"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { ALL_ROLES, ROLE_COLORS, ROLE_LABELS, type Role } from "@/lib/roles";

type Tournament = {
  id: string;
  name: string;
  game: string;
  format: string;
  status: string;
};

type User = { id: string; username: string; role: Role };

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
  const [teamCount, setTeamCount] = useState(0);
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [partyUnlocked, setPartyUnlocked] = useState(false);
  const [togglingParty, setTogglingParty] = useState(false);
  const [users, setUsers] = useState<User[]>([]);
  const [savingRole, setSavingRole] = useState<string | null>(null);
  const [deletingUser, setDeletingUser] = useState<string | null>(null);

  async function loadUsers() {
    const { data } = await supabase.from("users").select("id, username, role").order("created_at");
    setUsers((data as User[]) ?? []);
  }

  useEffect(() => {
    fetch("/api/admin/settings")
      .then((r) => { if (r.status === 403) window.location.replace("/admin/login"); });
    loadUsers();
    supabase.from("official_teams").select("id", { count: "exact", head: true }).then(({ count }) => {
      setTeamCount(count ?? 0);
    });
    supabase.from("tournaments").select("*").order("created_at", { ascending: false }).then(({ data }) => {
      setTournaments(data ?? []);
    });
    supabase.from("app_settings").select("value").eq("key", "party_unlocked").single().then(({ data }) => {
      setPartyUnlocked(data?.value === "true");
    });
  }, []);

  async function changeRole(userId: string, role: Role) {
    setSavingRole(userId);
    const res = await fetch(`/api/users/${userId}/role`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ role }),
    });
    if (res.ok) {
      setUsers((prev) => prev.map((u) => (u.id === userId ? { ...u, role } : u)));
    } else {
      alert("Kunde inte ändra roll – är du inloggad som admin?");
    }
    setSavingRole(null);
  }

  async function deleteUser(userId: string, username: string) {
    if (!confirm(`Ta bort ${username}?`)) return;
    setDeletingUser(userId);
    const res = await fetch(`/api/users/${userId}`, { method: "DELETE" });
    if (res.ok) {
      setUsers((prev) => prev.filter((u) => u.id !== userId));
    } else {
      alert("Kunde inte ta bort användaren.");
    }
    setDeletingUser(null);
  }

  async function toggleParty() {
    setTogglingParty(true);
    const next = !partyUnlocked;
    await fetch("/api/admin/settings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ key: "party_unlocked", value: String(next) }),
    });
    setPartyUnlocked(next);
    setTogglingParty(false);
  }

  return (
    <main className="min-h-screen p-4" style={{ background: "#fff7f0" }}>
      <div className="max-w-lg mx-auto">
        <div className="rounded-2xl p-4 mb-6 border-2" style={{ background: "#c45000", borderColor: "#a03800" }}>
          <h1 className="text-2xl font-bold text-white">Admin</h1>
          <p className="text-orange-100 text-sm">Midsommar 2026</p>
        </div>

        <div className="grid grid-cols-2 gap-3 mb-6">
          <div className="card p-4 text-center" style={{ borderColor: "#c45000", borderWidth: 2 }}>
            <div className="text-3xl font-bold" style={{ color: "#c45000" }}>{users.length}</div>
            <div className="text-sm text-gray-500 mt-1">Deltagare</div>
          </div>
          <div className="card p-4 text-center" style={{ borderColor: "#c45000", borderWidth: 2 }}>
            <div className="text-3xl font-bold" style={{ color: "#c45000" }}>{teamCount}</div>
            <div className="text-sm text-gray-500 mt-1">Lag</div>
          </div>
        </div>

        {/* Party unlock toggle */}
        <div className="card p-4 mb-6" style={{ border: `2px solid ${partyUnlocked ? "#2d6a1f" : "#c45000"}` }}>
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="font-bold text-sm" style={{ color: partyUnlocked ? "#2d6a1f" : "#c45000" }}>
                {partyUnlocked ? "🎉 Party mode aktivt" : "🔒 Party mode stängt"}
              </p>
              <p className="text-xs mt-0.5 text-gray-500">
                {partyUnlocked
                  ? "Gäster ser turnering & leaderboard"
                  : "Gäster ser bara info-sidor"}
              </p>
            </div>
            <button
              onClick={toggleParty}
              disabled={togglingParty}
              className="py-2 px-4 rounded-xl font-bold text-white text-sm shrink-0"
              style={{ background: partyUnlocked ? "#2d6a1f" : "#c45000" }}
            >
              {togglingParty ? "..." : partyUnlocked ? "Stäng" : "Öppna"}
            </button>
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

        {/* User management */}
        <h2 className="text-lg font-bold mb-3" style={{ color: "#c45000" }}>Användare</h2>
        <div className="flex flex-col gap-2 mb-6">
          {users.map((u) => (
            <div key={u.id} className="card p-3 flex items-center gap-3">
              <span className="font-semibold text-gray-800 flex-1 truncate">{u.username}</span>
              <select
                value={u.role}
                disabled={savingRole === u.id}
                onChange={(e) => changeRole(u.id, e.target.value as Role)}
                className="text-sm rounded-lg px-2 py-1 border font-medium"
                style={{ borderColor: "#e8c4a0", color: ROLE_COLORS[u.role], background: "#fff7f0" }}
              >
                {ALL_ROLES.map((r) => (
                  <option key={r} value={r}>{ROLE_LABELS[r]}</option>
                ))}
              </select>
              <button
                onClick={() => deleteUser(u.id, u.username)}
                disabled={deletingUser === u.id || u.role === "admin"}
                className="text-xs px-3 py-1.5 rounded-lg font-medium shrink-0"
                style={{
                  background: u.role === "admin" ? "#eee" : "rgba(196,80,0,0.1)",
                  color: u.role === "admin" ? "#aaa" : "#c45000",
                  cursor: u.role === "admin" ? "not-allowed" : "pointer",
                }}
              >
                {deletingUser === u.id ? "..." : "Ta bort"}
              </button>
            </div>
          ))}
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
