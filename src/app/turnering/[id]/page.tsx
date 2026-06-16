"use client";

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import { supabase } from "@/lib/supabase";
import { useUser } from "@/lib/useUser";
import { NavDrawer } from "@/components/NavDrawer";
import { previewFormat, recommendFormat, transformMatchesForBracket } from "@/lib/tournament";

const SingleEliminationBracket = dynamic(
  () => import("@g-loot/react-tournament-brackets").then((m) => m.SingleEliminationBracket),
  { ssr: false }
);
const SVGViewer = dynamic(
  () => import("@g-loot/react-tournament-brackets").then((m) => m.SVGViewer),
  { ssr: false }
);
const BracketMatch = dynamic(
  () => import("@g-loot/react-tournament-brackets").then((m) => m.Match),
  { ssr: false }
);

type Tournament = { id: string; name: string; game: string; format: string; status: string };
type TTeam = { id: string; name: string; color: string | null; points: number };
type Match = {
  id: string; tournament_id: string; team_a_id: string | null; team_b_id: string | null;
  score_a: number; score_b: number; status: string; round: number; bracket_position: number | null;
};
type OfficialTeam = { id: string; name: string; color: string; emoji: string };
type AppUser = { id: string; username: string };
type TEvent = { id: string; tournament_id: string; name: string; scoring_type: string };
type EventResult = { event_id: string; tournament_team_id: string; value: number | null };

const statusBg: Record<string, string> = {
  pending: "var(--birch)", active: "rgba(200,168,75,0.10)", completed: "rgba(61,107,58,0.08)",
};
const STATUS_LABELS: Record<string, string> = { draft: "Utkast", active: "Pågår", completed: "Avslutad" };
const STATUS_NEXT: Record<string, string> = { draft: "active", active: "completed" };
const TEAM_COLORS = ["#e63946", "#f4a261", "#2a9d8f", "#457b9d", "#8b5cf6", "#10b981", "#c77dff", "#6b7280"];

type MatchCardProps = {
  match: Match; teamMap: Map<string, TTeam>; isLekledare: boolean;
  editingMatchId: string | null; editScores: { a: number; b: number };
  editError: string | null; savingEdit: boolean;
  setEditingMatchId: (id: string | null) => void;
  setEditScores: (s: { a: number; b: number }) => void;
  setEditError: (e: string | null) => void;
  updateScore: (id: string, field: "score_a" | "score_b", delta: number) => void;
  setMatchStatus: (id: string, status: string) => void;
  saveEditedScore: () => void;
};

