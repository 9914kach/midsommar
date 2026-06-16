"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useUser } from "@/lib/useUser";

type Guest = { id: string; username: string; role: string };

const roleOrder: Record<string, number> = { admin: 0, lekledare: 1, värd: 2, gäst: 3 };
const roleLabel: Record<string, string> = { admin: "Admin", lekledare: "Lekledare", värd: "Värd", gäst: "Gäst" };
const roleColors: Record<string, string> = {
  admin: "#e63946", lekledare: "var(--blue-deep)", värd: "var(--gold)", gäst: "var(--text-muted)",
};

export default function GastlistaPage() {
  const me = useUser();
  const [guests, setGuests] = useState<Guest[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    supabase.from("users").select("id, username, role").order("username").then(({ data }) => {
      setGuests((data as Guest[]) ?? []);
      setLoading(false);
    });
  }, []);

  const isVard = me.is("värd");
  const filtered = guests.filter((g) => g.username.toLowerCase().includes(search.toLowerCase()));
  const grouped = Object.entries(
    filtered.reduce<Record<string, Guest[]>>((acc, g) => {
      const r = g.role in roleOrder ? g.role : "gäst";
      if (!acc[r]) acc[r] = [];
      acc[r].push(g);
      return acc;
    }, {})
  ).sort(([a], [b]) => (roleOrder[a] ?? 9) - (roleOrder[b] ?? 9));

  const total = guests.length;
  const guestCount = guests.filter((g) => g.role === "gäst").length;

  return (
    <div className="page-bg px-4 pt-6 pb-10 max-w-md mx-auto">
      <div className="flex items-baseline justify-between mb-1">
        <h1 className="page-title">Gästlista</h1>
        <span className="text-sm" style={{ color: "var(--text-muted)" }}>{total} st</span>
      </div>
      <div className="gold-rule" />

      {total > 0 && (
        <div className="flex gap-3 mb-4">
          <div className="card flex-1 p-3 text-center">
            <p className="text-2xl font-bold" style={{ color: "var(--blue-deep)" }}>{total}</p>
            <p className="text-xs" style={{ color: "var(--text-muted)" }}>inloggade</p>
          </div>
          <div className="card flex-1 p-3 text-center">
            <p className="text-2xl font-bold" style={{ color: "var(--gold)" }}>{guestCount}</p>
            <p className="text-xs" style={{ color: "var(--text-muted)" }}>gäster</p>
          </div>
          <div className="card flex-1 p-3 text-center">
            <p className="text-2xl font-bold" style={{ color: "var(--leaf)" }}>{total - guestCount}</p>
            <p className="text-xs" style={{ color: "var(--text-muted)" }}>värdar/ledare</p>
          </div>
        </div>
      )}

      <input placeholder="Sök gäst..." value={search} onChange={(e) => setSearch(e.target.value)}
        className="w-full px-3 py-2 rounded-lg border text-sm outline-none mb-4"
        style={{ borderColor: "var(--border)", background: "var(--birch)" }} />

      {loading ? (
        <p className="text-center mt-10" style={{ color: "var(--text-muted)" }}>Laddar...</p>
      ) : filtered.length === 0 ? (
        <div className="card p-8 text-center" style={{ color: "var(--text-muted)" }}>
          {search ? "Ingen matchning" : "Inga gäster ännu"}
        </div>
      ) : (
        <div className="space-y-4">
          {grouped.map(([role, members]) => (
            <div key={role}>
              <p className="text-xs font-semibold uppercase mb-2" style={{ color: "var(--text-muted)", letterSpacing: "0.08em" }}>
                {roleLabel[role] ?? role} ({members.length})
              </p>
              <div className="card divide-y" style={{ borderColor: "var(--border)" }}>
                {members.map((g) => (
                  <div key={g.id} className="flex items-center gap-3 px-4 py-3">
                    <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 font-semibold text-sm"
                      style={{ background: (roleColors[g.role] ?? "var(--text-muted)") + "22", color: roleColors[g.role] ?? "var(--text-muted)" }}>
                      {g.username[0]?.toUpperCase()}
                    </div>
                    <span className="flex-1 text-sm font-medium" style={{ color: "var(--text-dark)" }}>{g.username}</span>
                    {isVard && g.role !== "gäst" && (
                      <span className="text-xs px-2 py-0.5 rounded-full"
                        style={{ background: (roleColors[g.role] ?? "#888") + "22", color: roleColors[g.role] ?? "#888" }}>
                        {roleLabel[g.role]}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      <p className="text-xs text-center mt-6" style={{ color: "var(--text-muted)" }}>
        Alla som loggat in syns här
      </p>
    </div>
  );
}
