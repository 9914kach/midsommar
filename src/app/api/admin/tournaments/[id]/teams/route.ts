import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const { name, color, official_team_id, memberUserIds } = await request.json();

  const { data: team, error } = await supabase
    .from("tournament_teams")
    .insert({ tournament_id: id, name, color, official_team_id })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  if (memberUserIds && memberUserIds.length > 0) {
    const memberInserts = memberUserIds.map((userId: string) => ({
      tournament_team_id: team.id,
      user_id: userId,
    }));
    await supabase.from("tournament_team_members").insert(memberInserts);
  }

  return NextResponse.json({ team });
}
