import { z } from "zod";
import { dateRangeNights, nightsBetween, parseISODate } from "@/lib/format";

// One authoritative pricing service. Used by quote API, booking flow,
// pricing page examples, and admin preview. Never trust browser totals.
//
// Calculation order (documented, UK VAT rules):
//   1. Per-night rate: base, or weekend rate for Fri/Sat nights.
//   2. Seasonal multiplier applied PER NIGHT from that night's own date,
//      so trips crossing a season boundary price each night correctly.
//      Defaults (120% 15 Jun–5 Sep, 110% 20 Dec–4 Jan) mirror the seeded
//      SeasonalRate rows; pass overrides to keep DB/admin in sync.
//   3. Weekly discount pro-rata: each full 7-night block earns the pct off
//      that block's share of the nightly subtotal (not the whole stay).
//   4. Mandatory fees (cleaning).
//   5. Selected extras (per-rental, per-night, or per-person quantities).
//   6. Coupon on the pre-tax subtotal (rental + fees + extras):
//      percent capped at 60%, fixed capped at the pre-tax subtotal.
//   7. VAT on rental + fees + extras after discounts.
//   8. Deposit split (default 25% due now); refundable security deposit
//      always shown separately and never counted as revenue.
//      Voucher (server-resolved only, never client-supplied) reduces cash
//      due now; balance = total − gross deposit so voucher + cash + balance
//      always reconciles to total.

export const QuoteInput = z.object({
  baseNightlyPence: z.number().int().positive(),
  weekendNightlyPence: z.number().int().positive().optional(),
  weeklyDiscountPct: z.number().int().min(0).max(50).default(0),
  pickupISO: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  returnISO: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  cleaningFeePence: z.number().int().min(0),
  extras: z
    .array(
      z.object({
        unitPricePence: z.number().int().min(0),
        qty: z.number().int().min(0).max(20),
        perNight: z.boolean().default(false),
      })
    )
    .default([]),
  couponKind: z.enum(["percent", "fixed", "none"]).default("none"),
  couponValue: z.number().int().min(0).default(0),
  voucherPence: z.number().int().min(0).default(0),
  taxPct: z.number().min(0).max(40).default(20),
  securityDepositPence: z.number().int().min(0).default(0),
  depositPct: z.number().min(0).max(100).default(25),
});

export type QuoteInput = z.infer<typeof QuoteInput>;

export type NightLine = {
  date: string;
  ratePence: number;
  basePence: number;
  weekend: boolean;
  seasonalPct: number;
};

export type Quote = {
  nights: number;
  nightLines: NightLine[];
  nightlySubtotalPence: number;
  nightlyBasePence: number; // same nights at base/weekend rates, season ×1.0
  seasonalUpliftPence: number; // nightlySubtotal - nightlyBase (>= 0)
  weeklyDiscountPence: number;
  rentalSubtotalPence: number;
  couponCode: string | null;
  couponDiscountPence: number;
  feesPence: number;
  extrasPence: number;
  subtotalExTaxPence: number;
  taxPence: number;
  totalPence: number;
  depositDuePence: number;
  balancePence: number;
  voucherAppliedPence: number;
  securityDepositPence: number;
};

export function isWeekendNight(dateISO: string): boolean {
  const d = parseISODate(dateISO);
  const day = d.getUTCDay();
  return day === 5 || day === 6; // Friday & Saturday nights
}

// Seasonal helper: Jun 15 – Sep 05 = 120%, Dec 20 – Jan 04 = 110%, else 100%.
// Evaluated per night so season-boundary trips price correctly.
// Optional `rules` lets callers inject DB SeasonalRate rows; defaults match seed.
export function seasonalMultiplierFor(dateISO: string, rules?: { startMonthDay: string; endMonthDay: string; multiplierPct: number }[]): number {
  if (rules && rules.length > 0) {
    const d = parseISODate(dateISO);
    const md = `${String(d.getUTCMonth() + 1).padStart(2, "0")}-${String(d.getUTCDate()).padStart(2, "0")}`;
    for (const r of rules) {
      if (r.startMonthDay <= r.endMonthDay) {
        if (md >= r.startMonthDay && md <= r.endMonthDay) return r.multiplierPct;
      } else {
        if (md >= r.startMonthDay || md <= r.endMonthDay) return r.multiplierPct;
      }
    }
    return 100;
  }
  const d = parseISODate(dateISO);
  const md = `${String(d.getUTCMonth() + 1).padStart(2, "0")}-${String(d.getUTCDate()).padStart(2, "0")}`;
  if (md >= "06-15" && md <= "09-05") return 120;
  if (md >= "12-20" || md <= "01-04") return 110;
  return 100;
}

