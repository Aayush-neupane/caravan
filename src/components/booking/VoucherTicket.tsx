"use client";

import { gbp } from "@/lib/format";

export type TicketData = {
  reference: string;
  guestName?: string | null;
  caravan: string;
  pickup: string;
  ret: string;
  totalPence: number;
  depositDuePence: number;
  status?: string;
};

const day = (s: string) => s.slice(0, 10);

function esc(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

// Standalone printable/downloadable ticket file (inline styles, no assets).
function ticketHTML(t: TicketData): string {
  const rows: [string, string][] = [
    ["Reference", t.reference],
    ...(t.guestName ? [["Guest", t.guestName] as [string, string]] : []),
    ["Caravan", t.caravan],
    ["Pickup", `${day(t.pickup)} · from 09:00`],
    ["Return", `${day(t.ret)} · by 16:00`],
    ["Total incl. VAT", gbp(t.totalPence)],
    ["Deposit due at depot", gbp(t.depositDuePence)],
    ...(t.status ? [["Status", t.status.replace(/_/g, " ")] as [string, string]] : []),
  ];
  return `<!DOCTYPE html><html lang="en-GB"><head><meta charset="utf-8"><title>Collection voucher ${esc(t.reference)} — Hartley & Moor</title>
<style>body{font-family:Georgia,serif;background:#F8F7F2;color:#1A2B23;margin:0;padding:32px}.card{max-width:560px;margin:0 auto;border:2px solid #1A2B23;border-radius:10px;overflow:hidden}.head{background:#1A2B23;color:#F8F7F2;padding:20px 24px}.head p{font-family:monospace;font-size:11px;letter-spacing:2px;color:#C9A86A;margin:0 0 6px}.head h1{font-size:28px;margin:0}.ref{font-family:monospace;font-size:34px;font-weight:bold;letter-spacing:3px;margin:18px 24px 4px}table{width:100%;border-collapse:collapse;margin:8px 0 0}td{padding:7px 24px;font-size:14px;border-top:1px solid #DCDDD5}td:first-child{color:#686B65;width:42%}ul{margin:12px 24px 20px;padding-left:20px;font-size:14px;line-height:1.7}.foot{margin:16px auto;max-width:560px;font-family:monospace;font-size:11px;letter-spacing:1px;color:#686B65;text-align:center}</style>
</head><body><div class="card"><div class="head"><p>HARTLEY &amp; MOOR · LANSDOWN DEPOT, BATH</p><h1>Collection voucher</h1></div>
<div class="ref">${esc(t.reference)}</div>
<table>${rows.map(([k, v]) => `<tr><td>${esc(k)}</td><td><strong>${esc(v)}</strong></td></tr>`).join("")}</table>
<ul><li>Show this reference at the depot counter.</li><li>Bring your driving licence + tow-car documents.</li><li>Arrive 15 minutes early, Mon–Sat 09:00–16:00.</li></ul></div>
<p class="foot">Nothing is charged online · depot phone +44 1225 555 014</p></body></html>`;
}

export function downloadTicket(t: TicketData): void {
  const blob = new Blob([ticketHTML(t)], { type: "text/html;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `voucher-${t.reference}.html`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 4000);
}

// The collection voucher, exactly as issued — shown after reserving and on
// lookup. Download keeps an offline copy for the depot counter.
export function VoucherTicket({ ticket }: { ticket: TicketData }) {
  return (
    <section className="overflow-hidden border border-border bg-white" style={{ borderRadius: 10 }} aria-label={`Collection voucher ${ticket.reference}`}>
      <div className="bg-forest px-6 py-5 text-paper sm:px-8">
        <p className="tick-label !text-sand/70">Show this at the depot</p>
        <p className="mt-1 font-mono text-3xl font-bold tracking-wider sm:text-4xl">{ticket.reference}</p>
      </div>
      <div className="grid gap-0 sm:grid-cols-[1fr_auto_1fr] sm:items-stretch">
        <div className="p-6 sm:px-8">
          <dl className="space-y-1.5 text-[0.92rem]">
            {ticket.guestName && <div className="flex justify-between gap-3"><dt className="text-muted">Guest</dt><dd className="font-medium">{ticket.guestName}</dd></div>}
            <div className="flex justify-between gap-3"><dt className="text-muted">Caravan</dt><dd className="font-medium">{ticket.caravan}</dd></div>
            <div className="flex justify-between gap-3"><dt className="text-muted">Pickup → return</dt><dd className="whitespace-nowrap font-medium">{day(ticket.pickup)} → {day(ticket.ret)}</dd></div>
            <div className="flex justify-between gap-3"><dt className="text-muted">Total incl. VAT</dt><dd className="font-bold">{gbp(ticket.totalPence)}</dd></div>
            <div className="flex justify-between gap-3"><dt className="text-muted">Deposit at depot</dt><dd className="font-bold text-forest">{gbp(ticket.depositDuePence)}</dd></div>
            {ticket.status && <div className="flex justify-between gap-3"><dt className="text-muted">Status</dt><dd className="font-mono text-[0.8rem] font-bold uppercase">{ticket.status.replace(/_/g, " ")}</dd></div>}
          </dl>
          <div className="mt-4 flex flex-wrap gap-2">
            <button type="button" onClick={() => downloadTicket(ticket)} className="btn-primary !py-2 !px-4 !text-[0.83rem]">Download ticket</button>
            <button type="button" onClick={() => window.print()} className="btn-secondary !py-2 !px-4 !text-[0.83rem]">Print</button>
          </div>
        </div>
        <div className="hidden border-l-2 border-dashed border-border sm:block" aria-hidden="true" />
        <div className="border-t-2 border-dashed border-border p-6 sm:border-t-0 sm:px-8">
          <p className="tick-label">At the counter, bring</p>
          <ol className="mt-2 list-decimal space-y-1.5 pl-5 text-[0.9rem] text-charcoal/85">
            <li>This reference ({ticket.reference}) — file, paper or phone.</li>
            <li>Your driving licence + tow-car documents.</li>
            <li>Arrive 15 minutes early at Lansdown Depot.</li>
          </ol>
        </div>
      </div>
    </section>
  );
}
