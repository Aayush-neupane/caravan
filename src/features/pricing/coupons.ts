import { prisma } from "@/lib/db";
import { EXTRAS } from "@/data/catalogue";

export type ResolvedCoupon = { kind: "percent" | "fixed"; value: number; code: string };

// Validate a coupon code server-side: active, unexpired, within usage,
// minimum booking value met, caravan restriction honoured.
export async function resolveCoupon(
  code: string | undefined,
  opts: { rentalSubtotalPence: number; caravanSlug?: string }
): Promise<ResolvedCoupon | null> {
  const clean = (code ?? "").trim().toUpperCase();
  if (!clean) return null;
  const coupon = await prisma.coupon.findUnique({ where: { code: clean } });
  if (!coupon || !coupon.active) throw new Error(`Coupon “${clean}” is not valid.`);
  if (coupon.expiresAt && new Date(coupon.expiresAt) < new Date()) throw new Error(`Coupon “${clean}” has expired.`);
  if (coupon.maxUses != null && coupon.usedCount >= coupon.maxUses) throw new Error(`Coupon “${clean}” has reached its usage limit.`);
  if (opts.rentalSubtotalPence < coupon.minTotalPence) {
    throw new Error(`Coupon “${clean}” needs a booking of at least ${(coupon.minTotalPence / 100).toFixed(0)} GBP before extras.`);
  }
  // caravanId stores a slug restriction when set.
  if (coupon.caravanId && opts.caravanSlug && coupon.caravanId !== opts.caravanSlug) {
    throw new Error(`Coupon “${clean}” does not apply to this caravan.`);
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
// `per_person` catalogue units are charged once per unit of quantity.
export async function resolveExtras(items: { slug: string; qty: number }[]): Promise<ResolvedExtra[]> {
  const out: ResolvedExtra[] = [];
  for (const item of items) {
    if (!item.qty || item.qty <= 0) continue;
    if (item.qty > 10) throw new Error("Maximum 10 of any extra per booking.");
    const def = EXTRAS.find((x) => x.slug === item.slug);
    if (!def) throw new Error(`Unknown extra: ${item.slug}.`);
    const record = await prisma.extra.findUnique({ where: { slug: item.slug } }).catch(() => null);
    out.push({
      slug: item.slug,
      name: def.name,
      unitPricePence: def.pricePence,
      qty: item.qty,
      perNight: def.unit === "per_night",
      extraId: record?.id ?? null,
    });
  }
  return out;
}
