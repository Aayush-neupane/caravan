import { prisma } from "@/lib/db";
import { gbp } from "@/lib/format";
export const metadata = { title: "Reports", robots: { index: false, follow: false } };
export default async function ReportsAdmin() {
  let revenue = 0, bookings = 0, cancelled = 0, outstanding = 0, refunds = 0;
  let byVan: { name: string; n: number }[] = [];
  try {
    const pays = await prisma.payment.findMany({ where: { status: "succeeded" } });
    revenue = pays.reduce((a, p) => a + p.amountPence, 0);
    bookings = await prisma.booking.count();
    cancelled = await prisma.booking.count({ where: { status: "cancelled" } });
    const awaitPay = await prisma.booking.findMany({ where: { status: { in: ["awaiting_payment", "confirmed"] } } });
    outstanding = awaitPay.reduce((a, b) => a + Math.max(0, b.totalPence - b.depositDuePence), 0);
    const rs = await prisma.refund.findMany();
    refunds = rs.reduce((a, r) => a + r.amountPence, 0);
    const vans = await prisma.caravan.findMany({ include: { _count: { select: { bookings: true } } } });
    byVan = vans.map((v) => ({ name: v.name, n: v._count.bookings }));
  } catch { /* ignore */ }
  const rows: [string, string][] = [
    ["Gross rental value (collected payments)", gbp(revenue)],
    ["Total reservations", String(bookings)],
    ["Cancellations", String(cancelled)],
    ["Outstanding balances (confirmed unpaid remainder)", gbp(outstanding)],
    ["Refunds recorded (excl. refundable deposits)", gbp(refunds)],
    ["Security deposits held", "reported separately — never revenue"],
  ];
  return (<div><h1 className="font-display text-4xl">Reports</h1><p className="mt-2 text-[0.9rem] text-muted">Definitions: gross = succeeded payments; deposits held separately; taxes included in totals. CSV export: copy any table into a spreadsheet (staff permission required in production).</p>
  <table className="table-quiet mt-4 bg-white"><tbody>{rows.map(([k, v]) => <tr key={k}><td className="font-semibold">{k}</td><td>{v}</td></tr>)}</tbody></table>
  <h2 className="mt-6 font-semibold">Bookings by caravan</h2><table className="table-quiet mt-2 bg-white"><thead><tr><th>Caravan</th><th>Reservations</th></tr></thead><tbody>{byVan.map((b) => <tr key={b.name}><td>{b.name}</td><td>{b.n}</td></tr>)}</tbody></table></div>);
}
