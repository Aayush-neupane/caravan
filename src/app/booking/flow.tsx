"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { CARAVANS, EXTRAS, type CatalogueCaravan } from "@/data/catalogue";
import { DateRangeField } from "@/components/forms/DateRangePicker";
import { Select } from "@/components/forms/Select";
import { RouteProgress } from "@/components/editorial/MiniConvoy";
import { VoucherTicket } from "@/components/booking/VoucherTicket";
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
  voucherAppliedPence: number;
  voucherCode?: string | null;
  securityDepositPence: number;
} | null;

// Outcome of a price refresh: the client must tell a genuine price/availability
// change apart from a transport failure (retry is safe, re-review is not).
type RefreshResult =
  | { ok: true }
  | { ok: false; kind: "unavailable" | "rejected" | "error"; message: string };

const STEPS = ["Dates & caravan", "Extras & contact", "Review & reserve"];

// Fresh idempotency key per reservation: retries/back-button/double-tab reuse
// the current one so the server dedupes, but a NEW reservation must get a new
// key or the first booking would be returned as a deduped hit.
function freshIdemKey(): string {
  return typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function Morph({ value, className }: { value: string; className?: string }) {
  return (
    <span className={`relative inline-block overflow-hidden ${className ?? ""}`}>
      <AnimatePresence mode="popLayout" initial={false}>
        <motion.span
          key={value}
          initial={reduceMotion() ? false : { y: 10, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={reduceMotion() ? { opacity: 0 } : { y: -10, opacity: 0 }}
          transition={{ duration: 0.22 }}
          className="inline-block whitespace-nowrap"
        >
          {value}
        </motion.span>
      </AnimatePresence>
    </span>
  );
}

function reduceMotion(): boolean {
  return typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
}

function Breakdown({ quote }: { quote: Exclude<FlowQuote, null> }) {
  const rows: [string, string, boolean?][] = [
    [`Nightly base · ${quote.nights} nights`, gbp(quote.nightlyBasePence)],
    ...(quote.seasonalUpliftPence > 0 ? [[`Seasonal uplift`, gbp(quote.seasonalUpliftPence)] as [string, string, boolean?]] : []),
    ...(quote.weeklyDiscountPence > 0 ? [[`Long-stay discount`, `−${gbp(quote.weeklyDiscountPence)}`] as [string, string, boolean?]] : []),
    ...(quote.couponDiscountPence > 0 ? [[`Coupon ${quote.couponCode}`, `−${gbp(quote.couponDiscountPence)}`] as [string, string, boolean?]] : []),
    [`Cleaning (mandatory)`, gbp(quote.feesPence)],
    ...(quote.extrasPence > 0 ? [[`Extras`, gbp(quote.extrasPence)] as [string, string, boolean?]] : []),
    ...(quote.voucherAppliedPence > 0 ? [[`Gift voucher ${quote.voucherCode ?? ""}`, `−${gbp(quote.voucherAppliedPence)}`] as [string, string, boolean?]] : []),
    [`GST 10%`, gbp(quote.taxPence)],
  ];
  return (
    <dl className="space-y-1.5 text-[0.92rem] tabular-nums">
      {rows.map(([k, v]) => (
        <div key={k} className="flex justify-between gap-3"><dt className="text-muted">{k}</dt><dd className="whitespace-nowrap font-medium">{v}</dd></div>
      ))}
      <div className="flex justify-between border-t border-border pt-2 text-base font-bold"><dt>Total</dt><dd><Morph value={gbp(quote.totalPence)} /></dd></div>
      <div className="flex justify-between"><dt className="text-muted">Due at the depot (25% deposit)</dt><dd className="font-bold text-forest"><Morph value={gbp(quote.depositDuePence)} /></dd></div>
      <div className="flex justify-between text-[0.85rem]"><dt className="text-muted">Balance at collection</dt><dd>{gbp(quote.balancePence)}</dd></div>
      <div className="flex justify-between text-[0.85rem]"><dt className="text-muted">Refundable security deposit (separate)</dt><dd>{gbp(quote.securityDepositPence)}</dd></div>
    </dl>
  );
}

export function BookingFlow({ initial, caravans = CARAVANS }: { initial: Record<string, string | undefined>; caravans?: CatalogueCaravan[] }) {
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
  const [voucher, setVoucher] = useState("");
  const [voucherOpen, setVoucherOpen] = useState(false);
  const [driverName, setDriverName] = useState("");
  const [towMake, setTowMake] = useState("");
  const [towModel, setTowModel] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [agree, setAgree] = useState(false);
  const [placing, setPlacing] = useState(false);
  // Server figures only: the printed/downloaded ticket must match what the
  // API actually stored, never the browser's last quote.
  const [done, setDone] = useState<{ reference: string; depositPence: number; totalPence: number; voucherAppliedPence: number; holdExpiresAt: string } | null>(null);
  const doneRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (done) doneRef.current?.querySelector<HTMLElement>("section")?.focus?.() ?? doneRef.current?.focus?.();
  }, [done]);
  const idemRef = useRef<string | null>(null);
  if (!idemRef.current) idemRef.current = freshIdemKey();

  // Travellers come from the caravan's own capacity (API allows 1–6, vans
  // sleep up to 6) — never a hardcoded 1–5.
  const maxTravellersFor = (vanSlug: string) => {
    const n = Number(caravans.find((c) => c.slug === vanSlug)?.maxTravellers);
    return Number.isFinite(n) && n >= 1 ? Math.min(6, Math.floor(n)) : 6;
  };
  const maxTravellers = maxTravellersFor(slug);
  const travellerOptions = useMemo(
    () => Array.from({ length: maxTravellers }, (_, i) => ({ value: String(i + 1), label: `${i + 1} traveller${i > 0 ? "s" : ""}` })),
    [maxTravellers]
  );

  const caravan = useMemo(() => caravans.find((c) => c.slug === slug) ?? caravans[0], [slug, caravans]);
  // Keep the selection inside the current van's capacity (initial query
  // params or a caravan switch can otherwise leave an out-of-range value).
  useEffect(() => {
    if (Number(travellers) > maxTravellers) setTravellers(String(maxTravellers));
  }, [maxTravellers, travellers]);
  const extrasList = useMemo(
    () => Object.entries(extras).filter(([, q]) => q > 0).map(([exSlug, qty]) => ({ slug: exSlug, qty })),
    [extras]
  );

  async function refreshQuote(withExtras: { slug: string; qty: number }[], withCoupon: string, withVoucher?: string): Promise<RefreshResult> {
    setChecking(true); setError(null); setUnavailMsg(null);
    try {
      const r = await fetch("/api/quote", {
        method: "POST", headers: { "content-type": "application/json" },
        body: JSON.stringify({ slug, pickup, return: ret, travellers: Number(travellers), extras: withExtras, coupon: withCoupon || undefined, voucher: (withVoucher ?? voucher).trim() || undefined }),
      });
      const j = await r.json().catch(() => ({}));
      // 5xx / network = transport failure: the price was never checked, so
      // say so instead of blaming a price change.
      if (!r.ok && r.status >= 500) {
        setError("Could not refresh your price. Please retry.");
        return { ok: false, kind: "error", message: "Could not refresh your price. Please retry." };
      }
      if (!r.ok) {
        const message = j.error ?? "Price check failed";
        setError(message);
        return { ok: false, kind: "rejected", message };
      }
      if (!j.available) {
        const message = j.message ?? "Those dates are not available.";
        setAvailable(false); setUnavailMsg(message); setQuote(null);
        return { ok: false, kind: "unavailable", message };
      }
      setAvailable(true);
      setQuote(j.quote);
      return { ok: true };
    } catch {
      const message = "Could not refresh your price. Please retry.";
      setError(message);
      return { ok: false, kind: "error", message };
    } finally { setChecking(false); }
  }

  function go(n: number) { setDir(n > step ? 1 : -1); setStep(n); }

  // Online step ends at reservation: no payment is taken here. The guest
  // gets a collection voucher (reference) and settles at the depot counter,
  // where staff check physical documents and approve the handover.
  async function placeBooking() {
    setPlacing(true); setError(null);
    try {
      // Re-quote immediately before reserving so the voucher totals cannot
      // go stale between step 2 and submitting.
      const fresh = await refreshQuote(extrasList, coupon, voucher);
      if (!fresh.ok) {
        if (fresh.kind === "error") throw new Error("Could not refresh your price. Please retry.");
        if (fresh.kind === "unavailable") throw new Error(fresh.message);
        throw new Error("Price changed — please review the new total before reserving.");
      }
      const r = await fetch("/api/bookings", {
        method: "POST", headers: { "content-type": "application/json", "x-idempotency-key": idemRef.current! },
        body: JSON.stringify({
          slug, pickup, return: ret, travellers: Number(travellers),
          extras: extrasList, coupon: coupon || undefined, voucher: voucher.trim() || undefined,
          idempotencyKey: idemRef.current,
          customer: { name, email, phone, driverName, towMake, towModel },
          agree: true,
        }),
      });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error ?? "Booking failed");
      // Only the server's figures travel onto the ticket.
      setDone({ reference: j.reference, depositPence: j.depositDuePence, totalPence: j.totalPence, voucherAppliedPence: j.voucherAppliedPence ?? 0, holdExpiresAt: j.holdExpiresAt ?? "" });
      // Next reservation gets a fresh key (this one now dedupes to j.reference).
      idemRef.current = freshIdemKey();
    } catch (e) { setError(e instanceof Error ? e.message : "Booking failed"); } finally { setPlacing(false); }
  }

  const stepVariants = {
    enter: (d: number) => ({ opacity: 0, x: reduce ? 0 : 24 * d }),
    center: { opacity: 1, x: 0 },
    exit: (d: number) => ({ opacity: 0, x: reduce ? 0 : -24 * d }),
  };

  return (
    <div className="mt-6">
      {!done && <RouteProgress step={step} labels={STEPS} />}

      <AnimatePresence mode="wait" custom={dir}>
        <motion.div key={step} custom={dir} variants={stepVariants} initial="enter" animate="center" exit="exit" transition={{ duration: 0.22 }}>

      {step === 0 && (
        <section className="mt-6 border border-border bg-white p-6" style={{ borderRadius: 10 }} aria-label="Step 1: dates and caravan">
          <div className="grid gap-4 lg:grid-cols-12">
            <div className="lg:col-span-4">
              <Select
                id="b-car" label="Caravan"
                value={slug} onChange={(v) => { setSlug(v); setQuote(null); setAvailable(null); if (Number(travellers) > maxTravellersFor(v)) setTravellers(String(maxTravellersFor(v))); }}
                options={caravans.map((c) => ({ value: c.slug, label: c.name, hint: `sleeps ${c.maxTravellers} · ${gbp(c.baseNightlyPence)}/nt` }))}
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
                options={travellerOptions}
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
        <section className="mt-6 grid gap-6 lg:grid-cols-12" aria-label="Step 2: extras and contact">
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
                <input id="b-coupon" name="coupon" className="field-input uppercase" value={coupon} onChange={(e) => setCoupon(e.target.value.toUpperCase())} placeholder="SLOW10…" maxLength={24} autoComplete="off" spellCheck={false} />
              </div>
              <button type="button" onClick={async () => { const ok = await refreshQuote(extrasList, coupon, voucher); if (ok && voucher.trim()) setVoucherOpen(false); }} disabled={checking} className="btn-secondary !py-2.5">
                {checking ? "Applying…" : "Apply to price"}
              </button>
            </div>
            <div className="mt-3">
              <button type="button" onClick={() => setVoucherOpen((v) => !v)} className="text-[0.85rem] font-semibold text-forest underline" aria-expanded={voucherOpen}>
                Have a gift voucher?
              </button>
              {voucherOpen && (
                <div className="mt-2 flex flex-wrap items-end gap-3">
                  <div className="min-w-52 flex-1">
                    <label className="field-label" htmlFor="b-voucher">Gift voucher code</label>
                    <input id="b-voucher" name="voucher" className="field-input uppercase" value={voucher} onChange={(e) => setVoucher(e.target.value.toUpperCase())} placeholder="GIFT-250…" maxLength={32} autoComplete="off" spellCheck={false} />
                  </div>
                  <button type="button" onClick={async () => { const ok = await refreshQuote(extrasList, coupon, voucher); if (ok) setVoucherOpen(false); }} disabled={checking} className="btn-secondary !py-2.5">
                    {checking ? "Checking…" : "Redeem voucher"}
                  </button>
                </div>
              )}
              {voucher.trim() && quote && quote.voucherAppliedPence > 0 && (
                <p className="mt-2 text-[0.82rem] font-semibold text-success">
                  ✓ Voucher {voucher.trim().toUpperCase()} applied — {gbp(quote.voucherAppliedPence)} off the deposit due now
                </p>
              )}
            </div>
            <h2 className="mt-6 font-display text-2xl">Eligibility</h2>
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <div className="sm:col-span-2"><label className="field-label" htmlFor="b-driver">Main driver full name *</label><input id="b-driver" name="driverName" className="field-input" value={driverName} onChange={(e) => setDriverName(e.target.value)} placeholder="As on driving licence…" autoComplete="name" /></div>
              <div><label className="field-label" htmlFor="b-make">Tow vehicle make *</label><input id="b-make" name="towMake" className="field-input" value={towMake} onChange={(e) => setTowMake(e.target.value)} placeholder="e.g. Toyota…" autoComplete="off" /></div>
              <div><label className="field-label" htmlFor="b-model">Tow vehicle model *</label><input id="b-model" name="towModel" className="field-input" value={towModel} onChange={(e) => setTowModel(e.target.value)} placeholder="e.g. LandCruiser…" autoComplete="off" /></div>
            </div>
            <p className="mt-3 text-[0.85rem] text-muted">Licence and tow-vehicle match are checked by staff at the depot counter — this form never grants them. See the <Link href="/towing-guide" className="underline">towing guide</Link>.</p>
            <div className="mt-5 flex gap-3">
              <button type="button" onClick={() => go(0)} className="btn-secondary">← Back</button>
              <button type="button" onClick={async () => {
                if (!driverName || !towMake || !towModel) { setError("Please give the driver name and tow car make/model."); return; }
                const ok = await refreshQuote(extrasList, coupon, voucher);
                if (ok) go(2);
              }} disabled={checking} className="btn-primary">Continue to review →</button>
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
        <section className="mt-6 grid gap-6 lg:grid-cols-12" aria-label="Step 3: review and reserve">
          <div className="border border-border bg-white p-6 lg:col-span-7" style={{ borderRadius: 10 }}>
            <h2 className="font-display text-2xl">Contact details</h2>
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <div><label className="field-label" htmlFor="b-name">Full name *</label><input id="b-name" name="name" className="field-input" value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" placeholder="Jordan Citizen…" /></div>
              <div><label className="field-label" htmlFor="b-phone">Phone *</label><input id="b-phone" name="phone" type="tel" inputMode="tel" className="field-input" value={phone} onChange={(e) => setPhone(e.target.value)} autoComplete="tel" placeholder="+61 4…" /></div>
              <div className="sm:col-span-2"><label className="field-label" htmlFor="b-email">Email *</label><input id="b-email" name="email" type="email" className="field-input" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" spellCheck={false} placeholder="you@example.com…" /></div>
            </div>
            <h2 className="mt-6 font-display text-2xl">Rental agreement</h2>
            <div className="mt-2 border border-border bg-paper p-4 text-[0.88rem] leading-relaxed" style={{ borderRadius: 8 }}>
              <p>Agreement v2026.1. Hirer accepts responsibility for weights, speed limits and return condition; deposit deductions require documented evidence and joint inspection notes. Cancellation: 28+ days full refund, 14–28 days 50%, within 14 days deposit retained.</p>
            </div>
            <label className="mt-3 flex cursor-pointer items-start gap-2 text-[0.9rem]">
              <input type="checkbox" checked={agree} onChange={(e) => setAgree(e.target.checked)} className="mt-1 h-4 w-4 accent-[#1A2B23]" />
              I have read the cancellation summary and rental terms and accept agreement v2026.1 for this booking. *
            </label>
            {error && <p role="alert" className="field-error">{error}</p>}
            <div className="mt-5 border-t border-border pt-4">
              <p className="tick-label">Reserve — nothing is charged online</p>
              <div className="mt-3 flex flex-wrap gap-3">
                <button type="button" disabled={placing} onClick={() => { if (!name || !email || !phone || !agree) { setError("Please complete name, email, phone and accept the agreement."); return; } void placeBooking(); }} className="btn-primary">{placing ? "Reserving…" : "Reserve caravan — get collection voucher"}</button>
              </div>
              <button type="button" onClick={() => go(1)} className="mt-3 text-[0.85rem] font-semibold text-forest underline">← Back to extras</button>
            </div>
          </div>
          <aside className="lg:col-span-5">
            <div className="border border-border bg-sand/60 p-6 lg:sticky lg:top-24" style={{ borderRadius: 10 }}>
              <p className="tick-label">Review before reserving</p>
              <p className="mt-2 font-display text-2xl">{caravan.name} · {pickup} → {ret}</p>
              <p className="text-[0.85rem] text-muted">{driverName} · {towMake} {towModel} · {travellers} travellers</p>
              <div className="mt-3 bg-white p-4" style={{ borderRadius: 8 }}>
                {quote ? <Breakdown quote={quote} /> : <p className="text-[0.88rem] text-muted">No price yet — go back and check availability.</p>}
              </div>
              <p className="mt-3 text-[0.8rem] text-muted">Nothing is charged online. You reserve now, then pay and show documents at the depot counter.</p>
            </div>
          </aside>
        </section>
      )}

      {done && (
        <div className="mt-6 space-y-4" ref={doneRef}>
          <div role="status" aria-live="polite" tabIndex={-1} className="outline-none">
          <VoucherTicket
            ticket={{
              reference: done.reference,
              guestName: name || null,
              caravan: caravan.name,
              pickup,
              ret,
              totalPence: done.totalPence,
              depositDuePence: done.depositPence,
              status: "held",
            }}
          />
          {done.voucherAppliedPence > 0 && (
            <p className="text-[0.88rem] font-semibold text-success">✓ Gift voucher applied — {gbp(done.voucherAppliedPence)} of the deposit settled from your voucher.</p>
          )}
          {done.holdExpiresAt && (
            <p className="text-[0.85rem] text-muted">
              These dates are held until {new Date(done.holdExpiresAt).toLocaleString("en-AU", { dateStyle: "medium", timeStyle: "short" })} — after that the reservation lapses and the dates are released.
            </p>
          )}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="font-mono text-[0.68rem] font-bold uppercase tracking-[0.18em] text-success">✓ Reserved — see you at the depot</p>
            <button type="button" className="btn-secondary" onClick={() => {
              // Fresh reservation: clear the form and issue a new idempotency
              // key so this booking is never returned as a deduped hit.
              setDone(null); setQuote(null); setAvailable(null);
              setExtras({}); setCoupon(""); setVoucher(""); setVoucherOpen(false);
              setName(""); setEmail(""); setPhone(""); setDriverName(""); setTowMake(""); setTowModel(""); setAgree(false);
              idemRef.current = freshIdemKey();
              go(0);
            }}>New booking</button>
          </div>
          </div>
        </div>
      )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
