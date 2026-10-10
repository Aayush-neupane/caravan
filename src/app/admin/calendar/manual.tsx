"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { DateRangeField } from "@/components/forms/DateRangePicker";
import { Select } from "@/components/forms/Select";

export function ManualBookingForm({ vans }: { vans: { slug: string; name: string }[] }) {
  const router = useRouter();
  const d = (n: number) => { const t = new Date(); t.setDate(t.getDate() + n); return t.toISOString().slice(0, 10); };
  const [slug, setSlug] = useState(vans[0]?.slug ?? "");
  const [pickup, setPickup] = useState(d(7));
  const [ret, setRet] = useState(d(10));
  const [travellers, setTravellers] = useState("2");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true); setMsg(null);
    try {
      const r = await fetch("/api/admin/bookings", {
        method: "POST", headers: { "content-type": "application/json" },
        body: JSON.stringify({
          slug, pickup, return: ret, travellers: Number(travellers),
          customer: { name, email, phone }, note: note || undefined,
        }),
      });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error ?? "Creation failed");
      setMsg({ ok: true, text: `Confirmed as ${j.reference}. Priced by the same engine; guest notified by email.` });
      router.refresh();
    } catch (err) {
      setMsg({ ok: false, text: err instanceof Error ? err.message : "Creation failed" });
    } finally { setBusy(false); }
  }

  return (
    <form onSubmit={submit} className="grid gap-4 lg:grid-cols-12" aria-label="New manual booking">
      <div className="lg:col-span-4">
        <Select id="mb-van" label="Caravan" value={slug} onChange={setSlug} options={vans.map((v) => ({ value: v.slug, label: v.name }))} />
      </div>
      <div className="lg:col-span-5">
        <DateRangeField id="mb-dates" label="Pickup → return" pickup={pickup} ret={ret} slug={slug} minNoticeDays={0} onChange={(p, r) => { setPickup(p); setRet(r); }} />
      </div>
      <div className="lg:col-span-3">
        <Select id="mb-trav" label="Travellers" value={travellers} onChange={setTravellers} options={[1, 2, 3, 4, 5].map((n) => ({ value: String(n), label: String(n) }))} />
      </div>
      <div className="lg:col-span-4"><label className="field-label" htmlFor="mb-name">Guest name *</label><input id="mb-name" required className="field-input" value={name} onChange={(e) => setName(e.target.value)} /></div>
      <div className="lg:col-span-4"><label className="field-label" htmlFor="mb-email">Guest email *</label><input id="mb-email" required type="email" className="field-input" value={email} onChange={(e) => setEmail(e.target.value)} /></div>
      <div className="lg:col-span-4"><label className="field-label" htmlFor="mb-phone">Guest phone *</label><input id="mb-phone" required className="field-input" value={phone} onChange={(e) => setPhone(e.target.value)} /></div>
      <div className="lg:col-span-9"><label className="field-label" htmlFor="mb-note">Internal note (optional)</label><input id="mb-note" className="field-input" value={note} onChange={(e) => setNote(e.target.value)} placeholder="Walk-in, phone booking, show discount…" /></div>
      <div className="flex items-end lg:col-span-3">
        <button className="btn-primary w-full" disabled={busy}>{busy ? "Checking…" : "Confirm booking"}</button>
      </div>
      {msg && <p role={msg.ok ? "status" : "alert"} className={`lg:col-span-12 text-[0.88rem] font-medium ${msg.ok ? "text-success" : "text-error"}`}>{msg.text}</p>}
    </form>
  );
}
