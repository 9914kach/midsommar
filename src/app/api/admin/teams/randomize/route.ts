import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { shuffle } from "@/lib/tournament";

export async function POST(request: NextRequest) {
  const { teamNames, teamColors, teamEmojis } = await request.json();

  await supabase.from("official_team_members").delete().neq("user_id", "00000000-0000-0000-0000-000000000000");
  await supabase.from("official_teams").delete().neq("id", "00000000-0000-0000-0000-000000000000");

  const { data: users } = await supabase.from("users").select("id");
  if (!users) return NextResponse.json({ error: "No users" }, { status: 500 });

  const shuffledUsers = shuffle(users);
  const teamCount = teamNames.length;

  const teamInserts = teamNames.map((name: string, i: number) => ({
    name,
    color: teamColors[i] ?? "#888888",
    emoji: teamEmojis[i] ?? "⭐",
  }));

  const { data: teams, error } = await supabase
    .from("official_teams")
    .insert(teamInserts)
    .select();

  if (error || !teams) return NextResponse.json({ error: error?.message }, { status: 500 });

  const memberInserts: { user_id: string; team_id: string }[] = [];
  shuffledUsers.forEach((user, idx) => {
    const teamIndex = idx % teamCount;
    memberInserts.push({ user_id: user.id, team_id: teams[teamIndex].id });
  });

  if (memberInserts.length > 0) {
    await supabase.from("official_team_members").insert(memberInserts);
  }

  const { data: teamsWithMembers } = await supabase
    .from("official_teams")
    .select("*, official_team_members(user_id, users(username))");

  return NextResponse.json({ teams: teamsWithMembers });
}
