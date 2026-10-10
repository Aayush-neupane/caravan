import Link from "next/link";
import { prisma } from "@/lib/db";
import { gbp } from "@/lib/format";
import { DataTable, EmptyState, Panel, StatCard, StatusBadge } from "@/components/admin/ui";

export const metadata = { title: "Admin overview", robots: { index: false, follow: false } };

function dayKey(d: Date): string {
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}-${String(d.getUTCDate()).padStart(2, "0")}`;
}

export default async function AdminOverview() {
  let stats = { upcoming: 0, returns: 0, docQueue: 0, awaitingPay: 0, active: 0, revenue: 0 };
  let recent: { id: string; reference: string; van: string; guest: string; pickup: string; status: string }[] = [];
  let strips: { name: string; days: { date: string; state: "booked" | "blocked" | "free" }[]; booked: number }[] = [];
  let seeded = false;

  try {
    const now = new Date();
    const week = new Date(now.getTime() + 7 * 86400000);
    const [upcoming, awaitingPay, active, docs, pays, recentRows] = await Promise.all([
      prisma.booking.count({ where: { pickupDate: { gte: now, lte: week }, status: { in: ["confirmed", "ready"] } } }),
      prisma.booking.count({ where: { status: "awaiting_payment" } }),
      prisma.booking.count({ where: { status: "active" } }),
      prisma.customerDocument.count({ where: { status: { in: ["uploaded", "under_review"] } } }),
      prisma.payment.findMany({ where: { status: "succeeded" }, select: { amountPence: true } }),
      prisma.booking.findMany({ include: { caravan: true }, orderBy: { createdAt: "desc" }, take: 8 }),
    ]);
    const returns = await prisma.booking.count({ where: { returnDate: { gte: now, lte: week }, status: { in: ["active", "ready", "confirmed"] } } });
    stats = { upcoming, returns, docQueue: docs, awaitingPay, active, revenue: pays.reduce((a, p) => a + p.amountPence, 0) };
    recent = recentRows.map((b) => ({
      id: b.id, reference: b.reference, van: b.caravan.name,
      guest: b.guestName ?? b.guestEmail ?? "—",
      pickup: b.pickupDate.toISOString().slice(0, 10), status: b.status,
    }));
    seeded = recentRows.length > 0;

    // 14-day occupancy per caravan from real blocking records.
    const vans = await prisma.caravan.findMany({
      include: {
        bookings: { where: { status: { notIn: ["cancelled", "expired", "completed"] } } },
        maintenance: { where: { done: false } },
      },
    });
    const today = new Date(); today.setUTCHours(12, 0, 0, 0);
    strips = vans.map((v) => {
      const days: { date: string; state: "booked" | "blocked" | "free" }[] = [];
      for (let i = 0; i < 14; i++) {
        const day = new Date(today.getTime() + i * 86400000);
        const key = dayKey(day);
        const inBooking = v.bookings.some((b) => key >= dayKey(new Date(b.pickupDate)) && key < dayKey(new Date(b.returnDate)));
        const inMaint = !inBooking && v.maintenance.some((m) => key >= dayKey(new Date(m.startDate)) && key < dayKey(new Date(m.endDate)));
        days.push({ date: key.slice(5), state: inBooking ? "booked" : inMaint ? "blocked" : "free" });
      }
      return { name: v.name, days, booked: days.filter((x) => x.state !== "free").length };
    });
  } catch { /* unmigrated */ }

  return (
    <div>
      <p className="tick-label">Tuesday briefing · live from the books</p>
      <h1 className="mt-1 font-display text-4xl text-charcoal sm:text-5xl">Here is the yard.</h1>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <StatCard label="Collections · next 7 days" value={String(stats.upcoming)} hint="Confirmed + ready pickups" href="/admin/bookings" />
        <StatCard label="Returns · next 7 days" value={String(stats.returns)} hint="Inspections to schedule" href="/admin/calendar" />
        <StatCard label="Documents in review" value={String(stats.docQueue)} hint="Licences awaiting decision" href="/admin/documents" />
        <StatCard label="Awaiting payment" value={String(stats.awaitingPay)} hint="Holds ticking — 20 min" href="/admin/payments" />
        <StatCard label="Out on the road" value={String(stats.active)} hint="Active rentals now" href="/admin/calendar" />
        <StatCard label="Collected revenue" value={gbp(stats.revenue)} hint="Succeeded payments · deposits held separately" href="/admin/reports" />
      </div>

      <div className="mt-6 grid gap-4 xl:grid-cols-2">
        <Panel title="Fortnight occupancy" action={<Link href="/admin/calendar" className="text-[0.83rem] font-semibold text-forest underline">Full calendar →</Link>}>
          {!seeded ? (
            <EmptyState title="No records yet" body="Run npx prisma db push && npm run seed to load the demonstration fleet and bookings." />
          ) : (
            <ul className="space-y-4">
              {strips.map((s) => (
                <li key={s.name}>
                  <div className="flex items-baseline justify-between">
                    <p className="font-semibold text-charcoal">{s.name}</p>
                    <p className="text-[0.8rem] text-muted">{s.booked} of 14 nights spoken for</p>
                  </div>
                  <div className="mt-1.5 flex gap-1" role="img" aria-label={`${s.name}: ${s.booked} of next 14 nights occupied`}>
                    {s.days.map((day, i) => (
                      <span
                        key={i}
                        title={`${day.date} — ${day.state}`}
                        className="h-7 flex-1"
                        style={{
                          borderRadius: 3,
                          background: day.state === "booked" ? "#1A2B23" : day.state === "blocked" ? "#C9A86A" : "#E3E1D8",
                          border: "1px solid #DCDDD5",
                        }}
                      />
                    ))}
                  </div>
                </li>
              ))}
            </ul>
          )}
          <div className="mt-3 flex gap-4 text-[0.75rem] text-muted">
            <span className="flex items-center gap-1.5"><i className="inline-block h-2.5 w-2.5 bg-forest" style={{ borderRadius: 2 }} /> Booked</span>
            <span className="flex items-center gap-1.5"><i className="inline-block h-2.5 w-2.5 bg-amber" style={{ borderRadius: 2 }} /> Maintenance</span>
            <span className="flex items-center gap-1.5"><i className="inline-block h-2.5 w-2.5 border border-border bg-[#E3E1D8]" style={{ borderRadius: 2 }} /> Free</span>
          </div>
        </Panel>

        <Panel title="Latest reservations" action={<Link href="/admin/bookings" className="text-[0.83rem] font-semibold text-forest underline">All bookings →</Link>}>
          {!seeded ? (
            <EmptyState title="Nothing booked yet" body="Reservations created on the site appear here instantly." />
          ) : (
            <DataTable headers={["Ref", "Caravan", "Pickup", "Status"]} caption="Latest reservations">
              {recent.map((b) => (
                <tr key={b.id}>
                  <td><Link href={`/admin/bookings/${b.id}`} className="font-bold text-forest underline underline-offset-2">{b.reference}</Link></td>
                  <td>{b.van}</td>
                  <td className="whitespace-nowrap">{b.pickup}</td>
                  <td><StatusBadge status={b.status} /></td>
                </tr>
              ))}
            </DataTable>
          )}
        </Panel>
      </div>
    </div>
  );
}
