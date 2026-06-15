"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { useUser } from "@/lib/useUser";
import { NavDrawer } from "@/components/NavDrawer";

type Tournament = { id: string; name: string; game: string; format: string; status: string };

const statusLabels: Record<string, string> = { draft: "Utkast", active: "Pågår", completed: "Avslutad" };
const statusColors: Record<string, { bg: string; text: string }> = {
  draft: { bg: "rgba(139,115,85,0.12)", text: "var(--text-muted)" },
  active: { bg: "rgba(200,168,75,0.18)", text: "#7a6010" },
  completed: { bg: "rgba(61,107,58,0.12)", text: "var(--leaf)" },
};
const formatLabels: Record<string, string> = { bracket: "Bracket", round_robin: "Round Robin", free: "Fri" };

export default function TurneringPage() {
  const me = useUser();
  const router = useRouter();
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: "", game: "", format: "bracket" as "bracket" | "round_robin" | "free" });
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    supabase.from("tournaments").select("*").order("created_at", { ascending: false })
      .then(({ data }) => { setTournaments((data as Tournament[]) ?? []); setLoading(false); });
  }, []);

  async function createTournament(e: React.FormEvent) {
    e.preventDefault();
    setCreating(true);
    const res = await fetch("/api/admin/tournaments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    if (res.ok) {
      const { tournament } = await res.json();
      router.push(`/turnering/${tournament.id}`);
    }
    setCreating(false);
  }

  return (
    <NavDrawer>
      <div className="page-bg px-4 pt-6 pb-10 max-w-md mx-auto">
        <div className="flex items-baseline justify-between mb-1">
          <h1 className="page-title">Turneringar</h1>
          {me.is("lekledare") && (
            <button
              onClick={() => setShowForm((v) => !v)}
              className="text-sm font-medium"
              style={{ color: "var(--gold)" }}
            >
              {showForm ? "Avbryt" : "+ Skapa"}
            </button>
          )}
        </div>
        <div className="gold-rule" />

        {me.is("lekledare") && showForm && (
          <form onSubmit={createTournament} className="card p-4 mb-5 space-y-3">
            <p className="text-xs font-semibold uppercase" style={{ color: "var(--text-muted)", letterSpacing: "0.08em" }}>
              Ny turnering
            </p>
            <input
              required
              placeholder="Namn (t.ex. Beer Pong)"
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              className="w-full px-3 py-2 rounded-lg border text-sm outline-none"
              style={{ borderColor: "var(--border)", background: "var(--birch)" }}
            />
            <input
              required
              placeholder="Lek (t.ex. Beer Pong)"
              value={form.game}
              onChange={(e) => setForm((f) => ({ ...f, game: e.target.value }))}
              className="w-full px-3 py-2 rounded-lg border text-sm outline-none"
              style={{ borderColor: "var(--border)", background: "var(--birch)" }}
            />
            <div className="flex gap-2">
              {(["bracket", "round_robin", "free"] as const).map((f) => (
                <button
                  key={f} type="button"
                  onClick={() => setForm((v) => ({ ...v, format: f }))}
                  className="flex-1 py-1.5 rounded-lg text-xs font-medium transition-all"
                  style={{
                    background: form.format === f ? "var(--blue-deep)" : "var(--birch)",
                    color: form.format === f ? "white" : "var(--text-muted)",
                    border: "1px solid var(--border)",
                  }}
                >
                  {formatLabels[f]}
                </button>
              ))}
            </div>
            <button type="submit" className="btn-primary" disabled={creating}>
              {creating ? "Skapar..." : "Skapa turnering"}
            </button>
          </form>
        )}

        {loading ? (
          <p className="text-center mt-10" style={{ color: "var(--text-muted)" }}>Laddar...</p>
        ) : tournaments.length === 0 ? (
          <div className="card p-8 text-center" style={{ color: "var(--text-muted)" }}>
            Inga turneringar än
          </div>
        ) : (
          <div className="space-y-2 mt-4">
            {tournaments.map((t) => {
              const sc = statusColors[t.status] ?? statusColors.draft;
              return (
                <Link key={t.id} href={`/turnering/${t.id}`}>
                  <div className="card px-4 py-3 active:opacity-70 transition-opacity">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold" style={{ color: "var(--text-dark)" }}>🏆 {t.name}</span>
                      <span className="text-xs px-2 py-0.5 rounded-full font-medium"
                        style={{ background: sc.bg, color: sc.text }}>
                        {statusLabels[t.status] ?? t.status}
                      </span>
                    </div>
                    <div className="flex gap-2 mt-1 text-xs" style={{ color: "var(--text-muted)" }}>
                      <span>{t.game}</span>
                      <span>·</span>
                      <span>{formatLabels[t.format] ?? t.format}</span>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </NavDrawer>
  );
}
