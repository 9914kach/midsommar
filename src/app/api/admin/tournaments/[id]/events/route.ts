import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const { name, scoring_type, description } = await request.json();

  const { data, error } = await supabase
    .from("tournament_events")
    .insert({ tournament_id: id, name, scoring_type: scoring_type ?? "points", description: description || null })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ event: data });
}
