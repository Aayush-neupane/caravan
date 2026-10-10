import { prisma } from "@/lib/db";
import { gbp } from "@/lib/format";
export const metadata = { title: "Payments", robots: { index: false, follow: false } };
export default async function PaymentsAdmin() {
  let rows: { id: string; booking: string; provider: string; amount: number; status: string }[] = [];
  let refunds: { booking: string; amount: number; reason: string }[] = [];
  try {
    const ps = await prisma.payment.findMany({ include: { booking: true }, orderBy: { createdAt: "desc" }, take: 100 });
    rows = ps.map((p) => ({ id: p.id.slice(0, 8), booking: p.booking.reference, provider: p.provider, amount: p.amountPence, status: p.status }));
    const rs = await prisma.refund.findMany({ include: { booking: true }, take: 50 });
    refunds = rs.map((r) => ({ booking: r.booking.reference, amount: r.amountPence, reason: r.reason }));
  } catch { /* ignore */ }
  return (<div><h1 className="font-display text-4xl">Payments &amp; refunds</h1><p className="mt-2 text-[0.9rem] text-muted">Stripe test mode when configured; otherwise labelled demo mode. Status advances only on verified webhook or server-confirmed demo event. Duplicate webhooks are deduped by provider ref.</p>
  <table className="table-quiet mt-4 bg-white"><thead><tr><th>ID</th><th>Booking</th><th>Provider</th><th>Amount</th><th>Status</th></tr></thead><tbody>{rows.map((r) => <tr key={r.id}><td className="font-mono">{r.id}</td><td>{r.booking}</td><td>{r.provider}</td><td>{gbp(r.amount)}</td><td className="font-semibold">{r.status}</td></tr>)}</tbody></table>
  <h2 className="mt-6 font-semibold">Refunds</h2><table className="table-quiet mt-2 bg-white"><thead><tr><th>Booking</th><th>Amount</th><th>Reason</th></tr></thead><tbody>{refunds.map((r, i) => <tr key={i}><td>{r.booking}</td><td>{gbp(r.amount)}</td><td>{r.reason}</td></tr>)}</tbody></table>
  {rows.length === 0 && <p className="mt-3 text-[0.9rem] text-muted">No payments yet — complete a demo booking to generate records.</p>}</div>);
}
