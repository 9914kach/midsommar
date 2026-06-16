"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useUser } from "@/lib/useUser";

type Assignment = { id: string; task: string; assigned_to: string | null; description: string | null; sort_order: number };

export default function AnsvarPage() {
  const me = useUser();
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ task: "", assigned_to: "", description: "" });
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ task: "", assigned_to: "", description: "" });

  async function load() {
    const { data } = await supabase.from("task_assignments").select("*").order("sort_order").order("task");
    setAssignments((data as Assignment[]) ?? []);
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  async function addAssignment(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    await supabase.from("task_assignments").insert({
      task: form.task,
      assigned_to: form.assigned_to || null,
      description: form.description || null,
      sort_order: assignments.length,
    } as never);
    setForm({ task: "", assigned_to: "", description: "" });
    setShowForm(false);
    setSaving(false);
    await load();
  }

  async function saveEdit(id: string) {
    setSaving(true);
    await supabase.from("task_assignments").update({
      task: editForm.task,
      assigned_to: editForm.assigned_to || null,
      description: editForm.description || null,
    } as never).eq("id", id);
    setEditingId(null);
    setSaving(false);
    await load();
  }

  async function deleteAssignment(id: string) {
    await supabase.from("task_assignments").delete().eq("id", id);
    await load();
  }

  const isVard = me.is("värd");

  return (
    <div className="page-bg px-4 pt-6 pb-10 max-w-md mx-auto">
      <div className="flex items-baseline justify-between mb-1">
        <h1 className="page-title">Ansvarsfördelning</h1>
        {isVard && (
          <button onClick={() => setShowForm((v) => !v)} className="text-sm font-medium" style={{ color: "var(--gold)" }}>
            {showForm ? "Avbryt" : "+ Lägg till"}
          </button>
        )}
      </div>
      <div className="gold-rule" />

      {isVard && showForm && (
        <form onSubmit={addAssignment} className="card p-4 mb-5 space-y-3">
          <p className="text-xs font-semibold uppercase" style={{ color: "var(--text-muted)", letterSpacing: "0.08em" }}>Ny uppgift</p>
          <input required placeholder="Uppgift (t.ex. Handla mat)" value={form.task}
            onChange={(e) => setForm((f) => ({ ...f, task: e.target.value }))}
            className="w-full px-3 py-2 rounded-lg border text-sm outline-none"
            style={{ borderColor: "var(--border)", background: "var(--birch)" }} />
          <input placeholder="Ansvarig (t.ex. Anna & Kalle)" value={form.assigned_to}
            onChange={(e) => setForm((f) => ({ ...f, assigned_to: e.target.value }))}
            className="w-full px-3 py-2 rounded-lg border text-sm outline-none"
            style={{ borderColor: "var(--border)", background: "var(--birch)" }} />
          <textarea placeholder="Detaljer / kommentar (valfritt)" value={form.description}
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
      ) : assignments.length === 0 ? (
        <div className="card p-8 text-center" style={{ color: "var(--text-muted)" }}>
          {isVard ? "Tryck '+ Lägg till' för att börja" : "Ingen ansvarsfördelning ännu"}
        </div>
      ) : (
        <div className="space-y-2">
          {assignments.map((a) => (
            <div key={a.id} className="card p-4">
              {editingId === a.id ? (
                <div className="space-y-2">
                  <input value={editForm.task} onChange={(e) => setEditForm((f) => ({ ...f, task: e.target.value }))}
                    className="w-full px-3 py-2 rounded-lg border text-sm outline-none"
                    style={{ borderColor: "var(--border)", background: "var(--birch)" }} />
                  <input value={editForm.assigned_to} onChange={(e) => setEditForm((f) => ({ ...f, assigned_to: e.target.value }))}
                    placeholder="Ansvarig"
                    className="w-full px-3 py-2 rounded-lg border text-sm outline-none"
                    style={{ borderColor: "var(--border)", background: "var(--birch)" }} />
                  <textarea value={editForm.description} onChange={(e) => setEditForm((f) => ({ ...f, description: e.target.value }))}
                    placeholder="Detaljer" rows={2}
                    className="w-full px-3 py-2 rounded-lg border text-sm outline-none resize-none"
                    style={{ borderColor: "var(--border)", background: "var(--birch)" }} />
                  <div className="flex gap-2">
                    <button onClick={() => saveEdit(a.id)} disabled={saving}
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
                    <div>
                      <p className="font-semibold text-sm" style={{ color: "var(--text-dark)" }}>{a.task}</p>
                      {a.assigned_to && (
                        <p className="text-xs mt-0.5 font-medium" style={{ color: "var(--gold)" }}>{a.assigned_to}</p>
                      )}
                      {a.description && (
                        <p className="text-xs mt-1 whitespace-pre-wrap" style={{ color: "var(--text-muted)" }}>{a.description}</p>
                      )}
                    </div>
                    {isVard && (
                      <div className="flex gap-2 shrink-0">
                        <button onClick={() => { setEditingId(a.id); setEditForm({ task: a.task, assigned_to: a.assigned_to ?? "", description: a.description ?? "" }); }}
                          className="text-xs" style={{ color: "var(--text-muted)" }}>Redigera</button>
                        <button onClick={() => deleteAssignment(a.id)} className="text-xs" style={{ color: "var(--lingon)" }}>Ta bort</button>
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
