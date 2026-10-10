import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { authOptions, can } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { gateMutation } from "@/lib/security";
import { mdOverlap } from "../route";

const MD = z.string().regex(/^(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/, "Use MM-DD.");

const PatchBody = z.object({
  kind: z.enum(["seasonal", "discount"]),
  name: z.string().min(2).max(80).optional(),
  startMonthDay: MD.optional(),
  endMonthDay: MD.optional(),
  multiplierPct: z.number().int().min(100).max(200).optional(),
  minNights: z.number().int().min(2).max(60).optional(),
  pct: z.number().int().min(0).max(50).optional(),
  active: z.boolean().optional(),
}).strict();

const DeleteBody = z.object({ kind: z.enum(["seasonal", "discount"]) }).strict();

// PATCH /api/admin/pricing/:id — edit a rule. DELETE removes it (rules are
// unreferenced by FK; the engine falls back to documented defaults).
export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const denied = gateMutation(req, "admin:pricing", 60, 60_000);
  if (denied) return denied;
  const session = await getServerSession(authOptions);
  const role = (session?.user as { role?: string } | undefined)?.role;
  if (!session || !can("pricing:write", role)) return NextResponse.json({ error: "Owner or admin required." }, { status: 403 });

  let body: z.infer<typeof PatchBody>;
  try {
    body = PatchBody.parse(await req.json());
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  try {
    if (body.kind === "seasonal") {
      const row = await prisma.seasonalRate.findUnique({ where: { id: params.id } });
      if (!row) return NextResponse.json({ error: "Not found." }, { status: 404 });
      const s = body.startMonthDay ?? row.startMonthDay;
      const e = body.endMonthDay ?? row.endMonthDay;
      const active = body.active ?? row.active;
      if (active) {
        const others = await prisma.seasonalRate.findMany({ where: { active: true, id: { not: row.id } } });
        if (others.some((o) => mdOverlap(o.startMonthDay, o.endMonthDay, s, e))) {
          return NextResponse.json({ error: "Overlaps an existing active seasonal rule." }, { status: 409 });
        }
      }
      await prisma.seasonalRate.update({
        where: { id: row.id },
        data: {
          ...(body.name ? { name: body.name } : {}),
          startMonthDay: s,
          endMonthDay: e,
          ...(body.multiplierPct != null ? { multiplierPct: body.multiplierPct } : {}),
          active,
        },
      });
      await prisma.auditLog.create({ data: { action: "pricing:seasonal_update", resource: "seasonalRate", resourceId: row.id, detail: `${row.name} edited by ${session.user?.email ?? role}` } });
      return NextResponse.json({ ok: true });
    }
    const row = await prisma.discountRule.findUnique({ where: { id: params.id } });
    if (!row) return NextResponse.json({ error: "Not found." }, { status: 404 });
    await prisma.discountRule.update({
      where: { id: row.id },
      data: {
        ...(body.name ? { name: body.name } : {}),
        ...(body.minNights != null ? { minNights: body.minNights } : {}),
        ...(body.pct != null ? { pct: body.pct } : {}),
        ...(body.active != null ? { active: body.active } : {}),
      },
    });
    await prisma.auditLog.create({ data: { action: "pricing:discount_update", resource: "discountRule", resourceId: row.id, detail: `${row.name} edited by ${session.user?.email ?? role}` } });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Update failed." }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  const denied = gateMutation(req, "admin:pricing", 60, 60_000);
  if (denied) return denied;
  const session = await getServerSession(authOptions);
  const role = (session?.user as { role?: string } | undefined)?.role;
  if (!session || !can("pricing:write", role)) return NextResponse.json({ error: "Owner or admin required." }, { status: 403 });

  let body: z.infer<typeof DeleteBody>;
  try {
    body = DeleteBody.parse(await req.json());
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }
  if (body.kind === "seasonal") {
    const row = await prisma.seasonalRate.findUnique({ where: { id: params.id } });
    if (!row) return NextResponse.json({ error: "Not found." }, { status: 404 });
    await prisma.seasonalRate.delete({ where: { id: row.id } });
    await prisma.auditLog.create({ data: { action: "pricing:seasonal_delete", resource: "seasonalRate", resourceId: row.id, detail: `${row.name} deleted by ${session.user?.email ?? role}` } });
  } else {
    const row = await prisma.discountRule.findUnique({ where: { id: params.id } });
    if (!row) return NextResponse.json({ error: "Not found." }, { status: 404 });
    await prisma.discountRule.delete({ where: { id: row.id } });
    await prisma.auditLog.create({ data: { action: "pricing:discount_delete", resource: "discountRule", resourceId: row.id, detail: `${row.name} deleted by ${session.user?.email ?? role}` } });
  }
  return NextResponse.json({ ok: true });
}
