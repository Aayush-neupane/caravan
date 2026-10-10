import Link from "next/link";
import { prisma } from "@/lib/db";
import { gbp } from "@/lib/format";
import { DataTable, EmptyState, Panel, StatusBadge } from "@/components/admin/ui";

export const metadata = { title: "Bookings", robots: { index: false, follow: false } };

const STATUSES = ["held", "awaiting_payment", "awaiting_documents", "confirmed", "ready", "active", "completed", "cancel_requested", "cancelled", "expired", "payment_review"];

export default async function AdminBookings({ searchParams }: { searchParams: { status?: string; q?: string } }) {
  let bookings: { id: string; reference: string; caravan: string; guest: string; pickup: string; ret: string; status: string; total: number }[] = [];
  try {
    const rows = await prisma.booking.findMany({
      where: { ...(searchParams.status ? { status: searchParams.status } : {}), ...(searchParams.q ? { OR: [{ reference: { contains: searchParams.q } }, { guestEmail: { contains: searchParams.q } }] } : {}) },
      include: { caravan: true },
      orderBy: { pickupDate: "desc" },
      take: 100,
    });
    bookings = rows.map((b) => ({ id: b.id, reference: b.reference, caravan: b.caravan.name, guest: b.guestName ?? b.guestEmail ?? "—", pickup: b.pickupDate.toISOString().slice(0, 10), ret: b.returnDate.toISOString().slice(0, 10), status: b.status, total: b.totalPence }));
  } catch { /* unmigrated */ }

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="tick-label">Reservations</p>
          <h1 className="mt-1 font-display text-4xl text-charcoal sm:text-5xl">Bookings</h1>
        </div>
        <Link href="/admin/calendar" className="btn-secondary !py-2.5 !text-[0.85rem]">+ Manual booking via calendar</Link>
      </div>

      <form className="mt-5 flex flex-wrap items-end gap-3 border border-border bg-white p-4" style={{ borderRadius: 10 }} method="get">
        <div>
          <label className="field-label" htmlFor="ab-q">Search</label>
          <input id="ab-q" name="q" placeholder="Reference or email" defaultValue={searchParams.q ?? ""} className="field-input !w-60" />
        </div>
        <div>
          <label className="field-label" htmlFor="ab-status">Status</label>
          <select id="ab-status" name="status" defaultValue={searchParams.status ?? ""} className="field-input !w-52">
            <option value="">All statuses</option>
            {STATUSES.map((s) => <option key={s} value={s}>{s.replace(/_/g, " ")}</option>)}
          </select>
        </div>
        <button className="btn-primary !py-2.5">Filter</button>
      </form>

      <div className="mt-4 border border-border bg-white" style={{ borderRadius: 10 }}>
        <div className="px-5 py-3">
          {bookings.length === 0 ? (
            <EmptyState title="No bookings match" body="Seed data provides confirmed, active, cancelled and payment-review examples. Adjust the filters or run the seed." />
          ) : (
            <DataTable headers={["Reference", "Caravan", "Guest", "Dates", "Status", "Total"]} caption="Bookings">
              {bookings.map((b) => (
                <tr key={b.id}>
                  <td><Link href={`/admin/bookings/${b.id}`} className="font-bold text-forest underline underline-offset-2">{b.reference}</Link></td>
                  <td>{b.caravan}</td>
                  <td className="max-w-44 truncate">{b.guest}</td>
                  <td className="whitespace-nowrap">{b.pickup} → {b.ret}</td>
                  <td><StatusBadge status={b.status} /></td>
                  <td className="whitespace-nowrap font-semibold">{gbp(b.total)}</td>
                </tr>
              ))}
            </DataTable>
          )}
        </div>
      </div>
    </div>
  );
}
