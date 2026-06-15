"use client";

import { useState } from "react";
import { snapsvisor } from "@/lib/data/snapsvisor";
import BottomNav from "@/components/BottomNav";

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
    <main className="min-h-screen pb-28">
      <div
        className="px-6 pt-10 pb-6"
        style={{ background: "linear-gradient(180deg, #d4edaa 0%, #fefdf6 100%)" }}
      >
        <h1 className="text-2xl font-bold" style={{ color: "#1a4a0e" }}>
          🥃 Snapsvisor
        </h1>
        <p className="text-sm mt-1" style={{ color: "#5a8a40" }}>
          {snapsvisor.length} visor — tryck för att se text
        </p>
        <button
          onClick={random}
          className="btn-secondary mt-4 w-full"
        >
          🎲 Slumpa en visa!
        </button>
      </div>

      {/* Tag filter */}
      <div className="flex gap-2 px-4 py-3 overflow-x-auto">
        {allTags.map((tag) => (
          <button
            key={tag}
            onClick={() => setActiveTag(tag)}
            className="shrink-0 px-3 py-1 rounded-full text-sm font-medium transition-all"
            style={{
              background: activeTag === tag ? "#2d6a1f" : "#e8f5d9",
              color: activeTag === tag ? "white" : "#2d6a1f",
              border: `1px solid ${activeTag === tag ? "#2d6a1f" : "#b8e090"}`,
            }}
          >
            {tag}
          </button>
        ))}
      </div>

      {/* Visor */}
      <div className="px-4 space-y-3">
        {filtered.map((visa) => (
          <div key={visa.id} id={visa.id} className="snap-card">
            <button
              onClick={() => setOpen(open === visa.id ? null : visa.id)}
              className="w-full text-left"
            >
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-bold text-lg" style={{ color: "#1a4a0e" }}>
                    {visa.title}
                  </div>
                  {visa.melody && (
                    <div className="text-xs mt-0.5" style={{ color: "#7aaa50" }}>
                      🎵 Mel: {visa.melody}
                    </div>
                  )}
                  {visa.tags && (
                    <div className="flex gap-1 mt-1 flex-wrap">
                      {visa.tags.map((t) => (
                        <span
                          key={t}
                          className="text-xs px-2 py-0.5 rounded-full"
                          style={{ background: "#c5e8a0", color: "#2d6a1f" }}
                        >
                          {t}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
                <span
                  className="text-2xl transition-transform"
                  style={{ transform: open === visa.id ? "rotate(90deg)" : "rotate(0)" }}
                >
                  ▶
                </span>
              </div>
            </button>

            {open === visa.id && (
              <div
                className="mt-4 pt-4 whitespace-pre-line text-base leading-relaxed"
                style={{
                  borderTop: "1px solid #c5e8a0",
                  color: "#2a4a1a",
                  fontFamily: "Georgia, serif",
                  fontSize: "1.05rem",
                }}
              >
                {visa.lyrics}
              </div>
            )}
          </div>
        ))}
      </div>

      <BottomNav />
    </main>
  );
}
