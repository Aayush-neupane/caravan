import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = { title: "Towing & eligibility guide", description: "Victorian licence rules, tow-vehicle matching, ball weight, safety checks and collection-day requirements for hiring a caravan from Melbourne." };

export default function TowingGuide() {
  return (
    <div className="bg-paper">
      <div className="mx-auto max-w-content px-5 py-12 sm:px-8">
        <p className="tick-label">Practical guide</p>
        <h1 className="mt-3 font-display text-5xl text-charcoal">Towing, without the folklore.</h1>
        <p className="mt-4 max-w-2xl leading-relaxed text-muted">
          General guidance below; our <Link href="/legal/terms" className="underline">rental conditions</Link> are the
          binding rules. We verify your combination before confirming — filling in a form never declares you eligible.
        </p>
        <div className="mt-8 grid gap-8 lg:grid-cols-12">
          <div className="space-y-6 lg:col-span-7">
            {[
              ["Licences (Vic)", "Most full Victorian car licences cover Rowan (1,350kg ATM) with a suitable tow vehicle; Alder and Solace need a checked combination. Bring your physical licence (or Service Victoria digital licence); we verify entitlement at handover."],
              ["Tow-car matching", "Your car's braked towing limit and kerbweight must suit the van: Rowan ≥1,600kg, Alder ≥1,900kg, Solace ≥2,200kg braked capacity. As a guide, the van's MTPLM should not exceed 85% of the car's kerbweight for novices. Send us your registration before paying the balance and we will confirm in writing."],
              ["Weights that matter", "MTPLM is the van's maximum laden weight (on its plate). Payload is MTPLM minus unladen weight — typically 150–200kg for clothes, food and kit. Ball weight (downforce on the tow coupling, 50–100kg) is set with you at handover using a gauge."],
              ["Hitch & electrics", "All vans use a 50mm ball with stabiliser hitch and 13-pin electrics (adapters loaned for 7-pin cars). Breakaway cable, ATC trailer control and motor movers fitted. Mirrors loaned free — you need an unobstructed view down both sides."],
              ["Safety checks", "Tyre pressures and wheel-bolt torque set and recorded. Lights, breakaway, handbrake and load distribution checked together. Speed limits with a trailer: 50mph single carriageway, 60mph dual/motorway (UK), left lane discipline, four-second gaps."],
              ["Collection day", "Licence + check code, tow-car V5C or hire letter, proof of address. 40 minutes, accompanied drive included. Arrive 15 minutes early; late arrivals compress the handover, never skip it."],
              ["Insurance", "Third-party liability and the van's comprehensive cover are included with a per-hire excess ($1,200–$2,000 by van). Optional excess-reduction is offered only where our insurer permits — terms linked at checkout, not implied by a checkbox."],
            ].map(([t, d]) => (
              <section key={t} className="border-t border-border pt-5">
                <h2 className="font-display text-2xl text-forest">{t}</h2>
                <p className="mt-2 leading-relaxed text-charcoal/85">{d}</p>
              </section>
            ))}
          </div>
          <aside className="lg:col-span-4 lg:col-start-9">
            <div className="border border-border bg-white p-6 lg:sticky lg:top-24" style={{ borderRadius: 10 }}>
              <p className="tick-label">Quick check</p>
              <ul className="mt-3 space-y-2 text-[0.92rem] text-charcoal/85">
                <li>✓ Licence category + check code</li>
                <li>✓ Car braked limit ≥ van MTPLM margin</li>
                <li>✓ Towball, 13-pin (or adapter), mirrors</li>
                <li>✓ Ball weight 50–100 kg, load low &amp; centred</li>
                <li>✓ 50 / 60 mph limits, four-second gaps</li>
              </ul>
              <Link href="/booking" className="btn-primary mt-5 w-full">Start a booking</Link>
              <p className="mt-3 text-[0.8rem] text-muted">Unsure? Email your car registration to <span className="font-semibold">hello@wattleandwander.com.au</span> and we will match it in writing.</p>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
