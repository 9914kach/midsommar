import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function POST(req: NextRequest) {
  const userId = req.cookies.get("midsommar_user_id")?.value;
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { description, side, klunkar } = await req.json();
  if (!description?.trim()) return NextResponse.json({ error: "description required" }, { status: 400 });

  const { data: bet, error } = await supabase
    .from("bets")
    .insert({ description: description.trim(), created_by: userId })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  if (side && klunkar) {
    await supabase.from("bet_entries").insert({ bet_id: bet.id, user_id: userId, side, klunkar });
  }

  return NextResponse.json({ bet });
}
