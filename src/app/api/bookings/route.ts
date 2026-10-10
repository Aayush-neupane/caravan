import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { priceQuote } from "@/features/pricing/engine";
import { getPricingRules, resolveWeeklyPct } from "@/features/pricing/rules";
import { isAvailable, validateStay, blockingNow, liveHoldBookingIds } from "@/features/availability/engine";
import { BLOCKING_STATUSES } from "@/features/bookings/stateMachine";
import { makeReference, nightsBetween, parseISODate } from "@/lib/format";
import { CARAVANS } from "@/data/catalogue";
import { resolveCoupon, resolveExtras } from "@/features/pricing/coupons";
import { sendNotification, bookingEmailBodies } from "@/lib/email";
import { gateMutation, isCalendarDate } from "@/lib/security";
import { logger } from "@/lib/logger";

const CreateBody = z.object({
  slug: z.string().min(1).max(80),
  pickup: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  return: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  travellers: z.number().int().min(1).max(6),
  extras: z.array(z.object({ slug: z.string().min(1).max(60), qty: z.number().int().min(0).max(10) })).default([]),
  coupon: z.string().max(32).optional(),
  voucher: z.string().max(32).optional(),
  idempotencyKey: z.string().min(8).max(64).optional(),
  customer: z.object({
    name: z.string().min(2).max(80).regex(/^[^<>]*$/),
    email: z.string().email().max(254),
    phone: z.string().min(6).max(30).regex(/^[^<>]*$/),
    driverName: z.string().min(2).max(80).regex(/^[^<>]*$/),
    licenceCountry: z.string().max(80).regex(/^[^<>]*$/).default("Australia"),
    towMake: z.string().min(1).max(60).regex(/^[^<>]*$/),
    towModel: z.string().min(1).max(60).regex(/^[^<>]*$/),
  }),
  agree: z.literal(true, { errorMap: () => ({ message: "You must accept the rental agreement." }) }),
}).strict();

// A repeated idempotency key returns the ORIGINAL reservation rather than
// creating a duplicate (double coupon increment / double voucher debit).
function dedupedBooking(
  priorBooking: { id: string; reference: string; depositDuePence: number; totalPence: number; quoteSnapshot: string },
  priorHold: { expiresAt: Date }
) {
  let voucherAppliedPence = 0;
  try {
    voucherAppliedPence = JSON.parse(priorBooking.quoteSnapshot)?.voucherAppliedPence ?? 0;
  } catch { /* snapshot is best-effort metadata */ }
  return NextResponse.json({
    id: priorBooking.id, reference: priorBooking.reference,
    depositDuePence: priorBooking.depositDuePence, totalPence: priorBooking.totalPence,
    voucherAppliedPence, holdExpiresAt: priorHold.expiresAt.toISOString(), deduped: true,
  }, { status: 200 });
}

