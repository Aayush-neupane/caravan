import { prisma } from "@/lib/db";
import { gbp } from "@/lib/format";
export const metadata = { title: "Pricing admin", robots: { index: false, follow: false } };
export default async function PricingAdmin() {
  let seasons: { name: string; mult: number }[] = [];
  let discounts: { name: string; nights: number; pct: number }[] = [];
  try {
    seasons = (await prisma.seasonalRate.findMany()).map((s) => ({ name: s.name, mult: s.multiplierPct }));
    discounts = (await prisma.discountRule.findMany()).map((d) => ({ name: d.name, nights: d.minNights, pct: d.pct }));
  } catch { /* ignore */ }
  return (<div><h1 className="font-display text-4xl">Pricing &amp; extras</h1><p className="mt-2 text-[0.9rem] text-muted">Precedence: nightly → weekend → seasonal × → weekly discount → fees → extras → coupons → VAT. Preview a sample quote before publishing; upcoming affected dates are shown on the pricing page examples.</p>
  <h2 className="mt-6 font-semibold">Seasonal rules</h2><table className="table-quiet mt-2 bg-white"><thead><tr><th>Rule</th><th>Multiplier</th></tr></thead><tbody>{seasons.map((s) => <tr key={s.name}><td>{s.name}</td><td>×{(s.mult / 100).toFixed(2)}</td></tr>)}</tbody></table>
  <h2 className="mt-6 font-semibold">Discount rules</h2><table className="table-quiet mt-2 bg-white"><thead><tr><th>Rule</th><th>Min nights</th><th>Off</th></tr></thead><tbody>{discounts.map((d) => <tr key={d.name}><td>{d.name}</td><td>{d.nights}</td><td>{d.pct}%</td></tr>)}</tbody></table>
  {(seasons.length === 0) && <p className="mt-3 text-[0.9rem] text-muted">No rules yet — run the seed. Conflicting rules are rejected: only one seasonal multiplier applies per night; coupons never stack unless explicitly allowed.</p>}</div>);
}
