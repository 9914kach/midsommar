"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { NavDrawer } from "@/components/NavDrawer";
import { useUser } from "@/lib/useUser";

const TARGET = new Date("2026-06-19T12:00:00");

function getCountdown() {
  const diff = TARGET.getTime() - Date.now();
  if (diff <= 0) return null;
  return {
    days: Math.floor(diff / 86400000),
    hours: Math.floor((diff % 86400000) / 3600000),
  };
}

function fmtClock(d: Date) {
  const h = d.getHours().toString().padStart(2, "0");
  const m = d.getMinutes().toString().padStart(2, "0");
  return `${h}:${m}`;
}

export default function HomePage() {
  const me = useUser();
  const [now, setNow] = useState<Date | null>(null);
  const [snaps, setSnaps] = useState(47);

  useEffect(() => {
    setNow(new Date());
    const t = setInterval(() => setNow(new Date()), 30_000);
    return () => clearInterval(t);
  }, []);

  const cd = now ? getCountdown() : null;
  const name = me.username || "din jävel";
  const partyMode = !cd;

  return (
    <NavDrawer>
      <main className="page-bg px-4 pt-6 pb-12 max-w-md mx-auto">
        <div className="relative pt-2 pb-4 text-center">
          <Stang />
          <p className="page-subtitle mt-3 mb-2">
            {partyMode ? "Idag är dagen" : "Nedräkning pågår"}
          </p>
          <h1
            className="page-title"
            style={{ fontSize: "34px", lineHeight: 1.1 }}
          >
            Fan vad kul att du<br />kom, {name}!
          </h1>
          <div className="gold-rule mx-auto" />
        </div>

        <p
          className="text-[15px] leading-relaxed text-center px-1 mb-6"
          style={{ color: "var(--text-dark)" }}
        >
          Välkommen till <strong>Midsommar 2026</strong>. Nu kör vi så det
          osar körsbär och spya. Idag ska vi dricka oss förståndiga, sjunga
          visor tills grannarna hatar oss och dansa tills någon får en stake
          i röven.
        </p>

        {cd ? (
          <div
            className="flex items-center justify-center gap-4 mb-6 px-5 py-3 rounded-xl mx-auto w-fit"
            style={{ background: "var(--blue-deep)", color: "var(--birch)" }}
          >
            <div className="text-center">
              <div className="text-2xl font-bold">{cd.days}</div>
              <div className="text-[10px] opacity-70 uppercase tracking-wider">dagar</div>
            </div>
            <div style={{ color: "var(--gold)" }}>·</div>
            <div className="text-center">
              <div className="text-2xl font-bold">{cd.hours}</div>
              <div className="text-[10px] opacity-70 uppercase tracking-wider">timmar</div>
            </div>
            <div style={{ color: "var(--gold)" }}>·</div>
            <div className="text-center text-xs leading-tight">
              tills<br />supen
            </div>
          </div>
        ) : (
          <div
            className="text-center mb-6 px-5 py-3 rounded-xl font-bold mx-auto w-fit"
            style={{ background: "var(--gold)", color: "#3A2C00" }}
          >
            🎉 Det är midsommar! Skål, fan!
          </div>
        )}

        <div className="space-y-3">
          <GoldCTA href="/snapsvisor" label="Ge mig snapsvisor NU, fan" />
          <GoldCTA href="/dryckerlekar" label="Starta en jävla lek" />
          <GoldCTA href="/leaderboard" label="Vem leder i fyllan? Leaderboard" />
        </div>

        <div
          className="mt-7 px-4 py-3 rounded-xl text-center"
          style={{
            background: "rgba(27,63,110,0.06)",
            border: "0.5px dashed rgba(27,63,110,0.25)",
          }}
        >
          <div
            className="text-[10px] uppercase tracking-widest mb-1"
            style={{ color: "var(--text-muted)" }}
          >
            Antal snapsar serverade
          </div>
          <div
            className="text-3xl font-bold"
            style={{
              color: "var(--blue-deep)",
              fontFamily: "var(--font-playfair), 'Playfair Display', Georgia, serif",
              fontStyle: "italic",
            }}
          >
            {snaps}
          </div>
          <div className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>
            och klockan är bara <strong>{now ? fmtClock(now) : "--:--"}</strong>
          </div>
          <button
            onClick={() => setSnaps((s) => s + 1)}
            className="mt-2 text-xs underline"
            style={{ color: "var(--gold)" }}
          >
            +1 snaps
          </button>
        </div>

        <div className="flex items-center justify-center gap-3 mt-6 text-xs" style={{ color: "var(--text-muted)" }}>
          <Link href="/schema" className="underline">Schema</Link>
          <span>·</span>
          <Link href="/turnering" className="underline">Turnering</Link>
          <span>·</span>
          <Link href="/minnen" className="underline">Minnen</Link>
        </div>

        <p className="text-center text-[11px] mt-6" style={{ color: "var(--text-muted)" }}>
          Plocka 7 sorters blommor — lägg under kudden 🌸
        </p>
      </main>
    </NavDrawer>
  );
}

