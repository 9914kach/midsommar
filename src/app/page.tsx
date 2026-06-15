import Link from "next/link";
import { NavDrawer } from "@/components/NavDrawer";

const TARGET = new Date("2026-06-26T12:00:00");

function getCountdown() {
  const diff = TARGET.getTime() - Date.now();
  if (diff <= 0) return null;
  return {
    days: Math.floor(diff / 86400000),
    hours: Math.floor((diff % 86400000) / 3600000),
  };
}

const sections = [
  { href: "/snapsvisor", emoji: "🥃", label: "Snapsvisor", desc: "10 klassiska visor" },
  { href: "/dryckerlekar", emoji: "🎲", label: "Dryckerlekar", desc: "10 lekar med regler" },
  { href: "/schema", emoji: "📅", label: "Schema", desc: "Dagens tidplan" },
  { href: "/turnering", emoji: "🏆", label: "Turnering", desc: "Live-poäng och bracket" },
  { href: "/leaderboard", emoji: "🥇", label: "Leaderboard", desc: "Officiell poängtabell" },
];

export default function HomePage() {
  const cd = getCountdown();

  return (
    <NavDrawer>
      <main className="page-bg px-4 pt-14 pb-10 max-w-md mx-auto">
        <div className="pt-8 pb-6 text-center">
          <p className="page-subtitle mb-3">26 Juni 2026</p>
          <h1 className="page-title text-4xl">Midsommar</h1>
          <div className="gold-rule mx-auto" />

          {cd ? (
            <div
              className="inline-flex items-center gap-3 mt-4 px-5 py-3 rounded-xl"
              style={{ background: "var(--blue-deep)", color: "var(--birch)" }}
            >
              <div className="text-center">
                <div className="text-2xl font-bold">{cd.days}</div>
                <div className="text-xs opacity-70">dagar</div>
              </div>
              <div style={{ color: "var(--gold)" }}>·</div>
              <div className="text-center">
                <div className="text-2xl font-bold">{cd.hours}</div>
                <div className="text-xs opacity-70">timmar</div>
              </div>
            </div>
          ) : (
            <div
              className="inline-block mt-4 px-5 py-3 rounded-xl font-bold"
              style={{ background: "var(--gold)", color: "#3A2C00" }}
            >
              🎉 Det är midsommar! Skål!
            </div>
          )}
        </div>

        <div className="space-y-2">
          {sections.map((s) => (
            <Link key={s.href} href={s.href}>
              <div className="card flex items-center gap-4 px-4 py-3 active:opacity-70 transition-opacity">
                <span className="text-3xl w-10 text-center">{s.emoji}</span>
                <div>
                  <div className="font-semibold text-base" style={{ color: "var(--text-dark)" }}>
                    {s.label}
                  </div>
                  <div className="text-xs" style={{ color: "var(--text-muted)" }}>
                    {s.desc}
                  </div>
                </div>
                <span className="ml-auto text-sm" style={{ color: "var(--blue-mid)" }}>›</span>
              </div>
            </Link>
          ))}
        </div>

        <p className="text-center text-xs mt-8" style={{ color: "var(--text-muted)" }}>
          Plocka 7 sorters blommor — lägg under kudden 🌸
        </p>
      </main>
    </NavDrawer>
  );
}
