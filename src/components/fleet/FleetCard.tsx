import Link from "next/link";
import type { CatalogueCaravan } from "@/data/catalogue";
import { gbp } from "@/lib/format";

export function FleetCard({ caravan, pickup, ret }: { caravan: CatalogueCaravan; pickup?: string; ret?: string }) {
  const qs = pickup && ret ? `?pickup=${pickup}&return=${ret}` : "";
  return (
    <article className="group overflow-hidden border border-border bg-white transition-colors hover:border-forest/50" style={{ borderRadius: 10 }}>
      <Link href={`/fleet/${caravan.slug}${qs}`} aria-label={`View ${caravan.name}`} className="block overflow-hidden">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={caravan.images[0].url.replace("w=1600", "w=900")}
          alt={caravan.images[0].alt}
          className="aspect-[16/10] w-full object-cover transition-transform duration-500 group-hover:scale-[1.04]"
          loading="lazy"
        />
      </Link>
      <div className="p-5">
        <p className="tick-label">{caravan.category}</p>
        <h3 className="mt-1 font-display text-2xl text-charcoal">
          <Link href={`/fleet/${caravan.slug}${qs}`} className="hover:text-forest">{caravan.name}</Link>
        </h3>
        <p className="mt-1 text-[0.9rem] text-muted">{caravan.tagline} · Sleeps {caravan.berths} · {caravan.mtplmKg.toLocaleString()} kg MTPLM</p>
        <p className="mt-3 line-clamp-2 text-[0.92rem] leading-relaxed text-charcoal/85">{caravan.description}</p>
        <div className="mt-4 flex items-end justify-between border-t border-border pt-4">
          <div>
            <p className="text-[0.75rem] font-semibold uppercase tracking-wide text-muted">From</p>
            <p className="text-lg font-bold text-forest">{gbp(caravan.baseNightlyPence)} <span className="text-[0.82rem] font-medium text-muted">/ night</span></p>
          </div>
          <Link href={`/fleet/${caravan.slug}${qs}`} className="btn-secondary group/btn !px-4 !py-2.5 !text-[0.85rem]">
            View &amp; book <span aria-hidden="true" className="inline-block transition-transform group-hover/btn:translate-x-0.5">→</span>
          </Link>
        </div>
      </div>
    </article>
  );
}
