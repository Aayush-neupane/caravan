import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { authOptions, can } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { gateMutation } from "@/lib/security";
import { priceQuote } from "@/features/pricing/engine";
import { getPricingRules, resolveWeeklyPct } from "@/features/pricing/rules";
import { isAvailable, validateStay } from "@/features/availability/engine";
import { BLOCKING_STATUSES } from "@/features/bookings/stateMachine";
import { makeReference, nightsBetween, parseISODate } from "@/lib/format";
import { CARAVANS } from "@/data/catalogue";
import { sendNotification } from "@/lib/email";
import { isCalendarDate } from "@/lib/security";

const Body = z.object({
  slug: z.string().min(1).max(80),
  pickup: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  return: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  travellers: z.number().int().min(1).max(6).default(2),
  customer: z.object({
    name: z.string().min(2).max(80).regex(/^[^<>]*$/),
    email: z.string().email().max(254),
    phone: z.string().min(6).max(30).regex(/^[^<>]*$/),
    driverName: z.string().min(2).max(80).regex(/^[^<>]*$/).optional(),
    towMake: z.string().max(60).regex(/^[^<>]*$/).optional(),
    towModel: z.string().max(60).regex(/^[^<>]*$/).optional(),
  }),
  note: z.string().max(500).regex(/^[^<>]*$/).optional(),
}).strict();

