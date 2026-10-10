"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function PublishButton({ slug, published, future }: { slug: string; published: boolean; future: number }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  async function toggle() {
    const next = !published;
    if (!next && future > 0 && !confirm(`${future} future reservation(s) reference this caravan. Unpublish anyway? History is preserved.`)) return;
    setBusy(true); setMsg(null);
    try {
      const r = await fetch(`/api/admin/fleet/${slug}`, { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify({ published: next }) });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error ?? "Update failed");
      setMsg(next ? "Published." : `Unpublished. ${j.futureBookings} future reservation(s) preserved.`);
      router.refresh();
    } catch (e) { setMsg(e instanceof Error ? e.message : "Update failed"); } finally { setBusy(false); }
  }

  return (
    <span className="inline-flex items-center gap-2">
      <button
        type="button" onClick={toggle} disabled={busy}
        role="switch" aria-checked={published} aria-label={`Published status for ${slug}`}
        className={`relative h-6 w-11 shrink-0 border border-border transition-colors ${published ? "bg-forest" : "bg-charcoal/20"}`}
        style={{ borderRadius: 999 }}
      >
        <span
          className={`absolute top-0.5 h-[18px] w-[18px] rounded-full bg-white transition-all ${published ? "left-[22px]" : "left-0.5"}`}
          aria-hidden="true"
        />
      </button>
      {msg && <span role="status" className="text-[0.78rem] text-muted">{msg}</span>}
    </span>
  );
}