function GoldCTA({ href, label }: { href: string; label: string }) {
  return (
    <Link
      href={href}
      className="block text-center font-semibold"
      style={{
        background: "linear-gradient(135deg, #d6b85a 0%, #C8A84B 50%, #a88a36 100%)",
        color: "#2A1F00",
        borderRadius: "14px",
        padding: "16px 18px",
        fontSize: "16px",
        boxShadow:
          "0 0 0 1px rgba(200,168,75,0.6), 0 4px 14px rgba(200,168,75,0.45), 0 10px 28px rgba(200,168,75,0.25)",
        textDecoration: "none",
        letterSpacing: "0.01em",
      }}
    >
      {label}
    </Link>
  );
}

function Stang() {
  return (
    <svg
      viewBox="0 0 200 160"
      width="160"
      height="128"
      className="mx-auto"
      aria-hidden
    >
      <defs>
        <linearGradient id="pole" x1="0" x2="1" y1="0" y2="0">
          <stop offset="0%" stopColor="#8B5A2B" />
          <stop offset="50%" stopColor="#A87042" />
          <stop offset="100%" stopColor="#6B4220" />
        </linearGradient>
        <radialGradient id="krans" cx="0.5" cy="0.5" r="0.5">
          <stop offset="0%" stopColor="#5C8C3C" />
          <stop offset="100%" stopColor="#3D6B3A" />
        </radialGradient>
      </defs>
      <rect x="96" y="30" width="8" height="120" fill="url(#pole)" rx="2" />
      <rect x="50" y="58" width="100" height="6" fill="url(#pole)" rx="2" transform="rotate(-3 100 61)" />
      <g transform="translate(60 58) rotate(-8)">
        <ellipse cx="0" cy="0" rx="14" ry="18" fill="url(#krans)" />
        <circle cx="-6" cy="-8" r="3" fill="#E8B4D0" />
        <circle cx="6" cy="-6" r="3" fill="#F5D547" />
        <circle cx="-4" cy="6" r="3" fill="#FAFAF7" />
        <circle cx="6" cy="8" r="3" fill="#E8B4D0" />
        <circle cx="0" cy="-12" r="2.5" fill="#F5D547" />
      </g>
      <g transform="translate(140 58) rotate(12)">
        <ellipse cx="0" cy="0" rx="14" ry="18" fill="url(#krans)" />
        <circle cx="6" cy="-8" r="3" fill="#F5D547" />
        <circle cx="-6" cy="-6" r="3" fill="#E8B4D0" />
        <circle cx="4" cy="6" r="3" fill="#FAFAF7" />
        <circle cx="-6" cy="8" r="3" fill="#F5D547" />
        <circle cx="0" cy="-12" r="2.5" fill="#E8B4D0" />
      </g>
      <g transform="translate(100 30) rotate(-6)">
        <circle cx="0" cy="0" r="12" fill="none" stroke="url(#krans)" strokeWidth="5" />
        <circle cx="-10" cy="-4" r="2.5" fill="#F5D547" />
        <circle cx="8" cy="-6" r="2.5" fill="#E8B4D0" />
        <circle cx="10" cy="6" r="2.5" fill="#FAFAF7" />
        <circle cx="-8" cy="6" r="2.5" fill="#E8B4D0" />
        <circle cx="0" cy="-12" r="2.5" fill="#F5D547" />
      </g>
      <path d="M40 150 Q100 144 160 150" stroke="#3D6B3A" strokeWidth="2" fill="none" opacity="0.5" />
    </svg>
  );
}
