"use client";

import { useMemo, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { CARAVANS, EXTRAS } from "@/data/catalogue";
import { DateRangeField } from "@/components/forms/DateRangePicker";
import { Select } from "@/components/forms/Select";
import { gbp } from "@/lib/format";

type FlowQuote = {
  nights: number;
  nightlyBasePence: number;
  seasonalUpliftPence: number;
  weeklyDiscountPence: number;
  rentalSubtotalPence: number;
  couponCode: string | null;
  couponDiscountPence: number;
  feesPence: number;
  extrasPence: number;
  taxPence: number;
  totalPence: number;
  depositDuePence: number;
  balancePence: number;
  securityDepositPence: number;
} | null;

const STEPS = ["Dates & caravan", "Extras & eligibility", "Details & payment"];

function Breakdown({ quote }: { quote: Exclude<FlowQuote, null> }) {
  const rows: [string, string, boolean?][] = [
    [`Nightly base · ${quote.nights} nights`, gbp(quote.nightlyBasePence)],
    ...(quote.seasonalUpliftPence > 0 ? [[`Seasonal uplift`, gbp(quote.seasonalUpliftPence)] as [string, string, boolean?]] : []),
    ...(quote.weeklyDiscountPence > 0 ? [[`Long-stay discount`, `−${gbp(quote.weeklyDiscountPence)}`] as [string, string, boolean?]] : []),
    ...(quote.couponDiscountPence > 0 ? [[`Coupon ${quote.couponCode}`, `−${gbp(quote.couponDiscountPence)}`] as [string, string, boolean?]] : []),
    [`Cleaning (mandatory)`, gbp(quote.feesPence)],
    ...(quote.extrasPence > 0 ? [[`Extras`, gbp(quote.extrasPence)] as [string, string, boolean?]] : []),
    [`VAT 20%`, gbp(quote.taxPence)],
  ];
  return (
    <dl className="space-y-1.5 text-[0.92rem]">
      {rows.map(([k, v]) => (
        <div key={k} className="flex justify-between gap-3"><dt className="text-muted">{k}</dt><dd className="whitespace-nowrap font-medium">{v}</dd></div>
      ))}
      <div className="flex justify-between border-t border-border pt-2 text-base font-bold"><dt>Total</dt><dd>{gbp(quote.totalPence)}</dd></div>
      <div className="flex justify-between"><dt className="text-muted">Due today (25% deposit)</dt><dd className="font-bold text-forest">{gbp(quote.depositDuePence)}</dd></div>
      <div className="flex justify-between text-[0.85rem]"><dt className="text-muted">Later (balance)</dt><dd>{gbp(quote.balancePence)}</dd></div>
      <div className="flex justify-between text-[0.85rem]"><dt className="text-muted">Refundable security deposit (separate)</dt><dd>{gbp(quote.securityDepositPence)}</dd></div>
    </dl>
  );
}

export function BookingFlow({ initial }: { initial: Record<string, string | undefined> }) {
  const d = (n: number) => { const t = new Date(); t.setDate(t.getDate() + n); return t.toISOString().slice(0, 10); };
  const reduce = useReducedMotion();
  const [step, setStep] = useState(0);
  const [dir, setDir] = useState(1);
  const [slug, setSlug] = useState(initial.slug ?? "the-alder");
  const [pickup, setPickup] = useState(initial.pickup ?? d(14));
  const [ret, setRet] = useState(initial.return ?? d(18));
  const [travellers, setTravellers] = useState(String(initial.travellers ?? 2));
  const [quote, setQuote] = useState<FlowQuote>(null);
  const [available, setAvailable] = useState<boolean | null>(null);
  const [unavailMsg, setUnavailMsg] = useState<string | null>(null);
  const [checking, setChecking] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [extras, setExtras] = useState<Record<string, number>>({});
  const [coupon, setCoupon] = useState("");
  const [driverName, setDriverName] = useState("");
  const [towMake, setTowMake] = useState("");
  const [towModel, setTowModel] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [agree, setAgree] = useState(false);
  const [placing, setPlacing] = useState(false);
  const [done, setDone] = useState<{ reference: string; deposit: string; total: string } | null>(null);

  const caravan = useMemo(() => CARAVANS.find((c) => c.slug === slug)!, [slug]);
  const extrasList = useMemo(
    () => Object.entries(extras).filter(([, q]) => q > 0).map(([exSlug, qty]) => ({ slug: exSlug, qty })),
    [extras]
  );

  async function refreshQuote(withExtras: { slug: string; qty: number }[], withCoupon: string): Promise<boolean> {
    setChecking(true); setError(null); setUnavailMsg(null);
    try {
      const r = await fetch("/api/quote", {
        method: "POST", headers: { "content-type": "application/json" },
        body: JSON.stringify({ slug, pickup, return: ret, travellers: Number(travellers), extras: withExtras, coupon: withCoupon || undefined }),
      });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error ?? "Price check failed");
      if (!j.available) { setAvailable(false); setUnavailMsg(j.message ?? "Those dates are not available."); setQuote(null); return false; }
      setAvailable(true);
      setQuote(j.quote);
      return true;
    } catch (e) {
      setError(e instanceof Error ? e.message : "Price check failed");
      return false;
    } finally { setChecking(false); }
  }

  function go(n: number) { setDir(n > step ? 1 : -1); setStep(n); }

  async function placeBooking(paySucceed: boolean) {
    setPlacing(true); setError(null);
    try {
      const r = await fetch("/api/bookings", {
        method: "POST", headers: { "content-type": "application/json" },
        body: JSON.stringify({
          slug, pickup, return: ret, travellers: Number(travellers),
          extras: extrasList, coupon: coupon || undefined,
          customer: { name, email, phone, driverName, towMake, towModel },
          agree: true,
        }),
      });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error ?? "Booking failed");
      const p = await fetch("/api/payments/demo", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ bookingId: j.id, succeed: paySucceed }) });
      const pj = await p.json();
      if (!pj.ok) throw new Error(pj.message ?? pj.error ?? "Payment failed");
      setDone({ reference: j.reference, deposit: gbp(j.depositDuePence), total: gbp(j.totalPence) });
    } catch (e) { setError(e instanceof Error ? e.message : "Booking failed"); } finally { setPlacing(false); }
  }

  const stepVariants = {
    enter: (d: number) => ({ opacity: 0, x: reduce ? 0 : 24 * d }),
    center: { opacity: 1, x: 0 },
    exit: (d: number) => ({ opacity: 0, x: reduce ? 0 : -24 * d }),
  };

  return (
    <div className="mt-6">
      <ol className="grid gap-2 sm:grid-cols-3" aria-label="Booking progress">
        {STEPS.map((s, i) => (
          <li key={s} aria-current={i === step ? "step" : undefined} className={`border px-4 py-3 text-[0.88rem] font-semibold transition-colors ${i === step ? "border-forest bg-forest text-white" : i < step ? "border-forest/40 bg-white text-forest" : "border-border bg-white text-muted"}`} style={{ borderRadius: 8 }}>
            <span className="mr-2 font-display text-lg">{i + 1}.</span>{s}
          </li>
        ))}
      </ol>

      <AnimatePresence mode="wait" custom={dir}>
        <motion.div key={step} custom={dir} variants={stepVariants} initial="enter" animate="center" exit="exit" transition={{ duration: 0.22 }}>

      {step === 0 && (
        <section className="mt-6 border border-border bg-white p-6" style={{ borderRadius: 10 }} aria-label="Step 1: dates and caravan">
          <div className="grid gap-4 lg:grid-cols-12">
            <div className="lg:col-span-4">
              <Select
                id="b-car" label="Caravan"
                value={slug} onChange={(v) => { setSlug(v); setQuote(null); setAvailable(null); }}
                options={CARAVANS.map((c) => ({ value: c.slug, label: c.name, hint: `sleeps ${c.berths} · ${gbp(c.baseNightlyPence)}/nt` }))}
              />
            </div>
            <div className="lg:col-span-5">
              <DateRangeField
                id="b-dates" label="Pickup → return"
                pickup={pickup} ret={ret} slug={slug}
                onChange={(p, r) => { setPickup(p); setRet(r); setQuote(null); setAvailable(null); }}
              />
            </div>
            <div className="lg:col-span-3">
              <Select
                id="b-trav" label="Travellers"
                value={travellers} onChange={setTravellers}
                options={[1, 2, 3, 4, 5].map((n) => ({ value: String(n), label: `${n} traveller${n > 1 ? "s" : ""}` }))}
              />
            </div>
          </div>
          <p className="field-hint">{caravan.name}: min {caravan.minNights} nights · max {caravan.maxNights} · {caravan.towRequirement}</p>
          <div className="mt-4 flex flex-wrap gap-3">
            <button type="button" onClick={() => refreshQuote([], "")} disabled={checking} className="btn-secondary">
              {checking ? "Checking…" : available ? "Recheck availability" : "Check availability & price"}
            </button>
          </div>
          {error && <p role="alert" className="field-error">{error}</p>}
          {available && quote && (
            <div className="mt-4 border-t border-border pt-4" role="status">
              <p className="text-success">✓ {caravan.name} is available for {quote.nights} nights.</p>
              <div className="mt-3 max-w-md"><Breakdown quote={quote} /></div>
              <button type="button" onClick={() => go(1)} className="btn-primary mt-4">Continue to extras →</button>
            </div>
          )}
          {available === false && <p role="alert" className="mt-3 font-medium text-error">{unavailMsg}</p>}
        </section>
      )}

      {step === 1 && (
        <section className="mt-6 grid gap-6 lg:grid-cols-12" aria-label="Step 2: extras and eligibility">
          <div className="border border-border bg-white p-6 lg:col-span-7" style={{ borderRadius: 10 }}>
            <h2 className="font-display text-2xl">Extras <span className="font-sans text-[0.8rem] font-normal text-muted">— priced live below</span></h2>
            <ul className="mt-4 divide-y divide-border border-y border-border">
              {EXTRAS.map((e) => (
                <li key={e.slug} className="flex items-center justify-between gap-3 py-3">
                  <div><p className="font-medium">{e.name} · {gbp(e.pricePence)}</p><p className="text-[0.83rem] text-muted">{e.description}</p></div>
                  <div className="w-28 shrink-0">
                    <Select
                      id={`ex-${e.slug}`} label={`Qty: ${e.name}`}
                      value={String(extras[e.slug] ?? 0)}
                      onChange={(v) => setExtras({ ...extras, [e.slug]: Number(v) })}
                      options={[0, 1, 2, 3, 4].map((n) => ({ value: String(n), label: String(n) }))}
                    />
                  </div>
                </li>
              ))}
            </ul>
            <div className="mt-4 flex flex-wrap items-end gap-3">
              <div className="min-w-52 flex-1">
                <label className="field-label" htmlFor="b-coupon">Coupon code (optional)</label>
                <input id="b-coupon" className="field-input uppercase" value={coupon} onChange={(e) => setCoupon(e.target.value.toUpperCase())} placeholder="SLOW10" maxLength={24} />
              </div>
              <button type="button" onClick={() => refreshQuote(extrasList, coupon)} disabled={checking} className="btn-secondary !py-2.5">
                {checking ? "Applying…" : "Apply to price"}
              </button>
            </div>
            <h2 className="mt-6 font-display text-2xl">Eligibility</h2>
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <div className="sm:col-span-2"><label className="field-label" htmlFor="b-driver">Main driver full name *</label><input id="b-driver" className="field-input" value={driverName} onChange={(e) => setDriverName(e.target.value)} placeholder="As on driving licence" /></div>
              <div><label className="field-label" htmlFor="b-make">Tow car make *</label><input id="b-make" className="field-input" value={towMake} onChange={(e) => setTowMake(e.target.value)} placeholder="e.g. Volvo" /></div>
              <div><label className="field-label" htmlFor="b-model">Tow car model *</label><input id="b-model" className="field-input" value={towModel} onChange={(e) => setTowModel(e.target.value)} placeholder="e.g. XC60 D5" /></div>
            </div>
            <p className="mt-3 text-[0.85rem] text-muted">Eligibility is verified by staff after document review — this form never grants it. See the <a href="/towing-guide" className="underline">towing guide</a>.</p>
            <div className="mt-5 flex gap-3">
              <button type="button" onClick={() => go(0)} className="btn-secondary">← Back</button>
              <button type="button" onClick={async () => {
                if (!driverName || !towMake || !towModel) { setError("Please give the driver name and tow car make/model."); return; }
                const ok = await refreshQuote(extrasList, coupon);
                if (ok) go(2);
              }} disabled={checking} className="btn-primary">Continue to details →</button>
            </div>
            {error && <p role="alert" className="field-error">{error}</p>}
          </div>
          <aside className="lg:col-span-5">
            <div className="border border-border bg-sand/60 p-6 lg:sticky lg:top-24" style={{ borderRadius: 10 }}>
              <p className="tick-label">Live price</p>
              <p className="mt-2 font-display text-2xl">{caravan.name}</p>
              <p className="text-[0.9rem] text-muted">{pickup} → {ret} · {travellers} travellers</p>
              <div className="mt-3 border-t border-border bg-white p-4" style={{ borderRadius: 8 }}>
                {quote ? <Breakdown quote={quote} /> : <p className="text-[0.88rem] text-muted">Press “Apply to price” to include extras and coupon.</p>}
              </div>
              {quote?.couponCode && <p className="mt-2 text-[0.82rem] font-semibold text-success">✓ Coupon {quote.couponCode} applied (−{gbp(quote.couponDiscountPence)})</p>}
            </div>
          </aside>
        </section>
      )}

      {step === 2 && !done && (
        <section className="mt-6 grid gap-6 lg:grid-cols-12" aria-label="Step 3: details and payment">
          <div className="border border-border bg-white p-6 lg:col-span-7" style={{ borderRadius: 10 }}>
            <h2 className="font-display text-2xl">Contact details</h2>
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <div><label className="field-label" htmlFor="b-name">Full name *</label><input id="b-name" className="field-input" value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" /></div>
              <div><label className="field-label" htmlFor="b-phone">Phone *</label><input id="b-phone" className="field-input" value={phone} onChange={(e) => setPhone(e.target.value)} autoComplete="tel" /></div>
              <div className="sm:col-span-2"><label className="field-label" htmlFor="b-email">Email *</label><input id="b-email" type="email" className="field-input" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" /></div>
            </div>
            <h2 className="mt-6 font-display text-2xl">Rental agreement</h2>
            <div className="mt-2 border border-border bg-paper p-4 text-[0.88rem] leading-relaxed" style={{ borderRadius: 8 }}>
              <p>Agreement v2026.1 (template). Hirer accepts responsibility for weights, speed limits and return condition; deposit deductions require documented evidence and joint inspection notes. Cancellation: 28+ days full refund, 14–28 days 50%, within 14 days deposit retained.</p>
            </div>
            <label className="mt-3 flex cursor-pointer items-start gap-2 text-[0.9rem]">
              <input type="checkbox" checked={agree} onChange={(e) => setAgree(e.target.checked)} className="mt-1 h-4 w-4 accent-[#1A2B23]" />
              I have read the cancellation summary and rental terms and accept agreement v2026.1 for this booking. *
            </label>
            {error && <p role="alert" className="field-error">{error}</p>}
            <div className="mt-5 border-t border-border pt-4">
              <p className="tick-label">Payment — clearly labelled demo mode (no real charge)</p>
              <div className="mt-3 flex flex-wrap gap-3">
                <button type="button" disabled={placing} onClick={() => { if (!name || !email || !phone || !agree) { setError("Please complete name, email, phone and accept the agreement."); return; } void placeBooking(true); }} className="btn-primary">{placing ? "Processing…" : `Pay deposit ${quote ? gbp(quote.depositDuePence) : ""} (demo success)`}</button>
                <button type="button" disabled={placing} onClick={() => { if (!name || !email || !phone || !agree) { setError("Please complete name, email, phone and accept the agreement."); return; } void placeBooking(false); }} className="btn-secondary">Simulate failed payment</button>
              </div>
              <button type="button" onClick={() => go(1)} className="mt-3 text-[0.85rem] font-semibold text-forest underline">← Back to extras</button>
            </div>
          </div>
          <aside className="lg:col-span-5">
            <div className="border border-border bg-sand/60 p-6 lg:sticky lg:top-24" style={{ borderRadius: 10 }}>
              <p className="tick-label">Review before paying</p>
              <p className="mt-2 font-display text-2xl">{caravan.name} · {pickup} → {ret}</p>
              <p className="text-[0.85rem] text-muted">{driverName} · {towMake} {towModel} · {travellers} travellers</p>
              <div className="mt-3 bg-white p-4" style={{ borderRadius: 8 }}>
                {quote ? <Breakdown quote={quote} /> : <p className="text-[0.88rem] text-muted">No price yet — go back and check availability.</p>}
              </div>
              <p className="mt-3 text-[0.8rem] text-muted">Payment verified server-side. A success-looking page alone never confirms a booking — only a verified payment event does.</p>
            </div>
          </aside>
        </section>
      )}

      {done && (
        <section className="mt-6 overflow-hidden border border-border bg-white" style={{ borderRadius: 10 }} role="status" aria-label="Booking confirmed">
          <div className="bg-forest px-6 py-5 text-paper sm:px-8">
            <p className="tick-label !text-sand/70">Reservation created · demo payment</p>
            <h2 className="mt-1 font-display text-4xl">Thank you — you are booked.</h2>
          </div>
          <div className="grid gap-0 sm:grid-cols-[1fr_auto_1fr] sm:items-stretch">
            <div className="p-6 sm:px-8">
              <p className="tick-label">Booking reference</p>
              <p className="mt-1 font-mono text-3xl font-bold tracking-wider text-forest">{done.reference}</p>
              <p className="mt-3 text-[0.92rem] leading-relaxed text-charcoal/85">Deposit {done.deposit} recorded as a labelled demo payment (no real money moved). Total {done.total} incl. VAT.</p>
            </div>
            <div className="hidden border-l-2 border-dashed border-border sm:block" aria-hidden="true" />
            <div className="border-t-2 border-dashed border-border p-6 sm:border-t-0 sm:px-8">
              <p className="tick-label">Next steps</p>
              <ol className="mt-2 list-decimal space-y-1.5 pl-5 text-[0.9rem] text-charcoal/85">
                <li>Upload your driving licence via your account.</li>
                <li>Watch for the collection email 7 days before.</li>
                <li>Arrive 15 minutes early at Lansdown Depot.</li>
              </ol>
              <div className="mt-4 flex flex-wrap gap-3">
                <a href={`/account?email=${encodeURIComponent(email)}&reference=${done.reference}`} className="btn-primary">View in account</a>
                <button type="button" className="btn-secondary" onClick={() => { setDone(null); go(0); }}>New booking</button>
              </div>
            </div>
          </div>
        </section>
      )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
