import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = { title: "How it works", description: "Choosing, reserving, collecting, travelling and returning a Hartley & Moor caravan — documents, payments and deposit release explained." };

const STEPS = [
  ["1 · Choose caravan & dates", "Filter the fleet by berths, weights and facilities. Availability is calculated server-side from real bookings, holds and maintenance — never from the browser. If dates are unavailable we explain why and suggest alternatives."],
  ["2 · Extras, eligibility & insurance", "Add bedding, awning, mileage packs. Tell us about your licence and tow car. Cover inclusions and excesses are shown in plain English with links to the actual policy — selecting an extra never implies eligibility."],
  ["3 · Reserve & pay", "Guest checkout; account optional. 25% deposit secures the van via a time-limited hold (20 minutes, enforced server-side). Payment status is verified by webhook before anything is confirmed — a success-looking page alone proves nothing."],
  ["4 · Prepare", "Collection pack by email: route notes, packing list, arrival time. Upload your driving licence to your account; status moves Required → Uploaded → Under review → Approved. Rejections always carry a reason and a resubmission route."],
  ["5 · Collect", "40 minutes at Lansdown: documents, weights, hitch, electrics, accompanied drive. You sign a versioned rental agreement populated from your booking snapshot. Leave when ready."],
  ["6 · Travel", "Gas full, breakdown cover active, a human on the phone. Keep to two-hour towing days; nightly checks take five minutes. Report issues early — most are solvable by phone."],
  ["7 · Return", "Joint 30-minute inspection: mileage, condition, gas and water recorded together and signed by both sides. No silent damage claims later."],
  ["8 · Deposit & follow-up", "Refundable deposit released within 5 working days less documented deductions. Receipt, invoice and a review invitation follow. Cancellation refunds follow the published policy version recorded on your booking."],
];

export default function HowItWorks() {
  return (
    <div className="bg-paper">
      <div className="mx-auto max-w-content px-5 py-12 sm:px-8">
        <p className="tick-label">How it works</p>
        <h1 className="mt-3 font-display text-5xl text-charcoal">From search to slow mornings.</h1>
        <div className="mt-8 space-y-0 border-t border-border">
          {STEPS.map(([t, d]) => (
            <div key={t} className="grid gap-2 border-b border-border py-6 md:grid-cols-12">
              <h2 className="font-display text-2xl text-forest md:col-span-4">{t}</h2>
              <p className="leading-relaxed text-charcoal/85 md:col-span-7 md:col-start-6">{d}</p>
            </div>
          ))}
        </div>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link href="/fleet" className="btn-primary">Browse the fleet</Link>
          <Link href="/towing-guide" className="btn-secondary">Read the towing guide</Link>
        </div>
      </div>
    </div>
  );
}
