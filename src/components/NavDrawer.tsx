"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  X, Home, Music, Dices, Calendar, Camera,
  Users, Users2, MapPin, ClipboardList, Trophy, Star, ShieldCheck, LogOut, ListChecks, Lock, Coins, Medal,
} from "lucide-react";
import { useUser } from "@/lib/useUser";
import { supabase } from "@/lib/supabase";
import { PartyContext } from "@/lib/PartyContext";

const mainNav = [
  { href: "/", label: "Hem", Icon: Home, locked: false },
  { href: "/snapsvisor", label: "Snapsvisor", Icon: Music, locked: false },
  { href: "/dryckerlekar", label: "Dricklekar", Icon: Dices, locked: false },
  { href: "/schema", label: "Schema", Icon: Calendar, locked: false },
  { href: "/femkamp", label: "Femkamp", Icon: Medal, locked: false },
  { href: "/lag", label: "Lag", Icon: Users2, locked: false },
  { href: "/turnering", label: "Turnering", Icon: Trophy, locked: true },
  { href: "/leaderboard", label: "Leaderboard", Icon: Star, locked: true },
  { href: "/bets", label: "Betting", Icon: Coins, locked: true },
  { href: "/minnen", label: "Minnen", Icon: Camera, locked: true },
];

const infoNav = [
  { href: "/gastlista", label: "Gästlista", Icon: Users },
  { href: "/hitta", label: "Hitta dit", Icon: MapPin },
  { href: "/packlista", label: "Att ta med", Icon: ClipboardList },
  { href: "/ansvar", label: "Ansvarsfördelning", Icon: ListChecks },
];

const linkBase: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: "12px",
  textDecoration: "none",
  fontFamily: "var(--font-inter), Inter, system-ui, sans-serif",
  borderRight: "3px solid transparent",
  transition: "background 0.15s",
};

function getCookie(name: string): string {
  if (typeof document === "undefined") return "";
  const m = document.cookie.match(new RegExp("(?:^|; )" + name + "=([^;]*)"));
  return m ? decodeURIComponent(m[1]) : "";
}

const ROLES = ["gäst", "värd", "lekledare", "admin"] as const;

type DrinkPop = { id: number };

