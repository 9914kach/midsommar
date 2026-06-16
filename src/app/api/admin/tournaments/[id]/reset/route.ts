import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { hasRole } from "@/lib/roles";
import type { Role } from "@/lib/roles";

function getRole(req: NextRequest): Role {
  return (req.cookies.get("midsommar_role")?.value ?? "gäst") as Role;
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!hasRole(getRole(req), "lekledare")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;

  const { error: matchErr } = await supabase
    .from("matches")
    .delete()
    .eq("tournament_id", id);

  if (matchErr) return NextResponse.json({ error: matchErr.message }, { status: 500 });

  const { error: pointsErr } = await supabase
    .from("tournament_teams")
    .update({ points: 0 })
    .eq("tournament_id", id);

  if (pointsErr) return NextResponse.json({ error: pointsErr.message }, { status: 500 });

  return NextResponse.json({ ok: true });
}
