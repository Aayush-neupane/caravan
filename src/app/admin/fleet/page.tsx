import { prisma } from "@/lib/db";
import { gbp } from "@/lib/format";
import { DataTable, EmptyState, StatusBadge } from "@/components/admin/ui";
import { PublishButton } from "./publish";
import { FleetEdit, type FleetRow } from "./edit";

export const metadata = { title: "Fleet admin", robots: { index: false, follow: false } };

type Row = FleetRow & { nightly: number; published: boolean; bookings: number; future: number };

export default async function FleetAdmin() {
  let rows: Row[] = [];
  try {
    const all = await prisma.caravan.findMany({ include: { _count: { select: { bookings: true } } } });
    const now = new Date();
    for (const c of all) {
      const future = await prisma.booking.count({
        where: { caravanId: c.id, pickupDate: { gte: now }, status: { notIn: ["cancelled", "expired", "completed"] } },
      });
      rows.push({
        name: c.name, slug: c.slug, tagline: c.tagline, description: c.description,
        berths: c.berths, maxTravellers: c.maxTravellers,
        baseNightlyPence: c.baseNightlyPence, weekendNightlyPence: c.weekendNightlyPence,
        weeklyDiscountPct: c.weeklyDiscountPct, minNights: c.minNights, maxNights: c.maxNights,
        cleaningFeePence: c.cleaningFeePence, securityDepositPence: c.securityDepositPence,
        towRequirement: c.towRequirement, archived: c.archived,
        nightly: c.baseNightlyPence, published: c.published, bookings: c._count.bookings, future,
      });
    }
  } catch { /* ignore */ }
  return (
    <div>
      <p className="tick-label">Inventory · operational truth</p>
      <h1 className="mt-1 font-display text-4xl text-charcoal sm:text-5xl">Fleet</h1>
      <p className="mt-2 max-w-2xl text-[0.9rem] text-muted">
        Publishing controls visibility on the site. Unpublishing or archiving never deletes history —
        all past and future booking records are preserved, and you are warned when future reservations exist.
      </p>
      <div className="mt-4 border border-border bg-white px-5 py-3" style={{ borderRadius: 10 }}>
        {rows.length === 0 ? (
          <EmptyState title="No fleet rows" body="Run the seed. Fleet marketing copy lives in the catalogue file; availability, pricing and reservations live here." />
        ) : (
          <DataTable headers={["Caravan", "Berths", "Nightly", "Bookings", "Published", "Manage"]} caption="Fleet inventory">
            {rows.map((r) => (
              <tr key={r.slug}>
                <td><span className="font-semibold">{r.name}</span> <span className="font-mono text-[0.78rem] text-muted">/{r.slug}</span>{r.archived && <span className="ml-2 font-mono text-[0.72rem] font-bold uppercase text-muted">archived</span>}</td>
                <td>{r.berths}</td>
                <td className="whitespace-nowrap font-semibold">{gbp(r.nightly)}</td>
                <td>{r.bookings}{r.future > 0 && <span className="ml-2"><StatusBadge status="confirmed" /></span>} <span className="text-muted">({r.future} upcoming)</span></td>
                <td><PublishButton slug={r.slug} published={r.published} future={r.future} /></td>
                <td><FleetEdit row={r} /></td>
              </tr>
            ))}
          </DataTable>
        )}
      </div>
    </div>
  );
}
