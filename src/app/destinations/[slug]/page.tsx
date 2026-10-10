import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { DESTINATIONS, CARAVANS } from "@/data/catalogue";
import { FleetCard } from "@/components/fleet/FleetCard";

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
      <div className="relative bg-forest text-paper">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={d.heroImage} alt={d.name} className="absolute inset-0 h-full w-full object-cover opacity-50" />
        <div className="relative mx-auto max-w-content px-5 py-20 sm:px-8">
          <p className="tick-label !text-sand">{d.duration} · c. {d.distanceMi} miles</p>
          <h1 className="mt-3 font-display text-5xl sm:text-6xl">{d.name}</h1>
          <p className="mt-4 max-w-2xl text-[1.05rem] text-paper/85">{d.intro}</p>
        </div>
      </div>
      <div className="mx-auto grid max-w-wide gap-10 px-5 py-12 sm:px-8 lg:grid-cols-12">
        <div className="lg:col-span-7">
          <h2 className="font-display text-3xl">The route, stop by stop</h2>
          <ol className="mt-6 space-y-0 border-t border-border">
            {d.stops.map((s, i) => (
              <li key={s.name} className="grid gap-2 border-b border-border py-5 sm:grid-cols-12">
                <span className="font-display text-3xl text-amberDark sm:col-span-2">0{i + 1}</span>
                <div className="sm:col-span-10">
                  <p className="font-semibold text-charcoal">{s.name}</p>
                  <p className="mt-1 leading-relaxed text-charcoal/85">{s.note}</p>
                </div>
              </li>
            ))}
          </ol>
          <h2 className="mt-8 font-display text-3xl">Season &amp; practical notes</h2>
          <p className="mt-3 leading-relaxed text-charcoal/85"><strong>When:</strong> {d.season}</p>
          <p className="mt-2 leading-relaxed text-charcoal/85">{d.practical}</p>
          <p className="mt-4 border border-border bg-white p-4 text-[0.88rem] text-muted" style={{ borderRadius: 8 }}>
            Distances are approximate road miles between stops. Campsite availability, opening hours and restrictions
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
