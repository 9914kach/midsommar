"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useUser } from "@/lib/useUser";

type Entry = { id: string; time: string; title: string; description: string | null; sort_order: number };

export default function SchemaPage() {
  const me = useUser();
  const [entries, setEntries] = useState<Entry[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ time: "", title: "", description: "" });
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ time: "", title: "", description: "" });

  async function load() {
    const { data } = await supabase.from("schedule_entries").select("*").order("sort_order").order("time");
    setEntries((data as Entry[]) ?? []);
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  async function addEntry(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    await supabase.from("schedule_entries").insert({
      time: form.time, title: form.title,
      description: form.description || null,
      sort_order: entries.length,
    });
    setForm({ time: "", title: "", description: "" });
    setShowForm(false);
    setSaving(false);
    await load();
  }

  async function saveEdit(id: string) {
    setSaving(true);
    await supabase.from("schedule_entries").update({
      time: editForm.time, title: editForm.title,
      description: editForm.description || null,
    }).eq("id", id);
    setEditingId(null);
    setSaving(false);
    await load();
  }

  async function deleteEntry(id: string) {
    await supabase.from("schedule_entries").delete().eq("id", id);
    await load();
  }

  const isVard = me.is("värd");

  return (
    <div className="page-bg px-4 pt-6 pb-10 max-w-md mx-auto">
      <div className="flex items-baseline justify-between mb-1">
        <h1 className="page-title">Schema</h1>
        {isVard && (
          <button onClick={() => setShowForm((v) => !v)} className="text-sm font-medium" style={{ color: "var(--gold)" }}>
            {showForm ? "Avbryt" : "+ Lägg till"}
          </button>
        )}
      </div>
      <div className="gold-rule" />

      {isVard && showForm && (
        <form onSubmit={addEntry} className="card p-4 mb-5 space-y-3">
          <p className="text-xs font-semibold uppercase" style={{ color: "var(--text-muted)", letterSpacing: "0.08em" }}>Ny aktivitet</p>
          <div className="flex gap-2">
            <input required type="time" value={form.time}
              onChange={(e) => setForm((f) => ({ ...f, time: e.target.value }))}
              className="w-24 px-3 py-2 rounded-lg border text-sm outline-none"
              style={{ borderColor: "var(--border)", background: "var(--birch)" }} />
            <input required placeholder="Aktivitet" value={form.title}
              onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
              className="flex-1 px-3 py-2 rounded-lg border text-sm outline-none"
              style={{ borderColor: "var(--border)", background: "var(--birch)" }} />
          </div>
          <textarea placeholder="Beskrivning (valfritt)" value={form.description}
            onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
            rows={2} className="w-full px-3 py-2 rounded-lg border text-sm outline-none resize-none"
            style={{ borderColor: "var(--border)", background: "var(--birch)" }} />
          <button type="submit" disabled={saving} className="btn-primary">
            {saving ? "Sparar..." : "Lägg till"}
          </button>
        </form>
      )}

      {loading ? (
        <p className="text-center mt-10" style={{ color: "var(--text-muted)" }}>Laddar...</p>
      ) : entries.length === 0 ? (
        <div className="card p-8 text-center" style={{ color: "var(--text-muted)" }}>
          {isVard ? "Tryck '+ Lägg till' för att bygga schemat" : "Inget schema ännu"}
        </div>
      ) : (
        <div className="relative">
          <div className="absolute left-[52px] top-2 bottom-2 w-px" style={{ background: "var(--border)" }} />
          <div className="space-y-0">
            {entries.map((entry) => (
              <div key={entry.id} className="flex gap-4 pb-5">
                <div className="w-14 shrink-0 pt-0.5">
                  <span className="text-sm font-semibold tabular-nums" style={{ color: "var(--gold)" }}>{entry.time}</span>
                </div>
                <div className="w-3 h-3 rounded-full shrink-0 mt-1 relative z-10"
                  style={{ background: "var(--gold)", border: "2px solid #F5F0E8" }} />
                <div className="flex-1 min-w-0">
                  {editingId === entry.id ? (
                    <div className="space-y-2">
                      <div className="flex gap-2">
                        <input type="time" value={editForm.time}
                          onChange={(e) => setEditForm((f) => ({ ...f, time: e.target.value }))}
                          className="w-24 px-2 py-1 rounded-lg border text-sm outline-none"
                          style={{ borderColor: "var(--border)", background: "var(--birch)" }} />
                        <input value={editForm.title}
                          onChange={(e) => setEditForm((f) => ({ ...f, title: e.target.value }))}
                          className="flex-1 px-2 py-1 rounded-lg border text-sm outline-none"
                          style={{ borderColor: "var(--border)", background: "var(--birch)" }} />
                      </div>
                      <textarea value={editForm.description}
                        onChange={(e) => setEditForm((f) => ({ ...f, description: e.target.value }))}
                        rows={2} placeholder="Beskrivning"
                        className="w-full px-2 py-1 rounded-lg border text-sm outline-none resize-none"
                        style={{ borderColor: "var(--border)", background: "var(--birch)" }} />
                      <div className="flex gap-2">
                        <button onClick={() => saveEdit(entry.id)} disabled={saving}
                          className="text-xs px-3 py-1 rounded-lg font-semibold"
                          style={{ background: "var(--leaf)", color: "white" }}>Spara</button>
                        <button onClick={() => setEditingId(null)}
                          className="text-xs px-3 py-1 rounded-lg"
                          style={{ background: "var(--border)", color: "var(--text-dark)" }}>Avbryt</button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="flex items-start justify-between gap-2">
                        <p className="font-semibold text-sm" style={{ color: "var(--text-dark)" }}>{entry.title}</p>
                        {isVard && (
                          <div className="flex gap-2 shrink-0">
                            <button onClick={() => { setEditingId(entry.id); setEditForm({ time: entry.time, title: entry.title, description: entry.description ?? "" }); }}
                              className="text-xs" style={{ color: "var(--text-muted)" }}>Redigera</button>
                            <button onClick={() => deleteEntry(entry.id)} className="text-xs" style={{ color: "var(--lingon)" }}>Ta bort</button>
                          </div>
                        )}
                      </div>
                      {entry.description && (
                        <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>{entry.description}</p>
                      )}
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
