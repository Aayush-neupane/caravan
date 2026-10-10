import Link from "next/link";
import { prisma } from "@/lib/db";
import { gbp } from "@/lib/format";

export const metadata = { title: "Admin overview", robots: { index: false, follow: false } };

export default async function AdminOverview() {
  let data: { upcoming: number; returns: number; docQueue: number; awaitingPay: number; active: number; revenue: number; utilisation: string } = { upcoming: 0, returns: 0, docQueue: 0, awaitingPay: 0, active: 0, revenue: 0, utilisation: "—" };
  let recent: { reference: string; id: string; caravan: string; status: string; pickup: Date }[] = [];
  try {
    const now = new Date();
    const week = new Date(now.getTime() + 7 * 86400000);
    const [upcoming, awaitingPay, active, docs, revenueRows, recentRows] = await Promise.all([
      prisma.booking.count({ where: { pickupDate: { gte: now, lte: week }, status: { in: ["confirmed", "ready"] } } }),
      prisma.booking.count({ where: { status: "awaiting_payment" } }),
      prisma.booking.count({ where: { status: "active" } }),
      prisma.customerDocument.count({ where: { status: { in: ["uploaded", "under_review"] } } }),
      prisma.payment.findMany({ where: { status: "succeeded" }, select: { amountPence: true } }),
      prisma.booking.findMany({ include: { caravan: true }, orderBy: { createdAt: "desc" }, take: 8 }),
    ]);
    const returns = await prisma.booking.count({ where: { returnDate: { gte: now, lte: week }, status: { in: ["active", "ready", "confirmed"] } } });
    data = {
      upcoming, returns, docQueue: docs, awaitingPay, active,
      revenue: revenueRows.reduce((a, p) => a + p.amountPence, 0),
      utilisation: "computed from bookings ÷ available nights (see Reports)",
    };
    recent = recentRows.map((b) => ({ reference: b.reference, id: b.id, caravan: b.caravan.name, status: b.status, pickup: b.pickupDate }));
  } catch {
    // DB not migrated yet — show empty-state guidance.
  }

  const cards: [string, string, string][] = [
    ["Upcoming collections (7d)", String(data.upcoming), "/admin/bookings"],
    ["Upcoming returns (7d)", String(data.returns), "/admin/bookings"],
    ["Documents awaiting review", String(data.docQueue), "/admin/documents"],
    ["Awaiting payment", String(data.awaitingPay), "/admin/payments"],
    ["Active rentals", String(data.active), "/admin/calendar"],
    ["Collected revenue", gbp(data.revenue), "/admin/reports"],
  ];

  return (
    <div>
      <h1 className="font-display text-4xl text-charcoal">Good morning — here is the yard.</h1>
      <p className="mt-2 text-[0.9rem] text-muted">Every metric derives from stored bookings, payments and documents. Select a metric to open its records. {data.utilisation}</p>
      <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {cards.map(([label, value, href]) => (
          <Link key={label} href={href} className="border border-border bg-white p-5 hover:border-forest" style={{ borderRadius: 10 }}>
            <p className="tick-label">{label}</p>
            <p className="mt-1 font-display text-3xl text-forest">{value}</p>
          </Link>
        ))}
      </div>
      <h2 className="mt-8 font-semibold">Recent reservations</h2>
      {recent.length === 0 ? (
        <p className="mt-2 border border-border bg-white p-5 text-[0.9rem] text-muted" style={{ borderRadius: 8 }}>
          No records yet. Run <code>npm run seed</code> (or <code>npx prisma db push &amp;&amp; npm run seed</code>) to load demonstration fleet, bookings, payments and documents.
        </p>
      ) : (
        <table className="table-quiet mt-3 bg-white">
          <thead><tr><th>Reference</th><th>Caravan</th><th>Pickup</th><th>Status</th></tr></thead>
          <tbody>{recent.map((b) => <tr key={b.id}><td><Link className="underline" href={`/admin/bookings/${b.id}`}>{b.reference}</Link></td><td>{b.caravan}</td><td>{new Date(b.pickup).toISOString().slice(0, 10)}</td><td>{b.status}</td></tr>)}</tbody>
        </table>
      )}
    </div>
  );
}
