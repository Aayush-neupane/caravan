import Link from "next/link";
import type { ReactNode } from "react";

// Shared admin primitives. Status is never colour-alone: every badge pairs
// an icon character with text. Tables get sticky headers + row hover.

const STATUS_STYLE: Record<string, { bg: string; fg: string; icon: string }> = {
  confirmed: { bg: "#E4EFE7", fg: "#286548", icon: "●" },
  ready: { bg: "#E4EFE7", fg: "#286548", icon: "◐" },
  active: { bg: "#1A2B23", fg: "#F8F7F2", icon: "▶" },
  completed: { bg: "#EDE6D6", fg: "#5c5546", icon: "✓" },
  held: { bg: "#EDE6D6", fg: "#5c5546", icon: "◷" },
  awaiting_payment: { bg: "#F3E8CF", fg: "#8A5B19", icon: "◷" },
  awaiting_documents: { bg: "#F3E8CF", fg: "#8A5B19", icon: "✎" },
  payment_review: { bg: "#F3E8CF", fg: "#8A5B19", icon: "!" },
  cancel_requested: { bg: "#F3E8CF", fg: "#8A5B19", icon: "?" },
  cancelled: { bg: "#F0E2DF", fg: "#A43C32", icon: "✕" },
  expired: { bg: "#E8E8E4", fg: "#686B65", icon: "○" },
  succeeded: { bg: "#E4EFE7", fg: "#286548", icon: "✓" },
  failed: { bg: "#F0E2DF", fg: "#A43C32", icon: "✕" },
  pending: { bg: "#EDE6D6", fg: "#5c5546", icon: "◷" },
  approved: { bg: "#E4EFE7", fg: "#286548", icon: "✓" },
  rejected: { bg: "#F0E2DF", fg: "#A43C32", icon: "✕" },
  uploaded: { bg: "#F3E8CF", fg: "#8A5B19", icon: "⇪" },
  under_review: { bg: "#F3E8CF", fg: "#8A5B19", icon: "◐" },
};

export function StatusBadge({ status }: { status: string }) {
  const s = STATUS_STYLE[status] ?? { bg: "#EDE6D6", fg: "#5c5546", icon: "•" };
  return (
    <span
      className="inline-flex items-center gap-1.5 whitespace-nowrap px-2.5 py-1 text-[0.72rem] font-bold uppercase tracking-wide"
      style={{ background: s.bg, color: s.fg, borderRadius: 4 }}
    >
      <span aria-hidden="true">{s.icon}</span>
      {status.replace(/_/g, " ")}
    </span>
  );
}

export function StatCard({ label, value, hint, href }: { label: string; value: string; hint?: string; href: string }) {
  return (
    <Link
      href={href}
      className="group border border-border bg-white p-5 transition-colors hover:border-forest"
      style={{ borderRadius: 10 }}
    >
      <p className="tick-label">{label}</p>
      <p className="mt-1.5 font-display text-[2rem] leading-none text-forest">{value}</p>
      {hint ? <p className="mt-2 text-[0.8rem] text-muted">{hint}</p> : null}
      <p className="mt-2 text-[0.8rem] font-semibold text-amberDark opacity-0 transition-opacity group-hover:opacity-100">Open records →</p>
    </Link>
  );
}

export function Panel({ title, action, children }: { title: string; action?: ReactNode; children: ReactNode }) {
  return (
    <section className="border border-border bg-white" style={{ borderRadius: 10 }}>
      <div className="flex items-center justify-between gap-3 border-b border-border px-5 py-3.5">
        <h2 className="font-display text-xl text-charcoal">{title}</h2>
        {action}
      </div>
      <div className="px-5 py-4">{children}</div>
    </section>
  );
}

export function DataTable({ headers, children, caption }: { headers: string[]; children: ReactNode; caption?: string }) {
  return (
    <div className="overflow-x-auto">
      <table className="table-quiet min-w-[36rem]">
        {caption ? <caption className="sr-only">{caption}</caption> : null}
        <thead className="sticky top-0 bg-white">
          <tr>{headers.map((h) => <th key={h} scope="col">{h}</th>)}</tr>
        </thead>
        <tbody className="[&>tr:hover]:bg-sand/40">{children}</tbody>
      </table>
    </div>
  );
}

export function EmptyState({ title, body }: { title: string; body: string }) {
  return (
    <div className="border border-dashed border-border bg-paper px-6 py-8 text-center" style={{ borderRadius: 8 }}>
      <p className="font-display text-xl text-charcoal">{title}</p>
      <p className="mx-auto mt-1 max-w-md text-[0.88rem] text-muted">{body}</p>
    </div>
  );
}
