import type { Metadata } from "next";
import Link from "next/link";

export async function generateStaticParams() {
  return ["terms", "privacy", "cookies", "cancellation", "insurance", "refund", "deposit", "eligibility", "mileage"].map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  return { title: `Legal — ${params.slug}`, description: `Hartley & Moor ${params.slug} policy (template until operator-approved).`, robots: { index: false, follow: false } };
}

const POLICIES: Record<string, { title: string; body: string[] }> = {
  terms: { title: "Terms & conditions (template)", body: ["This template governs hire of Hartley & Moor caravans from Bath. It must be reviewed by the operator's solicitor before production use.", "Hirer must hold an appropriate licence, present it with check code at collection, and use a tow car meeting the stated braked capacity. The van may not be sub-hired, taken outside the permitted area, or used for motorsport.", "Rental intervals are pickup-inclusive, return-exclusive with a one-day preparation buffer. Late returns without arrangement incur a nightly charge."] },
  privacy: { title: "Privacy policy (template)", body: ["We collect booking details, licence information and tow-car data to fulfil your hire, plus documents you upload for verification.", "Identity documents are stored in private object storage with signed, short-lived access — never public URLs. Retention: booking records 6 years (tax), documents 12 months after hire unless law requires longer.", "Contact stay@hartleyandmoor.co.uk for access, correction or deletion requests."] },
  cookies: { title: "Cookie policy (template)", body: ["We use strictly-necessary cookies (session, booking dates) and, with consent, analytics. No advertising trackers.", "Manage preferences in your browser; core booking still works without optional cookies."] },
  cancellation: { title: "Cancellation policy (template)", body: ["28+ days before collection: full refund of sums paid. 14–28 days: 50% of rental retained. Within 14 days: deposit retained, balance refunded if not yet due.", "Cancellations record who, when, which policy version applied, and amounts charged/refunded. Exceptional cases go to manual review — never silent deletion."] },
  insurance: { title: "Insurance terms (template)", body: ["Comprehensive cover for the van with per-hire excess (£750–£1,250 by caravan). Third-party liability included. Exclusions: tyres/awning negligence, off-tarmac damage, undeclared drivers.", "Optional excess-reduction is offered only where our insurer permits. Policy documents are linked at checkout."] },
  refund: { title: "Refund policy (template)", body: ["Refunds follow the cancellation policy version recorded on your booking snapshot — later policy changes never alter confirmed reservations.", "Approved refunds are issued to the original payment method within 10 working days and recorded with actor and reason."] },
  deposit: { title: "Security deposit policy (template)", body: ["£500–£750 authorised with the balance, held separately, released within 5 working days of joint return inspection.", "Deductions require dated photos and signed inspection notes: damage, missing inventory, excess mileage (£0.35/mi), or valet-level soiling. The deposit is never reported as revenue."] },
  eligibility: { title: "Rental eligibility (template)", body: ["Minimum driver age 25 with 2 years' licence held. Licence entitlement and tow-car match verified by staff before confirmation.", "Completing website fields never declares eligibility — only staff approval after document review does."] },
  mileage: { title: "Mileage policy (template)", body: ["100–120 miles/night included by caravan. Odometer-equivalent mileage agreed at handover; excess at £0.35/mile. Extra 250-mile packs available pre-collection.", "Unlimited-mileage weeks offered off-peak by arrangement."] },
};

export default function LegalPage({ params }: { params: { slug: string } }) {
  const p = POLICIES[params.slug] ?? POLICIES.terms;
  return (
    <div className="bg-paper">
      <div className="mx-auto max-w-content px-5 py-12 sm:px-8">
        <p className="tick-label">Legal · template until operator-approved</p>
        <h1 className="mt-3 font-display text-5xl text-charcoal">{p.title}</h1>
        <div className="mt-6 max-w-2xl space-y-4 leading-relaxed text-charcoal/85">
          {p.body.map((b, i) => <p key={i}>{b}</p>)}
        </div>
        <p className="mt-8 border-t border-border pt-4 text-[0.85rem] text-muted">Questions: stay@hartleyandmoor.co.uk · <Link href="/contact" className="underline">Contact us</Link></p>
      </div>
    </div>
  );
}
