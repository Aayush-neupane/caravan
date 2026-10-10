"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { DateRangeField } from "@/components/forms/DateRangePicker";
import { Select } from "@/components/forms/Select";
import { gbp, toISODate } from "@/lib/format";

export type WidgetInfo = {
  name: string;
  maxTravellers: number;
  minNights: number;
  maxNights: number;
  securityDepositPence: number;
};

export function CaravanBookingWidget({ slug, initialPickup, initialReturn, info }: { slug: string; initialPickup?: string; initialReturn?: string; info: WidgetInfo }) {
  const c = info;
  const router = useRouter();
  // Local calendar dates: toISOString() is UTC and shifts the day for
  // anyone west of Greenwich.
  const d = (n: number) => { const t = new Date(); t.setDate(t.getDate() + n); return toISODate(t); };
  const [pickup, setPickup] = useState(initialPickup || d(14));
  const [ret, setRet] = useState(initialReturn || d(18));
  const [travellers, setTravellers] = useState("2");
  const [state, setState] = useState<{ loading: boolean; error?: string; quote?: { total: string; nights: number; available: boolean; message?: string } }>({ loading: false });

  async function check() {
    setState({ loading: true });
    try {
      const r = await fetch("/api/quote", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ slug, pickup, return: ret, travellers: Number(travellers), extras: [] }),
      });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error ?? "Availability check failed");
      setState({ loading: false, quote: { total: j.quote ? gbp(j.quote.totalPence) : "", nights: j.quote?.nights ?? 0, available: j.available, message: j.message } });
    } catch (e) {
      setState({ loading: false, error: e instanceof Error ? e.message : "Check failed" });
    }
  }

  function book() {
    router.push(`/booking?slug=${slug}&pickup=${pickup}&return=${ret}&travellers=${travellers}`);
  }

  return (
    <div className="rounded-lg border border-border bg-white p-6" aria-label={`Book ${c.name}`}>
      <p className="tick-label">Check availability</p>
      <div className="mt-4">
        <DateRangeField
          id="w-dates"
          label="Pickup → return"
          pickup={pickup}
          ret={ret}
          slug={slug}
          onChange={(p, r) => { setPickup(p); setRet(r); }}
        />
        <p className="mt-1 text-[0.75rem] text-muted">Struck-through days are already taken.</p>
      </div>
      <div className="mt-3">
        <Select
          id="w-trav"
          label="Travellers"
          value={travellers}
          onChange={setTravellers}
          options={[1, 2, 3, 4, 5].filter((n) => n <= c.maxTravellers).map((n) => ({ value: String(n), label: `${n} traveller${n > 1 ? "s" : ""}` }))}
        />
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
              <p className="text-[0.9rem] text-success">✓ Available for {state.quote.nights} nights — <strong>{state.quote.total}</strong> incl. GST &amp; cleaning</p>
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
