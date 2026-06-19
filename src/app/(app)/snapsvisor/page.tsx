"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useUser } from "@/lib/useUser";
import { snapsvisor as staticVisor } from "@/lib/data/snapsvisor";
import { ChevronRight, Trash2 } from "lucide-react";

type CustomVisa = {
  id: string;
  title: string;
  lyrics: string;
  melody: string | null;
  created_by: string | null;
  creator_name: string | null;
  created_at: string;
};

type AnyVisa = {
  id: string;
  title: string;
  lyrics: string;
  melody?: string | null;
  tags?: string[];
  creator_name?: string | null;
  created_by?: string | null;
  isCustom: boolean;
};

export default function SnapsvisorPage() {
  const me = useUser();
  const [open, setOpen] = useState<string | null>(null);
  const [activeTag, setActiveTag] = useState<string>("alla");
  const [query, setQuery] = useState("");
  const [customVisor, setCustomVisor] = useState<CustomVisa[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newMelody, setNewMelody] = useState("");
  const [newLyrics, setNewLyrics] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  async function loadCustom() {
    const { data } = await supabase
      .from("custom_snapsvisor")
      .select("*")
      .order("created_at", { ascending: false });
    setCustomVisor((data as CustomVisa[]) ?? []);
  }

  useEffect(() => { loadCustom(); }, []);

  const allVisor: AnyVisa[] = [
    ...staticVisor.map((v) => ({ ...v, isCustom: false })),
    ...customVisor.map((v) => ({ ...v, tags: ["egna"], isCustom: true })),
  ];

  const allTags = ["alla", "egna", ...Array.from(new Set(staticVisor.flatMap((v) => v.tags ?? [])))];

  const tagFiltered =
    activeTag === "alla"
      ? allVisor
      : activeTag === "egna"
      ? allVisor.filter((v) => v.isCustom)
      : allVisor.filter((v) => !v.isCustom && v.tags?.includes(activeTag));

  const q = query.trim().toLowerCase();
  const filtered = q
    ? tagFiltered.filter(
        (v) =>
          v.title.toLowerCase().includes(q) ||
          (v.melody ?? "").toLowerCase().includes(q) ||
          v.lyrics.toLowerCase().includes(q)
      )
    : tagFiltered;

  function random() {
    const r = allVisor[Math.floor(Math.random() * allVisor.length)];
    setOpen(r.id);
    setActiveTag("alla");
    setTimeout(() => {
      document.getElementById(r.id)?.scrollIntoView({ behavior: "smooth", block: "center" });
    }, 100);
  }

  async function submitVisa(e: React.FormEvent) {
    e.preventDefault();
    if (!newTitle.trim() || !newLyrics.trim()) return;
    setSubmitting(true);
    const res = await fetch("/api/snapsvisor", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: newTitle.trim(), lyrics: newLyrics.trim(), melody: newMelody.trim() || null }),
    });
    if (res.ok) {
      setNewTitle("");
      setNewMelody("");
      setNewLyrics("");
      setShowForm(false);
      setActiveTag("egna");
      await loadCustom();
    }
    setSubmitting(false);
  }

  async function deleteVisa(id: string) {
    if (!confirm("Ta bort visan?")) return;
    setDeletingId(id);
    await fetch(`/api/snapsvisor/${id}`, { method: "DELETE" });
    setDeletingId(null);
    await loadCustom();
  }

  const isLekledare = me.is("lekledare");

  return (
    <div className="page-bg" style={{ paddingBottom: "48px" }}>
      <div style={{ padding: "32px 20px 20px" }}>
        <div style={{ maxWidth: "480px", margin: "0 auto" }}>
          <p className="page-subtitle">{allVisor.length} visor</p>
          <h1 className="page-title">Snapsvisor</h1>
          <div className="gold-rule" />
          <div style={{ display: "flex", gap: "8px", marginTop: "4px" }}>
            <button onClick={random} className="btn-gold" style={{ width: "auto", padding: "10px 24px" }}>
              Slumpa en visa
            </button>
            {me.id && (
              <button
                onClick={() => setShowForm((s) => !s)}
                style={{
                  padding: "10px 18px", borderRadius: "10px", fontSize: "14px", fontWeight: 600,
                  border: showForm ? "1px solid var(--gold)" : "1px solid var(--border)",
                  background: showForm ? "rgba(200,168,75,0.1)" : "transparent",
                  color: showForm ? "var(--gold)" : "var(--text-muted)", cursor: "pointer",
                }}
              >
                + Lägg till
              </button>
            )}
          </div>

          {/* Add visa form */}
          {showForm && (
            <form onSubmit={submitVisa} style={{ marginTop: "16px", display: "flex", flexDirection: "column", gap: "10px" }}
              className="card px-4 py-4">
              <p style={{ fontWeight: 600, fontSize: "14px", color: "var(--text-dark)", margin: 0 }}>Ny snapsvisa</p>
              <input
                required placeholder="Titel" value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border text-sm outline-none"
                style={{ borderColor: "var(--border)", background: "var(--birch)", color: "var(--text-dark)" }}
              />
              <input
                placeholder="Melodi (valfritt)" value={newMelody}
                onChange={(e) => setNewMelody(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border text-sm outline-none"
                style={{ borderColor: "var(--border)", background: "var(--birch)", color: "var(--text-dark)" }}
              />
              <textarea
                required placeholder="Text" value={newLyrics}
                onChange={(e) => setNewLyrics(e.target.value)} rows={5}
                className="w-full px-3 py-2 rounded-lg border text-sm outline-none resize-none"
                style={{ borderColor: "var(--border)", background: "var(--birch)", color: "var(--text-dark)", lineHeight: 1.7 }}
              />
              <div style={{ display: "flex", gap: "8px" }}>
                <button type="submit" disabled={submitting || !newTitle.trim() || !newLyrics.trim()} className="btn-gold text-sm py-2" style={{ flex: 1 }}>
                  {submitting ? "Sparar..." : "Lägg till"}
                </button>
                <button type="button" onClick={() => setShowForm(false)}
                  style={{ padding: "8px 14px", borderRadius: "10px", border: "1px solid var(--border)", background: "transparent", color: "var(--text-muted)", fontSize: "13px", cursor: "pointer" }}>
                  Avbryt
                </button>
              </div>
            </form>
          )}
        </div>
      </div>

      <div style={{ maxWidth: "480px", margin: "0 auto", padding: "0 20px" }}>
        {/* Tag filter */}
        <div style={{ display: "flex", gap: "8px", overflowX: "auto", paddingBottom: "12px", marginBottom: "4px" }}>
          {allTags.map((tag) => (
            <button
              key={tag}
              onClick={() => setActiveTag(tag)}
              className={`tag${activeTag === tag ? " tag-active" : ""}`}
              style={{ flexShrink: 0, border: "none", cursor: "pointer", padding: "5px 12px" }}
            >
              {tag}
            </button>
          ))}
        </div>

        <input
          type="search"
          placeholder="Sök visa, melodi eller text..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="w-full px-3 py-2 rounded-lg border text-sm outline-none"
          style={{
            borderColor: "var(--border)", background: "var(--birch)",
            color: "var(--text-dark)", marginBottom: "8px",
          }}
        />

        <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginTop: "8px" }}>
          {filtered.map((visa) => {
            const canDelete = visa.isCustom && (visa.created_by === me.id || isLekledare);
            return (
              <div key={visa.id} id={visa.id} className="card-snap">
                <button
                  onClick={() => setOpen(open === visa.id ? null : visa.id)}
                  style={{ width: "100%", background: "none", border: "none", cursor: "pointer", padding: 0, textAlign: "left" }}
                >
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "12px" }}>
                    <div style={{ flex: 1 }}>
                      <p style={{
                        fontFamily: "var(--font-playfair), 'Playfair Display', Georgia, serif",
                        fontSize: "17px", color: "var(--blue-deep)",
                        margin: "0 0 3px", fontWeight: 400,
                      }}>
                        {visa.title}
                      </p>
                      {visa.melody && (
                        <p style={{
                          fontFamily: "var(--font-inter), Inter, system-ui, sans-serif",
                          fontSize: "11px", color: "var(--text-muted)",
                          margin: "0 0 6px", letterSpacing: "0.03em",
                        }}>
                          Mel: {visa.melody}
                        </p>
                      )}
                      <div style={{ display: "flex", gap: "6px", flexWrap: "wrap", alignItems: "center" }}>
                        {visa.tags?.map((t) => (
                          <span key={t} className="tag" style={{ fontSize: "10px", padding: "2px 8px" }}>{t}</span>
                        ))}
                        {visa.isCustom && visa.creator_name && (
                          <span style={{ fontSize: "10px", color: "var(--text-muted)" }}>av {visa.creator_name}</span>
                        )}
                      </div>
                    </div>
                    <ChevronRight
                      size={18}
                      strokeWidth={1.5}
                      style={{
                        color: "var(--blue-mid)", flexShrink: 0,
                        transform: open === visa.id ? "rotate(90deg)" : "rotate(0)",
                        transition: "transform 0.2s",
                      }}
                    />
                  </div>
                </button>

                {open === visa.id && (
                  <div style={{
                    marginTop: "14px", paddingTop: "14px",
                    borderTop: "0.5px solid #ccdde9",
                  }}>
                    <div style={{
                      fontFamily: "var(--font-playfair), 'Playfair Display', Georgia, serif",
                      fontSize: "15px", lineHeight: 1.8,
                      color: "var(--blue-deep)", whiteSpace: "pre-line",
                    }}>
                      {visa.lyrics}
                    </div>
                    {canDelete && (
                      <button
                        onClick={() => deleteVisa(visa.id)}
                        disabled={deletingId === visa.id}
                        style={{
                          marginTop: "12px", display: "flex", alignItems: "center", gap: "5px",
                          background: "none", border: "none", cursor: "pointer",
                          color: "var(--lingon)", fontSize: "12px", padding: 0,
                          opacity: deletingId === visa.id ? 0.5 : 1,
                        }}
                      >
                        <Trash2 size={13} /> Ta bort
                      </button>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
