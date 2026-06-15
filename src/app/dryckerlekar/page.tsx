"use client";

import { useState } from "react";
import { dryckerlekar, type Dryckerslek } from "@/lib/data/dryckerlekar";
import BottomNav from "@/components/BottomNav";

const difficultyColor = {
  Lätt: { bg: "#d4f7c5", text: "#1a6a0e" },
  Medel: { bg: "#fff3c5", text: "#7a5010" },
  Svår: { bg: "#ffd5d5", text: "#8a1010" },
};

function GameCard({ game }: { game: Dryckerslek }) {
  const [open, setOpen] = useState(false);
  const dc = difficultyColor[game.difficulty];

  return (
    <div
      className="card mb-3"
      style={{ padding: "0" }}
    >
      <button
        onClick={() => setOpen(!open)}
        className="w-full text-left p-4"
      >
        <div className="flex items-start gap-3">
          <span className="text-4xl">{game.emoji}</span>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-bold text-lg" style={{ color: "#1a4a0e" }}>
                {game.title}
              </span>
              <span
                className="text-xs px-2 py-0.5 rounded-full font-medium"
                style={{ background: dc.bg, color: dc.text }}
              >
                {game.difficulty}
              </span>
            </div>
            <p className="text-sm mt-1" style={{ color: "#5a7a45" }}>
              {game.description}
            </p>
            <div className="flex gap-3 mt-2 text-xs" style={{ color: "#8aaa70" }}>
              <span>👥 {game.players}</span>
              <span>⏱ {game.time}</span>
            </div>
          </div>
          <span
            className="text-xl transition-transform shrink-0"
            style={{
              transform: open ? "rotate(90deg)" : "rotate(0)",
              color: "#8aad70",
            }}
          >
            ▶
          </span>
        </div>
      </button>

      {open && (
        <div
          className="px-4 pb-4"
          style={{ borderTop: "1px solid #e8f5d9" }}
        >
          {game.needs.length > 0 && (
            <div className="pt-3 mb-3">
              <div className="text-xs font-semibold mb-1" style={{ color: "#5a7a45" }}>
                BEHÖVS:
              </div>
              <div className="flex gap-2 flex-wrap">
                {game.needs.map((n) => (
                  <span
                    key={n}
                    className="text-xs px-2 py-1 rounded-lg"
                    style={{ background: "#e8f5d9", color: "#2d6a1f" }}
                  >
                    {n}
                  </span>
                ))}
              </div>
            </div>
          )}

          <div className="text-xs font-semibold mb-2" style={{ color: "#5a7a45" }}>
            REGLER:
          </div>
          <ol className="space-y-2">
            {game.rules.map((rule, i) => (
              <li key={i} className="flex gap-2 text-sm" style={{ color: "#2a4a1a" }}>
                <span
                  className="shrink-0 w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold"
                  style={{ background: "#2d6a1f", color: "white" }}
                >
                  {i + 1}
                </span>
                <span>{rule}</span>
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
    <main className="min-h-screen pb-28">
      <div
        className="px-6 pt-10 pb-6"
        style={{ background: "linear-gradient(180deg, #fde98a 0%, #fefdf6 100%)" }}
      >
        <h1 className="text-2xl font-bold" style={{ color: "#1a4a0e" }}>
          🎲 Dryckerlekar
        </h1>
        <p className="text-sm mt-1" style={{ color: "#5a8a40" }}>
          {dryckerlekar.length} lekar — tryck för att se regler
        </p>
      </div>

      <div className="flex gap-2 px-4 py-3 overflow-x-auto">
        {(["alla", "Lätt", "Medel", "Svår"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className="shrink-0 px-3 py-1 rounded-full text-sm font-medium transition-all"
            style={{
              background: filter === f ? "#2d6a1f" : "#e8f5d9",
              color: filter === f ? "white" : "#2d6a1f",
              border: `1px solid ${filter === f ? "#2d6a1f" : "#b8e090"}`,
            }}
          >
            {f}
          </button>
        ))}
      </div>

      <div className="px-4">
        {filtered.map((game) => (
          <GameCard key={game.id} game={game} />
        ))}
      </div>

      <BottomNav />
    </main>
  );
}
