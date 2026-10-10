import Link from "next/link";

export default function NotFound() {
  return (
    <div className="mx-auto max-w-content px-5 py-20 text-center sm:px-8">
      <p className="tick-label">Not found</p>
      <h1 className="mt-3 font-display text-5xl">That lane does not exist.</h1>
      <p className="mx-auto mt-4 max-w-md text-muted">The page moved or was never signposted. Try the fleet, the itineraries, or the homepage.</p>
      <div className="mt-6 flex justify-center gap-3">
        <Link href="/" className="btn-primary">Home</Link>
        <Link href="/fleet" className="btn-secondary">Fleet</Link>
      </div>
    </div>
  );
}
