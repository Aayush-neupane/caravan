// Single source of truth for staff membership. Edge-safe (no node-only
// imports) so middleware and route handlers share it without drift.
export const STAFF_ROLES = [
  "owner",
  "admin",
  "booking_manager",
  "fleet_manager",
  "document_reviewer",
  "support",
  "analyst",
];

export function isStaffRole(role?: string): boolean {
  return STAFF_ROLES.includes(role ?? "");
}
