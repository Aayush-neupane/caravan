import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { cleanText, gateMutation } from "@/lib/security";
import { logger } from "@/lib/logger";

const Body = z
  .object({
    caravanSlug: z.string().min(1).max(80).optional(),
    bookingRef: z.string().min(3).max(24).optional(),
    author: cleanText(2, 80),
    rating: z.number().int().min(1).max(5),
    title: cleanText(0, 120).optional(),
    body: cleanText(10, 2000),
  })
  .strict();

// POST /api/reviews — public review submission. Held unpublished for staff
// moderation (published=false, verified=false); admin publishes after stay.
export async function POST(req: Request) {
  const denied = gateMutation(req, "reviews:submit", 5, 60_000);
  if (denied) return denied;
  let body: z.infer<typeof Body>;
  try {
    body = Body.parse(await req.json());
  } catch {
    return NextResponse.json({ error: "Give your name, a 1–5 rating and a few words (10+ characters)." }, { status: 400 });
  }
  try {
    const created = await prisma.review.create({
      data: {
        caravanId: body.caravanSlug?.slice(0, 80) ?? null,
        author: body.author,
        rating: body.rating,
        title: body.title || null,
        body: body.body,
        verified: false,
        bookingRef: body.bookingRef?.trim().toUpperCase() ?? null,
        published: false,
      },
    });
    logger.info("[reviews] submitted");
    return NextResponse.json({ ok: true, id: created.id }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Could not submit your review." }, { status: 500 });
  }
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const slug = (searchParams.get("slug") ?? "").slice(0, 80);
  try {
    const rows = await prisma.review.findMany({
      where: { published: true, ...(slug ? { caravanId: slug } : {}) },
      orderBy: { createdAt: "desc" },
      take: 20,
      select: { author: true, rating: true, title: true, body: true, createdAt: true, verified: true },
    });
    return NextResponse.json({ reviews: rows });
  } catch {
    return NextResponse.json({ error: "Could not load reviews." }, { status: 500 });
  }
}
