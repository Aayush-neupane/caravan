"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export type VoucherRow = {
  code: string;
  balance: number;
  initial: number;
  active: boolean;
  expires: string | null;
};

async function send(method: string, url: string, body?: unknown) {
  const r = await fetch(url, { method, headers: { "content-type": "application/json" }, body: body === undefined ? undefined : JSON.stringify(body) });
  const j = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(j.error ?? "Request failed");
}

const input = "field-input !py-1.5 !text-[0.85rem]";
const btn = "btn-secondary !py-1.5 !px-3 !text-[0.8rem]";

export function VoucherCreate() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [f, setF] = useState({ code: "", value: "250", expires: "" });
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement>) => setF({ ...f, [k]: e.target.value });

  async function create() {
    setBusy(true); setMsg(null);
    try {
      await send("POST", "/api/admin/vouchers", {
        code: f.code.trim().toUpperCase(),
        initialPence: Math.round(Number(f.value) * 100),
        expiresAt: f.expires.trim() === "" ? null : f.expires,
      });
      setF({ code: "", value: "250", expires: "" });
      setOpen(false); router.refresh();
    } catch (e) { setMsg(e instanceof Error ? e.message : "Create failed"); } finally { setBusy(false); }
  }

  if (!open) return <button type="button" onClick={() => setOpen(true)} className={`${btn} mt-3`}>+ Gift voucher</button>;
  return (
    <div className="mt-3 grid gap-2 border border-dashed border-border p-3 sm:grid-cols-4" style={{ borderRadius: 8 }}>
      <input aria-label="Code" className={`${input} font-mono uppercase`} value={f.code} onChange={set("code")} placeholder="GIFT-250" maxLength={32} />
      <input aria-label="Value $" className={`${input} font-mono`} value={f.value} onChange={set("value")} inputMode="decimal" placeholder="250" />
      <input aria-label="Expiry date (optional)" className={`${input} font-mono`} type="date" value={f.expires} onChange={set("expires")} />
      <div className="flex gap-2">
        <button type="button" disabled={busy} onClick={create} className="btn-primary !py-1.5 !px-3 !text-[0.8rem]">{busy ? "…" : "Issue"}</button>
        <button type="button" onClick={() => setOpen(false)} className={btn}>Cancel</button>
      </div>
      {msg && <p role="alert" className="text-[0.8rem] text-error sm:col-span-4">{msg}</p>}
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

  const spent = row.initial - row.balance;
  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 border-b border-border py-2.5">
      <span className="min-w-28 font-mono font-bold">{row.code}</span>
      <span className="text-[0.82rem] text-muted">
        ${(row.balance / 100).toFixed(2)} remaining of ${(row.initial / 100).toFixed(2)}
        {spent > 0 ? ` · $${(spent / 100).toFixed(2)} redeemed` : ""}
        {row.expires ? ` · ends ${row.expires}` : ""}
      </span>
      <span className={`font-mono text-[0.75rem] font-bold uppercase ${row.active ? "text-success" : "text-muted"}`}>{row.active ? "live" : "off"}</span>
      <span className="ml-auto">
        <button type="button" disabled={busy} onClick={flip} className={btn}>{row.active ? "Disable" : "Enable"}</button>
      </span>
      {msg && <span role="alert" className="w-full text-[0.8rem] text-error">{msg}</span>}
    </div>
  );
}
