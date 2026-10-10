import { prisma } from "@/lib/db";
export const metadata = { title: "Coupons", robots: { index: false, follow: false } };
export default async function CouponsAdmin() {
  let coupons: { code: string; kind: string; value: number; used: number; active: boolean }[] = [];
  let vouchers: { code: string; balance: number; active: boolean }[] = [];
  try {
    coupons = (await prisma.coupon.findMany()).map((c) => ({ code: c.code, kind: c.kind, value: c.value, used: c.usedCount, active: c.active }));
    vouchers = (await prisma.voucher.findMany()).map((v) => ({ code: v.code, balance: v.balancePence, active: v.active }));
  } catch { /* ignore */ }
  return (<div><h1 className="font-display text-4xl">Coupons &amp; gift vouchers</h1><p className="mt-2 text-[0.9rem] text-muted">Percent / fixed codes with date, caravan, minimum-spend and usage limits — validated server-side. Voucher redemption is balance-guarded against concurrent use.</p>
  <h2 className="mt-6 font-semibold">Coupons</h2><table className="table-quiet mt-2 bg-white"><thead><tr><th>Code</th><th>Kind</th><th>Value</th><th>Used</th><th>Active</th></tr></thead><tbody>{coupons.map((c) => <tr key={c.code}><td className="font-mono font-bold">{c.code}</td><td>{c.kind}</td><td>{c.value}</td><td>{c.used}</td><td>{c.active ? "yes" : "no"}</td></tr>)}</tbody></table>
  <h2 className="mt-6 font-semibold">Vouchers</h2><table className="table-quiet mt-2 bg-white"><thead><tr><th>Code</th><th>Balance (p)</th><th>Active</th></tr></thead><tbody>{vouchers.map((v) => <tr key={v.code}><td className="font-mono font-bold">{v.code}</td><td>{v.balance}</td><td>{v.active ? "yes" : "no"}</td></tr>)}</tbody></table></div>);
}
