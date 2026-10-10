import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { authOptions, can } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { gateMutation } from "@/lib/security";
import { priceQuote } from "@/features/pricing/engine";
import { isAvailable, validateStay } from "@/features/availability/engine";
import { BLOCKING_STATUSES } from "@/features/bookings/stateMachine";
import { makeReference } from "@/lib/format";
import { CARAVANS } from "@/data/catalogue";
import { sendNotification } from "@/lib/email";

const Body = z.object({
  slug: z.string(),
  pickup: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  return: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  travellers: z.number().int().min(1).max(6).default(2),
  customer: z.object({
    name: z.string().min(2).max(80),
    email: z.string().email(),
    phone: z.string().min(6).max(30),
    driverName: z.string().min(2).max(80).optional(),
    towMake: z.string().max(60).optional(),
    towModel: z.string().max(60).optional(),
  }),
  note: z.string().max(500).optional(),
}).strict();

// POST /api/admin/bookings — staff-created manual reservation (walk-in / phone).
// Same availability guard as public checkout; priced by the same engine;
// created directly as confirmed with an audit trail.
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
  if (body.travellers > catalogue.maxTravellers) {
    return NextResponse.json({ error: `${catalogue.name} accommodates up to ${catalogue.maxTravellers} travellers.` }, { status: 422 });
  }

  const pickup = new Date(`${body.pickup}T12:00:00Z`);
  const ret = new Date(`${body.return}T12:00:00Z`);
  // Manual bookings skip the 2-day notice rule (staff can take late walk-ins).
  const stayError = validateStay(pickup, ret, { minNights: catalogue.minNights, maxNights: catalogue.maxNights });
  if (stayError) return NextResponse.json({ error: stayError }, { status: 422 });

  try {
    const caravan = await prisma.caravan.findUnique({
      where: { slug: body.slug },
      include: {
        bookings: { where: { status: { in: [...BLOCKING_STATUSES] } } },
        holds: true, blocks: true, maintenance: { where: { done: false } },
      },
    });
    if (!caravan) return NextResponse.json({ error: "Fleet not seeded." }, { status: 503 });

    const existing = [
      ...caravan.bookings.map((b) => ({ start: new Date(b.pickupDate), end: new Date(b.returnDate) })),
      ...caravan.holds.filter((h) => new Date(h.expiresAt) > new Date()).map((h) => ({ start: new Date(h.pickupDate), end: new Date(h.returnDate) })),
      ...caravan.blocks.map((b) => ({ start: new Date(b.startDate), end: new Date(b.endDate) })),
      ...caravan.maintenance.map((m) => ({ start: new Date(m.startDate), end: new Date(m.endDate) })),
    ];
    if (!isAvailable({ start: pickup, end: ret }, existing).ok) {
      return NextResponse.json({ error: "Those dates conflict with an existing reservation, hold or maintenance block." }, { status: 409 });
    }

    const quote = priceQuote({
      baseNightlyPence: caravan.baseNightlyPence,
      weekendNightlyPence: caravan.weekendNightlyPence ?? undefined,
      weeklyDiscountPct: caravan.weeklyDiscountPct,
      pickupISO: body.pickup, returnISO: body.return,
      cleaningFeePence: caravan.cleaningFeePence,
      extras: [], taxPct: 20,
      securityDepositPence: caravan.securityDepositPence, depositPct: 25,
    });

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
          pickupDate: pickup, returnDate: ret, travellers: body.travellers, status: "confirmed",
          subtotalPence: quote.rentalSubtotalPence, discountPence: quote.weeklyDiscountPence,
          feesPence: quote.feesPence, extrasPence: 0, taxPence: quote.taxPence,
          totalPence: quote.totalPence, depositDuePence: quote.depositDuePence,
          securityDepositPence: quote.securityDepositPence, currency: "GBP",
          quoteSnapshot: JSON.stringify({ ...quote, caravan: caravan.slug, pickup: body.pickup, return: body.return, manual: true }),
          driver: body.customer.driverName ? { create: { fullName: body.customer.driverName } } : undefined,
          towVehicle: body.customer.towMake ? { create: { make: body.customer.towMake, model: body.customer.towModel ?? "" } } : undefined,
          statusHistory: { create: [{ from: null, to: "confirmed", actor: role, note: `Manual booking${body.note ? `: ${body.note}` : ""}` }] },
        },
      });
      await tx.auditLog.create({ data: { action: "booking:manual_create", resource: "booking", resourceId: created.id, detail: `${reference} by ${role}` } });
      return created;
    });

    await sendNotification({ bookingId: booking.id, kind: "booking_created", to: body.customer.email, subject: `Reservation ${reference} — booked by our team`, body: `Your ${caravan.name} hire ${body.pickup} → ${body.return} is confirmed. Total ${quote.totalPence}p incl. VAT.` }).catch(() => {});
    return NextResponse.json({ id: booking.id, reference }, { status: 201 });
  } catch (e) {
    if (e instanceof Error && e.message === "CONFLICT") {
      return NextResponse.json({ error: "Conflict — those dates were just taken." }, { status: 409 });
    }
    console.error("[admin bookings]", e);
    return NextResponse.json({ error: "Could not create booking." }, { status: 500 });
  }
}
