import { describe, it, expect, vi, beforeEach } from "vitest";

// The sweep is the only thing that moves an abandoned `held` reservation to
// `expired`, so its auth gate and per-booking transition are worth pinning.
const state = {
  rows: [] as { id: string; reference: string; createdAt: Date; holds: { expiresAt: Date }[] }[],
  statuses: new Map<string, string>(),
  history: [] as { bookingId: string; from: string | null; to: string; actor: string | null; note?: string }[],
  audits: [] as { action: string; resourceId: string }[],
};

vi.mock("@/lib/db", () => {
  const move = async ({ where, data }: { where: { id: string; status: string }; data: { status: string } }) => {
    if (state.statuses.get(where.id) !== where.status) return { count: 0 }; // someone else moved it
    state.statuses.set(where.id, data.status);
    return { count: 1 };
  };
  const history = async ({ data }: { data: { bookingId: string; from: string | null; to: string; actor: string | null; note?: string } }) => {
    state.history.push(data);
    return data;
  };
  const audit = async ({ data }: { data: { action: string; resourceId: string } }) => {
    state.audits.push(data);
    return data;
  };
  const tx = { booking: { updateMany: move }, bookingStatusHistory: { create: history }, auditLog: { create: audit } };
  return {
    prisma: {
      booking: { findMany: async () => state.rows, updateMany: move },
      bookingStatusHistory: { create: history },
      auditLog: { create: audit },
      $transaction: async (fn: (t: typeof tx) => Promise<boolean>) => fn(tx),
    },
  };
});

const { GET } = await import("@/app/api/cron/expire-holds/route");

const NOW = new Date("2026-10-10T12:00:00Z");
const call = (auth?: string) =>
  GET(new globalThis.Request("https://hm.test/api/cron/expire-holds", {
    method: "GET",
    headers: auth ? { authorization: auth } : {},
  }));

function reset() {
  state.rows = [];
  state.statuses = new Map();
  state.history = [];
  state.audits = [];
}

describe("hold expiry sweep", () => {
  beforeEach(() => {
    reset();
    vi.useFakeTimers();
    vi.setSystemTime(NOW);
    process.env.CRON_SECRET = "test-secret";
  });

  it("refuses to run without a configured secret (503)", async () => {
    delete process.env.CRON_SECRET;
    const r = await call("Bearer test-secret");
    expect(r.status).toBe(503);
  });

  it("refuses a wrong or missing bearer token (401)", async () => {
    expect((await call()).status).toBe(401);
    expect((await call("Bearer nope")).status).toBe(401);
  });

  it("expires held bookings whose hold lapsed and writes history + audit", async () => {
    state.rows = [
      { id: "b1", reference: "HM-1", createdAt: new Date("2026-10-10T11:30:00Z"), holds: [{ expiresAt: new Date("2026-10-10T11:45:00Z") }] },
      { id: "b2", reference: "HM-2", createdAt: new Date("2026-10-10T11:30:00Z"), holds: [{ expiresAt: new Date("2026-10-10T12:30:00Z") }] },
    ];
    state.statuses = new Map([["b1", "held"], ["b2", "held"]]);
    const r = await call("Bearer test-secret");
    expect(r.status).toBe(200);
    const j = await r.json();
    expect(j.expiredIds).toEqual(["b1"]);
    expect(state.statuses.get("b1")).toBe("expired");
    expect(state.statuses.get("b2")).toBe("held"); // live hold untouched
    expect(state.history).toHaveLength(1);
    expect(state.history[0]).toMatchObject({ bookingId: "b1", from: "held", to: "expired", actor: "system" });
    expect(state.history[0].note).toMatch(/released automatically/);
    expect(state.audits[0]).toMatchObject({ action: "booking:expire", resourceId: "b1" });
  });

  it("expires a held booking with no hold only after the 30-minute grace window", async () => {
    state.rows = [
      { id: "fresh", reference: "HM-3", createdAt: new Date("2026-10-10T11:50:00Z"), holds: [] },
      { id: "orphan", reference: "HM-4", createdAt: new Date("2026-10-10T11:00:00Z"), holds: [] },
    ];
    state.statuses = new Map([["fresh", "held"], ["orphan", "held"]]);
    const j = await (await call("Bearer test-secret")).json();
    expect(j.expiredIds).toEqual(["orphan"]);
  });

  it("leaves rows a staff member already moved alone", async () => {
    state.rows = [{ id: "b5", reference: "HM-5", createdAt: new Date("2026-10-10T11:00:00Z"), holds: [{ expiresAt: new Date("2026-10-10T11:01:00Z") }] }];
    state.statuses = new Map([["b5", "confirmed"]]);
    const j = await (await call("Bearer test-secret")).json();
    expect(j.expiredIds).toEqual([]);
    expect(state.history).toHaveLength(0);
  });
});
