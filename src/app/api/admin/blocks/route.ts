import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { authOptions, can } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { gateMutation } from "@/lib/security";
import { BLOCKING_STATUSES } from "@/features/bookings/stateMachine";

const Body = z.object({
  caravanSlug: z.string().min(1),
  start: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  end: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  reason: z.string().min(3).max(200),
}).strict();

// POST /api/admin/blocks — manual blackout (owner holds, shows, transfers).
// Same no-strand rule as maintenance: 409 against live reservations.
export async function POST(req: Request) {
  const denied = gateMutation(req, "admin:maintenance", 60, 60_000);
  if (denied) return denied;
  const session = await getServerSession(authOptions);
  const role = (session?.user as { role?: string } | undefined)?.role;
  if (!session || !can("maintenance:write", role)) return NextResponse.json({ error: "Staff access required." }, { status: 403 });

  let body: z.infer<typeof Body>;
  try {
    body = Body.parse(await req.json());
  } catch {
    return NextResponse.json({ error: "Caravan, valid start/end dates and a reason required." }, { status: 400 });
  }
  const start = new Date(`${body.start}T12:00:00Z`);
  const end = new Date(`${body.end}T12:00:00Z`);
  if (!(end > start)) return NextResponse.json({ error: "End must be after start." }, { status: 422 });

  const caravan = await prisma.caravan.findUnique({ where: { slug: body.caravanSlug } });
  if (!caravan) return NextResponse.json({ error: "Caravan not found." }, { status: 404 });

  const clash = await prisma.booking.findFirst({
    where: {
      caravanId: caravan.id,
      status: { in: [...BLOCKING_STATUSES] },
      pickupDate: { lt: end },
      returnDate: { gt: start },
    },
    select: { reference: true },
  });
  if (clash) {
    return NextResponse.json(
      { error: `Overlaps live reservation ${clash.reference}. Move the booking first.` },
      { status: 409 }
    );
  }

  const created = await prisma.availabilityBlock.create({
    data: { caravanId: caravan.id, startDate: start, endDate: end, reason: body.reason },
  });
  await prisma.auditLog.create({
    data: { action: "blocks:create", resource: "block", resourceId: created.id, detail: `${caravan.name} ${body.start}→${body.end} (${body.reason}) by ${session.user?.email ?? role}` },
  });
  return NextResponse.json({ ok: true, id: created.id }, { status: 201 });
}
