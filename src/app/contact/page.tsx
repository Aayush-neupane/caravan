import type { Metadata } from "next";
import { ContactForm } from "./form";

export const metadata: Metadata = { title: "Contact", description: "Contact Wattle & Wander in Melbourne: bookings, tow-car matching and press. Server-validated form, answered by humans." };

export default function ContactPage() {
  return (
    <div className="bg-paper">
      <div className="mx-auto grid max-w-wide gap-10 px-5 py-12 sm:px-8 lg:grid-cols-12">
        <div className="lg:col-span-5">
          <p className="tick-label">Contact</p>
          <h1 className="mt-3 text-balance font-display text-5xl text-charcoal">Ask a human.</h1>
          <p className="mt-4 leading-relaxed text-muted">Bookings, tow-car matching, late returns — answered from Melbourne, usually within one working day in season.</p>
          <dl className="mt-6 space-y-3 border-t border-border pt-6 text-[0.93rem]">
            <div><dt className="tick-label">Depot</dt><dd className="mt-1">Brunswick Depot, 123 Sydney Rd, Brunswick VIC 3056 · Mon–Sat 09:00–16:00</dd></div>
            <div><dt className="tick-label">Phone</dt><dd className="mt-1"><a href="tel:+61391234567" className="underline hover:text-forest">+61 3 9123 4567</a></dd></div>
            <div><dt className="tick-label">Email</dt><dd className="mt-1"><a href="mailto:hello@wattleandwander.com.au" className="underline hover:text-forest">hello@wattleandwander.com.au</a></dd></div>
          </dl>
        </div>
        <div className="lg:col-span-6 lg:col-start-7">
          <ContactForm />
        </div>
      </div>
    </div>
  );
}
