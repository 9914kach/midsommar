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

  useEffect(() => {
    supabase
      .from("users")
      .select("id, username, role")
      .order("created_at")
      .then(({ data }) => {
        setUsers((data as User[]) ?? []);
        setLoading(false);
      });
  }, []);

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

  if (!me.is("admin")) {
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

        {loading ? (
          <p style={{ color: "var(--text-muted)" }}>Laddar...</p>
        ) : (
          <div className="space-y-2">
            {users.map((u) => (
              <div key={u.id} className="card px-4 py-3">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <span className="font-semibold" style={{ color: "var(--text-dark)" }}>
                      {u.username}
                    </span>
                    {u.id === me.id && (
                      <span className="ml-2 text-xs" style={{ color: "var(--text-muted)" }}>
                        (du)
                      </span>
                    )}
                  </div>
                  <select
                    value={u.role}
                    disabled={saving === u.id || u.id === me.id}
                    onChange={(e) => changeRole(u.id, e.target.value as Role)}
                    className="text-sm rounded-lg px-2 py-1 border font-medium"
                    style={{
                      borderColor: "var(--border)",
                      color: ROLE_COLORS[u.role],
                      background: "var(--birch)",
                    }}
                  >
                    {ALL_ROLES.map((r) => (
                      <option key={r} value={r}>
                        {ROLE_LABELS[r]}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="mt-1">
                  <span
                    className="text-xs px-2 py-0.5 rounded-full"
                    style={{
                      background: ROLE_COLORS[u.role] + "20",
                      color: ROLE_COLORS[u.role],
                    }}
                  >
                    {ROLE_LABELS[u.role]}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </NavDrawer>
  );
}
