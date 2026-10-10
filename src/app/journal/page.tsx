import type { Metadata } from "next";
import Link from "next/link";
import { JOURNAL } from "@/data/catalogue";

export const metadata: Metadata = { title: "Journal", description: "Caravan guides, towing advice, packing lists and slow-travel writing from Hartley & Moor." };

const CATS = ["Travel inspiration", "Caravan guides", "Towing advice", "Packing advice", "Destination itineraries", "Caravan care"];

export default function JournalPage({ searchParams }: { searchParams: { cat?: string } }) {
  const list = searchParams.cat ? JOURNAL.filter((j) => j.category === searchParams.cat) : JOURNAL;
  return (
    <div className="bg-paper">
      <div className="mx-auto max-w-wide px-5 py-12 sm:px-8">
        <p className="tick-label">Journal</p>
        <h1 className="mt-3 font-display text-5xl text-charcoal">Useful, not algorithmic.</h1>
        <div className="mt-6 flex flex-wrap gap-2">
          <Link href="/journal" className={`border px-3 py-1.5 text-[0.83rem] font-semibold ${!searchParams.cat ? "border-forest bg-forest text-white" : "border-border bg-white text-charcoal"}`} style={{ borderRadius: 6 }}>All</Link>
          {CATS.map((c) => (
            <Link key={c} href={`/journal?cat=${encodeURIComponent(c)}`} className={`border px-3 py-1.5 text-[0.83rem] font-semibold ${searchParams.cat === c ? "border-forest bg-forest text-white" : "border-border bg-white text-charcoal"}`} style={{ borderRadius: 6 }}>{c}</Link>
          ))}
        </div>
        <div className="mt-8 grid gap-6 md:grid-cols-3">
          {list.map((j) => (
            <article key={j.slug} className="group border border-border bg-white transition-colors hover:border-forest/50" style={{ borderRadius: 10 }}>
              <Link href={`/journal/${j.slug}`} className="block overflow-hidden" style={{ borderRadius: "10px 10px 0 0" }} aria-label={j.title}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={j.heroImage} alt="" className="aspect-[16/10] w-full object-cover transition-transform duration-500 group-hover:scale-[1.04]" loading="lazy" />
              </Link>
              <div className="p-5">
                <p className="tick-label">{j.category}</p>
                <h2 className="mt-2 font-display text-2xl leading-tight"><Link href={`/journal/${j.slug}`} className="hover:text-forest">{j.title}</Link></h2>
                <p className="mt-2 text-[0.9rem] text-muted">{j.excerpt}</p>
              </div>
            </article>
          ))}
        </div>
        {list.length === 0 && <p className="mt-8 text-muted">No articles in this category yet — the archive grows with the seasons.</p>}
      </div>
    </div>
  );
}
