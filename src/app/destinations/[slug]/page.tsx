import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { DESTINATIONS, CARAVANS } from "@/data/catalogue";
import { FleetCard } from "@/components/fleet/FleetCard";
import { RouteDraw } from "@/components/editorial/RouteDraw";

export async function generateStaticParams() {
  return DESTINATIONS.map((d) => ({ slug: d.slug }));
}

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const d = DESTINATIONS.find((x) => x.slug === params.slug);
  return d ? { title: d.name, description: d.intro } : { title: "Not found" };
}

export default function DestinationDetail({ params }: { params: { slug: string } }) {
  const d = DESTINATIONS.find((x) => x.slug === params.slug);
  if (!d) notFound();
  return (
    <div className="bg-paper">
      <div className="grain relative overflow-hidden bg-forest text-paper">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={d.heroImage} alt={d.name} className="absolute inset-0 h-full w-full object-cover opacity-50" />
        <div className="relative z-[2] mx-auto max-w-content px-5 py-20 sm:px-8">
          <p className="tick-label !text-sand">Expedition chart · {d.duration} · c. {d.distanceMi} miles</p>
          <div className="mt-3 flex flex-wrap items-end gap-x-8 gap-y-2">
            <h1 className="font-display leading-[0.95]" style={{ fontSize: "clamp(3rem, 7vw, 5.5rem)" }}>{d.name}</h1>
            <p className="pb-2 font-display text-5xl text-amber sm:text-6xl" aria-label={`About ${d.distanceMi} miles`}>{d.distanceMi}<span className="font-sans text-base text-paper/60"> mi</span></p>
          </div>
          <p className="mt-4 max-w-2xl text-[1.05rem] text-paper/85">{d.intro}</p>
        </div>
      </div>
      <div className="mx-auto grid max-w-wide gap-10 px-5 py-12 sm:px-8 lg:grid-cols-12">
        <div className="lg:col-span-7">
          <h2 className="font-display text-3xl">The route, stop by stop</h2>
          <RouteDraw stops={d.stops} />
          <h2 className="mt-8 font-display text-3xl">Season &amp; practical notes</h2>
          <p className="mt-3 leading-relaxed text-charcoal/85"><strong>When:</strong> {d.season}</p>
          <p className="mt-2 leading-relaxed text-charcoal/85">{d.practical}</p>
          <p className="mt-4 border border-border bg-white p-4 text-[0.88rem] text-muted" style={{ borderRadius: 8 }}>
            Distances are approximate road kilometres between stops. Campsite availability, opening hours and restrictions
            change — confirm directly with sites. If animation is disabled, this page reads identically.
          </p>
        </div>
        <aside className="lg:col-span-4 lg:col-start-9">
          <p className="tick-label">Suitable caravans</p>
          <div className="mt-4 space-y-5">
            {CARAVANS.slice(0, 2).map((c) => <FleetCard key={c.slug} caravan={c} />)}
          </div>
          <Link href="/fleet" className="btn-primary mt-5 w-full">Check availability</Link>
        </aside>
      </div>
    </div>
  );
}