export function priceQuote(input: z.input<typeof QuoteInput>, couponCode?: string | null): Quote {
  const parsed = QuoteInput.parse(input);
  const nights = nightsBetween(parseISODate(parsed.pickupISO), parseISODate(parsed.returnISO));
  if (nights <= 0) throw new Error("Return date must be after pickup date.");

  // 1–2. Per-night rate: weekend rule, then that night's own seasonal multiplier.
  const nightLines: NightLine[] = dateRangeNights(parsed.pickupISO, parsed.returnISO).map((date) => {
    const weekend = isWeekendNight(date);
    const basePence = weekend && parsed.weekendNightlyPence ? parsed.weekendNightlyPence : parsed.baseNightlyPence;
    const seasonalPct = seasonalMultiplierFor(date);
    const ratePence = Math.round((basePence * seasonalPct) / 100);
    return { date, ratePence, basePence, weekend, seasonalPct };
  });
  const nightlySubtotalPence = nightLines.reduce((a, n) => a + n.ratePence, 0);
  const nightlyBasePence = nightLines.reduce((a, n) => a + n.basePence, 0);
  const seasonalUpliftPence = Math.max(0, nightlySubtotalPence - nightlyBasePence);

  // 3. Weekly discount pro-rata on full 7-night blocks only.
  const fullWeeks = Math.floor(nights / 7);
  const discountableShare = fullWeeks > 0 ? (fullWeeks * 7) / nights : 0;
  const weeklyDiscountPence = fullWeeks > 0 ? Math.round((nightlySubtotalPence * discountableShare * parsed.weeklyDiscountPct) / 100) : 0;

  const rentalSubtotalPence = nightlySubtotalPence - weeklyDiscountPence;

  // 4. Mandatory fees.
  const feesPence = parsed.cleaningFeePence;

  // 5. Extras.
  const extrasPence = parsed.extras.reduce(
    (a, e) => a + e.unitPricePence * e.qty * (e.perNight ? nights : 1),
    0
  );

  // 6. Coupon on the pre-tax subtotal (percent capped at 60%; fixed capped
  // at the pre-tax subtotal). Both kinds share the same base.
  const preTaxBase = rentalSubtotalPence + feesPence + extrasPence;
  let couponDiscountPence = 0;
  if (parsed.couponKind === "percent") {
    couponDiscountPence = Math.round((preTaxBase * Math.min(parsed.couponValue, 60)) / 100);
  } else if (parsed.couponKind === "fixed") {
    couponDiscountPence = Math.min(parsed.couponValue, preTaxBase);
  }

  // 7. Tax.
  const subtotalExTaxPence = Math.max(0, rentalSubtotalPence + feesPence + extrasPence - couponDiscountPence);
  const taxPence = Math.round((subtotalExTaxPence * parsed.taxPct) / 100);
  const totalPence = subtotalExTaxPence + taxPence;

  // 8. Deposit split; voucher reduces amount due now.
  const depositDuePence = Math.round((totalPence * parsed.depositPct) / 100);
  const voucherAppliedPence = Math.min(parsed.voucherPence, depositDuePence);
  const balancePence = totalPence - depositDuePence;

  return {
    nights,
    nightLines,
    nightlySubtotalPence,
    nightlyBasePence,
    seasonalUpliftPence,
    weeklyDiscountPence,
    rentalSubtotalPence,
    couponCode: couponCode ?? null,
    couponDiscountPence,
    feesPence,
    extrasPence,
    subtotalExTaxPence,
    taxPence,
    totalPence,
    depositDuePence: depositDuePence - voucherAppliedPence,
    balancePence,
    voucherAppliedPence,
    securityDepositPence: parsed.securityDepositPence,
  };
}
