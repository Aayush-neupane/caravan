"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export type MaintRow = { id: string; van: string; cat: string; start: string; end: string; priority: string; assignee: string | null; done: boolean };
export type BlockRow = { id: string; van: string; start: string; end: string; reason: string };

async function send(method: string, url: string, body?: unknown) {
  const r = await fetch(url, { method, headers: { "content-type": "application/json" }, body: body === undefined ? undefined : JSON.stringify(body) });
  const j = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(j.error ?? "Request failed");
}

const input = "field-input !py-1.5 !text-[0.85rem]";
const btn = "btn-secondary !py-1.5 !px-3 !text-[0.8rem]";

function VanSelect({ value, onChange, vans, label }: { value: string; onChange: (v: string) => void; vans: string[]; label: string }) {
  return (
    <select aria-label={label} className={input} value={value} onChange={(e) => onChange(e.target.value)}>
      <option value="">Caravan…</option>
      {vans.map((v) => <option key={v} value={v}>{v}</option>)}
    </select>
  );
}

export function MaintAdd({ vans }: { vans: string[] }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [f, setF] = useState({ van: "", start: "", end: "", cat: "Annual service", desc: "", priority: "normal" });
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => setF({ ...f, [k]: e.target.value });
  async function create() {
    if (!f.van) { setMsg("Choose a caravan."); return; }
    setBusy(true); setMsg(null);
    try {
      await send("POST", "/api/admin/maintenance", {
        caravanSlug: f.van, start: f.start, end: f.end,
        category: f.cat, description: f.desc, priority: f.priority,
      });
      setF({ van: "", start: "", end: "", cat: "Annual service", desc: "", priority: "normal" });
      setOpen(false); router.refresh();
    } catch (e) { setMsg(e instanceof Error ? e.message : "Create failed"); } finally { setBusy(false); }
  }
  if (!open) return <button type="button" onClick={() => setOpen(true)} className={`${btn} mt-3`}>+ Service window</button>;
  return (
    <div className="mt-3 grid gap-2 border border-dashed border-border p-3 sm:grid-cols-4" style={{ borderRadius: 8 }}>
      <VanSelect value={f.van} onChange={(v) => setF({ ...f, van: v })} vans={vans} label="Caravan" />
      <input aria-label="Start date" type="date" className={`${input} font-mono`} value={f.start} onChange={set("start")} />
      <input aria-label="End date" type="date" className={`${input} font-mono`} value={f.end} onChange={set("end")} />
      <input aria-label="Category" className={input} value={f.cat} onChange={set("cat")} maxLength={60} />
      <input aria-label="Description" className={`${input} sm:col-span-2`} value={f.desc} onChange={set("desc")} placeholder="What and why" maxLength={500} />
      <select aria-label="Priority" className={input} value={f.priority} onChange={set("priority")}>
        <option value="low">low</option>
        <option value="normal">normal</option>
        <option value="high">high</option>
      </select>
      <div className="flex gap-2">
        <button type="button" disabled={busy} onClick={create} className="btn-primary !py-1.5 !px-3 !text-[0.8rem]">{busy ? "…" : "Create"}</button>
        <button type="button" onClick={() => setOpen(false)} className={btn}>Cancel</button>
      </div>
      {msg && <p role="alert" className="text-[0.8rem] text-error sm:col-span-4">{msg}</p>}
    </div>
  );
}

