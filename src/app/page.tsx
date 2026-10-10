import Link from "next/link";
import type { Metadata } from "next";
import { BookingSearchPanel } from "@/components/brand/BookingSearchPanel";
import { Reveal, SectionHeading } from "@/components/editorial/Reveal";
import { HeroImage } from "@/components/editorial/HeroImage";
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
      {/* 1 — Cinematic hero with solid booking panel */}
      <section className="relative bg-forest text-paper" aria-label="Introduction">
        <div className="absolute inset-0 overflow-hidden" aria-hidden="true">
          <HeroImage
            src="https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?auto=format&fit=crop&w=2200&q=75"
            alt=""
          />
          <div className="absolute inset-0" style={{ background: "rgba(18,32,25,0.55)" }} />
        </div>
        <div className="relative mx-auto grid max-w-wide gap-10 px-5 pb-14 pt-16 sm:px-8 lg:grid-cols-12 lg:pt-24">
          <div className="lg:col-span-7">
            <p className="tick-label !text-sand">Caravan hire · Bath, Somerset</p>
            <h1 className="mt-4 font-display text-[3.2rem] leading-[0.98] sm:text-[4.5rem]" style={{ letterSpacing: "-0.015em" }}>
              Leave room for the unexpected.
            </h1>
            <p className="mt-5 max-w-xl text-[1.1rem] leading-relaxed text-paper/85">
              Thoughtfully equipped caravans for the freedom to travel at your own pace —
              across the Cotswolds, the South West and Wales.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link href="/fleet" className="btn-primary !border-white/20">Meet the fleet</Link>
              <Link href="/destinations" className="btn-secondary !bg-transparent !text-paper !border-white/40 hover:!border-white">Road-trip itineraries</Link>
            </div>
            <dl className="mt-8 grid max-w-lg grid-cols-3 gap-4 border-t border-white/20 pt-5 text-[0.85rem]">
              <div><dt className="text-paper/60">Caravans</dt><dd className="mt-1 font-display text-2xl">Three</dd></div>
              <div><dt className="text-paper/60">Sleeps</dt><dd className="mt-1 font-display text-2xl">2 – 4</dd></div>
              <div><dt className="text-paper/60">From</dt><dd className="mt-1 font-display text-2xl">{gbp(9500)}<span className="text-sm text-paper/60"> /nt</span></dd></div>
            </dl>
          </div>
          <div className="lg:col-span-5 lg:pt-10">
            <div className="bg-paper p-2" style={{ borderRadius: 12 }}>
              <BookingSearchPanel compact />
            </div>
          </div>
        </div>
      </section>

      {/* 2 — Brand promise */}
      <section className="border-b border-border bg-paper">
        <div className="mx-auto grid max-w-content gap-8 px-5 py-14 sm:px-8 lg:grid-cols-12">
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
      <section className="bg-paper" aria-label="Featured caravans">
        <div className="mx-auto max-w-wide px-5 py-16 sm:px-8">
          <SectionHeading
            kicker="The fleet"
            title="Three caravans, three ways to travel."
            lede="Genuine inventory with verified weights and nightly rates. Choose dates to see live availability."
          />
          <div className="mt-10 grid gap-6 md:grid-cols-3">
            {CARAVANS.map((c, i) => (
              <Reveal key={c.slug} delay={i * 0.06}>
                <FleetCard caravan={c} />
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* 4 — Rental experience editorial (offset image + text) */}
      <section className="border-y border-border bg-sand/60">
        <div className="mx-auto grid max-w-wide gap-10 px-5 py-16 sm:px-8 lg:grid-cols-12">
          <div className="lg:col-span-7">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="https://images.unsplash.com/photo-1510312305653-8ed496efae75?auto=format&fit=crop&w=1400&q=70"
              alt="Caravan interior in morning light with made bed and timber cupboards"
              className="aspect-[16/10] w-full object-cover"
              style={{ borderRadius: 10 }}
              loading="lazy"
            />
            <div className="mt-4 grid grid-cols-2 gap-4">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="https://images.unsplash.com/photo-1556911220-bff31c812dba?auto=format&fit=crop&w=800&q=65" alt="Compact fitted kitchen with hob and worktop" className="aspect-[4/3] w-full object-cover" style={{ borderRadius: 8 }} loading="lazy" />
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="https://images.unsplash.com/photo-1523987355523-c7b5b0dd90a7?auto=format&fit=crop&w=800&q=65" alt="Caravan among pines in soft light" className="aspect-[4/3] w-full object-cover" style={{ borderRadius: 8 }} loading="lazy" />
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
        <div className="mx-auto max-w-content px-5 py-16 sm:px-8">
          <SectionHeading kicker="How it works" title="Eight steps, one calm week." lede="From first search to deposit return — what actually happens, in order." />
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
      <section className="border-y border-border bg-forest text-paper">
        <div className="mx-auto max-w-wide px-5 py-16 sm:px-8">
          <SectionHeading dark kicker="Destinations" title="Written routes, not pins on a map." lede="Three starting itineraries with honest distances, seasonal notes and suitable vans." />
          <div className="mt-10 space-y-8">
            {DESTINATIONS.map((d, i) => (
              <Reveal key={d.slug}>
                <article className={`grid gap-6 border-t border-white/15 pt-8 lg:grid-cols-12 ${i % 2 ? "" : ""}`}>
                  <div className="lg:col-span-5">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={d.heroImage} alt={`${d.name} landscape`} className="aspect-[16/10] w-full object-cover" style={{ borderRadius: 10 }} loading="lazy" />
                  </div>
                  <div className="lg:col-span-6 lg:col-start-7">
                    <p className="tick-label !text-sand/70">{d.duration} · c. {d.distanceMi} miles</p>
                    <h3 className="mt-2 font-display text-3xl">{d.name}</h3>
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
            <SectionHeading kicker="Included" title="What every hire includes." lede="No tiers, no unlockables. The van leaves ready." />
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
          <SectionHeading kicker="Travellers" title="Notes from the road." lede="Demonstration reviews for layout. Verified customer reviews will appear here after first completed hires." />
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
          <div className="lg:col-span-4"><SectionHeading kicker="Questions" title="Common booking questions." /></div>
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

      {/* 10 — Final CTA */}
      <section className="bg-forest text-paper">
        <div className="mx-auto grid max-w-wide items-center gap-8 px-5 py-16 sm:px-8 lg:grid-cols-12">
          <div className="lg:col-span-7">
            <h2 className="font-display text-4xl leading-tight sm:text-5xl">The lanes are waiting. Travel at your own pace.</h2>
            <p className="mt-4 max-w-xl text-paper/80">Check live availability for your dates — no account needed, no payment until you choose a caravan.</p>
          </div>
          <div className="lg:col-span-4 lg:col-start-9">
            <div className="border border-white/20 bg-forestDeep p-5" style={{ borderRadius: 10 }}>
              <p className="tick-label !text-sand/70">Next step</p>
              <div className="mt-3 grid gap-3">
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
