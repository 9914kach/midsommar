"use client";

import { useState } from "react";
import { dryckerlekar, type Dryckerslek } from "@/lib/data/dryckerlekar";
import { ChevronRight } from "lucide-react";

const difficultyStyle: Record<string, { bg: string; color: string }> = {
  Lätt:  { bg: "rgba(61,107,58,0.10)", color: "#3D6B3A" },
  Medel: { bg: "rgba(200,168,75,0.15)", color: "#7a5f00" },
  Svår:  { bg: "rgba(139,38,53,0.10)", color: "#8B2635" },
};

function GameCard({ game }: { game: Dryckerslek }) {
  const [open, setOpen] = useState(false);
  const ds = difficultyStyle[game.difficulty];

  return (
    <div className="card" style={{ overflow: "hidden", marginBottom: "10px" }}>
      <button
        onClick={() => setOpen(!open)}
        style={{ width: "100%", background: "none", border: "none", cursor: "pointer", padding: "16px", textAlign: "left" }}
      >
        <div style={{ display: "flex", alignItems: "flex-start", gap: "14px" }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap", marginBottom: "4px" }}>
              <p style={{
                fontFamily: "var(--font-playfair), 'Playfair Display', Georgia, serif",
                fontSize: "17px", color: "var(--blue-deep)", margin: 0, fontWeight: 400,
              }}>
                {game.title}
              </p>
              <span style={{
                fontFamily: "var(--font-inter), Inter, system-ui, sans-serif",
                fontSize: "10px", padding: "2px 8px", borderRadius: "20px",
                fontWeight: 500, background: ds.bg, color: ds.color,
              }}>
                {game.difficulty}
              </span>
            </div>
            <p style={{
              fontFamily: "var(--font-inter), Inter, system-ui, sans-serif",
              fontSize: "12px", color: "var(--text-muted)", margin: "0 0 6px", lineHeight: 1.5,
            }}>
              {game.description}
            </p>
            <div style={{ display: "flex", gap: "16px" }}>
              <span style={{ fontSize: "11px", color: "var(--blue-mid)", fontFamily: "var(--font-inter), Inter, system-ui, sans-serif" }}>
                {game.players} spelare
              </span>
              <span style={{ fontSize: "11px", color: "var(--blue-mid)", fontFamily: "var(--font-inter), Inter, system-ui, sans-serif" }}>
                {game.time}
              </span>
            </div>
          </div>
          <ChevronRight
            size={18}
            strokeWidth={1.5}
            style={{
              color: "var(--blue-mid)", flexShrink: 0, marginTop: "2px",
              transform: open ? "rotate(90deg)" : "rotate(0)",
              transition: "transform 0.2s",
            }}
          />
        </div>
      </button>

      {open && (
        <div style={{ padding: "0 16px 16px", borderTop: "0.5px solid var(--border)" }}>
          {game.needs.length > 0 && (
            <div style={{ paddingTop: "12px", marginBottom: "12px" }}>
              <p style={{
                fontFamily: "var(--font-inter), Inter, system-ui, sans-serif",
                fontSize: "10px", letterSpacing: "0.1em", textTransform: "uppercase",
                color: "var(--text-muted)", margin: "0 0 6px",
              }}>
                Behövs
              </p>
              <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
                {game.needs.map((n) => (
                  <span key={n} className="tag" style={{ fontSize: "11px" }}>{n}</span>
                ))}
              </div>
            </div>
          )}

          <p style={{
            fontFamily: "var(--font-inter), Inter, system-ui, sans-serif",
            fontSize: "10px", letterSpacing: "0.1em", textTransform: "uppercase",
            color: "var(--text-muted)", margin: "0 0 10px",
          }}>
            Regler
          </p>
          <ol style={{ margin: 0, padding: 0, listStyle: "none", display: "flex", flexDirection: "column", gap: "8px" }}>
            {game.rules.map((rule, i) => (
              <li key={i} style={{ display: "flex", gap: "10px", alignItems: "flex-start" }}>
                <span style={{
                  flexShrink: 0, width: "20px", height: "20px", borderRadius: "50%",
                  background: "var(--blue-deep)", color: "#FAFAF7",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontFamily: "var(--font-inter), Inter, system-ui, sans-serif",
                  fontSize: "10px", fontWeight: 500, marginTop: "1px",
                }}>
                  {i + 1}
                </span>
                <span style={{
                  fontFamily: "var(--font-inter), Inter, system-ui, sans-serif",
                  fontSize: "13px", color: "var(--blue-deep)", lineHeight: 1.6,
                }}>
                  {rule}
                </span>
              </li>
            ))}
          </ol>
        </div>
      )}
    </div>
  );
}

export default function DryckerlekarPage() {
  const [filter, setFilter] = useState<"alla" | "Lätt" | "Medel" | "Svår">("alla");

  const filtered =
    filter === "alla"
      ? dryckerlekar
      : dryckerlekar.filter((g) => g.difficulty === filter);

  return (
    <div className="page-bg" style={{ paddingBottom: "48px" }}>
      <div style={{ padding: "32px 20px 20px" }}>
        <div style={{ maxWidth: "480px", margin: "0 auto" }}>
          <p className="page-subtitle">{dryckerlekar.length} lekar</p>
          <h1 className="page-title">Dryckerlekar</h1>
          <div className="gold-rule" />
        </div>
      </div>

      <div style={{ maxWidth: "480px", margin: "0 auto", padding: "0 20px" }}>
        <div style={{ display: "flex", gap: "8px", marginBottom: "16px" }}>
          {(["alla", "Lätt", "Medel", "Svår"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`tag${filter === f ? " tag-active" : ""}`}
              style={{ border: "none", cursor: "pointer", padding: "5px 12px" }}
            >
              {f}
            </button>
          ))}
        </div>

        {filtered.map((game) => (
          <GameCard key={game.id} game={game} />
        ))}
      </div>
    </div>
  );
}
