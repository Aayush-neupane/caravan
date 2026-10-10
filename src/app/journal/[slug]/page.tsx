import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { JOURNAL } from "@/data/catalogue";

// Static catalogue articles share one publication date; per-article dates
// are not tracked. DB-backed articles should carry their own timestamps.
const ARTICLE_DATE = "2026-01-01";

export async function generateStaticParams() {
  return JOURNAL.map((j) => ({ slug: j.slug }));
}

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const j = JOURNAL.find((x) => x.slug === params.slug);
  return j ? { title: j.title, description: j.excerpt } : { title: "Not found" };
}

export default function ArticlePage({ params }: { params: { slug: string } }) {
  const j = JOURNAL.find((x) => x.slug === params.slug);
  if (!j) notFound();
  const related = JOURNAL.filter((x) => x.slug !== j.slug).slice(0, 2);
  return (
    <div className="bg-paper">
      <article className="mx-auto max-w-content px-5 py-12 sm:px-8">
        <p className="tick-label">{j.category}</p>
        <h1 className="mt-3 max-w-3xl font-display text-5xl leading-[1.03] text-charcoal">{j.title}</h1>
        <p className="mt-4 max-w-2xl text-[1.05rem] text-muted">{j.excerpt}</p>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={j.heroImage} alt={j.title} className="mt-8 aspect-[21/9] w-full rounded-lg object-cover" />
        <div className="mt-8 max-w-2xl space-y-5 text-[1.03rem] leading-relaxed text-charcoal/90">
          {j.body.map((p, i) => <p key={i} className={i === 0 ? "dropcap" : undefined}>{p}</p>)}
        </div>
        <div className="mt-10 border-t border-border pt-6">
          <p className="tick-label">Keep reading</p>
          <div className="mt-3 grid gap-4 sm:grid-cols-2">
            {related.map((r) => (
              <Link key={r.slug} href={`/journal/${r.slug}`} className="rounded-lg border border-border bg-white p-5 hover:border-forest">
                <p className="tick-label">{r.category}</p>
                <p className="mt-1 font-display text-xl">{r.title}</p>
              </Link>
            ))}
          </div>
        </div>
      </article>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
        "@context": "https://schema.org",
        "@type": "Article",
        headline: j.title,
        description: j.excerpt,
        image: j.heroImage,
        author: { "@type": "Organization", name: "Wattle & Wander" },
        publisher: { "@type": "Organization", name: "Wattle & Wander" },
        datePublished: ARTICLE_DATE,
        dateModified: ARTICLE_DATE,
      }) }} />
    </div>
  );
}
