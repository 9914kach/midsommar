"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useUser } from "@/lib/useUser";

type Tournament = { id: string; name: string; game: string; status: string };
type TTeam = { id: string; name: string; color: string | null };
type TEvent = { id: string; name: string; scoring_type: string; description: string | null; placement_points: string | null };
type EventResult = { event_id: string; tournament_team_id: string; value: number | null };

const TEAM_COLORS = ["#C8A84B", "#1B3F6E", "#3D6B3A", "#8B2635", "#5B4A8A", "#C45000", "#2A7A7A", "#6B4423"];
const PLACE_MEDALS = ["🥇", "🥈", "🥉", "4.", "5.", "6.", "7.", "8."];

function parsePlacementPoints(raw: string | null): number[] | null {
  if (!raw) return null;
  const pts = raw.split(",").map((v) => parseFloat(v.trim()));
  if (pts.some(isNaN)) return null;
  return pts;
}

function computeRanking(teams: TTeam[], events: TEvent[], results: EventResult[]) {
  const totals: Record<string, number> = {};
  for (const t of teams) totals[t.id] = 0;
  for (const evt of events) {
    const evtResults = results.filter((r) => r.event_id === evt.id && r.value != null);
    if (evtResults.length === 0) continue;
    const placementPts = parsePlacementPoints(evt.placement_points);
    if (placementPts) {
      // Rank teams by raw value, apply placement points
      const sorted = [...evtResults].sort((a, b) =>
        evt.scoring_type === "time"
          ? (a.value ?? 0) - (b.value ?? 0)   // time: lower is better
          : (b.value ?? 0) - (a.value ?? 0)   // points: higher is better
      );
      sorted.forEach((r, i) => {
        totals[r.tournament_team_id] = (totals[r.tournament_team_id] ?? 0) + (placementPts[i] ?? 0);
      });
    } else if (evt.scoring_type === "points") {
      for (const r of evtResults) totals[r.tournament_team_id] = (totals[r.tournament_team_id] ?? 0) + (r.value ?? 0);
    } else {
      const sorted = [...evtResults].sort((a, b) => (a.value ?? 0) - (b.value ?? 0));
      sorted.forEach((r, i) => { totals[r.tournament_team_id] = (totals[r.tournament_team_id] ?? 0) + (teams.length - i); });
    }
  }
  return teams.map((t) => ({ team: t, total: totals[t.id] ?? 0 })).sort((a, b) => b.total - a.total);
}

