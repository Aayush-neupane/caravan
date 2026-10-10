import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { priceQuote } from "@/features/pricing/engine";
import { getPricingRules, resolveWeeklyPct } from "@/features/pricing/rules";
import { nightsBetween, parseISODate } from "@/lib/format";
import { isAvailable, validateStay, blockingNow, liveHoldBookingIds } from "@/features/availability/engine";
import { BLOCKING_STATUSES } from "@/features/bookings/stateMachine";
import { resolveCoupon, resolveExtras } from "@/features/pricing/coupons";
import { CARAVANS } from "@/data/catalogue";
import { gateMutation, isCalendarDate } from "@/lib/security";
import { logger } from "@/lib/logger";

const Body = z.object({
  slug: z.string().min(1).max(80),
  pickup: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  return: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  travellers: z.number().int().min(1).max(6).default(2),
  extras: z.array(z.object({ slug: z.string().min(1).max(60), qty: z.number().int().min(0).max(10) })).default([]),
  coupon: z.string().max(32).optional(),
  voucher: z.string().max(32).optional(),
}).strict();

type ResolvedVoucher = { code: string; balancePence: number };

// Voucher codes are checked against the DB row: active, unexpired and with
// balance left. Never trusts a client-supplied amount — the engine applies
// the stored balance and caps it at the deposit due. Balances are only
// debited when the booking is actually created.
async function resolveVoucher(raw: string | undefined): Promise<ResolvedVoucher | null> {
  const code = (raw ?? "").trim().toUpperCase();
  if (!code) return null;
  const row = await prisma.voucher.findUnique({ where: { code } });
  if (!row || !row.active || row.balancePence <= 0) return null;
  if (row.expiresAt && row.expiresAt <= new Date()) return null;
  return { code: row.code, balancePence: row.balancePence };
}

