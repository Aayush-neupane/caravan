import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/db";
import { gbp } from "@/lib/format";
import { Panel, StatusBadge } from "@/components/admin/ui";
import { BookingActions } from "./actions";

export const metadata = { title: "Booking detail", robots: { index: false, follow: false } };

export default async function BookingDetail({ params }: { params: { id: string } }) {
  const b = await prisma.booking.findUnique({
    where: { id: params.id },
    include: { caravan: true, payments: true, documents: true, statusHistory: { orderBy: { createdAt: "desc" } }, refunds: true, driver: true, towVehicle: true },
  }).catch(() => null);
  if (!b) notFound();

  let snapshot: Record<string, number | string | null> = {};
  try { snapshot = JSON.parse(b.quoteSnapshot); } catch { /* ignore */ }

  const money: [string, string][] = [
    ["Rental subtotal", gbp(b.subtotalPence)],
    ["Discounts", `−${gbp(b.discountPence)}`],
    ["Fees (cleaning)", gbp(b.feesPence)],
    ["Extras", gbp(b.extrasPence)],
    ["GST", gbp(b.taxPence)],
    ["Total", gbp(b.totalPence)],
    ["Deposit due", gbp(b.depositDuePence)],
    ["Security deposit (refundable)", gbp(b.securityDepositPence)],
  ];

  return (
    <div>
      <p className="text-[0.85rem] text-muted"><Link href="/admin/bookings" className="underline">Bookings</Link> / {b.reference}</p>
      <div className="mt-1 flex flex-wrap items-center gap-3">
        <h1 className="font-display text-4xl text-charcoal sm:text-5xl">{b.caravan.name} · {b.reference}</h1>
        <StatusBadge status={b.status} />
      </div>

      <div className="mt-5 grid gap-4 xl:grid-cols-2">
        <Panel title="Reservation">
          <dl className="grid grid-cols-2 gap-x-4 gap-y-2.5 text-[0.9rem]">
            <div><dt className="tick-label">Guest</dt><dd className="mt-0.5 font-medium">{b.guestName} · {b.guestEmail}</dd></div>
            <div><dt className="tick-label">Phone</dt><dd className="mt-0.5 font-medium">{b.guestPhone ?? "—"}</dd></div>
            <div><dt className="tick-label">Dates</dt><dd className="mt-0.5 font-medium">{b.pickupDate.toISOString().slice(0, 10)} → {b.returnDate.toISOString().slice(0, 10)} · {b.travellers} guests</dd></div>
            <div><dt className="tick-label">Driver / tow car</dt><dd className="mt-0.5 font-medium">{b.driver?.fullName ?? "—"} · {b.towVehicle ? `${b.towVehicle.make} ${b.towVehicle.model}` : "—"}</dd></div>
          </dl>
          <h3 className="mt-5 border-t border-border pt-4 font-semibold">Money</h3>
          <dl className="mt-2 space-y-1 text-[0.9rem]">
            {money.map(([k, v]) => (
              <div key={k} className="flex justify-between"><dt className="text-muted">{k}</dt><dd className="font-medium">{v}</dd></div>
            ))}
          </dl>
          <details className="mt-3 text-[0.8rem]">
            <summary className="cursor-pointer font-semibold text-forest">Immutable price snapshot (contract)</summary>
            <pre className="mt-2 overflow-auto bg-paper p-3" style={{ borderRadius: 6 }}>{JSON.stringify({ rental: snapshot.rentalSubtotalPence, fees: snapshot.feesPence, extras: snapshot.extrasPence, coupon: snapshot.couponCode ?? snapshot.coupon, tax: snapshot.taxPence, total: snapshot.totalPence }, null, 2)}</pre>
          </details>
        </Panel>

        <div className="space-y-4">
          <Panel title="Payments & refunds">
            {b.payments.length === 0 && b.refunds.length === 0 ? (
              <p className="text-[0.88rem] text-muted">No payments recorded.</p>
            ) : (
              <ul className="space-y-2 text-[0.88rem]">
                {b.payments.map((p) => (
                  <li key={p.id} className="flex items-center justify-between gap-2 border-b border-border pb-2">
                    <span><span className="font-mono text-[0.78rem] text-muted">{p.provider}</span> · <strong>{gbp(p.amountPence)}</strong></span>
                    <StatusBadge status={p.status} />
                  </li>
                ))}
                {b.refunds.map((r) => (
                  <li key={r.id} className="flex items-center justify-between gap-2">
                    <span>Refund · <strong>{gbp(r.amountPence)}</strong> · {r.reason}</span>
                    <StatusBadge status={r.status === "recorded" ? "completed" : r.status} />
                  </li>
                ))}
              </ul>
            )}
          </Panel>

          <Panel title="Documents">
            {b.documents.length === 0 ? (
              <p className="text-[0.88rem] text-muted">No documents uploaded.</p>
            ) : (
              <ul className="space-y-2 text-[0.88rem]">
                {b.documents.map((doc) => (
                  <li key={doc.id} className="flex items-center justify-between gap-2 border-b border-border pb-2">
                    <span>{doc.kind} · <span className="font-mono text-[0.78rem]">{doc.fileName}</span></span>
                    <StatusBadge status={doc.status} />
                  </li>
                ))}
              </ul>
            )}
          </Panel>

          <BookingActions id={b.id} status={b.status} />
        </div>
      </div>

      <Panel title="Status history">
        <ol className="relative space-y-0 border-l-2 border-border pl-0">
          {b.statusHistory.map((h) => (
            <li key={h.id} className="relative pb-4 pl-6 last:pb-0">
              <span className="absolute -left-[7px] top-1 h-3 w-3 rounded-full border-2 border-forest bg-paper" aria-hidden="true" />
              <p className="text-[0.88rem]"><strong>{h.from ?? "—"} → {h.to}</strong> <span className="text-muted">· {h.actor ?? "system"} · {new Date(h.createdAt).toISOString().slice(0, 16).replace("T", " ")}</span></p>
            </li>
          ))}
          {b.statusHistory.length === 0 && <li className="pl-6 text-[0.88rem] text-muted">No transitions recorded.</li>}
        </ol>
      </Panel>
    </div>
  );
}
