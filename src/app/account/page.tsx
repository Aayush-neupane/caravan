import type { Metadata } from "next";
import { AccountView } from "./view";

export const metadata: Metadata = { title: "Account", description: "Your Hartley & Moor bookings, payments, documents and collection details.", robots: { index: false, follow: false } };

export default function AccountPage({ searchParams }: { searchParams: { email?: string; reference?: string } }) {
  return (
    <div className="bg-paper">
      <div className="mx-auto max-w-content px-5 py-10 sm:px-8">
        <p className="tick-label">Customer account</p>
        <h1 className="mt-2 font-display text-5xl text-charcoal">Your trips, in one place.</h1>
        <p className="mt-3 max-w-2xl text-muted">Guest access: enter the email and booking reference from your confirmation. Staff sign-in with demo accounts is under <span className="font-semibold">/account/sign-in</span>.</p>
        <AccountView email={searchParams.email} reference={searchParams.reference} />
      </div>
    </div>
  );
}
