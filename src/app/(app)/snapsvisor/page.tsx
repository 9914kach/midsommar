"use client";

import { useState } from "react";
import { snapsvisor } from "@/lib/data/snapsvisor";
import { ChevronRight } from "lucide-react";

export default function SnapsvisorPage() {
  const [open, setOpen] = useState<string | null>(null);
  const [activeTag, setActiveTag] = useState<string>("alla");

  const allTags = ["alla", ...Array.from(new Set(snapsvisor.flatMap((v) => v.tags ?? [])))];
  const filtered =
    activeTag === "alla"
      ? snapsvisor
      : snapsvisor.filter((v) => v.tags?.includes(activeTag));

  const random = () => {
    const r = snapsvisor[Math.floor(Math.random() * snapsvisor.length)];
    setOpen(r.id);
    setTimeout(() => {
      document.getElementById(r.id)?.scrollIntoView({ behavior: "smooth", block: "center" });
    }, 100);
  };

  return (
    <div className="page-bg" style={{ paddingBottom: "48px" }}>
      <div style={{ padding: "32px 20px 20px" }}>
        <div style={{ maxWidth: "480px", margin: "0 auto" }}>
          <p className="page-subtitle">{snapsvisor.length} visor</p>
          <h1 className="page-title">Snapsvisor</h1>
          <div className="gold-rule" />
          <button onClick={random} className="btn-gold" style={{ width: "auto", padding: "10px 24px" }}>
            Slumpa en visa
          </button>
        </div>
      </div>

      <div style={{ maxWidth: "480px", margin: "0 auto", padding: "0 20px" }}>
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

        <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginTop: "8px" }}>
          {filtered.map((visa) => (
            <div key={visa.id} id={visa.id} className="card-snap">
              <button
                onClick={() => setOpen(open === visa.id ? null : visa.id)}
                style={{ width: "100%", background: "none", border: "none", cursor: "pointer", padding: 0, textAlign: "left" }}
              >
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "12px" }}>
                  <div>
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
                    {visa.tags && (
                      <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
                        {visa.tags.map((t) => (
                          <span key={t} className="tag" style={{ fontSize: "10px", padding: "2px 8px" }}>{t}</span>
                        ))}
                      </div>
                    )}
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
                  fontFamily: "var(--font-playfair), 'Playfair Display', Georgia, serif",
                  fontSize: "15px", lineHeight: 1.8,
                  color: "var(--blue-deep)", whiteSpace: "pre-line",
                }}>
                  {visa.lyrics}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
