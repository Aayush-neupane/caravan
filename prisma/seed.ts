// Seed: three demo caravans + operational scenarios.
// Run: npx prisma db push && npm run seed
// Safe to re-run (upserts by slug/code). Clearly labelled demo data.
// REFUSES production unless explicitly allowed — demo bookings, payments and
// credentials must never pollute live reports.
if (process.env.NODE_ENV === "production" && process.env.ALLOW_SEED !== "true") {
  console.error("Refusing to seed in production without ALLOW_SEED=true.");
  process.exit(1);
}

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const IMG = {
  rowan: [
    ["https://images.unsplash.com/photo-1523987355523-c7b5b0dd90a7?auto=format&fit=crop&w=1600&q=70", "The Rowan caravan parked beside a pine forest at dawn", "exterior"],
    ["https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?auto=format&fit=crop&w=1600&q=70", "Awning and camp chairs outside the caravan in soft evening light", "exterior"],
    ["https://images.unsplash.com/photo-1510312305653-8ed496efae75?auto=format&fit=crop&w=1600&q=70", "Compact caravan interior with timber finishes and made-up double bed", "sleeping"],
    ["https://images.unsplash.com/photo-1556911220-bff31c812dba?auto=format&fit=crop&w=1600&q=70", "Fitted caravan kitchen with hob and preparation space", "kitchen"],
  ],
  alder: [
    ["https://images.unsplash.com/photo-1516937941344-00b4e0337589?auto=format&fit=crop&w=1600&q=70", "The Alder caravan on open moorland under a wide sky", "exterior"],
    ["https://images.unsplash.com/photo-1496545672447-f699b503d270?auto=format&fit=crop&w=1600&q=70", "Alder lounge with wool throws and oak table in morning light", "living"],
    ["https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=1600&q=70", "Fixed island bed with linen and reading lights", "sleeping"],
    ["https://images.unsplash.com/photo-1484154218962-a197022b5858?auto=format&fit=crop&w=1600&q=70", "Kitchen and dining area with natural materials", "kitchen"],
  ],
  solace: [
    ["https://images.unsplash.com/photo-1504851149312-7a075b496cc7?auto=format&fit=crop&w=1600&q=70", "The Solace family caravan beside a lake at golden hour", "exterior"],
    ["https://images.unsplash.com/photo-1537225228614-56cc3556d7ed?auto=format&fit=crop&w=1600&q=70", "Family lounge with bunk area beyond", "living"],
    ["https://images.unsplash.com/photo-1519710164239-da123dc03ef4?auto=format&fit=crop&w=1600&q=70", "Dining area set for breakfast", "living"],
    ["https://images.unsplash.com/photo-1505691938895-1758d7feb511?auto=format&fit=crop&w=1600&q=70", "Fixed bunks with individual reading lights", "sleeping"],
  ],
} as const;

function days(n: number): Date {
  const d = new Date();
  d.setDate(d.getDate() + n);
  d.setUTCHours(12, 0, 0, 0);
  return d;
}

