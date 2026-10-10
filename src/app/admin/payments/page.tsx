import { prisma } from "@/lib/db";
import { gbp } from "@/lib/format";
import { DataTable, EmptyState, StatusBadge } from "@/components/admin/ui";

export const metadata = { title: "Payments", robots: { index: false, follow: false } };

export default async function PaymentsAdmin() {
  let rows: { id: string; booking: string; provider: string; amount: number; status: string }[] = [];
  let refunds: { booking: string; amount: number; reason: string }[] = [];
  try {
    const ps = await prisma.payment.findMany({ include: { booking: true }, orderBy: { createdAt: "desc" }, take: 100 });
    rows = ps.map((p) => ({ id: p.id.slice(0, 8), booking: p.booking.reference, provider: p.provider, amount: p.amountPence, status: p.status }));
    const rs = await prisma.refund.findMany({ include: { booking: true }, take: 50 });
    refunds = rs.map((r) => ({ booking: r.booking.reference, amount: r.amountPence, reason: r.reason }));
  } catch { /* ignore */ }

  return (
    <div>
      <p className="tick-label">Money in, money back</p>
      <h1 className="mt-1 font-display text-4xl text-charcoal sm:text-5xl">Payments &amp; refunds</h1>
      <p className="mt-2 max-w-2xl text-[0.9rem] text-muted">Stripe test mode when configured, otherwise labelled demo mode. Status advances only on verified webhooks or server-confirmed demo events — duplicate deliveries dedupe by provider reference.</p>
      <div className="mt-4 border border-border bg-white px-5 py-3" style={{ borderRadius: 10 }}>
        {rows.length === 0 ? (
          <EmptyState title="No payments yet" body="Complete a demo booking on the site to generate payment, notification and status records." />
        ) : (
          <DataTable headers={["ID", "Booking", "Provider", "Amount", "Status"]} caption="Payments">
            {rows.map((r) => (
              <tr key={r.id}>
                <td className="font-mono">{r.id}</td>
                <td className="font-mono font-bold">{r.booking}</td>
                <td>{r.provider === "demo" ? "demo (no charge)" : r.provider}</td>
                <td className="font-semibold">{gbp(r.amount)}</td>
                <td><StatusBadge status={r.status} /></td>
              </tr>
            ))}
          </DataTable>
        )}
      </div>
      {refunds.length > 0 && (
        <div className="mt-4 border border-border bg-white px-5 py-3" style={{ borderRadius: 10 }}>
          <h2 className="font-display text-xl">Refunds</h2>
          <DataTable headers={["Booking", "Amount", "Reason"]} caption="Refunds">
            {refunds.map((r, i) => <tr key={i}><td className="font-mono font-bold">{r.booking}</td><td className="font-semibold">{gbp(r.amount)}</td><td>{r.reason}</td></tr>)}
          </DataTable>
        </div>
      )}
    </div>
  );
}
