import { prisma } from "@/lib/db";
import { DiscountAdd, DiscountEditor, SeasonAdd, SeasonEditor } from "./editors";

export const metadata = { title: "Pricing admin", robots: { index: false, follow: false } };

export default async function PricingAdmin() {
  let seasons: { id: string; name: string; start: string; end: string; mult: number; active: boolean }[] = [];
  let discounts: { id: string; name: string; nights: number; pct: number; active: boolean }[] = [];
  try {
    seasons = (await prisma.seasonalRate.findMany({ orderBy: { name: "asc" } })).map((s) => ({
      id: s.id, name: s.name, start: s.startMonthDay, end: s.endMonthDay, mult: s.multiplierPct, active: s.active,
    }));
    discounts = (await prisma.discountRule.findMany({ orderBy: { minNights: "asc" } })).map((d) => ({
      id: d.id, name: d.name, nights: d.minNights, pct: d.pct, active: d.active,
    }));
  } catch { /* ignore */ }
  return (
    <div>
      <p className="tick-label">Live rates · engine reads these rows</p>
      <h1 className="mt-1 font-display text-4xl">Pricing &amp; extras</h1>
      <p className="mt-2 max-w-2xl text-[0.9rem] text-muted">
        Precedence: nightly → weekend → seasonal × → weekly discount → fees → extras → coupons → GST.
        Changes apply to the next quote immediately. Seasonal overlaps are rejected — one multiplier per night.
        A caravan&apos;s own weekly pct wins when set; global discount rules cover vans with 0%.
      </p>
      <h2 className="mt-6 font-semibold">Seasonal rules</h2>
      <div className="mt-2 border border-border bg-white px-4 py-1" style={{ borderRadius: 10 }}>
        {seasons.map((s) => <SeasonEditor key={s.id} row={s} />)}
        {seasons.length === 0 && <p className="py-2 text-[0.9rem] text-muted">None — engine defaults apply (15 Jun–5 Sep ×1.2, 20 Dec–4 Jan ×1.1).</p>}
      </div>
      <SeasonAdd />
      <h2 className="mt-8 font-semibold">Discount rules</h2>
      <div className="mt-2 border border-border bg-white px-4 py-1" style={{ borderRadius: 10 }}>
        {discounts.map((d) => <DiscountEditor key={d.id} row={d} />)}
        {discounts.length === 0 && <p className="py-2 text-[0.9rem] text-muted">None — only caravan-level weekly percentages apply.</p>}
      </div>
      <DiscountAdd />
    </div>
  );
}
