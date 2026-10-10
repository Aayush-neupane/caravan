import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { priceQuote, seasonalMultiplierFor } from "@/features/pricing/engine";
import { isAvailable, validateStay } from "@/features/availability/engine";
import { BLOCKING_STATUSES } from "@/features/bookings/stateMachine";
import { CARAVANS } from "@/data/catalogue";

const Body = z.object({
  slug: z.string(),
  pickup: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  return: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  travellers: z.number().int().min(1).max(6).default(2),
  extras: z.array(z.object({ slug: z.string(), qty: z.number().int().min(0).max(10) })).default([]),
  coupon: z.string().optional(),
});

// POST /api/quote — server-side availability + itemised pricing. Never trusts browser totals.
export async function POST(req: Request) {
  let body: z.infer<typeof Body>;
  try {
    body = Body.parse(await req.json());
  } catch {
    return NextResponse.json({ error: "Choose valid pickup and return dates." }, { status: 400 });
  }

  const catalogue = CARAVANS.find((c) => c.slug === body.slug);
  if (!catalogue) return NextResponse.json({ error: "Unknown caravan." }, { status: 404 });

  const pickup = new Date(`${body.pickup}T12:00:00Z`);
  const ret = new Date(`${body.return}T12:00:00Z`);
  const stayError = validateStay(pickup, ret, { minNights: catalogue.minNights, maxNights: catalogue.maxNights, minNoticeDays: 2 });
  if (stayError) return NextResponse.json({ error: stayError, available: false }, { status: 422 });
  if (body.travellers > catalogue.maxTravellers) {
    return NextResponse.json({ error: `${catalogue.name} accommodates up to ${catalogue.maxTravellers} travellers.` }, { status: 422 });
  }

  try {
    const caravan = await prisma.caravan.findUnique({
      where: { slug: body.slug },
      include: { bookings: { where: { status: { in: [...BLOCKING_STATUSES] } } }, holds: true, blocks: true, maintenance: { where: { done: false } } },
    });
    if (!caravan) {
      // DB not seeded yet — fall back to catalogue availability (open).
      const quote = priceQuote({
        baseNightlyPence: catalogue.baseNightlyPence,
        weekendNightlyPence: catalogue.weekendNightlyPence,
        weeklyDiscountPct: catalogue.weeklyDiscountPct,
        seasonalMultiplierPct: seasonalMultiplierFor(body.pickup),
        pickupISO: body.pickup, returnISO: body.return,
        cleaningFeePence: catalogue.cleaningFeePence,
        extras: [], taxPct: 20,
        securityDepositPence: catalogue.securityDepositPence, depositPct: 25,
      });
      return NextResponse.json({ available: true, quote, caravan: catalogue, seeded: false });
    }

    const existing = [
      ...caravan.bookings.map((b) => ({ start: new Date(b.pickupDate), end: new Date(b.returnDate) })),
      ...caravan.holds.filter((h) => new Date(h.expiresAt) > new Date()).map((h) => ({ start: new Date(h.pickupDate), end: new Date(h.returnDate) })),
      ...caravan.blocks.map((b) => ({ start: new Date(b.startDate), end: new Date(b.endDate) })),
      ...caravan.maintenance.map((m) => ({ start: new Date(m.startDate), end: new Date(m.endDate) })),
    ];
    const check = isAvailable({ start: pickup, end: ret }, existing);
    if (!check.ok) {
      return NextResponse.json({ available: false, message: "Those dates are no longer available. Choose another range to continue.", quote: null }, { status: 200 });
    }

    const quote = priceQuote({
      baseNightlyPence: caravan.baseNightlyPence,
      weekendNightlyPence: caravan.weekendNightlyPence ?? catalogue.weekendNightlyPence,
      weeklyDiscountPct: caravan.weeklyDiscountPct,
      seasonalMultiplierPct: seasonalMultiplierFor(body.pickup),
      pickupISO: body.pickup, returnISO: body.return,
      cleaningFeePence: caravan.cleaningFeePence,
      extras: [], taxPct: 20,
      securityDepositPence: caravan.securityDepositPence, depositPct: 25,
    });
    return NextResponse.json({ available: true, quote, caravan: { name: caravan.name, slug: caravan.slug } });
  } catch (e) {
    console.error("[quote]", e);
    return NextResponse.json({ error: "Availability check failed. Please try again." }, { status: 500 });
  }
}
