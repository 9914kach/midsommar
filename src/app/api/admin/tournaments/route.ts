import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function POST(request: NextRequest) {
  const { name, game, format } = await request.json();

  const { data, error } = await supabase
    .from("tournaments")
    .insert({ name, game, format })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ tournament: data });
}
