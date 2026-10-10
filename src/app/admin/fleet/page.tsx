import { prisma } from "@/lib/db";
import { gbp } from "@/lib/format";

export const metadata = { title: "Fleet admin", robots: { index: false, follow: false } };

async function Simple({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h1 className="font-display text-4xl">{title}</h1>
      <div className="mt-4">{children}</div>
    </div>
  );
}

export default async function FleetAdmin() {
  let rows: { name: string; slug: string; berths: number; nightly: number; published: boolean; bookings: number }[] = [];
  try {
    const all = await prisma.caravan.findMany({ include: { _count: { select: { bookings: true } } } });
    rows = all.map((c) => ({ name: c.name, slug: c.slug, berths: c.berths, nightly: c.baseNightlyPence, published: c.published, bookings: c._count.bookings }));
  } catch { /* ignore */ }
  return (
    <Simple title="Fleet">
      <p className="text-[0.9rem] text-muted">Create, edit, archive — never delete history. Archiving preserves all past and future booking records. Warn before deactivating vans with future reservations.</p>
      <table className="table-quiet mt-4 bg-white">
        <thead><tr><th>Caravan</th><th>Berths</th><th>Nightly</th><th>Published</th><th>Bookings</th></tr></thead>
        <tbody>{rows.map((r) => <tr key={r.slug}><td className="font-semibold">{r.name} <span className="text-muted">/{r.slug}</span></td><td>{r.berths}</td><td>{gbp(r.nightly)}</td><td>{r.published ? "yes" : "no"}</td><td>{r.bookings}</td></tr>)}</tbody>
      </table>
      {rows.length === 0 && <p className="mt-3 text-[0.9rem] text-muted">No fleet rows — run the seed. Fleet marketing copy lives in the catalogue file; operational truth lives here.</p>}
    </Simple>
  );
}
