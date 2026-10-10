import type { Metadata } from "next";
import { BookingFlow } from "./flow";

export const metadata: Metadata = {
  title: "Book",
  description: "Three-step booking: dates & caravan, extras & eligibility, details & payment. Live availability, itemised pricing, guest checkout.",
  robots: { index: false, follow: false },
};

export default function BookingPage({ searchParams }: { searchParams: Record<string, string | undefined> }) {
  return (
    <div className="bg-paper">
      <div className="mx-auto max-w-content px-5 py-10 sm:px-8">
        <p className="tick-label">Booking</p>
        <h1 className="mt-2 font-display text-5xl text-charcoal">Your booking, in three steps.</h1>
        <BookingFlow initial={searchParams} />
      </div>
    </div>
  );
}
