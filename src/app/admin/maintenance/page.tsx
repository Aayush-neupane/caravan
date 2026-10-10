import { prisma } from "@/lib/db";
export const metadata = { title: "Maintenance", robots: { index: false, follow: false } };
export default async function MaintenanceAdmin() {
  let rows: { van: string; cat: string; start: string; end: string; done: boolean }[] = [];
  try {
    const ms = await prisma.maintenanceRecord.findMany({ include: { caravan: true }, orderBy: { startDate: "asc" }, take: 100 });
    rows = ms.map((m) => ({ van: m.caravan.name, cat: m.category, start: m.startDate.toISOString().slice(0, 10), end: m.endDate.toISOString().slice(0, 10), done: m.done }));
  } catch { /* ignore */ }
  return (<div><h1 className="font-display text-4xl">Maintenance</h1><p className="mt-2 text-[0.9rem] text-muted">Blocks integrate with availability. Conflicts with confirmed reservations are flagged, never silently double-booked.</p>
  <table className="table-quiet mt-4 bg-white"><thead><tr><th>Caravan</th><th>Category</th><th>Start</th><th>End</th><th>Done</th></tr></thead><tbody>{rows.map((r, i) => <tr key={i}><td>{r.van}</td><td>{r.cat}</td><td>{r.start}</td><td>{r.end}</td><td>{r.done ? "yes" : "no"}</td></tr>)}</tbody></table>
  {rows.length === 0 && <p className="mt-3 text-[0.9rem] text-muted">No maintenance records. Seed includes an annual-service block demonstrating a conflict guard.</p>}</div>);
}
