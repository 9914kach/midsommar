"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useUser } from "@/lib/useUser";
import { DndContext, DragEndEvent, PointerSensor, TouchSensor, useSensor, useSensors } from "@dnd-kit/core";
import { SortableContext, useSortable, verticalListSortingStrategy, arrayMove } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

type Tournament = { id: string; name: string; status: string };
type TTeam = { id: string; name: string; color: string | null; official_team_id: string | null };
type TEvent = { id: string; name: string; scoring_type: string; description: string | null; placement_points: string | null; sort_order: number };
type EventResult = { event_id: string; tournament_team_id: string; value: number | null };

const PLACE_MEDALS = ["🥇", "🥈", "🥉", "4.", "5.", "6.", "7.", "8."];

function parsePlacementPoints(raw: string | null): number[] | null {
  if (!raw) return null;
  const pts = raw.split(",").map((v) => parseFloat(v.trim()));
  if (pts.some(isNaN) || pts.length === 0) return null;
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
      const sorted = [...evtResults].sort((a, b) =>
        evt.scoring_type === "time"
          ? (a.value ?? 0) - (b.value ?? 0)
          : (b.value ?? 0) - (a.value ?? 0)
      );
      // Ties: average placement points across tied positions
      let i = 0;
      while (i < sorted.length) {
        const val = sorted[i].value;
        let j = i;
        while (j < sorted.length && sorted[j].value === val) j++;
        const sharedPts = placementPts.slice(i, j).reduce((s, p) => s + p, 0) / (j - i);
        for (let k = i; k < j; k++) {
          totals[sorted[k].tournament_team_id] = (totals[sorted[k].tournament_team_id] ?? 0) + sharedPts;
        }
        i = j;
      }
    } else if (evt.scoring_type === "points") {
      for (const r of evtResults) totals[r.tournament_team_id] = (totals[r.tournament_team_id] ?? 0) + (r.value ?? 0);
    } else {
      const sorted = [...evtResults].sort((a, b) => (b.value ?? 0) - (a.value ?? 0));
      let i = 0;
      while (i < sorted.length) {
        const val = sorted[i].value;
        let j = i;
        while (j < sorted.length && sorted[j].value === val) j++;
        const sharedPts = Array.from({ length: j - i }, (_, k) => teams.length - (i + k)).reduce((s, p) => s + p, 0) / (j - i);
        for (let k = i; k < j; k++) {
          totals[sorted[k].tournament_team_id] = (totals[sorted[k].tournament_team_id] ?? 0) + sharedPts;
        }
        i = j;
      }
    }
  }
  return teams.map((t) => ({ team: t, total: totals[t.id] ?? 0 })).sort((a, b) => b.total - a.total);
}

function computeEventRanking(teams: TTeam[], evt: TEvent, results: EventResult[]) {
  const evtResults = results.filter((r) => r.event_id === evt.id && r.value != null);
  if (evtResults.length === 0) return [];
  const sorted = [...evtResults].sort((a, b) =>
    evt.scoring_type === "time"
      ? (a.value ?? 0) - (b.value ?? 0)
      : (b.value ?? 0) - (a.value ?? 0)
  );
  // Assign same rank to tied values
  const ranked: { team: TTeam; value: number | null; rank: number }[] = [];
  let rank = 0;
  for (let i = 0; i < sorted.length; i++) {
    if (i > 0 && sorted[i].value !== sorted[i - 1].value) rank = i;
    const team = teams.find((t) => t.id === sorted[i].tournament_team_id);
    if (team) ranked.push({ team, value: sorted[i].value, rank });
  }
  return ranked;
}

function SortableItem({ id, disabled, children }: {
  id: string;
  disabled?: boolean;
  children: (drag: { listeners: ReturnType<typeof useSortable>["listeners"]; attributes: ReturnType<typeof useSortable>["attributes"] }) => React.ReactNode;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id, disabled });
  return (
    <div ref={setNodeRef} style={{ transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.4 : 1, zIndex: isDragging ? 10 : undefined, position: "relative" }}>
      {children({ listeners, attributes })}
    </div>
  );
}

