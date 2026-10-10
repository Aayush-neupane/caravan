"use client";

import { useState } from "react";

export function ContactForm() {
  const [state, setState] = useState<{ sending: boolean; ok?: boolean; error?: string }>({ sending: false });

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    setState({ sending: true });
    try {
      const r = await fetch("/api/contact", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ name: fd.get("name"), email: fd.get("email"), topic: fd.get("topic"), message: fd.get("message") }),
      });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error ?? "Send failed");
      setState({ sending: false, ok: true });
      (e.target as HTMLFormElement).reset();
    } catch (err) {
      setState({ sending: false, error: err instanceof Error ? err.message : "Send failed" });
    }
  }

  if (state.ok) {
    return (
      <div className="border border-success/40 bg-white p-8" style={{ borderRadius: 10 }} role="status">
        <h2 className="font-display text-3xl text-success">Thank you — message received.</h2>
        <p className="mt-2 text-muted">We reply within one working day in season. For urgent collection-day issues, call +44 1225 555 014.</p>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="border border-border bg-white p-6 sm:p-8" style={{ borderRadius: 10 }} aria-label="Contact form">
      <div className="grid gap-4 sm:grid-cols-2">
        <div><label className="field-label" htmlFor="c-name">Name *</label><input id="c-name" name="name" required className="field-input" maxLength={80} /></div>
        <div><label className="field-label" htmlFor="c-email">Email *</label><input id="c-email" name="email" type="email" required className="field-input" /></div>
      </div>
      <div className="mt-4">
        <label className="field-label" htmlFor="c-topic">Topic</label>
        <select id="c-topic" name="topic" className="field-input" defaultValue="Booking question">
          <option>Booking question</option><option>Tow-car matching</option><option>Existing reservation</option><option>Press</option>
        </select>
      </div>
      <div className="mt-4">
        <label className="field-label" htmlFor="c-msg">Message *</label>
        <textarea id="c-msg" name="message" required rows={5} minLength={10} maxLength={2000} className="field-input" placeholder="Dates, caravan, tow car — anything that helps us answer properly." />
      </div>
      {state.error && <p role="alert" className="field-error">{state.error}</p>}
      <button type="submit" disabled={state.sending} className="btn-primary mt-5 w-full sm:w-auto">{state.sending ? "Sending…" : "Send message"}</button>
    </form>
  );
}
