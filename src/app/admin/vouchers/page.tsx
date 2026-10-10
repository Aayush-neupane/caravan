import { prisma } from "@/lib/db";
import { gbp } from "@/lib/format";
import { VoucherCreate, VoucherRow } from "./editors";

export const metadata = { title: "Gift vouchers", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

export default async function VouchersAdmin() {
  let vouchers: { code: string; balance: number; initial: number; active: boolean; expires: string | null }[] = [];
  let total = 0;
  let liability = 0;
  try {
    const rows = await prisma.voucher.findMany({ orderBy: { code: "asc" } });
    total = await prisma.voucher.count();
    vouchers = rows.map((v) => ({
      code: v.code,
      balance: v.balancePence,
      initial: v.initialPence,
      active: v.active,
      expires: v.expiresAt ? v.expiresAt.toISOString().slice(0, 10) : null,
    }));
    liability = vouchers.filter((v) => v.active).reduce((a, v) => a + v.balance, 0);
  } catch { /* ignore */ }

  return (
    <div>
      <p className="tick-label">Redeemable at checkout</p>
      <h1 className="mt-1 font-display text-4xl">Gift vouchers</h1>
      <p className="mt-2 max-w-2xl text-[0.9rem] text-muted">
        Issued credit, redeemed against the deposit due on a booking. Balances are ledger money —
        they are debited only when a reservation is actually created, and can never be edited or
        overspent. Spent codes stay for the audit trail; disable one to stop it being redeemed.
      </p>
      <table className="table-quiet mt-4 bg-white">
        <tbody>
          <tr><td className="font-semibold">Codes issued</td><td>{total}</td></tr>
          <tr><td className="font-semibold">Unredeemed liability (live codes)</td><td>{gbp(liability)}</td></tr>
        </tbody>
      </table>
      <h2 className="mt-6 font-semibold">Codes</h2>
      <div className="mt-2 border border-border bg-white px-4 py-1" style={{ borderRadius: 10 }}>
        {vouchers.map((v) => <VoucherRow key={v.code} row={v} />)}
        {vouchers.length === 0 && <p className="py-2 text-[0.9rem] text-muted">No vouchers — issue the first below.</p>}
      </div>
      <VoucherCreate />
    </div>
  );
}
