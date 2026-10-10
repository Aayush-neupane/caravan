import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { authOptions, can } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { gateMutation } from "@/lib/security";
import { BLOCKING_STATUSES } from "@/features/bookings/stateMachine";

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
  // Reopening re-blocks the calendar: run the same no-strand clash check
  // (buffered) as creation, excluding this record itself.
  if (body.done === false && row.done === true) {
    const bufStart = new Date(row.startDate);
    const bufEnd = new Date(row.endDate);
    bufEnd.setUTCDate(bufEnd.getUTCDate() + 1);
    const nowTs = new Date();
    const bookings = await prisma.booking.findMany({
      where: { caravanId: row.caravanId, status: { in: [...BLOCKING_STATUSES] }, pickupDate: { lt: bufEnd }, returnDate: { gte: bufStart } },
      select: { reference: true, pickupDate: true, returnDate: true },
    });
    for (const b of bookings) {
      const exEnd = new Date(b.returnDate);
      exEnd.setUTCDate(exEnd.getUTCDate() + 1);
      if (new Date(b.pickupDate) < bufEnd && bufStart < exEnd) {
        return NextResponse.json({ error: `Reopening overlaps live reservation ${b.reference}.` }, { status: 409 });
      }
    }
    const hold = await prisma.bookingHold.findFirst({
      where: { caravanId: row.caravanId, expiresAt: { gt: nowTs }, pickupDate: { lt: bufEnd }, returnDate: { gte: bufStart } },
      select: { id: true, pickupDate: true, returnDate: true },
    });
    if (hold) {
      const hEnd = new Date(hold.returnDate);
      hEnd.setUTCDate(hEnd.getUTCDate() + 1);
      if (new Date(hold.pickupDate) < bufEnd && bufStart < hEnd) {
        return NextResponse.json({ error: "Reopening overlaps a live hold." }, { status: 409 });
      }
    }
    const block = await prisma.availabilityBlock.findFirst({
      where: { caravanId: row.caravanId, startDate: { lt: bufEnd }, endDate: { gt: bufStart } },
      select: { id: true },
    });
    if (block) return NextResponse.json({ error: "Reopening overlaps a blackout block." }, { status: 409 });
    const otherMaint = await prisma.maintenanceRecord.findFirst({
      where: { caravanId: row.caravanId, done: false, id: { not: row.id }, startDate: { lt: bufEnd }, endDate: { gt: bufStart } },
      select: { id: true },
    });
    if (otherMaint) return NextResponse.json({ error: "Reopening overlaps another open maintenance window." }, { status: 409 });
  }
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
