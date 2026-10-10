"use client";

import { useState } from "react";
import { VoucherTicket, type TicketData } from "@/components/booking/VoucherTicket";

export function AccountView({ email, reference }: { email?: string; reference?: string }) {
  const [em, setEm] = useState(email ?? "");
  const [ph, setPh] = useState("");
  const [nm, setNm] = useState("");
  const [ref, setRef] = useState(reference ?? "");
  const [ticket, setTicket] = useState<TicketData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [cancelReason, setCancelReason] = useState("");
  const [cancelling, setCancelling] = useState(false);
  const [cancelDone, setCancelDone] = useState<string | null>(null);
  const [paying, setPaying] = useState(false);
  const [payDone, setPayDone] = useState<string | null>(null);

  async function lookup(e?: React.FormEvent) {
    e?.preventDefault();
    if (!ref.trim() || (!em.trim() && !ph.trim() && !nm.trim())) {
      setError("Enter your booking reference plus your email, phone or name.");
      return;
    }
    setLoading(true); setError(null); setTicket(null);
    try {
      // Normalise the reference on submit only — uppercasing on every
      // keystroke makes editing mid-reference impossible.
      const reference = ref.trim().toUpperCase();
      setRef(reference);
      const q = new URLSearchParams({ reference });
      if (em.trim()) q.set("email", em.trim());
      if (ph.trim()) q.set("phone", ph.trim());
      if (nm.trim()) q.set("name", nm.trim());
      const r = await fetch(`/api/bookings?${q.toString()}`);
      const j = await r.json();
      if (!r.ok) throw new Error(j.error ?? "Lookup failed");
      if (j.bookings.length === 0) {
        setError("No reservation matches those details. Check the reference on your voucher.");
        return;
      }
      const b = j.bookings[0];
      setTicket({
        reference: b.reference, guestName: b.guestName ?? null, caravan: b.caravan,
        pickup: b.pickup, ret: b.return,
        totalPence: b.totalPence, depositDuePence: b.depositDuePence, status: b.status,
      });
    } catch (err) { setError(err instanceof Error ? err.message : "Lookup failed"); } finally { setLoading(false); }
  }

  return (
    <div className="mt-6">
      <form onSubmit={lookup} className="grid gap-3 rounded-lg border border-border bg-white p-5 sm:grid-cols-2 lg:grid-cols-4">
        <div className="lg:col-span-1"><label className="field-label" htmlFor="a-ref">Booking reference *</label><input id="a-ref" name="reference" className="field-input font-mono uppercase" value={ref} onChange={(e) => setRef(e.target.value)} placeholder="WW-XXXXXX…" maxLength={24} autoCapitalize="characters" spellCheck={false} /></div>
        <div><label className="field-label" htmlFor="a-email">Email</label><input id="a-email" name="email" type="email" className="field-input" value={em} onChange={(e) => setEm(e.target.value)} placeholder="you@example.com…" autoComplete="email" spellCheck={false} /></div>
        <div><label className="field-label" htmlFor="a-phone">Phone</label><input id="a-phone" name="phone" type="tel" inputMode="tel" className="field-input" value={ph} onChange={(e) => setPh(e.target.value)} placeholder="+61…" autoComplete="tel" /></div>
        <div><label className="field-label" htmlFor="a-name">Full name</label><input id="a-name" name="name" className="field-input" value={nm} onChange={(e) => setNm(e.target.value)} placeholder="As on the booking…" autoComplete="name" /></div>
        <div className="flex items-end sm:col-span-2 lg:col-span-4"><button className="btn-primary w-full sm:w-auto sm:px-8" disabled={loading}>{loading ? "Looking up…" : "Find my reservation"}</button></div>
      </form>
      <p className="mt-2 text-[0.8rem] text-muted">Reference plus any one of email, phone or name.</p>
      {error && <p role="alert" className="field-error mt-3">{error}</p>}
      {ticket && (
        <div className="mt-6 space-y-4">
          <VoucherTicket ticket={ticket} />
          {cancelDone && <p role="status" className="rounded-lg border border-success/40 bg-white p-4 text-[0.9rem] font-medium text-success">{cancelDone}</p>}
          {payDone && <p role="status" className="rounded-lg border border-border bg-white p-4 text-[0.9rem]">{payDone}</p>}
          {!cancelDone && ["held", "awaiting_payment", "awaiting_documents", "payment_review", "confirmed", "ready"].includes(ticket.status ?? "") && (
            <div className="grid gap-4 rounded-lg border border-border bg-white p-5 md:grid-cols-2">
              <div>
                <h2 className="font-display text-xl">Pay online</h2>
                <p className="mt-1 text-[0.85rem] text-muted">Settle the deposit now; the balance is due at Brunswick Depot. Nothing is charged until your provider confirms.</p>
                <button
                  type="button"
                  disabled={paying}
                  className="btn-secondary mt-3"
                  onClick={async () => {
                    setPaying(true); setError(null); setPayDone(null);
                    try {
                      const key = typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`;
                      const r = await fetch("/api/payments", {
                        method: "POST",
                        headers: { "content-type": "application/json" },
                        body: JSON.stringify({ reference: ticket.reference, email: em.trim(), amountPence: ticket.depositDuePence, idempotencyKey: key }),
                      });
                      const j = await r.json();
                      if (!r.ok) throw new Error(j.error ?? "Payment failed");
                      setPayDone(j.demo ? "Deposit recorded in demo mode — show this reference at the depot counter to complete payment." : "Payment intent created — follow your provider to complete payment.");
                    } catch (e) { setError(e instanceof Error ? e.message : "Payment failed"); } finally { setPaying(false); }
                  }}
                >
                  {paying ? "Starting…" : "Pay deposit online"}
                </button>
              </div>
              <div>
                <h2 className="font-display text-xl">Cancel reservation</h2>
                <p className="mt-1 text-[0.85rem] text-muted">28+ days full refund · 14–28 days 50% · within 14 days deposit retained.</p>
                <label className="field-label mt-3" htmlFor="a-cancel-reason">Reason (optional)</label>
                <input id="a-cancel-reason" name="cancelReason" className="field-input" value={cancelReason} onChange={(e) => setCancelReason(e.target.value)} placeholder="Plans changed…" maxLength={500} />
                <button
                  type="button"
                  disabled={cancelling}
                  className="mt-3 rounded-md border border-error/50 px-4 py-2 text-[0.85rem] font-semibold text-error hover:bg-error/5 focus-visible:ring-2 focus-visible:ring-error"
                  onClick={async () => {
                    if (!window.confirm(`Cancel ${ticket.reference}? This frees your dates immediately.`)) return;
                    setCancelling(true); setError(null);
                    try {
                      const r = await fetch(`/api/bookings/${ticket.reference}/cancel`, {
                        method: "POST",
                        headers: { "content-type": "application/json" },
                        body: JSON.stringify({ email: em.trim() || undefined, phone: ph.trim() || undefined, name: nm.trim() || undefined, reason: cancelReason || undefined }),
                      });
                      const j = await r.json();
                      if (!r.ok) throw new Error(j.error ?? "Cancel failed");
                      setCancelDone(j.refundPence > 0 ? `Cancelled — refund $${(j.refundPence / 100).toFixed(2)} recorded (${j.band}).` : "Cancelled — your dates have been released.");
                      setTicket({ ...ticket, status: j.status });
                    } catch (e) { setError(e instanceof Error ? e.message : "Cancel failed"); } finally { setCancelling(false); }
                  }}
                >
                  {cancelling ? "Cancelling…" : "Cancel this reservation"}
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
