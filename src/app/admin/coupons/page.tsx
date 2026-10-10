import { prisma } from "@/lib/db";
import { CouponCreate, CouponRow, VoucherRow } from "./editors";

export const metadata = { title: "Coupons", robots: { index: false, follow: false } };

export default async function CouponsAdmin() {
  let coupons: { id: string; code: string; kind: string; value: number; minTotal: number; maxUses: number | null; used: number; expires: string | null; caravan: string | null; active: boolean }[] = [];
  let vouchers: { code: string; balance: number; active: boolean }[] = [];
  try {
    coupons = (await prisma.coupon.findMany({ orderBy: { code: "asc" } })).map((c) => ({
      id: c.id, code: c.code, kind: c.kind, value: c.value, minTotal: c.minTotalPence,
      maxUses: c.maxUses, used: c.usedCount,
      expires: c.expiresAt ? c.expiresAt.toISOString().slice(0, 10) : null,
      caravan: c.caravanId, active: c.active,
    }));
    vouchers = (await prisma.voucher.findMany({ orderBy: { code: "asc" } })).map((v) => ({ code: v.code, balance: v.balancePence, active: v.active }));
  } catch { /* ignore */ }
  return (
    <div>
      <p className="tick-label">Live on the next quote</p>
      <h1 className="mt-1 font-display text-4xl">Coupons &amp; gift vouchers</h1>
      <p className="mt-2 max-w-2xl text-[0.9rem] text-muted">
        Percent (1–60) or fixed codes with minimum spend, usage caps, expiry and caravan restrictions — all
        validated server-side, usage increments atomic. Spent codes cannot be deleted, only disabled.
      </p>
      <h2 className="mt-6 font-semibold">Coupons</h2>
      <div className="mt-2 border border-border bg-white px-4 py-1" style={{ borderRadius: 10 }}>
        {coupons.map((c) => <CouponRow key={c.id} row={c} />)}
        {coupons.length === 0 && <p className="py-2 text-[0.9rem] text-muted">No codes — create the first below.</p>}
      </div>
      <CouponCreate />
      <h2 className="mt-8 font-semibold">Gift vouchers</h2>
      <p className="mt-1 text-[0.85rem] text-muted">Balances are ledger money — enable or disable here, never edit.</p>
      <div className="mt-2 border border-border bg-white px-4 py-1" style={{ borderRadius: 10 }}>
        {vouchers.map((v) => <VoucherRow key={v.code} row={v} />)}
        {vouchers.length === 0 && <p className="py-2 text-[0.9rem] text-muted">No vouchers.</p>}
      </div>
    </div>
  );
}
