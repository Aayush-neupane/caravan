import type { Metadata } from "next";
import Link from "next/link";
import { Framed } from "@/components/editorial/Decor";
import { ScrollRoute } from "@/components/editorial/ScrollRoute";

export const metadata: Metadata = { title: "About", description: "Wattle & Wander: three caravans from Melbourne, kept to a high standard. Selection philosophy, service standards and honest limits." };

export default function AboutPage() {
  return (
    <div className="bg-paper">
      <div className="mx-auto max-w-content px-5 py-12 sm:px-8">
        <p className="tick-label">About</p>
        <h1 className="mt-3 text-balance font-display text-5xl text-charcoal">Kept small on purpose.</h1>
        <div className="mt-6 grid gap-10 lg:grid-cols-12">
          <div className="lg:col-span-7">
            <Framed
              src="https://images.pexels.com/photos/7476895/pexels-photo-7476895.jpeg?auto=compress&cs=tinysrgb&w=1400"
              alt="Camper trailer with its door open on a sunny day"
              caption="Ready at the yard — why we do this"
              meta="FRAME 009 · THE YARD"
              ratio="aspect-[16/9]"
              radius={10}
            />
            <div className="mt-6 space-y-4 leading-relaxed text-charcoal/85">
              <p>Wattle &amp; Wander began with one van, one lane, and a stubborn belief: a hire caravan should feel considered, not disposable. We buy fewer vans than we could fill, service them beyond the schedule, and furnish them the way we would want to find them.</p>
              <p>We are based at Brunswick Depot in Melbourne, serving Victoria, the Great Ocean Road and Gippsland. Collection is by appointment, handover is unhurried, and the phone is answered by someone who tows.</p>
              <p><strong>What we will not claim:</strong> invented fleet sizes, fabricated reviews, or guarantees about weather, wildlife and empty roads. What we promise is a clean, safe, honestly-described van and a fair resolution when things go wrong.</p>
            </div>
          </div>
          <aside className="lg:col-span-4 lg:col-start-9">
            <div className="border border-border bg-white p-6" style={{ borderRadius: 10 }}>
              <p className="tick-label">Standards</p>
              <ul className="mt-3 space-y-2.5 text-[0.93rem] text-charcoal/85">
                <li>✓ Annual service + pre-hire 40-point check</li>
                <li>✓ Mattresses replaced on condition, not age</li>
                <li>✓ Ball weight set and recorded every hire</li>
                <li>✓ Deposit released within 5 working days</li>
                <li>✓ Real humans, Melbourne-based, 7 days in season</li>
              </ul>
              <Link href="/fleet" className="btn-primary mt-5 w-full">Meet the fleet</Link>
            </div>
          </aside>
        </div>
      </div>
      <div className="border-t border-border bg-sand/50 py-6">
        <ScrollRoute from="ONE VAN" to="THREE VANS" note="kept small on purpose" />
      </div>
    </div>
  );
}