async function main() {
  const location = await prisma.location.upsert({
    where: { id: "loc-lansdown" },
    update: {},
    create: { id: "loc-lansdown", name: "Bath — Lansdown Depot", address: "Charlcombe Lane, Bath BA1 9BT", pickupNotes: "Mon–Sat 09:00–16:00. Arrive 15 minutes early." },
  });

  for (const [name, slug, desc] of [
    ["Compact Tourer", "compact-tourer", "Easy-towing two-berth layouts for lanes and first-timers."],
    ["Premium Two-Berth", "premium-two-berth", "Fixed beds, separate showers, considered materials."],
    ["Family Four-Berth", "family-four-berth", "Bunks plus a convertible double for family weeks."],
  ]) {
    await prisma.caravanCategory.upsert({ where: { slug }, update: {}, create: { name, slug, description: desc } });
  }

  const vans = [
    { slug: "the-rowan", name: "The Rowan", cat: "compact-tourer", berths: 2, max: 2, base: 9500, wknd: 11000, disc: 10, min: 2, maxN: 21, clean: 7500, dep: 50000, miles: 100, mtplm: 1350, len: 7.1, wid: 2.23 },
    { slug: "the-alder", name: "The Alder", cat: "premium-two-berth", berths: 2, max: 2, base: 14500, wknd: 16500, disc: 12, min: 3, maxN: 28, clean: 8500, dep: 65000, miles: 120, mtplm: 1550, len: 7.9, wid: 2.45 },
    { slug: "the-solace", name: "The Solace", cat: "family-four-berth", berths: 4, max: 5, base: 16500, wknd: 18500, disc: 15, min: 3, maxN: 28, clean: 9500, dep: 75000, miles: 120, mtplm: 1750, len: 8.6, wid: 2.5 },
  ];

  for (const v of vans) {
    const cat = await prisma.caravanCategory.findUniqueOrThrow({ where: { slug: v.cat } });
    const taglines: Record<string, string> = {
      "the-rowan": "Compact touring caravan for two",
      "the-alder": "Premium two-berth with separate shower",
      "the-solace": "Family caravan sleeping four",
    };
    const descs: Record<string, string> = {
      "the-rowan": "A compact touring layout for two, with a fitted kitchen, dedicated sleeping area, and clearly listed towing requirements.",
      "the-alder": "Our most considered two-berth. A fixed island bed, separate shower room, and a reading corner by the panoramic window.",
      "the-solace": "A larger family layout sleeping four: fixed bunks, convertible front double, and a proper washroom.",
    };
    await prisma.caravan.upsert({
      where: { slug: v.slug },
      update: {},
      create: {
        name: v.name, slug: v.slug, tagline: taglines[v.slug], description: descs[v.slug],
        categoryId: cat.id, locationId: location.id,
        berths: v.berths, maxTravellers: v.max, baseNightlyPence: v.base, weekendNightlyPence: v.wknd,
        weeklyDiscountPct: v.disc, minNights: v.min, maxNights: v.maxN, cleaningFeePence: v.clean,
        securityDepositPence: v.dep, mileagePerNight: v.miles, mtplmKg: v.mtplm, lengthM: v.len, widthM: v.wid,
        published: true,
      },
    });
    const van = await prisma.caravan.findUniqueOrThrow({ where: { slug: v.slug } });
    await prisma.caravanImage.deleteMany({ where: { caravanId: van.id } });
    const key = v.slug.replace("the-", "") as keyof typeof IMG;
    for (const [i, [url, alt, kind]] of IMG[key].entries()) {
      await prisma.caravanImage.create({ data: { caravanId: van.id, url, alt, kind, sort: i } });
    }
  }

  // Extras
  const extras: [string, string, string, number, string][] = [
    ["Bedding pack", "bedding-pack", "Laundered duvet, pillows, linen and towels per person.", 3500, "per_rental"],
    ["Kitchen upgrade", "kitchen-pack", "Outdoor cooking set, cool box and pantry staples.", 2500, "per_rental"],
    ["Outdoor furniture", "outdoor-furniture", "Chairs, table and windbreak.", 2000, "per_rental"],
    ["Air awning", "awning", "Drive-away air awning fitted at collection.", 4500, "per_rental"],
    ["Bike rack + hire", "bike-rack", "Tow-bar rack for two bikes.", 3000, "per_rental"],
    ["Extra mileage (250 mi)", "extra-mileage", "Additional 250 miles added to your allowance.", 5500, "per_item"],
    ["Early collection", "early-pickup", "Collect from 09:00 with full handover.", 3500, "per_rental"],
  ];
  for (const [name, slug, desc, price, unit] of extras) {
    await prisma.extra.upsert({ where: { slug }, update: {}, create: { name, slug, description: desc, pricePence: price, unit } });
  }
  for (const van of await prisma.caravan.findMany()) {
    for (const ex of await prisma.extra.findMany()) {
      await prisma.caravanExtra.upsert({ where: { caravanId_extraId: { caravanId: van.id, extraId: ex.id } }, update: {}, create: { caravanId: van.id, extraId: ex.id } });
    }
  }

  // Pricing rules, coupons, vouchers
  await prisma.seasonalRate.upsert({ where: { id: "season-summer" }, update: {}, create: { id: "season-summer", name: "High summer (15 Jun–5 Sep)", startMonthDay: "06-15", endMonthDay: "09-05", multiplierPct: 120 } });
  await prisma.seasonalRate.upsert({ where: { id: "season-festive" }, update: {}, create: { id: "season-festive", name: "Festive (20 Dec–4 Jan)", startMonthDay: "12-20", endMonthDay: "01-04", multiplierPct: 110 } });
  await prisma.discountRule.upsert({ where: { id: "disc-weekly" }, update: {}, create: { id: "disc-weekly", name: "Weekly stay", minNights: 7, pct: 12 } });
  await prisma.coupon.upsert({ where: { code: "SLOW10" }, update: {}, create: { code: "SLOW10", kind: "percent", value: 10, minTotalPence: 20000, maxUses: 100 } });
  await prisma.voucher.upsert({ where: { code: "GIFT-250" }, update: {}, create: { code: "GIFT-250", balancePence: 25000, initialPence: 25000 } });

  // Users
  await prisma.user.upsert({ where: { email: "owner@hartleyandmoor.example" }, update: {}, create: { email: "owner@hartleyandmoor.example", name: "M. Hartley", role: "owner" } });
  const custUser = await prisma.user.upsert({ where: { email: "customer@example.com" }, update: {}, create: { email: "customer@example.com", name: "Demo Traveller", role: "customer" } });
  await prisma.customerProfile.upsert({ where: { userId: custUser.id }, update: {}, create: { userId: custUser.id, phone: "+44 7700 900000" } });

  // Operational scenarios
  const rowan = await prisma.caravan.findUniqueOrThrow({ where: { slug: "the-rowan" } });
  const alder = await prisma.caravan.findUniqueOrThrow({ where: { slug: "the-alder" } });
  const solace = await prisma.caravan.findUniqueOrThrow({ where: { slug: "the-solace" } });
  const bedding = await prisma.extra.findUniqueOrThrow({ where: { slug: "bedding-pack" } });

  async function mkBooking(ref: string, vanId: string, pick: Date, ret: Date, status: string, total: number, guestEmail = "customer@example.com") {
    await prisma.booking.deleteMany({ where: { reference: ref } });
    return prisma.booking.create({
      data: {
        reference: ref, caravanId: vanId, guestName: "Demo Traveller", guestEmail, guestPhone: "+44 7700 900000",
        pickupDate: pick, returnDate: ret, travellers: 2, status,
        subtotalPence: Math.round(total * 0.7), feesPence: 8500, extrasPence: 0, taxPence: Math.round(total * 0.2), totalPence: total,
        depositDuePence: Math.round(total * 0.25), securityDepositPence: 65000, currency: "GBP",
        quoteSnapshot: JSON.stringify({ totalPence: total, demo: true, note: "Seeded immutable snapshot" }),
        statusHistory: { create: [{ from: null, to: status, actor: "seed", note: "Demonstration record" }] },
      },
    });
  }

  // 1. Available caravan (Rowan has only a distant booking) / 2. Unavailable range (Alder booked days 20–26)
  await mkBooking("HM-DEMO01", alder.id, days(20), days(26), "confirmed", 87000);
  // 3. Expiring hold on Solace
  await prisma.bookingHold.deleteMany({ where: { token: "hold_demo_expiring" } });
  await prisma.bookingHold.create({ data: { caravanId: solace.id, pickupDate: days(30), returnDate: days(34), token: "hold_demo_expiring", expiresAt: new Date(Date.now() + 20 * 60 * 1000) } });
  // 4/6/7. Online reservation awaiting the depot counter (held) + extras + logged licence
  const b4 = await mkBooking("HM-DEMO02", solace.id, days(40), days(47), "held", 132000);
  await prisma.bookingExtraItem.deleteMany({ where: { bookingId: b4.id } });
  await prisma.bookingExtraItem.create({ data: { bookingId: b4.id, extraId: bedding.id, qty: 4, unitPricePence: 3500, totalPence: 14000 } });
  await prisma.payment.deleteMany({ where: { bookingId: b4.id } });
  // 5. Declined at the counter (documents insufficient)
  const b5 = await mkBooking("HM-DEMO03", rowan.id, days(50), days(53), "cancelled", 34200);
  await prisma.booking.update({ where: { id: b5.id }, data: { cancelReason: "Declined at counter — licence entitlement insufficient (demo)" } });
  await prisma.payment.deleteMany({ where: { bookingId: b5.id } });
  // 8. Maintenance conflict guard (Alder service overlapping nothing, plus one flagged near booking)
  await prisma.maintenanceRecord.deleteMany({ where: { caravanId: alder.id } });
  await prisma.maintenanceRecord.create({ data: { caravanId: alder.id, startDate: days(60), endDate: days(62), category: "Annual service", description: "Demo: habitation + chassis service", priority: "high" } });
  // 9. Physical licence logged at the counter for the held reservation
  await prisma.customerDocument.deleteMany({ where: { bookingId: b4.id } });
  await prisma.customerDocument.create({ data: { bookingId: b4.id, kind: "driving_licence", fileName: "Physical copy seen at counter", fileUrl: "counter://physical", status: "approved", reviewerNote: "Original seen, in date (demo)" } });
  // 10/11. Cancelled + refund
  const b10 = await mkBooking("HM-DEMO04", rowan.id, days(-30), days(-27), "cancelled", 34200);
  await prisma.refund.deleteMany({ where: { bookingId: b10.id } });
  await prisma.refund.create({ data: { bookingId: b10.id, amountPence: 34200, reason: "Cancelled 30+ days before collection — full refund per policy v2026.1", actor: "seed", status: "recorded" } });
  // 12. Manual booking by admin (confirmed, Rowan)
  await mkBooking("HM-DEMO05", rowan.id, days(90), days(95), "confirmed", 57000, "walk-in@example.com");
  // 13. Concurrent-attempt pair is exercised in tests, not seeded as a clash.
  // 14. Pricing-change stability: b4 snapshot stays fixed even if base rates change.

  // Content + FAQs + reviews
  await prisma.destination.upsert({ where: { slug: "cotswold-lanes" }, update: {}, create: { name: "Cotswold Lanes", slug: "cotswold-lanes", intro: "Honey-stone villages and quiet escarpment lanes.", duration: "4–6 nights", season: "April to October", heroImage: "https://images.unsplash.com/photo-1467269204594-9661b134dd2b?auto=format&fit=crop&w=1800&q=70", stops: JSON.stringify([{ name: "Bath → Castle Combe" }]), practical: "Narrow lanes reward slow towing.", distanceMi: 180 } });
  await prisma.destination.upsert({ where: { slug: "pembrokeshire-coast" }, update: {}, create: { name: "Pembrokeshire Coast", slug: "pembrokeshire-coast", intro: "Cliff paths and Atlantic light.", duration: "6–8 nights", season: "May to September", heroImage: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1800&q=70", stops: JSON.stringify([{ name: "Bath → St Davids" }]), practical: "Exposed pitches — windbreak advised.", distanceMi: 420 } });
  await prisma.destination.upsert({ where: { slug: "brecon-dark-skies" }, update: {}, create: { name: "Brecon Dark Skies", slug: "brecon-dark-skies", intro: "Reservoirs, waterfalls and a protected night sky.", duration: "3–5 nights", season: "September to March", heroImage: "https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?auto=format&fit=crop&w=1800&q=70", stops: JSON.stringify([{ name: "Bath → Abergavenny" }]), practical: "Patchy signal — download offline maps.", distanceMi: 210 } });

  await prisma.faq.deleteMany({});
  for (const [i, [section, q, a]] of [
    ["Booking", "Do I need experience towing?", "No — every hire begins with a 40-minute accompanied handover."],
    ["Booking", "What is included in the price?", "Nightly rate, VAT, gas, kit and breakdown cover. Cleaning and refundable deposit shown separately."],
    ["Towing", "What licence do I need?", "Rowan suits most Category B licences; Alder and Solace need a checked combination."],
  ].entries()) {
    await prisma.faq.create({ data: { section, question: q, answer: a, sort: i } });
  }

  console.log("Seed complete: 3 caravans, extras, rules, 5 demo bookings, hold, payments, refund, document, maintenance.");
}

main().catch((e) => { console.error(e); process.exit(1); }).finally(() => prisma.$disconnect());
