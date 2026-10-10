"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export type CouponRow = {
  id: string; code: string; kind: string; value: number;
  minTotal: number; maxUses: number | null; used: number;
  expires: string | null; caravan: string | null; active: boolean;
};
export type VoucherRow = { code: string; balance: number; active: boolean };

async function send(method: string, url: string, body?: unknown) {
  const r = await fetch(url, { method, headers: { "content-type": "application/json" }, body: body === undefined ? undefined : JSON.stringify(body) });
  const j = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(j.error ?? "Request failed");
}

const input = "field-input !py-1.5 !text-[0.85rem]";
const btn = "btn-secondary !py-1.5 !px-3 !text-[0.8rem]";

export function CouponCreate() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [f, setF] = useState({ code: "", kind: "percent", value: "10", minTotal: "0", maxUses: "100", expires: "", caravan: "" });
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => setF({ ...f, [k]: e.target.value });
  async function create() {
    setBusy(true); setMsg(null);
    try {
      await send("POST", "/api/admin/coupons", {
        code: f.code, kind: f.kind, value: Number(f.value),
        minTotalPence: Math.round(Number(f.minTotal) * 100),
        maxUses: f.maxUses.trim() === "" ? null : Number(f.maxUses),
        expiresAt: f.expires.trim() === "" ? null : f.expires,
        caravanSlug: f.caravan.trim() === "" ? null : f.caravan.trim(),
        active: true,
      });
      setF({ code: "", kind: "percent", value: "10", minTotal: "0", maxUses: "100", expires: "", caravan: "" });
      setOpen(false); router.refresh();
    } catch (e) { setMsg(e instanceof Error ? e.message : "Create failed"); } finally { setBusy(false); }
  }
  if (!open) return <button type="button" onClick={() => setOpen(true)} className={`${btn} mt-3`}>+ Coupon</button>;
  return (
    <div className="mt-3 grid gap-2 border border-dashed border-border p-3 sm:grid-cols-4" style={{ borderRadius: 8 }}>
      <input aria-label="Code" className={`${input} font-mono uppercase`} value={f.code} onChange={set("code")} placeholder="CODE" maxLength={24} />
      <select aria-label="Kind" className={input} value={f.kind} onChange={set("kind")}>
        <option value="percent">percent (1–60)</option>
        <option value="fixed">fixed (pence)</option>
      </select>
      <input aria-label="Value" className={`${input} font-mono`} value={f.value} onChange={set("value")} inputMode="numeric" placeholder={f.kind === "percent" ? "10" : "5000"} />
      <input aria-label="Min total $" className={`${input} font-mono`} value={f.minTotal} onChange={set("minTotal")} inputMode="decimal" placeholder="Min $" />
      <input aria-label="Max uses (blank = unlimited)" className={`${input} font-mono`} value={f.maxUses} onChange={set("maxUses")} inputMode="numeric" placeholder="Max uses" />
      <input aria-label="Expiry date" className={`${input} font-mono`} type="date" value={f.expires} onChange={set("expires")} />
      <input aria-label="Restricted caravan slug (blank = all)" className={`${input} font-mono`} value={f.caravan} onChange={set("caravan")} placeholder="Caravan slug or blank" maxLength={80} />
      <div className="flex gap-2">
        <button type="button" disabled={busy} onClick={create} className="btn-primary !py-1.5 !px-3 !text-[0.8rem]">{busy ? "…" : "Create"}</button>
        <button type="button" onClick={() => setOpen(false)} className={btn}>Cancel</button>
      </div>
      {msg && <p role="alert" className="text-[0.8rem] text-error sm:col-span-4">{msg}</p>}
    </div>
  );
}

