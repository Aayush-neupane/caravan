import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { authOptions, can } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { cleanText, gateMutation } from "@/lib/security";

const Body = z.object({ published: z.boolean(), force: z.boolean().default(false) }).strict();

// Editable ops + marketing fields. Ranges keep checkout math sane; merged
// cross-checks (travellers ≥ berths, min ≤ max) run against the stored row.
const DetailsBody = z.object({
  name: cleanText(2, 60).optional(),
  tagline: cleanText(2, 140).optional(),
  description: cleanText(10, 2000).optional(),
  berths: z.number().int().min(1).max(8).optional(),
  maxTravellers: z.number().int().min(1).max(8).optional(),
  baseNightlyPence: z.number().int().min(1000).max(100000).optional(),
  weekendNightlyPence: z.number().int().min(1000).max(100000).nullable().optional(),
  weeklyDiscountPct: z.number().int().min(0).max(50).optional(),
  minNights: z.number().int().min(1).max(60).optional(),
  maxNights: z.number().int().min(1).max(90).optional(),
  cleaningFeePence: z.number().int().min(0).max(50000).optional(),
  securityDepositPence: z.number().int().min(0).max(500000).optional(),
  towRequirement: cleanText(5, 500).optional(),
  archived: z.boolean().optional(),
}).strict().refine((o) => Object.keys(o).length > 0, "Nothing to update.");

// PATCH /api/admin/fleet/:slug — publish toggle ({published}) or details
// update (any other keys). Details take effect publicly within the page
// revalidation window; unpublishing hides the van everywhere but history.
// Publishing controls visibility on the site. Unpublishing never
// deletes history; response includes future-booking count as the warning.
export async function PATCH(req: Request, { params }: { params: { slug: string } }) {
  const denied = gateMutation(req, "admin:fleet", 60, 60_000);
  if (denied) return denied;
  const session = await getServerSession(authOptions);
  const role = (session?.user as { role?: string } | undefined)?.role;
  if (!session || !can("fleet:write", role)) {
    return NextResponse.json({ error: "Fleet manager role required." }, { status: 403 });
  }

  let raw: unknown;
  try {
    raw = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }
  const publishedOnly = Body.safeParse(raw);
  const detailsParsed = DetailsBody.safeParse(raw);
  if (!publishedOnly.success && !detailsParsed.success) {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }
  const body = publishedOnly.success ? publishedOnly.data : (null as never);
  const details = !publishedOnly.success && detailsParsed.success ? detailsParsed.data : null;

  const caravan = await prisma.caravan.findUnique({ where: { slug: params.slug } });
  if (!caravan) return NextResponse.json({ error: "Not found." }, { status: 404 });

  if (details) {
    const merged = { ...caravan, ...Object.fromEntries(Object.entries(details).filter(([, v]) => v !== undefined)) };
    if (merged.maxTravellers < merged.berths) {
      return NextResponse.json({ error: "Travellers cannot be fewer than berths." }, { status: 422 });
    }
    if (merged.minNights > merged.maxNights) {
      return NextResponse.json({ error: "Minimum nights cannot exceed maximum nights." }, { status: 422 });
    }
    // Archiving always hides the van: archived + published is contradictory.
    const data = Object.fromEntries(Object.entries(details).filter(([, v]) => v !== undefined));
    if (data.archived === true) data.published = false;
    await prisma.$transaction([
      prisma.caravan.update({ where: { id: caravan.id }, data }),
      prisma.auditLog.create({
        data: {
          action: "fleet:update", resource: "caravan", resourceId: caravan.id,
          detail: `${caravan.name} fields [${Object.keys(data).join(", ")}] edited by ${session.user?.email ?? role}`,
        },
      }),
    ]);
    return NextResponse.json({ ok: true, updated: Object.keys(data) });
  }

  const future = await prisma.booking.count({
    where: { caravanId: caravan.id, pickupDate: { gte: new Date() }, status: { notIn: ["cancelled", "expired", "completed"] } },
  });

  // Hiding a van with future reservations needs an explicit force flag —
  // holders otherwise lose the van from under their booking view.
  if (!body.published && future > 0 && !body.force) {
    return NextResponse.json(
      { error: `${future} future reservation(s) reference this caravan. Confirm to unpublish anyway — history is preserved.`, futureBookings: future, needsForce: true },
      { status: 409 }
    );
  }

  await prisma.$transaction([
    prisma.caravan.update({ where: { id: caravan.id }, data: { published: body.published } }),
    prisma.auditLog.create({
      data: {
        action: body.published ? "fleet:publish" : "fleet:unpublish",
        resource: "caravan", resourceId: caravan.id,
        detail: `${caravan.name} ${body.published ? "published" : "unpublished"} by ${role}; ${future} future reservation(s) on record`,
      },
    }),
  ]);
  return NextResponse.json({ ok: true, published: body.published, futureBookings: future });
}