export function NavDrawer({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const [partyUnlocked, setPartyUnlocked] = useState(false);
  const [simRole, setSimRole] = useState<string>("");
  const [mounted, setMounted] = useState(false);
  const [drinks, setDrinks] = useState(0);
  const [pops, setPops] = useState<DrinkPop[]>([]);
  const pathname = usePathname();
  const me = useUser();

  useEffect(() => {
    setSimRole(sessionStorage.getItem("simulate_role") ?? "");
    setDrinks(Number(localStorage.getItem("drink_units") ?? "0"));
    setMounted(true);
  }, []);

  // Sync localStorage → server once mounted
  useEffect(() => {
    if (!mounted) return;
    const local = Number(localStorage.getItem("drink_units") ?? "0");
    if (local > 0) {
      fetch("/api/drinks", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ units: local }),
      }).then((r) => r.json()).then((j) => { if (j.error) console.error("[drinks sync]", j.error); });
    }
  }, [mounted]);

  function addDrink() {
    const next = drinks + 1;
    setDrinks(next);
    localStorage.setItem("drink_units", String(next));
    fetch("/api/drinks", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ units: next }),
    });
    const id = Date.now();
    setPops((p) => [...p, { id }]);
    setTimeout(() => setPops((p) => p.filter((x) => x.id !== id)), 750);
  }

  const realRole = mounted ? getCookie("midsommar_role") : "";
  const isRealAdmin = realRole === "admin";

  useEffect(() => {
    let timer: ReturnType<typeof setInterval>;
    const check = () =>
      supabase.from("app_settings").select("value").eq("key", "party_unlocked").single()
        .then(({ data }) => setPartyUnlocked(data?.value === "true"));
    check();
    timer = setInterval(check, 5000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => { setOpen(false); }, [pathname]);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  const guestLocked = !partyUnlocked && !me.is("värd");

  return (
    <PartyContext.Provider value={partyUnlocked}>
    <div style={{ minHeight: "100dvh", display: "flex", flexDirection: "column" }}>
      <header style={{
        position: "fixed", top: 0, left: 0, right: 0, zIndex: 30,
        background: "#1B3F6E", height: "56px",
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "0 16px",
        borderBottom: "0.5px solid rgba(168,197,218,0.2)",
      }}>
        <button
          onClick={() => setOpen(true)}
          aria-label="Öppna meny"
          style={{ background: "none", border: "none", padding: "8px", cursor: "pointer", display: "flex", flexDirection: "column", gap: "5px" }}
        >
          <span style={{ display: "block", width: "20px", height: "1.5px", background: "#FAFAF7" }} />
          <span style={{ display: "block", width: "20px", height: "1.5px", background: "#FAFAF7" }} />
          <span style={{ display: "block", width: "14px", height: "1.5px", background: "#FAFAF7" }} />
        </button>
        <span style={{
          fontFamily: "var(--font-playfair), 'Playfair Display', Georgia, serif",
          fontSize: "18px", color: "#FAFAF7", fontStyle: "italic",
        }}>
          Midsommar
        </span>
        <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
          {pops.map((p) => (
            <span key={p.id} className="drink-pop" style={{ bottom: "100%", right: "50%", transform: "translateX(50%)" }}>
              +1
            </span>
          ))}
          <button
            onClick={addDrink}
            aria-label="Lägg till en enhet"
            style={{
              background: "none", border: "none", cursor: "pointer",
              display: "flex", flexDirection: "column", alignItems: "center",
              padding: "4px 6px", gap: "1px",
            }}
          >
            <span style={{ fontSize: "18px", lineHeight: 1 }}>🍺</span>
            {mounted && (
              <span style={{
                fontSize: "10px", fontWeight: 700, lineHeight: 1,
                fontFamily: "var(--font-inter), Inter, system-ui, sans-serif",
                color: drinks > 0 ? "#C8A84B" : "rgba(168,197,218,0.5)",
              }}>
                {drinks}
              </span>
            )}
          </button>
        </div>
      </header>

      {open && (
        <div
          onClick={() => setOpen(false)}
          style={{ position: "fixed", inset: 0, zIndex: 40, background: "rgba(10,25,45,0.55)" }}
        />
      )}

      <aside style={{
        position: "fixed", top: 0, left: 0, bottom: 0, zIndex: 50,
        width: "min(280px, 82vw)",
        background: "#1B3F6E",
        display: "flex", flexDirection: "column",
        transform: open ? "translateX(0)" : "translateX(-100%)",
        transition: "transform 0.28s cubic-bezier(0.4, 0, 0.2, 1)",
      }}>
        <div style={{
          padding: "14px 16px 16px",
          display: "flex", alignItems: "center", justifyContent: "space-between",
          borderBottom: "0.5px solid rgba(168,197,218,0.2)",
        }}>
          <div>
            <p style={{
              fontFamily: "var(--font-inter), Inter, system-ui, sans-serif",
              fontSize: "9px", letterSpacing: "0.12em", textTransform: "uppercase",
              color: "#A8C5DA", margin: "0 0 3px",
            }}>
              {me.username ? `${me.username} · ${me.role}` : "Midsommar 2026"}
            </p>
            <p style={{
              fontFamily: "var(--font-playfair), 'Playfair Display', Georgia, serif",
              fontSize: "18px", color: "#FAFAF7", margin: 0, fontStyle: "italic",
            }}>
              Midsommar, 19 juni
            </p>
          </div>
          <button
            onClick={() => setOpen(false)}
            aria-label="Stäng meny"
            style={{ background: "none", border: "none", cursor: "pointer", color: "#A8C5DA", padding: "4px", display: "flex" }}
          >
            <X size={20} strokeWidth={1.5} />
          </button>
        </div>

        <nav style={{ flex: 1, padding: "8px 0", overflowY: "auto" }}>
          {mainNav.map(({ href, label, Icon, locked }) => {
            const active = pathname === href || pathname.startsWith(href + "/");
            const isLocked = locked && guestLocked;
            return (
              <Link key={href} href={href} style={{
                ...linkBase,
                padding: "12px 18px",
                fontSize: "14px",
                color: isLocked ? "rgba(168,197,218,0.35)" : active ? "#FAFAF7" : "#A8C5DA",
                fontWeight: active ? 500 : 400,
                background: active ? "rgba(200,168,75,0.15)" : "transparent",
                borderRight: active ? "3px solid #C8A84B" : "3px solid transparent",
                pointerEvents: isLocked ? "none" : "auto",
              }}>
                <Icon size={17} strokeWidth={1.5} />
                {label}
                {isLocked && <Lock size={12} strokeWidth={1.5} style={{ marginLeft: "auto", opacity: 0.4 }} />}
              </Link>
            );
          })}

          <div style={{ margin: "8px 18px", height: "0.5px", background: "rgba(168,197,218,0.2)" }} />

          {infoNav.map(({ href, label, Icon }) => {
            const active = pathname === href;
            return (
              <Link key={href} href={href} style={{
                ...linkBase,
                padding: "11px 18px",
                fontSize: "13px",
                color: active ? "#FAFAF7" : "#A8C5DA",
                fontWeight: active ? 500 : 400,
                background: active ? "rgba(200,168,75,0.15)" : "transparent",
                borderRight: active ? "3px solid #C8A84B" : "3px solid transparent",
              }}>
                <Icon size={16} strokeWidth={1.5} />
                {label}
              </Link>
            );
          })}

          {me.is("värd") && (
            <>
              <div style={{ margin: "8px 18px", height: "0.5px", background: "rgba(168,197,218,0.2)" }} />
              <Link href="/anvandare" style={{
                ...linkBase,
                padding: "11px 18px",
                fontSize: "13px",
                color: pathname === "/anvandare" ? "#FAFAF7" : "#C8A84B",
                fontWeight: 500,
                background: pathname === "/anvandare" ? "rgba(200,168,75,0.15)" : "transparent",
                borderRight: pathname === "/anvandare" ? "3px solid #C8A84B" : "3px solid transparent",
              }}>
                <ShieldCheck size={16} strokeWidth={1.5} />
                Användare
              </Link>
            </>
          )}
        </nav>

        <div style={{ padding: "10px 18px 14px", borderTop: "0.5px solid rgba(168,197,218,0.15)" }}>
          {me.username && (
            <button
              onClick={async () => {
                await fetch("/api/logout", { method: "POST" });
                window.location.href = "/setup";
              }}
              style={{
                display: "flex", alignItems: "center", gap: "10px",
                background: "none", border: "none", cursor: "pointer",
                color: "rgba(168,197,218,0.6)", fontSize: "13px",
                fontFamily: "var(--font-inter), Inter, system-ui, sans-serif",
                padding: "6px 0", width: "100%",
              }}
            >
              <LogOut size={15} strokeWidth={1.5} />
              Byt användare
            </button>
          )}
          <p style={{
            fontFamily: "var(--font-inter), Inter, system-ui, sans-serif",
            fontSize: "10px", color: "rgba(168,197,218,0.3)", margin: "6px 0 0",
          }}>
            Fråga värden om lösenordet
          </p>
        </div>
      </aside>

      <main style={{ flex: 1, paddingTop: "56px", paddingBottom: mounted && isRealAdmin ? "44px" : undefined }}>
        {children}
      </main>

      {isRealAdmin && (
        <div style={{
          position: "fixed", bottom: 0, left: 0, right: 0, zIndex: 60,
          background: simRole ? "#5B2D8E" : "#1a1a1a",
          borderTop: `2px solid ${simRole ? "#a855f7" : "#333"}`,
          display: "flex", alignItems: "center", gap: "6px",
          padding: "6px 12px", height: "44px",
        }}>
          <span style={{ fontSize: "10px", color: simRole ? "#d8b4fe" : "#888", fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", flexShrink: 0 }}>
            {simRole ? `Simulerar: ${simRole}` : "Rolltest"}
          </span>
          <div style={{ display: "flex", gap: "4px", flex: 1 }}>
            {ROLES.map((r) => (
              <button key={r} onClick={() => {
                if (simRole === r) {
                  sessionStorage.removeItem("simulate_role");
                  setSimRole("");
                } else {
                  sessionStorage.setItem("simulate_role", r);
                  setSimRole(r);
                }
                window.location.reload();
              }} style={{
                flex: 1, padding: "4px 0", borderRadius: "6px", fontSize: "11px", fontWeight: 600,
                border: "none", cursor: "pointer",
                background: simRole === r ? "#a855f7" : "rgba(255,255,255,0.08)",
                color: simRole === r ? "white" : "#aaa",
              }}>
                {r}
              </button>
            ))}
          </div>
          {simRole && (
            <button onClick={() => {
              sessionStorage.removeItem("simulate_role");
              setSimRole("");
              window.location.reload();
            }} style={{ fontSize: "11px", color: "#d8b4fe", background: "none", border: "none", cursor: "pointer", flexShrink: 0 }}>
              ✕ Avsluta
            </button>
          )}
        </div>
      )}
    </div>
    </PartyContext.Provider>
  );
}
