import { schema } from "@/lib/data/schema";
import BottomNav from "@/components/BottomNav";

const typeColors = {
  mat: { bg: "#fff0d5", border: "#f0c060", emoji: "🍽" },
  aktivitet: { bg: "#e8f5d9", border: "#b8e090", emoji: "🌿" },
  dricka: { bg: "#fce8ff", border: "#d8a0e8", emoji: "🥂" },
  vila: { bg: "#fff8e0", border: "#f0d870", emoji: "☀️" },
  natt: { bg: "#e8eeff", border: "#a0b0e8", emoji: "🌙" },
};

export default function SchemaPage() {
  return (
    <main className="min-h-screen pb-28">
      <div
        className="px-6 pt-10 pb-6"
        style={{ background: "linear-gradient(180deg, #fce8ff 0%, #fefdf6 100%)" }}
      >
        <h1 className="text-2xl font-bold" style={{ color: "#1a4a0e" }}>
          📅 Midsommarschema
        </h1>
        <p className="text-sm mt-1" style={{ color: "#5a8a40" }}>
          26 juni 2026 · Vad händer när
        </p>
      </div>

      <div className="px-4 pt-4">
        {schema.map((item, index) => {
          const tc = typeColors[item.type];
          return (
            <div key={item.id} className="timeline-item">
              <div className="shrink-0 flex flex-col items-center">
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center text-xl shadow-sm"
                  style={{ background: tc.bg, border: `2px solid ${tc.border}` }}
                >
                  {item.emoji}
                </div>
                {index < schema.length - 1 && (
                  <div
                    className="w-0.5 flex-1 mt-1"
                    style={{ background: "#c5e8a0", minHeight: "24px" }}
                  />
                )}
              </div>

              <div
                className="flex-1 rounded-2xl p-3 mb-3"
                style={{ background: tc.bg, border: `1px solid ${tc.border}` }}
              >
                <div className="flex items-baseline gap-2">
                  <span
                    className="text-sm font-bold"
                    style={{ color: "#5a7a45", fontVariantNumeric: "tabular-nums" }}
                  >
                    {item.time}
                  </span>
                  <span className="font-bold text-base" style={{ color: "#1a4a0e" }}>
                    {item.title}
                  </span>
                </div>
                {item.description && (
                  <p className="text-sm mt-1" style={{ color: "#5a7a45" }}>
                    {item.description}
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <BottomNav />
    </main>
  );
}
