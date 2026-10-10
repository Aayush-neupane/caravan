"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const ROLES = ["owner", "admin", "booking_manager", "fleet_manager", "document_reviewer", "support", "analyst", "customer"];

export function RoleSelect({ email, role, self }: { email: string; role: string; self: boolean }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  async function change(next: string, reset: (v: string) => void) {
    if (next === role) return;
    if (!confirm(`Change ${email}: ${role} → ${next}?`)) {
      reset(role);
      return;
    }
    setBusy(true); setMsg(null);
    try {
      const r = await fetch("/api/admin/staff", {
        method: "PATCH", headers: { "content-type": "application/json" },
        body: JSON.stringify({ email, role: next }),
      });
      const j = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(j.error ?? "Update failed");
      router.refresh();
    } catch (e) {
      setMsg(e instanceof Error ? e.message : "Update failed");
      reset(role);
    } finally { setBusy(false); }
  }

  return (
    <span className="inline-flex items-center gap-2">
      <select
        aria-label={`Role for ${email}`}
        className="field-input !w-auto !py-1 !text-[0.82rem] font-semibold"
        defaultValue={role}
        disabled={busy || self}
        title={self ? "You cannot change your own role" : `Change role for ${email}`}
        onChange={(e) => change(e.target.value, (v) => { e.target.value = v; })}
      >
        {ROLES.map((x) => <option key={x} value={x}>{x}</option>)}
      </select>
      {msg && <span role="alert" className="text-[0.78rem] text-error">{msg}</span>}
    </span>
  );
}
