"use client";

import { useEffect } from "react";
import Link from "next/link";

// Root error boundary — must define its own <html><body> (it replaces the
// root layout on failure). Keeps styling self-contained (no layout classes).
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[global-error]", error);
  }, [error]);

  return (
    <html lang="en-AU">
      <body style={{ fontFamily: "system-ui, sans-serif", margin: 0, background: "#EFEDE6" }}>
        <main
          style={{
            maxWidth: 560,
            margin: "0 auto",
            minHeight: "60svh",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            textAlign: "center",
            padding: 24,
          }}
        >
          <p style={{ fontSize: 12, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.2em" }}>
            Something went wrong
          </p>
          <h1 style={{ fontSize: 32, margin: "12px 0" }}>That lane is blocked.</h1>
          <p style={{ opacity: 0.75 }}>
            An unexpected error occurred. Your booking details are safe.
            {error.digest ? <span style={{ display: "block", fontSize: 12 }}>Ref {error.digest}</span> : null}
          </p>
          <div style={{ display: "flex", gap: 12, marginTop: 24 }}>
            <button type="button" onClick={reset} style={{ padding: "10px 20px", cursor: "pointer" }}>
              Try again
            </button>
            <Link href="/" style={{ padding: "10px 20px" }}>
              Back home
            </Link>
          </div>
        </main>
      </body>
    </html>
  );
}
