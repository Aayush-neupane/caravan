import { prisma } from "@/lib/db";
import { EmptyState, Panel } from "@/components/admin/ui";
import { StatusBadge } from "@/components/admin/ui";

export const metadata = { title: "Fleet calendar", robots: { index: false, follow: false } };

export default async function CalendarPage() {
  let caravans: { name: string; slug: string; bookings: { reference: string; pickup: string; ret: string; status: string }[]; maintenance: { category: string; start: string; end: string }[] }[] = [];
  try {
    const rows = await prisma.caravan.findMany({ include: { bookings: { where: { status: { notIn: ["cancelled", "expired"] } }, orderBy: { pickupDate: "asc" } }, maintenance: { where: { done: false } } } });
    caravans = rows.map((c) => ({
      name: c.name, slug: c.slug,
      bookings: c.bookings.map((b) => ({ reference: b.reference, pickup: b.pickupDate.toISOString().slice(0, 10), ret: b.returnDate.toISOString().slice(0, 10), status: b.status })),
      maintenance: c.maintenance.map((m) => ({ category: m.category, start: m.startDate.toISOString().slice(0, 10), end: m.endDate.toISOString().slice(0, 10) })),
    }));
  } catch { /* unseeded */ }

  return (
    <div>
      <p className="tick-label">Occupancy · pickup-inclusive, return-exclusive + 1-day buffer</p>
      <h1 className="mt-1 font-display text-4xl text-charcoal sm:text-5xl">Fleet calendar</h1>
      <p className="mt-2 max-w-2xl text-[0.9rem] text-muted">Maintenance blocks affect availability and are flagged against confirmed reservations — never silently double-booked. Date moves happen via explicit edits so every change passes server validation.</p>
      <div className="mt-5 space-y-4">
        {caravans.map((c) => (
          <Panel key={c.slug} title={c.name} action={<span className="text-[0.8rem] text-muted">{c.bookings.length} holds &amp; bookings</span>}>
            {c.bookings.length === 0 && c.maintenance.length === 0 && <EmptyState title="Fully available" body="No occupancy, holds or maintenance. Every night is bookable." />}
            <ul className="space-y-0">
              {c.bookings.map((b) => (
                <li key={b.reference} className="flex flex-wrap items-center justify-between gap-2 border-b border-border py-2.5 text-[0.88rem] last:border-0">
                  <span><strong className="font-mono">{b.reference}</strong> <span className="text-muted">· {b.pickup} → {b.ret}</span></span>
                  <StatusBadge status={b.status} />
                </li>
              ))}
              {c.maintenance.map((m, i) => (
                <li key={i} className="flex flex-wrap items-center justify-between gap-2 border-b border-border bg-sand/40 px-2 py-2.5 text-[0.88rem] last:border-0" style={{ borderRadius: 6 }}>
                  <span>⚠ <strong>{m.category}</strong> <span className="text-muted">· {m.start} → {m.end}</span></span>
                  <span className="text-[0.75rem] font-bold uppercase tracking-wide text-warning">maintenance</span>
                </li>
              ))}
            </ul>
          </Panel>
        ))}
        {caravans.length === 0 && <EmptyState title="No fleet records" body="Run the seed to load caravans, bookings and maintenance." />}
      </div>
    </div>
  );
}
