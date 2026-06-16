import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function POST(req: NextRequest) {
  const userId = req.cookies.get("midsommar_user_id")?.value;
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { title, lyrics, melody } = await req.json();
  if (!title?.trim()) return NextResponse.json({ error: "title required" }, { status: 400 });
  if (!lyrics?.trim()) return NextResponse.json({ error: "lyrics required" }, { status: 400 });

  const { data: user } = await supabase.from("users").select("username").eq("id", userId).single();

  const { data, error } = await supabase
    .from("custom_snapsvisor")
    .insert({
      title: title.trim(),
      lyrics: lyrics.trim(),
      melody: melody?.trim() || null,
      created_by: userId,
      creator_name: user?.username ?? null,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ visa: data });
}
