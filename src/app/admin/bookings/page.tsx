import Link from "next/link";
import { prisma } from "@/lib/db";
import { gbp } from "@/lib/format";

export const metadata = { title: "Bookings", robots: { index: false, follow: false } };

export default async function AdminBookings({ searchParams }: { searchParams: { status?: string; q?: string } }) {
  let bookings: { id: string; reference: string; caravan: string; guest: string; pickup: Date; ret: Date; status: string; total: number }[] = [];
  try {
    const rows = await prisma.booking.findMany({
      where: { ...(searchParams.status ? { status: searchParams.status } : {}), ...(searchParams.q ? { OR: [{ reference: { contains: searchParams.q } }, { guestEmail: { contains: searchParams.q } }] } : {}) },
      include: { caravan: true },
      orderBy: { pickupDate: "desc" },
      take: 100,
    });
    bookings = rows.map((b) => ({ id: b.id, reference: b.reference, caravan: b.caravan.name, guest: b.guestName ?? b.guestEmail ?? "—", pickup: b.pickupDate, ret: b.returnDate, status: b.status, total: b.totalPence }));
  } catch { /* unmigrated */ }

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-display text-4xl">Bookings</h1>
        <Link href="/admin/calendar" className="btn-secondary !py-2">+ Manual booking via calendar</Link>
      </div>
      <form className="mt-4 flex flex-wrap gap-2" method="get">
        <input name="q" placeholder="Search reference or email" defaultValue={searchParams.q ?? ""} className="field-input !w-64" />
        <select name="status" defaultValue={searchParams.status ?? ""} className="field-input !w-52">
          <option value="">All statuses</option>
          {["held", "awaiting_payment", "awaiting_documents", "confirmed", "ready", "active", "completed", "cancelled", "expired", "payment_review"].map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
        <button className="btn-secondary !py-2">Filter</button>
      </form>
      <table className="table-quiet mt-4 bg-white">
        <thead><tr><th>Ref</th><th>Caravan</th><th>Guest</th><th>Dates</th><th>Status</th><th>Total</th></tr></thead>
        <tbody>
          {bookings.map((b) => (
            <tr key={b.id}>
              <td><Link href={`/admin/bookings/${b.id}`} className="font-semibold underline">{b.reference}</Link></td>
              <td>{b.caravan}</td><td>{b.guest}</td>
              <td>{new Date(b.pickup).toISOString().slice(0, 10)} → {new Date(b.ret).toISOString().slice(0, 10)}</td>
              <td>{b.status}</td><td>{gbp(b.total)}</td>
            </tr>
          ))}
        </tbody>
      </table>
      {bookings.length === 0 && <p className="mt-3 text-[0.9rem] text-muted">No bookings match. Seed data provides confirmed, active, cancelled and payment-review examples.</p>}
    </div>
  );
}
