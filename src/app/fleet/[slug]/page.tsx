import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CARAVANS, EXTRAS, type CatalogueCaravan } from "@/data/catalogue";
import { getLiveCaravans } from "@/features/catalogue/live";
import { gbp } from "@/lib/format";
import { CaravanBookingWidget } from "./widget";
import { Lightbox } from "@/components/fleet/Lightbox";

export const revalidate = 60;

export async function generateStaticParams() {
  return CARAVANS.map((c) => ({ slug: c.slug }));
}

async function findCaravan(slug: string): Promise<CatalogueCaravan | null> {
  const live = await getLiveCaravans();
  // Unpublished vans 404 even though the slug pre-rendered.
  return live.find((x) => x.slug === slug) ?? null;
}

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const c = await findCaravan(params.slug);
  if (!c) return { title: "Not found" };
  return {
    title: `${c.name} — ${c.tagline}`,
    description: c.description.slice(0, 155),
    openGraph: { title: `${c.name} · Wattle & Wander`, description: c.tagline, type: "article" },
  };
}

export default async function CaravanDetail({ params, searchParams }: { params: { slug: string }; searchParams: Record<string, string | undefined> }) {
  const c = await findCaravan(params.slug);
  if (!c) return notFound();

  // Gallery remainder after the two hero frames; the floorplan card joins
  // the same row.
  const rest = c.images.slice(3);
  // Excess mileage and per-caravan extras come from the live record when the
  // catalogue layer supplies them, otherwise from the shared catalogue.
  const excessMileagePencePerMile = c.excessMileagePencePerMile ?? 35;
  const extras = c.extras?.length ? c.extras : EXTRAS.slice(0, 5);

  return (
    <div className="bg-paper">
      <div className="mx-auto max-w-wide px-5 pt-10 sm:px-8">
        <p className="text-[0.85rem] text-muted"><Link href="/fleet" className="underline">Fleet</Link> / {c.name}</p>
        <div className="mt-3 grid gap-8 lg:grid-cols-12">
          <div className="lg:col-span-8">
            <p className="tick-label">{c.category} · {c.location}</p>
            <h1 className="mt-2 font-display text-5xl leading-[1.02] text-charcoal sm:text-6xl">{c.name}</h1>
            <p className="mt-3 text-[1.05rem] text-muted">{c.tagline} · Sleeps {c.berths} · {c.lengthM}m × {c.widthM}m · {c.mtplmKg.toLocaleString()} kg MTPLM</p>
          </div>
          <div className="lg:col-span-4 lg:pt-8">
            <p className="text-[0.78rem] font-semibold uppercase tracking-wide text-muted">From</p>
            <p className="font-display text-4xl text-forest">{gbp(c.baseNightlyPence)}<span className="font-sans text-base text-muted"> / night</span></p>
            <p className="mt-1 text-[0.82rem] text-muted">Weekend {gbp(c.weekendNightlyPence)} · 7+ nights −{c.weeklyDiscountPct}% · Cleaning {gbp(c.cleaningFeePence)} · Deposit {gbp(c.securityDepositPence)} refundable</p>
          </div>
        </div>

        {/* Gallery with full-screen viewer */}
        <div className="mt-8">
          <Lightbox images={c.images} name={c.name} />
        </div>
        {/* Gallery remainder: fewer than three images would leave an orphan
            column, so the row drops to two columns instead. */}
        <div className={`mt-4 grid gap-4 ${rest.length + 1 >= 3 ? "sm:grid-cols-3" : rest.length + 1 === 2 ? "grid-cols-2" : ""}`}>
          {rest.map((im) => (
            <figure key={im.url}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={im.url.replace("w=1600", "w=800")} alt={im.alt} className="aspect-[4/3] w-full rounded-lg object-cover" loading="lazy" />
              <figcaption className="mt-1.5 text-[0.78rem] text-muted">{im.kind} · {im.alt.slice(0, 60)}</figcaption>
            </figure>
          ))}
          <div className="rounded-lg border border-border bg-white p-5">
            <p className="tick-label">Floorplan</p>
            <p className="mt-2 text-[0.9rem] leading-relaxed text-charcoal/85">{c.floorplanNotes}</p>
            <p className="mt-3 border-t border-border pt-3 text-[0.82rem] text-muted">Scaled floorplan illustration supplied at handover and in the collection pack. Dimensions verified against manufacturer plate.</p>
          </div>
        </div>

        <div className="mt-10 grid gap-10 pb-16 lg:grid-cols-12">
          <div className="lg:col-span-7">
            <h2 className="font-display text-3xl text-charcoal">About {c.name}</h2>
            <p className="mt-3 leading-relaxed text-charcoal/85">{c.description}</p>
            <h3 className="mt-8 font-semibold text-charcoal">Technical specifications</h3>
            <table className="table-quiet mt-3 bg-white">
              <tbody>
                <tr><td className="font-semibold">MTPLM</td><td>{c.mtplmKg.toLocaleString()} kg</td></tr>
                <tr><td className="font-semibold">External</td><td>{c.lengthM} m × {c.widthM} m</td></tr>
                <tr><td className="font-semibold">Berths / travellers</td><td>{c.berths} berths · up to {c.maxTravellers} travellers</td></tr>
                <tr><td className="font-semibold">Kitchen</td><td>{c.kitchen}</td></tr>
                <tr><td className="font-semibold">Washroom</td><td>{c.shower ? "Separate shower, cassette toilet, hot water" : "Cassette toilet, hot water"}</td></tr>
                <tr><td className="font-semibold">Heating</td><td>{c.heating ? "Blown-air gas + electric, thermostat" : "—"}</td></tr>
                <tr><td className="font-semibold">Mileage</td><td>{c.mileagePerNight} miles/night included · excess {gbp(excessMileagePencePerMile)}/mile</td></tr>
                <tr><td className="font-semibold">Towing</td><td>{c.towRequirement}</td></tr>
                <tr><td className="font-semibold">Pickup</td><td>{c.location} · Mon–Sat 09:00–16:00</td></tr>
              </tbody>
            </table>
            <h3 className="mt-8 font-semibold text-charcoal">Included equipment</h3>
            <ul className="mt-3 grid gap-2 text-[0.93rem] text-charcoal/85 sm:grid-cols-2">
              {c.equipment.map((e) => <li key={e} className="rounded-md border border-border bg-white px-3 py-2">✓ {e}</li>)}
            </ul>
            <h3 className="mt-8 font-semibold text-charcoal">Optional extras</h3>
            <ul className="mt-3 divide-y divide-border border-y border-border">
              {extras.map((e) => (
                <li key={e.slug} className="flex items-center justify-between gap-4 py-3">
                  <div><p className="font-medium text-charcoal">{e.name}</p><p className="text-[0.85rem] text-muted">{e.description}</p></div>
                  <p className="whitespace-nowrap text-[0.9rem] font-semibold text-forest">{gbp(e.pricePence)}</p>
                </li>
              ))}
            </ul>
            <p className="mt-6 text-[0.85rem] text-muted">
              Cancellation: full refund to 28 days before collection, 50% to 14 days, deposit retained within 14 days.
              Security deposit ({gbp(c.securityDepositPence)}) is refundable and never treated as revenue.
              Full terms: <Link href="/legal/terms" className="underline">rental terms</Link>.
            </p>
          </div>
          <aside className="lg:col-span-5">
            <div className="lg:sticky lg:top-24">
              <CaravanBookingWidget
                slug={c.slug}
                initialPickup={searchParams.pickup}
                initialReturn={searchParams.return}
                info={{ name: c.name, maxTravellers: c.maxTravellers, minNights: c.minNights, maxNights: c.maxNights, securityDepositPence: c.securityDepositPence }}
              />
            </div>
          </aside>
        </div>
      </div>

      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
        "@context": "https://schema.org", "@type": "Product", name: `${c.name} — caravan hire`,
        description: c.tagline, offers: { "@type": "Offer", priceCurrency: "AUD", price: (c.baseNightlyPence/100).toFixed(2), availability: "https://schema.org/InStock" },
      }) }} />
    </div>
  );
}
