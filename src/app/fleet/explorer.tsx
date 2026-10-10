"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { CARAVANS, type CatalogueCaravan } from "@/data/catalogue";
import { FleetCard } from "@/components/fleet/FleetCard";
import { DateRangeField } from "@/components/forms/DateRangePicker";
import { Select } from "@/components/forms/Select";
import { gbp } from "@/lib/format";

export function FleetExplorer({ initial, caravans = CARAVANS }: { initial: Record<string, string | undefined>; caravans?: CatalogueCaravan[] }) {
  const search = useSearchParams();
  const router = useRouter();
  const pickup = search.get("pickup") ?? initial.pickup ?? "";
  const ret = search.get("return") ?? initial.return ?? "";
  const [berths, setBerths] = useState(search.get("berths") ?? "any");
  const [category, setCategory] = useState(search.get("category") ?? initial.category ?? "any");
  const [maxPrice, setMaxPrice] = useState(search.get("maxPrice") ?? "200");
  const [showerOnly, setShowerOnly] = useState(search.get("shower") === "1");
  const [sort, setSort] = useState("relevance");
  const travellers = search.get("travellers") ?? initial.travellers ?? "any";
  const [availability, setAvailability] = useState<Record<string, boolean> | null>(null);

  // Fleet-wide availability for the chosen dates (server-checked).
  useEffect(() => {
    if (!pickup || !ret || ret <= pickup) {
      setAvailability(null);
      return;
    }
    let live = true;
    fetch(`/api/availability?pickup=${pickup}&return=${ret}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((j) => {
        if (!live || !j?.availability) return;
        const map: Record<string, boolean> = {};
        for (const a of j.availability as { slug: string; available: boolean }[]) map[a.slug] = a.available;
        setAvailability(map);
      })
      .catch(() => {
        if (live) setAvailability(null);
      });
    return () => {
      live = false;
    };
  }, [pickup, ret]);

  const filtered = useMemo(() => {
    let list = [...caravans];
    if (category !== "any") list = list.filter((c) => c.category === category);
    if (berths !== "any") list = list.filter((c) => String(c.berths) === berths);
    list = list.filter((c) => c.baseNightlyPence / 100 <= Number(maxPrice));
    if (showerOnly) list = list.filter((c) => c.shower);
    // Travellers narrow by berth capacity; dates narrow availability, which
    // is checked live per caravan at the booking step.
    if (travellers !== "any") list = list.filter((c) => c.maxTravellers >= Number(travellers));
    if (sort === "price-asc") list.sort((a, b) => a.baseNightlyPence - b.baseNightlyPence);
    if (sort === "price-desc") list.sort((a, b) => b.baseNightlyPence - a.baseNightlyPence);
    if (sort === "berths") list.sort((a, b) => b.berths - a.berths);
    return list;
  }, [berths, category, maxPrice, showerOnly, sort, travellers, caravans]);

  const activeCount = [berths !== "any", category !== "any", showerOnly, maxPrice !== "200", travellers !== "any"].filter(Boolean).length;

  function updateDates(p: string, r: string) {
    const q = new URLSearchParams(search.toString());
    if (p) q.set("pickup", p); else q.delete("pickup");
    if (r) q.set("return", r); else q.delete("return");
    router.push(`/fleet?${q.toString()}`);
  }

  function updateTravellers(v: string) {
    const q = new URLSearchParams(search.toString());
    if (v && v !== "any") q.set("travellers", v); else q.delete("travellers");
    router.push(`/fleet?${q.toString()}`);
  }

  function clear() {
    setBerths("any"); setCategory("any"); setMaxPrice("200"); setShowerOnly(false); setSort("relevance");
    router.push("/fleet");
  }

  return (
    <div className="mx-auto grid max-w-wide gap-8 px-5 py-10 sm:px-8 lg:grid-cols-12">
      <aside className="lg:col-span-3" aria-label="Filters">
        <form className="rounded-lg border border-border bg-white p-5 lg:sticky lg:top-24" onSubmit={(e) => e.preventDefault()}>
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-charcoal">Filters {activeCount > 0 && <span className="ml-2 rounded-sm bg-forest px-2 py-0.5 text-[0.75rem] text-white">{activeCount} active</span>}</h2>
            {activeCount > 0 && <button type="button" onClick={clear} className="text-[0.82rem] font-semibold text-forest underline">Clear all</button>}
          </div>
          <div className="mt-5 space-y-5">
            <DateRangeField
              id="f-dates"
              label="Pickup → return"
              pickup={pickup}
              ret={ret}
              onChange={updateDates}
            />
            <Select
              id="f-cat"
              label="Category"
              value={category}
              onChange={setCategory}
              options={[
                { value: "any", label: "Any category" },
                { value: "Compact Tourer", label: "Compact tourer" },
                { value: "Premium Two-Berth", label: "Premium two-berth" },
                { value: "Family Four-Berth", label: "Family four-berth" },
              ]}
            />
            <Select
              id="f-berths"
              label="Berths"
              value={berths}
              onChange={setBerths}
              options={[
                { value: "any", label: "Any berths" },
                { value: "2", label: "2 berths" },
                { value: "4", label: "4 berths" },
              ]}
            />
            <Select
              id="f-trav"
              label="Travellers"
              value={travellers}
              onChange={updateTravellers}
              options={[
                { value: "any", label: "Any party size" },
                { value: "1", label: "1 traveller" },
                { value: "2", label: "2 travellers" },
                { value: "3", label: "3 travellers" },
                { value: "4", label: "4 travellers" },
                { value: "5", label: "5 travellers" },
              ]}
            />
            <div>
              <label className="field-label" htmlFor="f-price">Max nightly: {gbp(Number(maxPrice) * 100)}</label>
              <input id="f-price" type="range" min={80} max={200} step={5} value={maxPrice} onChange={(e) => setMaxPrice(e.target.value)} className="w-full accent-forest" aria-valuetext={gbp(Number(maxPrice) * 100)} />
              <div className="flex justify-between text-[0.72rem] text-muted"><span>{gbp(8000)}</span><span>{gbp(20000)}</span></div>
            </div>
            <label className="flex cursor-pointer items-center gap-2.5 text-[0.9rem]">
              <input type="checkbox" checked={showerOnly} onChange={(e) => setShowerOnly(e.target.checked)} className="h-4 w-4 accent-forest" />
              Separate shower required
            </label>
            <Select
              id="f-sort"
              label="Sort"
              value={sort}
              onChange={setSort}
              options={[
                { value: "relevance", label: "Relevance" },
                { value: "price-asc", label: "Price: low to high" },
                { value: "price-desc", label: "Price: high to low" },
                { value: "berths", label: "Most berths" },
              ]}
            />
          </div>
        </form>
      </aside>
      <div className="lg:col-span-9">
        <p className="text-[0.9rem] text-muted" role="status" aria-live="polite">
          {filtered.length} of {caravans.length} caravans
          {pickup && ret
            ? availability
              ? ` · ${pickup} → ${ret} · ${Object.values(availability).filter(Boolean).length} available`
              : ` · ${pickup} → ${ret} · checking live availability…`
            : " · choose dates to check availability"}
          {travellers !== "any" ? ` · ${travellers} traveller${travellers === "1" ? "" : "s"}` : ""}
        </p>
        {filtered.length === 0 ? (
          <div className="mt-6 rounded-lg border border-border bg-white p-8 text-center">
            <h2 className="font-display text-2xl">No caravans match those filters.</h2>
            <p className="mt-2 text-muted">Try widening the nightly range or clearing the category filter.</p>
            <button type="button" onClick={clear} className="btn-secondary mt-5">Clear all filters</button>
          </div>
        ) : (
          <div className="mt-5 grid gap-6 md:grid-cols-2">
            {filtered.map((c) => (
              <FleetCard key={c.slug} caravan={c} pickup={pickup || undefined} ret={ret || undefined} available={availability?.[c.slug]} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
