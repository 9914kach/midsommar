import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function PATCH(request: NextRequest) {
  const userId =
    request.cookies.get("midsommar_user_id")?.value ??
    request.cookies.get("midsommar_user_id_pub")?.value;
  if (!userId) return NextResponse.json({ error: "Not logged in" }, { status: 401 });

  const { units } = await request.json();
  if (typeof units !== "number") return NextResponse.json({ error: "units required" }, { status: 400 });

  const { error } = await supabase
    .from("users")
    .update({ drink_units: units })
    .eq("id", userId);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}

export async function GET(request: NextRequest) {
  const userId =
    request.cookies.get("midsommar_user_id")?.value ??
    request.cookies.get("midsommar_user_id_pub")?.value;
  if (!userId) return NextResponse.json({ units: 0 });

  const { data } = await supabase
    .from("users")
    .select("drink_units")
    .eq("id", userId)
    .single();

  return NextResponse.json({ units: data?.drink_units ?? 0 });
}
