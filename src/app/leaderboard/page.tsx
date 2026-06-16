"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useUser } from "@/lib/useUser";
import { NavDrawer } from "@/components/NavDrawer";
import { usePartyUnlocked } from "@/lib/PartyContext";

type UserRow = { id: string; username: string };
type BetRow = { id: string; status: string; winner_side: "for" | "against" | null };
type EntryRow = { bet_id: string; user_id: string; side: "for" | "against"; klunkar: number };

type UserStats = {
  user: UserRow;
  klunkarDruckit: number;
  klunkarVunnet: number;
  vunna: number;
  forlorade: number;
  aktiva: number;
};

type DrinkEntry = { user: UserRow; units: number };

function LockedScreen() {
  return (
    <div className="page-bg flex items-center justify-center px-8" style={{ minHeight: "calc(100dvh - 56px)" }}>
      <div className="text-center">
        <div className="text-6xl mb-5">🌸</div>
        <h2 className="text-xl font-bold mb-2" style={{ color: "var(--blue-deep)" }}>Snart dags!</h2>
        <p className="text-sm" style={{ color: "var(--text-muted)" }}>
          Den här funktionen låses upp på midsommarafton.
        </p>
      </div>
    </div>
  );
}

export default function LeaderboardPage() {
  const me = useUser();
  const partyUnlocked = usePartyUnlocked();
  const [tab, setTab] = useState<"betting" | "enheter">("enheter");
  const [stats, setStats] = useState<UserStats[]>([]);
  const [drinks, setDrinks] = useState<DrinkEntry[]>([]);
  const [loading, setLoading] = useState(true);

  async function fetchBetting() {
    const [{ data: users }, { data: bets }, { data: entries }] = await Promise.all([
      supabase.from("users").select("id, username").order("username"),
      supabase.from("bets").select("id, status, winner_side"),
      supabase.from("bet_entries").select("bet_id, user_id, side, klunkar"),
    ]);

    const userList = (users as UserRow[]) ?? [];
    const betList = (bets as BetRow[]) ?? [];
    const entryList = (entries as EntryRow[]) ?? [];

    const resolvedBets = new Map(
      betList.filter((b) => b.status === "resolved" && b.winner_side).map((b) => [b.id, b])
    );

    const computed: UserStats[] = userList.map((u) => {
      const myEntries = entryList.filter((e) => e.user_id === u.id);
      let klunkarDruckit = 0, klunkarVunnet = 0, vunna = 0, forlorade = 0, aktiva = 0;

      for (const e of myEntries) {
        const bet = resolvedBets.get(e.bet_id);
        if (bet) {
          if (e.side === bet.winner_side) {
            vunna++;
            const winnerEntries = entryList.filter((x) => x.bet_id === e.bet_id && x.side === bet.winner_side);
            const loserEntries = entryList.filter((x) => x.bet_id === e.bet_id && x.side !== bet.winner_side);
            const totalWinnerStake = winnerEntries.reduce((s, x) => s + x.klunkar, 0);
            const totalLoserStake = loserEntries.reduce((s, x) => s + x.klunkar, 0);
            if (totalWinnerStake > 0) klunkarVunnet += Math.round((e.klunkar / totalWinnerStake) * totalLoserStake);
          } else {
            forlorade++;
            klunkarDruckit += e.klunkar;
          }
        } else {
          const betRow = betList.find((b) => b.id === e.bet_id);
          if (betRow && (betRow.status === "open" || betRow.status === "closed")) aktiva++;
        }
      }

      return { user: u, klunkarDruckit, klunkarVunnet, vunna, forlorade, aktiva };
    });

    const active = computed.filter((s) => s.vunna + s.forlorade + s.aktiva > 0);
    active.sort((a, b) => b.klunkarDruckit - a.klunkarDruckit || b.vunna - a.vunna);
    setStats(active);
  }

  async function fetchDrinks() {
    const [{ data: settings }, { data: users }] = await Promise.all([
      supabase.from("app_settings").select("key, value").like("key", "drink_units_%"),
      supabase.from("users").select("id, username"),
    ]);

    const userMap = new Map<string, UserRow>(
      ((users as UserRow[]) ?? []).map((u) => [u.id, u])
    );

    const entries: DrinkEntry[] = ((settings ?? []) as { key: string; value: string }[])
      .map(({ key, value }) => {
        const userId = key.replace("drink_units_", "");
        const user = userMap.get(userId);
        if (!user) return null;
        return { user, units: Number(value) || 0 };
      })
      .filter((x): x is DrinkEntry => x !== null && x.units > 0);

    entries.sort((a, b) => b.units - a.units);
    setDrinks(entries);
  }

  async function fetchAll() {
    setLoading(true);
    await Promise.all([fetchBetting(), fetchDrinks()]);
    setLoading(false);
  }

  useEffect(() => {
    fetchAll();
    const ch = supabase.channel("leaderboard")
      .on("postgres_changes", { event: "*", schema: "public", table: "bets" }, fetchBetting)
      .on("postgres_changes", { event: "*", schema: "public", table: "bet_entries" }, fetchBetting)
      .on("postgres_changes", { event: "*", schema: "public", table: "app_settings" }, fetchDrinks)
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, []);

  if (!partyUnlocked && !me.is("värd")) {
    return <NavDrawer><LockedScreen /></NavDrawer>;
  }

  return (
    <NavDrawer>
      <div className="page-bg px-4 pt-6 pb-10 max-w-md mx-auto">
        <div className="pt-4 pb-4">
          <p className="page-subtitle mb-1">Individuell statistik</p>
          <h1 className="page-title">Leaderboard</h1>
          <div className="gold-rule" />
        </div>

        {/* Tab switcher */}
        <div style={{ display: "flex", gap: "8px", marginBottom: "20px" }}>
          {(["enheter", "betting"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`tag${tab === t ? " tag-active" : ""}`}
              style={{ border: "none", cursor: "pointer", padding: "7px 18px", fontSize: "13px", fontWeight: 600 }}
            >
              {t === "enheter" ? "🍺 Enheter" : "🎰 Betting"}
            </button>
          ))}
        </div>

        {loading ? (
          <p className="text-center mt-10" style={{ color: "var(--text-muted)" }}>Laddar...</p>
        ) : tab === "enheter" ? (
          <DrinkLeaderboard entries={drinks} meId={me.id} />
        ) : (
          <BettingLeaderboard stats={stats} meId={me.id} />
        )}
      </div>
    </NavDrawer>
  );
}

