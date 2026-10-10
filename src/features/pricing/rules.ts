import { prisma } from "@/lib/db";
import type { SeasonalRule } from "./engine";

export type DiscountRuleRow = { minNights: number; pct: number };

// Live pricing rules from the database (edited in admin → Pricing).
// Empty (unseeded DB) means the engine falls back to its documented defaults.
// A DB error also returns empty (fail-open to defaults) but is logged so
// ops can distinguish "unseeded" from "database down".
export async function getPricingRules(): Promise<{
  seasonal: SeasonalRule[];
  discounts: DiscountRuleRow[];
}> {
  try {
    const [s, d] = await Promise.all([
      prisma.seasonalRate.findMany({ where: { active: true }, orderBy: { name: "asc" } }),
      prisma.discountRule.findMany({ where: { active: true }, orderBy: { minNights: "asc" } }),
    ]);
    return {
      seasonal: s.map((r) => ({
        startMonthDay: r.startMonthDay,
        endMonthDay: r.endMonthDay,
        multiplierPct: r.multiplierPct,
      })),
      discounts: d.map((r) => ({ minNights: r.minNights, pct: r.pct })),
    };
  } catch (e) {
    console.error("[pricing-rules] DB read failed, falling back to defaults:", e);
    return { seasonal: [], discounts: [] };
  }
}

// Weekly-discount precedence: the caravan's own pct wins when set; otherwise
// the best active global rule fitting the stay length applies.
export function resolveWeeklyPct(caravanPct: number, nights: number, rules: DiscountRuleRow[]): number {
  if (caravanPct > 0) return caravanPct;
  let best = 0;
  for (const r of rules) if (nights >= r.minNights && r.pct > best) best = r.pct;
  return Math.min(best, 50);
}
