import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await request.json();
  const { score_a, score_b, status, winner, reset, set_team_a, set_team_b } = body;

  // ── Directly set team slots (for manual bracket rearrangement) ───────────
  if (set_team_a !== undefined || set_team_b !== undefined) {
    const update: { team_a_id?: string | null; team_b_id?: string | null } = {};
    if (set_team_a !== undefined) update.team_a_id = set_team_a ?? null;
    if (set_team_b !== undefined) update.team_b_id = set_team_b ?? null;
    const { error } = await supabase.from("matches").update(update).eq("id", id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true });
  }

  // ── Reset a completed bracket match ──────────────────────────────────────
  if (reset) {
    const { data: match } = await supabase.from("matches").select("*").eq("id", id).single();
    if (!match) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const oldWinnerId = match.score_a > match.score_b ? match.team_a_id : match.team_b_id;

    // Remove old winner from next-round match slot
    if (match.bracket_position !== null) {
      const nextPos = Math.ceil(match.bracket_position / 2);
      const { data: nextMatch } = await supabase
        .from("matches").select("id, team_a_id, team_b_id")
        .eq("tournament_id", match.tournament_id)
        .eq("round", match.round + 1)
        .eq("bracket_position", nextPos)
        .maybeSingle();
      if (nextMatch) {
        const isOdd = match.bracket_position % 2 === 1;
        await supabase.from("matches")
          .update(isOdd ? { team_a_id: null } : { team_b_id: null })
          .eq("id", nextMatch.id);
      }
    }

    // Subtract points from old winner
    if (oldWinnerId) {
      const { data: winner } = await supabase.from("tournament_teams").select("points").eq("id", oldWinnerId).single();
      if (winner) {
        await supabase.from("tournament_teams").update({ points: Math.max(0, (winner.points ?? 0) - 3) }).eq("id", oldWinnerId);
      }
    }

    await supabase.from("matches").update({ status: "pending", score_a: 0, score_b: 0 }).eq("id", id);
    return NextResponse.json({ ok: true });
  }

  // ── Declare winner shorthand ─────────────────────────────────────────────
  let resolvedScoreA = score_a;
  let resolvedScoreB = score_b;
  let resolvedStatus = status;
  if (winner === "a") { resolvedScoreA = 1; resolvedScoreB = 0; resolvedStatus = "completed"; }
  if (winner === "b") { resolvedScoreA = 0; resolvedScoreB = 1; resolvedStatus = "completed"; }

  const updatePayload: {
    score_a?: number;
    score_b?: number;
    status?: "pending" | "active" | "completed";
  } = {};
  if (resolvedScoreA !== undefined) updatePayload.score_a = resolvedScoreA;
  if (resolvedScoreB !== undefined) updatePayload.score_b = resolvedScoreB;
  if (resolvedStatus !== undefined) updatePayload.status = resolvedStatus;

  const { data: match, error } = await supabase
    .from("matches")
    .update(updatePayload)
    .eq("id", id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const hasBothTeams = match.team_a_id && match.team_b_id;
  const hasByeMatch = (match.team_a_id || match.team_b_id) && !(match.team_a_id && match.team_b_id);

  if (resolvedStatus === "completed" && (hasBothTeams || hasByeMatch)) {
    const finalScoreA = resolvedScoreA ?? match.score_a;
    const finalScoreB = resolvedScoreB ?? match.score_b;

    let winnerId: string | null = null;
    let loserId: string | null = null;
    const isDraw = finalScoreA === finalScoreB;

    if (!isDraw) {
      winnerId = finalScoreA > finalScoreB ? match.team_a_id : match.team_b_id;
      loserId = finalScoreA > finalScoreB ? match.team_b_id : match.team_a_id;
    }

    if (isDraw && match.team_a_id && match.team_b_id) {
      const { data: teamA } = await supabase
        .from("tournament_teams")
        .select("points")
        .eq("id", match.team_a_id)
        .single();
      const { data: teamB } = await supabase
        .from("tournament_teams")
        .select("points")
        .eq("id", match.team_b_id)
        .single();

      if (teamA) {
        await supabase
          .from("tournament_teams")
          .update({ points: (teamA.points ?? 0) + 1 })
          .eq("id", match.team_a_id);
      }
      if (teamB) {
        await supabase
          .from("tournament_teams")
          .update({ points: (teamB.points ?? 0) + 1 })
          .eq("id", match.team_b_id);
      }

      if (match.bracket_position !== null && typeof match.bracket_position === "number") {
        const nextRound = match.round + 1;
        const nextPosition = Math.ceil(match.bracket_position / 2);
        const { data: nextMatch } = await supabase
          .from("matches")
          .select("id, team_a_id, team_b_id")
          .eq("tournament_id", match.tournament_id)
          .eq("round", nextRound)
          .eq("bracket_position", nextPosition)
          .maybeSingle();

        if (nextMatch && match.team_a_id) {
          const isOdd = match.bracket_position % 2 === 1;
          await supabase
            .from("matches")
            .update(isOdd ? { team_a_id: match.team_a_id } : { team_b_id: match.team_a_id })
            .eq("id", nextMatch.id);
        }
      }
    } else if (hasByeMatch && !winnerId) {
      const victoryTeam = match.team_a_id || match.team_b_id;
      if (victoryTeam) {
        const { data: team } = await supabase.from("tournament_teams").select("points").eq("id", victoryTeam).single();
        if (team) {
          await supabase.from("tournament_teams").update({ points: (team.points ?? 0) + 3 }).eq("id", victoryTeam);
        }

        if (match.bracket_position !== null && typeof match.bracket_position === "number") {
          const nextRound = match.round + 1;
          const nextPosition = Math.ceil(match.bracket_position / 2);
          const { data: nextMatch } = await supabase
            .from("matches")
            .select("id, team_a_id, team_b_id")
            .eq("tournament_id", match.tournament_id)
            .eq("round", nextRound)
            .eq("bracket_position", nextPosition)
            .maybeSingle();

          if (nextMatch) {
            const isOdd = match.bracket_position % 2 === 1;
            await supabase
              .from("matches")
              .update(isOdd ? { team_a_id: victoryTeam } : { team_b_id: victoryTeam })
              .eq("id", nextMatch.id);
          }
        }
      }
    } else if (winnerId && loserId) {
      const { data: winner } = await supabase
        .from("tournament_teams")
        .select("points")
        .eq("id", winnerId)
        .single();

      if (winner) {
        await supabase
          .from("tournament_teams")
          .update({ points: (winner.points ?? 0) + 3 })
          .eq("id", winnerId);
      }

      if (match.bracket_position !== null && typeof match.bracket_position === "number") {
        const nextRound = match.round + 1;
        const nextPosition = Math.ceil(match.bracket_position / 2);

        const { data: nextMatch } = await supabase
          .from("matches")
          .select("id, team_a_id, team_b_id")
          .eq("tournament_id", match.tournament_id)
          .eq("round", nextRound)
          .eq("bracket_position", nextPosition)
          .maybeSingle();

        if (nextMatch) {
          const isOdd = match.bracket_position % 2 === 1;
          await supabase
            .from("matches")
            .update(isOdd ? { team_a_id: winnerId } : { team_b_id: winnerId })
            .eq("id", nextMatch.id);
        }
      }
    }
  }

  return NextResponse.json({ match });
}
