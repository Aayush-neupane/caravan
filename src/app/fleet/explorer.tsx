"use client";

import { useMemo, useState } from "react";
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

  const filtered = useMemo(() => {
    let list = [...caravans];
    if (category !== "any") list = list.filter((c) => c.category === category);
    if (berths !== "any") list = list.filter((c) => String(c.berths) === berths);
    list = list.filter((c) => c.baseNightlyPence / 100 <= Number(maxPrice));
    if (showerOnly) list = list.filter((c) => c.shower);
    if (sort === "price-asc") list.sort((a, b) => a.baseNightlyPence - b.baseNightlyPence);
    if (sort === "price-desc") list.sort((a, b) => b.baseNightlyPence - a.baseNightlyPence);
    if (sort === "berths") list.sort((a, b) => b.berths - a.berths);
    return list;
  }, [berths, category, maxPrice, showerOnly, sort, caravans]);

  const activeCount = [berths !== "any", category !== "any", showerOnly, maxPrice !== "200"].filter(Boolean).length;

  function updateDates(p: string, r: string) {
    const q = new URLSearchParams(search.toString());
    if (p) q.set("pickup", p); else q.delete("pickup");
    if (r) q.set("return", r); else q.delete("return");
    router.push(`/fleet?${q.toString()}`);
  }

  function clear() {
    setBerths("any"); setCategory("any"); setMaxPrice("200"); setShowerOnly(false); setSort("relevance");
    router.push("/fleet");
  }

  const travellers = Number(search.get("travellers") ?? initial.travellers ?? 2);

  return (
    <div className="mx-auto grid max-w-wide gap-8 px-5 py-10 sm:px-8 lg:grid-cols-12">
      <aside className="lg:col-span-3" aria-label="Filters">
        <form className="border border-border bg-white p-5 lg:sticky lg:top-24" style={{ borderRadius: 10 }} onSubmit={(e) => e.preventDefault()}>
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-charcoal">Filters {activeCount > 0 && <span className="ml-2 bg-forest px-2 py-0.5 text-[0.75rem] text-white" style={{ borderRadius: 4 }}>{activeCount} active</span>}</h2>
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
            <div>
              <label className="field-label" htmlFor="f-price">Max nightly: {gbp(Number(maxPrice) * 100)}</label>
              <input id="f-price" type="range" min={80} max={200} step={5} value={maxPrice} onChange={(e) => setMaxPrice(e.target.value)} className="w-full accent-[#1A2B23]" aria-valuetext={gbp(Number(maxPrice) * 100)} />
              <div className="flex justify-between text-[0.72rem] text-muted"><span>{gbp(8000)}</span><span>{gbp(20000)}</span></div>
            </div>
            <label className="flex cursor-pointer items-center gap-2.5 text-[0.9rem]">
              <input type="checkbox" checked={showerOnly} onChange={(e) => setShowerOnly(e.target.checked)} className="h-4 w-4 accent-[#1A2B23]" />
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
        <p className="text-[0.9rem] text-muted" role="status">
          {filtered.length} of {caravans.length} caravans
          {pickup && ret ? ` · ${pickup} → ${ret}` : " · choose dates to check availability"}
          {Number.isFinite(travellers) && travellers > 0 ? ` · ${travellers} travellers` : ""}
        </p>
        {filtered.length === 0 ? (
          <div className="mt-6 border border-border bg-white p-8 text-center" style={{ borderRadius: 10 }}>
            <h2 className="font-display text-2xl">No caravans match those filters.</h2>
            <p className="mt-2 text-muted">Try widening the nightly range or clearing the category filter.</p>
            <button type="button" onClick={clear} className="btn-secondary mt-5">Clear all filters</button>
          </div>
        ) : (
          <div className="mt-5 grid gap-6 md:grid-cols-2">
            {filtered.map((c) => (
              <FleetCard key={c.slug} caravan={c} pickup={pickup || undefined} ret={ret || undefined} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
