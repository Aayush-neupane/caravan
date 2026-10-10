import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { authOptions, can } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { cleanText, gateMutation } from "@/lib/security";

const MD = z.string().regex(/^(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/, "Use MM-DD.");

const SeasonalBody = z.object({
  kind: z.literal("seasonal"),
  name: cleanText(2, 80),
  startMonthDay: MD,
  endMonthDay: MD,
  multiplierPct: z.number().int().min(100).max(200),
  active: z.boolean().default(true),
}).strict();

const DiscountBody = z.object({
  kind: z.literal("discount"),
  name: cleanText(2, 80),
  minNights: z.number().int().min(2).max(60),
  pct: z.number().int().min(0).max(50),
  active: z.boolean().default(true),
}).strict();

// Month-day ranges with wraparound (Dec→Jan) expanded to comparable segments.
export function mdDay(md: string): number {
  const [m, d] = md.split("-").map(Number);
  return m * 100 + d;
}

// Real calendar check (regex alone accepts 02-31): month lengths, Feb 29 allowed.
export function isMonthDay(md: string): boolean {
  const m = /^(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/.exec(md);
  if (!m) return false;
  const month = Number(m[1]);
  const day = Number(m[2]);
  const days = [0, 31, 29, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31][month];
  return day <= days;
}

export function mdOverlap(aStart: string, aEnd: string, bStart: string, bEnd: string): boolean {
  const segs = (s: string, e: string): [number, number][] => {
    const a = mdDay(s);
    const b = mdDay(e);
    if (a <= b) return [[a, b]];
    return [
      [a, 1231],
      [101, b],
    ];
  };
  for (const [a1, a2] of segs(aStart, aEnd))
    for (const [b1, b2] of segs(bStart, bEnd)) if (a1 <= b2 && b1 <= a2) return true;
  return false;
}

// POST /api/admin/pricing — create a seasonal or discount rule. Takes effect
// on the next quote: the engine reads live DB rules (first match wins).
export async function POST(req: Request) {
  const denied = gateMutation(req, "admin:pricing", 60, 60_000);
  if (denied) return denied;
  const session = await getServerSession(authOptions);
  const role = (session?.user as { role?: string } | undefined)?.role;
  if (!session || !can("pricing:write", role)) return NextResponse.json({ error: "Owner or admin required." }, { status: 403 });

  let raw: unknown;
  try {
    raw = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }
  const kind = (raw as { kind?: string } | null)?.kind;
  try {
    if (kind === "seasonal") {
      const b = SeasonalBody.parse(raw);
      if (!isMonthDay(b.startMonthDay) || !isMonthDay(b.endMonthDay)) {
        return NextResponse.json({ error: "Start/end must be real calendar dates (MM-DD)." }, { status: 422 });
      }
      const others = await prisma.seasonalRate.findMany({ where: { active: true } });
      if (others.some((o) => mdOverlap(o.startMonthDay, o.endMonthDay, b.startMonthDay, b.endMonthDay))) {
        return NextResponse.json({ error: "Overlaps an existing active seasonal rule — only one multiplier applies per night." }, { status: 409 });
      }
      const created = await prisma.seasonalRate.create({
        data: { name: b.name, startMonthDay: b.startMonthDay, endMonthDay: b.endMonthDay, multiplierPct: b.multiplierPct, active: b.active },
      });
      await prisma.auditLog.create({ data: { action: "pricing:seasonal_create", resource: "seasonalRate", resourceId: created.id, detail: `${b.name} ${b.startMonthDay}→${b.endMonthDay} ×${b.multiplierPct} by ${session.user?.email ?? role}` } });
      return NextResponse.json({ ok: true, id: created.id }, { status: 201 });
    }
    if (kind === "discount") {
      const b = DiscountBody.parse(raw);
      const created = await prisma.discountRule.create({
        data: { name: b.name, minNights: b.minNights, pct: b.pct, active: b.active },
      });
      await prisma.auditLog.create({ data: { action: "pricing:discount_create", resource: "discountRule", resourceId: created.id, detail: `${b.name} ${b.minNights}n+ ${b.pct}% by ${session.user?.email ?? role}` } });
      return NextResponse.json({ ok: true, id: created.id }, { status: 201 });
    }
    return NextResponse.json({ error: 'kind must be "seasonal" or "discount".' }, { status: 400 });
  } catch {
    return NextResponse.json({ error: "Check name, dates (MM-DD), multiplier 100–200, pct 0–50." }, { status: 400 });
  }
}
