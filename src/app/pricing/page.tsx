import type { Metadata } from "next";
import Link from "next/link";
import { CARAVANS, type CatalogueCaravan } from "@/data/catalogue";
import { priceQuote, type SeasonalRule } from "@/features/pricing/engine";
import { getPricingRules } from "@/features/pricing/rules";
import { getLiveCaravans } from "@/features/catalogue/live";
import { gbp } from "@/lib/format";

export const metadata: Metadata = { title: "Pricing & extras", description: "How caravan hire is priced: nightly rates, seasonal multipliers, weekly discounts, cleaning, deposits, mileage and GST — with itemised examples from the pricing engine." };

function Example({ slug, pickup, ret, label, seasonal, caravans }: { slug: string; pickup: string; ret: string; label: string; seasonal: SeasonalRule[]; caravans: CatalogueCaravan[] }) {
  const c = caravans.find((x) => x.slug === slug) ?? CARAVANS.find((x) => x.slug === slug)!;
  const q = priceQuote({
    baseNightlyPence: c.baseNightlyPence, weekendNightlyPence: c.weekendNightlyPence,
    weeklyDiscountPct: c.weeklyDiscountPct,
    pickupISO: pickup, returnISO: ret, cleaningFeePence: c.cleaningFeePence,
    extras: [], taxPct: 20, securityDepositPence: c.securityDepositPence, depositPct: 25,
  }, null, seasonal);
  return (
    <div className="border border-border bg-white p-6" style={{ borderRadius: 10 }}>
      <p className="tick-label">{label}</p>
      <h3 className="mt-1 font-display text-2xl">{c.name} · {pickup} → {ret} ({q.nights} nights)</h3>
      <dl className="mt-4 space-y-1.5 text-[0.92rem]">
        <div className="flex justify-between"><dt className="text-muted">Nightly base ({q.nights} nights, weekend rates incl.)</dt><dd>{gbp(q.nightlyBasePence)}</dd></div>
        {q.seasonalUpliftPence > 0 && <div className="flex justify-between"><dt className="text-muted">Seasonal uplift (per-night, by date)</dt><dd>{gbp(q.seasonalUpliftPence)}</dd></div>}
        {q.weeklyDiscountPence > 0 && <div className="flex justify-between"><dt className="text-muted">Long-stay discount</dt><dd className="text-success">−{gbp(q.weeklyDiscountPence)}</dd></div>}
        <div className="flex justify-between"><dt className="text-muted">Cleaning (mandatory)</dt><dd>{gbp(q.feesPence)}</dd></div>
        <div className="flex justify-between"><dt className="text-muted">GST 10%</dt><dd>{gbp(q.taxPence)}</dd></div>
        <div className="flex justify-between border-t border-border pt-2 font-bold"><dt>Total</dt><dd>{gbp(q.totalPence)}</dd></div>
        <div className="flex justify-between text-[0.88rem]"><dt className="text-muted">Due today (25%)</dt><dd>{gbp(q.depositDuePence)}</dd></div>
        <div className="flex justify-between text-[0.88rem]"><dt className="text-muted">Refundable deposit (separate)</dt><dd>{gbp(q.securityDepositPence)}</dd></div>
      </dl>
      <p className="mt-3 text-[0.78rem] text-muted">Calculated live by the pricing engine — not a hardcoded figure.</p>
    </div>
  );
}

