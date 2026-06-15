import Link from "next/link";
import BottomNav from "@/components/BottomNav";

const TARGET_DATE = new Date("2026-06-26T12:00:00");

function getCountdown() {
  const now = new Date();
  const diff = TARGET_DATE.getTime() - now.getTime();
  if (diff <= 0) return null;
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  return { days, hours };
}

const quickLinks = [
  {
    href: "/snapsvisor",
    emoji: "🥃",
    title: "Snapsvisor",
    desc: "10 klassiska visor",
    color: "#e8f5d9",
    border: "#b8e090",
  },
  {
    href: "/dryckerlekar",
    emoji: "🎲",
    title: "Dryckerlekar",
    desc: "10 lekar för alla",
    color: "#fdf6c8",
    border: "#f0d870",
  },
  {
    href: "/schema",
    emoji: "📅",
    title: "Dagens schema",
    desc: "Vad händer när",
    color: "#fce8f8",
    border: "#e8a0d8",
  },
];

export default function HomePage() {
  const countdown = getCountdown();

  return (
    <main className="min-h-screen pb-24">
      <div
        className="px-6 pt-12 pb-8 text-center"
        style={{ background: "linear-gradient(180deg, #d4edaa 0%, #fefdf6 100%)" }}
      >
        <div className="text-6xl mb-3">🌸</div>
        <h1 className="text-3xl font-bold mb-1" style={{ color: "#1a4a0e" }}>
          Midsommar 2026
        </h1>
        <p className="text-sm" style={{ color: "#5a8a40" }}>
          26 juni · Skål för sommaren!
        </p>

        {countdown ? (
          <div
            className="mt-5 inline-block px-6 py-3 rounded-2xl"
            style={{ background: "#1a4a0e", color: "white" }}
          >
            <span className="text-2xl font-bold">{countdown.days}</span>
            <span className="text-sm ml-1">dagar</span>
            <span className="text-lg mx-2">och</span>
            <span className="text-2xl font-bold">{countdown.hours}</span>
            <span className="text-sm ml-1">timmar kvar</span>
            <div className="text-xs mt-1 opacity-70">tills midsommar!</div>
          </div>
        ) : (
          <div
            className="mt-5 inline-block px-6 py-3 rounded-2xl text-xl font-bold"
            style={{ background: "#f5c842", color: "#1a2e0e" }}
          >
            🎉 Det är midsommar! Skål!
          </div>
        )}
      </div>

      <div className="px-4 space-y-3">
        {quickLinks.map((link) => (
          <Link key={link.href} href={link.href}>
            <div
              className="card flex items-center gap-4 p-4 active:scale-95 transition-transform"
              style={{ background: link.color, borderColor: link.border }}
            >
              <span className="text-4xl">{link.emoji}</span>
              <div>
                <div className="font-bold text-lg" style={{ color: "#1a4a0e" }}>
                  {link.title}
                </div>
                <div className="text-sm" style={{ color: "#5a7a45" }}>
                  {link.desc}
                </div>
              </div>
              <span className="ml-auto text-xl" style={{ color: "#8aad70" }}>
                →
              </span>
            </div>
          </Link>
        ))}
      </div>

      <div
        className="mx-4 mt-4 p-4 rounded-2xl text-center"
        style={{ background: "#fff8e0", border: "1px solid #f0d870" }}
      >
        <div className="text-2xl mb-1">🌻</div>
        <p className="text-sm font-medium" style={{ color: "#7a6010" }}>
          Midsommar är Sveriges mest älskade folkfest
        </p>
        <p className="text-xs mt-1" style={{ color: "#9a8030" }}>
          Plocka 7 sorters blommor och lägg under kudden — du drömmer om din
          framtida kärlek.
        </p>
      </div>

      <BottomNav />
    </main>
  );
}