// POST /api/bookings — online reservation only. No payment is taken here:
// the guest receives a collection voucher (reference) and settles + shows
// physical documents at the depot counter, where staff approve the handover.
export async function POST(req: Request) {
  const denied = gateMutation(req, "bookings:post", 10, 60_000);
  if (denied) return denied;
  let body: z.infer<typeof CreateBody>;
  try {
    body = CreateBody.parse(await req.json());
  } catch (e) {
    logger.warn("[bookings] invalid body", { code: (e as Error).message?.slice(0, 200) });
    return NextResponse.json({ error: "Invalid booking details." }, { status: 400 });
  }

  const catalogue = CARAVANS.find((c) => c.slug === body.slug);
  if (!catalogue) return NextResponse.json({ error: "Unknown caravan." }, { status: 404 });

  if (!isCalendarDate(body.pickup) || !isCalendarDate(body.return)) {
    return NextResponse.json({ error: "Invalid pickup/return date." }, { status: 422 });
  }
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
          return dedupedBooking(priorBooking, priorHold);
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
    const nowTs = new Date();
    const liveHeldIds = liveHoldBookingIds(caravan.holds, nowTs);
    const existing = [
      ...blockingNow(caravan.bookings, liveHeldIds).map((b) => ({ start: new Date(b.pickupDate), end: new Date(b.returnDate) })),
      ...caravan.holds.filter((h) => new Date(h.expiresAt) > nowTs).map((h) => ({ start: new Date(h.pickupDate), end: new Date(h.returnDate) })),
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
      taxPct: 10, securityDepositPence: caravan.securityDepositPence, depositPct: 25,
    }, null, rules.seasonal);

    let coupon = null;
    try {
      coupon = await resolveCoupon(body.coupon, { preTaxBasePence: prelim.rentalSubtotalPence + prelim.feesPence + prelim.extrasPence, caravanSlug: body.slug });
    } catch (e) {
      return NextResponse.json({ error: e instanceof Error ? e.message : "Invalid coupon." }, { status: 422 });
    }

    // Gift voucher: server-resolved from its stored balance (never a client
    // amount), capped by the engine at the deposit due. The balance is only
    // debited below, inside the booking transaction.
    let voucher: { id: string; code: string; balancePence: number } | null = null;
    if (body.voucher && body.voucher.trim()) {
      try {
        const code = body.voucher.trim().toUpperCase();
        const row = await prisma.voucher.findUnique({ where: { code } });
        if (!row || !row.active || row.balancePence <= 0 || (row.expiresAt && row.expiresAt <= new Date())) {
          return NextResponse.json({ error: "That gift voucher is not valid, has expired, or has no balance left." }, { status: 422 });
        }
        voucher = { id: row.id, code: row.code, balancePence: row.balancePence };
      } catch {
        return NextResponse.json({ error: "That gift voucher could not be checked. Please retry." }, { status: 422 });
      }
    }

    const quote = priceQuote(
      {
        baseNightlyPence: caravan.baseNightlyPence,
        weekendNightlyPence: caravan.weekendNightlyPence ?? undefined,
        weeklyDiscountPct: weeklyPct,
        pickupISO: body.pickup, returnISO: body.return,
        cleaningFeePence: caravan.cleaningFeePence,
        extras: extrasResolved,
        taxPct: 10,
        couponKind: coupon ? coupon.kind : "none", couponValue: coupon ? coupon.value : 0,
        voucherPence: voucher ? voucher.balancePence : 0,
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
      // Stale `held` rows (expired hold) are not inventory — re-read the
      // live holds inside the transaction so a just-lapsed hold frees its
      // dates instead of blocking forever.
      const liveHoldsNow = await tx.bookingHold.findMany({
        where: { caravanId: caravan.id, expiresAt: { gt: new Date() }, bookingId: { not: null } },
        select: { bookingId: true },
      });
      const txLiveHeldIds = new Set(liveHoldsNow.map((h) => h.bookingId).filter((id): id is string => !!id));
      const clashes = await tx.booking.findMany({
        where: {
          caravanId: caravan.id,
          status: { in: [...BLOCKING_STATUSES] },
          pickupDate: { lt: bufEnd },
          returnDate: { gt: bufStart },
        },
      });
      // Precise buffer check in JS over ALL candidates (covers the
      // existing-end +1 day side that a bare SQL range cannot express
      // without date arithmetic portability).
      for (const clashBooking of blockingNow(clashes, txLiveHeldIds)) {
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
          status: "held",
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
          quoteSnapshot: JSON.stringify({
            ...quote, caravan: caravan.slug, pickup: body.pickup, return: body.return,
            ...(voucher ? { voucherCode: voucher.code, voucherAppliedPence: quote.voucherAppliedPence } : {}),
          }),
          driver: { create: { fullName: body.customer.driverName, licenceCountry: body.customer.licenceCountry } },
          towVehicle: { create: { make: body.customer.towMake, model: body.customer.towModel } },
          statusHistory: { create: [{ from: null, to: "held", actor: "customer", note: "Reserved online; collection voucher issued" }] },
          agreement: {
            create: {
              version: "v2026.1",
              body: `Wattle & Wander hire agreement v2026.1 — ${caravan.name}, ${body.pickup} → ${body.return}, ${body.travellers} traveller(s). Hirer accepts responsibility for weights, speed limits and return condition; deposit deductions require documented evidence and joint inspection notes. Cancellation: 28+ days full refund, 14–28 days 50%, within 14 days deposit retained. Accepted online by ${body.customer.name}.`,
              acceptedBy: body.customer.email,
            },
          },
        },
      });

      await tx.bookingHold.create({
        data: { caravanId: caravan.id, pickupDate: pickup, returnDate: ret, token: idemKey ? `idem_${idemKey}` : `hold_${created.id}`, bookingId: created.id, expiresAt },
      }).catch((e: unknown) => {
        // Idempotency race: two tabs/posts with the same key — the loser
        // surfaces the winner instead of a 500 (P2002 on token/bookingId).
        if (e instanceof Error && (e as { code?: string }).code !== "P2002") throw e;
        throw new Error("IDEMPOTENT_RACE");
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

      if (voucher) {
        // Debit the voucher balance + write the redemption ledger row in the
        // same transaction, so a voucher can never be spent twice or
        // overspent under concurrent redemptions.
        const amount = quote.voucherAppliedPence;
        if (amount <= 0) throw new Error("VOUCHER_INSUFFICIENT");
        const debited = await tx.voucher.updateMany({
          where: { id: voucher.id, balancePence: { gte: amount } },
          data: { balancePence: { decrement: amount } },
        });
        if (debited.count === 0) throw new Error("VOUCHER_INSUFFICIENT");
        await tx.voucherRedemption.create({
          data: { voucherId: voucher.id, bookingId: created.id, amountPence: amount },
        });
      }
      return created;
    });

    const { gbp } = await import("@/lib/format");
    const bodies = bookingEmailBodies(booking.reference, caravan.name, body.pickup, body.return, gbp(quote.totalPence));
    await sendNotification({ bookingId: booking.id, kind: "booking_created", to: body.customer.email, subject: `Collection voucher ${booking.reference} — show this at the depot`, body: bodies.confirmation }).catch(() => {});

    return NextResponse.json({ id: booking.id, reference: booking.reference, depositDuePence: quote.depositDuePence, totalPence: quote.totalPence, voucherAppliedPence: quote.voucherAppliedPence, holdExpiresAt: expiresAt.toISOString() }, { status: 201 });
  } catch (e) {
    if (e instanceof Error && e.message === "CONFLICT") {
      return NextResponse.json({ error: "Your dates were just taken by another booking. Please choose another range." }, { status: 409 });
    }
    if (e instanceof Error && (e.message === "COUPON_EXHAUSTED" || e.message === "Coupon no longer valid.")) {
      return NextResponse.json({ error: "That coupon just reached its usage limit. Remove it to continue." }, { status: 409 });
    }
    if (e instanceof Error && e.message === "VOUCHER_INSUFFICIENT") {
      return NextResponse.json({ error: "That gift voucher no longer has enough balance. Remove it to continue." }, { status: 409 });
    }
    if (e instanceof Error && e.message === "IDEMPOTENT_RACE" && idemKey) {
      try {
        const priorHold = await prisma.bookingHold.findUnique({ where: { token: `idem_${idemKey}` } });
        if (priorHold?.bookingId) {
          const priorBooking = await prisma.booking.findUnique({ where: { id: priorHold.bookingId } });
          if (priorBooking) {
            return dedupedBooking(priorBooking, priorHold);
          }
        }
      } catch { /* fall through */ }
      return NextResponse.json({ error: "Reservation already in progress. Please retry." }, { status: 409 });
    }
    if ((e as { code?: string })?.code === "P2002" && idemKey) {
      try {
        const priorHold = await prisma.bookingHold.findUnique({ where: { token: `idem_${idemKey}` } });
        if (priorHold?.bookingId) {
          const priorBooking = await prisma.booking.findUnique({ where: { id: priorHold.bookingId } });
          if (priorBooking) {
            return dedupedBooking(priorBooking, priorHold);
          }
        }
      } catch { /* fall through */ }
    }
    logger.error("[bookings] create failed", { code: (e as Error).message?.slice(0, 120) });
    return NextResponse.json({ error: "Could not create your reservation. Please try again." }, { status: 500 });
  }
}

