import { NextResponse } from "next/server";
import { getBlockedNights } from "@/features/availability/blocked";
import { gateMutation } from "@/lib/security";

// GET /api/calendar?slug=the-rowan — blocked nights + stay limits for the picker.
export async function GET(req: Request) {
  const denied = gateMutation(req, "calendar:get", 30, 60_000);
  if (denied) return denied;
  const { searchParams } = new URL(req.url);
  const slug = searchParams.get("slug");
  if (!slug) return NextResponse.json({ error: "Missing slug." }, { status: 400 });
  try {
    const data = await getBlockedNights(slug);
    return NextResponse.json(data, {
      headers: { "cache-control": "private, max-age=60" },
    });
  } catch {
    return NextResponse.json({ error: "Calendar unavailable." }, { status: 404 });
  }
}
