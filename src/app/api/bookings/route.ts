import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { priceQuote } from "@/features/pricing/engine";
import { getPricingRules, resolveWeeklyPct } from "@/features/pricing/rules";
import { isAvailable, validateStay } from "@/features/availability/engine";
import { BLOCKING_STATUSES } from "@/features/bookings/stateMachine";
import { makeReference, nightsBetween, parseISODate } from "@/lib/format";
import { CARAVANS } from "@/data/catalogue";
import { resolveCoupon, resolveExtras } from "@/features/pricing/coupons";
import { sendNotification, bookingEmailBodies } from "@/lib/email";
import { gateMutation } from "@/lib/security";

const CreateBody = z.object({
  slug: z.string(),
  pickup: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  return: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  travellers: z.number().int().min(1).max(6),
  extras: z.array(z.object({ slug: z.string(), qty: z.number().int().min(0).max(10) })).default([]),
  coupon: z.string().max(32).optional(),
  idempotencyKey: z.string().min(8).max(64).optional(),
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
}).strict();

// POST /api/bookings — creates hold + booking atomically with revalidated availability.
export async function POST(req: Request) {
  const denied = gateMutation(req, "bookings:post", 10, 60_000);
  if (denied) return denied;
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

  // Idempotency: client may send idempotencyKey (or x-idempotency-key header)
  // on retry/back-button/double-tab. A held token hit returns the original
  // booking instead of creating a duplicate + double coupon increment.
  const headerKey = req.headers.get("x-idempotency-key");
  const idemKey = (body.idempotencyKey ?? headerKey ?? "").trim().slice(0, 64) || null;
  if (idemKey) {
    try {
      const priorHold = await prisma.bookingHold.findUnique({ where: { token: `idem_${idemKey}` } });
      if (priorHold?.bookingId) {
        const priorBooking = await prisma.booking.findUnique({ where: { id: priorHold.bookingId } });
        if (priorBooking) {
          return NextResponse.json({ id: priorBooking.id, reference: priorBooking.reference, depositDuePence: priorBooking.depositDuePence, totalPence: priorBooking.totalPence, holdExpiresAt: priorHold.expiresAt.toISOString(), deduped: true }, { status: 200 });
        }
      }
    } catch { /* fall through to normal creation */ }
  }

  try {
    const caravan = await prisma.caravan.findUnique({
      where: { slug: body.slug },
      include: {
        bookings: { where: { status: { in: [...BLOCKING_STATUSES] } } },
        holds: true, blocks: true, maintenance: { where: { done: false } },
      },
    });
    if (!caravan) return NextResponse.json({ error: "Fleet database is not seeded yet. Run `npm run seed`." }, { status: 503 });
    if (!caravan.published || caravan.archived) {
      return NextResponse.json({ error: "This caravan is not currently available to book." }, { status: 410 });
    }
    // Capacity + stay rules from the live row (admin edits apply).
    if (body.travellers > caravan.maxTravellers) {
      return NextResponse.json({ error: `${caravan.name} accommodates up to ${caravan.maxTravellers} travellers.` }, { status: 422 });
    }
    const stayError = validateStay(pickup, ret, { minNights: caravan.minNights, maxNights: caravan.maxNights, minNoticeDays: 2 });
    if (stayError) return NextResponse.json({ error: stayError }, { status: 422 });

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

    // Price server-side; extras + coupon resolved from server data, never browser totals.
    let extrasResolved: { slug: string; name: string; unitPricePence: number; qty: number; perNight: boolean; extraId: string | null }[];
    try {
      extrasResolved = await resolveExtras(body.extras, { caravanId: caravan.id });
    } catch (e) {
      return NextResponse.json({ error: e instanceof Error ? e.message : "Invalid extras." }, { status: 422 });
    }

    const rules = await getPricingRules();
    const stayNights = nightsBetween(parseISODate(body.pickup), parseISODate(body.return));
    const weeklyPct = resolveWeeklyPct(caravan.weeklyDiscountPct, stayNights, rules.discounts);

    const prelim = priceQuote({
      baseNightlyPence: caravan.baseNightlyPence,
      weekendNightlyPence: caravan.weekendNightlyPence ?? undefined,
      weeklyDiscountPct: weeklyPct,
      pickupISO: body.pickup, returnISO: body.return,
      cleaningFeePence: caravan.cleaningFeePence,
      extras: extrasResolved,
      taxPct: 20, securityDepositPence: caravan.securityDepositPence, depositPct: 25,
    }, null, rules.seasonal);

    let coupon = null;
    try {
      coupon = await resolveCoupon(body.coupon, { rentalSubtotalPence: prelim.rentalSubtotalPence, caravanSlug: body.slug });
    } catch (e) {
      return NextResponse.json({ error: e instanceof Error ? e.message : "Invalid coupon." }, { status: 422 });
    }

    const quote = priceQuote(
      {
        baseNightlyPence: caravan.baseNightlyPence,
        weekendNightlyPence: caravan.weekendNightlyPence ?? undefined,
        weeklyDiscountPct: weeklyPct,
        pickupISO: body.pickup, returnISO: body.return,
        cleaningFeePence: caravan.cleaningFeePence,
        extras: extrasResolved,
        taxPct: 20,
        couponKind: coupon ? coupon.kind : "none", couponValue: coupon ? coupon.value : 0,
        securityDepositPence: caravan.securityDepositPence, depositPct: 25,
      },
      coupon?.code ?? null,
      rules.seasonal
    );

    const reference = makeReference();
    const expiresAt = new Date(Date.now() + 20 * 60 * 1000);

    const booking = await prisma.$transaction(async (tx) => {
      // Second overlap guard inside the transaction, with the same 1-day
      // prep buffer on BOTH sides, and covering bookings + live holds +
      // manual blocks + open maintenance (mirrors the outer check).
      const bufStart = pickup;
      const bufEnd = new Date(ret);
      bufEnd.setUTCDate(bufEnd.getUTCDate() + 1);
      const clashBooking = await tx.booking.findFirst({
        where: {
          caravanId: caravan.id,
          status: { in: [...BLOCKING_STATUSES] },
          pickupDate: { lt: bufEnd },
          // Existing stay's prep day also blocks: existing end + 1 > request start.
          AND: [{ pickupDate: { lt: bufEnd } }],
        },
      });
      // Precise buffer check in JS (covers the existing-end +1 day side that
      // a bare SQL range cannot express without date arithmetic portability).
      if (clashBooking) {
        const exEnd = new Date(clashBooking.returnDate);
        exEnd.setUTCDate(exEnd.getUTCDate() + 1);
        if (new Date(clashBooking.pickupDate) < bufEnd && bufStart < exEnd) throw new Error("CONFLICT");
      }
      const nowTs = new Date();
      const clashHold = await tx.bookingHold.findFirst({
        where: { caravanId: caravan.id, expiresAt: { gt: nowTs }, pickupDate: { lt: bufEnd }, returnDate: { gt: bufStart } },
      });
      if (clashHold) {
        const hEnd = new Date(clashHold.returnDate);
        hEnd.setUTCDate(hEnd.getUTCDate() + 1);
        if (new Date(clashHold.pickupDate) < bufEnd && bufStart < hEnd) throw new Error("CONFLICT");
      }
      const clashBlock = await tx.availabilityBlock.findFirst({
        where: { caravanId: caravan.id, startDate: { lt: bufEnd }, endDate: { gt: bufStart } },
      });
      if (clashBlock) throw new Error("CONFLICT");
      const clashMaint = await tx.maintenanceRecord.findFirst({
        where: { caravanId: caravan.id, done: false, startDate: { lt: bufEnd }, endDate: { gt: bufStart } },
      });
      if (clashMaint) throw new Error("CONFLICT");

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
          agreementVersion: "v2026.1",
          agreementAcceptedAt: new Date(),
          quoteSnapshot: JSON.stringify({ ...quote, caravan: caravan.slug, pickup: body.pickup, return: body.return }),
          driver: { create: { fullName: body.customer.driverName, licenceCountry: body.customer.licenceCountry } },
          towVehicle: { create: { make: body.customer.towMake, model: body.customer.towModel } },
          statusHistory: { create: [{ from: null, to: "awaiting_payment", actor: "customer", note: "Hold created; awaiting payment" }] },
        },
      });

      await tx.bookingHold.create({
        data: { caravanId: caravan.id, pickupDate: pickup, returnDate: ret, token: idemKey ? `idem_${idemKey}` : `hold_${created.id}`, bookingId: created.id, expiresAt },
      });

      for (const ex of extrasResolved) {
        if (ex.extraId) {
          await tx.bookingExtraItem.create({
            data: { bookingId: created.id, extraId: ex.extraId, qty: ex.qty, unitPricePence: ex.unitPricePence, totalPence: ex.unitPricePence * ex.qty * (ex.perNight ? quote.nights : 1) },
          });
        }
      }

      if (coupon) {
        // Atomic usage increment: only succeeds while under maxUses, so
        // parallel redemptions cannot overshoot a limited coupon.
        const row = await tx.coupon.findUnique({ where: { code: coupon.code } });
        if (!row) throw new Error("Coupon no longer valid.");
        if (row.maxUses != null && row.usedCount >= row.maxUses) throw new Error("COUPON_EXHAUSTED");
        const bumped = await tx.coupon.updateMany({
          where: { code: coupon.code, OR: [{ maxUses: null }, { usedCount: { lt: row.maxUses ?? 0 } }] },
          data: { usedCount: { increment: 1 } },
        });
        if (row.maxUses != null && bumped.count === 0) throw new Error("COUPON_EXHAUSTED");
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
    if (e instanceof Error && (e.message === "COUPON_EXHAUSTED" || e.message === "Coupon no longer valid.")) {
      return NextResponse.json({ error: "That coupon just reached its usage limit. Remove it to continue." }, { status: 409 });
    }
    console.error("[bookings]", e);
    return NextResponse.json({ error: "Could not create your reservation. Please try again." }, { status: 500 });
  }
}

// GET /api/bookings?email=&reference= — guest lookup requires BOTH values
// (email alone no longer dumps history). Reference comparison is exact.
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const email = (searchParams.get("email") ?? "").trim();
  const ref = (searchParams.get("reference") ?? "").trim().toUpperCase();
  if (!email || !ref) return NextResponse.json({ error: "Provide both email and reference." }, { status: 400 });
  try {
    const bookings = await prisma.booking.findMany({
      where: { guestEmail: email, reference: ref },
      include: { caravan: { select: { name: true, slug: true } }, payments: true },
      orderBy: { pickupDate: "desc" },
      take: 5,
    });
    return NextResponse.json({ bookings: bookings.map((b) => ({ reference: b.reference, caravan: b.caravan.name, pickup: b.pickupDate, return: b.returnDate, status: b.status, totalPence: b.totalPence, depositDuePence: b.depositDuePence })) });
  } catch {
    return NextResponse.json({ error: "Lookup failed." }, { status: 500 });
  }
}
