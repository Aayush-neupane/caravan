// Documented reservation state machine. Only listed transitions are legal;
// all transitions are enforced server-side (API + admin actions).

export const BOOKING_STATUSES = [
  "draft",
  "held",
  "awaiting_payment",
  "awaiting_documents",
  "confirmed",
  "ready",
  "active",
  "completed",
  "cancel_requested",
  "cancelled",
  "expired",
  "payment_review",
] as const;

export type BookingStatus = (typeof BOOKING_STATUSES)[number];

const TRANSITIONS: Record<BookingStatus, BookingStatus[]> = {
  draft: ["held", "expired", "cancelled"],
  // Online reservations are held until the depot counter: staff approve the
  // handover (physical documents checked) → active, or decline → cancelled.
  held: ["active", "expired", "cancelled"],
  // Doc gate enforced: payment must go through document review.
  // Direct awaiting_payment → confirmed removed (was a staff bypass).
  awaiting_payment: ["awaiting_documents", "payment_review", "expired", "cancelled"],
  awaiting_documents: ["confirmed", "cancelled", "expired"],
  confirmed: ["ready", "cancel_requested", "cancelled"],
  ready: ["active", "cancel_requested", "cancelled"],
  active: ["completed", "cancelled"],
  completed: [],
  cancel_requested: ["cancelled", "confirmed"],
  cancelled: [],
  expired: [],
  // Successful retry from review lands back in document review.
  payment_review: ["awaiting_payment", "awaiting_documents", "confirmed", "cancelled"],
};

export function canTransition(from: BookingStatus, to: BookingStatus): boolean {
  return TRANSITIONS[from]?.includes(to) ?? false;
}

export function assertTransition(from: BookingStatus, to: BookingStatus): void {
  if (!canTransition(from, to)) {
    throw new Error(`Invalid booking transition: ${from} → ${to}`);
  }
}

// Active states that block availability (overlap protection).
export const BLOCKING_STATUSES: BookingStatus[] = [
  "held",
  "awaiting_payment",
  "awaiting_documents",
  "confirmed",
  "ready",
  "active",
  "payment_review",
];
