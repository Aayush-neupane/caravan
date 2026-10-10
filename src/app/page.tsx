import Link from "next/link";
import type { Metadata } from "next";
import { BookingSearchPanel } from "@/components/brand/BookingSearchPanel";
import { Reveal, SectionHeading } from "@/components/editorial/Reveal";
import { CinematicHero } from "@/components/editorial/Hero";
import { FieldStrip } from "@/components/editorial/FieldStrip";
import { Framed, SectionMarker, Stamp, TopoLines } from "@/components/editorial/Decor";
import { ScrollRoute } from "@/components/editorial/ScrollRoute";
import { FleetCard } from "@/components/fleet/FleetCard";
import { CARAVANS, DESTINATIONS } from "@/data/catalogue";
import { gbp } from "@/lib/format";
import { priceQuote, seasonalMultiplierFor } from "@/features/pricing/engine";

export const metadata: Metadata = {
  title: "Luxury Caravan Hire in Bath",
  description:
    "Three thoughtfully equipped caravans for slow travel across the Cotswolds, South West England and Wales. Check live availability and book online.",
};

const FAQS = [
  { q: "Do I need experience towing?", a: "No. Every hire begins with a 40-minute accompanied handover: hitch, electrics, mirrors, noseweight and a short drive together. Most first-time towers are comfortable within the hour." },
  { q: "What licence do I need?", a: "Rowan suits most Category B licences. Alder and Solace need a checked weight combination — we verify your entitlement and tow-car match before confirming." },
  { q: "What is included in the price?", a: "Nightly rate, VAT, gas, hook-up leads, kitchen inventory, levelling gear and breakdown cover. Cleaning fee and refundable security deposit are shown separately before you pay." },
  { q: "Can I bring a dog?", a: "Yes in Rowan and Solace by arrangement (£35 per rental). Alder remains a no-pets caravan to protect its upholstery." },
];

