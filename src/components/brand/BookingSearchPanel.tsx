"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

// Solid, editorial booking panel — not a floating glass widget.
// Carries dates/travellers/category into /fleet and /booking via URL.
export function BookingSearchPanel({ compact = false }: { compact?: boolean }) {
  const router = useRouter();
  const today = new Date();
  const iso = (d: Date) => d.toISOString().slice(0, 10);
  const plus = (n: number) => {
    const c = new Date(today);
    c.setDate(c.getDate() + n);
    return iso(c);
  };
  const [pickup, setPickup] = useState(plus(14));
  const [ret, setRet] = useState(plus(18));
  const [travellers, setTravellers] = useState("2");
  const [category, setCategory] = useState("any");
  const [error, setError] = useState<string | null>(null);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!(ret > pickup)) {
      setError("Return date must be after pickup date.");
      return;
    }
    setError(null);
    const q = new URLSearchParams({ pickup, return: ret, travellers, category });
    router.push(`/fleet?${q.toString()}`);
  }

  return (
    <form
      onSubmit={submit}
      className="border border-border bg-white p-5 sm:p-6"
      style={{ borderRadius: 10 }}
      aria-label="Check availability"
    >
      <div className={`grid gap-4 ${compact ? "sm:grid-cols-2" : "sm:grid-cols-2 lg:grid-cols-5"}`}>
        <div>
          <label className="field-label" htmlFor="pickup">Pickup date</label>
          <input id="pickup" className="field-input" type="date" value={pickup} min={plus(2)} onChange={(e) => setPickup(e.target.value)} required />
        </div>
        <div>
          <label className="field-label" htmlFor="ret">Return date</label>
          <input id="ret" className="field-input" type="date" value={ret} min={pickup} onChange={(e) => setRet(e.target.value)} required />
        </div>
        <div>
          <label className="field-label" htmlFor="trav">Travellers</label>
          <select id="trav" className="field-input" value={travellers} onChange={(e) => setTravellers(e.target.value)}>
            <option value="1">1 traveller</option>
            <option value="2">2 travellers</option>
            <option value="3">3 travellers</option>
            <option value="4">4 travellers</option>
            <option value="5">5 travellers</option>
          </select>
        </div>
        <div>
          <label className="field-label" htmlFor="cat">Caravan type</label>
          <select id="cat" className="field-input" value={category} onChange={(e) => setCategory(e.target.value)}>
            <option value="any">Any caravan</option>
            <option value="Compact Tourer">Compact tourer</option>
            <option value="Premium Two-Berth">Premium two-berth</option>
            <option value="Family Four-Berth">Family four-berth</option>
          </select>
        </div>
        <div className="flex items-end">
          <button type="submit" className="btn-primary w-full">Check availability</button>
        </div>
      </div>
      {error ? <p role="alert" className="field-error">{error}</p> : null}
      <p className="mt-3 text-[0.8rem] text-muted">Free date changes within 14 days of collection, subject to availability. No account needed to check.</p>
    </form>
  );
}