// GET /api/bookings?reference=&email|phone|name= — guest lookup. The
// reference is required plus ONE matching identifier (email exact, phone by
// digits, name case-insensitive). Single-row lookup by unique reference, so
// nothing enumerable leaks beyond the caller's own voucher.
export async function GET(req: Request) {
  const denied = gateMutation(req, "bookings:lookup", 20, 60_000);
  if (denied) return denied;
  const { searchParams } = new URL(req.url);
  const email = (searchParams.get("email") ?? "").trim();
  const phone = (searchParams.get("phone") ?? "").trim();
  const name = (searchParams.get("name") ?? "").trim();
  const ref = (searchParams.get("reference") ?? "").trim().toUpperCase();
  if (!ref || (!email && !phone && !name)) {
    return NextResponse.json({ error: "Provide reference plus email, phone or name." }, { status: 400 });
  }
  const digits = (s: string) => s.replace(/\D/g, "");
  try {
    const b = await prisma.booking.findUnique({
      where: { reference: ref },
      include: { caravan: { select: { name: true, slug: true } } },
    });
    const match =
      !!b &&
      ((email !== "" && (b.guestEmail ?? "").toLowerCase() === email.toLowerCase()) ||
        (phone !== "" && !!b.guestPhone && digits(b.guestPhone) === digits(phone) && digits(phone) !== "") ||
        (name !== "" && (b.guestName ?? "").toLowerCase() === name.toLowerCase()));
    if (!match || !b) return NextResponse.json({ bookings: [] });
    return NextResponse.json({
      bookings: [{
        reference: b.reference, caravan: b.caravan.name,
        pickup: b.pickupDate, return: b.returnDate, status: b.status,
        totalPence: b.totalPence, depositDuePence: b.depositDuePence,
        guestName: b.guestName,
      }],
    });
  } catch {
    return NextResponse.json({ error: "Lookup failed." }, { status: 500 });
  }
}
