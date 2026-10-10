"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const KINDS = ["driving_licence", "id", "insurance", "other"];
const btn = "btn-secondary !py-1.5 !px-3 !text-[0.8rem]";

// Depot counter form: nothing is uploaded — staff confirm they have seen
// the physical originals and the record gates handover approval.
export function PhysicalLog() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [f, setF] = useState({ ref: "", kind: "driving_licence", note: "" });

  async function submit() {
    if (f.ref.trim().length < 3) { setMsg("Enter the booking reference from the voucher."); return; }
    setBusy(true); setMsg(null);
    try {
      const r = await fetch("/api/admin/documents", {
        method: "POST", headers: { "content-type": "application/json" },
        body: JSON.stringify({ bookingRef: f.ref, kind: f.kind, ...(f.note.trim() ? { reviewerNote: f.note.trim() } : {}) }),
      });
      const j = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(j.error ?? "Logging failed");
      setF({ ref: "", kind: "driving_licence", note: "" });
      setOpen(false); router.refresh();
    } catch (e) { setMsg(e instanceof Error ? e.message : "Logging failed"); } finally { setBusy(false); }
  }

  if (!open) return <button type="button" onClick={() => setOpen(true)} className={`${btn} mt-3`}>+ Log physical receipt</button>;
  return (
    <div className="mt-3 grid gap-2 border border-dashed border-border p-3 sm:grid-cols-4" style={{ borderRadius: 8 }}>
      <input aria-label="Booking reference" className="field-input !py-1.5 !text-[0.85rem] font-mono uppercase" value={f.ref} onChange={(e) => setF({ ...f, ref: e.target.value.toUpperCase() })} placeholder="WW-XXXXXX…" maxLength={24} />
      <select aria-label="Document kind" className="field-input !py-1.5 !text-[0.85rem]" value={f.kind} onChange={(e) => setF({ ...f, kind: e.target.value })}>
        {KINDS.map((k) => <option key={k} value={k}>{k.replace(/_/g, " ")}</option>)}
      </select>
      <input aria-label="Note (optional)" className="field-input !py-1.5 !text-[0.85rem] sm:col-span-2" value={f.note} onChange={(e) => setF({ ...f, note: e.target.value })} placeholder="Note (optional)" maxLength={500} />
      <div className="flex gap-2 sm:col-span-4">
        <button type="button" disabled={busy} onClick={submit} className="btn-primary !py-1.5 !px-3 !text-[0.8rem]">{busy ? "…" : "Seen + approved"}</button>
        <button type="button" onClick={() => setOpen(false)} className={btn}>Cancel</button>
      </div>
      {msg && <p role="alert" className="text-[0.8rem] text-error sm:col-span-4">{msg}</p>}
    </div>
  );
}
