import { prisma } from "@/lib/db";
export const metadata = { title: "Customers", robots: { index: false, follow: false } };
export default async function CustomersAdmin() {
  let rows: { email: string; name: string; bookings: number }[] = [];
  try {
    const users = await prisma.user.findMany({ include: { customer: { include: { _count: { select: { bookings: true } } } } }, take: 50 });
    rows = users.map((u) => ({ email: u.email, name: u.name ?? "—", bookings: u.customer?._count.bookings ?? 0 }));
    const guests = await prisma.booking.groupBy({ by: ["guestEmail"], _count: { guestEmail: true } });
    for (const g of guests) if (g.guestEmail && !rows.find((r) => r.email === g.guestEmail)) rows.push({ email: g.guestEmail, name: "Guest", bookings: g._count.guestEmail });
  } catch { /* unseeded */ }
  return (<div><h1 className="font-display text-4xl">Customers</h1><p className="mt-2 text-[0.9rem] text-muted">Search and view booking, payment and document history. Internal notes stay staff-only. Export/delete per privacy policy.</p>
  <table className="table-quiet mt-4 bg-white"><thead><tr><th>Email</th><th>Name</th><th>Bookings</th></tr></thead><tbody>{rows.map((r) => <tr key={r.email}><td>{r.email}</td><td>{r.name}</td><td>{r.bookings}</td></tr>)}</tbody></table>
  {rows.length === 0 && <p className="mt-3 text-[0.9rem] text-muted">No customer records yet.</p>}</div>);
}
