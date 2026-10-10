import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { gbp } from "@/lib/format";
import { BookingActions } from "./actions";

export const metadata = { title: "Booking detail", robots: { index: false, follow: false } };

export default async function BookingDetail({ params }: { params: { id: string } }) {
  let b: Awaited<ReturnType<typeof prisma.booking.findUnique>> & { caravan?: { name: string }; payments?: { id: string; amountPence: number; status: string; provider: string }[]; documents?: { id: string; kind: string; fileName: string; status: string }[]; statusHistory?: { id: string; from: string | null; to: string; actor: string | null; createdAt: Date }[]; refunds?: { id: string; amountPence: number; reason: string; status: string }[]; driver?: { fullName: string } | null; towVehicle?: { make: string; model: string } | null } | null = null;
  try {
    b = await prisma.booking.findUnique({
      where: { id: params.id },
      include: { caravan: true, payments: true, documents: true, statusHistory: { orderBy: { createdAt: "desc" } }, refunds: true, driver: true, towVehicle: true },
    }) as never;
  } catch { /* ignore */ }
  if (!b) notFound();

  let snapshot: Record<string, number> = {};
  try { snapshot = JSON.parse((b as { quoteSnapshot: string }).quoteSnapshot); } catch { /* ignore */ }

  return (
    <div>
      <p className="text-[0.85rem] text-muted"><a href="/admin/bookings" className="underline">Bookings</a> / {(b as { reference: string }).reference}</p>
      <h1 className="mt-1 font-display text-4xl">{(b as { caravan: { name: string } }).caravan.name} · {(b as { reference: string }).reference}</h1>
      <div className="mt-5 grid gap-5 lg:grid-cols-2">
        <div className="border border-border bg-white p-5" style={{ borderRadius: 10 }}>
          <h2 className="font-semibold">Reservation</h2>
          <dl className="mt-2 space-y-1 text-[0.9rem]">
            <div className="flex justify-between"><dt className="text-muted">Guest</dt><dd>{(b as { guestName: string }).guestName} · {(b as { guestEmail: string }).guestEmail}</dd></div>
            <div className="flex justify-between"><dt className="text-muted">Dates</dt><dd>{new Date((b as { pickupDate: Date }).pickupDate).toISOString().slice(0, 10)} → {new Date((b as { returnDate: Date }).returnDate).toISOString().slice(0, 10)}</dd></div>
            <div className="flex justify-between"><dt className="text-muted">Status</dt><dd className="font-bold">{(b as { status: string }).status}</dd></div>
            <div className="flex justify-between"><dt className="text-muted">Total</dt><dd className="font-bold">{gbp((b as { totalPence: number }).totalPence)}</dd></div>
            <div className="flex justify-between"><dt className="text-muted">Deposit due</dt><dd>{gbp((b as { depositDuePence: number }).depositDuePence)}</dd></div>
            <div className="flex justify-between"><dt className="text-muted">Security deposit</dt><dd>{gbp((b as { securityDepositPence: number }).securityDepositPence)} refundable</dd></div>
            <div className="flex justify-between"><dt className="text-muted">Driver</dt><dd>{(b as { driver?: { fullName: string } | null }).driver?.fullName ?? "—"}</dd></div>
            <div className="flex justify-between"><dt className="text-muted">Tow car</dt><dd>{(b as { towVehicle?: { make: string; model: string } | null }).towVehicle ? `${(b as never as { towVehicle: { make: string; model: string } }).towVehicle.make} ${(b as never as { towVehicle: { make: string; model: string } }).towVehicle.model}` : "—"}</dd></div>
          </dl>
          <h2 className="mt-4 font-semibold">Price snapshot (immutable)</h2>
          <pre className="mt-2 overflow-auto bg-paper p-3 text-[0.75rem]" style={{ borderRadius: 6 }}>{JSON.stringify({ rental: snapshot.rentalSubtotalPence, fees: snapshot.feesPence, extras: snapshot.extrasPence, tax: snapshot.taxPence, total: snapshot.totalPence }, null, 2)}</pre>
          <p className="mt-2 text-[0.8rem] text-muted">Confirmed prices never change when future pricing rules change — this snapshot is the contract.</p>
        </div>
        <div className="space-y-5">
          <div className="border border-border bg-white p-5" style={{ borderRadius: 10 }}>
            <h2 className="font-semibold">Payments &amp; refunds</h2>
            <ul className="mt-2 space-y-1 text-[0.88rem]">
              {((b as { payments: { id: string; amountPence: number; status: string; provider: string }[] }).payments ?? []).map((p) => <li key={p.id}>{p.provider} · {gbp(p.amountPence)} · {p.status}</li>)}
              {((b as { refunds?: { id: string; amountPence: number; reason: string }[] }).refunds ?? []).map((r) => <li key={r.id}>refund · {gbp(r.amountPence)} · {r.reason}</li>)}
              {((b as { payments: unknown[] }).payments ?? []).length === 0 && <li className="text-muted">No payments recorded.</li>}
            </ul>
          </div>
          <div className="border border-border bg-white p-5" style={{ borderRadius: 10 }}>
            <h2 className="font-semibold">Documents</h2>
            <ul className="mt-2 space-y-1 text-[0.88rem]">
              {((b as { documents: { id: string; kind: string; fileName: string; status: string }[] }).documents ?? []).map((doc) => <li key={doc.id}>{doc.kind} · {doc.fileName} · <strong>{doc.status}</strong></li>)}
              {((b as { documents: unknown[] }).documents ?? []).length === 0 && <li className="text-muted">No documents uploaded.</li>}
            </ul>
          </div>
          <BookingActions id={(b as { id: string }).id} status={(b as { status: string }).status} />
        </div>
      </div>
      <div className="mt-5 border border-border bg-white p-5" style={{ borderRadius: 10 }}>
        <h2 className="font-semibold">Status history</h2>
        <ul className="mt-2 space-y-1 text-[0.85rem] text-muted">
          {((b as { statusHistory: { id: string; from: string | null; to: string; actor: string | null; createdAt: Date }[] }).statusHistory ?? []).map((h) => <li key={h.id}>{new Date(h.createdAt).toISOString()} · {h.from ?? "—"} → {h.to} · {h.actor ?? "system"}</li>)}
        </ul>
      </div>
    </div>
  );
}
