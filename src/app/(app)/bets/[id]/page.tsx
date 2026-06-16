"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { useUser } from "@/lib/useUser";

type Bet = {
  id: string;
  description: string;
  created_by: string | null;
  status: "open" | "closed" | "resolved";
  winner_side: "for" | "against" | null;
  created_at: string;
};

type Entry = {
  id: string;
  bet_id: string;
  user_id: string;
  side: "for" | "against";
  klunkar: number;
  username?: string;
};

function oddsLabel(forK: number, againstK: number, side: "for" | "against"): string {
  const total = forK + againstK;
  if (total === 0) return "–";
  const stake = side === "for" ? forK : againstK;
  if (stake === 0) return "∞";
  return (total / stake).toFixed(2) + "x";
}

export default function BetDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const me = useUser();

  const [bet, setBet] = useState<Bet | null>(null);
  const [entries, setEntries] = useState<Entry[]>([]);
  const [loading, setLoading] = useState(true);
  const [side, setSide] = useState<"for" | "against">("for");
  const [klunkar, setKlunkar] = useState(3);
  const [submitting, setSubmitting] = useState(false);
  const [resolving, setResolving] = useState(false);

  const myEntry = entries.find((e) => e.user_id === me.id);
  const forEntries = entries.filter((e) => e.side === "for");
  const againstEntries = entries.filter((e) => e.side === "against");
  const forK = forEntries.reduce((s, e) => s + e.klunkar, 0);
  const againstK = againstEntries.reduce((s, e) => s + e.klunkar, 0);
  const pot = forK + againstK;

  async function load() {
    const [{ data: betData }, { data: entryData }, { data: userData }] = await Promise.all([
      supabase.from("bets").select("*").eq("id", id).single(),
      supabase.from("bet_entries").select("*").eq("bet_id", id),
      supabase.from("users").select("id, username"),
    ]);

    if (betData) setBet(betData);

    const userMap = Object.fromEntries((userData ?? []).map((u) => [u.id, u.username]));
    setEntries((entryData ?? []).map((e) => ({ ...e, username: userMap[e.user_id] })));
    setLoading(false);
  }

  useEffect(() => {
    if (!me.id) return;
    load();

    const channel = supabase
      .channel(`bet_detail_${id}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "bets", filter: `id=eq.${id}` }, load)
      .on("postgres_changes", { event: "*", schema: "public", table: "bet_entries", filter: `bet_id=eq.${id}` }, load)
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [me.id, id]);

  async function joinBet() {
    if (!me.id || !bet) return;
    setSubmitting(true);
    await fetch(`/api/bets/${bet.id}/entries`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ side, klunkar }),
    });
    setSubmitting(false);
    await load();
  }

  async function resolve(winner: "for" | "against") {
    if (!bet) return;
    setResolving(true);
    await fetch(`/api/bets/${bet.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "resolved", winner_side: winner }),
    });
    setResolving(false);
    await load();
  }

  async function closeBet() {
    if (!bet) return;
    await fetch(`/api/bets/${bet.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "closed" }),
    });
    await load();
  }

  async function reopenBet() {
    if (!bet) return;
    await fetch(`/api/bets/${bet.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "open", winner_side: null }),
    });
    await load();
  }

  async function deleteBet() {
    if (!bet || !confirm("Ta bort vadet?")) return;
    await fetch(`/api/bets/${bet.id}`, { method: "DELETE" });
    window.location.replace("/bets");
  }

  if (loading) {
    return <div style={{ padding: "40px 24px", textAlign: "center", color: "var(--text-muted)" }}>Laddar...</div>;
  }

  if (!bet) {
    return <div style={{ padding: "40px 24px", textAlign: "center", color: "var(--text-muted)" }}>Vadet hittades inte.</div>;
  }

  const statusColor = bet.status === "open" ? "#1B8A4A" : bet.status === "closed" ? "#C8A84B" : "#8B2635";
  const statusLabel = bet.status === "open" ? "Öppet" : bet.status === "closed" ? "Stängt" : "Avgjort";
  const canJoin = bet.status === "open" && !myEntry && me.id;
  const isVard = me.is("värd");

  return (
    <div className="page-bg px-4 pt-6 pb-12 max-w-md mx-auto">
      <div className="pt-4 pb-2">
        <a href="/bets" style={{ fontSize: "12px", color: "var(--text-muted)", textDecoration: "none" }}>← Tillbaka</a>
      </div>

      <div className="pt-3 pb-5">
        <div style={{ display: "flex", alignItems: "flex-start", gap: "10px", marginBottom: "6px" }}>
          <h1 style={{
            fontFamily: "var(--font-playfair), 'Playfair Display', Georgia, serif",
            fontSize: "22px", color: "var(--text-dark)", margin: 0, flex: 1, fontStyle: "italic",
          }}>
            {bet.description}
          </h1>
          <span style={{
            fontSize: "10px", fontWeight: 600, padding: "3px 10px", borderRadius: "20px",
            background: statusColor + "20", color: statusColor, whiteSpace: "nowrap",
            letterSpacing: "0.05em", marginTop: "4px",
          }}>
            {statusLabel}
          </span>
        </div>
        {bet.status === "resolved" && bet.winner_side && (
          <p style={{ fontSize: "14px", color: "var(--text-muted)", margin: "4px 0 0" }}>
            Vinnarsida:{" "}
            <strong style={{ color: bet.winner_side === "for" ? "#1B8A4A" : "#8B2635" }}>
              {bet.winner_side === "for" ? "FÖR" : "EMOT"}
            </strong>
          </p>
        )}
        <div className="gold-rule" style={{ marginTop: "12px" }} />
      </div>

      {/* Odds / pot overview */}
      <div style={{ display: "flex", gap: "8px", marginBottom: "20px" }}>
        <div style={{ flex: 1, background: "#1B8A4A15", borderRadius: "12px", padding: "12px 14px" }}>
          <p style={{ margin: 0, fontSize: "11px", color: "#1B8A4A", fontWeight: 700, letterSpacing: "0.08em" }}>FÖR</p>
          <p style={{ margin: "4px 0 2px", fontSize: "22px", fontWeight: 800, color: "var(--text-dark)" }}>{forK}</p>
          <p style={{ margin: 0, fontSize: "11px", color: "var(--text-muted)" }}>klunkar · {oddsLabel(forK, againstK, "for")}</p>
        </div>
        <div style={{ flex: 1, background: "#8B263515", borderRadius: "12px", padding: "12px 14px" }}>
          <p style={{ margin: 0, fontSize: "11px", color: "#8B2635", fontWeight: 700, letterSpacing: "0.08em" }}>EMOT</p>
          <p style={{ margin: "4px 0 2px", fontSize: "22px", fontWeight: 800, color: "var(--text-dark)" }}>{againstK}</p>
          <p style={{ margin: 0, fontSize: "11px", color: "var(--text-muted)" }}>klunkar · {oddsLabel(forK, againstK, "against")}</p>
        </div>
        <div style={{ background: "rgba(200,168,75,0.1)", borderRadius: "12px", padding: "12px 14px", display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", minWidth: "72px" }}>
          <p style={{ margin: 0, fontSize: "11px", color: "#C8A84B", fontWeight: 700, letterSpacing: "0.06em" }}>POT</p>
          <p style={{ margin: "4px 0 0", fontSize: "22px", fontWeight: 800, color: "var(--text-dark)" }}>{pot}</p>
        </div>
      </div>

      {/* My entry */}
      {myEntry && (
        <div className="card px-4 py-3 mb-4" style={{ borderLeft: `3px solid ${myEntry.side === "for" ? "#1B8A4A" : "#8B2635"}` }}>
          <p style={{ margin: 0, fontSize: "12px", color: "var(--text-muted)" }}>Ditt vad</p>
          <p style={{ margin: "2px 0 0", fontSize: "15px", fontWeight: 700, color: "var(--text-dark)" }}>
            {myEntry.side === "for" ? "FÖR" : "EMOT"} · {myEntry.klunkar} klunkar
          </p>
          {bet.status === "resolved" && bet.winner_side && (
            <p style={{ margin: "4px 0 0", fontSize: "13px" }}>
              {myEntry.side === bet.winner_side ? (
                <span style={{ color: "#1B8A4A", fontWeight: 600 }}>
                  Du vann! +{Math.round(myEntry.klunkar * (pot / (myEntry.side === "for" ? forK : againstK)) - myEntry.klunkar)} klunkar netto
                </span>
              ) : (
                <span style={{ color: "#8B2635", fontWeight: 600 }}>
                  Du förlorade {myEntry.klunkar} klunkar
                </span>
              )}
            </p>
          )}
        </div>
      )}

      {/* Join form */}
      {canJoin && (
        <div className="card px-4 py-4 mb-5 space-y-4">
          <p style={{ fontWeight: 600, fontSize: "14px", color: "var(--text-dark)", margin: 0 }}>Ta bettet</p>

          <div style={{ display: "flex", gap: "8px" }}>
            {(["for", "against"] as const).map((s) => (
              <button
                key={s}
                onClick={() => setSide(s)}
                style={{
                  flex: 1, padding: "10px", borderRadius: "10px", border: "none",
                  cursor: "pointer", fontWeight: 700, fontSize: "14px",
                  fontFamily: "var(--font-inter), Inter, system-ui, sans-serif",
                  background: side === s ? (s === "for" ? "#1B8A4A" : "#8B2635") : "var(--birch)",
                  color: side === s ? "#fff" : "var(--text-muted)",
                  transition: "all 0.15s",
                }}
              >
                {s === "for" ? "FÖR" : "EMOT"}
              </button>
            ))}
          </div>

          {side && (
            <p style={{ margin: 0, fontSize: "12px", color: "var(--text-muted)" }}>
              Vinner odds: <strong style={{ color: "var(--text-dark)" }}>{oddsLabel(forK, againstK, side)}</strong>
            </p>
          )}

          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <button
              onClick={() => setKlunkar((k) => Math.max(1, k - 1))}
              style={{ width: "44px", height: "44px", borderRadius: "10px", border: "1px solid var(--border)", background: "var(--birch)", fontSize: "20px", cursor: "pointer", color: "var(--text-dark)" }}
            >−</button>
            <span style={{ fontSize: "24px", fontWeight: 700, color: "var(--text-dark)", minWidth: "32px", textAlign: "center" }}>{klunkar}</span>
            <button
              onClick={() => setKlunkar((k) => Math.min(10, k + 1))}
              style={{ width: "44px", height: "44px", borderRadius: "10px", border: "1px solid var(--border)", background: "var(--birch)", fontSize: "20px", cursor: "pointer", color: "var(--text-dark)" }}
            >+</button>
            <div style={{ display: "flex", gap: "4px" }}>
              {[1, 2, 3, 5, 10].map((v) => (
                <button
                  key={v}
                  onClick={() => setKlunkar(v)}
                  style={{
                    padding: "6px 10px", borderRadius: "8px", border: "none",
                    background: klunkar === v ? "#C8A84B" : "var(--birch)",
                    color: klunkar === v ? "#1B3F6E" : "var(--text-muted)",
                    fontWeight: 600, fontSize: "12px", cursor: "pointer",
                  }}
                >
                  {v}
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={joinBet}
            disabled={submitting}
            style={{
              width: "100%", padding: "13px", borderRadius: "12px", border: "none",
              background: "#C8A84B", color: "#1B3F6E", fontWeight: 700, fontSize: "14px",
              cursor: submitting ? "not-allowed" : "pointer",
              opacity: submitting ? 0.7 : 1,
              fontFamily: "var(--font-inter), Inter, system-ui, sans-serif",
            }}
          >
            {submitting ? "Lägger vad..." : `Lägg ${klunkar} klunkar`}
          </button>
        </div>
      )}

      {/* Värd controls */}
      {isVard && (
        <div className="card px-4 py-4 mb-5 space-y-3">
          <p style={{ fontWeight: 600, fontSize: "13px", color: "var(--text-muted)", margin: 0, letterSpacing: "0.06em", textTransform: "uppercase" }}>Värdkontroller</p>

          {bet.status === "open" && (
            <button
              onClick={closeBet}
              style={{
                width: "100%", padding: "11px", borderRadius: "12px",
                border: "1px solid #C8A84B", background: "transparent",
                color: "#C8A84B", fontWeight: 600, fontSize: "14px", cursor: "pointer",
                fontFamily: "var(--font-inter), Inter, system-ui, sans-serif",
              }}
            >
              Stäng vadet (inga fler insatser)
            </button>
          )}

          {bet.status === "closed" && (
            <button
              onClick={reopenBet}
              style={{
                width: "100%", padding: "11px", borderRadius: "12px",
                border: "1px solid var(--border)", background: "transparent",
                color: "var(--text-muted)", fontWeight: 600, fontSize: "14px", cursor: "pointer",
                fontFamily: "var(--font-inter), Inter, system-ui, sans-serif",
              }}
            >
              Öppna igen
            </button>
          )}

          {(bet.status === "open" || bet.status === "closed") && (
            <>
              <p style={{ margin: "4px 0 0", fontSize: "12px", color: "var(--text-muted)" }}>Avgör vinnare:</p>
              <div style={{ display: "flex", gap: "8px" }}>
                <button
                  onClick={() => resolve("for")}
                  disabled={resolving}
                  style={{
                    flex: 1, padding: "12px", borderRadius: "12px", border: "none",
                    background: "#1B8A4A", color: "#fff", fontWeight: 700, fontSize: "14px",
                    cursor: resolving ? "not-allowed" : "pointer",
                    fontFamily: "var(--font-inter), Inter, system-ui, sans-serif",
                  }}
                >
                  FÖR vinner
                </button>
                <button
                  onClick={() => resolve("against")}
                  disabled={resolving}
                  style={{
                    flex: 1, padding: "12px", borderRadius: "12px", border: "none",
                    background: "#8B2635", color: "#fff", fontWeight: 700, fontSize: "14px",
                    cursor: resolving ? "not-allowed" : "pointer",
                    fontFamily: "var(--font-inter), Inter, system-ui, sans-serif",
                  }}
                >
                  EMOT vinner
                </button>
              </div>
            </>
          )}

          {bet.status === "resolved" && (
            <button
              onClick={reopenBet}
              style={{
                width: "100%", padding: "11px", borderRadius: "12px",
                border: "1px solid var(--border)", background: "transparent",
                color: "var(--text-muted)", fontWeight: 600, fontSize: "13px", cursor: "pointer",
                fontFamily: "var(--font-inter), Inter, system-ui, sans-serif",
              }}
            >
              Återöppna vadet
            </button>
          )}

          <button
            onClick={deleteBet}
            style={{
              width: "100%", padding: "11px", borderRadius: "12px", border: "none",
              background: "rgba(139,38,53,0.1)", color: "#8B2635",
              fontWeight: 600, fontSize: "14px", cursor: "pointer",
              fontFamily: "var(--font-inter), Inter, system-ui, sans-serif",
            }}
          >
            Ta bort vad
          </button>
        </div>
      )}

      {/* Entries list */}
      <div>
        <p style={{ fontSize: "11px", fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--text-muted)", marginBottom: "10px" }}>
          Deltagare ({entries.length})
        </p>
        {entries.length === 0 ? (
          <p style={{ color: "var(--text-muted)", fontSize: "14px" }}>Inga insatser ännu.</p>
        ) : (
          <div className="space-y-2">
            {entries.map((e) => (
              <div key={e.id} className="card px-4 py-3" style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <span style={{
                    width: "8px", height: "8px", borderRadius: "50%",
                    background: e.side === "for" ? "#1B8A4A" : "#8B2635",
                    flexShrink: 0,
                  }} />
                  <span style={{ fontWeight: 600, fontSize: "14px", color: "var(--text-dark)" }}>
                    {e.username ?? "Okänd"}
                    {e.user_id === me.id && <span style={{ color: "var(--text-muted)", fontWeight: 400, fontSize: "12px" }}> (du)</span>}
                  </span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <span style={{
                    fontSize: "11px", fontWeight: 700, padding: "2px 8px", borderRadius: "20px",
                    background: e.side === "for" ? "#1B8A4A20" : "#8B263520",
                    color: e.side === "for" ? "#1B8A4A" : "#8B2635",
                  }}>
                    {e.side === "for" ? "FÖR" : "EMOT"}
                  </span>
                  <span style={{ fontSize: "14px", fontWeight: 700, color: "var(--text-dark)" }}>
                    {e.klunkar} <span style={{ fontSize: "11px", fontWeight: 400, color: "var(--text-muted)" }}>k</span>
                  </span>
                  {bet.status === "resolved" && bet.winner_side && (
                    <span style={{ fontSize: "16px" }}>
                      {e.side === bet.winner_side ? "🏆" : "💀"}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
