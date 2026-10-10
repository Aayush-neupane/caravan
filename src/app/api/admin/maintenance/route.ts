import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { authOptions, can } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { gateMutation } from "@/lib/security";
import { BLOCKING_STATUSES } from "@/features/bookings/stateMachine";
import { clientIp } from "@/lib/rateLimit";

const Body = z.object({
  caravanSlug: z.string().min(1),
  start: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  end: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  category: z.string().min(2).max(60),
  description: z.string().min(5).max(500),
  priority: z.enum(["low", "normal", "high"]).default("normal"),
  assignee: z.string().max(80).optional(),
}).strict();

// POST /api/admin/maintenance — book a service window. Refused (409) when it
// would strand a live reservation — maintenance never silently double-books.
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
    return NextResponse.json({ error: "Caravan, valid start/end dates, category and description required." }, { status: 400 });
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
      { error: `Overlaps live reservation ${clash.reference}. Move the booking first, or choose clear dates.` },
      { status: 409 }
    );
  }

  const created = await prisma.maintenanceRecord.create({
    data: {
      caravanId: caravan.id, startDate: start, endDate: end,
      category: body.category, description: body.description,
      priority: body.priority, assignee: body.assignee || null,
    },
  });
  await prisma.auditLog.create({
    data: {
      action: "maintenance:create", resource: "maintenance", resourceId: created.id,
      detail: `${caravan.name} ${body.start}→${body.end} (${body.category}) by ${session.user?.email ?? role} @ ${clientIp(req)}`,
    },
  });
  return NextResponse.json({ ok: true, id: created.id }, { status: 201 });
}
