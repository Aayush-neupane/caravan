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

const INK = "#1A2B23";
const PAPER = "#F8F7F2";
const SAND = "#EDE6D6";
const AMBER = "#C9A86A";
const MUTED = "#686B65";
const DISPLAY = '"Cormorant Garamond", Georgia, serif';
const MONO = 'ui-monospace, SFMono-Regular, Menlo, Consolas, monospace';

// PNG export drawn straight to canvas — crisp at any size, zero assets, and
// exactly the ticket (never the page). 1200px wide, ~2x of the on-screen card.
function renderTicketPNG(t: TicketData): HTMLCanvasElement {
  const W = 1200;
  const H = 1120;
  const M = 56; // outer margin
  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d")!;
  const stamp = t.status === "active" ? "COLLECTED" : t.status === "cancelled" ? "CANCELLED" : "RESERVED";
  const nights = nightsBetween(t.pickup, t.ret);

  ctx.fillStyle = PAPER;
  ctx.fillRect(0, 0, W, H);

  const cardX = M;
  const cardW = W - M * 2;
  const rr = (x: number, y: number, w: number, h: number, r: number) => {
    ctx.beginPath();
    if (typeof ctx.roundRect === "function") ctx.roundRect(x, y, w, h, r);
    else ctx.rect(x, y, w, h);
  };

  // Card body
  rr(cardX, M, cardW, H - M * 2, 24);
  ctx.fillStyle = "#FFFFFF";
  ctx.fill();
  ctx.lineWidth = 4;
  ctx.strokeStyle = INK;
  ctx.stroke();
  ctx.save();
  rr(cardX, M, cardW, H - M * 2, 24);
  ctx.clip();

  // Masthead
  ctx.fillStyle = INK;
  ctx.fillRect(cardX, M, cardW, 132);
  ctx.fillStyle = SAND;
  ctx.font = `700 24px ${MONO}`;
  ctx.textBaseline = "alphabetic";
  ctx.fillText("HARTLEY & MOOR · COLLECTION VOUCHER", cardX + 40, M + 80);
  // Stamp
  ctx.save();
  ctx.translate(cardX + cardW - 150, M + 66);
  ctx.rotate(-0.05);
  ctx.font = `700 24px ${MONO}`;
  const sw = ctx.measureText(stamp).width + 36;
  ctx.strokeStyle = AMBER;
  ctx.lineWidth = 3;
  ctx.strokeRect(-sw / 2, -30, sw, 56);
  ctx.fillStyle = AMBER;
  ctx.textAlign = "center";
  ctx.fillText(stamp, 0, 8);
  ctx.restore();
  ctx.textAlign = "left";

  let y = M + 132 + 72;
  const lx = cardX + 40;
  // Reference
  ctx.fillStyle = INK;
  ctx.font = `700 88px ${MONO}`;
  ctx.fillText(t.reference, lx, y);
  y += 40;
  ctx.fillStyle = MUTED;
  ctx.font = `700 21px ${MONO}`;
  ctx.fillText("SHOW THIS AT LANSDOWN DEPOT, BATH", lx, y);
  y += 64;
  // Caravan + route
  ctx.fillStyle = INK;
  ctx.font = `600 56px ${DISPLAY}`;
  ctx.fillText(t.caravan, lx, y);
  y += 62;
  ctx.font = `500 42px ${DISPLAY}`;
  ctx.fillText(`${day(t.pickup)}  →  ${day(t.ret)}${nights ? `  ·  ${nights} night${nights === 1 ? "" : "s"}` : ""}`, lx, y);
  y += 40;
  if (t.guestName) {
    ctx.fillStyle = MUTED;
    ctx.font = `400 28px ${DISPLAY}`;
    ctx.fillText(`Booked for ${t.guestName}`, lx, y);
    y += 44;
  } else {
    y += 8;
  }
  // Totals
  ctx.fillStyle = MUTED;
  ctx.font = `700 19px ${MONO}`;
  ctx.fillText("TOTAL INCL. VAT", lx, y);
  ctx.fillText("DEPOSIT · DUE AT DEPOT", lx + 520, y);
  y += 56;
  ctx.fillStyle = INK;
  ctx.font = `700 60px ${DISPLAY}`;
  ctx.fillText(gbp(t.totalPence), lx, y);
  ctx.fillText(gbp(t.depositDuePence), lx + 520, y);
  y += 44;
  // Perforation
  ctx.strokeStyle = INK;
  ctx.lineWidth = 3;
  ctx.setLineDash([16, 12]);
  ctx.beginPath();
  ctx.moveTo(cardX, y);
  ctx.lineTo(cardX + cardW, y);
  ctx.stroke();
  ctx.setLineDash([]);
  y += 48;
  // Barcode
  let bx = lx;
  for (const w of bars(t.reference)) {
    ctx.fillStyle = INK;
    ctx.fillRect(bx, y, w * 2.4, 84);
    bx += w * 2.4 + (w === 1 ? 4 : 3);
  }
  y += 84 + 30;
  // Checklist
  ctx.fillStyle = "#333b36";
  ctx.font = `400 27px ${DISPLAY}`;
  const lines = [
    `This reference (${t.reference}) — file, paper or phone.`,
    "Your driving licence + tow-car documents.",
    "Arrive 15 minutes early, Mon–Sat 09:00–16:00.",
  ];
  for (const [i, line] of lines.entries()) {
    ctx.fillText(`${i + 1}.  ${line}`, lx, y);
    y += 44;
  }
  ctx.restore();
  return canvas;
}

export function downloadTicket(t: TicketData): void {
  renderTicketPNG(t).toBlob((blob) => {
    if (!blob) return;
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `voucher-${t.reference}.png`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 4000);
  }, "image/png");
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
