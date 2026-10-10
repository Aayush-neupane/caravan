"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function BookingActions({ id, status }: { id: string; status: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  async function act(action: string) {
    if (["cancelled"].includes(action) && !confirm(`Confirm: mark booking ${action}? This is recorded in the audit log.`)) return;
    setBusy(true); setMsg(null);
    try {
      const r = await fetch(`/api/admin/bookings/${id}`, { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify({ action }) });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error ?? "Action failed");
      setMsg(`Done: ${action}.`);
      router.refresh();
    } catch (e) { setMsg(e instanceof Error ? e.message : "Action failed"); } finally { setBusy(false); }
  }

  return (
    <div className="border border-border bg-white p-5" style={{ borderRadius: 10 }}>
      <h2 className="font-semibold">Controlled actions <span className="ml-1 text-[0.78rem] font-normal text-muted">(current: {status})</span></h2>
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
