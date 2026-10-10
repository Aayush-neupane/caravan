import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { authOptions, can } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { cleanText, gateMutation } from "@/lib/security";
import { logger } from "@/lib/logger";

const Body = z
  .object({
    bookingRef: z.string().min(3).max(24),
    mileage: z.number().int().min(0).max(1_000_000).nullable().default(null),
    damage: cleanText(0, 2000).optional(),
    fuelWater: cleanText(0, 500).optional(),
    depositDecision: z.enum(["release_full", "partial_hold", "full_hold"]).nullable().default(null),
  })
  .strict();

// POST /api/admin/inspections — record the joint return inspection.
// Upserts the single ReturnInspection per booking; staff-only.
export async function POST(req: Request) {
  const denied = gateMutation(req, "admin:inspections", 60, 60_000);
  if (denied) return denied;
  const session = await getServerSession(authOptions);
  const role = (session?.user as { role?: string } | undefined)?.role;
  if (!session || !can("bookings:write", role)) return NextResponse.json({ error: "Staff access required." }, { status: 403 });
  let body: z.infer<typeof Body>;
  try {
    body = Body.parse(await req.json());
  } catch {
    return NextResponse.json({ error: "Booking reference plus inspection notes are required." }, { status: 400 });
  }
  const booking = await prisma.booking.findUnique({ where: { reference: body.bookingRef.trim().toUpperCase() } });
  if (!booking) return NextResponse.json({ error: "Booking not found." }, { status: 404 });
  try {
    const row = await prisma.$transaction(async (tx) => {
      const inspection = await tx.returnInspection.upsert({
        where: { bookingId: booking.id },
        create: {
          bookingId: booking.id,
          mileage: body.mileage,
          damage: body.damage || null,
          fuelWater: body.fuelWater || null,
          depositDecision: body.depositDecision,
        },
        update: {
          mileage: body.mileage,
          damage: body.damage || null,
          fuelWater: body.fuelWater || null,
          depositDecision: body.depositDecision,
        },
      });
      await tx.auditLog.create({
        data: {
          action: "inspections:record",
          resource: "booking",
          resourceId: booking.id,
          detail: `${booking.reference} inspected by ${session.user?.email ?? role}`,
          actorId: (session.user as { id?: string })?.id ?? undefined,
        },
      });
      return inspection;
    });
    logger.info("[inspections] recorded", { ref: booking.reference });
    return NextResponse.json({ ok: true, id: row.id }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Could not record the inspection." }, { status: 500 });
  }
}
