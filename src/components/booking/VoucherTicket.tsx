"use client";

import { gbp } from "@/lib/format";
import { Compass } from "@/components/editorial/Decor";

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

function nightsBetween(a: string, b: string): number | null {
  const ms = new Date(b.slice(0, 10)).getTime() - new Date(a.slice(0, 10)).getTime();
  if (!Number.isFinite(ms) || ms <= 0) return null;
  return Math.round(ms / 86400000);
}

function esc(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

// Deterministic faux-barcode widths from the reference (flat divs, no gradients).
function bars(seed: string, n = 44): number[] {
  const out: number[] = [];
  let h = 7;
  for (let i = 0; i < n; i++) {
    h = (h * 31 + seed.charCodeAt(i % seed.length) * 17 + i) % 97;
    out.push(1 + (h % 3));
  }
  return out;
}

// Standalone ticket file (inline styles, zero assets): what downloads is
// exactly the ticket — nothing else on the page.
function ticketHTML(t: TicketData): string {
  const n = nightsBetween(t.pickup, t.ret);
  const w = bars(t.reference);
  const bar = w.map((x) => `<span style="display:inline-block;width:${x * 2}px;height:44px;background:#1A2B23;margin-right:${x === 1 ? 3 : 2}px"></span>`).join("");
  const rows: [string, string][] = [
    ...(t.guestName ? [["Guest", t.guestName] as [string, string]] : []),
    ["Caravan", t.caravan],
    ["Pickup", `${day(t.pickup)} · from 09:00`],
    ["Return", `${day(t.ret)} · by 16:00`],
    ...(n ? [["Nights", String(n)] as [string, string]] : []),
    ["Total incl. VAT", gbp(t.totalPence)],
    ["Deposit due at depot", gbp(t.depositDuePence)],
  ];
  return `<!DOCTYPE html><html lang="en-GB"><head><meta charset="utf-8"><title>Collection voucher ${esc(t.reference)} — Hartley & Moor</title>
<style>body{font-family:Georgia,serif;background:#F8F7F2;color:#1A2B23;margin:0;padding:32px}.t{max-width:600px;margin:0 auto;border:2px solid #1A2B23;border-radius:12px;overflow:hidden;background:#fff}.h{background:#1A2B23;color:#F8F7F2;padding:18px 24px;display:flex;justify-content:space-between;align-items:center}.h p{font-family:monospace;font-size:11px;letter-spacing:2px;color:#EDE6D6;margin:0}.stamp{font-family:monospace;font-size:11px;font-weight:bold;letter-spacing:2px;color:#C9A86A;border:2px solid #C9A86A;border-radius:4px;padding:4px 10px;transform:rotate(-3deg)}.ref{font-family:monospace;font-size:36px;font-weight:bold;letter-spacing:4px;margin:20px 24px 2px}.sub{font-family:monospace;font-size:11px;letter-spacing:2px;color:#686B65;margin:0 24px}table{width:100%;border-collapse:collapse;margin:10px 0 0}td{padding:7px 24px;font-size:14px;border-top:1px solid #DCDDD5}td:first-child{color:#686B65;width:42%}.perf{border-top:2px dashed #1A2B23;margin:18px 0 0}.stub{padding:14px 24px 20px}.bars{white-space:nowrap;overflow:hidden}.foot{margin:14px auto;max-width:600px;font-family:monospace;font-size:11px;letter-spacing:1px;color:#686B65;text-align:center}ul{margin:10px 0 0;padding-left:20px;font-size:14px;line-height:1.7}</style>
</head><body><div class="t"><div class="h"><p>HARTLEY &amp; MOOR · COLLECTION VOUCHER</p><span class="stamp">RESERVED</span></div>
<div class="ref">${esc(t.reference)}</div>
<p class="sub">SHOW THIS AT LANSDOWN DEPOT, BATH</p>
<table>${rows.map(([k, v]) => `<tr><td>${esc(k)}</td><td><strong>${esc(v)}</strong></td></tr>`).join("")}</table>
<div class="perf"></div><div class="stub"><div class="bars">${bar}</div>
<ul><li>Show this reference at the depot counter.</li><li>Bring your driving licence + tow-car documents.</li><li>Arrive 15 minutes early, Mon–Sat 09:00–16:00.</li></ul></div></div>
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

function Barcode({ seed }: { seed: string }) {
  return (
    <div className="flex h-11 items-stretch overflow-hidden" aria-hidden="true">
      {bars(seed).map((w, i) => (
        <span key={i} className="bg-forest" style={{ width: w * 2, marginRight: w === 1 ? 3 : 2 }} />
      ))}
    </div>
  );
}

// The collection voucher, exactly as issued — shown after reserving and on
// lookup. Download saves only this ticket as a file; print is scoped to it
// via .ticket-print (see globals print rules) — never the whole page.
export function VoucherTicket({ ticket }: { ticket: TicketData }) {
  const nights = nightsBetween(ticket.pickup, ticket.ret);
  return (
    <section className="ticket-print overflow-hidden border-2 border-forest bg-white" style={{ borderRadius: 12 }} aria-label={`Collection voucher ${ticket.reference}`}>
      <div className="flex items-center justify-between gap-3 bg-forest px-6 py-4 text-paper sm:px-8">
        <div className="flex items-center gap-2.5">
          <Compass size={26} className="shrink-0 text-sand" />
          <p className="font-mono text-[0.68rem] font-bold uppercase tracking-[0.22em] text-sand">Hartley &amp; Moor · Collection voucher</p>
        </div>
        <span className="shrink-0 -rotate-3 border-2 border-amber px-2.5 py-1 font-mono text-[0.68rem] font-bold uppercase tracking-[0.2em] text-amber" style={{ borderRadius: 4 }}>
          {ticket.status === "active" ? "Collected" : ticket.status === "cancelled" ? "Cancelled" : "Reserved"}
        </span>
      </div>

      <div className="px-6 pt-5 sm:px-8">
        <p className="font-mono text-4xl font-bold tracking-[0.08em] text-forest sm:text-5xl">{ticket.reference}</p>
        <p className="mt-1 font-mono text-[0.68rem] font-bold uppercase tracking-[0.22em] text-muted">Show this at Lansdown Depot, Bath</p>
        <div className="mt-3 flex flex-wrap items-baseline gap-x-6 gap-y-1">
          <p className="font-display text-2xl text-charcoal">{ticket.caravan}</p>
          <p className="font-display text-xl text-forest">
            {day(ticket.pickup)} <span aria-hidden="true" className="text-amberDark">→</span> {day(ticket.ret)}
            {nights ? <span className="ml-2 font-sans text-sm text-muted">· {nights} night{nights === 1 ? "" : "s"}</span> : null}
          </p>
        </div>
        {ticket.guestName && <p className="mt-1 text-[0.9rem] text-muted">Booked for {ticket.guestName}</p>}
      </div>

      <dl className="mx-6 mt-4 grid grid-cols-2 border-y border-border sm:mx-8" aria-label="Voucher totals">
        <div className="border-r border-border py-3 pr-4">
          <dt className="text-[0.66rem] font-bold uppercase tracking-[0.18em] text-muted">Total incl. VAT</dt>
          <dd className="mt-0.5 font-display text-2xl font-bold text-forest">{gbp(ticket.totalPence)}</dd>
        </div>
        <div className="py-3 pl-4">
          <dt className="text-[0.66rem] font-bold uppercase tracking-[0.18em] text-muted">Deposit · due at depot</dt>
          <dd className="mt-0.5 font-display text-2xl font-bold text-forest">{gbp(ticket.depositDuePence)}</dd>
        </div>
      </dl>

      <div className="mt-4 border-t-2 border-dashed border-forest/60" aria-hidden="true" />

      <div className="grid gap-5 px-6 py-5 sm:grid-cols-[1fr_auto] sm:items-center sm:px-8">
        <div>
          <Barcode seed={ticket.reference} />
          <ol className="mt-3 list-decimal space-y-1 pl-5 text-[0.87rem] leading-relaxed text-charcoal/85">
            <li>This reference ({ticket.reference}) — file, paper or phone.</li>
            <li>Your driving licence + tow-car documents.</li>
            <li>Arrive 15 minutes early, Mon–Sat 09:00–16:00.</li>
          </ol>
        </div>
        <div className="flex gap-2 print:hidden sm:flex-col">
          <button type="button" onClick={() => downloadTicket(ticket)} className="btn-primary !py-2 !px-4 !text-[0.83rem]">Download ticket</button>
          <button type="button" onClick={() => window.print()} className="btn-secondary !py-2 !px-4 !text-[0.83rem]">Print</button>
        </div>
      </div>
    </section>
  );
}
