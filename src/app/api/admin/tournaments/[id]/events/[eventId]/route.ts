import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; eventId: string }> }
) {
  const { eventId } = await params;
  const body = await request.json();
  const payload: { name?: string; scoring_type?: string; placement_points?: string | null; sort_order?: number } = {};
  if (body.name !== undefined) payload.name = body.name;
  if (body.scoring_type !== undefined) payload.scoring_type = body.scoring_type;
  if (body.placement_points !== undefined) payload.placement_points = body.placement_points || null;
  if (body.sort_order !== undefined) payload.sort_order = body.sort_order;

  const { data, error } = await supabase
    .from("tournament_events")
    .update(payload)
    .eq("id", eventId)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ event: data });
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string; eventId: string }> }
) {
  const { eventId } = await params;
  const { error } = await supabase.from("tournament_events").delete().eq("id", eventId);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
