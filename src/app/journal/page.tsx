import type { Metadata } from "next";
import Link from "next/link";
import { JOURNAL } from "@/data/catalogue";
import { Framed } from "@/components/editorial/Decor";

export const metadata: Metadata = { title: "Journal", description: "Caravan guides, towing advice, packing lists and slow-travel writing from Wattle & Wander." };

const CATS = ["Travel inspiration", "Caravan guides", "Towing advice", "Packing advice", "Destination itineraries", "Caravan care"];

export default function JournalPage({ searchParams }: { searchParams: { cat?: string } }) {
  const list = searchParams.cat ? JOURNAL.filter((j) => j.category === searchParams.cat) : JOURNAL;
  return (
    <div className="bg-paper">
      <div className="mx-auto max-w-wide px-5 py-12 sm:px-8">
        <p className="tick-label">Journal</p>
        <h1 className="mt-3 font-display text-5xl text-charcoal">Useful, not algorithmic.</h1>
        <div className="mt-6 flex flex-wrap gap-2">
          <Link href="/journal" className={`rounded-md border px-3 py-1.5 text-[0.83rem] font-semibold ${!searchParams.cat ? "border-forest bg-forest text-white" : "border-border bg-white text-charcoal"}`}>All</Link>
          {CATS.map((c) => (
            <Link key={c} href={`/journal?cat=${encodeURIComponent(c)}`} className={`rounded-md border px-3 py-1.5 text-[0.83rem] font-semibold ${searchParams.cat === c ? "border-forest bg-forest text-white" : "border-border bg-white text-charcoal"}`}>{c}</Link>
          ))}
        </div>
        <div className="mt-8 grid gap-6 md:grid-cols-3">
          {list.map((j) => (
            <article key={j.slug} className="group rounded-lg border border-border bg-white transition-colors hover:border-forest/50">
              <div className="p-2 pb-0">
              <Link href={`/journal/${j.slug}`} className="block" aria-label={j.title}>
                <Framed src={j.heroImage} alt={j.title} caption={j.category} meta="FIELD NOTES" />
              </Link>
              </div>
              <div className="p-5">
                <p className="tick-accent">{j.category}</p>
                <h2 className="mt-2 font-display text-2xl leading-tight"><Link href={`/journal/${j.slug}`} className="hover:text-forest">{j.title}</Link></h2>
                <p className="mt-2 text-[0.9rem] text-muted">{j.excerpt}</p>
              </div>
            </article>
          ))}
        </div>
        {list.length === 0 && (
          <div className="mt-8 rounded-lg border border-border bg-white p-8 text-center" role="status">
            <p className="text-muted">No articles in this category yet — the archive grows with the seasons.</p>
            <Link href="/journal" className="btn-secondary mt-4 inline-block">View all articles</Link>
          </div>
        )}
      </div>
    </div>
  );
}
