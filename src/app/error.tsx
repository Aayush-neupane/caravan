"use client";

import { useEffect } from "react";
import Link from "next/link";

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    // Surface the failure (digest included) so it can be traced server-side.
    console.error("Unhandled application error:", error.message, error.digest ?? "");
  }, [error]);

  return (
    <section className="mx-auto flex min-h-[60svh] w-full max-w-content flex-col items-center justify-center px-5 py-24 text-center">
      <p className="tick-accent">Something went astray</p>
      <h1 className="mt-3 font-display text-5xl">That lane is blocked.</h1>
      <p className="mt-3 max-w-md text-charcoal/75">
        An unexpected error occurred. Try again — your booking details are safe.
        {error.digest ? <span className="mt-2 block font-mono text-[0.72rem] text-muted">Ref {error.digest}</span> : null}
      </p>
      <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
        <button type="button" onClick={reset} className="btn-primary">
          Try again
        </button>
        <Link href="/" className="btn-secondary">Back to home</Link>
      </div>
    </section>
  );
}