export default function HomePage() {
  return (
    <>
      {/* 1 — Cinematic hero */}
      <CinematicHero />

      {/* 1b — Expedition permit: booking panel + yard strip */}
      <section id="permit" className="relative border-y border-border bg-sand/50" aria-label="Check availability" style={{ scrollMarginTop: "4rem" }}>
        <div className="mx-auto max-w-wide px-5 py-8 sm:px-8">
          <div className="relative bg-paper p-2 shadow-[0_18px_50px_-20px_rgba(26,43,35,0.35)]" style={{ borderRadius: 12 }}>
            <p className="absolute -top-3 left-4 bg-amber px-2 py-0.5 font-mono text-[0.68rem] font-bold uppercase tracking-[0.14em] text-forest" style={{ borderRadius: 3 }}>Expedition permit — free to check</p>
            <BookingSearchPanel compact />
          </div>
          <div className="flex flex-wrap gap-x-8 gap-y-1 pt-4 font-mono text-[0.7rem] uppercase tracking-[0.16em] text-muted">
            <span>Grid ref ST 726 651 — Lansdown Depot</span>
            <span>51.3811° N, 2.3590° W</span>
            <span className="hidden sm:inline">Season: high summer ×1.2</span>
            <span className="hidden md:inline">Three vans · sleeps 2–4 · from {gbp(9500)}/nt</span>
          </div>
        </div>
      </section>

      {/* 1c — The road, in frames */}
      <FieldStrip />

      {/* 2 — Brand promise */}
      <section className="border-b border-border bg-paper">
        <div className="mx-auto max-w-content px-5 pt-12 sm:px-8">
          <SectionMarker index="01" kicker="Our promise — why three vans, not thirty" coords="51.38°N 2.36°W" />
        </div>
        <div className="mx-auto grid max-w-content gap-8 px-5 pb-14 sm:px-8 lg:grid-cols-12">
          <Reveal className="lg:col-span-4">
            <p className="tick-label">Our promise</p>
            <h2 className="mt-3 font-display text-4xl leading-tight text-charcoal">A considered escape from the ordinary.</h2>
          </Reveal>
          <Reveal delay={0.08} className="lg:col-span-7 lg:col-start-6">
            <p className="editorial-measure text-[1.05rem] leading-relaxed text-charcoal/85">
              We keep three caravans, not thirty — each one chosen for the way it travels and the way it lives.
              Timber, wool and well-made equipment instead of plastic novelty. Honest weights, honest prices,
              and a handover that treats towing as a skill worth learning properly.
            </p>
            <p className="editorial-measure mt-4 text-[1.05rem] leading-relaxed text-charcoal/85">
              Sleep beneath a quiet sky, cook breakfast with the windows open, and take the long way home.
            </p>
            <Link href="/about" className="mt-5 inline-block border-b-2 border-amber pb-0.5 font-semibold text-forest">Our story and standards →</Link>
          </Reveal>
        </div>
      </section>

      {/* 3 — Featured fleet: asymmetric editorial */}
      <section className="relative overflow-hidden bg-paper" aria-label="Featured caravans">
        <span className="ghost-word pointer-events-none absolute -top-4 left-0 text-[22vw] font-bold" aria-hidden="true">FLEET</span>
        <div className="relative mx-auto max-w-wide px-5 py-16 sm:px-8">
          <SectionMarker index="02" kicker="The fleet — three vans, three temperaments" coords="ST 726 651" />
          <div className="flex flex-wrap items-end justify-between gap-4">
            <h2 className="max-w-xl font-display text-4xl leading-[1.05] sm:text-[2.9rem]">Three caravans, three ways to travel.</h2>
            <Link href="/fleet" className="border-b-2 border-amber pb-0.5 font-semibold text-forest">Open the full catalogue →</Link>
          </div>
          <p className="mt-3 max-w-2xl text-muted">Genuine inventory with verified weights and nightly rates. Choose dates to see live availability.</p>
          <div className="mt-10 grid gap-6 md:grid-cols-3">
            {CARAVANS.map((c, i) => (
              <Reveal key={c.slug} delay={i * 0.06}>
                <FleetCard caravan={c} />
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <div className="border-b border-border bg-paper py-6">
        <ScrollRoute from="THE YARD" to="THE FIELD" note="0 mi — step outside" />
      </div>

      {/* 4 — Rental experience editorial (offset image + text) */}
      <section className="relative overflow-hidden border-y border-border bg-sand/60">
        <TopoLines variant={1} />
        <div className="relative mx-auto max-w-wide px-5 pt-14 sm:px-8">
          <SectionMarker index="03" kicker="The experience — pitched by four, tea by half past" coords="Waterproofs optional" />
        </div>
        <div className="relative mx-auto grid max-w-wide gap-10 px-5 pb-16 sm:px-8 lg:grid-cols-12">
          <div className="lg:col-span-7">
            <Framed
              src="https://images.unsplash.com/photo-1510312305653-8ed496efae75?auto=format&fit=crop&w=1400&q=70"
              alt="Caravan interior in morning light with made bed and timber cupboards"
              caption="Morning inside The Alder — panelling, wool, oak"
              meta="FRAME 002 · 35MM"
              radius={10}
            />
            <div className="mt-4 grid grid-cols-2 gap-4">
              <Framed src="https://images.unsplash.com/photo-1556911220-bff31c812dba?auto=format&fit=crop&w=800&q=65" alt="Compact fitted kitchen with hob and worktop" caption="Galley, ready to cook" meta="FRAME 003" ratio="aspect-[4/3]" />
              <Framed src="https://images.unsplash.com/photo-1523987355523-c7b5b0dd90a7?auto=format&fit=crop&w=800&q=65" alt="Caravan among pines in soft light" caption="Among pines, first light" meta="FRAME 004" ratio="aspect-[4/3]" />
            </div>
          </div>
          <div className="lg:col-span-4 lg:col-start-9">
            <SectionHeading kicker="The experience" title="Settle in within the hour." />
            <div className="mt-5 space-y-4 text-[0.98rem] leading-relaxed text-charcoal/85">
              <p><strong className="text-charcoal">Arrive.</strong> Level, hook up, kettle on. Motor movers and marked jacks make pitching a ten-minute job.</p>
              <p><strong className="text-charcoal">Live.</strong> Real mattresses, blackout blinds, hot shower and a kitchen you can actually cook in — not a camping compromise.</p>
              <p><strong className="text-charcoal">Roam.</strong> Itineraries keep towing days under two hours. Mornings are for lanes and farm shops; afternoons for the long walk.</p>
            </div>
            <Link href="/how-it-works" className="btn-secondary mt-6">How a hire unfolds</Link>
          </div>
        </div>
      </section>

      {/* 5 — How it works (numbered, not 3 generic cards) */}
      <section className="bg-paper">
        <div className="mx-auto max-w-content px-5 pt-16 sm:px-8">
          <SectionMarker index="04" kicker="Passage plan — eight legs, one calm week" coords="Planning table, Bath" />
        </div>
        <div className="mx-auto max-w-content px-5 pb-16 sm:px-8">
          <h2 className="sr-only">How it works</h2>
          <ol className="mt-10 grid gap-0 border-t border-border md:grid-cols-2">
            {[
              ["Choose caravan & dates", "Filter the fleet by berths, weights and facilities. Availability is live — what you see is what you can book."],
              ["Extras & eligibility", "Bedding, awning, mileage. We check licence entitlement and tow-car match before you pay in full."],
              ["Reserve & pay", "A 25% deposit secures your dates; the balance is due 28 days before collection. Demo payments are clearly labelled."],
              ["Prepare", "Collection pack, route notes and a packing list arrive by email. Documents upload to your account."],
              ["Collect", "40-minute handover at Lansdown with tow check and accompanied drive. Leave when you are ready, not before."],
              ["Travel", "Gas, breakdown cover and a real human on the phone. Two-hour towing days recommended."],
              ["Return", "30-minute return inspection with mileage and condition recorded together. No surprises."],
              ["Deposit release", "Refundable deposit released within 5 working days, less only documented damage or excess mileage."],
            ].map(([t, d], i) => (
              <li key={t} className="flex gap-5 border-b border-border py-5 pr-6">
                <span className="font-display text-3xl text-amberDark" aria-hidden="true">{String(i + 1).padStart(2, "0")}</span>
                <div><p className="font-semibold text-charcoal">{t}</p><p className="mt-1 text-[0.92rem] leading-relaxed text-muted">{d}</p></div>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* 6 — Destinations: editorial rows, not cards */}
      <section className="grain relative overflow-hidden border-y border-border bg-forest text-paper">
        <div className="pointer-events-none absolute inset-0" aria-hidden="true"><TopoLines dark variant={2} /></div>
        <span className="ghost-word ghost-word-dark pointer-events-none absolute right-0 top-6 text-[20vw] font-bold" aria-hidden="true">ROUTES</span>
        <div className="relative z-[2] mx-auto max-w-wide px-5 pt-16 sm:px-8">
          <SectionMarker dark index="05" kicker="Charted routes — driven miles, honest distances" coords="Admiralty charts 1165–1168" />
          <h2 className="max-w-2xl font-display text-4xl leading-[1.05] sm:text-[2.9rem]">Written routes, not pins on a map.</h2>
          <p className="mt-3 max-w-2xl text-paper/75">Three starting itineraries with honest distances, seasonal notes and suitable vans.</p>
          <div className="mt-10 space-y-8">
            {DESTINATIONS.map((d, i) => (
              <Reveal key={d.slug}>
                <article className={`grid gap-6 border-t border-white/15 pt-8 lg:grid-cols-12 ${i % 2 ? "" : ""}`}>
                  <div className="lg:col-span-5">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={d.heroImage} alt={`${d.name} landscape`} className="aspect-[16/10] w-full object-cover" style={{ borderRadius: 10 }} loading="lazy" />
                  </div>
                  <div className="lg:col-span-6 lg:col-start-7">
                    <div className="flex items-baseline gap-4">
                      <span className="font-display text-6xl leading-none text-amber sm:text-7xl" aria-hidden="true">{d.distanceMi}</span>
                      <div>
                        <p className="tick-label !text-sand/70">{d.duration} · miles, door to door</p>
                        <h3 className="mt-1 font-display text-3xl">{d.name}</h3>
                      </div>
                    </div>
                    <p className="mt-3 leading-relaxed text-paper/80">{d.intro}</p>
                    <div className="mt-4 flex flex-wrap gap-3">
                      <Link href={`/destinations/${d.slug}`} className="btn-secondary !bg-transparent !text-paper !border-white/40 hover:!border-white">Read the itinerary</Link>
                      <Link href={`/fleet?pickup=&return=`} className="text-[0.9rem] font-semibold text-amber hover:underline">Check suitable vans →</Link>
                    </div>
                  </div>
                </article>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* 7 — Included & supported (spec table, not marketing cards) */}
      <section className="bg-paper">
        <div className="mx-auto grid max-w-wide gap-10 px-5 py-16 sm:px-8 lg:grid-cols-12">
          <div className="lg:col-span-4">
            <SectionMarker index="06" kicker="Inventory — every hire leaves ready" />
            <h2 className="mt-4 font-display text-3xl leading-tight">What every hire includes.</h2>
            <p className="mt-2 text-muted">No tiers, no unlockables. The van leaves ready.</p>
          </div>
          <div className="lg:col-span-7 lg:col-start-6">
            <table className="table-quiet">
              <thead><tr><th>Area</th><th>Detail</th></tr></thead>
              <tbody>
                <tr><td className="font-semibold">Towing</td><td>Hitch lock, mirrors on loan, noseweight set, accompanied drive, weight card.</td></tr>
                <tr><td className="font-semibold">Living</td><td>Kitchen inventory, hook-up leads, levelling kit, toolkit, gas bottle full.</td></tr>
                <tr><td className="font-semibold">Support</td><td>Breakdown cover, out-of-hours phone, route notes, late-return grace by arrangement.</td></tr>
                <tr><td className="font-semibold">Protection</td><td>Insurance excess explained at handover; optional excess-reduction where eligible.</td></tr>
                <tr><td className="font-semibold">Priced separately</td><td>Bedding packs, awning, bike rack, extra mileage, early collection, end cleaning.</td></tr>
              </tbody>
            </table>
            <Link href="/pricing" className="mt-5 inline-block font-semibold text-forest underline underline-offset-4">See full pricing and an itemised example →</Link>
          </div>
        </div>
      </section>

      {/* 8 — Reviews: one prominent + supporting, labelled demo */}
      <section className="border-y border-border bg-sand/60">
        <div className="mx-auto max-w-content px-5 py-16 sm:px-8">
          <SectionMarker index="07" kicker="Logbook — notes from the road" coords="Entries verified against hires" />
          <h2 className="mt-4 font-display text-4xl">Notes from the road.</h2>
          <p className="mt-2 max-w-2xl text-muted">Demonstration reviews for layout. Verified customer reviews will appear here after first completed hires.</p>
          <figure className="mt-8 border-l-2 border-amber bg-white p-7" style={{ borderRadius: 8 }}>
            <blockquote className="font-display text-2xl leading-snug text-charcoal sm:text-[1.8rem]">
              “We collected on a wet Friday and were drinking tea with the door open by four. The handover alone was worth it — calm, thorough, unhurried.”
            </blockquote>
            <figcaption className="mt-4 text-[0.88rem] text-muted">Demonstration review · Cotswold Lanes in The Alder · <span className="font-semibold text-success">Verified hire (demo)</span></figcaption>
          </figure>
          <div className="mt-5 grid gap-5 md:grid-cols-2">
            <figure className="border border-border bg-white p-6" style={{ borderRadius: 8 }}>
              <blockquote className="leading-relaxed text-charcoal/85">“First time towing. The accompanied drive settled every nerve. Solace swallowed two kids, a dog and a week of rain without complaint.”</blockquote>
              <figcaption className="mt-3 text-[0.82rem] text-muted">Demonstration review · <span className="font-semibold text-success">Verified hire (demo)</span></figcaption>
            </figure>
            <figure className="border border-border bg-white p-6" style={{ borderRadius: 8 }}>
              <blockquote className="leading-relaxed text-charcoal/85">“Rowan down the narrow lanes was the right call. Small van, big skies. The weight card and mirrors made the difference.”</blockquote>
              <figcaption className="mt-3 text-[0.82rem] text-muted">Demonstration review · <span className="font-semibold text-success">Verified hire (demo)</span></figcaption>
            </figure>
          </div>
        </div>
      </section>

      {/* 9 — FAQ */}
      <section className="bg-paper">
        <div className="mx-auto grid max-w-wide gap-10 px-5 py-16 sm:px-8 lg:grid-cols-12">
          <div className="lg:col-span-4">
            <SectionMarker index="08" kicker="Signals — questions, answered plainly" />
            <h2 className="mt-4 font-display text-3xl leading-tight">Common booking questions.</h2>
          </div>
          <div className="lg:col-span-7 lg:col-start-6">
            <dl className="divide-y divide-border border-y border-border">
              {FAQS.map((f) => (
                <div key={f.q} className="py-5">
                  <dt className="font-semibold text-charcoal">{f.q}</dt>
                  <dd className="mt-1.5 text-[0.95rem] leading-relaxed text-muted">{f.a}</dd>
                </div>
              ))}
            </dl>
          </div>
        </div>
      </section>

      <div className="border-y border-border bg-sand/60 py-6">
        <ScrollRoute from="LOG BOOK" to="LEDGER" note="every pound explained" />
      </div>

      {/* 10 — Final CTA */}
      <section className="grain relative overflow-hidden bg-forest text-paper">
        <div className="pointer-events-none absolute inset-0" aria-hidden="true"><TopoLines dark variant={0} /></div>
        <div className="relative z-[2] mx-auto grid max-w-wide items-center gap-8 px-5 py-16 sm:px-8 lg:grid-cols-12">
          <div className="lg:col-span-7">
            <div className="flex items-center gap-4">
              <Stamp size={88} dark />
              <p className="tick-label !text-sand/70">Final entry — the lanes are waiting</p>
            </div>
            <h2 className="mt-4 font-display leading-[0.98]" style={{ fontSize: "clamp(2.6rem, 5.5vw, 4.5rem)" }}>Travel at your own pace.</h2>
            <p className="mt-4 max-w-xl text-paper/80">Check live availability for your dates — no account needed, no payment until you choose a caravan.</p>
            <p className="mt-4 font-mono text-[0.72rem] uppercase tracking-[0.18em] text-paper/50">Bath → Cotswolds 28 mi · Bath → St Davids 180 mi · Bath → Brecon 60 mi</p>
          </div>
          <div className="lg:col-span-4 lg:col-start-9">
            <div className="relative border border-white/20 bg-forestDeep p-5" style={{ borderRadius: 10 }}>
              <p className="absolute -top-3 left-4 bg-amber px-2 py-0.5 font-mono text-[0.68rem] font-bold uppercase tracking-[0.14em] text-forest" style={{ borderRadius: 3 }}>Permit office — open</p>
              <div className="mt-2 grid gap-3">
                <Link href="/fleet" className="btn-primary !bg-amber !border-amber !text-forest hover:!bg-white">Browse the fleet</Link>
                <Link href="/booking" className="btn-secondary !bg-transparent !text-paper !border-white/40">Start a booking</Link>
              </div>
              <p className="mt-3 text-[0.8rem] text-paper/60">Free date changes within 14 days · Deposit 25% · Balance 28 days before</p>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
