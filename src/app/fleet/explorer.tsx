"use client";

import { useMemo, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { CARAVANS } from "@/data/catalogue";
import { FleetCard } from "@/components/fleet/FleetCard";
import { gbp } from "@/lib/format";

export function FleetExplorer({ initial }: { initial: Record<string, string | undefined> }) {
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
    let list = [...CARAVANS];
    if (category !== "any") list = list.filter((c) => c.category === category);
    if (berths !== "any") list = list.filter((c) => String(c.berths) === berths);
    list = list.filter((c) => c.baseNightlyPence / 100 <= Number(maxPrice));
    if (showerOnly) list = list.filter((c) => c.shower);
    if (sort === "price-asc") list.sort((a, b) => a.baseNightlyPence - b.baseNightlyPence);
    if (sort === "price-desc") list.sort((a, b) => b.baseNightlyPence - a.baseNightlyPence);
    if (sort === "berths") list.sort((a, b) => b.berths - a.berths);
    return list;
  }, [berths, category, maxPrice, showerOnly, sort]);

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
        <form className="border border-border bg-white p-5" style={{ borderRadius: 10 }} onSubmit={(e) => e.preventDefault()}>
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-charcoal">Filters {activeCount > 0 && <span className="ml-2 bg-forest px-2 py-0.5 text-[0.75rem] text-white" style={{ borderRadius: 4 }}>{activeCount} active</span>}</h2>
            {activeCount > 0 && <button type="button" onClick={clear} className="text-[0.82rem] font-semibold text-forest underline">Clear all</button>}
          </div>
          <div className="mt-5 space-y-5">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="field-label" htmlFor="f-pickup">Pickup</label>
                <input id="f-pickup" type="date" className="field-input" defaultValue={pickup} onChange={(e) => updateDates(e.target.value, ret)} />
              </div>
              <div>
                <label className="field-label" htmlFor="f-return">Return</label>
                <input id="f-return" type="date" className="field-input" defaultValue={ret} onChange={(e) => updateDates(pickup, e.target.value)} />
              </div>
            </div>
            <div>
              <label className="field-label" htmlFor="f-cat">Category</label>
              <select id="f-cat" className="field-input" value={category} onChange={(e) => setCategory(e.target.value)}>
                <option value="any">Any category</option>
                <option value="Compact Tourer">Compact tourer</option>
                <option value="Premium Two-Berth">Premium two-berth</option>
                <option value="Family Four-Berth">Family four-berth</option>
              </select>
            </div>
            <div>
              <label className="field-label" htmlFor="f-berths">Berths</label>
              <select id="f-berths" className="field-input" value={berths} onChange={(e) => setBerths(e.target.value)}>
                <option value="any">Any</option>
                <option value="2">2 berths</option>
                <option value="4">4 berths</option>
              </select>
            </div>
            <div>
              <label className="field-label" htmlFor="f-price">Max nightly: {gbp(Number(maxPrice) * 100)}</label>
              <input id="f-price" type="range" min={80} max={200} step={5} value={maxPrice} onChange={(e) => setMaxPrice(e.target.value)} className="w-full accent-[#1A2B23]" />
            </div>
            <label className="flex items-center gap-2 text-[0.9rem]">
              <input type="checkbox" checked={showerOnly} onChange={(e) => setShowerOnly(e.target.checked)} className="h-4 w-4 accent-[#1A2B23]" />
              Separate shower required
            </label>
            <div>
              <label className="field-label" htmlFor="f-sort">Sort</label>
              <select id="f-sort" className="field-input" value={sort} onChange={(e) => setSort(e.target.value)}>
                <option value="relevance">Relevance</option>
                <option value="price-asc">Price: low to high</option>
                <option value="price-desc">Price: high to low</option>
                <option value="berths">Berths</option>
              </select>
            </div>
          </div>
        </form>
      </aside>
      <div className="lg:col-span-9">
        <p className="text-[0.9rem] text-muted" role="status">
          {filtered.length} of {CARAVANS.length} caravans
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
