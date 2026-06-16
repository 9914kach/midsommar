"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useUser } from "@/lib/useUser";

type Item = { id: string; text: string; category: string; sort_order: number };

export default function PacklistaPage() {
  const me = useUser();
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ text: "", category: "Övrigt" });
  const [saving, setSaving] = useState(false);
  const [newCategory, setNewCategory] = useState(false);

  async function load() {
    const { data } = await supabase.from("packing_items").select("*").order("category").order("sort_order");
    setItems((data as Item[]) ?? []);
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  async function addItem(e: React.FormEvent) {
    e.preventDefault();
    if (!form.text.trim()) return;
    setSaving(true);
    await supabase.from("packing_items").insert({
      text: form.text.trim(),
      category: form.category || "Övrigt",
      sort_order: items.filter((i) => i.category === form.category).length,
    });
    setForm((f) => ({ ...f, text: "" }));
    setSaving(false);
    await load();
  }

  async function deleteItem(id: string) {
    await supabase.from("packing_items").delete().eq("id", id);
    await load();
  }

  const isVard = me.is("värd");
  const categories = [...new Set(items.map((i) => i.category))].sort();
  const existingCategories = categories.length > 0 ? categories : ["Övrigt"];

  return (
    <div className="page-bg px-4 pt-6 pb-10 max-w-md mx-auto">
      <div className="flex items-baseline justify-between mb-1">
        <h1 className="page-title">Att ta med</h1>
        {isVard && (
          <button onClick={() => setShowForm((v) => !v)} className="text-sm font-medium" style={{ color: "var(--gold)" }}>
            {showForm ? "Avbryt" : "+ Lägg till"}
          </button>
        )}
      </div>
      <div className="gold-rule" />

      {isVard && showForm && (
        <form onSubmit={addItem} className="card p-4 mb-5 space-y-3">
          <p className="text-xs font-semibold uppercase" style={{ color: "var(--text-muted)", letterSpacing: "0.08em" }}>Ny sak</p>
          <input required placeholder="Vad ska man ta med?" value={form.text}
            onChange={(e) => setForm((f) => ({ ...f, text: e.target.value }))}
            className="w-full px-3 py-2 rounded-lg border text-sm outline-none"
            style={{ borderColor: "var(--border)", background: "var(--birch)" }} />
          <div>
            <p className="text-xs mb-1" style={{ color: "var(--text-muted)" }}>Kategori</p>
            {!newCategory ? (
              <div className="flex gap-2">
                <select value={form.category} onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
                  className="flex-1 px-3 py-2 rounded-lg border text-sm outline-none"
                  style={{ borderColor: "var(--border)", background: "var(--birch)" }}>
                  {existingCategories.map((c) => <option key={c}>{c}</option>)}
                </select>
                <button type="button" onClick={() => { setNewCategory(true); setForm((f) => ({ ...f, category: "" })); }}
                  className="px-3 py-2 rounded-lg text-xs"
                  style={{ background: "var(--border)", color: "var(--text-dark)" }}>Ny</button>
              </div>
            ) : (
              <div className="flex gap-2">
                <input placeholder="Ny kategori" value={form.category}
                  onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
                  className="flex-1 px-3 py-2 rounded-lg border text-sm outline-none"
                  style={{ borderColor: "var(--border)", background: "var(--birch)" }} />
                <button type="button" onClick={() => { setNewCategory(false); setForm((f) => ({ ...f, category: existingCategories[0] ?? "Övrigt" })); }}
                  className="px-3 py-2 rounded-lg text-xs"
                  style={{ background: "var(--border)", color: "var(--text-dark)" }}>Välj</button>
              </div>
            )}
          </div>
          <button type="submit" disabled={saving} className="btn-primary">
            {saving ? "Sparar..." : "Lägg till"}
          </button>
        </form>
      )}

      {loading ? (
        <p className="text-center mt-10" style={{ color: "var(--text-muted)" }}>Laddar...</p>
      ) : items.length === 0 ? (
        <div className="card p-8 text-center" style={{ color: "var(--text-muted)" }}>
          {isVard ? "Tryck '+ Lägg till' för att börja" : "Listan är tom"}
        </div>
      ) : (
        <div className="space-y-4">
          {categories.map((cat) => (
            <div key={cat}>
              <p className="text-xs font-semibold uppercase mb-2" style={{ color: "var(--text-muted)", letterSpacing: "0.08em" }}>{cat}</p>
              <div className="card divide-y" style={{ borderColor: "var(--border)" }}>
                {items.filter((i) => i.category === cat).map((item) => (
                  <div key={item.id} className="flex items-center gap-3 px-4 py-3">
                    <span className="text-sm flex-1" style={{ color: "var(--text-dark)" }}>{item.text}</span>
                    {isVard && (
                      <button onClick={() => deleteItem(item.id)} className="text-xs shrink-0" style={{ color: "var(--lingon)" }}>
                        Ta bort
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
