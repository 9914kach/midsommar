"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useUser } from "@/lib/useUser";
import { ALL_ROLES, ROLE_COLORS, ROLE_LABELS, type Role } from "@/lib/roles";
import { NavDrawer } from "@/components/NavDrawer";

type User = { id: string; username: string; role: Role };

export default function AnvandareePage() {
  const me = useUser();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [seeding, setSeeding] = useState(false);
  const [seedMsg, setSeedMsg] = useState<string | null>(null);

  useEffect(() => {
    supabase
      .from("users")
      .select("id, username, role")
      .order("created_at")
      .then(({ data }) => {
        setUsers((data as User[]) ?? []);
        setLoading(false);
      });
  }, [me.id]);

  async function loadUsers() {
    const { data } = await supabase.from("users").select("id, username, role").order("created_at");
    setUsers((data as User[]) ?? []);
  }

  async function seedUsers() {
    setSeeding(true);
    setSeedMsg(null);
    const res = await fetch("/api/admin/seed-users", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({}) });
    const json = await res.json();
    setSeedMsg(json.ok ? `Skapade ${json.created} testgäster` : json.error);
    await loadUsers();
    setSeeding(false);
  }

  async function deleteGuests() {
    if (!confirm("Ta bort alla gäster? (dina egna kvar)")) return;
    setSeeding(true);
    setSeedMsg(null);
    await fetch("/api/admin/seed-users", { method: "DELETE" });
    setSeedMsg("Gäster borttagna");
    await loadUsers();
    setSeeding(false);
  }

  async function deleteUser(userId: string, username: string) {
    if (!confirm(`Ta bort ${username}?`)) return;
    setDeleting(userId);
    await fetch(`/api/users/${userId}`, { method: "DELETE" });
    setUsers((prev) => prev.filter((u) => u.id !== userId));
    setDeleting(null);
  }

  async function changeRole(userId: string, role: Role) {
    setSaving(userId);
    const res = await fetch(`/api/users/${userId}/role`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ role }),
    });
    if (res.ok) {
      setUsers((prev) => prev.map((u) => (u.id === userId ? { ...u, role } : u)));
    }
    setSaving(null);
  }

  if (!me.is("värd")) {
    return (
      <NavDrawer>
        <div className="page-bg flex items-center justify-center min-h-screen">
          <p style={{ color: "var(--text-muted)" }}>Ingen behörighet.</p>
        </div>
      </NavDrawer>
    );
  }

  return (
    <NavDrawer>
      <main className="page-bg px-4 pt-14 pb-10 max-w-md mx-auto">
        <div className="pt-8 pb-6">
          <p className="page-subtitle mb-2">Administration</p>
          <h1 className="page-title">Användare</h1>
          <div className="gold-rule" />
          <p className="text-sm mt-2" style={{ color: "var(--text-muted)" }}>
            {users.length} registrerade
          </p>
        </div>

        {me.is("admin") && <div className="card px-4 py-3 mb-4 space-y-2">
          <p className="text-xs font-semibold uppercase" style={{ color: "var(--text-muted)", letterSpacing: "0.08em" }}>
            Testdata
          </p>
          <div className="flex gap-2">
            <button
              onClick={seedUsers}
              disabled={seeding}
              className="btn-primary"
              style={{ fontSize: "13px", padding: "8px 14px" }}
            >
              {seeding ? "..." : "⚡ Skapa testgäster"}
            </button>
            <button
              onClick={deleteGuests}
              disabled={seeding}
              className="btn-outline"
              style={{ fontSize: "13px", padding: "8px 14px", color: "var(--lingon)", borderColor: "var(--lingon)" }}
            >
              🗑 Ta bort gäster
            </button>
          </div>
          {seedMsg && (
            <p className="text-xs" style={{ color: "var(--text-muted)" }}>{seedMsg}</p>
          )}
        </div>}

        {loading ? (
          <p style={{ color: "var(--text-muted)" }}>Laddar...</p>
        ) : (
          <div className="space-y-2">
            {users.map((u) => {
              const isSelf = u.id === me.id;
              const canDelete = !isSelf && u.role !== "admin" && (me.is("admin") || u.role === "gäst");
              return (
                <div key={u.id} className="card px-4 py-3">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="font-semibold truncate" style={{ color: "var(--text-dark)" }}>
                        {u.username}
                      </span>
                      {isSelf && (
                        <span className="text-xs shrink-0" style={{ color: "var(--text-muted)" }}>(du)</span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {me.is("admin") ? (
                        <select
                          value={u.role}
                          disabled={saving === u.id || isSelf}
                          onChange={(e) => changeRole(u.id, e.target.value as Role)}
                          className="text-sm rounded-lg px-2 py-1 border font-medium"
                          style={{ borderColor: "var(--border)", color: ROLE_COLORS[u.role], background: "var(--birch)" }}
                        >
                          {ALL_ROLES.map((r) => (
                            <option key={r} value={r}>{ROLE_LABELS[r]}</option>
                          ))}
                        </select>
                      ) : (
                        <span className="text-xs px-2 py-0.5 rounded-full"
                          style={{ background: ROLE_COLORS[u.role] + "20", color: ROLE_COLORS[u.role] }}>
                          {ROLE_LABELS[u.role]}
                        </span>
                      )}
                      {canDelete && (
                        <button
                          onClick={() => deleteUser(u.id, u.username)}
                          disabled={deleting === u.id}
                          className="text-xs px-2.5 py-1.5 rounded-lg font-medium"
                          style={{ background: "rgba(139,38,53,0.08)", color: "var(--lingon)" }}
                        >
                          {deleting === u.id ? "..." : "Ta bort"}
                        </button>
                      )}
                    </div>
                  </div>
                  {me.is("admin") && (
                    <div className="mt-1">
                      <span className="text-xs px-2 py-0.5 rounded-full"
                        style={{ background: ROLE_COLORS[u.role] + "20", color: ROLE_COLORS[u.role] }}>
                        {ROLE_LABELS[u.role]}
                      </span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </main>
    </NavDrawer>
  );
}
