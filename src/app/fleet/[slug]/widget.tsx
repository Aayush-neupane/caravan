"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CARAVANS } from "@/data/catalogue";
import { gbp } from "@/lib/format";

export function CaravanBookingWidget({ slug, initialPickup, initialReturn }: { slug: string; initialPickup?: string; initialReturn?: string }) {
  const c = CARAVANS.find((x) => x.slug === slug)!;
  const router = useRouter();
  const d = (n: number) => { const t = new Date(); t.setDate(t.getDate() + n); return t.toISOString().slice(0, 10); };
  const [pickup, setPickup] = useState(initialPickup || d(14));
  const [ret, setRet] = useState(initialReturn || d(18));
  const [travellers, setTravellers] = useState(2);
  const [state, setState] = useState<{ loading: boolean; error?: string; quote?: { total: string; nights: number; available: boolean; message?: string } }>({ loading: false });

  async function check() {
    setState({ loading: true });
    try {
      const r = await fetch("/api/quote", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ slug, pickup, return: ret, travellers, extras: [] }),
      });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error ?? "Availability check failed");
      setState({ loading: false, quote: { total: gbp(j.quote.totalPence), nights: j.quote.nights, available: j.available, message: j.message } });
    } catch (e) {
      setState({ loading: false, error: e instanceof Error ? e.message : "Check failed" });
    }
  }

  function book() {
    router.push(`/booking?slug=${slug}&pickup=${pickup}&return=${ret}&travellers=${travellers}`);
  }

  return (
    <div className="border border-border bg-white p-6" style={{ borderRadius: 10 }} aria-label={`Book ${c.name}`}>
      <p className="tick-label">Check availability</p>
      <div className="mt-4 grid grid-cols-2 gap-3">
        <div><label className="field-label" htmlFor="w-pickup">Pickup</label><input id="w-pickup" type="date" className="field-input" value={pickup} onChange={(e) => setPickup(e.target.value)} /></div>
        <div><label className="field-label" htmlFor="w-return">Return</label><input id="w-return" type="date" className="field-input" value={ret} onChange={(e) => setRet(e.target.value)} /></div>
      </div>
      <div className="mt-3">
        <label className="field-label" htmlFor="w-trav">Travellers</label>
        <select id="w-trav" className="field-input" value={travellers} onChange={(e) => setTravellers(Number(e.target.value))}>
          {[1, 2, 3, 4, 5].filter((n) => n <= c.maxTravellers).map((n) => <option key={n} value={n}>{n} traveller{n > 1 ? "s" : ""}</option>)}
        </select>
        <p className="field-hint">Min {c.minNights} nights · max {c.maxNights} · collection Mon–Sat.</p>
      </div>
      <button type="button" onClick={check} disabled={state.loading} className="btn-secondary mt-4 w-full">
        {state.loading ? "Checking…" : "Check availability & price"}
      </button>
      {state.error && <p role="alert" className="field-error">{state.error}</p>}
      {state.quote && (
        <div className="mt-4 border-t border-border pt-4" role="status">
          {state.quote.available ? (
            <>
              <p className="text-[0.9rem] text-success">✓ Available for {state.quote.nights} nights — <strong>{state.quote.total}</strong> incl. VAT &amp; cleaning</p>
              <button type="button" onClick={book} className="btn-primary mt-3 w-full">Continue to booking</button>
              <p className="mt-2 text-[0.8rem] text-muted">Refundable deposit {gbp(c.securityDepositPence)} due with balance. Itemised estimate on next step.</p>
            </>
          ) : (
            <p className="text-[0.9rem] text-error">{state.quote.message ?? "Those dates are not available. Try another range."}</p>
          )}
        </div>
      )}
    </div>
  );
}