function MatchCard({ match, teamMap, isLekledare, editingMatchId, editScores, editError, savingEdit,
  setEditingMatchId, setEditScores, setEditError, updateScore, setMatchStatus, saveEditedScore }: MatchCardProps) {
  const tA = match.team_a_id ? teamMap.get(match.team_a_id) : null;
  const tB = match.team_b_id ? teamMap.get(match.team_b_id) : null;
  const isActive = match.status === "active";
  const isDone = match.status === "completed";
  const isEditing = editingMatchId === match.id;
  const isBye = isDone && (!match.team_a_id || !match.team_b_id);

  if (isBye) return (
    <div className="card px-4 py-2 flex items-center gap-3 opacity-60">
      {(tA ?? tB) && <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: (tA ?? tB)?.color ?? "#888" }} />}
      <span className="text-sm font-medium" style={{ color: "var(--text-dark)" }}>
        {(tA ?? tB)?.name ?? "?"} — BYE (fri passage)
      </span>
      <span className="ml-auto text-xs" style={{ color: "var(--leaf)" }}>✓</span>
    </div>
  );

  return (
    <div className="card p-4" style={{ background: statusBg[match.status] ?? "var(--birch)" }}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          {tA?.color && <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: tA.color }} />}
          <span className="font-semibold text-sm truncate" style={{ color: "var(--text-dark)" }}>{tA?.name ?? "TBD"}</span>
        </div>
        <div className="flex items-center gap-2 px-3 shrink-0">
          <span className="text-xl font-bold tabular-nums" style={{ color: "var(--blue-deep)" }}>{match.score_a}</span>
          <span style={{ color: "var(--border)" }}>–</span>
          <span className="text-xl font-bold tabular-nums" style={{ color: "var(--blue-deep)" }}>{match.score_b}</span>
        </div>
        <div className="flex items-center gap-2 flex-1 min-w-0 justify-end">
          <span className="font-semibold text-sm truncate" style={{ color: "var(--text-dark)" }}>{tB?.name ?? "TBD"}</span>
          {tB?.color && <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: tB.color }} />}
        </div>
      </div>

      {isActive && (
        <div className="flex gap-2 mt-3">
          <div className="flex gap-1 flex-1">
            <button onClick={() => updateScore(match.id, "score_a", -1)}
              className="w-9 h-9 rounded-lg font-bold text-lg flex items-center justify-center"
              style={{ background: "var(--border)", color: "var(--text-dark)" }}>–</button>
            <button onClick={() => updateScore(match.id, "score_a", 1)}
              className="w-9 h-9 rounded-lg font-bold text-lg flex items-center justify-center"
              style={{ background: "var(--blue-deep)", color: "white" }}>+</button>
          </div>
          {isLekledare && (
            <button onClick={() => setMatchStatus(match.id, "completed")}
              className="px-3 py-1 rounded-lg text-xs font-semibold"
              style={{ background: "var(--leaf)", color: "white" }}>Avsluta</button>
          )}
          <div className="flex gap-1 flex-1 justify-end">
            <button onClick={() => updateScore(match.id, "score_b", 1)}
              className="w-9 h-9 rounded-lg font-bold text-lg flex items-center justify-center"
              style={{ background: "var(--blue-deep)", color: "white" }}>+</button>
            <button onClick={() => updateScore(match.id, "score_b", -1)}
              className="w-9 h-9 rounded-lg font-bold text-lg flex items-center justify-center"
              style={{ background: "var(--border)", color: "var(--text-dark)" }}>–</button>
          </div>
        </div>
      )}

      {match.status === "pending" && isLekledare && (
        <button onClick={() => setMatchStatus(match.id, "active")}
          className="w-full mt-3 py-1.5 rounded-lg text-xs font-semibold"
          style={{ background: "rgba(200,168,75,0.2)", color: "#7a6010" }}>
          ▶ Starta match
        </button>
      )}

      {isDone && !isEditing && (
        <div className="flex items-center justify-between mt-2">
          <p className="text-xs" style={{ color: "var(--text-muted)" }}>✓ Avslutad</p>
          {isLekledare && (
            <button onClick={() => { setEditingMatchId(match.id); setEditScores({ a: match.score_a, b: match.score_b }); setEditError(null); }}
              className="text-xs underline" style={{ color: "var(--blue-mid)" }}>Rätta</button>
          )}
        </div>
      )}

      {isDone && isEditing && (
        <div className="mt-3 space-y-2">
          <div className="flex items-center gap-3 justify-center">
            <div className="flex items-center gap-1">
              <button onClick={() => setEditScores({ a: Math.max(0, editScores.a - 1), b: editScores.b })}
                className="w-8 h-8 rounded-lg font-bold flex items-center justify-center"
                style={{ background: "var(--border)", color: "var(--text-dark)" }}>–</button>
              <span className="text-xl font-bold w-8 text-center tabular-nums" style={{ color: "var(--blue-deep)" }}>{editScores.a}</span>
              <button onClick={() => setEditScores({ a: editScores.a + 1, b: editScores.b })}
                className="w-8 h-8 rounded-lg font-bold flex items-center justify-center"
                style={{ background: "var(--blue-deep)", color: "white" }}>+</button>
            </div>
            <span style={{ color: "var(--border)" }}>–</span>
            <div className="flex items-center gap-1">
              <button onClick={() => setEditScores({ a: editScores.a, b: Math.max(0, editScores.b - 1) })}
                className="w-8 h-8 rounded-lg font-bold flex items-center justify-center"
                style={{ background: "var(--border)", color: "var(--text-dark)" }}>–</button>
              <span className="text-xl font-bold w-8 text-center tabular-nums" style={{ color: "var(--blue-deep)" }}>{editScores.b}</span>
              <button onClick={() => setEditScores({ a: editScores.a, b: editScores.b + 1 })}
                className="w-8 h-8 rounded-lg font-bold flex items-center justify-center"
                style={{ background: "var(--blue-deep)", color: "white" }}>+</button>
            </div>
          </div>
          {editError && <p className="text-xs text-center" style={{ color: "var(--lingon)" }}>{editError}</p>}
          <div className="flex gap-2">
            <button onClick={saveEditedScore} disabled={savingEdit}
              className="flex-1 py-1.5 rounded-lg text-xs font-semibold"
              style={{ background: "var(--leaf)", color: "white" }}>
              {savingEdit ? "..." : "Spara korrigering"}
            </button>
            <button onClick={() => { setEditingMatchId(null); setEditError(null); }}
              className="flex-1 py-1.5 rounded-lg text-xs font-semibold"
              style={{ background: "var(--border)", color: "var(--text-dark)" }}>Avbryt</button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function TurneringDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const me = useUser();
  const router = useRouter();
  const [tournament, setTournament] = useState<Tournament | null>(null);
  const [teams, setTeams] = useState<TTeam[]>([]);
  const [matches, setMatches] = useState<Match[]>([]);
  const [officialTeams, setOfficialTeams] = useState<OfficialTeam[]>([]);
  const [allUsers, setAllUsers] = useState<AppUser[]>([]);
  const [teamMembersMap, setTeamMembersMap] = useState<Record<string, string[]>>({});
  const [events, setEvents] = useState<TEvent[]>([]);
  const [results, setResults] = useState<EventResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddTeam, setShowAddTeam] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [removingTeamId, setRemovingTeamId] = useState<string | null>(null);
  const [editingMatchId, setEditingMatchId] = useState<string | null>(null);
  const [editScores, setEditScores] = useState({ a: 0, b: 0 });
  const [editError, setEditError] = useState<string | null>(null);
  const [savingEdit, setSavingEdit] = useState(false);
  const [showCustomTeam, setShowCustomTeam] = useState(false);
  const [customName, setCustomName] = useState("");
  const [customColor, setCustomColor] = useState(TEAM_COLORS[0]);
  const [selectedUserIds, setSelectedUserIds] = useState<Set<string>>(new Set());
  const [creatingCustomTeam, setCreatingCustomTeam] = useState(false);
  // Multi-event state
  const [showAddEvent, setShowAddEvent] = useState(false);
  const [newEventName, setNewEventName] = useState("");
  const [newEventType, setNewEventType] = useState<"points" | "time">("points");
  const [addingEvent, setAddingEvent] = useState(false);
  const [draftResults, setDraftResults] = useState<Record<string, Record<string, string>>>({}); // eventId → teamId → value string
  const [savingResults, setSavingResults] = useState<string | null>(null);

  async function fetchData() {
    const [{ data: t }, { data: tt }, { data: m }, { data: ot }, { data: users }] = await Promise.all([
      supabase.from("tournaments").select("*").eq("id", id).single(),
      supabase.from("tournament_teams").select("*").eq("tournament_id", id),
      supabase.from("matches").select("*").eq("tournament_id", id).order("round").order("bracket_position"),
      supabase.from("official_teams").select("*"),
      supabase.from("users").select("id, username").order("username"),
    ]);
    setTournament(t);
    const teamsData = (tt as TTeam[]) ?? [];
    setTeams(teamsData);
    setMatches((m as Match[]) ?? []);
    setOfficialTeams((ot as OfficialTeam[]) ?? []);
    setAllUsers((users as AppUser[]) ?? []);

    if (teamsData.length > 0) {
      const teamIds = teamsData.map((t) => t.id);
      const [{ data: members }, { data: evts }, { data: res }] = await Promise.all([
        supabase.from("tournament_team_members").select("tournament_team_id, user_id").in("tournament_team_id", teamIds),
        supabase.from("tournament_events").select("*").eq("tournament_id", id).order("created_at"),
        supabase.from("tournament_event_results").select("*").in("tournament_team_id", teamIds),
      ]);
      const map: Record<string, string[]> = {};
      for (const m of (members ?? [])) {
        if (!map[m.tournament_team_id]) map[m.tournament_team_id] = [];
        map[m.tournament_team_id].push(m.user_id);
      }
      setTeamMembersMap(map);
      setEvents((evts as TEvent[]) ?? []);
      setResults((res as EventResult[]) ?? []);
    } else {
      setTeamMembersMap({});
      const { data: evts } = await supabase.from("tournament_events").select("*").eq("tournament_id", id).order("created_at");
      setEvents((evts as TEvent[]) ?? []);
      setResults([]);
    }

    setLoading(false);
  }

  useEffect(() => {
    fetchData();
    const ch = supabase.channel(`matches-${id}`)
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "matches", filter: `tournament_id=eq.${id}` }, fetchData)
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [id]);

  async function addOfficialTeams() {
    const toAdd = officialTeams.filter((ot) => !teams.some((t) => t.name === ot.name));
    await Promise.all(toAdd.map((ot) =>
      fetch(`/api/admin/tournaments/${id}/teams`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: ot.name, color: ot.color, official_team_id: ot.id }),
      })
    ));
    await fetchData();
    setShowAddTeam(false);
  }

  async function createCustomTeam(e: React.FormEvent) {
    e.preventDefault();
    if (!customName.trim()) return;
    setCreatingCustomTeam(true);
    await fetch(`/api/admin/tournaments/${id}/teams`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: customName.trim(), color: customColor, memberUserIds: [...selectedUserIds] }),
    });
    setCustomName("");
    setSelectedUserIds(new Set());
    setShowCustomTeam(false);
    setCreatingCustomTeam(false);
    await fetchData();
  }

  function toggleUser(userId: string) {
    setSelectedUserIds((prev) => {
      const next = new Set(prev);
      if (next.has(userId)) next.delete(userId);
      else next.add(userId);
      return next;
    });
  }

  async function addEvent(e: React.FormEvent) {
    e.preventDefault();
    if (!newEventName.trim()) return;
    setAddingEvent(true);
    await fetch(`/api/admin/tournaments/${id}/events`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: newEventName.trim(), scoring_type: newEventType }),
    });
    setNewEventName("");
    setAddingEvent(false);
    setShowAddEvent(false);
    await fetchData();
  }

  async function deleteEvent(eventId: string) {
    if (!confirm("Ta bort gren och alla dess resultat?")) return;
    await fetch(`/api/admin/tournaments/${id}/events/${eventId}`, { method: "DELETE" });
    await fetchData();
  }

  async function saveResults(eventId: string) {
    setSavingResults(eventId);
    const draft = draftResults[eventId] ?? {};
    const rows = teams.map((t) => ({
      teamId: t.id,
      value: draft[t.id] !== undefined && draft[t.id] !== "" ? parseFloat(draft[t.id]) : null,
    }));
    await fetch(`/api/admin/tournaments/${id}/events/${eventId}/results`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ results: rows }),
    });
    setSavingResults(null);
    await fetchData();
  }

  function setDraftValue(eventId: string, teamId: string, val: string) {
    setDraftResults((prev) => ({
      ...prev,
      [eventId]: { ...(prev[eventId] ?? {}), [teamId]: val },
    }));
  }

  function getResultValue(eventId: string, teamId: string): string {
    const draft = draftResults[eventId];
    if (draft && draft[teamId] !== undefined) return draft[teamId];
    const saved = results.find((r) => r.event_id === eventId && r.tournament_team_id === teamId);
    return saved?.value != null ? String(saved.value) : "";
  }

  async function generateMatches() {
    setGenerating(true);
    await fetch(`/api/admin/tournaments/${id}/generate`, { method: "POST" });
    await fetchData();
    setGenerating(false);
  }

  async function resetMatches() {
    if (!confirm("Radera alla matcher och nollställa poäng?")) return;
    setResetting(true);
    await fetch(`/api/admin/tournaments/${id}/reset`, { method: "POST" });
    await fetchData();
    setResetting(false);
  }

  async function removeTeam(teamId: string) {
    setRemovingTeamId(teamId);
    const res = await fetch(`/api/admin/tournaments/${id}/teams/${teamId}`, { method: "DELETE" });
    if (!res.ok) { const json = await res.json(); alert(json.error); }
    await fetchData();
    setRemovingTeamId(null);
  }

  async function setTournamentStatus(status: string) {
    await fetch(`/api/admin/tournaments/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    await fetchData();
  }

  async function deleteTournament() {
    if (!confirm("Radera hela turneringen? Detta går inte att ångra.")) return;
    await fetch(`/api/admin/tournaments/${id}`, { method: "DELETE" });
    router.push("/turnering");
  }

  async function updateScore(matchId: string, field: "score_a" | "score_b", delta: number) {
    const match = matches.find((m) => m.id === matchId);
    if (!match) return;
    const val = Math.max(0, (match[field] ?? 0) + delta);
    setMatches((prev) => prev.map((m) => m.id === matchId ? { ...m, [field]: val } : m));
    await fetch(`/api/matches/${matchId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ [field]: val }),
    });
  }

  async function setMatchStatus(matchId: string, status: string) {
    await fetch(`/api/matches/${matchId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    await fetchData();
  }

  async function saveEditedScore() {
    if (!editingMatchId) return;
    setSavingEdit(true);
    setEditError(null);
    const res = await fetch(`/api/matches/${editingMatchId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ score_a: editScores.a, score_b: editScores.b, status: "completed", force_edit: true }),
    });
    if (!res.ok) {
      const json = await res.json();
      setEditError(json.error);
      setSavingEdit(false);
      return;
    }
    setEditingMatchId(null);
    setSavingEdit(false);
    await fetchData();
  }

  // Compute multi-event overall ranking
  function computeRanking() {
    const totals: Record<string, number> = {};
    for (const team of teams) totals[team.id] = 0;

    for (const evt of events) {
      const evtResults = results.filter((r) => r.event_id === evt.id && r.value != null);
      if (evtResults.length === 0) continue;

      if (evt.scoring_type === "points") {
        for (const r of evtResults) {
          totals[r.tournament_team_id] = (totals[r.tournament_team_id] ?? 0) + (r.value ?? 0);
        }
      } else {
        // time: lower is better → rank → points
        const sorted = [...evtResults].sort((a, b) => (a.value ?? 0) - (b.value ?? 0));
        const n = teams.length;
        sorted.forEach((r, i) => {
          totals[r.tournament_team_id] = (totals[r.tournament_team_id] ?? 0) + (n - i);
        });
      }
    }

    return teams
      .map((t) => ({ team: t, total: totals[t.id] ?? 0 }))
      .sort((a, b) => b.total - a.total);
  }

  const teamMap = new Map(teams.map((t) => [t.id, t]));
  const usersInTournament = new Set(Object.values(teamMembersMap).flat());
  const availableUsers = allUsers.filter((u) => !usersInTournament.has(u.id));
  const rounds = [...new Set(matches.map((m) => m.round))].sort((a, b) => a - b);
  const isLekledare = me.is("lekledare");
  const noMatches = matches.length === 0;
  const hasTeams = teams.length >= 2;
  const currentStatus = tournament?.status ?? "draft";
  const nextStatus = STATUS_NEXT[currentStatus];
  const allOfficialAdded = officialTeams.length > 0 && officialTeams.every((ot) => teams.some((t) => t.name === ot.name));
  const format = (tournament?.format ?? "bracket") as "bracket" | "round_robin" | "multi_event";
  const matchPreview = teams.length >= 2 && format !== "multi_event" ? previewFormat(teams.length, format) : null;
  const recommendedFormat = officialTeams.length >= 2 ? recommendFormat(officialTeams.length) : null;
  const ranking = format === "multi_event" ? computeRanking() : [];

  if (loading) return (
    <NavDrawer>
      <div className="page-bg flex items-center justify-center min-h-screen">
        <p style={{ color: "var(--text-muted)" }}>Laddar...</p>
      </div>
    </NavDrawer>
  );

  return (
    <NavDrawer>
      <div className="page-bg px-4 pt-6 pb-10 max-w-md mx-auto">
        <p className="page-subtitle mb-1">{tournament?.game}</p>
        <div className="flex items-baseline justify-between">
          <h1 className="page-title">{tournament?.name}</h1>
          <span
            className="text-xs font-semibold px-2 py-0.5 rounded-full"
            style={{
              background: currentStatus === "active" ? "rgba(200,168,75,0.2)" : currentStatus === "completed" ? "rgba(61,107,58,0.15)" : "var(--border)",
              color: currentStatus === "active" ? "#7a6010" : currentStatus === "completed" ? "var(--leaf)" : "var(--text-muted)",
            }}
          >
            {STATUS_LABELS[currentStatus]}
          </span>
        </div>
        <div className="gold-rule" />

        {/* Lekledare card */}
        {isLekledare && (
          <div className="card p-4 mb-5 space-y-3">
            <p className="text-xs font-semibold uppercase" style={{ color: "var(--text-muted)", letterSpacing: "0.08em" }}>
              Lekledare
            </p>

            {/* Step 1: Add official teams */}
            {noMatches && !allOfficialAdded && officialTeams.length > 0 && format !== "multi_event" && (
              <div className="rounded-lg p-3 space-y-2" style={{ background: "rgba(200,168,75,0.08)", border: "0.5px solid rgba(200,168,75,0.3)" }}>
                <p className="text-xs font-semibold" style={{ color: "#7a6010" }}>Steg 1 — Lägg till lag</p>
                <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                  {officialTeams.length} officiella lag
                  {recommendedFormat && ` · Rekommenderat: ${recommendedFormat === "bracket" ? "Bracket" : "Round Robin"}`}
                </p>
                <button onClick={addOfficialTeams} className="btn-gold text-sm py-2">
                  + Lägg till alla {officialTeams.length} lag
                </button>
              </div>
            )}

            {format === "multi_event" && !allOfficialAdded && officialTeams.length > 0 && (
              <div className="rounded-lg p-3 space-y-2" style={{ background: "rgba(200,168,75,0.08)", border: "0.5px solid rgba(200,168,75,0.3)" }}>
                <p className="text-xs font-semibold" style={{ color: "#7a6010" }}>Lägg till lag</p>
                <button onClick={addOfficialTeams} className="btn-gold text-sm py-2">
                  + Lägg till alla {officialTeams.length} officiella lag
                </button>
              </div>
            )}

            {/* Teams list */}
            {teams.length > 0 && (
              <div>
                <p className="text-xs mb-1.5" style={{ color: "var(--text-muted)" }}>{teams.length} lag</p>
                <div className="flex gap-2 flex-wrap">
                  {teams.map((t) => {
                    const members = teamMembersMap[t.id] ?? [];
                    const canRemove = format === "multi_event" ? true : noMatches;
                    return (
                      <span key={t.id} className="flex items-center gap-1 text-xs px-2 py-1 rounded-full font-medium"
                        style={{ background: (t.color ?? "#888") + "22", color: t.color ?? "#888" }}>
                        {t.name}
                        {members.length > 0 && <span className="opacity-60">({members.length})</span>}
                        {canRemove && (
                          <button onClick={() => removeTeam(t.id)} disabled={removingTeamId === t.id}
                            className="opacity-60 hover:opacity-100 leading-none" style={{ fontSize: "14px", lineHeight: 1 }}>
                            ×
                          </button>
                        )}
                      </span>
                    );
                  })}
                </div>
                {!noMatches && format !== "multi_event" && (
                  <p className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>Återställ matcher för att ändra lag</p>
                )}
              </div>
            )}

            {/* Custom team builder */}
            {(format === "multi_event" || noMatches) && (
              <div>
                <button onClick={() => setShowCustomTeam((v) => !v)} className="text-xs font-medium" style={{ color: "var(--gold)" }}>
                  {showCustomTeam ? "Dölj" : "+ Skapa eget lag"}
                </button>
                {showCustomTeam && (
                  <form onSubmit={createCustomTeam} className="mt-3 space-y-3 rounded-lg p-3" style={{ background: "rgba(27,63,110,0.05)", border: "0.5px solid var(--border)" }}>
                    <p className="text-xs font-semibold" style={{ color: "var(--blue-deep)" }}>Nytt lag</p>
                    <input required placeholder="Lagnamn" value={customName}
                      onChange={(e) => setCustomName(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border text-sm outline-none"
                      style={{ borderColor: "var(--border)", background: "var(--birch)" }} />
                    <div>
                      <p className="text-xs mb-2" style={{ color: "var(--text-muted)" }}>Färg</p>
                      <div className="flex gap-2 flex-wrap">
                        {TEAM_COLORS.map((c) => (
                          <button key={c} type="button" onClick={() => setCustomColor(c)}
                            className="w-7 h-7 rounded-full transition-all"
                            style={{ background: c, outline: customColor === c ? `2px solid ${c}` : "none", outlineOffset: "2px" }} />
                        ))}
                      </div>
                    </div>
                    {allUsers.length > 0 && (
                      <div>
                        <p className="text-xs mb-2" style={{ color: "var(--text-muted)" }}>
                          Spelare{selectedUserIds.size > 0 && ` (${selectedUserIds.size} valda)`}
                        </p>
                        {availableUsers.length === 0 ? (
                          <p className="text-xs" style={{ color: "var(--text-muted)" }}>Alla gäster är redan i ett lag</p>
                        ) : (
                          <div className="space-y-1 max-h-48 overflow-y-auto">
                            {availableUsers.map((u) => (
                              <button key={u.id} type="button" onClick={() => toggleUser(u.id)}
                                className="w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-sm text-left transition-all"
                                style={{
                                  background: selectedUserIds.has(u.id) ? customColor + "22" : "transparent",
                                  color: selectedUserIds.has(u.id) ? customColor : "var(--text-dark)",
                                  border: `1px solid ${selectedUserIds.has(u.id) ? customColor + "55" : "transparent"}`,
                                }}>
                                <span className="w-4 h-4 rounded flex items-center justify-center text-xs shrink-0"
                                  style={{ background: selectedUserIds.has(u.id) ? customColor : "var(--border)", color: "white" }}>
                                  {selectedUserIds.has(u.id) ? "✓" : ""}
                                </span>
                                {u.username}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                    <button type="submit" disabled={creatingCustomTeam} className="btn-primary text-sm py-2">
                      {creatingCustomTeam ? "Skapar..." : "Skapa lag"}
                    </button>
                  </form>
                )}
              </div>
            )}

            {/* Add official teams again (bracket/round_robin only) */}
            {noMatches && allOfficialAdded && officialTeams.length > 0 && format !== "multi_event" && (
              <div>
                <button onClick={() => setShowAddTeam((v) => !v)} className="text-xs underline" style={{ color: "var(--text-muted)" }}>
                  {showAddTeam ? "Dölj" : "+ Lägg till officiella lag igen"}
                </button>
                {showAddTeam && (
                  <button onClick={addOfficialTeams} className="btn-outline text-sm py-2 px-3 mt-2" style={{ width: "auto" }}>
                    Lägg till alla officiella lag
                  </button>
                )}
              </div>
            )}

            {/* Add gren (multi_event only) */}
            {format === "multi_event" && (
              <div>
                <button onClick={() => setShowAddEvent((v) => !v)} className="text-xs font-medium" style={{ color: "var(--gold)" }}>
                  {showAddEvent ? "Dölj" : "+ Lägg till gren"}
                </button>
                {showAddEvent && (
                  <form onSubmit={addEvent} className="mt-3 space-y-3 rounded-lg p-3" style={{ background: "rgba(200,168,75,0.06)", border: "0.5px solid rgba(200,168,75,0.3)" }}>
                    <p className="text-xs font-semibold" style={{ color: "#7a6010" }}>Ny gren</p>
                    <input required placeholder="Grennamn (t.ex. Stavhopp)" value={newEventName}
                      onChange={(e) => setNewEventName(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border text-sm outline-none"
                      style={{ borderColor: "var(--border)", background: "var(--birch)" }} />
                    <div>
                      <p className="text-xs mb-2" style={{ color: "var(--text-muted)" }}>Poängtyp</p>
                      <div className="flex gap-2">
                        {(["points", "time"] as const).map((t) => (
                          <button key={t} type="button" onClick={() => setNewEventType(t)}
                            className="flex-1 py-2 rounded-lg text-xs font-medium transition-all"
                            style={{
                              background: newEventType === t ? "var(--blue-deep)" : "var(--birch)",
                              color: newEventType === t ? "white" : "var(--text-muted)",
                              border: "1px solid var(--border)",
                            }}>
                            <div>{t === "points" ? "Poäng" : "Tid"}</div>
                            <div className="text-[10px] opacity-70 mt-0.5">{t === "points" ? "Högst vinner" : "Lägst vinner"}</div>
                          </button>
                        ))}
                      </div>
                    </div>
                    <button type="submit" disabled={addingEvent} className="btn-gold text-sm py-2">
                      {addingEvent ? "Lägger till..." : "Lägg till gren"}
                    </button>
                  </form>
                )}
              </div>
            )}

            {/* Step 2: Generate (bracket/round_robin only) */}
            {hasTeams && noMatches && format !== "multi_event" && (
              <div className="rounded-lg p-3 space-y-2" style={{ background: "rgba(27,63,110,0.06)", border: "0.5px solid var(--border)" }}>
                <p className="text-xs font-semibold" style={{ color: "var(--blue-deep)" }}>Steg 2 — Generera matcher</p>
                {matchPreview && (
                  <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                    {matchPreview.description}
                    {matchPreview.byes > 0 && ` — ${matchPreview.byes} lag får BYE (fri passage)`}
                  </p>
                )}
                <button onClick={generateMatches} disabled={generating} className="btn-primary text-sm py-2">
                  {generating ? "Genererar..." : "⚡ Generera matcher"}
                </button>
              </div>
            )}

            {/* Reset (bracket/round_robin only) */}
            {!noMatches && format !== "multi_event" && (
              <button onClick={resetMatches} disabled={resetting} className="text-xs underline" style={{ color: "var(--lingon)" }}>
                {resetting ? "Återställer..." : "↺ Återställ alla matcher"}
              </button>
            )}

            {/* Status control */}
            {nextStatus && (
              <div className="flex items-center gap-2 pt-1 border-t" style={{ borderColor: "rgba(168,197,218,0.15)" }}>
                <span className="text-xs" style={{ color: "var(--text-muted)" }}>Status:</span>
                <button onClick={() => setTournamentStatus(nextStatus)}
                  className="text-xs px-3 py-1 rounded-lg font-semibold"
                  style={{
                    background: nextStatus === "active" ? "rgba(200,168,75,0.2)" : "rgba(61,107,58,0.15)",
                    color: nextStatus === "active" ? "#7a6010" : "var(--leaf)",
                  }}>
                  → {STATUS_LABELS[nextStatus]}
                </button>
                <button onClick={deleteTournament} className="text-xs ml-auto" style={{ color: "var(--lingon)" }}>
                  🗑 Radera
                </button>
              </div>
            )}
          </div>
        )}

        {/* ── MULTI_EVENT VIEW ── */}
        {format === "multi_event" && (
          <div className="space-y-5">
            {/* Overall ranking */}
            {teams.length > 0 && events.length > 0 && (
              <div className="card p-4">
                <p className="text-xs font-semibold uppercase mb-3" style={{ color: "var(--text-muted)", letterSpacing: "0.08em" }}>
                  Totalt
                </p>
                <div className="space-y-2">
                  {ranking.map(({ team, total }, i) => (
                    <div key={team.id} className="flex items-center gap-3">
                      <span className="text-sm font-bold w-5 text-right tabular-nums" style={{ color: i === 0 ? "var(--gold)" : "var(--text-muted)" }}>
                        {i + 1}
                      </span>
                      <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: team.color ?? "#888" }} />
                      <span className="flex-1 text-sm font-semibold" style={{ color: "var(--text-dark)" }}>{team.name}</span>
                      <span className="text-sm font-bold tabular-nums" style={{ color: "var(--blue-deep)" }}>{total} p</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* No teams yet */}
            {teams.length === 0 && (
              <div className="card p-8 text-center" style={{ color: "var(--text-muted)" }}>Lägg till lag för att börja</div>
            )}

            {/* No events yet */}
            {teams.length > 0 && events.length === 0 && (
              <div className="card p-8 text-center" style={{ color: "var(--text-muted)" }}>
                {isLekledare ? "Tryck '+ Lägg till gren' för att lägga till grenar" : "Inga grenar ännu"}
              </div>
            )}

            {/* Events */}
            {events.map((evt) => {
              const evtResults = results.filter((r) => r.event_id === evt.id);
              const hasAnyResult = evtResults.some((r) => r.value != null);
              return (
                <div key={evt.id} className="card p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <p className="font-semibold text-sm" style={{ color: "var(--text-dark)" }}>{evt.name}</p>
                      <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                        {evt.scoring_type === "points" ? "Poäng (högst vinner)" : "Tid (lägst vinner)"}
                      </p>
                    </div>
                    {isLekledare && (
                      <button onClick={() => deleteEvent(evt.id)} className="text-xs" style={{ color: "var(--lingon)" }}>
                        Ta bort
                      </button>
                    )}
                  </div>

                  <div className="space-y-2">
                    {teams.map((t) => {
                      const val = getResultValue(evt.id, t.id);
                      return (
                        <div key={t.id} className="flex items-center gap-3">
                          <div className="w-2 h-2 rounded-full shrink-0" style={{ background: t.color ?? "#888" }} />
                          <span className="flex-1 text-sm" style={{ color: "var(--text-dark)" }}>{t.name}</span>
                          {isLekledare ? (
                            <input
                              type="number"
                              min="0"
                              step="0.01"
                              placeholder="—"
                              value={val}
                              onChange={(e) => setDraftValue(evt.id, t.id, e.target.value)}
                              className="w-20 px-2 py-1 rounded-lg border text-sm text-right outline-none tabular-nums"
                              style={{ borderColor: "var(--border)", background: "var(--birch)", color: "var(--blue-deep)" }}
                            />
                          ) : (
                            <span className="text-sm font-semibold tabular-nums" style={{ color: val ? "var(--blue-deep)" : "var(--text-muted)" }}>
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
                      className="mt-3 w-full py-1.5 rounded-lg text-xs font-semibold transition-all"
                      style={{ background: "rgba(27,63,110,0.1)", color: "var(--blue-deep)" }}
                    >
                      {savingResults === evt.id ? "Sparar..." : "Spara resultat"}
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* ── BRACKET VIEW ── */}
        {format === "bracket" && (
          <>
            {rounds.length === 0 ? (
              <div className="card p-8 text-center" style={{ color: "var(--text-muted)" }}>
                {hasTeams ? "Tryck 'Generera matcher' för att starta" : "Lägg till lag för att börja"}
              </div>
            ) : (
              <>
                {/* Bracket visualisation */}
                <div className="mb-5 -mx-4 overflow-x-auto">
                  <div style={{ minWidth: "320px" }}>
                    <SingleEliminationBracket
                      matches={transformMatchesForBracket(matches, teamMap)}
                      matchComponent={BracketMatch}
                      options={{
                        style: {
                          roundHeader: { backgroundColor: "#1B3F6E", fontColor: "#FAFAF7" },
                          connectorColor: "#d4c5a9",
                          connectorColorHighlight: "#C8A84B",
                        },
                      }}
                      theme={{
                        textColor: { main: "#2D3748", highlighted: "#1B3F6E", dark: "#1B3F6E" },
                        matchBackground: { wonColor: "#eef7ee", lostColor: "#F5F0E8" },
                        score: {
                          background: { wonColor: "#3D6B3A", lostColor: "#e2d9c8" },
                          text: { highlightedWonColor: "#fff", highlightedLostColor: "#4a5568" },
                        },
                        border: { color: "#e2d9c8", highlightedColor: "#C8A84B" },
                        roundHeader: { backgroundColor: "#1B3F6E", fontColor: "#FAFAF7" },
                        connectorColor: "#d4c5a9",
                        connectorColorHighlight: "#C8A84B",
                        svgBackground: "#F5F0E8",
                      }}
                      svgWrapper={({ children, ...props }) => (
                        <SVGViewer
                          width={Math.max(props.bracketWidth ?? 400, 320)}
                          height={Math.max(props.bracketHeight ?? 300, 200)}
                          {...props}
                        >
                          {children}
                        </SVGViewer>
                      )}
                    />
                  </div>
                </div>

                {/* Scoring cards — active/pending matches only */}
                {matches.some((m) => m.status !== "completed" && (m.team_a_id || m.team_b_id)) && (
                  <div className="space-y-3">
                    <p className="text-xs font-semibold uppercase" style={{ color: "var(--text-muted)", letterSpacing: "0.08em" }}>
                      Pågående matcher
                    </p>
                    {matches
                      .filter((m) => m.status !== "completed" && (m.team_a_id || m.team_b_id))
                      .map((match) => <MatchCard key={match.id} match={match} teamMap={teamMap} isLekledare={isLekledare} editingMatchId={editingMatchId} editScores={editScores} editError={editError} savingEdit={savingEdit} setEditingMatchId={setEditingMatchId} setEditScores={setEditScores} setEditError={setEditError} updateScore={updateScore} setMatchStatus={setMatchStatus} saveEditedScore={saveEditedScore} />)
                    }
                  </div>
                )}

                {/* Completed matches for lekledare (Rätta) */}
                {isLekledare && matches.some((m) => m.status === "completed" && m.team_a_id && m.team_b_id) && (
                  <div className="space-y-3 mt-4">
                    <p className="text-xs font-semibold uppercase" style={{ color: "var(--text-muted)", letterSpacing: "0.08em" }}>
                      Avslutade matcher
                    </p>
                    {matches
                      .filter((m) => m.status === "completed" && m.team_a_id && m.team_b_id)
                      .map((match) => <MatchCard key={match.id} match={match} teamMap={teamMap} isLekledare={isLekledare} editingMatchId={editingMatchId} editScores={editScores} editError={editError} savingEdit={savingEdit} setEditingMatchId={setEditingMatchId} setEditScores={setEditScores} setEditError={setEditError} updateScore={updateScore} setMatchStatus={setMatchStatus} saveEditedScore={saveEditedScore} />)
                    }
                  </div>
                )}
              </>
            )}
          </>
        )}

        {/* ── ROUND ROBIN VIEW ── */}
        {format === "round_robin" && (
          <>
            {rounds.length === 0 ? (
              <div className="card p-8 text-center" style={{ color: "var(--text-muted)" }}>
                {hasTeams ? "Tryck 'Generera matcher' för att starta" : "Lägg till lag för att börja"}
              </div>
            ) : (
              rounds.map((round) => (
                <div key={round} className="mb-5">
                  <p className="text-xs font-semibold uppercase mb-2" style={{ color: "var(--text-muted)", letterSpacing: "0.08em" }}>
                    Omgång {round}
                  </p>
                  <div className="space-y-3">
                    {matches.filter((m) => m.round === round).map((match) => (
                      <MatchCard key={match.id} match={match} teamMap={teamMap} isLekledare={isLekledare} editingMatchId={editingMatchId} editScores={editScores} editError={editError} savingEdit={savingEdit} setEditingMatchId={setEditingMatchId} setEditScores={setEditScores} setEditError={setEditError} updateScore={updateScore} setMatchStatus={setMatchStatus} saveEditedScore={saveEditedScore} />
                    ))}
                  </div>
                </div>
              ))
            )}
          </>
        )}
      </div>
    </NavDrawer>
  );
}
