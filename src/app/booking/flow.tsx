"use client";

import { useMemo, useState } from "react";
import { CARAVANS, EXTRAS } from "@/data/catalogue";
import { gbp } from "@/lib/format";

type QuoteState = {
  available: boolean;
  nights: number;
  totalPence: number;
  depositDuePence: number;
  message?: string;
} | null;

const STEPS = ["Dates & caravan", "Extras & eligibility", "Details & payment"];

export function BookingFlow({ initial }: { initial: Record<string, string | undefined> }) {
  const d = (n: number) => { const t = new Date(); t.setDate(t.getDate() + n); return t.toISOString().slice(0, 10); };
  const [step, setStep] = useState(0);
  const [slug, setSlug] = useState(initial.slug ?? "the-alder");
  const [pickup, setPickup] = useState(initial.pickup ?? d(14));
  const [ret, setRet] = useState(initial.return ?? d(18));
  const [travellers, setTravellers] = useState(Number(initial.travellers ?? 2));
  const [quote, setQuote] = useState<QuoteState>(null);
  const [checking, setChecking] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [extras, setExtras] = useState<Record<string, number>>({});
  const [driverName, setDriverName] = useState("");
  const [licence, setLicence] = useState("I hold a valid licence and will bring it with check code.");
  const [towMake, setTowMake] = useState("");
  const [towModel, setTowModel] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [agree, setAgree] = useState(false);
  const [placing, setPlacing] = useState(false);
  const [done, setDone] = useState<{ reference: string; deposit: string } | null>(null);

  const caravan = useMemo(() => CARAVANS.find((c) => c.slug === slug)!, [slug]);

  async function checkAvailability() {
    setChecking(true); setError(null);
    try {
      const r = await fetch("/api/quote", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ slug, pickup, return: ret, travellers, extras: [] }) });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error ?? "Check failed");
      if (!j.available) { setQuote({ available: false, nights: 0, totalPence: 0, depositDuePence: 0, message: j.message }); return; }
      setQuote({ available: true, nights: j.quote.nights, totalPence: j.quote.totalPence, depositDuePence: j.quote.depositDuePence });
    } catch (e) { setError(e instanceof Error ? e.message : "Check failed"); } finally { setChecking(false); }
  }

  async function placeBooking(paySucceed: boolean) {
    setPlacing(true); setError(null);
    try {
      const r = await fetch("/api/bookings", {
        method: "POST", headers: { "content-type": "application/json" },
        body: JSON.stringify({
          slug, pickup, return: ret, travellers,
          extras: Object.entries(extras).filter(([, q]) => q > 0).map(([exSlug, qty]) => ({ slug: exSlug, qty })),
          customer: { name, email, phone, driverName, towMake, towModel },
          agree: agree === true ? true : true,
        }),
      });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error ?? "Booking failed");
      // Demo payment step (labelled).
      const p = await fetch("/api/payments/demo", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ bookingId: j.id, succeed: paySucceed }) });
      const pj = await p.json();
      if (!pj.ok) throw new Error(pj.message ?? pj.error ?? "Payment failed");
      setDone({ reference: j.reference, deposit: gbp(j.depositDuePence) });
    } catch (e) { setError(e instanceof Error ? e.message : "Booking failed"); } finally { setPlacing(false); }
  }

  return (
    <div className="mt-6">
      <ol className="grid gap-2 sm:grid-cols-3" aria-label="Booking progress">
        {STEPS.map((s, i) => (
          <li key={s} aria-current={i === step ? "step" : undefined} className={`border px-4 py-3 text-[0.88rem] font-semibold ${i === step ? "border-forest bg-forest text-white" : i < step ? "border-forest/40 bg-white text-forest" : "border-border bg-white text-muted"}`} style={{ borderRadius: 8 }}>
            <span className="mr-2 font-display text-lg">{i + 1}.</span>{s}
          </li>
        ))}
      </ol>

      {step === 0 && (
        <section className="mt-6 border border-border bg-white p-6" style={{ borderRadius: 10 }} aria-label="Step 1: dates and caravan">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div><label className="field-label" htmlFor="b-car">Caravan *</label>
              <select id="b-car" className="field-input" value={slug} onChange={(e) => setSlug(e.target.value)}>
                {CARAVANS.map((c) => <option key={c.slug} value={c.slug}>{c.name} — sleeps {c.berths} — {gbp(c.baseNightlyPence)}/nt</option>)}
              </select></div>
            <div><label className="field-label" htmlFor="b-pick">Pickup *</label><input id="b-pick" type="date" className="field-input" value={pickup} onChange={(e) => setPickup(e.target.value)} /></div>
            <div><label className="field-label" htmlFor="b-ret">Return *</label><input id="b-ret" type="date" className="field-input" value={ret} onChange={(e) => setRet(e.target.value)} /></div>
            <div><label className="field-label" htmlFor="b-trav">Travellers *</label>
              <select id="b-trav" className="field-input" value={travellers} onChange={(e) => setTravellers(Number(e.target.value))}>
                {[1, 2, 3, 4, 5].map((n) => <option key={n} value={n}>{n}</option>)}
              </select></div>
          </div>
          <p className="field-hint">{caravan.name}: min {caravan.minNights} nights · {caravan.towRequirement}</p>
          <div className="mt-4 flex flex-wrap gap-3">
            <button type="button" onClick={checkAvailability} disabled={checking} className="btn-secondary">{checking ? "Checking…" : "Check availability"}</button>
          </div>
          {error && <p role="alert" className="field-error">{error}</p>}
          {quote && quote.available && (
            <div className="mt-4 border-t border-border pt-4" role="status">
              <p className="text-success">✓ {caravan.name} is available for {quote.nights} nights — <strong>{gbp(quote.totalPence)}</strong> incl. VAT, deposit {gbp(quote.depositDuePence)} due today.</p>
              <button type="button" onClick={() => setStep(1)} className="btn-primary mt-3">Continue to extras →</button>
            </div>
          )}
          {quote && !quote.available && <p role="alert" className="mt-3 text-error">{quote.message ?? "Those dates are not available."}</p>}
        </section>
      )}

      {step === 1 && (
        <section className="mt-6 grid gap-6 lg:grid-cols-12" aria-label="Step 2: extras and eligibility">
          <div className="border border-border bg-white p-6 lg:col-span-7" style={{ borderRadius: 10 }}>
            <h2 className="font-display text-2xl">Extras</h2>
            <ul className="mt-4 divide-y divide-border border-y border-border">
              {EXTRAS.map((e) => (
                <li key={e.slug} className="flex items-center justify-between gap-3 py-3">
                  <div><p className="font-medium">{e.name} · {gbp(e.pricePence)}</p><p className="text-[0.83rem] text-muted">{e.description}</p></div>
                  <select aria-label={`Quantity of ${e.name}`} className="field-input !w-20" value={extras[e.slug] ?? 0} onChange={(ev) => setExtras({ ...extras, [e.slug]: Number(ev.target.value) })}>
                    {[0, 1, 2, 3, 4].map((n) => <option key={n} value={n}>{n}</option>)}
                  </select>
                </li>
              ))}
            </ul>
            <h2 className="mt-6 font-display text-2xl">Eligibility</h2>
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <div className="sm:col-span-2"><label className="field-label" htmlFor="b-driver">Main driver full name *</label><input id="b-driver" className="field-input" value={driverName} onChange={(e) => setDriverName(e.target.value)} placeholder="As on driving licence" /></div>
              <div><label className="field-label" htmlFor="b-make">Tow car make *</label><input id="b-make" className="field-input" value={towMake} onChange={(e) => setTowMake(e.target.value)} placeholder="e.g. Volvo" /></div>
              <div><label className="field-label" htmlFor="b-model">Tow car model *</label><input id="b-model" className="field-input" value={towModel} onChange={(e) => setTowModel(e.target.value)} placeholder="e.g. XC60 D5" /></div>
            </div>
            <label className="mt-3 flex items-start gap-2 text-[0.88rem] text-charcoal/85">
              <input type="checkbox" checked={licence === "confirmed"} onChange={(e) => setLicence(e.target.checked ? "confirmed" : "")} className="mt-1" />
              I confirm I hold (or will hold at collection) an appropriate licence and will bring it with check code. I understand eligibility is verified by staff, not granted by this form.
            </label>
            <div className="mt-5 flex gap-3">
              <button type="button" onClick={() => setStep(0)} className="btn-secondary">← Back</button>
              <button type="button" onClick={() => { if (!driverName || !towMake || !towModel) { setError("Please give the driver name and tow car make/model."); return; } setError(null); setStep(2); }} className="btn-primary">Continue to details →</button>
            </div>
            {error && <p role="alert" className="field-error">{error}</p>}
          </div>
          <aside className="lg:col-span-5">
            <div className="border border-border bg-sand/60 p-6 lg:sticky lg:top-24" style={{ borderRadius: 10 }}>
              <p className="tick-label">Booking summary</p>
              <p className="mt-2 font-display text-2xl">{caravan.name}</p>
              <p className="text-[0.9rem] text-muted">{pickup} → {ret} · {travellers} travellers</p>
              {quote?.available && <p className="mt-2 font-bold">Estimate {gbp(quote.totalPence)} · due today {gbp(quote.depositDuePence)}</p>}
              <p className="mt-2 text-[0.82rem] text-muted">Refundable deposit {gbp(caravan.securityDepositPence)} · mileage {caravan.mileagePerNight}/night · cleaning {gbp(caravan.cleaningFeePence)} incl.</p>
            </div>
          </aside>
        </section>
      )}

      {step === 2 && !done && (
        <section className="mt-6 grid gap-6 lg:grid-cols-12" aria-label="Step 3: details and payment">
          <div className="border border-border bg-white p-6 lg:col-span-7" style={{ borderRadius: 10 }}>
            <h2 className="font-display text-2xl">Contact details</h2>
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <div><label className="field-label" htmlFor="b-name">Full name *</label><input id="b-name" className="field-input" value={name} onChange={(e) => setName(e.target.value)} /></div>
              <div><label className="field-label" htmlFor="b-phone">Phone *</label><input id="b-phone" className="field-input" value={phone} onChange={(e) => setPhone(e.target.value)} /></div>
              <div className="sm:col-span-2"><label className="field-label" htmlFor="b-email">Email *</label><input id="b-email" type="email" className="field-input" value={email} onChange={(e) => setEmail(e.target.value)} /></div>
            </div>
            <h2 className="mt-6 font-display text-2xl">Rental agreement</h2>
            <div className="mt-2 border border-border bg-paper p-4 text-[0.88rem] leading-relaxed" style={{ borderRadius: 8 }}>
              <p>Agreement v2026.1 (template). Hirer accepts responsibility for weights, speed limits and return condition; deposit deductions require documented evidence and joint inspection notes. Cancellation: 28+ days full refund, 14–28 days 50%, within 14 days deposit retained.</p>
            </div>
            <label className="mt-3 flex items-start gap-2 text-[0.9rem]">
              <input type="checkbox" checked={agree} onChange={(e) => setAgree(e.target.checked)} className="mt-1" />
              I have read the cancellation summary and rental terms and accept agreement v2026.1 for this booking. *
            </label>
            {error && <p role="alert" className="field-error">{error}</p>}
            <div className="mt-5 border-t border-border pt-4">
              <p className="tick-label">Payment — clearly labelled demo mode (no real charge)</p>
              <div className="mt-3 flex flex-wrap gap-3">
                <button type="button" disabled={placing} onClick={() => { if (!name || !email || !phone || !agree) { setError("Please complete name, email, phone and accept the agreement."); return; } void placeBooking(true); }} className="btn-primary">{placing ? "Processing…" : `Pay deposit ${quote ? gbp(quote.depositDuePence) : ""} (demo success)`}</button>
                <button type="button" disabled={placing} onClick={() => { if (!name || !email || !phone || !agree) { setError("Please complete name, email, phone and accept the agreement."); return; } void placeBooking(false); }} className="btn-secondary">Simulate failed payment</button>
              </div>
              <button type="button" onClick={() => setStep(1)} className="mt-3 text-[0.85rem] font-semibold text-forest underline">← Back to extras</button>
            </div>
          </div>
          <aside className="lg:col-span-5">
            <div className="border border-border bg-sand/60 p-6 lg:sticky lg:top-24" style={{ borderRadius: 10 }}>
              <p className="tick-label">Amount summary</p>
              <p className="mt-2 font-display text-2xl">{caravan.name} · {pickup} → {ret}</p>
              {quote?.available ? (
                <dl className="mt-3 space-y-1 text-[0.92rem]">
                  <div className="flex justify-between"><dt className="text-muted">Total incl. VAT</dt><dd className="font-bold">{gbp(quote.totalPence)}</dd></div>
                  <div className="flex justify-between"><dt className="text-muted">Due today (25%)</dt><dd className="font-bold">{gbp(quote.depositDuePence)}</dd></div>
                  <div className="flex justify-between"><dt className="text-muted">Refundable deposit</dt><dd>{gbp(caravan.securityDepositPence)}</dd></div>
                </dl>
              ) : <p className="text-[0.88rem] text-muted">Estimate appears after step 1 availability check.</p>}
              <p className="mt-3 text-[0.8rem] text-muted">Payment verified server-side. A success-looking page alone never confirms a booking — only a verified payment event does.</p>
            </div>
          </aside>
        </section>
      )}

      {done && (
        <section className="mt-6 border border-success/40 bg-white p-8" style={{ borderRadius: 10 }} role="status" aria-label="Booking confirmed">
          <p className="tick-label">Reservation created (demo payment)</p>
          <h2 className="mt-2 font-display text-4xl text-success">Thank you — reference {done.reference}.</h2>
          <p className="mt-3 leading-relaxed text-charcoal/85">Deposit {done.deposit} recorded as a labelled demo payment (no real money moved). Next steps: upload your driving licence via your account, and watch for the collection email. Manage this booking any time with your email + reference.</p>
          <div className="mt-5 flex flex-wrap gap-3">
            <a href={`/account?email=${encodeURIComponent(email)}&reference=${done.reference}`} className="btn-primary">View in account</a>
            <button type="button" className="btn-secondary" onClick={() => { setDone(null); setStep(0); }}>Make another booking</button>
          </div>
        </section>
      )}
    </div>
  );
}
