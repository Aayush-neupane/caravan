"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export type FleetRow = {
  name: string; slug: string; tagline: string; description: string;
  berths: number; maxTravellers: number;
  baseNightlyPence: number; weekendNightlyPence: number | null; weeklyDiscountPct: number;
  minNights: number; maxNights: number; cleaningFeePence: number; securityDepositPence: number;
  towRequirement: string; archived: boolean;
};

const input = "field-input !py-1.5 !text-[0.85rem]";
const btn = "btn-secondary !py-1.5 !px-3 !text-[0.8rem]";
const gbpToStr = (p: number | null) => (p == null ? "" : String(p / 100));

export function FleetEdit({ row }: { row: FleetRow }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [f, setF] = useState({
    name: row.name, tagline: row.tagline, description: row.description,
    berths: String(row.berths), maxTravellers: String(row.maxTravellers),
    base: gbpToStr(row.baseNightlyPence), weekend: gbpToStr(row.weekendNightlyPence),
    weeklyPct: String(row.weeklyDiscountPct), minNights: String(row.minNights), maxNights: String(row.maxNights),
    cleaning: gbpToStr(row.cleaningFeePence), deposit: gbpToStr(row.securityDepositPence),
    towRequirement: row.towRequirement, archived: row.archived,
  });
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const v = e.target.type === "checkbox" ? (e.target as HTMLInputElement).checked : e.target.value;
    setF({ ...f, [k]: v });
  };

  async function save() {
    setBusy(true); setMsg(null);
    try {
      const num = (v: string, label: string) => {
        const n = Number(v);
        if (!Number.isFinite(n)) throw new Error(`${label} must be a number.`);
        return n;
      };
      const gbp = (v: string, label: string) => Math.round(num(v, label) * 100);
      const payload: Record<string, unknown> = {
        name: f.name.trim(), tagline: f.tagline.trim(), description: f.description.trim(),
        berths: num(f.berths, "Berths"), maxTravellers: num(f.maxTravellers, "Travellers"),
        baseNightlyPence: gbp(f.base, "Nightly rate"),
        weeklyDiscountPct: num(f.weeklyPct, "Weekly %"),
        minNights: num(f.minNights, "Min nights"), maxNights: num(f.maxNights, "Max nights"),
        cleaningFeePence: gbp(f.cleaning, "Cleaning fee"), securityDepositPence: gbp(f.deposit, "Deposit"),
        towRequirement: f.towRequirement.trim(), archived: f.archived,
      };
      payload.weekendNightlyPence = f.weekend.trim() === "" ? null : gbp(f.weekend, "Weekend rate");
      const r = await fetch(`/api/admin/fleet/${row.slug}`, {
        method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify(payload),
      });
      const j = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(j.error ?? "Save failed");
      setOpen(false); router.refresh();
    } catch (e) { setMsg(e instanceof Error ? e.message : "Save failed"); } finally { setBusy(false); }
  }

  if (!open) {
    return <button type="button" onClick={() => setOpen(true)} className={btn}>Edit</button>;
  }
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-label={`Edit ${row.name}`}>
      <div className="absolute inset-0 bg-charcoal/60" onClick={() => !busy && setOpen(false)} aria-hidden="true" />
      <div className="relative max-h-[90vh] w-full max-w-2xl overflow-y-auto border border-border bg-white p-5" style={{ borderRadius: 10 }}>
        <div className="mb-3 flex items-baseline justify-between gap-3">
          <h3 className="font-display text-2xl">Edit {row.name}</h3>
          <button type="button" disabled={busy} onClick={() => setOpen(false)} className={btn} aria-label="Close editor">✕</button>
        </div>
        <div className="grid gap-2 sm:grid-cols-4">
      <label className="sm:col-span-2">Name<input aria-label="Name" className={input} value={f.name} onChange={set("name")} maxLength={60} /></label>
      <label className="sm:col-span-2">Tagline<input aria-label="Tagline" className={input} value={f.tagline} onChange={set("tagline")} maxLength={140} /></label>
      <label className="sm:col-span-4">Description<textarea aria-label="Description" className={input} value={f.description} onChange={set("description")} rows={3} maxLength={2000} /></label>
      <label>Berths<input aria-label="Berths" className={input} value={f.berths} onChange={set("berths")} inputMode="numeric" /></label>
      <label>Max travellers<input aria-label="Max travellers" className={input} value={f.maxTravellers} onChange={set("maxTravellers")} inputMode="numeric" /></label>
      <label>Nightly £<input aria-label="Nightly rate in pounds" className={`${input} font-mono`} value={f.base} onChange={set("base")} inputMode="decimal" /></label>
      <label>Weekend £ (blank = base)<input aria-label="Weekend rate in pounds" className={`${input} font-mono`} value={f.weekend} onChange={set("weekend")} inputMode="decimal" placeholder="—" /></label>
      <label>Weekly %<input aria-label="Weekly discount percent" className={input} value={f.weeklyPct} onChange={set("weeklyPct")} inputMode="numeric" /></label>
      <label>Min nights<input aria-label="Min nights" className={input} value={f.minNights} onChange={set("minNights")} inputMode="numeric" /></label>
      <label>Max nights<input aria-label="Max nights" className={input} value={f.maxNights} onChange={set("maxNights")} inputMode="numeric" /></label>
      <label>Cleaning £<input aria-label="Cleaning fee in pounds" className={`${input} font-mono`} value={f.cleaning} onChange={set("cleaning")} inputMode="decimal" /></label>
      <label>Deposit £<input aria-label="Security deposit in pounds" className={`${input} font-mono`} value={f.deposit} onChange={set("deposit")} inputMode="decimal" /></label>
      <label className="sm:col-span-3">Tow requirement<input aria-label="Tow requirement" className={input} value={f.towRequirement} onChange={set("towRequirement")} maxLength={500} /></label>
      <label className="flex items-center gap-2 text-[0.85rem]">Archived (hide everywhere)<input type="checkbox" checked={f.archived} onChange={set("archived")} className="h-4 w-4 accent-[#1A2B23]" /></label>
      <div className="flex gap-2 sm:col-span-4">
        <button type="button" disabled={busy} onClick={save} className="btn-primary !py-1.5 !px-4 !text-[0.82rem]">{busy ? "Saving…" : "Save changes"}</button>
        <button type="button" disabled={busy} onClick={() => setOpen(false)} className={btn}>Cancel</button>
      </div>
      {msg && <p role="alert" className="text-[0.82rem] text-error sm:col-span-4">{msg}</p>}
      <p className="text-[0.78rem] text-muted sm:col-span-4">Rates, limits and publish state reach the public fleet, booking flow and checkout within about a minute.</p>
        </div>
      </div>
    </div>
  );
}
