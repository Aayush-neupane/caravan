"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const DOC_CHECKLIST = [
  "Driving licence seen (original, in date)",
  "Tow-car documents seen (V5 / insurance)",
  "Licence entitlement + tow match checked",
];

export function BookingActions({ id, status }: { id: string; status: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  async function act(action: string, reason?: string) {
    if (action === "cancelled") {
      const r = reason ?? window.prompt("Reason (recorded on the booking)?", "Documents insufficient at handover");
      if (r === null) return;
      if (r.trim().length < 3) { setMsg("Give a short reason — it is kept on the record."); return; }
      reason = r.trim();
    } else if (!confirm(`Confirm: mark booking ${action}? This is recorded in the audit log.`)) {
      return;
    }
    setBusy(true); setMsg(null);
    try {
      const r = await fetch(`/api/admin/bookings/${id}`, {
        method: "PATCH", headers: { "content-type": "application/json" },
        body: JSON.stringify({ action, ...(reason ? { reason } : {}) }),
      });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error ?? "Action failed");
      setMsg(`Done: ${action}.`);
      router.refresh();
    } catch (e) { setMsg(e instanceof Error ? e.message : "Action failed"); } finally { setBusy(false); }
  }

  return (
    <div className="border border-border bg-white p-5" style={{ borderRadius: 10 }}>
      <h2 className="font-semibold">Controlled actions <span className="ml-1 text-[0.78rem] font-normal text-muted">(current: {status})</span></h2>
      {status === "held" && (
        <div className="mt-3 border border-dashed border-amberDark bg-sand/50 p-4" style={{ borderRadius: 8 }}>
          <p className="font-mono text-[0.68rem] font-bold uppercase tracking-[0.18em] text-amberDark">Depot handover — physical checks</p>
          <ul className="mt-2 space-y-1 text-[0.87rem] text-charcoal/85">
            {DOC_CHECKLIST.map((d) => <li key={d}>☐ {d}</li>)}
          </ul>
          <p className="mt-2 text-[0.8rem] text-muted">Log each received document under Documents first — approval needs at least one on record.</p>
          <div className="mt-3 flex flex-wrap gap-2">
            <button disabled={busy} onClick={() => act("active")} className="btn-primary !py-2 !px-4 !text-[0.85rem]">Approve handover → active</button>
            <button disabled={busy} onClick={() => act("cancelled")} className="btn-secondary !py-2 !px-4 !text-[0.85rem] !text-error">Decline → cancelled</button>
          </div>
        </div>
      )}
      <div className="mt-3 flex flex-wrap gap-2">
        {["confirmed", "ready", "active", "completed", "cancelled"].map((a) => (
          <button key={a} disabled={busy} onClick={() => act(a)} className="border border-border bg-paper px-3 py-2 text-[0.83rem] font-semibold hover:border-forest" style={{ borderRadius: 6 }}>{a}</button>
        ))}
        <button disabled={busy} onClick={() => act("refund_deposit")} className="border border-border bg-paper px-3 py-2 text-[0.83rem] font-semibold hover:border-forest" style={{ borderRadius: 6 }}>refund deposit</button>
      </div>
      {msg && <p role="status" className="mt-2 text-[0.85rem] text-muted">{msg}</p>}
      <p className="mt-2 text-[0.78rem] text-muted">Invalid transitions are rejected server-side. Destructive and financial actions require confirmation and are audit-logged.</p>
    </div>
  );
}
