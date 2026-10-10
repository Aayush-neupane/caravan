import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { authOptions, can } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { gateMutation } from "@/lib/security";
import { BLOCKING_STATUSES } from "@/features/bookings/stateMachine";
import { cleanText, isCalendarDate } from "@/lib/security";

const Body = z.object({
  caravanSlug: z.string().min(1),
  start: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  end: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  reason: cleanText(3, 200),
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
  if (!isCalendarDate(body.start) || !isCalendarDate(body.end)) {
    return NextResponse.json({ error: "Start/end must be real calendar dates (YYYY-MM-DD)." }, { status: 422 });
  }
  if (!(end > start)) return NextResponse.json({ error: "End must be after start." }, { status: 422 });

  const caravan = await prisma.caravan.findUnique({ where: { slug: body.caravanSlug } });
  if (!caravan) return NextResponse.json({ error: "Caravan not found." }, { status: 404 });

  const bufEnd = new Date(end);
  bufEnd.setUTCDate(bufEnd.getUTCDate() + 1);
  const bufStart = start;
  const nowTs = new Date();
  const checkClash = async (
    findBooking: () => Promise<{ reference: string; pickupDate: Date; returnDate: Date } | null>,
    findHold: () => Promise<{ pickupDate: Date; returnDate: Date } | null>,
    findBlock: () => Promise<unknown>,
    findMaint: () => Promise<unknown>
  ): Promise<string | null> => {
    const b = await findBooking();
    if (b) {
      const exEnd = new Date(b.returnDate);
      exEnd.setUTCDate(exEnd.getUTCDate() + 1);
      if (new Date(b.pickupDate) < bufEnd && bufStart < exEnd) return `Overlaps live reservation ${b.reference}. Move the booking first.`;
    }
    const h = await findHold();
    if (h) {
      const hEnd = new Date(h.returnDate);
      hEnd.setUTCDate(hEnd.getUTCDate() + 1);
      if (new Date(h.pickupDate) < bufEnd && bufStart < hEnd) return "Overlaps a live hold. Choose clear dates.";
    }
    if (await findBlock()) return "Overlaps an existing blackout block.";
    if (await findMaint()) return "Overlaps an open maintenance window.";
    return null;
  };
  const outer = await checkClash(
    () => prisma.booking.findFirst({ where: { caravanId: caravan.id, status: { in: [...BLOCKING_STATUSES] }, pickupDate: { lt: bufEnd }, returnDate: { gte: bufStart } }, select: { reference: true, pickupDate: true, returnDate: true } }),
    () => prisma.bookingHold.findFirst({ where: { caravanId: caravan.id, expiresAt: { gt: nowTs }, pickupDate: { lt: bufEnd }, returnDate: { gte: bufStart } }, select: { pickupDate: true, returnDate: true } }),
    () => prisma.availabilityBlock.findFirst({ where: { caravanId: caravan.id, startDate: { lt: bufEnd }, endDate: { gt: bufStart } }, select: { id: true } }),
    () => prisma.maintenanceRecord.findFirst({ where: { caravanId: caravan.id, done: false, startDate: { lt: bufEnd }, endDate: { gt: bufStart } }, select: { id: true } })
  );
  if (outer) {
    return NextResponse.json({ error: outer }, { status: 409 });
  }

  const created = await prisma.$transaction(async (tx) => {
    const txNow = new Date();
    const late = await tx.booking.findFirst({
      where: {
        caravanId: caravan.id,
        status: { in: [...BLOCKING_STATUSES] },
        pickupDate: { lt: bufEnd },
        returnDate: { gte: bufStart },
      },
      select: { reference: true, pickupDate: true, returnDate: true },
    });
    if (late) {
      const exEnd = new Date(late.returnDate);
      exEnd.setUTCDate(exEnd.getUTCDate() + 1);
      if (new Date(late.pickupDate) < bufEnd && bufStart < exEnd) throw new Error(`CLASH:${late.reference}`);
    }
    const lateHold = await tx.bookingHold.findFirst({
      where: { caravanId: caravan.id, expiresAt: { gt: txNow }, pickupDate: { lt: bufEnd }, returnDate: { gte: bufStart } },
      select: { id: true, pickupDate: true, returnDate: true },
    });
    if (lateHold) {
      const hEnd = new Date(lateHold.returnDate);
      hEnd.setUTCDate(hEnd.getUTCDate() + 1);
      if (new Date(lateHold.pickupDate) < bufEnd && bufStart < hEnd) throw new Error("CLASH:live hold");
    }
    const lateBlock = await tx.availabilityBlock.findFirst({
      where: { caravanId: caravan.id, startDate: { lt: bufEnd }, endDate: { gt: bufStart } },
      select: { id: true },
    });
    if (lateBlock) throw new Error("CLASH:blackout block");
    const lateMaint = await tx.maintenanceRecord.findFirst({
      where: { caravanId: caravan.id, done: false, startDate: { lt: bufEnd }, endDate: { gt: bufStart } },
      select: { id: true },
    });
    if (lateMaint) throw new Error("CLASH:maintenance window");
    return tx.availabilityBlock.create({
      data: { caravanId: caravan.id, startDate: start, endDate: end, reason: body.reason },
    });
  }).catch((e: unknown) => {
    if (e instanceof Error && e.message.startsWith("CLASH:")) return { clash: e.message.slice(6) } as const;
    throw e;
  });
  if (created && "clash" in created) {
    return NextResponse.json(
      { error: `Overlaps live reservation ${created.clash}. Move the booking first.` },
      { status: 409 }
    );
  }
  await prisma.auditLog.create({
    data: { action: "blocks:create", resource: "block", resourceId: created.id, detail: `${caravan.name} ${body.start}→${body.end} (${body.reason}) by ${session.user?.email ?? role}` },
  });
  return NextResponse.json({ ok: true, id: created.id }, { status: 201 });
}
