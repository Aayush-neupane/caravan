"use client";

import { useState } from "react";
import { gbp } from "@/lib/format";

type B = { reference: string; caravan: string; pickup: string; return: string; status: string; totalPence: number; depositDuePence: number };

export function AccountView({ email, reference }: { email?: string; reference?: string }) {
  const [em, setEm] = useState(email ?? "");
  const [ref, setRef] = useState(reference ?? "");
  const [list, setList] = useState<B[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function lookup(e?: React.FormEvent) {
    e?.preventDefault();
    setLoading(true); setError(null);
    try {
      const q = new URLSearchParams();
      if (em) q.set("email", em);
      if (ref) q.set("reference", ref);
      const r = await fetch(`/api/bookings?${q.toString()}`);
      const j = await r.json();
      if (!r.ok) throw new Error(j.error ?? "Lookup failed");
      setList(j.bookings);
      if (j.bookings.length === 0) setError("No reservation found for those details. Check the email and reference on your voucher.");
    } catch (err) { setError(err instanceof Error ? err.message : "Lookup failed"); } finally { setLoading(false); }
  }

  return (
    <div className="mt-6">
      <form onSubmit={lookup} className="grid gap-3 border border-border bg-white p-5 sm:grid-cols-3" style={{ borderRadius: 10 }}>
        <div><label className="field-label" htmlFor="a-email">Email</label><input id="a-email" className="field-input" value={em} onChange={(e) => setEm(e.target.value)} placeholder="you@example.com" /></div>
        <div><label className="field-label" htmlFor="a-ref">Booking reference</label><input id="a-ref" className="field-input" value={ref} onChange={(e) => setRef(e.target.value)} placeholder="HM-XXXXXX" /></div>
        <div className="flex items-end"><button className="btn-primary w-full" disabled={loading}>{loading ? "Looking up…" : "Find my reservation"}</button></div>
      </form>
      {error && <p role="alert" className="field-error mt-3">{error}</p>}
      {list && list.length > 0 && (
        <div className="mt-6 space-y-4">
          {list.map((b) => (
            <article key={b.reference} className="border border-border bg-white p-5" style={{ borderRadius: 10 }}>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h2 className="font-display text-2xl">{b.caravan} · {b.reference}</h2>
                <span className="border border-border px-2.5 py-1 text-[0.78rem] font-bold uppercase tracking-wide" style={{ borderRadius: 4 }}>{b.status.replace(/_/g, " ")}</span>
              </div>
              <p className="mt-1 text-[0.9rem] text-muted">{new Date(b.pickup).toISOString().slice(0, 10)} → {new Date(b.return).toISOString().slice(0, 10)} · Total {gbp(b.totalPence)} · Deposit {gbp(b.depositDuePence)} due at the depot</p>
              <div className="mt-3 grid gap-2 text-[0.88rem] sm:grid-cols-2">
                <p className="border-t border-border pt-2"><strong>Next action:</strong> {b.status === "held" ? "Bring this voucher reference plus your driving licence and tow-car documents to the depot counter." : b.status === "active" ? "You have the keys — travel well, and see return notes below." : b.status === "cancelled" ? "This reservation was declined or cancelled — call the depot with questions." : "No action needed — contact us with questions."}</p>
                <p className="border-t border-border pt-2"><strong>Collection:</strong> Lansdown Depot, Bath · Mon–Sat 09:00–16:00 · arrive 15 minutes early.</p>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
