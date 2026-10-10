import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { authOptions, can } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { gateMutation } from "@/lib/security";

const PatchBody = z.object({
  value: z.number().int().min(1).optional(),
  minTotalPence: z.number().int().min(0).optional(),
  maxUses: z.number().int().min(1).max(100000).nullable().optional(),
  expiresAt: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable().optional(),
  caravanSlug: z.string().min(1).max(80).nullable().optional(),
  active: z.boolean().optional(),
}).strict().refine((o) => Object.keys(o).length > 0, "Nothing to update.");

// PATCH /api/admin/coupons/:id — edit limits, window, restriction, active.
// Code and kind are immutable (usage history references them). DELETE removes
// unused codes only — spent codes stay for the audit trail.
export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const denied = gateMutation(req, "admin:coupons", 60, 60_000);
  if (denied) return denied;
  const session = await getServerSession(authOptions);
  const role = (session?.user as { role?: string } | undefined)?.role;
  if (!session || !can("coupons:write", role)) return NextResponse.json({ error: "Staff access required." }, { status: 403 });

  let body: z.infer<typeof PatchBody>;
  try {
    body = PatchBody.parse(await req.json());
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }
  const row = await prisma.coupon.findUnique({ where: { id: params.id } });
  if (!row) return NextResponse.json({ error: "Not found." }, { status: 404 });
  if (body.value != null && row.kind === "percent" && (body.value < 1 || body.value > 60)) {
    return NextResponse.json({ error: "Percent is 1–60." }, { status: 422 });
  }
  if (body.value != null && row.kind === "fixed" && body.value < 100) {
    return NextResponse.json({ error: "Fixed is at least 100p." }, { status: 422 });
  }
  if (body.maxUses != null && body.maxUses < row.usedCount) {
    return NextResponse.json({ error: `Already used ${row.usedCount}× — max cannot go below that.` }, { status: 422 });
  }
  if (body.caravanSlug) {
    const van = await prisma.caravan.findUnique({ where: { slug: body.caravanSlug } });
    if (!van) return NextResponse.json({ error: "Restricted caravan slug not found." }, { status: 422 });
  }

  await prisma.coupon.update({
    where: { id: row.id },
    data: {
      ...(body.value != null ? { value: body.value } : {}),
      ...(body.minTotalPence != null ? { minTotalPence: body.minTotalPence } : {}),
      ...(body.maxUses !== undefined ? { maxUses: body.maxUses } : {}),
      ...(body.expiresAt !== undefined ? { expiresAt: body.expiresAt ? new Date(`${body.expiresAt}T23:59:59Z`) : null } : {}),
      ...(body.caravanSlug !== undefined ? { caravanId: body.caravanSlug } : {}),
      ...(body.active != null ? { active: body.active } : {}),
    },
  });
  await prisma.auditLog.create({
    data: { action: "coupons:update", resource: "coupon", resourceId: row.id, detail: `${row.code} [${Object.keys(body).join(", ")}] by ${session.user?.email ?? role}` },
  });
  return NextResponse.json({ ok: true });
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  const denied = gateMutation(req, "admin:coupons", 60, 60_000);
  if (denied) return denied;
  const session = await getServerSession(authOptions);
  const role = (session?.user as { role?: string } | undefined)?.role;
  if (!session || !can("coupons:write", role)) return NextResponse.json({ error: "Staff access required." }, { status: 403 });

  const row = await prisma.coupon.findUnique({ where: { id: params.id } });
  if (!row) return NextResponse.json({ error: "Not found." }, { status: 404 });
  if (row.usedCount > 0) {
    return NextResponse.json({ error: `Used ${row.usedCount}× — disable instead of deleting to keep history.` }, { status: 409 });
  }
  await prisma.coupon.delete({ where: { id: row.id } });
  await prisma.auditLog.create({
    data: { action: "coupons:delete", resource: "coupon", resourceId: row.id, detail: `${row.code} deleted unused by ${session.user?.email ?? role}` },
  });
  return NextResponse.json({ ok: true });
}