export function MaintRow({ row }: { row: MaintRow }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  async function flip() {
    setBusy(true); setMsg(null);
    try {
      await send("PATCH", `/api/admin/maintenance/${row.id}`, { done: !row.done });
      router.refresh();
    } catch (e) { setMsg(e instanceof Error ? e.message : "Update failed"); } finally { setBusy(false); }
  }
  async function del() {
    if (!confirm(`Remove ${row.cat} ${row.start} → ${row.end}?`)) return;
    setBusy(true); setMsg(null);
    try {
      await send("DELETE", `/api/admin/maintenance/${row.id}`);
      router.refresh();
    } catch (e) { setMsg(e instanceof Error ? e.message : "Delete failed"); } finally { setBusy(false); }
  }
  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 border-b border-border py-2.5">
      <span className="font-semibold">{row.van}</span>
      <span className="text-[0.82rem] text-muted">{row.cat} · {row.start} → {row.end} · {row.priority}{row.assignee ? ` · ${row.assignee}` : ""}</span>
      <span className={`font-mono text-[0.75rem] font-bold uppercase ${row.done ? "text-muted" : "text-warning"}`}>{row.done ? "done" : "open"}</span>
      <span className="ml-auto flex gap-2">
        <button type="button" disabled={busy} onClick={flip} className={btn}>{row.done ? "Reopen" : "Mark done"}</button>
        <button type="button" disabled={busy} onClick={del} className={`${btn} !text-error`}>Delete</button>
      </span>
      {msg && <span role="alert" className="w-full text-[0.8rem] text-error">{msg}</span>}
    </div>
  );
}

export function BlockAdd({ vans }: { vans: string[] }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [f, setF] = useState({ van: "", start: "", end: "", reason: "" });
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement>) => setF({ ...f, [k]: e.target.value });
  async function create() {
    if (!f.van) { setMsg("Choose a caravan."); return; }
    setBusy(true); setMsg(null);
    try {
      await send("POST", "/api/admin/blocks", { caravanSlug: f.van, start: f.start, end: f.end, reason: f.reason });
      setF({ van: "", start: "", end: "", reason: "" });
      setOpen(false); router.refresh();
    } catch (e) { setMsg(e instanceof Error ? e.message : "Create failed"); } finally { setBusy(false); }
  }
  if (!open) return <button type="button" onClick={() => setOpen(true)} className={`${btn} mt-3`}>+ Blackout</button>;
  return (
    <div className="mt-3 grid gap-2 border border-dashed border-border p-3 sm:grid-cols-4" style={{ borderRadius: 8 }}>
      <VanSelect value={f.van} onChange={(v) => setF({ ...f, van: v })} vans={vans} label="Caravan" />
      <input aria-label="Start date" type="date" className={`${input} font-mono`} value={f.start} onChange={set("start")} />
      <input aria-label="End date" type="date" className={`${input} font-mono`} value={f.end} onChange={set("end")} />
      <input aria-label="Reason" className={input} value={f.reason} onChange={set("reason")} placeholder="e.g. Owner hold" maxLength={200} />
      <div className="flex gap-2 sm:col-span-4">
        <button type="button" disabled={busy} onClick={create} className="btn-primary !py-1.5 !px-3 !text-[0.8rem]">{busy ? "…" : "Create"}</button>
        <button type="button" onClick={() => setOpen(false)} className={btn}>Cancel</button>
      </div>
      {msg && <p role="alert" className="text-[0.8rem] text-error sm:col-span-4">{msg}</p>}
    </div>
  );
}

export function BlockRow({ row }: { row: BlockRow }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  async function del() {
    if (!confirm(`Lift blackout ${row.start} → ${row.end}?`)) return;
    setBusy(true); setMsg(null);
    try {
      await send("DELETE", `/api/admin/blocks/${row.id}`);
      router.refresh();
    } catch (e) { setMsg(e instanceof Error ? e.message : "Delete failed"); } finally { setBusy(false); }
  }
  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 border-b border-border py-2.5">
      <span className="font-semibold">{row.van}</span>
      <span className="text-[0.82rem] text-muted">{row.start} → {row.end} · {row.reason}</span>
      <span className="ml-auto"><button type="button" disabled={busy} onClick={del} className={`${btn} !text-error`}>Lift</button></span>
      {msg && <span role="alert" className="w-full text-[0.8rem] text-error">{msg}</span>}
    </div>
  );
}