// POST /api/quote — server-side availability + itemised pricing. Never trusts browser totals.
export async function POST(req: Request) {
  const denied = gateMutation(req, "quote:post", 30, 60_000);
  if (denied) return denied;
  let body: z.infer<typeof Body>;
  try {
    body = Body.parse(await req.json());
  } catch {
    return NextResponse.json({ error: "Choose valid pickup and return dates." }, { status: 400 });
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
      include: { bookings: { where: { status: { in: [...BLOCKING_STATUSES] } } }, holds: true, blocks: true, maintenance: { where: { done: false } } },
    });

    // Stay rules + capacity come from the live DB row when seeded (admin
    // edits apply); the static catalogue is the unseeded fallback.
    const rules = caravan ?? catalogue;
    const vanName = caravan?.name ?? catalogue.name;
    if (caravan && (!caravan.published || caravan.archived)) {
      return NextResponse.json({ available: false, message: "This caravan is not currently available to book." }, { status: 410 });
    }
    const stayError = validateStay(pickup, ret, { minNights: rules.minNights, maxNights: rules.maxNights, minNoticeDays: 2 });
    if (stayError) return NextResponse.json({ error: stayError, available: false }, { status: 422 });
    if (body.travellers > rules.maxTravellers) {
      return NextResponse.json({ error: `${vanName} accommodates up to ${rules.maxTravellers} travellers.` }, { status: 422 });
    }

    // Resolve extras + coupon BEFORE pricing so every figure derives server-side.
    let extrasResolved: { unitPricePence: number; qty: number; perNight: boolean }[] = [];
    try {
      extrasResolved = await resolveExtras(body.extras, caravan ? { caravanId: caravan.id } : undefined);
    } catch (e) {
      return NextResponse.json({ error: e instanceof Error ? e.message : "Invalid extras." }, { status: 422 });
    }

    // Resolve the gift voucher once, before pricing: the engine applies the
    // stored balance (capped at the deposit due), never a client amount.
    let voucherRow: ResolvedVoucher | null = null;
    try {
      voucherRow = await resolveVoucher(body.voucher);
    } catch {
      voucherRow = null;
    }
    if ((body.voucher ?? "").trim() && !voucherRow) {
      return NextResponse.json(
        { error: "That gift voucher is not valid, has expired, or has no balance left.", available: false },
        { status: 422 }
      );
    }

    const priceWith = async (base: number, weekend: number | null, caravanPct: number, cleaning: number, deposit: number) => {
      // Live DB rules: seasonal rows price each night; the weekly pct is the
      // caravan's own when set, else the best fitting global discount rule.
      const rules = await getPricingRules();
      const nights = nightsBetween(parseISODate(body.pickup), parseISODate(body.return));
      const weeklyDisc = resolveWeeklyPct(caravanPct, nights, rules.discounts);
      // Preliminary rental subtotal (no coupon) to validate coupon minimums.
      const prelim = priceQuote({
        baseNightlyPence: base, weekendNightlyPence: weekend ?? undefined,
        weeklyDiscountPct: weeklyDisc,
        pickupISO: body.pickup, returnISO: body.return,
        cleaningFeePence: cleaning, extras: extrasResolved, taxPct: 10,
        securityDepositPence: deposit, depositPct: 25,
      }, null, rules.seasonal);
      let coupon = null;
      try {
        coupon = await resolveCoupon(body.coupon, { preTaxBasePence: prelim.rentalSubtotalPence + prelim.feesPence + prelim.extrasPence, caravanSlug: body.slug });
      } catch (e) {
        return { error: e instanceof Error ? e.message : "Invalid coupon." };
      }
      const shared = {
        baseNightlyPence: base, weekendNightlyPence: weekend ?? undefined,
        weeklyDiscountPct: weeklyDisc,
        pickupISO: body.pickup, returnISO: body.return,
        cleaningFeePence: cleaning, extras: extrasResolved, taxPct: 10,
        couponKind: coupon ? coupon.kind : "none", couponValue: coupon ? coupon.value : 0,
        securityDepositPence: deposit, depositPct: 25,
      } as const;
      const quote = priceQuote(shared, coupon?.code ?? null, rules.seasonal);
      // Voucher only reduces the cash due now (capped at the deposit by the
      // engine) — the balance owed at collection is unchanged.
      const voucher = voucherRow;
      const withVoucher = voucher
        ? priceQuote({ ...shared, voucherPence: voucher.balancePence }, coupon?.code ?? null, rules.seasonal)
        : quote;
      return {
        quote: withVoucher,
        voucherAppliedPence: voucher ? withVoucher.voucherAppliedPence : 0,
        voucherCode: voucher ? voucher.code : null,
      };
    };

    if (!caravan) {
      // DB not seeded yet — fall back to catalogue rates (open availability).
      const result = await priceWith(
        catalogue.baseNightlyPence, catalogue.weekendNightlyPence,
        catalogue.weeklyDiscountPct, catalogue.cleaningFeePence, catalogue.securityDepositPence
      );
      if ("error" in result) return NextResponse.json({ error: result.error, available: false }, { status: 422 });
      return NextResponse.json({ available: true, quote: result.quote, caravan: { name: catalogue.name, slug: catalogue.slug }, seeded: false, voucherAppliedPence: result.voucherAppliedPence, voucherCode: result.voucherCode });
    }

    // Stale `held` rows (expired hold) no longer block these dates.
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
      return NextResponse.json({ available: false, message: "Those dates are no longer available. Choose another range to continue.", quote: null }, { status: 200 });
    }

    const result = await priceWith(
      caravan.baseNightlyPence, caravan.weekendNightlyPence,
      caravan.weeklyDiscountPct, caravan.cleaningFeePence, caravan.securityDepositPence
    );
    if ("error" in result) return NextResponse.json({ error: result.error, available: false }, { status: 422 });
    return NextResponse.json({ available: true, quote: result.quote, caravan: { name: caravan.name, slug: caravan.slug }, voucherAppliedPence: result.voucherAppliedPence, voucherCode: result.voucherCode });
  } catch (e) {
    logger.error("[quote] failed", { code: (e as Error).message?.slice(0, 120) });
    return NextResponse.json({ error: "Availability check failed. Please try again." }, { status: 500 });
  }
}
