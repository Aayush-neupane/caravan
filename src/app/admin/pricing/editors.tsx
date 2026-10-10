"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export type SeasonRow = { id: string; name: string; start: string; end: string; mult: number; active: boolean };
export type DiscountRow = { id: string; name: string; nights: number; pct: number; active: boolean };

async function send(method: string, url: string, body: unknown): Promise<{ error?: string }> {
  const r = await fetch(url, { method, headers: { "content-type": "application/json" }, body: JSON.stringify(body) });
  const j = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(j.error ?? "Request failed");
  return j;
}

const input = "field-input !py-1.5 !text-[0.85rem]";
const btn = "btn-secondary !py-1.5 !px-3 !text-[0.8rem]";

function Row({ children }: { children: React.ReactNode }) {
  return <div className="flex flex-wrap items-center gap-2 border-b border-border py-2.5">{children}</div>;
}

export function SeasonEditor({ row }: { row: SeasonRow }) {
  const router = useRouter();
  const [edit, setEdit] = useState(false);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [f, setF] = useState({ name: row.name, start: row.start, end: row.end, mult: String(row.mult) });
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement>) => setF({ ...f, [k]: e.target.value });

  async function save() {
    setBusy(true); setMsg(null);
    try {
      await send("PATCH", `/api/admin/pricing/${row.id}`, {
        kind: "seasonal", name: f.name, startMonthDay: f.start, endMonthDay: f.end, multiplierPct: Number(f.mult),
      });
      setEdit(false); router.refresh();
    } catch (e) { setMsg(e instanceof Error ? e.message : "Save failed"); } finally { setBusy(false); }
  }
  async function flip() {
    setBusy(true); setMsg(null);
    try {
      await send("PATCH", `/api/admin/pricing/${row.id}`, { kind: "seasonal", active: !row.active });
      router.refresh();
    } catch (e) { setMsg(e instanceof Error ? e.message : "Update failed"); } finally { setBusy(false); }
  }
  async function del() {
    if (!confirm(`Delete rule “${row.name}”? Quotes fall back to engine defaults for those dates.`)) return;
    setBusy(true); setMsg(null);
    try {
      await send("DELETE", `/api/admin/pricing/${row.id}`, { kind: "seasonal" });
      router.refresh();
    } catch (e) { setMsg(e instanceof Error ? e.message : "Delete failed"); } finally { setBusy(false); }
  }

  if (!edit) {
    return (
      <Row>
        <span className="min-w-52 flex-1 font-semibold">{row.name} <span className="font-mono text-[0.78rem] font-normal text-muted">{row.start} → {row.end}</span></span>
        <span className="font-mono font-bold">×{(row.mult / 100).toFixed(2)}</span>
        <span className={`font-mono text-[0.75rem] font-bold uppercase ${row.active ? "text-success" : "text-muted"}`}>{row.active ? "live" : "off"}</span>
        <button type="button" disabled={busy} onClick={() => setEdit(true)} className={btn}>Edit</button>
        <button type="button" disabled={busy} onClick={flip} className={btn}>{row.active ? "Disable" : "Enable"}</button>
        <button type="button" disabled={busy} onClick={del} className={`${btn} !text-error`}>Delete</button>
        {msg && <span role="alert" className="w-full text-[0.8rem] text-error">{msg}</span>}
      </Row>
    );
  }
  return (
    <div className="border-b border-border py-2.5">
      <div className="grid gap-2 sm:grid-cols-5">
        <input aria-label="Rule name" className={input} value={f.name} onChange={set("name")} maxLength={80} />
        <input aria-label="Start MM-DD" className={`${input} font-mono`} value={f.start} onChange={set("start")} placeholder="06-15" maxLength={5} />
        <input aria-label="End MM-DD" className={`${input} font-mono`} value={f.end} onChange={set("end")} placeholder="09-05" maxLength={5} />
        <input aria-label="Multiplier percent" className={`${input} font-mono`} value={f.mult} onChange={set("mult")} inputMode="numeric" placeholder="120" />
        <div className="flex gap-2">
          <button type="button" disabled={busy} onClick={save} className="btn-primary !py-1.5 !px-3 !text-[0.8rem]">{busy ? "…" : "Save"}</button>
          <button type="button" disabled={busy} onClick={() => setEdit(false)} className={btn}>Cancel</button>
        </div>
      </div>
      {msg && <p role="alert" className="mt-1 text-[0.8rem] text-error">{msg}</p>}
    </div>
  );
}

export function SeasonAdd() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [f, setF] = useState({ name: "", start: "", end: "", mult: "120" });
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement>) => setF({ ...f, [k]: e.target.value });
  async function create() {
    setBusy(true); setMsg(null);
    try {
      await send("POST", "/api/admin/pricing", {
        kind: "seasonal", name: f.name, startMonthDay: f.start, endMonthDay: f.end, multiplierPct: Number(f.mult), active: true,
      });
      setF({ name: "", start: "", end: "", mult: "120" }); setOpen(false); router.refresh();
    } catch (e) { setMsg(e instanceof Error ? e.message : "Create failed"); } finally { setBusy(false); }
  }
  if (!open) return <button type="button" onClick={() => setOpen(true)} className={`${btn} mt-3`}>+ Seasonal rule</button>;
  return (
    <div className="mt-3 grid gap-2 border border-dashed border-border p-3 sm:grid-cols-5" style={{ borderRadius: 8 }}>
      <input aria-label="Rule name" className={input} value={f.name} onChange={set("name")} placeholder="Name" maxLength={80} />
      <input aria-label="Start MM-DD" className={`${input} font-mono`} value={f.start} onChange={set("start")} placeholder="06-15" maxLength={5} />
      <input aria-label="End MM-DD" className={`${input} font-mono`} value={f.end} onChange={set("end")} placeholder="09-05" maxLength={5} />
      <input aria-label="Multiplier percent" className={`${input} font-mono`} value={f.mult} onChange={set("mult")} inputMode="numeric" placeholder="120" />
      <div className="flex gap-2">
        <button type="button" disabled={busy} onClick={create} className="btn-primary !py-1.5 !px-3 !text-[0.8rem]">{busy ? "…" : "Create"}</button>
        <button type="button" onClick={() => setOpen(false)} className={btn}>Cancel</button>
      </div>
      {msg && <p role="alert" className="text-[0.8rem] text-error sm:col-span-5">{msg}</p>}
    </div>
  );
}

