import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { authOptions, can } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { gateMutation } from "@/lib/security";

const Body = z.object({ active: z.boolean() }).strict();

// PATCH /api/admin/vouchers/:code — enable/disable a gift voucher.
// Balances are ledger money: they are never edited here, only gated.
export async function PATCH(req: Request, { params }: { params: { code: string } }) {
  const denied = gateMutation(req, "admin:coupons", 60, 60_000);
  if (denied) return denied;
  const session = await getServerSession(authOptions);
  const role = (session?.user as { role?: string } | undefined)?.role;
  if (!session || !can("coupons:write", role)) return NextResponse.json({ error: "Staff access required." }, { status: 403 });

  let body: z.infer<typeof Body>;
  try {
    body = Body.parse(await req.json());
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }
  const row = await prisma.voucher.findUnique({ where: { code: params.code } });
  if (!row) return NextResponse.json({ error: "Not found." }, { status: 404 });
  await prisma.voucher.update({ where: { code: row.code }, data: { active: body.active } });
  await prisma.auditLog.create({
    data: { action: body.active ? "vouchers:enable" : "vouchers:disable", resource: "voucher", resourceId: row.id, detail: `${row.code} by ${session.user?.email ?? role}` },
  });
  return NextResponse.json({ ok: true });
}
