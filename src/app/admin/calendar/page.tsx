import { prisma } from "@/lib/db";
import { gbp } from "@/lib/format";

export const metadata = { title: "Fleet calendar", robots: { index: false, follow: false } };

export default async function CalendarPage() {
  let caravans: { name: string; slug: string; bookings: { reference: string; pickup: Date; ret: Date; status: string }[]; maintenance: { category: string; start: Date; end: Date }[] }[] = [];
  try {
    const rows = await prisma.caravan.findMany({ include: { bookings: { where: { status: { notIn: ["cancelled", "expired"] } }, orderBy: { pickupDate: "asc" } }, maintenance: { where: { done: false } } } });
    caravans = rows.map((c) => ({ name: c.name, slug: c.slug, bookings: c.bookings.map((b) => ({ reference: b.reference, pickup: b.pickupDate, ret: b.returnDate, status: b.status })), maintenance: c.maintenance.map((m) => ({ category: m.category, start: m.startDate, end: m.endDate })) }));
  } catch { /* unseeded */ }

  return (
    <div>
      <h1 className="font-display text-4xl">Fleet calendar</h1>
      <p className="mt-2 text-[0.9rem] text-muted">Pickup-inclusive, return-exclusive with a 1-day preparation buffer. Maintenance blocks affect availability. Drag-and-drop is intentionally omitted — use explicit date moves so every change passes server validation.</p>
      <div className="mt-5 space-y-5">
        {caravans.map((c) => (
          <section key={c.slug} className="border border-border bg-white p-5" style={{ borderRadius: 10 }}>
            <h2 className="font-display text-2xl">{c.name}</h2>
            {c.bookings.length === 0 && c.maintenance.length === 0 && <p className="mt-1 text-[0.88rem] text-muted">No occupancy — fully available.</p>}
            <ul className="mt-3 space-y-2">
              {c.bookings.map((b) => (
                <li key={b.reference} className="flex flex-wrap items-center justify-between gap-2 border-t border-border pt-2 text-[0.88rem]">
                  <span><strong>{b.reference}</strong> · {new Date(b.pickup).toISOString().slice(0, 10)} → {new Date(b.ret).toISOString().slice(0, 10)}</span>
                  <span className="border border-border px-2 py-0.5 text-[0.75rem] font-bold uppercase" style={{ borderRadius: 4 }}>{b.status}</span>
                </li>
              ))}
              {c.maintenance.map((m, i) => (
                <li key={i} className="flex flex-wrap items-center justify-between gap-2 border-t border-border pt-2 text-[0.88rem] text-warning">
                  <span>⚠ Maintenance: {m.category} · {new Date(m.start).toISOString().slice(0, 10)} → {new Date(m.end).toISOString().slice(0, 10)}</span>
                </li>
              ))}
            </ul>
          </section>
        ))}
        {caravans.length === 0 && <p className="border border-border bg-white p-5 text-[0.9rem] text-muted" style={{ borderRadius: 8 }}>No fleet records — run the seed.</p>}
      </div>
    </div>
  );
}
