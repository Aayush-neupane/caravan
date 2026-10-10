export const metadata = { title: "Settings", robots: { index: false, follow: false } };
export default function SettingsAdmin() {
  const rows: [string, string][] = [
    ["Currency", "AUD — rounding to whole cents, GST 10% on rental + fees + extras."],
    ["Booking deposit", "25% settled at the depot counter with the balance. Nothing is charged online."],
    ["Handover", "Online reservations sit held until staff log physical documents and approve at the counter."],
    ["Hold expiry", "20 minutes, enforced server-side; expired holds release inventory."],
    ["Preparation buffer", "1 day between return and next pickup; cleaning + inspection."],
    ["Collection hours", "Mon–Sat 09:00–16:00, Brunswick Depot, Melbourne."],
    ["Email provider", process.env.RESEND_API_KEY ? "Resend (configured)" : "Demo log mode — set RESEND_API_KEY to send."],
    ["Payments", process.env.STRIPE_SECRET_KEY ? "Stripe test mode (configured, reserved for future use)" : "Counter settlement — no online charging. Stripe keys reserved for future use."],
    ["Legal policies", "Solicitor sign-off required before taking real bookings (see README launch checklist)."],
  ];
  return (<div><h1 className="font-display text-4xl">Settings</h1><p className="mt-2 text-[0.9rem] text-muted">Operational configuration. Changes here are audit-logged in production.</p>
  <table className="table-quiet mt-4 bg-white"><tbody>{rows.map(([k, v]) => <tr key={k}><td className="font-semibold">{k}</td><td>{v}</td></tr>)}</tbody></table></div>);
}