function DrinkLeaderboard({ entries, meId }: { entries: DrinkEntry[]; meId: string }) {
  if (entries.length === 0) {
    return (
      <div className="card p-8 text-center" style={{ color: "var(--text-muted)" }}>
        Ingen har loggat enheter ännu. Tryck på 🍺 i headern!
      </div>
    );
  }

  const medals = ["🥇", "🥈", "🥉"];
  const max = entries[0]?.units ?? 1;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
      {entries.map((e, i) => {
        const isSelf = e.user.id === meId;
        const pct = Math.round((e.units / max) * 100);
        return (
          <div key={e.user.id} className="card px-4 py-3"
            style={{ borderLeft: isSelf ? "3px solid var(--gold)" : undefined }}>
            <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "8px" }}>
              <span style={{ fontSize: "16px", width: "24px", textAlign: "center", flexShrink: 0 }}>
                {medals[i] ?? <span style={{ fontSize: "13px", fontWeight: 700, color: "var(--text-muted)" }}>{i + 1}</span>}
              </span>
              <span style={{ flex: 1, fontWeight: 600, fontSize: "15px", color: "var(--text-dark)" }}>
                {e.user.username}
                {isSelf && <span style={{ fontSize: "11px", color: "var(--text-muted)", fontWeight: 400, marginLeft: "6px" }}>(du)</span>}
              </span>
              <span style={{ fontSize: "20px", fontWeight: 800, color: "var(--blue-deep)" }}>
                {e.units}
                <span style={{ fontSize: "11px", fontWeight: 400, color: "var(--text-muted)", marginLeft: "4px" }}>enh.</span>
              </span>
            </div>
            {/* Progress bar */}
            <div style={{ height: "4px", background: "var(--border)", borderRadius: "2px", overflow: "hidden" }}>
              <div style={{
                height: "100%", borderRadius: "2px",
                width: `${pct}%`,
                background: i === 0 ? "#C8A84B" : i === 1 ? "#A8C5DA" : i === 2 ? "#b87333" : "var(--blue-mid)",
                transition: "width 0.4s ease",
              }} />
            </div>
          </div>
        );
      })}
    </div>
  );
}

