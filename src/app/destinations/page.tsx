import type { Metadata } from "next";
import Link from "next/link";
import { DESTINATIONS } from "@/data/catalogue";
import { Framed, SectionMarker, TopoLines } from "@/components/editorial/Decor";
import { ScrollRoute } from "@/components/editorial/ScrollRoute";

export const metadata: Metadata = { title: "Destinations & itineraries", description: "Road-trip itineraries from Melbourne: Great Ocean Road, Grampians silo trail and Mornington Peninsula — distances, seasons and suitable caravans." };

export default function DestinationsPage() {
  return (
    <div className="bg-paper">
      <div className="relative overflow-hidden border-b border-border bg-sand/50">
        <TopoLines variant={0} />
        <div className="relative mx-auto max-w-wide px-5 py-12 sm:px-8">
          <SectionMarker index="C" kicker="Charts — start with the route" coords="Three surveyed itineraries" />
          <h1 className="mt-4 text-balance font-display leading-[0.98]" style={{ fontSize: "clamp(2.8rem, 6vw, 4.8rem)" }}>Start with the route.</h1>
        <p className="mt-4 max-w-2xl text-muted">Itineraries are written from driven kilometres, not brochure copy. No invented campsite availability, times or restrictions — check sites directly before you travel.</p>
        </div>
      </div>
      <div className="border-b border-border bg-paper py-6">
        <ScrollRoute from="MELB" to="APOSTLES" note="three surveyed runs" />
      </div>
      <div className="mx-auto max-w-wide px-5 py-12 sm:px-8">
        <div className="space-y-10">
          {DESTINATIONS.map((d) => (
            <article key={d.slug} className="grid gap-6 border-t border-border pt-8 lg:grid-cols-12">
              <div className="lg:col-span-5">
                <Link href={`/destinations/${d.slug}`} aria-label={`Read the ${d.name} itinerary`} className="block">
                  <Framed src={d.heroImage} alt={d.name} caption={d.name} meta={`c. ${d.distanceMi} KM`} radius={10} />
                </Link>
              </div>
              <div className="lg:col-span-6 lg:col-start-7">
                <p className="tick-label">{d.duration} · c. {d.distanceMi} km</p>
                <h2 className="mt-2 font-display text-4xl"><Link href={`/destinations/${d.slug}`} className="hover:text-forest">{d.name}</Link></h2>
                <p className="mt-3 leading-relaxed text-charcoal/85">{d.intro}</p>
                <ol className="mt-4 space-y-2">
                  {d.stops.map((s, i) => <li key={s.name} className="text-[0.93rem]"><span className="font-display text-lg text-amberInk">{i + 1}. </span><strong>{s.name}.</strong> <span className="text-muted">{s.note}</span></li>)}
                </ol>
                <Link href={`/destinations/${d.slug}`} className="mt-4 inline-block font-semibold text-forest underline underline-offset-4">Read the full itinerary →</Link>
              </div>
            </article>
          ))}
        </div>
      </div>
    </div>
  );
}
