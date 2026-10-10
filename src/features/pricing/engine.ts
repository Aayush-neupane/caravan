import { z } from "zod";
import { dateRangeNights, nightsBetween, parseISODate } from "@/lib/format";

// One authoritative pricing service. Used by quote API, booking flow,
// pricing page examples, and admin preview. Never trust browser totals.

export const QuoteInput = z.object({
  baseNightlyPence: z.number().int().positive(),
  weekendNightlyPence: z.number().int().positive().optional(),
  weeklyDiscountPct: z.number().int().min(0).max(50).default(0),
  seasonalMultiplierPct: z.number().int().min(50).max(300).default(100),
  pickupISO: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  returnISO: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  cleaningFeePence: z.number().int().min(0),
  extras: z.array(z.object({ unitPricePence: z.number().int().min(0), qty: z.number().int().min(0).max(20), perNight: z.boolean().default(false) })).default([]),
  couponKind: z.enum(["percent", "fixed", "none"]).default("none"),
  couponValue: z.number().int().min(0).default(0),
  voucherPence: z.number().int().min(0).default(0),
  taxPct: z.number().min(0).max(40).default(20),
  securityDepositPence: z.number().int().min(0).default(0),
  depositPct: z.number().min(0).max(100).default(25),
});

export type QuoteInput = z.infer<typeof QuoteInput>;

export type NightLine = { date: string; ratePence: number; weekend: boolean };
export type Quote = {
  nights: number;
  nightLines: NightLine[];
  nightlySubtotalPence: number;
  weeklyDiscountPence: number;
  seasonalUpliftPence: number;
  rentalSubtotalPence: number;
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

function isWeekend(dateISO: string): boolean {
  const d = parseISODate(dateISO);
  const day = d.getUTCDay();
  return day === 5 || day === 6; // Fri/Sat nights priced as weekend
}

export function priceQuote(input: z.input<typeof QuoteInput>): Quote {
  const parsed = QuoteInput.parse(input);
  const nights = nightsBetween(parseISODate(parsed.pickupISO), parseISODate(parsed.returnISO));
  if (nights <= 0) throw new Error("Return date must be after pickup date.");

  // 1–2. Per-night rate with weekend rules + seasonal multiplier.
  const nightLines: NightLine[] = dateRangeNights(parsed.pickupISO, parsed.returnISO).map((date) => {
    const weekend = isWeekend(date);
    const base = weekend && parsed.weekendNightlyPence ? parsed.weekendNightlyPence : parsed.baseNightlyPence;
    const ratePence = Math.round((base * parsed.seasonalMultiplierPct) / 100);
    return { date, ratePence, weekend };
  });
  const nightlySubtotalPence = nightLines.reduce((a, n) => a + n.ratePence, 0);
  const baseOnly = nights * parsed.baseNightlyPence;
  const seasonalUpliftPence = Math.max(0, nightlySubtotalPence - baseOnly - nightLines.filter(n=>n.weekend && parsed.weekendNightlyPence).reduce((a,n)=> a + ((parsed.weekendNightlyPence! - parsed.baseNightlyPence)),0) - Math.max(0, nightlySubtotalPence - baseOnly - 0) * 0); // informational

  // 3. Weekly / longer-rental discount (applied to nightly subtotal).
  const fullWeeks = Math.floor(nights / 7);
  const weeklyDiscountPence = fullWeeks > 0 ? Math.round((nightlySubtotalPence * parsed.weeklyDiscountPct) / 100) : 0;

  const rentalSubtotalPence = nightlySubtotalPence - weeklyDiscountPence;

  // 4. Mandatory fees (cleaning).
  const feesPence = parsed.cleaningFeePence;

  // 5. Extras.
  const extrasPence = parsed.extras.reduce(
    (a, e) => a + e.unitPricePence * e.qty * (e.perNight ? nights : 1),
    0
  );

  // 6. Coupons (percent on rental subtotal; fixed capped at rental+fees+extras).
  let couponDiscountPence = 0;
  if (parsed.couponKind === "percent") {
    couponDiscountPence = Math.round((rentalSubtotalPence * Math.min(parsed.couponValue, 60)) / 100);
  } else if (parsed.couponKind === "fixed") {
    couponDiscountPence = Math.min(parsed.couponValue, rentalSubtotalPence + feesPence + extrasPence);
  }

  // 7. Tax (UK VAT 20% on rental + fees + extras after discounts).
  const subtotalExTaxPence = Math.max(0, rentalSubtotalPence + feesPence + extrasPence - couponDiscountPence);
  const taxPence = Math.round((subtotalExTaxPence * parsed.taxPct) / 100);
  const totalPence = subtotalExTaxPence + taxPence;

  // Voucher applied to amount due now (capped).
  const depositDuePence = Math.round((totalPence * parsed.depositPct) / 100);
  const voucherAppliedPence = Math.min(parsed.voucherPence, depositDuePence);
  const balancePence = totalPence - depositDuePence;

  return {
    nights,
    nightLines,
    nightlySubtotalPence,
    weeklyDiscountPence,
    seasonalUpliftPence: nightlySubtotalPence - nights * parsed.baseNightlyPence + weeklyDiscountPence * 0,
    rentalSubtotalPence,
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

// Seasonal helper: Jun 15 – Sep 05 = 120%, Dec 20 – Jan 04 = 110%, else 100%.
export function seasonalMultiplierFor(pickupISO: string): number {
  const d = parseISODate(pickupISO);
  const md = `${String(d.getUTCMonth() + 1).padStart(2, "0")}-${String(d.getUTCDate()).padStart(2, "0")}`;
  if (md >= "06-15" && md <= "09-05") return 120;
  if (md >= "12-20" || md <= "01-04") return 110;
  return 100;
}
