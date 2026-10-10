import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { authOptions, can } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { gateMutation } from "@/lib/security";
import { assertTransition } from "@/features/bookings/stateMachine";

const Body = z.object({
  status: z.enum(["under_review", "approved", "rejected", "resubmission_requested"]),
  reviewerNote: z.string().max(500).optional(),
}).strict().refine(
  (b) => (b.status === "approved" || b.status === "under_review" ? true : (b.reviewerNote ?? "").trim().length >= 5),
  "Rejections and resubmission requests must carry a reason (5+ characters)."
);

// PATCH /api/admin/documents/:id — review a customer document. Approving the
// last outstanding doc on an awaiting_documents booking confirms it: the
// document gate closes here, not in payments.
export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const denied = gateMutation(req, "admin:documents", 60, 60_000);
  if (denied) return denied;
  const session = await getServerSession(authOptions);
  const role = (session?.user as { role?: string } | undefined)?.role;
  if (!session || !can("documents:review", role)) return NextResponse.json({ error: "Document reviewer role required." }, { status: 403 });

  let body: z.infer<typeof Body>;
  try {
    body = Body.parse(await req.json());
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Invalid request." }, { status: 400 });
  }

  const doc = await prisma.customerDocument.findUnique({ where: { id: params.id }, include: { booking: true } });
  if (!doc) return NextResponse.json({ error: "Not found." }, { status: 404 });
  if (doc.status === "approved" && body.status === "approved") {
    return NextResponse.json({ ok: true, deduped: true });
  }

  await prisma.$transaction(async (tx) => {
    await tx.customerDocument.update({
      where: { id: doc.id },
      data: { status: body.status, reviewerNote: body.reviewerNote?.trim() || null },
    });
    await tx.auditLog.create({
      data: {
        action: `documents:${body.status}`, resource: "document", resourceId: doc.id,
        detail: `${doc.kind} for ${doc.booking.reference} by ${session.user?.email ?? role}${body.reviewerNote ? `: ${body.reviewerNote.trim().slice(0, 120)}` : ""}`,
      },
    });

    if (body.status === "approved" && doc.booking.status === "awaiting_documents") {
      const outstanding = await tx.customerDocument.count({
        where: { bookingId: doc.bookingId, id: { not: doc.id }, status: { in: ["uploaded", "under_review"] } },
      });
      if (outstanding === 0) {
        assertTransition(doc.booking.status as never, "confirmed" as never);
        await tx.booking.update({ where: { id: doc.bookingId }, data: { status: "confirmed" } });
        await tx.bookingStatusHistory.create({
          data: { bookingId: doc.bookingId, from: doc.booking.status, to: "confirmed", actor: role, note: `Documents verified by ${session.user?.email ?? role}` },
        });
      }
    }
  });
  return NextResponse.json({ ok: true });
}
