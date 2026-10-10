import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { priceQuote, seasonalMultiplierFor } from "@/features/pricing/engine";
import { isAvailable, validateStay } from "@/features/availability/engine";
import { BLOCKING_STATUSES, assertTransition } from "@/features/bookings/stateMachine";
import { makeReference } from "@/lib/format";
import { CARAVANS, EXTRAS } from "@/data/catalogue";
import { sendNotification, bookingEmailBodies } from "@/lib/email";

const CreateBody = z.object({
  slug: z.string(),
  pickup: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  return: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  travellers: z.number().int().min(1).max(6),
  extras: z.array(z.object({ slug: z.string(), qty: z.number().int().min(0).max(10) })).default([]),
  coupon: z.string().optional(),
  customer: z.object({
    name: z.string().min(2).max(80),
    email: z.string().email(),
    phone: z.string().min(6).max(30),
    driverName: z.string().min(2).max(80),
    licenceCountry: z.string().default("United Kingdom"),
    towMake: z.string().min(1).max(60),
    towModel: z.string().min(1).max(60),
  }),
  agree: z.literal(true, { errorMap: () => ({ message: "You must accept the rental agreement." }) }),
});

// POST /api/bookings — creates hold + booking atomically with revalidated availability.
export async function POST(req: Request) {
  let body: z.infer<typeof CreateBody>;
  try {
    body = CreateBody.parse(await req.json());
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Invalid booking details." }, { status: 400 });
  }

  const catalogue = CARAVANS.find((c) => c.slug === body.slug);
  if (!catalogue) return NextResponse.json({ error: "Unknown caravan." }, { status: 404 });

  const pickup = new Date(`${body.pickup}T12:00:00Z`);
  const ret = new Date(`${body.return}T12:00:00Z`);
  const stayError = validateStay(pickup, ret, { minNights: catalogue.minNights, maxNights: catalogue.maxNights, minNoticeDays: 2 });
  if (stayError) return NextResponse.json({ error: stayError }, { status: 422 });

  try {
    const caravan = await prisma.caravan.findUnique({
      where: { slug: body.slug },
      include: {
        bookings: { where: { status: { in: [...BLOCKING_STATUSES] } } },
        holds: true, blocks: true, maintenance: { where: { done: false } },
      },
    });
    if (!caravan) return NextResponse.json({ error: "Fleet database is not seeded yet. Run `npm run seed`." }, { status: 503 });

    // Revalidate availability inside the critical section.
    const existing = [
      ...caravan.bookings.map((b) => ({ start: new Date(b.pickupDate), end: new Date(b.returnDate) })),
      ...caravan.holds.filter((h) => new Date(h.expiresAt) > new Date()).map((h) => ({ start: new Date(h.pickupDate), end: new Date(h.returnDate) })),
      ...caravan.blocks.map((b) => ({ start: new Date(b.startDate), end: new Date(b.endDate) })),
      ...caravan.maintenance.map((m) => ({ start: new Date(m.startDate), end: new Date(m.endDate) })),
    ];
    const check = isAvailable({ start: pickup, end: ret }, existing);
    if (!check.ok) {
      return NextResponse.json({ error: "Your dates are no longer available. Choose another range to continue." }, { status: 409 });
    }

    // Price server-side; extras resolved from catalogue.
    const extrasResolved = body.extras
      .filter((e) => e.qty > 0)
      .map((e) => {
        const def = EXTRAS.find((x) => x.slug === e.slug);
        if (!def) throw new Error(`Unknown extra: ${e.slug}`);
        return { slug: e.slug, name: def.name, unitPricePence: def.pricePence, qty: e.qty, perNight: false };
      });

    const quote = priceQuote({
      baseNightlyPence: caravan.baseNightlyPence,
      weekendNightlyPence: caravan.weekendNightlyPence ?? undefined,
      weeklyDiscountPct: caravan.weeklyDiscountPct,
      seasonalMultiplierPct: seasonalMultiplierFor(body.pickup),
      pickupISO: body.pickup, returnISO: body.return,
      cleaningFeePence: caravan.cleaningFeePence,
      extras: extrasResolved,
      taxPct: 20, securityDepositPence: caravan.securityDepositPence, depositPct: 25,
    });

    const reference = makeReference();
    const expiresAt = new Date(Date.now() + 20 * 60 * 1000);

    const booking = await prisma.$transaction(async (tx) => {
      // Second overlap guard inside transaction (concurrent-request protection).
      const clash = await tx.booking.findFirst({
        where: {
          caravanId: caravan.id,
          status: { in: [...BLOCKING_STATUSES] },
          pickupDate: { lt: ret },
          returnDate: { gt: pickup },
        },
      });
      if (clash) throw new Error("CONFLICT");

      const created = await tx.booking.create({
        data: {
          reference,
          caravanId: caravan.id,
          guestName: body.customer.name,
          guestEmail: body.customer.email,
          guestPhone: body.customer.phone,
          pickupDate: pickup,
          returnDate: ret,
          travellers: body.travellers,
          status: "awaiting_payment",
          subtotalPence: quote.rentalSubtotalPence,
          discountPence: quote.weeklyDiscountPence + quote.couponDiscountPence,
          feesPence: quote.feesPence,
          extrasPence: quote.extrasPence,
          taxPence: quote.taxPence,
          totalPence: quote.totalPence,
          depositDuePence: quote.depositDuePence,
          securityDepositPence: quote.securityDepositPence,
          quoteSnapshot: JSON.stringify({ ...quote, caravan: caravan.slug, pickup: body.pickup, return: body.return }),
          driver: { create: { fullName: body.customer.driverName, licenceCountry: body.customer.licenceCountry } },
          towVehicle: { create: { make: body.customer.towMake, model: body.customer.towModel } },
          statusHistory: { create: [{ from: "held", to: "awaiting_payment", actor: "customer", note: "Hold created; awaiting payment" }] },
        },
      });

      await tx.bookingHold.create({
        data: { caravanId: caravan.id, pickupDate: pickup, returnDate: ret, token: `hold_${created.id}`, bookingId: created.id, expiresAt },
      });

      for (const ex of extrasResolved) {
        const record = await tx.extra.findUnique({ where: { slug: ex.slug } });
        if (record) {
          await tx.bookingExtraItem.create({
            data: { bookingId: created.id, extraId: record.id, qty: ex.qty, unitPricePence: ex.unitPricePence, totalPence: ex.unitPricePence * ex.qty },
          });
        }
      }
      return created;
    });

    const bodies = bookingEmailBodies(booking.reference, caravan.name, body.pickup, body.return);
    await sendNotification({ bookingId: booking.id, kind: "booking_created", to: body.customer.email, subject: `Reservation ${booking.reference} — payment next step`, body: bodies.confirmation }).catch(() => {});

    return NextResponse.json({ id: booking.id, reference: booking.reference, depositDuePence: quote.depositDuePence, totalPence: quote.totalPence, holdExpiresAt: expiresAt.toISOString() }, { status: 201 });
  } catch (e) {
    if (e instanceof Error && e.message === "CONFLICT") {
      return NextResponse.json({ error: "Your dates were just taken by another booking. Please choose another range." }, { status: 409 });
    }
    console.error("[bookings]", e);
    return NextResponse.json({ error: "Could not create your reservation. Please try again." }, { status: 500 });
  }
}

// GET /api/bookings?email= — guest lookup (time-limited in production; demo: email match).
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const email = searchParams.get("email");
  const ref = searchParams.get("reference");
  if (!email && !ref) return NextResponse.json({ error: "Provide email or reference." }, { status: 400 });
  try {
    const bookings = await prisma.booking.findMany({
      where: {
        ...(email ? { guestEmail: email } : {}),
        ...(ref ? { reference: ref } : {}),
      },
      include: { caravan: { select: { name: true, slug: true } }, payments: true },
      orderBy: { pickupDate: "desc" },
      take: 20,
    });
    return NextResponse.json({ bookings: bookings.map((b) => ({ reference: b.reference, caravan: b.caravan.name, pickup: b.pickupDate, return: b.returnDate, status: b.status, totalPence: b.totalPence, depositDuePence: b.depositDuePence })) });
  } catch {
    return NextResponse.json({ error: "Lookup failed." }, { status: 500 });
  }
}