// POST /api/admin/bookings — staff-created manual reservation (walk-in / phone).
// Same availability guard as public checkout; priced by the same engine;
// created as awaiting_payment (payment verified separately) with audit trail.
export async function POST(req: Request) {
  const denied = gateMutation(req, "admin:bookings", 60, 60_000);
  if (denied) return denied;
  const session = await getServerSession(authOptions);
  const role = (session?.user as { role?: string } | undefined)?.role;
  if (!session || !can("bookings:write", role)) return NextResponse.json({ error: "Staff access required." }, { status: 403 });

  let body: z.infer<typeof Body>;
  try {
    body = Body.parse(await req.json());
  } catch {
    return NextResponse.json({ error: "Complete caravan, valid dates and guest details." }, { status: 400 });
  }

  const catalogue = CARAVANS.find((c) => c.slug === body.slug);
  if (!catalogue) return NextResponse.json({ error: "Unknown caravan." }, { status: 404 });

  if (!isCalendarDate(body.pickup) || !isCalendarDate(body.return)) {
    return NextResponse.json({ error: "Invalid pickup/return date." }, { status: 422 });
  }
  const pickup = new Date(`${body.pickup}T12:00:00Z`);
  const ret = new Date(`${body.return}T12:00:00Z`);

  try {
    const caravan = await prisma.caravan.findUnique({
      where: { slug: body.slug },
      include: {
        bookings: { where: { status: { in: [...BLOCKING_STATUSES] } } },
        holds: true, blocks: true, maintenance: { where: { done: false } },
      },
    });
    if (!caravan) return NextResponse.json({ error: "Fleet not seeded." }, { status: 503 });
    if (body.travellers > caravan.maxTravellers) {
      return NextResponse.json({ error: `${caravan.name} accommodates up to ${caravan.maxTravellers} travellers.` }, { status: 422 });
    }
    // Manual bookings skip the 2-day notice rule (staff can take late walk-ins).
    const stayError = validateStay(pickup, ret, { minNights: caravan.minNights, maxNights: caravan.maxNights });
    if (stayError) return NextResponse.json({ error: stayError }, { status: 422 });

    const existing = [
      ...caravan.bookings.map((b) => ({ start: new Date(b.pickupDate), end: new Date(b.returnDate) })),
      ...caravan.holds.filter((h) => new Date(h.expiresAt) > new Date()).map((h) => ({ start: new Date(h.pickupDate), end: new Date(h.returnDate) })),
      ...caravan.blocks.map((b) => ({ start: new Date(b.startDate), end: new Date(b.endDate) })),
      ...caravan.maintenance.map((m) => ({ start: new Date(m.startDate), end: new Date(m.endDate) })),
    ];
    if (!isAvailable({ start: pickup, end: ret }, existing).ok) {
      return NextResponse.json({ error: "Those dates conflict with an existing reservation, hold or maintenance block." }, { status: 409 });
    }

    const rules = await getPricingRules();
    const quote = priceQuote({
      baseNightlyPence: caravan.baseNightlyPence,
      weekendNightlyPence: caravan.weekendNightlyPence ?? undefined,
      weeklyDiscountPct: resolveWeeklyPct(
        caravan.weeklyDiscountPct,
        nightsBetween(parseISODate(body.pickup), parseISODate(body.return)),
        rules.discounts
      ),
      pickupISO: body.pickup, returnISO: body.return,
      cleaningFeePence: caravan.cleaningFeePence,
      extras: [], taxPct: 10,
      securityDepositPence: caravan.securityDepositPence, depositPct: 25,
    }, null, rules.seasonal);

    const reference = makeReference();
    const booking = await prisma.$transaction(async (tx) => {
      const bufEnd = new Date(ret);
      bufEnd.setUTCDate(bufEnd.getUTCDate() + 1);
      const clashBooking = await tx.booking.findFirst({
        where: { caravanId: caravan.id, status: { in: [...BLOCKING_STATUSES] }, pickupDate: { lt: bufEnd }, returnDate: { gt: pickup } },
      });
      if (clashBooking) {
        const exEnd = new Date(clashBooking.returnDate);
        exEnd.setUTCDate(exEnd.getUTCDate() + 1);
        if (new Date(clashBooking.pickupDate) < bufEnd && pickup < exEnd) throw new Error("CONFLICT");
      }
      const nowTs = new Date();
      const clashHold = await tx.bookingHold.findFirst({
        where: { caravanId: caravan.id, expiresAt: { gt: nowTs }, pickupDate: { lt: bufEnd }, returnDate: { gt: pickup } },
      });
      if (clashHold) throw new Error("CONFLICT");
      const clashBlock = await tx.availabilityBlock.findFirst({
        where: { caravanId: caravan.id, startDate: { lt: bufEnd }, endDate: { gt: pickup } },
      });
      if (clashBlock) throw new Error("CONFLICT");
      const clashMaint = await tx.maintenanceRecord.findFirst({
        where: { caravanId: caravan.id, done: false, startDate: { lt: bufEnd }, endDate: { gt: pickup } },
      });
      if (clashMaint) throw new Error("CONFLICT");
      const created = await tx.booking.create({
        data: {
          reference, caravanId: caravan.id,
          guestName: body.customer.name, guestEmail: body.customer.email, guestPhone: body.customer.phone,
          pickupDate: pickup, returnDate: ret, travellers: body.travellers, status: "awaiting_payment",
          subtotalPence: quote.rentalSubtotalPence, discountPence: quote.weeklyDiscountPence,
          feesPence: quote.feesPence, extrasPence: 0, taxPence: quote.taxPence,
          totalPence: quote.totalPence, depositDuePence: quote.depositDuePence,
          securityDepositPence: quote.securityDepositPence, currency: "AUD",
          quoteSnapshot: JSON.stringify({ ...quote, caravan: caravan.slug, pickup: body.pickup, return: body.return, manual: true }),
          driver: body.customer.driverName ? { create: { fullName: body.customer.driverName } } : undefined,
          towVehicle: body.customer.towMake ? { create: { make: body.customer.towMake, model: body.customer.towModel ?? "" } } : undefined,
          statusHistory: { create: [{ from: null, to: "awaiting_payment", actor: role, note: `Manual booking (awaiting payment)${body.note ? `: ${body.note}` : ""}` }] },
        },
      });
      await tx.auditLog.create({ data: { action: "booking:manual_create", resource: "booking", resourceId: created.id, detail: `${reference} by ${role}`, actorId: (session.user as { id?: string })?.id ?? undefined } });
      return created;
    });

    await sendNotification({ bookingId: booking.id, kind: "booking_created", to: body.customer.email, subject: `Reservation ${reference} — booked by our team`, body: `Your ${caravan.name} hire ${body.pickup} → ${body.return} is confirmed. Total ${quote.totalPence}p incl. GST.` }).catch(() => {});
    return NextResponse.json({ id: booking.id, reference }, { status: 201 });
  } catch (e) {
    if (e instanceof Error && e.message === "CONFLICT") {
      return NextResponse.json({ error: "Conflict — those dates were just taken." }, { status: 409 });
    }
    console.error("[admin bookings]", { code: (e as Error).message?.slice(0, 120), caravanId: body.slug });
    return NextResponse.json({ error: "Could not create booking." }, { status: 500 });
  }
}
