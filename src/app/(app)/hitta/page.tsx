"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useUser } from "@/lib/useUser";

type Info = { address: string; description: string; map_url: string };
const EMPTY: Info = { address: "", description: "", map_url: "" };

export default function HittaPage() {
  const me = useUser();
  const [info, setInfo] = useState<Info>(EMPTY);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState<Info>(EMPTY);
  const [saving, setSaving] = useState(false);

  async function load() {
    const { data } = await supabase.from("site_info").select("key, value").in("key", ["hitta_address", "hitta_description", "hitta_map_url"]);
    const map: Record<string, string> = {};
    for (const row of (data ?? [])) map[row.key] = row.value ?? "";
    setInfo({ address: map.hitta_address ?? "", description: map.hitta_description ?? "", map_url: map.hitta_map_url ?? "" });
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  async function save() {
    setSaving(true);
    await Promise.all([
      supabase.from("site_info").upsert({ key: "hitta_address", value: draft.address }),
      supabase.from("site_info").upsert({ key: "hitta_description", value: draft.description }),
      supabase.from("site_info").upsert({ key: "hitta_map_url", value: draft.map_url }),
    ]);
    setSaving(false);
    setEditing(false);
    await load();
  }

  const isVard = me.is("värd");
  const isEmpty = !info.address && !info.description && !info.map_url;

  return (
    <div className="page-bg px-4 pt-6 pb-10 max-w-md mx-auto">
      <div className="flex items-baseline justify-between mb-1">
        <h1 className="page-title">Hitta dit</h1>
        {isVard && !editing && (
          <button onClick={() => { setEditing(true); setDraft(info); }} className="text-sm font-medium" style={{ color: "var(--gold)" }}>
            Redigera
          </button>
        )}
      </div>
      <div className="gold-rule" />

      {loading ? (
        <p className="text-center mt-10" style={{ color: "var(--text-muted)" }}>Laddar...</p>
      ) : editing ? (
        <div className="card p-4 space-y-3">
          <p className="text-xs font-semibold uppercase" style={{ color: "var(--text-muted)", letterSpacing: "0.08em" }}>Redigera</p>
          <div>
            <p className="text-xs mb-1" style={{ color: "var(--text-muted)" }}>Adress</p>
            <input value={draft.address} onChange={(e) => setDraft((d) => ({ ...d, address: e.target.value }))}
              placeholder="Storgatan 1, 123 45 Ort"
              className="w-full px-3 py-2 rounded-lg border text-sm outline-none"
              style={{ borderColor: "var(--border)", background: "var(--birch)" }} />
          </div>
          <div>
            <p className="text-xs mb-1" style={{ color: "var(--text-muted)" }}>Vägbeskrivning / info</p>
            <textarea value={draft.description} onChange={(e) => setDraft((d) => ({ ...d, description: e.target.value }))}
              placeholder="Kör in på gårdsvägen, parkera vid ladan..."
              rows={4} className="w-full px-3 py-2 rounded-lg border text-sm outline-none resize-none"
              style={{ borderColor: "var(--border)", background: "var(--birch)" }} />
          </div>
          <div>
            <p className="text-xs mb-1" style={{ color: "var(--text-muted)" }}>Kartlänk (Google Maps / Hitta.se)</p>
            <input value={draft.map_url} onChange={(e) => setDraft((d) => ({ ...d, map_url: e.target.value }))}
              placeholder="https://maps.google.com/..."
              className="w-full px-3 py-2 rounded-lg border text-sm outline-none"
              style={{ borderColor: "var(--border)", background: "var(--birch)" }} />
          </div>
          <div className="flex gap-2">
            <button onClick={save} disabled={saving} className="btn-primary flex-1">
              {saving ? "Sparar..." : "Spara"}
            </button>
            <button onClick={() => setEditing(false)} className="btn-outline flex-1">Avbryt</button>
          </div>
        </div>
      ) : isEmpty ? (
        <div className="card p-8 text-center" style={{ color: "var(--text-muted)" }}>
          {isVard ? "Tryck 'Redigera' för att lägga till info" : "Ingen info ännu"}
        </div>
      ) : (
        <div className="space-y-4">
          {info.address && (
            <div className="card p-4">
              <p className="text-xs font-semibold uppercase mb-2" style={{ color: "var(--text-muted)", letterSpacing: "0.08em" }}>Adress</p>
              <p className="font-semibold" style={{ color: "var(--text-dark)" }}>{info.address}</p>
            </div>
          )}
          {info.description && (
            <div className="card p-4">
              <p className="text-xs font-semibold uppercase mb-2" style={{ color: "var(--text-muted)", letterSpacing: "0.08em" }}>Vägbeskrivning</p>
              <p className="text-sm whitespace-pre-wrap" style={{ color: "var(--text-dark)" }}>{info.description}</p>
            </div>
          )}
          {info.address && (
            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase" style={{ color: "var(--text-muted)", letterSpacing: "0.08em" }}>Navigation</p>
              <div className="flex gap-2">
                <a
                  href={`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(info.address)}`}
                  target="_blank" rel="noopener noreferrer"
                  className="flex-1 card px-3 py-3 flex items-center gap-2 active:opacity-70 transition-opacity"
                  style={{ textDecoration: "none" }}
                >
                  <span style={{ fontSize: "18px", lineHeight: 1 }}>🗺️</span>
                  <div>
                    <p className="text-xs font-semibold" style={{ color: "var(--text-dark)" }}>Google Maps</p>
                    <p className="text-[10px]" style={{ color: "var(--text-muted)" }}>Navigera</p>
                  </div>
                </a>
                <a
                  href={`https://maps.apple.com/?daddr=${encodeURIComponent(info.address)}&dirflg=d`}
                  target="_blank" rel="noopener noreferrer"
                  className="flex-1 card px-3 py-3 flex items-center gap-2 active:opacity-70 transition-opacity"
                  style={{ textDecoration: "none" }}
                >
                  <span style={{ fontSize: "18px", lineHeight: 1 }}>🍎</span>
                  <div>
                    <p className="text-xs font-semibold" style={{ color: "var(--text-dark)" }}>Apple Maps</p>
                    <p className="text-[10px]" style={{ color: "var(--text-muted)" }}>Navigera</p>
                  </div>
                </a>
              </div>
            </div>
          )}
          {info.address && (
            <div className="rounded-xl overflow-hidden" style={{ height: "220px", border: "0.5px solid var(--border)" }}>
              <iframe
                title="Karta"
                width="100%"
                height="100%"
                style={{ border: 0, display: "block" }}
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                src={`https://maps.google.com/maps?q=${encodeURIComponent(info.address)}&output=embed&hl=sv&z=14`}
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