export default async function PricingPage() {
  const rules = await getPricingRules();
  const live = await getLiveCaravans();
  const caravans = live.length > 0 ? live : CARAVANS;
  const by = (slug: string) => caravans.find((c) => c.slug === slug) ?? CARAVANS.find((c) => c.slug === slug)!;
  return (
    <div className="bg-paper">
      <div className="mx-auto max-w-content px-5 py-12 sm:px-8">
        <p className="tick-label">Pricing</p>
        <h1 className="mt-3 font-display text-5xl text-charcoal">Every pound, explained.</h1>
        <p className="mt-4 max-w-2xl leading-relaxed text-muted">
          One authoritative pricing service drives this page, the fleet, and checkout. Order: nightly rates (with
          weekend rules) → seasonal multiplier → weekly discount → mandatory fees → extras → coupons → 10% GST →
          deposit split. The refundable security deposit is always shown separately and never counted as revenue.
        </p>
        <div className="mt-8 grid gap-6 md:grid-cols-2">
          <Example slug="the-rowan" pickup="2026-10-16" ret="2026-10-19" label="Short trip · 3 nights" seasonal={rules.seasonal} caravans={caravans} />
          <Example slug="the-alder" pickup="2026-07-10" ret="2026-07-19" label="Summer week · 9 nights" seasonal={rules.seasonal} caravans={caravans} />
        </div>
        <div className="mt-10 grid gap-8 lg:grid-cols-2">
          <div>
            <h2 className="font-display text-3xl">Rate rules</h2>
            <table className="table-quiet mt-4 bg-white">
              <tbody>
                <tr><td className="font-semibold">Nightly</td><td>{["the-rowan", "the-alder", "the-solace"].map((s) => { const v = by(s); return `${v.name.replace("The ", "")} ${gbp(v.baseNightlyPence)}`; }).join(" · ")}. Fri/Sat nights carry the weekend rate.</td></tr>
                <tr><td className="font-semibold">Season</td><td>{rules.seasonal.length > 0 ? rules.seasonal.map((r) => `${r.startMonthDay}–${r.endMonthDay} ×${(r.multiplierPct / 100).toFixed(2)}`).join(" · ") : "15 Jun–5 Sep ×1.2 · 20 Dec–4 Jan ×1.1"} · otherwise ×1.0.</td></tr>
                <tr><td className="font-semibold">Long stays</td><td>Weekly discount off each full 7-night block ({["the-rowan", "the-alder", "the-solace"].map((s) => { const v = by(s); return `${v.name.replace("The ", "")} ${v.weeklyDiscountPct}%`; }).join(" · ")}).</td></tr>
                <tr><td className="font-semibold">Minimums</td><td>{["the-rowan", "the-alder", "the-solace"].map((s) => { const v = by(s); return `${v.name.replace("The ", "")} ${v.minNights}`; }).join(" · ")} nights min. Max {Math.max(...caravans.map((c) => c.maxNights))} nights.</td></tr>
                <tr><td className="font-semibold">Cleaning</td><td>{gbp(Math.min(...caravans.map((c) => c.cleaningFeePence)))}–{gbp(Math.max(...caravans.map((c) => c.cleaningFeePence)))} mandatory per hire. Leave the van tidy; deep-clean is on us.</td></tr>
                <tr><td className="font-semibold">Mileage</td><td>100–120 km/night included. Excess {gbp(35)}/km. Extra 400 km packs {gbp(5500)}.</td></tr>
                <tr><td className="font-semibold">GST</td><td>10% on rental + fees + extras after discounts. Shown itemised before payment.</td></tr>
              </tbody>
            </table>
          </div>
          <div>
            <h2 className="font-display text-3xl">Deposits, done properly</h2>
            <div className="mt-4 space-y-4 text-[0.95rem] leading-relaxed text-charcoal/85">
              <p><strong>Booking deposit (25%):</strong> part-payment of the rental itself, settled at the depot counter along with the balance. Nothing is charged online — your reservation simply holds the dates.</p>
              <p><strong>Refundable security deposit ($800–$1,200):</strong> authorised alongside the balance and released within 5 working days of return, less only documented damage, missing items or excess mileage. It is held separately in the accounts and never reported as revenue.</p>
              <p><strong>Coupons &amp; gift vouchers:</strong> percent or fixed codes with date, caravan and minimum-spend rules — all validated server-side. Voucher balances cannot be overspent, even under concurrent redemption.</p>
            </div>
            <Link href="/booking" className="btn-primary mt-6">Check your dates</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
