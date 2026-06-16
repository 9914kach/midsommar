"use client";

import { useEffect, useState, useRef } from "react";
import { supabase } from "@/lib/supabase";
import { useUser } from "@/lib/useUser";
import { usePartyUnlocked } from "@/lib/PartyContext";

type Bet = {
  id: string;
  description: string;
  created_by: string | null;
  status: "open" | "closed" | "resolved";
  winner_side: "for" | "against" | null;
  created_at: string;
  creator_name?: string;
  for_klunkar: number;
  against_klunkar: number;
  my_side?: "for" | "against" | null;
};

const SUGGESTIONS = [
  "Vem spyr först?",
  "Ragnar håller sig nykter hela kvällen",
  "Det blir midsommarregn",
  "Någon hoppar i sjön",
  "Alla lär sig hela snapsvisorns text",
];

function oddsLabel(forK: number, againstK: number, side: "for" | "against"): string {
  const total = forK + againstK;
  if (total === 0) return "–";
  const stake = side === "for" ? forK : againstK;
  if (stake === 0) return "∞";
  const odds = total / stake;
  return odds.toFixed(2) + "x";
}

export default function BetsPage() {
  const me = useUser();
  const partyUnlocked = usePartyUnlocked();
  const [bets, setBets] = useState<Bet[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [desc, setDesc] = useState("");
  const [side, setSide] = useState<"for" | "against">("for");
  const [klunkar, setKlunkar] = useState(3);
  const [submitting, setSubmitting] = useState(false);
  const formRef = useRef<HTMLDivElement>(null);

  const guestLocked = !partyUnlocked && !me.is("värd");

  async function loadBets() {
    const { data: betRows } = await supabase
      .from("bets")
      .select("*")
      .order("created_at", { ascending: false });
    if (!betRows) return;

    const { data: entries } = await supabase.from("bet_entries").select("*");
    const { data: users } = await supabase.from("users").select("id, username");

    const userMap = Object.fromEntries((users ?? []).map((u) => [u.id, u.username]));

    const enriched: Bet[] = betRows.map((b) => {
      const betEntries = (entries ?? []).filter((e) => e.bet_id === b.id);
      const forK = betEntries.filter((e) => e.side === "for").reduce((s, e) => s + e.klunkar, 0);
      const againstK = betEntries.filter((e) => e.side === "against").reduce((s, e) => s + e.klunkar, 0);
      const mine = betEntries.find((e) => e.user_id === me.id);
      return {
        ...b,
        creator_name: b.created_by ? userMap[b.created_by] : undefined,
        for_klunkar: forK,
        against_klunkar: againstK,
        my_side: mine?.side ?? null,
      };
    });

    enriched.sort((a, b) => {
      const potA = a.for_klunkar + a.against_klunkar;
      const potB = b.for_klunkar + b.against_klunkar;
      if (b.status === "open" && a.status !== "open") return 1;
      if (a.status === "open" && b.status !== "open") return -1;
      return potB - potA;
    });

    setBets(enriched);
    setLoading(false);
  }

  useEffect(() => {
    if (!me.id) return;
    loadBets();

    const channel = supabase
      .channel("bets_realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "bets" }, loadBets)
      .on("postgres_changes", { event: "*", schema: "public", table: "bet_entries" }, loadBets)
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [me.id]);

  async function submitBet() {
    if (!desc.trim() || !me.id) return;
    setSubmitting(true);
    const { data: bet } = await supabase
      .from("bets")
      .insert({ description: desc.trim(), created_by: me.id })
      .select()
      .single();

    if (bet) {
      await supabase.from("bet_entries").insert({
        bet_id: bet.id,
        user_id: me.id,
        side,
        klunkar,
      });
    }

    setDesc("");
    setSide("for");
    setKlunkar(3);
    setShowForm(false);
    setSubmitting(false);
    await loadBets();
  }

  if (guestLocked) {
    return (
      <div style={{ padding: "60px 24px", textAlign: "center" }}>
        <p style={{ color: "var(--text-muted)", fontSize: "15px" }}>Betting öppnar på festdagen.</p>
      </div>
    );
  }

  return (
    <div className="page-bg px-4 pt-6 pb-12 max-w-md mx-auto">
      <div className="pt-4 pb-5">
        <p className="page-subtitle mb-1">Satsa klunkar</p>
        <h1 className="page-title">Betting</h1>
        <div className="gold-rule" />
        <p className="text-sm mt-2" style={{ color: "var(--text-muted)" }}>
          Vinn klunkar. Drick klunkar. Lev livet.
        </p>
      </div>

      {!showForm ? (
        <button
          onClick={() => { setShowForm(true); setTimeout(() => formRef.current?.scrollIntoView({ behavior: "smooth" }), 50); }}
          style={{
            width: "100%", padding: "14px", borderRadius: "14px",
            background: "#C8A84B", border: "none", cursor: "pointer",
            color: "#1B3F6E", fontWeight: 700, fontSize: "15px",
            fontFamily: "var(--font-inter), Inter, system-ui, sans-serif",
            marginBottom: "20px",
          }}
        >
          Lägg ett jävla vad
        </button>
      ) : (
        <div ref={formRef} className="card px-4 py-4 mb-5 space-y-4">
          <p style={{ fontWeight: 600, fontSize: "14px", color: "var(--text-dark)", margin: 0 }}>Nytt vad</p>

          <div>
            <label style={{ fontSize: "11px", color: "var(--text-muted)", letterSpacing: "0.08em", textTransform: "uppercase", display: "block", marginBottom: "6px" }}>
              Vad handlar vadet om?
            </label>
            <input
              value={desc}
              onChange={(e) => setDesc(e.target.value)}
              placeholder="T.ex. Vem spyr först?"
              style={{
                width: "100%", padding: "10px 12px", borderRadius: "10px",
                border: "1px solid var(--border)", background: "var(--birch)",
                color: "var(--text-dark)", fontSize: "14px",
                fontFamily: "var(--font-inter), Inter, system-ui, sans-serif",
                boxSizing: "border-box",
              }}
            />
            <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", marginTop: "8px" }}>
              {SUGGESTIONS.map((s) => (
                <button
                  key={s}
                  onClick={() => setDesc(s)}
                  style={{
                    fontSize: "11px", padding: "4px 10px", borderRadius: "20px",
                    border: "1px solid var(--border)", background: "transparent",
                    color: "var(--text-muted)", cursor: "pointer",
                    fontFamily: "var(--font-inter), Inter, system-ui, sans-serif",
                  }}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label style={{ fontSize: "11px", color: "var(--text-muted)", letterSpacing: "0.08em", textTransform: "uppercase", display: "block", marginBottom: "6px" }}>
              Din sida
            </label>
            <div style={{ display: "flex", gap: "8px" }}>
              {(["for", "against"] as const).map((s) => (
                <button
                  key={s}
                  onClick={() => setSide(s)}
                  style={{
                    flex: 1, padding: "10px", borderRadius: "10px", border: "none",
                    cursor: "pointer", fontWeight: 600, fontSize: "14px",
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
          </div>

          <div>
            <label style={{ fontSize: "11px", color: "var(--text-muted)", letterSpacing: "0.08em", textTransform: "uppercase", display: "block", marginBottom: "6px" }}>
              Insats (klunkar)
            </label>
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
              <div style={{ display: "flex", gap: "4px", marginLeft: "4px" }}>
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
          </div>

          <div style={{ display: "flex", gap: "8px" }}>
            <button
              onClick={submitBet}
              disabled={submitting || !desc.trim()}
              style={{
                flex: 1, padding: "12px", borderRadius: "12px", border: "none",
                background: "#C8A84B", color: "#1B3F6E", fontWeight: 700, fontSize: "14px",
                cursor: submitting || !desc.trim() ? "not-allowed" : "pointer",
                opacity: submitting || !desc.trim() ? 0.6 : 1,
                fontFamily: "var(--font-inter), Inter, system-ui, sans-serif",
              }}
            >
              {submitting ? "Lägger vad..." : "Lägg vad"}
            </button>
            <button
              onClick={() => setShowForm(false)}
              style={{
                padding: "12px 16px", borderRadius: "12px",
                border: "1px solid var(--border)", background: "transparent",
                color: "var(--text-muted)", fontSize: "14px", cursor: "pointer",
                fontFamily: "var(--font-inter), Inter, system-ui, sans-serif",
              }}
            >
              Avbryt
            </button>
          </div>
        </div>
      )}

      {loading ? (
        <p style={{ color: "var(--text-muted)", textAlign: "center", paddingTop: "24px" }}>Laddar...</p>
      ) : bets.length === 0 ? (
        <p style={{ color: "var(--text-muted)", textAlign: "center", paddingTop: "24px" }}>Inga vad ännu. Var modig.</p>
      ) : (
        <div className="space-y-3">
          {bets.map((bet) => {
            const pot = bet.for_klunkar + bet.against_klunkar;
            const statusColor = bet.status === "open" ? "#1B8A4A" : bet.status === "closed" ? "#C8A84B" : "#8B2635";
            const statusLabel = bet.status === "open" ? "Öppet" : bet.status === "closed" ? "Stängt" : "Avgjort";
            return (
              <a
                key={bet.id}
                href={`/bets/${bet.id}`}
                style={{ textDecoration: "none", display: "block" }}
              >
                <div className="card px-4 py-3" style={{ cursor: "pointer" }}>
                  <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "8px", marginBottom: "8px" }}>
                    <p style={{ margin: 0, fontWeight: 600, fontSize: "14px", color: "var(--text-dark)", flex: 1 }}>
                      {bet.description}
                    </p>
                    <span style={{
                      fontSize: "10px", fontWeight: 600, padding: "2px 8px", borderRadius: "20px",
                      background: statusColor + "20", color: statusColor,
                      letterSpacing: "0.05em", whiteSpace: "nowrap", flexShrink: 0,
                    }}>
                      {statusLabel}
                    </span>
                  </div>

                  {bet.status === "resolved" && bet.winner_side && (
                    <p style={{ margin: "0 0 8px", fontSize: "12px", color: "var(--text-muted)" }}>
                      Vinnare: <strong style={{ color: bet.winner_side === "for" ? "#1B8A4A" : "#8B2635" }}>
                        {bet.winner_side === "for" ? "FÖR" : "EMOT"}
                      </strong>
                    </p>
                  )}

                  <div style={{ display: "flex", gap: "8px", marginBottom: "6px" }}>
                    <div style={{ flex: 1, background: "#1B8A4A15", borderRadius: "8px", padding: "6px 10px" }}>
                      <p style={{ margin: 0, fontSize: "10px", color: "#1B8A4A", fontWeight: 600, letterSpacing: "0.06em" }}>FÖR</p>
                      <p style={{ margin: "2px 0 0", fontSize: "16px", fontWeight: 700, color: "var(--text-dark)" }}>
                        {bet.for_klunkar} <span style={{ fontSize: "11px", fontWeight: 400, color: "var(--text-muted)" }}>klunkar</span>
                      </p>
                      <p style={{ margin: "1px 0 0", fontSize: "10px", color: "var(--text-muted)" }}>{oddsLabel(bet.for_klunkar, bet.against_klunkar, "for")}</p>
                    </div>
                    <div style={{ flex: 1, background: "#8B263515", borderRadius: "8px", padding: "6px 10px" }}>
                      <p style={{ margin: 0, fontSize: "10px", color: "#8B2635", fontWeight: 600, letterSpacing: "0.06em" }}>EMOT</p>
                      <p style={{ margin: "2px 0 0", fontSize: "16px", fontWeight: 700, color: "var(--text-dark)" }}>
                        {bet.against_klunkar} <span style={{ fontSize: "11px", fontWeight: 400, color: "var(--text-muted)" }}>klunkar</span>
                      </p>
                      <p style={{ margin: "1px 0 0", fontSize: "10px", color: "var(--text-muted)" }}>{oddsLabel(bet.for_klunkar, bet.against_klunkar, "against")}</p>
                    </div>
                  </div>

                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <span style={{ fontSize: "11px", color: "var(--text-muted)" }}>
                      Pot: <strong style={{ color: "var(--text-dark)" }}>{pot} klunkar</strong>
                      {bet.creator_name && <> · {bet.creator_name}</>}
                    </span>
                    {bet.my_side && (
                      <span style={{
                        fontSize: "10px", padding: "2px 8px", borderRadius: "20px",
                        background: bet.my_side === "for" ? "#1B8A4A20" : "#8B263520",
                        color: bet.my_side === "for" ? "#1B8A4A" : "#8B2635",
                        fontWeight: 600,
                      }}>
                        Du: {bet.my_side === "for" ? "FÖR" : "EMOT"}
                      </span>
                    )}
                  </div>
                </div>
              </a>
            );
          })}
        </div>
      )}
    </div>
  );
}