function BettingLeaderboard({ stats, meId }: { stats: UserStats[]; meId: string }) {
  if (stats.length === 0) {
    return (
      <div className="card p-8 text-center" style={{ color: "var(--text-muted)" }}>
        Inga bets avgjorda ännu
      </div>
    );
  }

  const medals = ["🥇", "🥈", "🥉"];

  return (
    <div>
      <p className="text-sm mb-3" style={{ color: "var(--text-muted)" }}>
        Sorterat på klunkar druckna från förlorade bets
      </p>
      <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
        {stats.map((s, i) => {
          const isSelf = s.user.id === meId;
          const netto = s.klunkarVunnet - s.klunkarDruckit;
          return (
            <div key={s.user.id} className="card px-4 py-3"
              style={{ borderLeft: isSelf ? "3px solid var(--gold)" : undefined }}>
              <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "8px" }}>
                <span style={{ fontSize: "16px", width: "24px", textAlign: "center", flexShrink: 0 }}>
                  {medals[i] ?? <span style={{ fontSize: "13px", fontWeight: 700, color: "var(--text-muted)" }}>{i + 1}</span>}
                </span>
                <span style={{ flex: 1, fontWeight: 600, fontSize: "15px", color: "var(--text-dark)" }}>
                  {s.user.username}
                  {isSelf && <span style={{ fontSize: "11px", color: "var(--text-muted)", fontWeight: 400, marginLeft: "6px" }}>(du)</span>}
                </span>
                <div style={{ textAlign: "right" }}>
                  <p style={{ margin: 0, fontSize: "18px", fontWeight: 800, color: s.klunkarDruckit > 0 ? "var(--lingon)" : "var(--text-muted)" }}>
                    {s.klunkarDruckit} 🍺
                  </p>
                  <p style={{ margin: 0, fontSize: "10px", color: "var(--text-muted)" }}>druckna klunkar</p>
                </div>
              </div>
              <div style={{ display: "flex", gap: "8px" }}>
                <div style={{ flex: 1, background: "rgba(27,138,74,0.08)", borderRadius: "8px", padding: "6px 10px", textAlign: "center" }}>
                  <p style={{ margin: 0, fontSize: "13px", fontWeight: 700, color: "#1B8A4A" }}>{s.vunna}V</p>
                  <p style={{ margin: 0, fontSize: "10px", color: "var(--text-muted)" }}>+{s.klunkarVunnet}k</p>
                </div>
                <div style={{ flex: 1, background: "rgba(139,38,53,0.08)", borderRadius: "8px", padding: "6px 10px", textAlign: "center" }}>
                  <p style={{ margin: 0, fontSize: "13px", fontWeight: 700, color: "var(--lingon)" }}>{s.forlorade}F</p>
                  <p style={{ margin: 0, fontSize: "10px", color: "var(--text-muted)" }}>−{s.klunkarDruckit}k</p>
                </div>
                <div style={{
                  flex: 1, borderRadius: "8px", padding: "6px 10px", textAlign: "center",
                  background: netto >= 0 ? "rgba(27,138,74,0.08)" : "rgba(139,38,53,0.08)",
                }}>
                  <p style={{ margin: 0, fontSize: "13px", fontWeight: 700, color: netto >= 0 ? "#1B8A4A" : "var(--lingon)" }}>
                    {netto >= 0 ? "+" : ""}{netto}k
                  </p>
                  <p style={{ margin: 0, fontSize: "10px", color: "var(--text-muted)" }}>netto</p>
                </div>
                {s.aktiva > 0 && (
                  <div style={{ flex: 1, background: "rgba(200,168,75,0.1)", borderRadius: "8px", padding: "6px 10px", textAlign: "center" }}>
                    <p style={{ margin: 0, fontSize: "13px", fontWeight: 700, color: "var(--gold)" }}>{s.aktiva}</p>
                    <p style={{ margin: 0, fontSize: "10px", color: "var(--text-muted)" }}>aktiva</p>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
