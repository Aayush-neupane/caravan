export const metadata = { title: "Settings", robots: { index: false, follow: false } };
export default function SettingsAdmin() {
  const rows: [string, string][] = [
    ["Currency", "GBP — rounding to whole pence, VAT 20% on rental + fees + extras."],
    ["Booking deposit", "25% at reservation; balance due 28 days before collection."],
    ["Hold expiry", "20 minutes, enforced server-side; expired holds release inventory."],
    ["Preparation buffer", "1 day between return and next pickup; cleaning + inspection."],
    ["Collection hours", "Mon–Sat 09:00–16:00, Lansdown Depot, Bath."],
    ["Email provider", process.env.RESEND_API_KEY ? "Resend (configured)" : "Demo log mode — set RESEND_API_KEY to send."],
    ["Payments", process.env.STRIPE_SECRET_KEY ? "Stripe test mode (configured)" : "Demo mode — set STRIPE_SECRET_KEY + webhook secret for test payments."],
    ["Legal templates", "All legal pages labelled template until operator approval."],
  ];
  return (<div><h1 className="font-display text-4xl">Settings</h1><p className="mt-2 text-[0.9rem] text-muted">Operational configuration. Changes here are audit-logged in production.</p>
  <table className="table-quiet mt-4 bg-white"><tbody>{rows.map(([k, v]) => <tr key={k}><td className="font-semibold">{k}</td><td>{v}</td></tr>)}</tbody></table></div>);
}
