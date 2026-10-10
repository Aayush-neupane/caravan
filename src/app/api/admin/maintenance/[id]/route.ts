import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { authOptions, can } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { gateMutation } from "@/lib/security";

const PatchBody = z.object({
  done: z.boolean().optional(),
  assignee: z.string().max(80).nullable().optional(),
  priority: z.enum(["low", "normal", "high"]).optional(),
}).strict().refine((o) => Object.keys(o).length > 0, "Nothing to update.");

// PATCH done/assignee/priority · DELETE removes the record (audit kept).
export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const denied = gateMutation(req, "admin:maintenance", 60, 60_000);
  if (denied) return denied;
  const session = await getServerSession(authOptions);
  const role = (session?.user as { role?: string } | undefined)?.role;
  if (!session || !can("maintenance:write", role)) return NextResponse.json({ error: "Staff access required." }, { status: 403 });

  let body: z.infer<typeof PatchBody>;
  try {
    body = PatchBody.parse(await req.json());
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }
  const row = await prisma.maintenanceRecord.findUnique({ where: { id: params.id } });
  if (!row) return NextResponse.json({ error: "Not found." }, { status: 404 });
  await prisma.maintenanceRecord.update({
    where: { id: row.id },
    data: {
      ...(body.done != null ? { done: body.done } : {}),
      ...(body.assignee !== undefined ? { assignee: body.assignee || null } : {}),
      ...(body.priority ? { priority: body.priority } : {}),
    },
  });
  await prisma.auditLog.create({
    data: { action: "maintenance:update", resource: "maintenance", resourceId: row.id, detail: `[${Object.keys(body).join(", ")}] by ${session.user?.email ?? role}` },
  });
  return NextResponse.json({ ok: true });
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  const denied = gateMutation(req, "admin:maintenance", 60, 60_000);
  if (denied) return denied;
  const session = await getServerSession(authOptions);
  const role = (session?.user as { role?: string } | undefined)?.role;
  if (!session || !can("maintenance:write", role)) return NextResponse.json({ error: "Staff access required." }, { status: 403 });

  const row = await prisma.maintenanceRecord.findUnique({ where: { id: params.id } });
  if (!row) return NextResponse.json({ error: "Not found." }, { status: 404 });
  try {
    await prisma.maintenanceRecord.delete({ where: { id: row.id } });
  } catch {
    return NextResponse.json({ error: "Already removed." }, { status: 404 });
  }
  await prisma.auditLog.create({
    data: { action: "maintenance:delete", resource: "maintenance", resourceId: row.id, detail: `${row.category} ${row.startDate.toISOString().slice(0, 10)} removed by ${session.user?.email ?? role}` },
  });
  return NextResponse.json({ ok: true });
}
