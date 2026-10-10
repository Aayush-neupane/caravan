"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { StatusBadge } from "@/components/admin/ui";

const btn = "btn-secondary !py-1 !px-2.5 !text-[0.75rem]";

export function DocReview({ id, status }: { id: string; status: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [note, setNote] = useState("");
  const [asking, setAsking] = useState<"rejected" | "resubmission_requested" | null>(null);

  async function act(next: string, reviewerNote?: string) {
    setBusy(true); setMsg(null);
    try {
      const r = await fetch(`/api/admin/documents/${id}`, {
        method: "PATCH", headers: { "content-type": "application/json" },
        body: JSON.stringify({ status: next, ...(reviewerNote ? { reviewerNote } : {}) }),
      });
      const j = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(j.error ?? "Review failed");
      setAsking(null); setNote(""); router.refresh();
    } catch (e) { setMsg(e instanceof Error ? e.message : "Review failed"); } finally { setBusy(false); }
  }

  const terminal = status === "approved";
  return (
    <span className="inline-flex flex-wrap items-center gap-1.5">
      <StatusBadge status={status} />
      {!terminal && (
        <>
          <button type="button" disabled={busy} onClick={() => act("approved")} className={`${btn} !text-success`}>Approve</button>
          <button type="button" disabled={busy} onClick={() => setAsking("rejected")} className={`${btn} !text-error`}>Reject</button>
          <button type="button" disabled={busy} onClick={() => setAsking("resubmission_requested")} className={btn}>Ask again</button>
        </>
      )}
      {asking && (
        <span className="flex w-full items-center gap-1.5 pt-1">
          <input
            aria-label="Reason for customer"
            className="field-input !py-1 !text-[0.8rem]"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder={asking === "rejected" ? "Reason (shown to customer)" : "What to resubmit"}
            maxLength={500}
          />
          <button type="button" disabled={busy || note.trim().length < 5} onClick={() => act(asking, note)} className={btn}>Send</button>
          <button type="button" disabled={busy} onClick={() => setAsking(null)} className={btn}>×</button>
        </span>
      )}
      {msg && <span role="alert" className="w-full text-[0.78rem] text-error">{msg}</span>}
    </span>
  );
}