export function CouponRow({ row }: { row: CouponRow }) {
  const router = useRouter();
  const [edit, setEdit] = useState(false);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [f, setF] = useState({
    value: String(row.value), minTotal: String(row.minTotal / 100),
    maxUses: row.maxUses == null ? "" : String(row.maxUses),
    expires: row.expires ?? "", caravan: row.caravan ?? "",
  });
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement>) => setF({ ...f, [k]: e.target.value });

  async function save() {
    setBusy(true); setMsg(null);
    try {
      await send("PATCH", `/api/admin/coupons/${row.id}`, {
        value: Number(f.value), minTotalPence: Math.round(Number(f.minTotal) * 100),
        maxUses: f.maxUses.trim() === "" ? null : Number(f.maxUses),
        expiresAt: f.expires.trim() === "" ? null : f.expires,
        caravanSlug: f.caravan.trim() === "" ? null : f.caravan.trim(),
      });
      setEdit(false); router.refresh();
    } catch (e) { setMsg(e instanceof Error ? e.message : "Save failed"); } finally { setBusy(false); }
  }
  async function flip() {
    setBusy(true); setMsg(null);
    try {
      await send("PATCH", `/api/admin/coupons/${row.id}`, { active: !row.active });
      router.refresh();
    } catch (e) { setMsg(e instanceof Error ? e.message : "Update failed"); } finally { setBusy(false); }
  }
  async function del() {
    if (!confirm(`Delete unused code ${row.code}?`)) return;
    setBusy(true); setMsg(null);
    try {
      await send("DELETE", `/api/admin/coupons/${row.id}`);
      router.refresh();
    } catch (e) { setMsg(e instanceof Error ? e.message : "Delete failed"); } finally { setBusy(false); }
  }

  const val = row.kind === "percent" ? `${row.value}%` : `$${(row.value / 100).toFixed(0)}`;
  if (!edit) {
    return (
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 border-b border-border py-2.5">
        <span className="min-w-24 font-mono font-bold">{row.code}</span>
        <span className="text-[0.82rem] text-muted">{row.kind} {val} · min ${(row.minTotal / 100).toFixed(0)} · {row.used}{row.maxUses != null ? `/${row.maxUses}` : ""} used{row.expires ? ` · ends ${row.expires}` : ""}{row.caravan ? ` · ${row.caravan}` : ""}</span>
        <span className={`font-mono text-[0.75rem] font-bold uppercase ${row.active ? "text-success" : "text-muted"}`}>{row.active ? "live" : "off"}</span>
        <span className="ml-auto flex gap-2">
          <button type="button" disabled={busy} onClick={() => setEdit(true)} className={btn}>Edit</button>
          <button type="button" disabled={busy} onClick={flip} className={btn}>{row.active ? "Disable" : "Enable"}</button>
          <button type="button" disabled={busy || row.used > 0} title={row.used > 0 ? "Spent codes stay for history" : "Delete"} onClick={del} className={`${btn} !text-error disabled:opacity-40`}>Delete</button>
        </span>
        {msg && <span role="alert" className="w-full text-[0.8rem] text-error">{msg}</span>}
      </div>
    );
  }
  return (
    <div className="border-b border-border py-2.5">
      <div className="grid gap-2 sm:grid-cols-6">
        <input aria-label="Value" className={`${input} font-mono`} value={f.value} onChange={set("value")} inputMode="numeric" />
        <input aria-label="Min total $" className={`${input} font-mono`} value={f.minTotal} onChange={set("minTotal")} inputMode="decimal" />
        <input aria-label="Max uses" className={`${input} font-mono`} value={f.maxUses} onChange={set("maxUses")} inputMode="numeric" placeholder="∞" />
        <input aria-label="Expiry" className={`${input} font-mono`} type="date" value={f.expires} onChange={set("expires")} />
        <input aria-label="Caravan slug" className={`${input} font-mono`} value={f.caravan} onChange={set("caravan")} placeholder="slug or blank" />
        <div className="flex gap-2">
          <button type="button" disabled={busy} onClick={save} className="btn-primary !py-1.5 !px-3 !text-[0.8rem]">{busy ? "…" : "Save"}</button>
          <button type="button" disabled={busy} onClick={() => setEdit(false)} className={btn}>Cancel</button>
        </div>
      </div>
      {msg && <p role="alert" className="mt-1 text-[0.8rem] text-error">{msg}</p>}
    </div>
  );
}

export function VoucherRow({ row }: { row: VoucherRow }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  async function flip() {
    setBusy(true); setMsg(null);
    try {
      await send("PATCH", `/api/admin/vouchers/${row.code}`, { active: !row.active });
      router.refresh();
    } catch (e) { setMsg(e instanceof Error ? e.message : "Update failed"); } finally { setBusy(false); }
  }
  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 border-b border-border py-2.5">
      <span className="min-w-24 font-mono font-bold">{row.code}</span>
      <span className="text-[0.82rem] text-muted">${(row.balance / 100).toFixed(2)} remaining</span>
      <span className={`font-mono text-[0.75rem] font-bold uppercase ${row.active ? "text-success" : "text-muted"}`}>{row.active ? "live" : "off"}</span>
      <span className="ml-auto"><button type="button" disabled={busy} onClick={flip} className={btn}>{row.active ? "Disable" : "Enable"}</button></span>
      {msg && <span role="alert" className="w-full text-[0.8rem] text-error">{msg}</span>}
    </div>
  );
}
