import { prisma } from "@/lib/db";
import { CARAVANS, type CatalogueCaravan } from "@/data/catalogue";

// Live fleet for public pages: published, non-archived DB caravans overlaid
// onto catalogue marketing copy (images, floorplans, equipment stay in the
// catalogue file). Unseeded DB or query failure falls back to the static
// catalogue, so the site always renders. Admin edits to ops fields
// (rates, fees, stay limits, travellers, publish state) take effect here.
export async function getLiveCaravans(): Promise<CatalogueCaravan[]> {
  try {
    const rows = await prisma.caravan.findMany({
      include: { images: { orderBy: { sort: "asc" } } },
    });
    // Empty table (unseeded) or DB error → static catalogue. A seeded table
    // with everything unpublished/archived honestly yields an EMPTY public
    // fleet — never fall back to static rows that would un-hide vans.
    if (rows.length === 0) return CARAVANS;
    const base = new Map(CARAVANS.map((c) => [c.slug, c]));
    const out: CatalogueCaravan[] = [];
    for (const r of rows) {
      if (!r.published || r.archived) continue;
      const f = base.get(r.slug);
      if (!f) continue; // DB-only row without marketing copy stays out of public views
      out.push({
        ...f,
        name: r.name,
        tagline: r.tagline,
        description: r.description,
        berths: r.berths,
        maxTravellers: r.maxTravellers,
        baseNightlyPence: r.baseNightlyPence,
        weekendNightlyPence: r.weekendNightlyPence ?? f.weekendNightlyPence,
        weeklyDiscountPct: r.weeklyDiscountPct,
        minNights: r.minNights,
        maxNights: r.maxNights,
        cleaningFeePence: r.cleaningFeePence,
        securityDepositPence: r.securityDepositPence,
        towRequirement: r.towRequirement,
        images:
          r.images.length > 0
            ? r.images.map((i) => ({ url: i.url, alt: i.alt, kind: i.kind }))
            : f.images,
      });
    }
    return out;
  } catch {
    return CARAVANS;
  }
}