export default function FemkampPage() {
  const me = useUser();
  const isLekledare = me.is("lekledare");

  const [tournament, setTournament] = useState<Tournament | null>(null);
  const [teams, setTeams] = useState<TTeam[]>([]);
  const [events, setEvents] = useState<TEvent[]>([]);
  const [results, setResults] = useState<EventResult[]>([]);
  const [activeEventId, setActiveEventId] = useState<string | null>(null);
  const [activeEventOpen, setActiveEventOpen] = useState(true);
  const [femkampFinished, setFemkampFinished] = useState(false);
  const [draftResults, setDraftResults] = useState<Record<string, Record<string, string>>>({});
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  // Create tournament
  const [creating, setCreating] = useState(false);
  const [newTournamentName, setNewTournamentName] = useState("Femkamp");

  // Sync teams
  const [syncing, setSyncing] = useState(false);

  // Add event (setup)
  const [showAddEvent, setShowAddEvent] = useState(false);
  const [newEventName, setNewEventName] = useState("");
  const [newEventDesc, setNewEventDesc] = useState("");
  const [newEventType, setNewEventType] = useState<"points" | "time">("points");
  const [newEventPlacements, setNewEventPlacements] = useState<string[]>(["10", "7", "5", "3"]);
  const [addingEvent, setAddingEvent] = useState(false);

  const [autoSaving, setAutoSaving] = useState(false);
  const autoSaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Edit placement points
  const [editingPlacements, setEditingPlacements] = useState<string | null>(null);
  const [draftPlacements, setDraftPlacements] = useState<string[]>([]);

  // Penalty / bonus
  const [showPenalty, setShowPenalty] = useState(false);
  const [penaltyLabel, setPenaltyLabel] = useState("");
  const [penaltyValues, setPenaltyValues] = useState<Record<string, string>>({});
  const [addingPenalty, setAddingPenalty] = useState(false);

  // Start tournament
  const [starting, setStarting] = useState(false);

  // Edit mode (lekledare only)
  const [editMode, setEditMode] = useState(false);

  // Reset / delete / finish
  const [resetting, setResetting] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [finishing, setFinishing] = useState(false);

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

    const [{ data: teamsData }, { data: eventsData }, { data: activeSetting }, { data: finishedSetting }] = await Promise.all([
      supabase.from("tournament_teams").select("id, name, color, official_team_id").eq("tournament_id", t.id),
      supabase.from("tournament_events").select("id, name, scoring_type, description, placement_points, sort_order").eq("tournament_id", t.id).order("sort_order").order("created_at"),
      supabase.from("app_settings").select("value").eq("key", "femkamp_active_event").maybeSingle(),
      supabase.from("app_settings").select("value").eq("key", "femkamp_finished").maybeSingle(),
    ]);

    const rawTeams = (teamsData as TTeam[]) ?? [];
    const seenTeamIds = new Set<string>();
    const fetchedTeams = rawTeams.filter((t) => {
      const key = t.official_team_id ?? t.id;
      if (seenTeamIds.has(key)) return false;
      seenTeamIds.add(key);
      return true;
    });
    setTeams(fetchedTeams);
    setEvents((eventsData as unknown as TEvent[]) ?? []);
    setActiveEventId(activeSetting?.value ?? null);
    setFemkampFinished(!!finishedSetting?.value);

    if (fetchedTeams.length > 0) {
      const { data: res } = await supabase
        .from("tournament_event_results")
        .select("*")
        .in("tournament_team_id", fetchedTeams.map((t) => t.id));
      setResults((res as EventResult[]) ?? []);
    }

    setLoading(false);
  }

  const teamsRef = useRef<TTeam[]>([]);
  const tournamentIdRef = useRef<string | null>(null);
  const activeEventLockedUntil = useRef<number>(0);
  const femkampFinishedLockedUntil = useRef<number>(0);
  useEffect(() => { teamsRef.current = teams; }, [teams]);
  useEffect(() => { tournamentIdRef.current = tournament?.id ?? null; }, [tournament]);

  useEffect(() => { fetchData(); }, []);

  // Poll live data every 3s for all users
  useEffect(() => {
    async function pollLive() {
      const tid = tournamentIdRef.current;
      if (!tid) return;
      const [{ data: activeSetting }, { data: res }, { data: finishedSetting }] = await Promise.all([
        supabase.from("app_settings").select("value").eq("key", "femkamp_active_event").maybeSingle(),
        teamsRef.current.length > 0
          ? supabase.from("tournament_event_results").select("*").in("tournament_team_id", teamsRef.current.map((t) => t.id))
          : Promise.resolve({ data: null }),
        supabase.from("app_settings").select("value").eq("key", "femkamp_finished").maybeSingle(),
      ]);
      if (Date.now() > activeEventLockedUntil.current) {
        setActiveEventId(activeSetting?.value ?? null);
      }
      if (res) setResults(res as EventResult[]);
      if (Date.now() > femkampFinishedLockedUntil.current) {
        setFemkampFinished(!!finishedSetting?.value);
      }
    }
    const interval = setInterval(pollLive, 3000);
    return () => clearInterval(interval);
  }, []);

  async function syncOfficialTeams(tournamentId: string) {
    setSyncing(true);
    const [{ data: officialTeams }, { data: currentTeams }, { data: existingResults }] = await Promise.all([
      supabase.from("official_teams").select("id, name, color").order("created_at"),
      supabase.from("tournament_teams").select("id, name, color, official_team_id").eq("tournament_id", tournamentId),
      supabase.from("tournament_event_results").select("tournament_team_id"),
    ]);
    if (!officialTeams) { setSyncing(false); return; }

    const existing = (currentTeams as TTeam[]) ?? [];
    const officialIds = new Set(officialTeams.map((ot) => ot.id));
    const teamIdsWithResults = new Set((existingResults ?? []).map((r) => r.tournament_team_id));

    // Desired state: exactly one tournament_team per official_team.
    // Keep the row that has results (or first if none), delete everything else.
    const keepIds = new Set<string>();
    const grouped: Record<string, TTeam[]> = {};
    for (const t of existing) {
      const key = t.official_team_id ?? "__null__";
      (grouped[key] ??= []).push(t);
    }
    for (const [key, group] of Object.entries(grouped)) {
      if (key === "__null__") continue;         // orphans → delete all
      if (!officialIds.has(key)) continue;      // stale   → delete all
      const canonical = group.find((t) => teamIdsWithResults.has(t.id)) ?? group[0];
      keepIds.add(canonical.id);
    }

    const toDeleteIds = existing.filter((t) => !keepIds.has(t.id)).map((t) => t.id);

    if (toDeleteIds.length > 0) {
      // Clean up dependent rows first, then the teams themselves — all via Supabase directly
      await supabase.from("tournament_event_results").delete().in("tournament_team_id", toDeleteIds);
      await supabase.from("tournament_team_members").delete().in("tournament_team_id", toDeleteIds);
      await supabase.from("matches").delete().in("team_a_id", toDeleteIds);
      await supabase.from("matches").delete().in("team_b_id", toDeleteIds);
      await supabase.from("tournament_teams").delete().in("id", toDeleteIds);
    }

    // Re-fetch after deletes to get accurate remaining state before adding
    const { data: afterDelete } = await supabase
      .from("tournament_teams")
      .select("official_team_id")
      .eq("tournament_id", tournamentId);
    const linkedIds = new Set((afterDelete ?? []).map((t) => t.official_team_id).filter(Boolean));

    const toAdd = officialTeams.filter((ot) => !linkedIds.has(ot.id));
    if (toAdd.length > 0) {
      await supabase.from("tournament_teams").insert(
        toAdd.map((ot) => ({ tournament_id: tournamentId, name: ot.name, color: ot.color, official_team_id: ot.id }))
      );
    }

    setSyncing(false);
    await fetchData();
  }

  async function createTournament(e: React.FormEvent) {
    e.preventDefault();
    if (!newTournamentName.trim()) return;
    setCreating(true);
    const res = await fetch("/api/admin/tournaments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: newTournamentName.trim(), game: "Femkamp", format: "multi_event" }),
    });
    if (res.ok) {
      const { tournament: created } = await res.json();
      setNotFound(false);
      setLoading(true);
      await syncOfficialTeams(created.id);
    }
    setCreating(false);
  }

  async function addEvent(e: React.FormEvent) {
    e.preventDefault();
    if (!tournament || !newEventName.trim()) return;
    setAddingEvent(true);
    const placementStr = newEventPlacements.filter((v) => v !== "").join(",") || null;
    await fetch(`/api/admin/tournaments/${tournament.id}/events`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: newEventName.trim(), scoring_type: newEventType, description: newEventDesc.trim() || null, placement_points: placementStr, sort_order: events.length }),
    });
    setNewEventName("");
    setNewEventDesc("");
    setNewEventPlacements(["10", "7", "5", "3"]);
    setAddingEvent(false);
    setShowAddEvent(false);
    await fetchData();
  }

  async function deleteEvent(eventId: string) {
    if (!tournament || !confirm("Ta bort gren och alla dess resultat?")) return;
    await fetch(`/api/admin/tournaments/${tournament.id}/events/${eventId}`, { method: "DELETE" });
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

  async function startTournament() {
    if (!tournament) return;
    setStarting(true);
    // Sync teams first
    await syncOfficialTeams(tournament.id);
    // Set first event as active if exists
    if (events.length > 0) {
      await fetch("/api/admin/femkamp/active-event", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ eventId: events[0].id }),
      });
    }
    await fetch(`/api/admin/tournaments/${tournament.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "active" }),
    });
    setStarting(false);
    await fetchData();
  }

  async function submitPenalty(e: React.FormEvent) {
    e.preventDefault();
    if (!tournament || !penaltyLabel.trim()) return;
    setAddingPenalty(true);
    const evtRes = await fetch(`/api/admin/tournaments/${tournament.id}/events`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: penaltyLabel.trim(), scoring_type: "points", sort_order: events.length }),
    });
    const { event } = await evtRes.json();
    const payload = teams
      .filter((t) => penaltyValues[t.id] !== undefined && penaltyValues[t.id] !== "")
      .map((t) => ({ teamId: t.id, value: parseFloat(penaltyValues[t.id]) }));
    if (payload.length > 0) {
      await fetch(`/api/admin/tournaments/${tournament.id}/events/${event.id}/results`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ results: payload }),
      });
    }
    setPenaltyLabel("");
    setPenaltyValues({});
    setShowPenalty(false);
    setAddingPenalty(false);
    await fetchData();
  }

  async function deleteFemkamp() {
    if (!tournament) return;
    if (!confirm("Ta bort hela femkampen? Alla grenar, lag och resultat raderas permanent.")) return;
    setDeleting(true);
    await fetch(`/api/admin/tournaments/${tournament.id}`, { method: "DELETE" });
    setTournament(null);
    setTeams([]);
    setEvents([]);
    setResults([]);
    setActiveEventId(null);
    setDraftResults({});
    setEditMode(false);
    setNotFound(true);
    setDeleting(false);
  }

  async function resetFemkamp() {
    if (!tournament) return;
    if (!confirm("Nollställ alla resultat i femkampen? Det går inte att ångra.")) return;
    setResetting(true);
    await fetch(`/api/admin/tournaments/${tournament.id}/reset`, { method: "POST" });
    setDraftResults({});
    setActiveEventId(null);
    setResetting(false);
    await fetchData();
  }

  async function finishFemkamp() {
    if (!tournament) return;
    if (!confirm("Avsluta femkampen och visa prispallen för alla gäster?")) return;
    setFinishing(true);
    setFemkampFinished(true);
    femkampFinishedLockedUntil.current = Date.now() + 8000;
    await supabase.from("app_settings").upsert({ key: "femkamp_finished", value: "1" });
    setFinishing(false);
  }

  async function reopenFemkamp() {
    setFemkampFinished(false);
    femkampFinishedLockedUntil.current = Date.now() + 8000;
    await supabase.from("app_settings").delete().eq("key", "femkamp_finished");
  }

  async function reorderEvents(orderedIds: string[]) {
    if (!tournament) return;
    await Promise.all(
      orderedIds.map((id, idx) =>
        fetch(`/api/admin/tournaments/${tournament!.id}/events/${id}`, {
          method: "PATCH", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ sort_order: idx }),
        })
      )
    );
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIdx = events.findIndex((e) => e.id === active.id);
    const newIdx = events.findIndex((e) => e.id === over.id);
    if (oldIdx === -1 || newIdx === -1) return;
    const reordered = arrayMove(events, oldIdx, newIdx);
    setEvents(reordered);
    reorderEvents(reordered.map((e) => e.id));
  }

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 8 } })
  );

  async function setActiveEvent(eventId: string) {
    setActiveEventId(eventId);
    setActiveEventOpen(true);
    activeEventLockedUntil.current = Date.now() + 5000;
    await fetch("/api/admin/femkamp/active-event", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ eventId }),
    });
  }

  function getResultValue(eventId: string, teamId: string): string {
    if (draftResults[eventId]?.[teamId] !== undefined) return draftResults[eventId][teamId];
    const r = results.find((r) => r.event_id === eventId && r.tournament_team_id === teamId);
    return r?.value != null ? String(r.value) : "";
  }

  function setDraftValue(eventId: string, teamId: string, val: string) {
    setDraftResults((prev) => ({ ...prev, [eventId]: { ...(prev[eventId] ?? {}), [teamId]: val } }));
  }

  async function refreshResults(teamIds: string[]) {
    if (teamIds.length === 0) return;
    const { data: res } = await supabase
      .from("tournament_event_results")
      .select("*")
      .in("tournament_team_id", teamIds);
    setResults((res as EventResult[]) ?? []);
  }

  const saveResults = useCallback(async (tournamentId: string, eventId: string, draft: Record<string, string>, currentTeams: TTeam[]) => {
    const payload = currentTeams
      .filter((t) => draft[t.id] !== undefined && draft[t.id] !== "")
      .map((t) => ({ teamId: t.id, value: parseFloat(draft[t.id]) }));
    if (payload.length === 0) return;
    await fetch(`/api/admin/tournaments/${tournamentId}/events/${eventId}/results`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ results: payload }),
    });
    await refreshResults(currentTeams.map((t) => t.id));
    setDraftResults((prev) => { const n = { ...prev }; delete n[eventId]; return n; });
  }, []);

  function setDraftValueAndScheduleSave(eventId: string, teamId: string, val: string) {
    setDraftResults((prev) => {
      const next = { ...prev, [eventId]: { ...(prev[eventId] ?? {}), [teamId]: val } };
      if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current);
      autoSaveTimer.current = setTimeout(async () => {
        if (!tournament) return;
        setAutoSaving(true);
        await saveResults(tournament.id, eventId, next[eventId] ?? {}, teams);
        setAutoSaving(false);
      }, 800);
      return next;
    });
  }

  // Merge saved results with in-progress drafts for live preview
  const liveResults = (() => {
    const merged = [...results];
    for (const [eventId, teamDrafts] of Object.entries(draftResults)) {
      for (const [teamId, val] of Object.entries(teamDrafts)) {
        if (val === "") continue;
        const num = parseFloat(val);
        if (isNaN(num)) continue;
        const idx = merged.findIndex((r) => r.event_id === eventId && r.tournament_team_id === teamId);
        if (idx >= 0) merged[idx] = { ...merged[idx], value: num };
        else merged.push({ event_id: eventId, tournament_team_id: teamId, value: num });
      }
    }
    return merged;
  })();

  const ranking = computeRanking(teams, events, liveResults);
  const activeEvent = events.find((e) => e.id === activeEventId) ?? null;
  const activeRanking = activeEvent ? computeEventRanking(teams, activeEvent, liveResults) : [];
  const activePlacementPts = activeEvent ? parsePlacementPoints(activeEvent.placement_points) : null;

  if (loading) {
    return <div style={{ padding: "60px 24px", textAlign: "center", color: "var(--text-muted)" }}>Laddar...</div>;
  }

  // ─── NOT FOUND ───────────────────────────────────────────────────────────────
  if (notFound) {
    return (
      <div className="page-bg px-4 pt-6 pb-12 max-w-md mx-auto">
        <div className="pt-4 pb-5">
          <p className="page-subtitle mb-1">Mångkamp</p>
          <h1 className="page-title">Femkamp</h1>
          <div className="gold-rule" />
        </div>
        {isLekledare ? (
          <div className="card px-4 py-5">
            <p style={{ fontWeight: 600, fontSize: "15px", color: "var(--text-dark)", marginBottom: "16px" }}>Skapa femkamp</p>
            <form onSubmit={createTournament} style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              <input
                required placeholder="Namn (t.ex. Femkamp 2026)"
                value={newTournamentName} onChange={(e) => setNewTournamentName(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border text-sm outline-none"
                style={{ borderColor: "var(--border)", background: "var(--birch)" }}
              />
              <button type="submit" disabled={creating} className="btn-gold">
                {creating ? "Skapar..." : "Skapa"}
              </button>
            </form>
          </div>
        ) : (
          <p style={{ textAlign: "center", color: "var(--text-muted)", fontSize: "15px" }}>Ingen femkamp skapad ännu.</p>
        )}
      </div>
    );
  }

  // ─── SETUP VIEW (draft) ───────────────────────────────────────────────────────
  if (tournament?.status === "draft") {
    return (
      <div className="page-bg px-4 pt-6 pb-12 max-w-md mx-auto">
        <div className="pt-4 pb-5">
          <p className="page-subtitle mb-1">Förberedelse</p>
          <h1 className="page-title">{tournament.name}</h1>
          <div className="gold-rule" />
          <p className="text-sm mt-2" style={{ color: "var(--text-muted)" }}>
            Lägg till grenar och poängfördelning innan du startar.
          </p>
        </div>

        {/* Lag preview */}
        <div className="card px-4 py-3 mb-4">
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: teams.length > 0 ? "10px" : 0 }}>
            <p style={{ fontSize: "11px", fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--text-muted)", margin: 0 }}>
              Officiella lag ({teams.length})
            </p>
            {isLekledare && (
              <button onClick={() => syncOfficialTeams(tournament.id)} disabled={syncing}
                style={{ fontSize: "12px", color: "var(--gold)", background: "none", border: "none", cursor: "pointer" }}>
                {syncing ? "Synkar..." : "↻ Synka"}
              </button>
            )}
          </div>
          {teams.length > 0 ? (
            <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
              {teams.map((t) => (
                <span key={t.id} style={{
                  fontSize: "12px", padding: "3px 10px", borderRadius: "20px", fontWeight: 500,
                  background: (t.color ?? "#888") + "22", color: t.color ?? "#888",
                }}>{t.name}</span>
              ))}
            </div>
          ) : (
            <p style={{ fontSize: "13px", color: "var(--text-muted)", margin: 0 }}>Inga officiella lag ännu — gå till Lag-sidan.</p>
          )}
        </div>

        {/* Events list */}
        {events.length > 0 && (
          <div className="space-y-3 mb-4">
            {events.map((evt, i) => {
              const pts = parsePlacementPoints(evt.placement_points);
              return (
                <div key={evt.id} className="card px-4 py-3">
                  <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
                    <div style={{ flex: 1 }}>
                      <p style={{ fontWeight: 600, fontSize: "14px", color: "var(--text-dark)", margin: 0 }}>
                        {i + 1}. {evt.name}
                      </p>
                      {evt.description && (
                        <p style={{ fontSize: "12px", color: "var(--text-muted)", margin: "3px 0 0", fontStyle: "italic" }}>{evt.description}</p>
                      )}
                      {pts && (
                        <div style={{ display: "flex", gap: "6px", flexWrap: "wrap", marginTop: "6px" }}>
                          {pts.map((p, j) => (
                            <span key={j} style={{ fontSize: "11px", padding: "2px 8px", borderRadius: "20px", background: "rgba(200,168,75,0.12)", color: "var(--gold)", fontWeight: 600 }}>
                              {PLACE_MEDALS[j]} {p}p
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                    {isLekledare && (
                      <button onClick={() => deleteEvent(evt.id)}
                        style={{ fontSize: "12px", color: "var(--lingon)", background: "none", border: "none", cursor: "pointer", padding: "2px 6px", flexShrink: 0 }}>
                        Ta bort
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Add event form */}
        {isLekledare && (
          <>
            {!showAddEvent ? (
              <button
                onClick={() => setShowAddEvent(true)}
                className="w-full py-3 rounded-xl text-sm font-semibold mb-5"
                style={{ background: "rgba(200,168,75,0.12)", color: "var(--gold)", border: "1px solid rgba(200,168,75,0.3)" }}
              >
                + Lägg till gren
              </button>
            ) : (
              <form onSubmit={addEvent} className="card px-4 py-4 space-y-3 mb-5">
                <p style={{ fontWeight: 600, fontSize: "14px", color: "var(--text-dark)", margin: 0 }}>Ny gren</p>
                <input
                  required placeholder="Grennamn (t.ex. Stavhopp)" value={newEventName}
                  onChange={(e) => setNewEventName(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border text-sm outline-none"
                  style={{ borderColor: "var(--border)", background: "var(--birch)" }}
                />
                <textarea
                  placeholder="Regler (valfritt)" value={newEventDesc}
                  onChange={(e) => setNewEventDesc(e.target.value)} rows={2}
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
                <div>
                  <p style={{ fontSize: "11px", fontWeight: 600, color: "var(--gold)", letterSpacing: "0.08em", textTransform: "uppercase", margin: "0 0 8px" }}>
                    Poäng per placering
                  </p>
                  <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                    {newEventPlacements.map((v, i) => (
                      <div key={i} style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                        <span style={{ fontSize: "14px", width: "28px", flexShrink: 0 }}>{PLACE_MEDALS[i]}</span>
                        <input
                          type="number" min="0" step="0.5" placeholder="0" value={v}
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
                    {addingEvent ? "..." : "Lägg till"}
                  </button>
                  <button type="button" onClick={() => setShowAddEvent(false)}
                    style={{ padding: "8px 14px", borderRadius: "10px", border: "1px solid var(--border)", background: "transparent", color: "var(--text-muted)", fontSize: "13px", cursor: "pointer" }}>
                    Avbryt
                  </button>
                </div>
              </form>
            )}

            {events.length > 0 && (
              <button
                onClick={startTournament}
                disabled={starting || teams.length === 0}
                className="btn-primary w-full py-4"
                style={{ fontSize: "16px", fontWeight: 700 }}
              >
                {starting ? "Startar..." : "🏁 Starta femkamp"}
              </button>
            )}
          </>
        )}
      </div>
    );
  }

  // ─── LIVE VIEW (active / completed) ──────────────────────────────────────────
  return (
    <div className="page-bg px-4 pt-6 pb-12 max-w-md mx-auto">
      <div className="pt-4 pb-3">
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
          <div>
            <p className="page-subtitle mb-1">Mångkamp</p>
            <h1 className="page-title">{tournament?.name ?? "Femkamp"}</h1>
          </div>
          {isLekledare && (
            <button
              onClick={() => setEditMode((m) => !m)}
              style={{
                marginTop: "8px", padding: "6px 14px", borderRadius: "20px", fontSize: "13px", fontWeight: 600,
                border: editMode ? "1px solid var(--gold)" : "1px solid var(--border)",
                background: editMode ? "rgba(200,168,75,0.12)" : "transparent",
                color: editMode ? "var(--gold)" : "var(--text-muted)", cursor: "pointer",
              }}
            >
              {editMode ? "✓ Klar" : "✏️ Redigera"}
            </button>
          )}
        </div>
        <div className="gold-rule" />
      </div>

      {/* ── Total standings ── */}
      <div className="card p-4 mb-4">
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "12px" }}>
          <p style={{ fontSize: "11px", fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--text-muted)", margin: 0 }}>
            Totalpoäng
          </p>
          {isLekledare && (
            <button
              onClick={() => syncOfficialTeams(tournament!.id)}
              disabled={syncing}
              style={{ fontSize: "11px", color: "var(--blue-deep)", background: "none", border: "none", cursor: syncing ? "default" : "pointer", opacity: syncing ? 0.5 : 1, padding: "2px 0" }}
            >
              {syncing ? "Synkar..." : "↻ Synka lag"}
            </button>
          )}
        </div>
        {teams.length === 0 ? (
          <p style={{ fontSize: "14px", color: "var(--text-muted)" }}>Inga lag.</p>
        ) : (
          <div className="space-y-2">
            {ranking.map(({ team, total }, i) => (
              <div key={team.id} style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                <span style={{ fontSize: "14px", fontWeight: 700, width: "20px", textAlign: "right", color: i === 0 ? "var(--gold)" : "var(--text-muted)" }}>
                  {i + 1}
                </span>
                <div style={{ width: "10px", height: "10px", borderRadius: "50%", background: team.color ?? "#888", flexShrink: 0 }} />
                <span style={{ flex: 1, fontSize: "15px", fontWeight: 600, color: "var(--text-dark)" }}>{team.name}</span>
                <span style={{ fontSize: "16px", fontWeight: 800, color: total > 0 ? "var(--blue-deep)" : "var(--text-muted)" }}>
                  {total > 0 ? `${total}p` : "–"}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Podium (finished) ── */}
      {femkampFinished && (
        <div className="mb-4">
          <div style={{ textAlign: "center", marginBottom: "20px" }}>
            <p style={{ fontSize: "32px", margin: "0 0 4px" }}>🏆</p>
            <p style={{ fontFamily: "var(--font-playfair), 'Playfair Display', Georgia, serif", fontSize: "22px", fontWeight: 700, color: "var(--blue-deep)", margin: 0 }}>
              Prispall
            </p>
          </div>

          {ranking.length >= 3 ? (
            <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "center", gap: "8px", marginBottom: "16px" }}>
              {/* 2nd */}
              <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: "5px" }}>
                <div style={{ width: "10px", height: "10px", borderRadius: "50%", background: ranking[1].team.color ?? "#888" }} />
                <p style={{ fontSize: "12px", fontWeight: 700, color: "var(--text-dark)", margin: 0, textAlign: "center", lineHeight: 1.2 }}>{ranking[1].team.name}</p>
                <p style={{ fontSize: "11px", color: "var(--text-muted)", margin: 0 }}>{ranking[1].total}p</p>
                <div style={{ width: "100%", height: "56px", background: "rgba(74,127,173,0.15)", borderRadius: "8px 8px 0 0", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <span style={{ fontSize: "26px" }}>🥈</span>
                </div>
              </div>
              {/* 1st */}
              <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: "5px" }}>
                <div style={{ width: "12px", height: "12px", borderRadius: "50%", background: ranking[0].team.color ?? "#888" }} />
                <p style={{ fontSize: "14px", fontWeight: 800, color: "var(--text-dark)", margin: 0, textAlign: "center", lineHeight: 1.2 }}>{ranking[0].team.name}</p>
                <p style={{ fontSize: "12px", color: "var(--gold)", fontWeight: 700, margin: 0 }}>{ranking[0].total}p</p>
                <div style={{ width: "100%", height: "84px", background: "rgba(200,168,75,0.18)", borderRadius: "8px 8px 0 0", display: "flex", alignItems: "center", justifyContent: "center", border: "1.5px solid rgba(200,168,75,0.4)" }}>
                  <span style={{ fontSize: "36px" }}>🥇</span>
                </div>
              </div>
              {/* 3rd */}
              <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: "5px" }}>
                <div style={{ width: "10px", height: "10px", borderRadius: "50%", background: ranking[2].team.color ?? "#888" }} />
                <p style={{ fontSize: "12px", fontWeight: 700, color: "var(--text-dark)", margin: 0, textAlign: "center", lineHeight: 1.2 }}>{ranking[2].team.name}</p>
                <p style={{ fontSize: "11px", color: "var(--text-muted)", margin: 0 }}>{ranking[2].total}p</p>
                <div style={{ width: "100%", height: "40px", background: "rgba(139,38,53,0.1)", borderRadius: "8px 8px 0 0", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <span style={{ fontSize: "20px" }}>🥉</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="card p-4 mb-4">
              {ranking.map(({ team, total }, i) => (
                <div key={team.id} style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: i < ranking.length - 1 ? "8px" : 0 }}>
                  <span style={{ fontSize: "18px" }}>{PLACE_MEDALS[i]}</span>
                  <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: team.color ?? "#888", flexShrink: 0 }} />
                  <span style={{ flex: 1, fontSize: "15px", fontWeight: 600 }}>{team.name}</span>
                  <span style={{ fontSize: "14px", color: "var(--text-muted)" }}>{total}p</span>
                </div>
              ))}
            </div>
          )}

          {ranking.length > 3 && (
            <div className="card p-4 mb-4" style={{ marginTop: "0" }}>
              {ranking.slice(3).map(({ team, total }, i) => (
                <div key={team.id} style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: i < ranking.length - 4 ? "8px" : 0 }}>
                  <span style={{ fontSize: "14px", fontWeight: 700, width: "24px", textAlign: "right", color: "var(--text-muted)" }}>{i + 4}.</span>
                  <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: team.color ?? "#888", flexShrink: 0 }} />
                  <span style={{ flex: 1, fontSize: "14px", color: "var(--text-dark)" }}>{team.name}</span>
                  <span style={{ fontSize: "14px", fontWeight: 600, color: "var(--text-muted)" }}>{total}p</span>
                </div>
              ))}
            </div>
          )}

          {isLekledare && (
            <button
              onClick={reopenFemkamp}
              className="w-full py-3 rounded-xl text-sm font-semibold"
              style={{ background: "rgba(27,63,110,0.08)", color: "var(--blue-deep)", border: "1px solid rgba(27,63,110,0.2)" }}
            >
              ↩ Återöppna femkampen
            </button>
          )}
        </div>
      )}

      {/* ── Active event ── */}
      {!femkampFinished && (activeEvent ? (
        <div className="card p-4 mb-4" style={{ borderLeft: "4px solid var(--gold)" }}>
          <button
            type="button"
            onClick={() => setActiveEventOpen((o) => !o)}
            style={{ display: "flex", alignItems: "center", gap: "8px", width: "100%", background: "none", border: "none", padding: 0, cursor: "pointer", textAlign: "left" }}
          >
            <span style={{ display: "inline-block", width: "8px", height: "8px", borderRadius: "50%", background: "#e53e3e", flexShrink: 0 }} />
            <p style={{ fontSize: "10px", fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--gold)", margin: 0, flex: 1 }}>
              Pågående gren
            </p>
            <span style={{ fontSize: "18px", fontWeight: 700, color: "var(--text-dark)", flex: 2, textAlign: "left" }}>{activeEvent.name}</span>
            <span style={{ fontSize: "16px", color: "var(--text-muted)", flexShrink: 0, transition: "transform 0.2s", transform: activeEventOpen ? "rotate(180deg)" : "rotate(0deg)", display: "inline-block" }}>
              ▾
            </span>
          </button>
          {activeEventOpen && (
          <>
          {activeEvent.description && (
            <p style={{ fontSize: "13px", color: "var(--text-muted)", margin: "8px 0 0", fontStyle: "italic" }}>{activeEvent.description}</p>
          )}
          {activePlacementPts && (
            <div style={{ display: "flex", gap: "6px", flexWrap: "wrap", marginTop: "8px" }}>
              {activePlacementPts.map((pts, i) => (
                <span key={i} style={{ fontSize: "11px", padding: "2px 8px", borderRadius: "20px", background: "rgba(200,168,75,0.12)", color: "var(--gold)", fontWeight: 600 }}>
                  {PLACE_MEDALS[i]} {pts}p
                </span>
              ))}
            </div>
          )}

          {/* Current event scoreboard */}
          {!isLekledare && activeRanking.length > 0 && (
            <div style={{ marginTop: "14px", borderTop: "1px solid var(--border)", paddingTop: "12px" }}>
              <p style={{ fontSize: "11px", fontWeight: 600, color: "var(--text-muted)", letterSpacing: "0.08em", textTransform: "uppercase", margin: "0 0 8px" }}>
                Ställning i grenen
              </p>
              <div className="space-y-1">
                {activeRanking.map(({ team, value, rank }) => (
                  <div key={team.id} style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                    <span style={{ fontSize: "14px", width: "24px", flexShrink: 0 }}>{PLACE_MEDALS[rank]}</span>
                    <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: team.color ?? "#888", flexShrink: 0 }} />
                    <span style={{ flex: 1, fontSize: "14px", color: "var(--text-dark)" }}>{team.name}</span>
                    <span style={{ fontSize: "13px", fontWeight: 600, color: "var(--blue-deep)" }}>
                      {activeEvent.scoring_type === "time" ? `${value}s` : value}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Results input for lekledare */}
          {isLekledare && (
            <div style={{ marginTop: "14px", borderTop: "1px solid var(--border)", paddingTop: "12px" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "8px" }}>
                <p style={{ fontSize: "11px", fontWeight: 600, color: "var(--text-muted)", letterSpacing: "0.08em", textTransform: "uppercase", margin: 0 }}>
                  Registrera resultat
                </p>
                {autoSaving && <span style={{ fontSize: "11px", color: "var(--text-muted)" }}>Sparar...</span>}
              </div>
              <div className="space-y-3">
                {teams.map((t) => {
                  const val = getResultValue(activeEvent.id, t.id);
                  const num = val !== "" ? parseFloat(val) : null;
                  const btnStyle: React.CSSProperties = {
                    width: "40px", height: "40px", borderRadius: "8px", border: "1px solid var(--border)",
                    background: "var(--birch)", fontSize: "20px", fontWeight: 400, cursor: "pointer",
                    display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                    color: "var(--blue-deep)", userSelect: "none",
                  };
                  return (
                    <div key={t.id} style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                      <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: t.color ?? "#888", flexShrink: 0 }} />
                      <span style={{ flex: 1, fontSize: "14px", color: "var(--text-dark)", fontWeight: 500 }}>{t.name}</span>
                      <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                        <button type="button" style={btnStyle}
                          onClick={() => setDraftValueAndScheduleSave(activeEvent.id, t.id, String(Math.max(0, (num ?? 0) - 1)))}>
                          −
                        </button>
                        <button type="button" style={btnStyle}
                          onClick={() => setDraftValueAndScheduleSave(activeEvent.id, t.id, String((num ?? 0) + 1))}>
                          +
                        </button>
                        <input
                          type="number" min="0" step="1" placeholder="0" value={val}
                          onChange={(e) => setDraftValueAndScheduleSave(activeEvent.id, t.id, e.target.value)}
                          style={{
                            width: "52px", padding: "8px 4px", borderRadius: "8px", border: "1px solid var(--border)",
                            background: "var(--birch)", fontSize: "16px", fontWeight: 700, textAlign: "center",
                            color: "var(--blue-deep)", outline: "none",
                          }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
          </>
          )}
        </div>
      ) : (
        <div className="card p-4 mb-4" style={{ borderLeft: "4px solid var(--border)" }}>
          <p style={{ fontSize: "13px", color: "var(--text-muted)" }}>
            {isLekledare ? "Tryck på en gren nedan för att starta den." : "Ingen gren är aktiv just nu."}
          </p>
        </div>
      ))}

      {/* ── Events list + tools (hidden when finished) ── */}
      {!femkampFinished && (<>
      {isLekledare && (
        <p style={{ fontSize: "11px", fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--text-muted)", margin: "0 0 10px" }}>
          {editMode ? "Grenar — dra för att ändra ordning" : "Grenar"}
        </p>
      )}
      <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
        <SortableContext items={events.map((e) => e.id)} strategy={verticalListSortingStrategy}>
          <div className="space-y-3">
            {events.map((evt) => {
              const isActive = evt.id === activeEventId;
              const pts = parsePlacementPoints(evt.placement_points);
              const evtRanking = computeEventRanking(teams, evt, liveResults);
              const isEditingThis = editingPlacements === evt.id;

              return (
                <SortableItem key={evt.id} id={evt.id} disabled={!isLekledare || !editMode}>
                  {({ listeners, attributes }) => (
                    <div
                      className="card p-4"
                      style={{
                        opacity: isActive ? 1 : 0.85,
                        cursor: isLekledare && !isActive && !editMode ? "pointer" : "default",
                        borderLeft: isActive ? "3px solid var(--gold)" : undefined,
                      }}
                      onClick={isLekledare && !isActive && !editMode ? () => setActiveEvent(evt.id) : undefined}
                    >
                      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: "6px" }}>
                        <div style={{ flex: 1 }}>
                          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                            {isActive
                              ? <span style={{ fontSize: "10px", padding: "2px 7px", borderRadius: "10px", background: "rgba(200,168,75,0.15)", color: "var(--gold)", fontWeight: 700 }}>IGÅNG</span>
                              : isLekledare && !editMode && <span style={{ fontSize: "10px", color: "var(--text-muted)" }}>Tryck för att starta</span>
                            }
                            <p style={{ fontWeight: 600, fontSize: "14px", color: "var(--text-dark)", margin: 0 }}>{evt.name}</p>
                          </div>
                          {evt.description && (
                            <p style={{ fontSize: "12px", color: "var(--text-muted)", margin: "3px 0 0", fontStyle: "italic" }}>{evt.description}</p>
                          )}
                          {pts && (
                            <div style={{ display: "flex", gap: "5px", flexWrap: "wrap", marginTop: "6px" }}>
                              {pts.map((p, j) => (
                                <span key={j} style={{ fontSize: "10px", padding: "2px 6px", borderRadius: "20px", background: "rgba(200,168,75,0.1)", color: "var(--gold)", fontWeight: 600 }}>
                                  {PLACE_MEDALS[j]} {p}p
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                        {isLekledare && editMode && (
                          <div style={{ display: "flex", gap: "4px", flexShrink: 0, marginLeft: "8px", alignItems: "center" }}>
                            {/* Drag handle */}
                            <button
                              {...listeners} {...attributes}
                              style={{ cursor: "grab", background: "none", border: "none", padding: "6px 4px", color: "var(--text-muted)", fontSize: "16px", lineHeight: 1, touchAction: "none" }}
                              onClick={(e) => e.stopPropagation()}
                            >
                              ⠿
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                if (isEditingThis) { setEditingPlacements(null); return; }
                                setDraftPlacements(pts ? pts.map(String) : Array(teams.length).fill(""));
                                setEditingPlacements(evt.id);
                              }}
                              style={{ fontSize: "11px", color: "var(--text-muted)", background: "none", border: "none", cursor: "pointer", padding: "4px" }}
                            >
                              {isEditingThis ? "✕" : "✏️"}
                            </button>
                            <button onClick={(e) => { e.stopPropagation(); deleteEvent(evt.id); }}
                              style={{ fontSize: "11px", color: "var(--lingon)", background: "none", border: "none", cursor: "pointer", padding: "4px" }}>
                              🗑
                            </button>
                          </div>
                        )}
                      </div>

                      {/* Edit placement points */}
                      {isLekledare && editMode && isEditingThis && (
                        <div style={{ background: "rgba(200,168,75,0.06)", borderRadius: "10px", padding: "12px", marginBottom: "10px" }}>
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
                          <button onClick={() => savePlacements(evt.id)}
                            className="mt-3 w-full py-2 rounded-lg text-sm font-semibold"
                            style={{ background: "var(--gold)", color: "#1B3F6E" }}>
                            Spara poängfördelning
                          </button>
                        </div>
                      )}

                      {/* Results summary */}
                      {evtRanking.length > 0 && (
                        <div style={{ borderTop: "1px solid var(--border)", paddingTop: "8px" }}>
                          <div className="space-y-1">
                            {evtRanking.map(({ team, value, rank }) => (
                              <div key={team.id} style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                                <span style={{ fontSize: "13px", width: "20px", flexShrink: 0 }}>{PLACE_MEDALS[rank]}</span>
                                <div style={{ width: "7px", height: "7px", borderRadius: "50%", background: team.color ?? "#888", flexShrink: 0 }} />
                                <span style={{ flex: 1, fontSize: "13px", color: "var(--text-dark)" }}>{team.name}</span>
                                <span style={{ fontSize: "12px", color: "var(--text-muted)" }}>
                                  {evt.scoring_type === "time" ? `${value}s` : value}
                                  {pts && <span style={{ marginLeft: "6px", color: "var(--gold)", fontWeight: 600 }}>({pts[rank] ?? 0}p)</span>}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </SortableItem>
              );
            })}
          </div>
        </SortableContext>
      </DndContext>

      {/* ── Avsluta femkamp ── */}
      {isLekledare && !editMode && (
        <button
          onClick={finishFemkamp}
          disabled={finishing}
          className="w-full mt-5 py-3 rounded-xl text-sm font-semibold"
          style={{ background: "rgba(200,168,75,0.15)", color: "var(--gold)", border: "1px solid rgba(200,168,75,0.4)" }}
        >
          {finishing ? "Avslutar..." : "🏆 Avsluta femkampen"}
        </button>
      )}

      {/* ── Lekledare tools ── */}
      {isLekledare && editMode && (
        <div className="mt-5 space-y-3">
          {/* Sync teams */}
          {!showAddEvent && !showPenalty && (
            <button
              onClick={() => syncOfficialTeams(tournament!.id)}
              disabled={syncing}
              className="w-full py-3 rounded-xl text-sm font-semibold"
              style={{ background: "rgba(27,63,110,0.08)", color: "var(--blue-deep)", border: "1px solid rgba(27,63,110,0.2)" }}
            >
              {syncing ? "Synkar..." : "↻ Synka officiella lag"}
            </button>
          )}
          {/* Add event */}
          {!showAddEvent && !showPenalty && (
            <div style={{ display: "flex", gap: "8px" }}>
              <button
                onClick={() => { setNewEventPlacements(Array(Math.max(teams.length, 3)).fill("")); setShowAddEvent(true); }}
                className="flex-1 py-3 rounded-xl text-sm font-semibold"
                style={{ background: "rgba(200,168,75,0.1)", color: "var(--gold)", border: "1px solid rgba(200,168,75,0.3)" }}
              >
                + Lägg till gren
              </button>
              <button
                onClick={() => setShowPenalty(true)}
                className="flex-1 py-3 rounded-xl text-sm font-semibold"
                style={{ background: "rgba(139,38,53,0.08)", color: "var(--lingon)", border: "1px solid rgba(139,38,53,0.2)" }}
              >
                ⚡ Straff / Bonus
              </button>
            </div>
          )}

          {/* Add event form */}
          {showAddEvent && (
            <form onSubmit={addEvent} className="card px-4 py-4 space-y-3">
              <p style={{ fontWeight: 600, fontSize: "14px", color: "var(--text-dark)", margin: 0 }}>Ny gren</p>
              <input
                required placeholder="Grennamn" value={newEventName}
                onChange={(e) => setNewEventName(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border text-sm outline-none"
                style={{ borderColor: "var(--border)", background: "var(--birch)" }}
              />
              <textarea
                placeholder="Regler (valfritt)" value={newEventDesc}
                onChange={(e) => setNewEventDesc(e.target.value)} rows={2}
                className="w-full px-3 py-2 rounded-lg border text-sm outline-none resize-none"
                style={{ borderColor: "var(--border)", background: "var(--birch)" }}
              />
              <div style={{ display: "flex", gap: "8px" }}>
                {(["points", "time"] as const).map((t) => (
                  <button key={t} type="button" onClick={() => setNewEventType(t)}
                    className="flex-1 py-2 rounded-lg text-xs font-medium"
                    style={{ background: newEventType === t ? "var(--blue-deep)" : "var(--birch)", color: newEventType === t ? "white" : "var(--text-muted)", border: "1px solid var(--border)" }}>
                    {t === "points" ? "Poäng" : "Tid"}
                  </button>
                ))}
              </div>
              <div>
                <p style={{ fontSize: "11px", fontWeight: 600, color: "var(--gold)", textTransform: "uppercase", letterSpacing: "0.08em", margin: "0 0 8px" }}>Poäng per placering</p>
                {newEventPlacements.map((v, i) => (
                  <div key={i} style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "6px" }}>
                    <span style={{ fontSize: "14px", width: "28px" }}>{PLACE_MEDALS[i]}</span>
                    <input type="number" min="0" step="0.5" placeholder="0" value={v}
                      onChange={(e) => { const n = [...newEventPlacements]; n[i] = e.target.value; setNewEventPlacements(n); }}
                      style={{ width: "80px", padding: "6px 10px", borderRadius: "8px", border: "1px solid var(--border)", background: "var(--birch)", fontSize: "14px", textAlign: "right", color: "var(--blue-deep)" }} />
                    <span style={{ fontSize: "12px", color: "var(--text-muted)" }}>poäng</span>
                  </div>
                ))}
              </div>
              <div style={{ display: "flex", gap: "8px" }}>
                <button type="submit" disabled={addingEvent} className="btn-gold text-sm py-2" style={{ flex: 1 }}>
                  {addingEvent ? "..." : "Lägg till"}
                </button>
                <button type="button" onClick={() => setShowAddEvent(false)}
                  style={{ padding: "8px 14px", borderRadius: "10px", border: "1px solid var(--border)", background: "transparent", color: "var(--text-muted)", fontSize: "13px", cursor: "pointer" }}>
                  Avbryt
                </button>
              </div>
            </form>
          )}

          {/* Penalty / bonus form */}
          {showPenalty && (
            <form onSubmit={submitPenalty} className="card px-4 py-4 space-y-3">
              <p style={{ fontWeight: 600, fontSize: "14px", color: "var(--text-dark)", margin: 0 }}>Straff / Bonus</p>
              <input
                required placeholder="Benämning (t.ex. Straff: sent till start)" value={penaltyLabel}
                onChange={(e) => setPenaltyLabel(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border text-sm outline-none"
                style={{ borderColor: "var(--border)", background: "var(--birch)" }}
              />
              <p style={{ fontSize: "11px", color: "var(--text-muted)", margin: 0 }}>Positivt = bonus, negativt = straff</p>
              {teams.map((t) => (
                <div key={t.id} style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: t.color ?? "#888", flexShrink: 0 }} />
                  <span style={{ flex: 1, fontSize: "14px", color: "var(--text-dark)" }}>{t.name}</span>
                  <input
                    type="number" step="1" placeholder="0"
                    value={penaltyValues[t.id] ?? ""}
                    onChange={(e) => setPenaltyValues((prev) => ({ ...prev, [t.id]: e.target.value }))}
                    style={{ width: "72px", padding: "6px 10px", borderRadius: "8px", border: "1px solid var(--border)", background: "var(--birch)", fontSize: "14px", textAlign: "right", color: "var(--blue-deep)" }}
                  />
                  <span style={{ fontSize: "12px", color: "var(--text-muted)" }}>p</span>
                </div>
              ))}
              <div style={{ display: "flex", gap: "8px" }}>
                <button type="submit" disabled={addingPenalty} className="btn-primary text-sm py-2" style={{ flex: 1 }}>
                  {addingPenalty ? "..." : "Lägg till"}
                </button>
                <button type="button" onClick={() => setShowPenalty(false)}
                  style={{ padding: "8px 14px", borderRadius: "10px", border: "1px solid var(--border)", background: "transparent", color: "var(--text-muted)", fontSize: "13px", cursor: "pointer" }}>
                  Avbryt
                </button>
              </div>
            </form>
          )}

          {/* Reset / Delete */}
          {!showAddEvent && !showPenalty && (
            <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginTop: "8px" }}>
              <button
                onClick={resetFemkamp}
                disabled={resetting || deleting}
                className="w-full py-3 rounded-xl text-sm font-semibold"
                style={{ background: "rgba(139,38,53,0.06)", color: "var(--lingon)", border: "1px solid rgba(139,38,53,0.2)" }}
              >
                {resetting ? "Nollställer..." : "⚠ Nollställ alla resultat"}
              </button>
              <button
                onClick={deleteFemkamp}
                disabled={deleting || resetting}
                className="w-full py-3 rounded-xl text-sm font-semibold"
                style={{ background: "rgba(139,38,53,0.12)", color: "var(--lingon)", border: "1px solid rgba(139,38,53,0.35)" }}
              >
                {deleting ? "Raderar..." : "🗑 Ta bort femkampen"}
              </button>
            </div>
          )}
        </div>
      )}
      </>)}
    </div>
  );
}
