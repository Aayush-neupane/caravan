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

  async function lookup(e?: React.FormEvent) {
    e?.preventDefault();
    if (!ref.trim() || (!em.trim() && !ph.trim() && !nm.trim())) {
      setError("Enter your booking reference plus your email, phone or name.");
      return;
    }
    setLoading(true); setError(null); setTicket(null);
    try {
      const q = new URLSearchParams({ reference: ref.trim() });
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
      <form onSubmit={lookup} className="grid gap-3 border border-border bg-white p-5 sm:grid-cols-2 lg:grid-cols-4" style={{ borderRadius: 10 }}>
        <div className="lg:col-span-1"><label className="field-label" htmlFor="a-ref">Booking reference *</label><input id="a-ref" className="field-input font-mono uppercase" value={ref} onChange={(e) => setRef(e.target.value.toUpperCase())} placeholder="HM-XXXXXX" maxLength={24} /></div>
        <div><label className="field-label" htmlFor="a-email">Email</label><input id="a-email" type="email" className="field-input" value={em} onChange={(e) => setEm(e.target.value)} placeholder="you@example.com" /></div>
        <div><label className="field-label" htmlFor="a-phone">Phone</label><input id="a-phone" className="field-input" value={ph} onChange={(e) => setPh(e.target.value)} placeholder="+44…" autoComplete="tel" /></div>
        <div><label className="field-label" htmlFor="a-name">Full name</label><input id="a-name" className="field-input" value={nm} onChange={(e) => setNm(e.target.value)} placeholder="As on the booking" autoComplete="name" /></div>
        <div className="flex items-end sm:col-span-2 lg:col-span-4"><button className="btn-primary w-full sm:w-auto sm:px-8" disabled={loading}>{loading ? "Looking up…" : "Find my reservation"}</button></div>
      </form>
      <p className="mt-2 text-[0.8rem] text-muted">Reference plus any one of email, phone or name.</p>
      {error && <p role="alert" className="field-error mt-3">{error}</p>}
      {ticket && (
        <div className="mt-6">
          <VoucherTicket ticket={ticket} />
        </div>
      )}
    </div>
  );
}
