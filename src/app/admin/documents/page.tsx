import { prisma } from "@/lib/db";
import { DataTable, EmptyState, StatusBadge } from "@/components/admin/ui";

export const metadata = { title: "Documents", robots: { index: false, follow: false } };

export default async function DocumentsAdmin() {
  let rows: { id: string; booking: string; kind: string; file: string; status: string }[] = [];
  try {
    const docs = await prisma.customerDocument.findMany({ include: { booking: true }, orderBy: { createdAt: "desc" }, take: 100 });
    rows = docs.map((d) => ({ id: d.id, booking: d.booking.reference, kind: d.kind, file: d.fileName, status: d.status }));
  } catch { /* ignore */ }

  return (
    <div>
      <p className="tick-label">Verification queue</p>
      <h1 className="mt-1 font-display text-4xl text-charcoal sm:text-5xl">Documents</h1>
      <p className="mt-2 max-w-2xl text-[0.9rem] text-muted">Private storage with signed, short-lived links. Flow: required → uploaded → under review → approved, or rejected / resubmission requested — rejections always carry a reason.</p>
      <div className="mt-4 border border-border bg-white px-5 py-3" style={{ borderRadius: 10 }}>
        {rows.length === 0 ? (
          <EmptyState title="Queue is empty" body="Seed includes one driving licence awaiting approval. New uploads land here instantly." />
        ) : (
          <DataTable headers={["Booking", "Kind", "File", "Status"]} caption="Documents awaiting review">
            {rows.map((r) => (
              <tr key={r.id}>
                <td className="font-mono font-bold">{r.booking}</td>
                <td>{r.kind.replace(/_/g, " ")}</td>
                <td className="font-mono text-[0.8rem]">{r.file}</td>
                <td><StatusBadge status={r.status} /></td>
              </tr>
            ))}
          </DataTable>
        )}
      </div>
    </div>
  );
}
