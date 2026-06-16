"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useUser } from "@/lib/useUser";

type OfficialTeam = {
  id: string;
  name: string;
  color: string;
  emoji: string;
  official_team_members: { user_id: string; users: { username: string } | null }[];
};
type AnyUser = { id: string; username: string };

const TEAM_COLORS = ["#1e88e5", "#e53935", "#43a047", "#fdd835", "#8e24aa", "#fb8c00", "#e91e63", "#00acc1"];
const TEAM_EMOJIS = ["🔵", "🔴", "🟢", "🟡", "🟣", "🟠", "💗", "🩵"];

export default function LagPage() {
  const me = useUser();
  const isLekledare = me.is("lekledare");

  const [teams, setTeams] = useState<OfficialTeam[]>([]);
  const [allUsers, setAllUsers] = useState<AnyUser[]>([]);
  const [loading, setLoading] = useState(true);

  // Edit team
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState<{ name: string; color: string; emoji: string } | null>(null);
  const [saving, setSaving] = useState(false);

  // Rename own team
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameDraft, setRenameDraft] = useState("");
  const [renaming, setRenaming] = useState(false);

  // Create team
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState("");
  const [newColor, setNewColor] = useState(TEAM_COLORS[0]);
  const [newEmoji, setNewEmoji] = useState(TEAM_EMOJIS[0]);
  const [creating, setCreating] = useState(false);

  // Randomize
  const [showRandomize, setShowRandomize] = useState(false);
  const [teamCount, setTeamCount] = useState(4);
  const [teamNames, setTeamNames] = useState(["Lag 1", "Lag 2", "Lag 3", "Lag 4"]);
  const [randomizing, setRandomizing] = useState(false);

  async function fetchData() {
    const [{ data: ot }, { data: users }] = await Promise.all([
      supabase.from("official_teams").select("*, official_team_members(user_id, users(username))").order("created_at"),
      supabase.from("users").select("id, username").order("username"),
    ]);
    setTeams((ot as OfficialTeam[]) ?? []);
    setAllUsers((users as AnyUser[]) ?? []);
    setLoading(false);
  }

  useEffect(() => { fetchData(); }, []);

  const allMemberIds = new Set(teams.flatMap((t) => t.official_team_members.map((m) => m.user_id)));
  const unassigned = allUsers.filter((u) => !allMemberIds.has(u.id));

  const myTeam = me.id ? teams.find((t) => t.official_team_members.some((m) => m.user_id === me.id)) ?? null : null;
  const otherTeams = teams.filter((t) => t.id !== myTeam?.id);

  function openEdit(team: OfficialTeam) {
    setEditingId(team.id);
    setEditDraft({ name: team.name, color: team.color, emoji: team.emoji });
    setShowCreate(false);
    setRenamingId(null);
  }

  async function saveTeam(teamId: string) {
    if (!editDraft) return;
    setSaving(true);
    await fetch(`/api/admin/teams/${teamId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(editDraft),
    });
    await fetchData();
    setEditingId(null);
    setSaving(false);
  }

  async function saveRename(teamId: string) {
    if (!renameDraft.trim()) return;
    setRenaming(true);
    await fetch(`/api/admin/teams/${teamId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: renameDraft.trim() }),
    });
    await fetchData();
    setRenamingId(null);
    setRenaming(false);
  }

  async function deleteTeam(teamId: string, name: string) {
    if (!confirm(`Ta bort laget "${name}"?`)) return;
    await fetch(`/api/admin/teams/${teamId}`, { method: "DELETE" });
    await fetchData();
  }

  async function addMember(teamId: string, userId: string) {
    await fetch(`/api/admin/teams/${teamId}/members`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId }),
    });
    await fetchData();
  }

  async function removeMember(teamId: string, userId: string) {
    await fetch(`/api/admin/teams/${teamId}/members`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId }),
    });
    await fetchData();
  }

  async function createTeam(e: React.FormEvent) {
    e.preventDefault();
    if (!newName.trim()) return;
    setCreating(true);
    await fetch("/api/admin/teams", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: newName.trim(), color: newColor, emoji: newEmoji }),
    });
    setNewName("");
    setCreating(false);
    setShowCreate(false);
    await fetchData();
  }

  function updateTeamCount(n: number) {
    setTeamCount(n);
    setTeamNames((prev) => {
      const next = [...prev];
      while (next.length < n) next.push(`Lag ${next.length + 1}`);
      return next.slice(0, n);
    });
  }

  async function randomize() {
    if (!confirm(`Radera alla befintliga lag och slumpa om ${allUsers.length} användare i ${teamCount} nya lag?`)) return;
    setRandomizing(true);
    await fetch("/api/admin/teams/randomize", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        teamNames,
        teamColors: TEAM_COLORS.slice(0, teamCount),
        teamEmojis: TEAM_EMOJIS.slice(0, teamCount),
      }),
    });
    setShowRandomize(false);
    setRandomizing(false);
    await fetchData();
  }

  function TeamCard({ team, isMine }: { team: OfficialTeam; isMine: boolean }) {
    const isEditing = editingId === team.id;
    const isRenaming = renamingId === team.id;
    const members = team.official_team_members.map((m) => ({ id: m.user_id, name: m.users?.username ?? "?" }));
    const teamUnassigned = allUsers.filter((u) => !allMemberIds.has(u.id));
    const isMember = me.id ? team.official_team_members.some((m) => m.user_id === me.id) : false;

    return (
      <div className="card overflow-hidden" style={isMine ? { border: "2px solid var(--gold)", boxShadow: "0 0 0 1px rgba(200,168,75,0.15)" } : {}}>
        {/* Team header */}
        <div style={{
          background: isEditing && editDraft ? editDraft.color : team.color,
          padding: "12px 16px", display: "flex", alignItems: "center", gap: "10px",
        }}>
          {isMine && (
            <span style={{
              fontSize: "9px", fontWeight: 800, letterSpacing: "0.12em", textTransform: "uppercase",
              background: "rgba(255,255,255,0.25)", color: "white", padding: "2px 7px", borderRadius: "10px", flexShrink: 0,
            }}>
              Ditt lag
            </span>
          )}
          <span style={{ fontSize: "20px" }}>{isEditing && editDraft ? editDraft.emoji : team.emoji}</span>
          <span style={{ flex: 1, fontWeight: 700, fontSize: "16px", color: "white" }}>
            {isEditing && editDraft ? editDraft.name : team.name}
          </span>
          <span style={{ fontSize: "13px", color: "rgba(255,255,255,0.7)" }}>{members.length} spelare</span>
          {isLekledare && !isEditing && (
            <button onClick={() => openEdit(team)}
              style={{ background: "none", border: "none", cursor: "pointer", fontSize: "16px", padding: "2px" }}>
              ✏️
            </button>
          )}
          {isEditing && (
            <button onClick={() => setEditingId(null)}
              style={{ background: "none", border: "none", cursor: "pointer", color: "white", fontSize: "18px" }}>✕</button>
          )}
        </div>

        {/* "Ditt lag" rename panel — for any team member */}
        {isMine && !isEditing && !isLekledare && (
          <div style={{ padding: "12px 16px", borderBottom: "1px solid var(--border)", background: "rgba(200,168,75,0.04)" }}>
            {isRenaming ? (
              <div style={{ display: "flex", gap: "8px" }}>
                <input
                  autoFocus
                  value={renameDraft}
                  onChange={(e) => setRenameDraft(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") saveRename(team.id); if (e.key === "Escape") setRenamingId(null); }}
                  className="flex-1 px-3 py-2 rounded-lg border text-sm outline-none"
                  style={{ borderColor: "var(--gold)", background: "var(--birch)", color: "var(--text-dark)", fontWeight: 600 }}
                  placeholder="Nytt lagnamn"
                />
                <button
                  onClick={() => saveRename(team.id)}
                  disabled={renaming || !renameDraft.trim()}
                  className="btn-gold text-sm"
                  style={{ padding: "8px 16px" }}
                >
                  {renaming ? "..." : "Spara"}
                </button>
                <button onClick={() => setRenamingId(null)}
                  style={{ padding: "8px 12px", borderRadius: "10px", border: "1px solid var(--border)", background: "transparent", color: "var(--text-muted)", fontSize: "13px", cursor: "pointer" }}>
                  ✕
                </button>
              </div>
            ) : (
              <button
                onClick={() => { setRenameDraft(team.name); setRenamingId(team.id); }}
                style={{
                  width: "100%", padding: "10px 14px", borderRadius: "10px",
                  border: "1px dashed rgba(200,168,75,0.5)", background: "transparent",
                  color: "var(--gold)", fontSize: "13px", fontWeight: 600, cursor: "pointer", textAlign: "left",
                }}
              >
                ✏️ Byt lagnamn
              </button>
            )}
          </div>
        )}

        {/* Full lekledare edit panel */}
        {isEditing && editDraft && (
          <div className="px-4 py-3 space-y-3" style={{ borderBottom: "1px solid var(--border)" }}>
            <input
              value={editDraft.name}
              onChange={(e) => setEditDraft((d) => d ? { ...d, name: e.target.value } : d)}
              className="w-full px-3 py-2 rounded-lg border text-sm outline-none"
              style={{ borderColor: "var(--border)", background: "var(--birch)" }}
              placeholder="Lagnamn"
            />
            <div>
              <p style={{ fontSize: "11px", color: "var(--text-muted)", marginBottom: "8px" }}>Färg</p>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "8px" }}>
                {TEAM_COLORS.map((c) => (
                  <button key={c} type="button" onClick={() => setEditDraft((d) => d ? { ...d, color: c } : d)}
                    style={{ width: "40px", height: "40px", borderRadius: "50%", background: c, border: "none", cursor: "pointer",
                      outline: editDraft.color === c ? "2px solid white" : "none", outlineOffset: "3px",
                      boxShadow: editDraft.color === c ? `0 0 0 4px ${c}` : "none" }} />
                ))}
              </div>
            </div>
            <div>
              <p style={{ fontSize: "11px", color: "var(--text-muted)", marginBottom: "8px" }}>Emoji</p>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "6px" }}>
                {TEAM_EMOJIS.map((em) => (
                  <button key={em} type="button" onClick={() => setEditDraft((d) => d ? { ...d, emoji: em } : d)}
                    style={{ width: "40px", height: "40px", borderRadius: "10px", fontSize: "18px", border: "none", cursor: "pointer",
                      background: editDraft.emoji === em ? "var(--blue-deep)" : "var(--birch)" }}>
                    {em}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <p style={{ fontSize: "11px", fontWeight: 600, color: "var(--text-muted)", marginBottom: "6px" }}>Medlemmar</p>
              {members.map((m) => (
                <div key={m.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "6px 0", borderBottom: "1px solid var(--border)" }}>
                  <span style={{ fontSize: "14px", color: "var(--text-dark)" }}>{m.name}</span>
                  <button onClick={() => removeMember(team.id, m.id)}
                    style={{ fontSize: "12px", padding: "4px 10px", borderRadius: "8px", border: "none", cursor: "pointer",
                      background: "rgba(139,38,53,0.08)", color: "var(--lingon)" }}>
                    Ta bort
                  </button>
                </div>
              ))}
              {teamUnassigned.length > 0 && (
                <div className="mt-2 space-y-1">
                  <p style={{ fontSize: "11px", color: "var(--text-muted)", marginBottom: "4px" }}>Lägg till</p>
                  {teamUnassigned.map((u) => (
                    <button key={u.id} onClick={() => addMember(team.id, u.id)}
                      style={{ width: "100%", display: "flex", alignItems: "center", gap: "8px",
                        padding: "8px 12px", borderRadius: "8px", border: "1px solid var(--border)",
                        background: "rgba(27,63,110,0.05)", color: "var(--blue-deep)", cursor: "pointer",
                        fontSize: "13px", textAlign: "left" }}>
                      <span style={{ fontWeight: 700 }}>+</span> {u.username}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div style={{ display: "flex", gap: "8px" }}>
              <button onClick={() => saveTeam(team.id)} disabled={saving} className="btn-primary text-sm py-2" style={{ flex: 1 }}>
                {saving ? "Sparar..." : "Spara"}
              </button>
              <button onClick={() => deleteTeam(team.id, team.name)}
                style={{ padding: "8px 14px", borderRadius: "10px", border: "none", cursor: "pointer",
                  background: "rgba(139,38,53,0.1)", color: "var(--lingon)", fontSize: "13px" }}>
                Ta bort lag
              </button>
            </div>
          </div>
        )}

        {/* Members display */}
        {!isEditing && (
          <div style={{ padding: "10px 16px" }}>
            {members.length === 0 ? (
              <p style={{ fontSize: "13px", color: "var(--text-muted)", margin: 0 }}>Inga medlemmar</p>
            ) : (
              <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                {members.map((m) => (
                  <span key={m.id} style={{
                    fontSize: "12px", padding: "3px 10px", borderRadius: "20px", fontWeight: m.id === me.id ? 700 : 500,
                    background: team.color + "22", color: team.color,
                    border: m.id === me.id ? `1px solid ${team.color}66` : "none",
                  }}>
                    {m.name}
                  </span>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="page-bg px-4 pt-6 pb-12 max-w-md mx-auto">
      <div className="pt-4 pb-5">
        <p className="page-subtitle mb-1">Officiella lag</p>
        <h1 className="page-title">Lag</h1>
        <div className="gold-rule" />
        {allUsers.length > 0 && (
          <p className="text-sm mt-2" style={{ color: "var(--text-muted)" }}>
            {allUsers.length} gäster · {teams.length} lag
            {unassigned.length > 0 && ` · ${unassigned.length} utan lag`}
          </p>
        )}
      </div>

      {/* Lekledare actions */}
      {isLekledare && (
        <div style={{ display: "flex", gap: "8px", marginBottom: "20px" }}>
          <button
            onClick={() => { setShowRandomize((v) => !v); setShowCreate(false); setEditingId(null); }}
            className="btn-outline text-sm py-2"
            style={{ flex: 1 }}
          >
            🎲 Slumpa lag
          </button>
          <button
            onClick={() => { setShowCreate((v) => !v); setShowRandomize(false); setEditingId(null); }}
            className="btn-gold text-sm py-2"
            style={{ flex: 1 }}
          >
            + Skapa lag
          </button>
        </div>
      )}

      {/* Randomize panel */}
      {isLekledare && showRandomize && (
        <div className="card px-4 py-4 mb-5 space-y-4">
          <p style={{ fontWeight: 600, fontSize: "14px", color: "var(--text-dark)", margin: 0 }}>Slumpa om alla gäster</p>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
            <span style={{ fontSize: "13px", color: "var(--text-muted)" }}>Antal lag:</span>
            {[2, 3, 4, 5, 6, 7, 8].map((n) => (
              <button key={n} onClick={() => updateTeamCount(n)}
                style={{
                  width: "32px", height: "32px", borderRadius: "8px", fontSize: "13px", fontWeight: 600,
                  background: teamCount === n ? "var(--blue-deep)" : "var(--birch)",
                  color: teamCount === n ? "white" : "var(--text-muted)",
                  border: "1px solid var(--border)", cursor: "pointer",
                }}>
                {n}
              </button>
            ))}
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
            {teamNames.map((name, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <div style={{ width: "12px", height: "12px", borderRadius: "50%", background: TEAM_COLORS[i], flexShrink: 0 }} />
                <input
                  value={name}
                  onChange={(e) => setTeamNames((prev) => prev.map((n, j) => j === i ? e.target.value : n))}
                  className="flex-1 px-3 py-2 rounded-lg border text-sm outline-none"
                  style={{ borderColor: "var(--border)", background: "var(--birch)" }}
                />
              </div>
            ))}
          </div>
          <p style={{ fontSize: "12px", color: "var(--text-muted)", margin: 0 }}>
            ⚠️ Raderar befintliga lag och slumpar om alla {allUsers.length} registrerade gäster
          </p>
          <button onClick={randomize} disabled={randomizing} className="btn-primary">
            {randomizing ? "Slumpar..." : "🎲 Slumpa nu"}
          </button>
        </div>
      )}

      {/* Create team panel */}
      {isLekledare && showCreate && (
        <form onSubmit={createTeam} className="card px-4 py-4 mb-5 space-y-3">
          <p style={{ fontWeight: 600, fontSize: "14px", color: "var(--text-dark)", margin: 0 }}>Nytt lag</p>
          <input
            required placeholder="Lagnamn"
            value={newName} onChange={(e) => setNewName(e.target.value)}
            className="w-full px-3 py-2 rounded-lg border text-sm outline-none"
            style={{ borderColor: "var(--border)", background: "var(--birch)" }}
          />
          <div>
            <p style={{ fontSize: "11px", color: "var(--text-muted)", marginBottom: "8px" }}>Färg</p>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "8px" }}>
              {TEAM_COLORS.map((c) => (
                <button key={c} type="button" onClick={() => setNewColor(c)}
                  style={{ width: "40px", height: "40px", borderRadius: "50%", background: c, border: "none", cursor: "pointer",
                    outline: newColor === c ? `2px solid ${c}` : "none", outlineOffset: "3px" }} />
              ))}
            </div>
          </div>
          <div>
            <p style={{ fontSize: "11px", color: "var(--text-muted)", marginBottom: "8px" }}>Emoji</p>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "6px" }}>
              {TEAM_EMOJIS.map((em) => (
                <button key={em} type="button" onClick={() => setNewEmoji(em)}
                  style={{ width: "40px", height: "40px", borderRadius: "10px", fontSize: "18px", border: "none", cursor: "pointer",
                    background: newEmoji === em ? "var(--blue-deep)" : "var(--birch)" }}>
                  {em}
                </button>
              ))}
            </div>
          </div>
          <div style={{ display: "flex", gap: "8px" }}>
            <button type="submit" disabled={creating} className="btn-gold text-sm py-2" style={{ flex: 1 }}>
              {creating ? "..." : "Skapa lag"}
            </button>
            <button type="button" onClick={() => setShowCreate(false)}
              style={{ padding: "8px 14px", borderRadius: "10px", border: "1px solid var(--border)", background: "transparent", color: "var(--text-muted)", fontSize: "13px", cursor: "pointer" }}>
              Avbryt
            </button>
          </div>
        </form>
      )}

      {loading ? (
        <p style={{ textAlign: "center", color: "var(--text-muted)", marginTop: "40px" }}>Laddar...</p>
      ) : teams.length === 0 ? (
        <div className="card p-8 text-center" style={{ color: "var(--text-muted)" }}>
          {isLekledare ? "Skapa lag eller slumpa för att komma igång" : "Inga lag skapade ännu"}
        </div>
      ) : (
        <div className="space-y-3">
          {/* Own team first */}
          {myTeam && <TeamCard team={myTeam} isMine={true} />}
          {/* Rest of teams */}
          {otherTeams.map((team) => (
            <TeamCard key={team.id} team={team} isMine={false} />
          ))}
          {/* No team message */}
          {!myTeam && me.id && (
            <div className="card px-4 py-3" style={{ borderStyle: "dashed", borderColor: "var(--border)" }}>
              <p style={{ fontSize: "13px", color: "var(--text-muted)", margin: 0 }}>Du är inte med i något lag ännu.</p>
            </div>
          )}
        </div>
      )}

      {/* Unassigned users */}
      {isLekledare && unassigned.length > 0 && teams.length > 0 && (
        <div className="card px-4 py-3 mt-4">
          <p style={{ fontSize: "11px", fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--text-muted)", marginBottom: "8px" }}>
            Utan lag ({unassigned.length})
          </p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
            {unassigned.map((u) => (
              <span key={u.id} style={{ fontSize: "12px", padding: "3px 10px", borderRadius: "20px", background: "var(--birch)", color: "var(--text-muted)", border: "1px solid var(--border)" }}>
                {u.username}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
