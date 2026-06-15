"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const navItems = [
  { href: "/", label: "Hem", emoji: "🏠" },
  { href: "/snapsvisor", label: "Visor", emoji: "🎵" },
  { href: "/dryckerlekar", label: "Lekar", emoji: "🎲" },
  { href: "/schema", label: "Schema", emoji: "📅" },
];

export default function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="bottom-nav">
      {navItems.map((item) => {
        const active = pathname === item.href;
        return (
          <Link
            key={item.href}
            href={item.href}
            className="flex flex-col items-center gap-1 px-4 py-1 transition-all"
            style={{ color: active ? "#2d6a1f" : "#9ab88a" }}
          >
            <span className="text-2xl">{item.emoji}</span>
            <span
              className="text-xs font-medium"
              style={{ fontWeight: active ? 700 : 500 }}
            >
              {item.label}
            </span>
            {active && (
              <div
                className="absolute -top-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full"
                style={{ background: "#2d6a1f" }}
              />
            )}
          </Link>
        );
      })}
    </nav>
  );
}
