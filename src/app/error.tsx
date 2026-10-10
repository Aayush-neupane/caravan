"use client";

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <section className="mx-auto flex min-h-[60svh] w-full max-w-content flex-col items-center justify-center px-5 py-24 text-center">
      <p className="font-mono text-[0.68rem] font-bold uppercase tracking-[0.22em] text-amber">Something went astray</p>
      <h1 className="mt-3 font-display text-5xl">That lane is blocked.</h1>
      <p className="mt-3 max-w-md text-charcoal/75">
        An unexpected error occurred. Try again — your booking details are safe.
        {error.digest ? <span className="mt-2 block font-mono text-[0.72rem] text-muted">Ref {error.digest}</span> : null}
      </p>
      <button type="button" onClick={reset} className="btn-primary mt-6">
        Try again
      </button>
    </section>
  );
}