export default function FemkampPage() {
  const me = useUser();
  const isLekledare = me.is("lekledare");

  const [tournament, setTournament] = useState<Tournament | null>(null);
  const [teams, setTeams] = useState<TTeam[]>([]);
  const [events, setEvents] = useState<TEvent[]>([]);
  const [results, setResults] = useState<EventResult[]>([]);
  const [draftResults, setDraftResults] = useState<Record<string, Record<string, string>>>({});
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  // Add event form
  const [showAddEvent, setShowAddEvent] = useState(false);
  const [newEventName, setNewEventName] = useState("");
  const [newEventDesc, setNewEventDesc] = useState("");
  const [newEventType, setNewEventType] = useState<"points" | "time">("points");
  const [newEventPlacements, setNewEventPlacements] = useState<string[]>([]);
  const [addingEvent, setAddingEvent] = useState(false);
  const [savingResults, setSavingResults] = useState<string | null>(null);
  // Edit placement points per event
  const [editingPlacements, setEditingPlacements] = useState<string | null>(null); // eventId
  const [draftPlacements, setDraftPlacements] = useState<string[]>([]);

  // Add team
  const [showAddTeam, setShowAddTeam] = useState(false);
  const [newTeamName, setNewTeamName] = useState("");
  const [newTeamColor, setNewTeamColor] = useState(TEAM_COLORS[0]);
  const [addingTeam, setAddingTeam] = useState(false);

  async function fetchData() {
    const { data: tournaments } = await supabase
      .from("tournaments")
      .select("*")
      .eq("format", "multi_event")
      .order("created_at", { ascending: false });

    if (!tournaments || tournaments.length === 0) {
      setNotFound(true);
      setLoading(false);
      return;
    }

    const t = tournaments[0];
    setTournament(t);

    const [{ data: teamsData }, { data: eventsData }] = await Promise.all([
      supabase.from("tournament_teams").select("id, name, color").eq("tournament_id", t.id),
      supabase.from("tournament_events").select("id, name, scoring_type, description").eq("tournament_id", t.id).order("created_at"),
    ]);

    const fetchedTeams = (teamsData as TTeam[]) ?? [];
    setTeams(fetchedTeams);
    setEvents((eventsData as TEvent[]) ?? []);

    if (fetchedTeams.length > 0) {
      const { data: res } = await supabase
        .from("tournament_event_results")
        .select("*")
        .in("tournament_team_id", fetchedTeams.map((t) => t.id));
      setResults((res as EventResult[]) ?? []);
    }

    setLoading(false);
  }

  useEffect(() => { fetchData(); }, []);

  function getResultValue(eventId: string, teamId: string): string {
    if (draftResults[eventId]?.[teamId] !== undefined) return draftResults[eventId][teamId];
    const r = results.find((r) => r.event_id === eventId && r.tournament_team_id === teamId);
    return r?.value != null ? String(r.value) : "";
  }

  function setDraftValue(eventId: string, teamId: string, val: string) {
    setDraftResults((prev) => ({ ...prev, [eventId]: { ...(prev[eventId] ?? {}), [teamId]: val } }));
  }

  async function saveResults(eventId: string) {
    if (!tournament) return;
    setSavingResults(eventId);
    const draft = draftResults[eventId] ?? {};
    const payload = teams
      .filter((t) => draft[t.id] !== undefined && draft[t.id] !== "")
      .map((t) => ({ teamId: t.id, value: parseFloat(draft[t.id]) }));
    await fetch(`/api/admin/tournaments/${tournament.id}/events/${eventId}/results`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ results: payload }),
    });
    setDraftResults((prev) => { const n = { ...prev }; delete n[eventId]; return n; });
    setSavingResults(null);
    await fetchData();
  }

  async function addEvent(e: React.FormEvent) {
    e.preventDefault();
    if (!tournament || !newEventName.trim()) return;
    setAddingEvent(true);
    const placementStr = newEventPlacements.filter((v) => v !== "").join(",") || null;
    await fetch(`/api/admin/tournaments/${tournament.id}/events`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: newEventName.trim(), scoring_type: newEventType, description: newEventDesc.trim() || null, placement_points: placementStr }),
    });
    setNewEventName("");
    setNewEventDesc("");
    setNewEventPlacements([]);
    setAddingEvent(false);
    setShowAddEvent(false);
    await fetchData();
  }

  async function savePlacements(eventId: string) {
    if (!tournament) return;
    const placementStr = draftPlacements.filter((v) => v !== "").join(",") || null;
    await fetch(`/api/admin/tournaments/${tournament.id}/events/${eventId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ placement_points: placementStr }),
    });
    setEditingPlacements(null);
    await fetchData();
  }

  async function deleteEvent(eventId: string) {
    if (!tournament || !confirm("Ta bort gren och alla dess resultat?")) return;
    await fetch(`/api/admin/tournaments/${tournament.id}/events/${eventId}`, { method: "DELETE" });
    await fetchData();
  }

  async function addTeam(e: React.FormEvent) {
    e.preventDefault();
    if (!tournament || !newTeamName.trim()) return;
    setAddingTeam(true);
    await fetch(`/api/admin/tournaments/${tournament.id}/teams`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: newTeamName.trim(), color: newTeamColor }),
    });
    setNewTeamName("");
    setAddingTeam(false);
    setShowAddTeam(false);
    await fetchData();
  }

  async function removeTeam(teamId: string) {
    if (!tournament) return;
    await fetch(`/api/admin/tournaments/${tournament.id}/teams/${teamId}`, { method: "DELETE" });
    await fetchData();
  }

  const ranking = computeRanking(teams, events, results);

  if (loading) {
    return (
      <div style={{ padding: "60px 24px", textAlign: "center", color: "var(--text-muted)" }}>Laddar...</div>
    );
  }

  if (notFound) {
    return (
      <div style={{ padding: "60px 24px", textAlign: "center" }}>
        <p style={{ color: "var(--text-muted)", fontSize: "15px" }}>Ingen femkamp skapad ännu.</p>
        {isLekledare && (
          <a href="/admin/turnering/ny" style={{ color: "var(--gold)", fontSize: "14px", display: "block", marginTop: "12px" }}>
            Skapa en via admin →
          </a>
        )}
      </div>
    );
  }

  return (
    <div className="page-bg px-4 pt-6 pb-12 max-w-md mx-auto">
      <div className="pt-4 pb-5">
        <p className="page-subtitle mb-1">Mångkamp</p>
        <h1 className="page-title">{tournament?.name ?? "Femkamp"}</h1>
        <div className="gold-rule" />
      </div>

      {/* Scoreboard — alltid synlig */}
      <div className="card p-4 mb-5">
        <p className="text-xs font-semibold uppercase mb-3" style={{ color: "var(--text-muted)", letterSpacing: "0.08em" }}>
          Poängställning
        </p>
        {teams.length === 0 ? (
          <p style={{ fontSize: "14px", color: "var(--text-muted)" }}>Inga lag ännu.</p>
        ) : (
          <div className="space-y-2">
            {ranking.map(({ team, total }, i) => (
              <div key={team.id} style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                <span style={{
                  fontSize: "14px", fontWeight: 700, width: "20px", textAlign: "right",
                  color: i === 0 ? "var(--gold)" : "var(--text-muted)",
                }}>
                  {i + 1}
                </span>
                <div style={{ width: "10px", height: "10px", borderRadius: "50%", background: team.color ?? "#888", flexShrink: 0 }} />
                <span style={{ flex: 1, fontSize: "15px", fontWeight: 600, color: "var(--text-dark)" }}>{team.name}</span>
                <span style={{ fontSize: "15px", fontWeight: 700, color: total > 0 ? "var(--blue-deep)" : "var(--text-muted)" }}>
                  {total > 0 ? `${total} p` : "–"}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Lekledare: lag-hantering */}
      {isLekledare && (
        <div className="card px-4 py-3 mb-5 space-y-3">
          <p style={{ fontSize: "11px", fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--text-muted)", margin: 0 }}>
            Lag
          </p>
          {teams.length > 0 && (
            <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
              {teams.map((t) => (
                <span key={t.id} style={{
                  display: "flex", alignItems: "center", gap: "6px",
                  fontSize: "12px", padding: "4px 10px", borderRadius: "20px", fontWeight: 500,
                  background: (t.color ?? "#888") + "22", color: t.color ?? "#888",
                }}>
                  {t.name}
                  <button onClick={() => removeTeam(t.id)} style={{ lineHeight: 1, fontSize: "14px", opacity: 0.6 }}>×</button>
                </span>
              ))}
            </div>
          )}
          {!showAddTeam ? (
            <button
              onClick={() => setShowAddTeam(true)}
              style={{ fontSize: "13px", color: "var(--gold)", background: "none", border: "none", cursor: "pointer", padding: 0 }}
            >
              + Lägg till lag
            </button>
          ) : (
            <form onSubmit={addTeam} style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              <input
                required
                placeholder="Lagnamn"
                value={newTeamName}
                onChange={(e) => setNewTeamName(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border text-sm outline-none"
                style={{ borderColor: "var(--border)", background: "var(--birch)" }}
              />
              <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "8px" }}>
                {TEAM_COLORS.map((c) => (
                  <button key={c} type="button" onClick={() => setNewTeamColor(c)}
                    style={{ width: "40px", height: "40px", borderRadius: "50%", background: c, border: "none", cursor: "pointer",
                      outline: newTeamColor === c ? `2px solid ${c}` : "none", outlineOffset: "3px" }} />
                ))}
              </div>
              <div style={{ display: "flex", gap: "8px" }}>
                <button type="submit" disabled={addingTeam} className="btn-gold text-sm py-2" style={{ flex: 1 }}>
                  {addingTeam ? "..." : "Skapa lag"}
                </button>
                <button type="button" onClick={() => setShowAddTeam(false)}
                  style={{ padding: "8px 14px", borderRadius: "10px", border: "1px solid var(--border)", background: "transparent", color: "var(--text-muted)", fontSize: "13px", cursor: "pointer" }}>
                  Avbryt
                </button>
              </div>
            </form>
          )}
        </div>
      )}

      {/* Grenar / events */}
      {events.length === 0 && teams.length > 0 && (
        <div className="card p-8 text-center" style={{ color: "var(--text-muted)", marginBottom: "16px" }}>
          {isLekledare ? "Lägg till grenar nedan" : "Inga grenar ännu"}
        </div>
      )}

      <div className="space-y-4">
        {events.map((evt) => {
          const placementPts = parsePlacementPoints(evt.placement_points);
          const isEditingThis = editingPlacements === evt.id;

          // Compute live preview of which team lands where based on draft/saved values
          const evtDraftResults = teams.map((t) => {
            const val = getResultValue(evt.id, t.id);
            return { team: t, raw: val !== "" ? parseFloat(val) : null };
          }).filter((r) => r.raw !== null);
          const sorted = [...evtDraftResults].sort((a, b) =>
            evt.scoring_type === "time" ? (a.raw ?? 0) - (b.raw ?? 0) : (b.raw ?? 0) - (a.raw ?? 0)
          );
          const rankMap: Record<string, number> = {};
          sorted.forEach((r, i) => { rankMap[r.team.id] = i; });

          return (
            <div key={evt.id} className="card p-4">
              <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: "8px" }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontWeight: 600, fontSize: "15px", color: "var(--text-dark)", margin: 0 }}>{evt.name}</p>
                  {evt.description && (
                    <p style={{ fontSize: "12px", color: "var(--text-muted)", margin: "3px 0 0", fontStyle: "italic" }}>
                      {evt.description}
                    </p>
                  )}
                  {/* Placement points legend */}
                  {placementPts && (
                    <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", marginTop: "6px" }}>
                      {placementPts.map((pts, i) => (
                        <span key={i} style={{
                          fontSize: "11px", padding: "2px 8px", borderRadius: "20px",
                          background: "rgba(200,168,75,0.12)", color: "var(--gold)", fontWeight: 600,
                        }}>
                          {PLACE_MEDALS[i]} {pts}p
                        </span>
                      ))}
                    </div>
                  )}
                </div>
                {isLekledare && (
                  <div style={{ display: "flex", gap: "6px", flexShrink: 0, marginLeft: "8px" }}>
                    <button
                      onClick={() => {
                        if (isEditingThis) { setEditingPlacements(null); return; }
                        setDraftPlacements(placementPts ? placementPts.map(String) : Array(teams.length).fill(""));
                        setEditingPlacements(evt.id);
                      }}
                      style={{ fontSize: "12px", color: "var(--gold)", background: "none", border: "none", cursor: "pointer", padding: "4px 6px" }}
                    >
                      {isEditingThis ? "Avbryt" : "Poäng"}
                    </button>
                    <button onClick={() => deleteEvent(evt.id)} style={{ fontSize: "12px", color: "var(--lingon)", background: "none", border: "none", cursor: "pointer", padding: "4px 6px" }}>
                      Ta bort
                    </button>
                  </div>
                )}
              </div>

              {/* Edit placement points inline */}
              {isEditingThis && (
                <div style={{ background: "rgba(200,168,75,0.06)", borderRadius: "10px", padding: "12px", marginBottom: "12px" }}>
                  <p style={{ fontSize: "11px", fontWeight: 600, color: "var(--gold)", letterSpacing: "0.08em", textTransform: "uppercase", margin: "0 0 10px" }}>
                    Poäng per placering
                  </p>
                  <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                    {Array.from({ length: teams.length }).map((_, i) => (
                      <div key={i} style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                        <span style={{ fontSize: "14px", width: "28px", flexShrink: 0 }}>{PLACE_MEDALS[i]}</span>
                        <input
                          type="number" min="0" step="0.5" placeholder="0"
                          value={draftPlacements[i] ?? ""}
                          onChange={(e) => {
                            const next = [...draftPlacements];
                            next[i] = e.target.value;
                            setDraftPlacements(next);
                          }}
                          style={{ width: "80px", padding: "6px 10px", borderRadius: "8px", border: "1px solid var(--border)", background: "var(--birch)", fontSize: "14px", textAlign: "right", color: "var(--blue-deep)" }}
                        />
                        <span style={{ fontSize: "12px", color: "var(--text-muted)" }}>poäng</span>
                      </div>
                    ))}
                  </div>
                  <button
                    onClick={() => savePlacements(evt.id)}
                    className="mt-3 w-full py-2 rounded-lg text-sm font-semibold"
                    style={{ background: "var(--gold)", color: "#1B3F6E" }}
                  >
                    Spara poängfördelning
                  </button>
                </div>
              )}

              {/* Team result inputs */}
              <div className="space-y-2">
                {teams.map((t) => {
                  const val = getResultValue(evt.id, t.id);
                  const rank = rankMap[t.id];
                  const earnedPts = placementPts && rank !== undefined ? (placementPts[rank] ?? 0) : null;
                  return (
                    <div key={t.id} style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                      <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: t.color ?? "#888", flexShrink: 0 }} />
                      <span style={{ flex: 1, fontSize: "14px", color: "var(--text-dark)" }}>{t.name}</span>
                      {earnedPts !== null && val !== "" && (
                        <span style={{ fontSize: "11px", fontWeight: 600, color: "var(--gold)", minWidth: "32px", textAlign: "right" }}>
                          {earnedPts}p
                        </span>
                      )}
                      {isLekledare ? (
                        <input
                          type="number" min="0" step="0.01" placeholder="—"
                          value={val}
                          onChange={(e) => setDraftValue(evt.id, t.id, e.target.value)}
                          className="w-20 px-2 py-1.5 rounded-lg border text-sm text-right outline-none tabular-nums"
                          style={{ borderColor: "var(--border)", background: "var(--birch)", color: "var(--blue-deep)" }}
                        />
                      ) : (
                        <span style={{ fontSize: "14px", fontWeight: 600, color: val ? "var(--blue-deep)" : "var(--text-muted)" }}>
                          {val || "—"}
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>

              {isLekledare && (
                <button
                  onClick={() => saveResults(evt.id)}
                  disabled={savingResults === evt.id}
                  className="mt-3 w-full py-2 rounded-lg text-sm font-semibold"
                  style={{ background: "rgba(27,63,110,0.1)", color: "var(--blue-deep)" }}
                >
                  {savingResults === evt.id ? "Sparar..." : "Spara resultat"}
                </button>
              )}
            </div>
          );
        })}
      </div>

      {/* Lägg till gren */}
      {isLekledare && (
        <div className="mt-5">
          {!showAddEvent ? (
            <button
              onClick={() => {
                setNewEventPlacements(Array(Math.max(teams.length, 3)).fill(""));
                setShowAddEvent(true);
              }}
              className="w-full py-3 rounded-xl text-sm font-semibold"
              style={{ background: "rgba(200,168,75,0.12)", color: "var(--gold)", border: "1px solid rgba(200,168,75,0.3)" }}
            >
              + Lägg till gren
            </button>
          ) : (
            <form onSubmit={addEvent} className="card px-4 py-4 space-y-3">
              <p style={{ fontWeight: 600, fontSize: "14px", color: "var(--text-dark)", margin: 0 }}>Ny gren</p>
              <input
                required placeholder="Grennamn (t.ex. Stavhopp)" value={newEventName}
                onChange={(e) => setNewEventName(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border text-sm outline-none"
                style={{ borderColor: "var(--border)", background: "var(--birch)" }}
              />
              <textarea
                placeholder="Regler (valfritt)" value={newEventDesc}
                onChange={(e) => setNewEventDesc(e.target.value)}
                rows={2}
                className="w-full px-3 py-2 rounded-lg border text-sm outline-none resize-none"
                style={{ borderColor: "var(--border)", background: "var(--birch)" }}
              />
              <div style={{ display: "flex", gap: "8px" }}>
                {(["points", "time"] as const).map((t) => (
                  <button key={t} type="button" onClick={() => setNewEventType(t)}
                    className="flex-1 py-2 rounded-lg text-xs font-medium"
                    style={{
                      background: newEventType === t ? "var(--blue-deep)" : "var(--birch)",
                      color: newEventType === t ? "white" : "var(--text-muted)",
                      border: "1px solid var(--border)",
                    }}>
                    <div>{t === "points" ? "Poäng" : "Tid"}</div>
                    <div style={{ fontSize: "10px", opacity: 0.7, marginTop: "2px" }}>{t === "points" ? "Högst vinner" : "Lägst vinner"}</div>
                  </button>
                ))}
              </div>

              {/* Placement points */}
              <div>
                <p style={{ fontSize: "11px", fontWeight: 600, color: "var(--gold)", letterSpacing: "0.08em", textTransform: "uppercase", margin: "0 0 8px" }}>
                  Poäng per placering
                </p>
                <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                  {newEventPlacements.map((v, i) => (
                    <div key={i} style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                      <span style={{ fontSize: "14px", width: "28px", flexShrink: 0 }}>{PLACE_MEDALS[i]}</span>
                      <input
                        type="number" min="0" step="0.5" placeholder="0"
                        value={v}
                        onChange={(e) => {
                          const next = [...newEventPlacements];
                          next[i] = e.target.value;
                          setNewEventPlacements(next);
                        }}
                        style={{ width: "80px", padding: "6px 10px", borderRadius: "8px", border: "1px solid var(--border)", background: "var(--birch)", fontSize: "14px", textAlign: "right", color: "var(--blue-deep)" }}
                      />
                      <span style={{ fontSize: "12px", color: "var(--text-muted)" }}>poäng</span>
                    </div>
                  ))}
                </div>
              </div>

              <div style={{ display: "flex", gap: "8px" }}>
                <button type="submit" disabled={addingEvent} className="btn-gold text-sm py-2" style={{ flex: 1 }}>
                  {addingEvent ? "..." : "Lägg till gren"}
                </button>
                <button type="button" onClick={() => setShowAddEvent(false)}
                  style={{ padding: "8px 14px", borderRadius: "10px", border: "1px solid var(--border)", background: "transparent", color: "var(--text-muted)", fontSize: "13px", cursor: "pointer" }}>
                  Avbryt
                </button>
              </div>
            </form>
          )}
        </div>
      )}
    </div>
  );
}
