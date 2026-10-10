"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { DateRangeField } from "@/components/forms/DateRangePicker";
import { Select } from "@/components/forms/Select";

// Solid, editorial booking panel — not a floating glass widget.
// Carries dates/travellers/category into /fleet and /booking via URL.
export function BookingSearchPanel({ compact = false }: { compact?: boolean }) {
  const router = useRouter();
  const plus = (n: number) => {
    const t = new Date();
    t.setDate(t.getDate() + n);
    return t.toISOString().slice(0, 10);
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
      className="rounded-lg border border-border bg-white p-5 sm:p-6"
      aria-label="Check availability"
    >
      <div className={`grid gap-4 ${compact ? "sm:grid-cols-2" : "sm:grid-cols-2 lg:grid-cols-12"}`}>
        <div className={compact ? "" : "lg:col-span-5"}>
          <DateRangeField
            id="hero-dates"
            label="Pickup → return"
            pickup={pickup}
            ret={ret}
            onChange={(p, r) => { setPickup(p); setRet(r); }}
          />
        </div>
        <div className={compact ? "" : "lg:col-span-3"}>
          <Select
            id="hero-trav"
            label="Travellers"
            value={travellers}
            onChange={setTravellers}
            options={[
              { value: "1", label: "1 traveller" },
              { value: "2", label: "2 travellers" },
              { value: "3", label: "3 travellers" },
              { value: "4", label: "4 travellers" },
              { value: "5", label: "5 travellers" },
            ]}
          />
        </div>
        <div className={compact ? "" : "lg:col-span-4"}>
          <Select
            id="hero-cat"
            label="Caravan type"
            value={category}
            onChange={setCategory}
            options={[
              { value: "any", label: "Any caravan" },
              { value: "Compact Tourer", label: "Compact tourer", hint: "sleeps 2" },
              { value: "Premium Two-Berth", label: "Premium two-berth", hint: "sleeps 2" },
              { value: "Family Four-Berth", label: "Family four-berth", hint: "sleeps 4" },
            ]}
          />
        </div>
      </div>
      <button type="submit" className="btn-primary mt-4 w-full !py-3.5 !text-base">
        Check availability
        <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true"><path d="M2 8h11M9 3.5L13.5 8 9 12.5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" /></svg>
      </button>
      {error ? <p role="alert" className="field-error">{error}</p> : null}
      <p className="mt-3 text-[0.8rem] text-muted">Free date changes within 14 days of collection, subject to availability. No account needed to check.</p>
    </form>
  );
}
