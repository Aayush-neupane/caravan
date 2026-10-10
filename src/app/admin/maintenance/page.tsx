import { prisma } from "@/lib/db";
import { BlockAdd, BlockRow, MaintAdd, MaintRow } from "./editors";

export const metadata = { title: "Maintenance", robots: { index: false, follow: false } };

export default async function MaintenanceAdmin() {
  let vans: string[] = [];
  let rows: { id: string; van: string; cat: string; start: string; end: string; priority: string; assignee: string | null; done: boolean }[] = [];
  let blocks: { id: string; van: string; start: string; end: string; reason: string }[] = [];
  try {
    vans = (await prisma.caravan.findMany({ select: { slug: true }, orderBy: { name: "asc" } })).map((c) => c.slug);
    const ms = await prisma.maintenanceRecord.findMany({ include: { caravan: true }, orderBy: { startDate: "asc" }, take: 100 });
    rows = ms.map((m) => ({ id: m.id, van: m.caravan.name, cat: m.category, start: m.startDate.toISOString().slice(0, 10), end: m.endDate.toISOString().slice(0, 10), priority: m.priority, assignee: m.assignee, done: m.done }));
    const bs = await prisma.availabilityBlock.findMany({ include: { caravan: true }, orderBy: { startDate: "asc" }, take: 100 });
    blocks = bs.map((b) => ({ id: b.id, van: b.caravan.name, start: b.startDate.toISOString().slice(0, 10), end: b.endDate.toISOString().slice(0, 10), reason: b.reason }));
  } catch { /* ignore */ }
  return (
    <div>
      <p className="tick-label">Yard diary · blocks availability</p>
      <h1 className="mt-1 font-display text-4xl">Maintenance</h1>
      <p className="mt-2 max-w-2xl text-[0.9rem] text-muted">
        Service windows and manual blackouts integrate with availability. New entries overlapping a live
        reservation are refused — conflicts are never silently double-booked.
      </p>
      <h2 className="mt-6 font-semibold">Service records</h2>
      <div className="mt-2 border border-border bg-white px-4 py-1" style={{ borderRadius: 10 }}>
        {rows.map((r) => <MaintRow key={r.id} row={r} />)}
        {rows.length === 0 && <p className="py-2 text-[0.9rem] text-muted">No maintenance records.</p>}
      </div>
      <MaintAdd vans={vans} />
      <h2 className="mt-8 font-semibold">Manual blackouts</h2>
      <div className="mt-2 border border-border bg-white px-4 py-1" style={{ borderRadius: 10 }}>
        {blocks.map((b) => <BlockRow key={b.id} row={b} />)}
        {blocks.length === 0 && <p className="py-2 text-[0.9rem] text-muted">No blackouts.</p>}
      </div>
      <BlockAdd vans={vans} />
    </div>
  );
}
