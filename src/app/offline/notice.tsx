"use client";

import Link from "next/link";

// Client island: retry needs the browser. Everything else is static.
export function OfflineNotice() {
  return (
    <div className="mt-6 flex flex-wrap justify-center gap-3">
      <button type="button" onClick={() => window.location.reload()} className="btn-primary">
        Try again
      </button>
      <Link href="/" className="btn-secondary">Back home</Link>
    </div>
  );
}
