import { prisma } from "@/lib/db";
import { DataTable, EmptyState } from "@/components/admin/ui";
import { DocReview } from "./review";
import { PhysicalLog } from "./log";

export const metadata = { title: "Documents", robots: { index: false, follow: false } };

export default async function DocumentsAdmin() {
  let rows: { id: string; booking: string; kind: string; file: string; status: string }[] = [];
  try {
    const docs = await prisma.customerDocument.findMany({ include: { booking: true }, orderBy: { createdAt: "desc" }, take: 100 });
    rows = docs.map((d) => ({ id: d.id, booking: d.booking.reference, kind: d.kind, file: d.fileName, status: d.status }));
  } catch { /* ignore */ }

  return (
    <div>
      <p className="tick-label">Physical receipts log</p>
      <h1 className="mt-1 font-display text-4xl text-charcoal sm:text-5xl">Documents</h1>
      <p className="mt-2 max-w-2xl text-[0.9rem] text-muted">Nothing is uploaded anywhere — guests bring originals to the counter, staff record them here as seen and approved, and the record gates handover approval. Rejections always carry a reason.</p>
      <div className="mt-4 border border-border bg-white px-5 py-3" style={{ borderRadius: 10 }}>
        {rows.length === 0 ? (
          <EmptyState title="No records yet" body="Log the first physical receipt below when a guest hands documents over the counter." />
        ) : (
          <DataTable headers={["Booking", "Kind", "File", "Review"]} caption="Document records">
            {rows.map((r) => (
              <tr key={r.id}>
                <td className="font-mono font-bold">{r.booking}</td>
                <td>{r.kind.replace(/_/g, " ")}</td>
                <td className="font-mono text-[0.8rem]">{r.file}</td>
                <td><DocReview id={r.id} status={r.status} /></td>
              </tr>
            ))}
          </DataTable>
        )}
      </div>
      <PhysicalLog />
    </div>
  );
}
