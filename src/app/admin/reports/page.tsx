import { prisma } from "@/lib/db";
import { gbp } from "@/lib/format";
export const metadata = { title: "Reports", robots: { index: false, follow: false } };

// Statuses that can still owe money. `held` is included on purpose: an unpaid
// online reservation is outstanding money, and `expired`/`cancelled`/`completed`
// ones are not.
const LIVE_STATUSES = ["held", "awaiting_payment", "awaiting_documents", "confirmed", "ready", "active"];

// Refund audit trail: a released security deposit is NOT a refund of rental
// income — it is the refundable deposit going back, so it must never sit in
// the refunds figure.
const DEPOSIT_RELEASE_REASON = "Security deposit released after inspection";

export default async function ReportsAdmin() {
  let revenue = 0, bookings = 0, cancelled = 0, outstanding = 0, refunds = 0, liveBookings = 0;
  let byVan: { name: string; n: number }[] = [];
  try {
    const pays = await prisma.payment.findMany({ where: { status: "succeeded" } });
    revenue = pays.reduce((a, p) => a + p.amountPence, 0);
    bookings = await prisma.booking.count();
    cancelled = await prisma.booking.count({ where: { status: "cancelled" } });

    // Outstanding = unpaid remainder across every live booking, measured
    // against the payments actually recorded (a deposit-only row still owes
    // its balance; an unpaid held reservation owes its whole deposit).
    const [payments, live] = await Promise.all([
      prisma.payment.findMany({ where: { status: "succeeded" }, select: { bookingId: true, amountPence: true } }),
      prisma.booking.findMany({
        where: { status: { in: LIVE_STATUSES } },
        select: { id: true, totalPence: true, depositDuePence: true, payments: { where: { status: "succeeded" }, select: { amountPence: true } } },
      }),
    ]);
    const paid = new Map<string, number>();
    for (const p of payments) paid.set(p.bookingId, (paid.get(p.bookingId) ?? 0) + p.amountPence);
    outstanding = live.reduce((a, b) => {
      const alreadyPaid = paid.get(b.id) ?? 0;
      const owed = Math.max(0, b.totalPence - alreadyPaid);
      return owed > 0 ? a + owed : a;
    }, 0);
    liveBookings = live.filter((b) => Math.max(0, b.totalPence - (paid.get(b.id) ?? 0)) > 0).length;

    const rs = await prisma.refund.findMany();
    refunds = rs.reduce((a, r) => a + (r.reason === DEPOSIT_RELEASE_REASON ? 0 : r.amountPence), 0);
    const vans = await prisma.caravan.findMany({ include: { _count: { select: { bookings: true } } } });
    byVan = vans.map((v) => ({ name: v.name, n: v._count.bookings }));
  } catch { /* ignore */ }
  const rows: [string, string][] = [
    ["Gross rental value (collected payments)", gbp(revenue)],
    ["Total reservations", String(bookings)],
    ["Cancellations", String(cancelled)],
    ["Outstanding balances (unpaid across live bookings)", gbp(outstanding)],
    ["Live bookings still owing", String(liveBookings)],
    ["Refunds recorded (excl. deposit releases)", gbp(refunds)],
    ["Security deposits held", "reported separately — never revenue"],
  ];
  return (<div><h1 className="font-display text-4xl">Reports</h1><p className="mt-2 text-[0.9rem] text-muted">Definitions: gross = succeeded payments; outstanding = booking total minus succeeded payments across live reservations (held, awaiting payment/documents, confirmed, ready, active); refunds exclude released security deposits; deposits held separately; taxes included in totals. CSV export: copy any table into a spreadsheet (staff permission required in production).</p>
  <table className="table-quiet mt-4 bg-white"><tbody>{rows.map(([k, v]) => <tr key={k}><td className="font-semibold">{k}</td><td>{v}</td></tr>)}</tbody></table>
  <h2 className="mt-6 font-semibold">Bookings by caravan</h2><table className="table-quiet mt-2 bg-white"><thead><tr><th>Caravan</th><th>Reservations</th></tr></thead><tbody>{byVan.map((b) => <tr key={b.name}><td>{b.name}</td><td>{b.n}</td></tr>)}</tbody></table></div>);
}
