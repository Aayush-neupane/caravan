import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { cleanText, gateMutation, isCalendarDate } from "@/lib/security";
import { BLOCKING_STATUSES } from "@/features/bookings/stateMachine";

// GET /api/availability?pickup=YYYY-MM-DD&return=YYYY-MM-DD — fleet-wide
// availability for the explorer. Real calendar dates only; blocked = overlap
// with live bookings/holds/blocks/maintenance (same engine as checkout).
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const pickup = (searchParams.get("pickup") ?? "").slice(0, 10);
  const ret = (searchParams.get("return") ?? searchParams.get("ret") ?? "").slice(0, 10);
  if (!isCalendarDate(pickup) || !isCalendarDate(ret) || !(ret > pickup)) {
    return NextResponse.json({ error: "Provide pickup and return as YYYY-MM-DD (return after pickup)." }, { status: 400 });
  }
  try {
    const start = new Date(`${pickup}T12:00:00Z`);
    const end = new Date(`${ret}T12:00:00Z`);
    const bufEnd = new Date(end);
    bufEnd.setUTCDate(bufEnd.getUTCDate() + 1);
    const caravans = await prisma.caravan.findMany({
      where: { published: true, archived: false },
      select: {
        slug: true,
        name: true,
        bookings: { where: { status: { in: [...BLOCKING_STATUSES] } }, select: { pickupDate: true, returnDate: true } },
        holds: { where: { expiresAt: { gt: new Date() } }, select: { pickupDate: true, returnDate: true } },
        blocks: { select: { startDate: true, endDate: true } },
        maintenance: { where: { done: false }, select: { startDate: true, endDate: true } },
      },
    });
    const overlaps = (aStart: Date, aEnd: Date, bStart: Date, bEnd: Date) => aStart < bEnd && bStart < aEnd;
    const availability = caravans.map((c) => {
      const clash =
        c.bookings.some((b) => {
          const exEnd = new Date(b.returnDate);
          exEnd.setUTCDate(exEnd.getUTCDate() + 1);
          return new Date(b.pickupDate) < bufEnd && start < exEnd;
        }) ||
        c.holds.some((h) => overlaps(start, bufEnd, new Date(h.pickupDate), new Date(h.returnDate))) ||
        c.blocks.some((b) => overlaps(start, bufEnd, new Date(b.startDate), new Date(b.endDate))) ||
        c.maintenance.some((m) => overlaps(start, bufEnd, new Date(m.startDate), new Date(m.endDate)));
      return { slug: c.slug, name: c.name, available: !clash };
    });
    return NextResponse.json({ pickup, return: ret, availability });
  } catch {
    return NextResponse.json({ error: "Could not check availability." }, { status: 500 });
  }
}
