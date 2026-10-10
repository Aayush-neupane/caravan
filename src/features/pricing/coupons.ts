import { prisma } from "@/lib/db";
import { EXTRAS } from "@/data/catalogue";

export type ResolvedCoupon = { kind: "percent" | "fixed"; value: number; code: string };

// Validate a coupon code server-side: active, unexpired, within usage,
// minimum booking value met, caravan restriction honoured.
// `preTaxBasePence` (rental + fees + extras) is the coupon base; legacy
// callers passing `rentalSubtotalPence` are still honoured (preferred: pre-tax).
export async function resolveCoupon(
  code: string | undefined,
  opts: { preTaxBasePence?: number; rentalSubtotalPence?: number; caravanSlug?: string }
): Promise<ResolvedCoupon | null> {
  const clean = (code ?? "").trim().toUpperCase();
  if (!clean) return null;
  const coupon = await prisma.coupon.findUnique({ where: { code: clean } });
  if (!coupon || !coupon.active) throw new Error(`Coupon “${clean}” is not valid.`);
  if (coupon.expiresAt && new Date(coupon.expiresAt) < new Date()) throw new Error(`Coupon “${clean}” has expired.`);
  if (coupon.maxUses != null && coupon.usedCount >= coupon.maxUses) throw new Error(`Coupon “${clean}” has reached its usage limit.`);
  const base = opts.preTaxBasePence ?? opts.rentalSubtotalPence ?? 0;
  if (base < coupon.minTotalPence) {
    throw new Error(`Coupon “${clean}” needs a pre-tax booking value of at least ${(coupon.minTotalPence / 100).toFixed(0)} AUD.`);
  }
  // caravanId stores a slug restriction when set — enforce even if the
  // caller omitted the slug (fail closed rather than skipping the check).
  // Comparison is case-insensitive + trimmed (slugs from UI/DB may differ).
  if (coupon.caravanId) {
    if (!opts.caravanSlug) throw new Error(`Coupon “${clean}” is restricted to a specific caravan.`);
    if (coupon.caravanId.toLowerCase().trim() !== (opts.caravanSlug ?? "").toLowerCase().trim()) {
      throw new Error(`Coupon “${clean}” does not apply to this caravan.`);
    }
  }
  if (coupon.kind !== "percent" && coupon.kind !== "fixed") throw new Error(`Coupon “${clean}” is misconfigured.`);
  return { kind: coupon.kind, value: coupon.value, code: clean };
}

export type ResolvedExtra = {
  slug: string;
  name: string;
  unitPricePence: number;
  qty: number;
  perNight: boolean;
  extraId: string | null;
};

// Resolve extra slugs to server-side prices (browser prices never trusted).
// DB record is authoritative for price/active/maxQty when seeded; static
// catalogue is fallback for unseeded preview. `per_person` catalogue units
// are charged once per unit of quantity (set qty = travellers).
// Pass caravanId to enforce the CaravanExtra allowlist.
// Batched: single findMany for extras + single findMany for the allowlist
// (no per-item N+1 awaits).
export async function resolveExtras(
  items: { slug: string; qty: number }[],
  opts?: { caravanId?: string }
): Promise<ResolvedExtra[]> {
  const active = items.filter((i) => i.qty && i.qty > 0);
  for (const item of active) {
    if (item.qty > 10) throw new Error(`Maximum 10 × ${item.slug} per booking.`);
  }
  if (active.length === 0) return [];
  const slugs = [...new Set(active.map((i) => i.slug))];
  const records = await prisma.extra.findMany({ where: { slug: { in: slugs } } }).catch(() => []);
  const bySlug = new Map(records.map((r) => [r.slug, r]));
  let allowed: Set<string> | null = null;
  if (opts?.caravanId && records.length > 0) {
    const links = await prisma.caravanExtra
      .findMany({ where: { caravanId: opts.caravanId, extraId: { in: records.map((r) => r.id) } } })
      .catch(() => []);
    allowed = new Set(links.map((l) => l.extraId));
  }
  const out: ResolvedExtra[] = [];
  for (const item of active) {
    const def = EXTRAS.find((x) => x.slug === item.slug);
    const record = bySlug.get(item.slug) ?? null;
    if (!def && !record) throw new Error(`Unknown extra: ${item.slug}.`);
    if (record && !record.active) throw new Error(`Extra ${item.slug} is not currently available.`);
    const maxQty = record?.maxQty ?? 4;
    if (item.qty > maxQty) throw new Error(`Maximum ${maxQty} × ${(record?.name ?? def!.name)} per booking.`);
    if (opts?.caravanId && record) {
      if (!allowed?.has(record.id)) throw new Error(`Extra ${item.slug} is not available for this caravan.`);
    }
    const unit = record?.unit ?? def!.unit;
    out.push({
      slug: item.slug,
      name: record?.name ?? def!.name,
      unitPricePence: record?.pricePence ?? def!.pricePence,
      qty: item.qty,
      perNight: unit === "per_night",
      extraId: record?.id ?? null,
    });
  }
  return out;
}
