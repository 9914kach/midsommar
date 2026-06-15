import { supabase } from "@/lib/supabase";
import BottomNav from "@/components/BottomNav";
import Link from "next/link";

const statusColors: Record<string, string> = {
  draft: "#888",
  active: "#c45000",
  completed: "#2d6a1f",
};

const statusLabels: Record<string, string> = {
  draft: "Utkast",
  active: "Pågår",
  completed: "Avslutad",
};

const formatLabels: Record<string, string> = {
  bracket: "Bracket",
  round_robin: "Round Robin",
  free: "Fri",
};

export default async function TurneringPage() {
  const { data: tournaments } = await supabase
    .from("tournaments")
    .select("*")
    .order("created_at", { ascending: false });

  return (
    <main className="min-h-screen pb-28 midsommar-bg">
      <div className="max-w-lg mx-auto p-4">
        <div className="rounded-2xl p-4 mb-6" style={{ background: "#2d6a1f" }}>
          <h1 className="text-2xl font-bold text-white">Turneringar</h1>
          <p className="text-green-200 text-sm">Midsommar 2026</p>
        </div>

        {(!tournaments || tournaments.length === 0) ? (
          <div className="card p-8 text-center text-gray-400">
            Inga turneringar än
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {tournaments.map((t) => (
              <Link key={t.id} href={`/turnering/${t.id}`}>
                <div className="card p-4 border-2 active:scale-95 transition-transform" style={{ borderColor: "#c5e8a0" }}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-bold text-gray-800 text-lg">🏆 {t.name}</span>
                    <span
                      className="text-xs px-2 py-0.5 rounded-full text-white font-medium"
                      style={{ background: statusColors[t.status] ?? "#888" }}
                    >
                      {statusLabels[t.status] ?? t.status}
                    </span>
                  </div>
                  <div className="flex gap-2 text-sm text-gray-500">
                    <span>{t.game}</span>
                    <span>·</span>
                    <span
                      className="px-2 py-0.5 rounded-full text-xs font-medium"
                      style={{ background: "#e8f5d9", color: "#2d6a1f" }}
                    >
                      {formatLabels[t.format] ?? t.format}
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
      <BottomNav />
    </main>
  );
}
