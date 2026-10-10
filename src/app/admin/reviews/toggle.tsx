"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function ReviewToggle({ id, published }: { id: string; published: boolean }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  async function flip() {
    setBusy(true); setMsg(null);
    try {
      const r = await fetch(`/api/admin/reviews/${id}`, {
        method: "PATCH", headers: { "content-type": "application/json" },
        body: JSON.stringify({ published: !published }),
      });
      const j = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(j.error ?? "Update failed");
      router.refresh();
    } catch (e) { setMsg(e instanceof Error ? e.message : "Update failed"); } finally { setBusy(false); }
  }
  return (
    <span className="inline-flex items-center gap-2">
      <span className={`font-mono text-[0.75rem] font-bold uppercase ${published ? "text-success" : "text-muted"}`}>{published ? "live" : "hidden"}</span>
      <button
        type="button" onClick={flip} disabled={busy}
        role="switch" aria-checked={published} aria-label="Published status for review"
        className={`relative h-6 w-11 shrink-0 border border-border transition-colors ${published ? "bg-forest" : "bg-charcoal/20"}`}
        style={{ borderRadius: 999 }}
      >
        <span className={`absolute top-0.5 h-[18px] w-[18px] rounded-full bg-white transition-all ${published ? "left-[22px]" : "left-0.5"}`} aria-hidden="true" />
      </button>
      {msg && <span role="alert" className="text-[0.78rem] text-error">{msg}</span>}
    </span>
  );
}