export function DiscountEditor({ row }: { row: DiscountRow }) {
  const router = useRouter();
  const [edit, setEdit] = useState(false);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [f, setF] = useState({ name: row.name, nights: String(row.nights), pct: String(row.pct) });
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement>) => setF({ ...f, [k]: e.target.value });

  async function save() {
    setBusy(true); setMsg(null);
    try {
      await send("PATCH", `/api/admin/pricing/${row.id}`, {
        kind: "discount", name: f.name, minNights: Number(f.nights), pct: Number(f.pct),
      });
      setEdit(false); router.refresh();
    } catch (e) { setMsg(e instanceof Error ? e.message : "Save failed"); } finally { setBusy(false); }
  }
  async function flip() {
    setBusy(true); setMsg(null);
    try {
      await send("PATCH", `/api/admin/pricing/${row.id}`, { kind: "discount", active: !row.active });
      router.refresh();
    } catch (e) { setMsg(e instanceof Error ? e.message : "Update failed"); } finally { setBusy(false); }
  }
  async function del() {
    if (!confirm(`Delete rule “${row.name}”?`)) return;
    setBusy(true); setMsg(null);
    try {
      await send("DELETE", `/api/admin/pricing/${row.id}`, { kind: "discount" });
      router.refresh();
    } catch (e) { setMsg(e instanceof Error ? e.message : "Delete failed"); } finally { setBusy(false); }
  }

  if (!edit) {
    return (
      <Row>
        <span className="min-w-52 flex-1 font-semibold">{row.name} <span className="font-mono text-[0.78rem] font-normal text-muted">{row.nights}n+</span></span>
        <span className="font-mono font-bold">{row.pct}%</span>
        <span className={`font-mono text-[0.75rem] font-bold uppercase ${row.active ? "text-success" : "text-muted"}`}>{row.active ? "live" : "off"}</span>
        <button type="button" disabled={busy} onClick={() => setEdit(true)} className={btn}>Edit</button>
        <button type="button" disabled={busy} onClick={flip} className={btn}>{row.active ? "Disable" : "Enable"}</button>
        <button type="button" disabled={busy} onClick={del} className={`${btn} !text-error`}>Delete</button>
        {msg && <span role="alert" className="w-full text-[0.8rem] text-error">{msg}</span>}
      </Row>
    );
  }
  return (
    <div className="border-b border-border py-2.5">
      <div className="grid gap-2 sm:grid-cols-4">
        <input aria-label="Rule name" className={input} value={f.name} onChange={set("name")} maxLength={80} />
        <input aria-label="Min nights" className={`${input} font-mono`} value={f.nights} onChange={set("nights")} inputMode="numeric" />
        <input aria-label="Percent off" className={`${input} font-mono`} value={f.pct} onChange={set("pct")} inputMode="numeric" />
        <div className="flex gap-2">
          <button type="button" disabled={busy} onClick={save} className="btn-primary !py-1.5 !px-3 !text-[0.8rem]">{busy ? "…" : "Save"}</button>
          <button type="button" disabled={busy} onClick={() => setEdit(false)} className={btn}>Cancel</button>
        </div>
      </div>
      {msg && <p role="alert" className="mt-1 text-[0.8rem] text-error">{msg}</p>}
    </div>
  );
}

export function DiscountAdd() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [f, setF] = useState({ name: "", nights: "7", pct: "10" });
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement>) => setF({ ...f, [k]: e.target.value });
  async function create() {
    setBusy(true); setMsg(null);
    try {
      await send("POST", "/api/admin/pricing", {
        kind: "discount", name: f.name, minNights: Number(f.nights), pct: Number(f.pct), active: true,
      });
      setF({ name: "", nights: "7", pct: "10" }); setOpen(false); router.refresh();
    } catch (e) { setMsg(e instanceof Error ? e.message : "Create failed"); } finally { setBusy(false); }
  }
  if (!open) return <button type="button" onClick={() => setOpen(true)} className={`${btn} mt-3`}>+ Discount rule</button>;
  return (
    <div className="mt-3 grid gap-2 border border-dashed border-border p-3 sm:grid-cols-4" style={{ borderRadius: 8 }}>
      <input aria-label="Rule name" className={input} value={f.name} onChange={set("name")} placeholder="Name" maxLength={80} />
      <input aria-label="Min nights" className={`${input} font-mono`} value={f.nights} onChange={set("nights")} inputMode="numeric" />
      <input aria-label="Percent off" className={`${input} font-mono`} value={f.pct} onChange={set("pct")} inputMode="numeric" />
      <div className="flex gap-2">
        <button type="button" disabled={busy} onClick={create} className="btn-primary !py-1.5 !px-3 !text-[0.8rem]">{busy ? "…" : "Create"}</button>
        <button type="button" onClick={() => setOpen(false)} className={btn}>Cancel</button>
      </div>
      {msg && <p role="alert" className="text-[0.8rem] text-error sm:col-span-4">{msg}</p>}
    </div>
  );
}
