"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  X, Home, Music, Dices, Calendar, Camera,
  Users, MapPin, ClipboardList, Trophy, Star, ShieldCheck, LogOut,
} from "lucide-react";
import { useUser } from "@/lib/useUser";

const mainNav = [
  { href: "/", label: "Hem", Icon: Home },
  { href: "/snapsvisor", label: "Snapsvisor", Icon: Music },
  { href: "/dryckerlekar", label: "Dryckerlekar", Icon: Dices },
  { href: "/schema", label: "Schema", Icon: Calendar },
  { href: "/turnering", label: "Turnering", Icon: Trophy },
  { href: "/leaderboard", label: "Leaderboard", Icon: Star },
  { href: "/minnen", label: "Minnen", Icon: Camera },
];

const infoNav = [
  { href: "/gastlista", label: "Gästlista", Icon: Users },
  { href: "/hitta", label: "Hitta dit", Icon: MapPin },
  { href: "/packlista", label: "Att ta med", Icon: ClipboardList },
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

export function NavDrawer({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const me = useUser();

  useEffect(() => { setOpen(false); }, [pathname]);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  return (
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
        <div style={{ width: "36px", display: "flex", justifyContent: "flex-end" }}>
          {me.username && (
            <span style={{ fontSize: "11px", color: "#A8C5DA", fontFamily: "var(--font-inter)" }}>
              {me.username}
            </span>
          )}
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
              Alfta, 26 juni
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
          {mainNav.map(({ href, label, Icon }) => {
            const active = pathname === href || pathname.startsWith(href + "/");
            return (
              <Link key={href} href={href} style={{
                ...linkBase,
                padding: "12px 18px",
                fontSize: "14px",
                color: active ? "#FAFAF7" : "#A8C5DA",
                fontWeight: active ? 500 : 400,
                background: active ? "rgba(200,168,75,0.15)" : "transparent",
                borderRight: active ? "3px solid #C8A84B" : "3px solid transparent",
              }}>
                <Icon size={17} strokeWidth={1.5} />
                {label}
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

          {me.is("admin") && (
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

      <main style={{ flex: 1, paddingTop: "56px" }}>
        {children}
      </main>
    </div>
  );
}
