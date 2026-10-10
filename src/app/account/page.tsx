import type { Metadata } from "next";
import { AccountView } from "./view";

export const metadata: Metadata = { title: "Find your reservation", description: "Look up your Hartley & Moor collection voucher by email and booking reference. No account needed.", robots: { index: false, follow: false } };

export default function AccountPage({ searchParams }: { searchParams: { email?: string; reference?: string } }) {
  return (
    <div className="bg-paper">
      <div className="mx-auto max-w-content px-5 py-10 sm:px-8">
        <p className="tick-label">Collection voucher lookup</p>
        <h1 className="mt-2 font-display text-5xl text-charcoal">Find your reservation.</h1>
        <p className="mt-3 max-w-2xl text-muted">No account needed — enter the email and booking reference from your voucher. Staff sign in under <span className="font-semibold">/account/sign-in</span>.</p>
        <AccountView email={searchParams.email} reference={searchParams.reference} />
      </div>
    </div>
  );
}
