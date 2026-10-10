// Seed: three demo caravans + operational scenarios.
// Run: npx prisma migrate deploy && npm run seed
// Safe to re-run (upserts by slug/code). Clearly labelled demo data.
// REFUSES production unless explicitly allowed — demo bookings, payments and
// credentials must never pollute live reports.
if (process.env.NODE_ENV === "production" && process.env.ALLOW_SEED !== "true") {
  console.error("Refusing to seed in production without ALLOW_SEED=true.");
  process.exit(1);
}

import { PrismaClient } from "@prisma/client";
import { priceQuote } from "@/features/pricing/engine";
import { getPricingRules } from "@/features/pricing/rules";

const prisma = new PrismaClient();

const IMG = {
  rowan: [
    ["https://images.pexels.com/photos/31995029/pexels-photo-31995029.jpeg?auto=compress&cs=tinysrgb&w=1600", "The Rowan set up at a bush campsite among the trees", "exterior"],
    ["https://images.pexels.com/photos/7163681/pexels-photo-7163681.jpeg?auto=compress&cs=tinysrgb&w=1600", "Annexe awning set up beside the caravan at camp", "exterior"],
    ["https://images.pexels.com/photos/26976127/pexels-photo-26976127.jpeg?auto=compress&cs=tinysrgb&w=1600", "Double bed in soft daylight with privacy curtains", "sleeping"],
    ["https://images.pexels.com/photos/7476238/pexels-photo-7476238.jpeg?auto=compress&cs=tinysrgb&w=1600", "Galley kitchen being used to cook a meal", "kitchen"],
  ],
  alder: [
    ["https://images.pexels.com/photos/3927311/pexels-photo-3927311.jpeg?auto=compress&cs=tinysrgb&w=1600", "The Alder, a modern touring caravan pitched at camp", "exterior"],
    ["https://images.pexels.com/photos/18797772/pexels-photo-18797772.jpeg?auto=compress&cs=tinysrgb&w=1600", "Lounge with timber furniture in morning light", "living"],
    ["https://images.unsplash.com/photo-1683582160988-5809b4886adc?auto=format&fit=crop&w=1600&q=70", "Fixed bed with linen and reading lights", "sleeping"],
    ["https://images.pexels.com/photos/7163683/pexels-photo-7163683.jpeg?auto=compress&cs=tinysrgb&w=1600", "Kitchenette and dining area with modern amenities", "kitchen"],
  ],
  solace: [
    ["https://images.pexels.com/photos/34160300/pexels-photo-34160300.jpeg?auto=compress&cs=tinysrgb&w=1600", "The Solace by the water at golden hour", "exterior"],
    ["https://images.pexels.com/photos/6187662/pexels-photo-6187662.jpeg?auto=compress&cs=tinysrgb&w=1600", "Family lounge inside the caravan", "living"],
    ["https://images.pexels.com/photos/6187663/pexels-photo-6187663.jpeg?auto=compress&cs=tinysrgb&w=1600", "Family caravan pitched at a green campsite", "exterior"],
    ["https://images.pexels.com/photos/19001462/pexels-photo-19001462.jpeg?auto=compress&cs=tinysrgb&w=1600", "Sleeping area with a view out to the water", "sleeping"],
  ],
} as const;

function days(n: number): Date {
  // UTC-noon anchor so the day is identical in every deployment timezone
  // and the ISO date handed to the pricing engine matches the stored one.
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + n, 12, 0, 0));
}

const iso = (d: Date): string => d.toISOString().slice(0, 10);

type VanRates = {
  id: string;
  baseNightlyPence: number;
  weekendNightlyPence: number | null;
  weeklyDiscountPct: number;
  cleaningFeePence: number;
  securityDepositPence: number;
};

async function main() {
  const location = await prisma.location.upsert({
    where: { id: "loc-lansdown" },
    update: {},
    create: { id: "loc-lansdown", name: "Melbourne — Brunswick Depot", address: "123 Sydney Rd, Brunswick VIC 3056", pickupNotes: "Mon–Sat 09:00–16:00. Arrive 15 minutes early." },
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
    ["Extra kilometres (400 km)", "extra-mileage", "Additional 400 km added to your allowance.", 5500, "per_item"],
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
  await prisma.user.upsert({ where: { email: "owner@wattleandwander.com.au" }, update: {}, create: { email: "owner@wattleandwander.com.au", name: "M. Wattle", role: "owner" } });
  const custUser = await prisma.user.upsert({ where: { email: "customer@example.com" }, update: {}, create: { email: "customer@example.com", name: "Demo Traveller", role: "customer" } });
  await prisma.customerProfile.upsert({ where: { userId: custUser.id }, update: {}, create: { userId: custUser.id, phone: "+61 4 0000 0000" } });

  // Operational scenarios
  const rowan = await prisma.caravan.findUniqueOrThrow({ where: { slug: "the-rowan" } });
  const alder = await prisma.caravan.findUniqueOrThrow({ where: { slug: "the-alder" } });
  const solace = await prisma.caravan.findUniqueOrThrow({ where: { slug: "the-solace" } });

  async function mkBooking(
    ref: string,
    van: VanRates,
    pick: Date,
    ret: Date,
    status: string,
    guestEmail = "customer@example.com",
    extras: { slug: string; qty: number }[] = []
  ) {
    await prisma.booking.deleteMany({ where: { reference: ref } });
    // Money comes from the same pricing engine the checkout uses, with the
    // van's own live rates, so the seeded components always sum to the total
    // (and the security deposit matches the van's configured value).
    const [rules, extraRows] = await Promise.all([
      getPricingRules(),
      Promise.all(extras.map(async (x) => ({ qty: x.qty, extra: await prisma.extra.findUniqueOrThrow({ where: { slug: x.slug } }) }))),
    ]);
    const quote = priceQuote({
      baseNightlyPence: van.baseNightlyPence,
      weekendNightlyPence: van.weekendNightlyPence ?? undefined,
      weeklyDiscountPct: van.weeklyDiscountPct,
      pickupISO: iso(pick),
      returnISO: iso(ret),
      cleaningFeePence: van.cleaningFeePence,
      extras: extraRows.map((x) => ({ unitPricePence: x.extra.pricePence, qty: x.qty, perNight: x.extra.unit === "per_night" })),
      taxPct: 10,
      securityDepositPence: van.securityDepositPence,
      depositPct: 25,
    }, null, rules.seasonal);
    const created = await prisma.booking.create({
      data: {
        reference: ref, caravanId: van.id, guestName: "Demo Traveller", guestEmail, guestPhone: "+61 4 0000 0000",
        pickupDate: pick, returnDate: ret, travellers: 2, status,
        subtotalPence: quote.rentalSubtotalPence,
        discountPence: quote.weeklyDiscountPence,
        feesPence: quote.feesPence,
        extrasPence: quote.extrasPence,
        taxPence: quote.taxPence,
        totalPence: quote.totalPence,
        depositDuePence: quote.depositDuePence,
        securityDepositPence: van.securityDepositPence,
        currency: "AUD",
        quoteSnapshot: JSON.stringify({ ...quote, caravanId: van.id, demo: true, note: "Seeded immutable snapshot" }),
        statusHistory: { create: [{ from: null, to: status, actor: "seed", note: "Demonstration record" }] },
      },
    });
    for (const x of extraRows) {
      await prisma.bookingExtraItem.create({
        data: {
          bookingId: created.id, extraId: x.extra.id, qty: x.qty,
          unitPricePence: x.extra.pricePence,
          totalPence: x.extra.pricePence * x.qty * (x.extra.unit === "per_night" ? quote.nights : 1),
        },
      });
    }
    return created;
  }

  // 1. Available caravan (Rowan has only a distant booking) / 2. Unavailable range (Alder booked days 20–26)
  await mkBooking("WW-DEMO01", alder, days(20), days(26), "confirmed");
  // 3. Expiring hold on Solace
  await prisma.bookingHold.deleteMany({ where: { token: "hold_demo_expiring" } });
  await prisma.bookingHold.create({ data: { caravanId: solace.id, pickupDate: days(30), returnDate: days(34), token: "hold_demo_expiring", expiresAt: new Date(Date.now() + 20 * 60 * 1000) } });
  // 4/6/7. Online reservation awaiting the depot counter (held) + extras + logged licence
  const b4 = await mkBooking("WW-DEMO02", solace, days(40), days(47), "held", "customer@example.com", [{ slug: "bedding-pack", qty: 4 }]);
  // Demo only: a real online reservation holds for 20 minutes. This scenario
  // stands for a reservation the guest is already at the counter about to
  // settle, so it keeps a long hold — otherwise the hold-expiry sweep would
  // retire the demo booking (and free its dates) half an hour after seeding.
  await prisma.bookingHold.deleteMany({ where: { bookingId: b4.id } });
  await prisma.bookingHold.create({ data: { caravanId: solace.id, pickupDate: days(40), returnDate: days(47), token: "hold_demo_counter", bookingId: b4.id, expiresAt: new Date(Date.now() + 12 * 60 * 60 * 1000) } });
  await prisma.bookingExtraItem.deleteMany({ where: { bookingId: b4.id } });
  await prisma.payment.deleteMany({ where: { bookingId: b4.id } });
  // 5. Declined at the counter (documents insufficient)
  const b5 = await mkBooking("WW-DEMO03", rowan, days(50), days(53), "cancelled");
  await prisma.booking.update({ where: { id: b5.id }, data: { cancelReason: "Declined at counter — licence entitlement insufficient (demo)" } });
  await prisma.payment.deleteMany({ where: { bookingId: b5.id } });
  // 8. Maintenance conflict guard (Alder service overlapping nothing, plus one flagged near booking)
  await prisma.maintenanceRecord.deleteMany({ where: { caravanId: alder.id } });
  await prisma.maintenanceRecord.create({ data: { caravanId: alder.id, startDate: days(60), endDate: days(62), category: "Annual service", description: "Demo: habitation + chassis service", priority: "high" } });
  // 9. Physical licence logged at the counter for the held reservation
  await prisma.customerDocument.deleteMany({ where: { bookingId: b4.id } });
  await prisma.customerDocument.create({ data: { bookingId: b4.id, kind: "driving_licence", fileName: "Physical copy seen at counter", fileUrl: "counter://physical", status: "approved", reviewerNote: "Original seen, in date (demo)" } });
  // 10/11. Cancelled + refund
  const b10 = await mkBooking("WW-DEMO04", rowan, days(-30), days(-27), "cancelled");
  await prisma.refund.deleteMany({ where: { bookingId: b10.id } });
  await prisma.refund.create({ data: { bookingId: b10.id, amountPence: b10.totalPence, reason: "Cancelled 30+ days before collection — full refund per policy v2026.1", actor: "seed", status: "recorded" } });
  // 12. Manual booking by admin (confirmed, Rowan)
  await mkBooking("WW-DEMO05", rowan, days(90), days(95), "confirmed", "walk-in@example.com");
  // 13. Concurrent-attempt pair is exercised in tests, not seeded as a clash.
  // 14. Pricing-change stability: b4 snapshot stays fixed even if base rates change.

  // Content + FAQs + reviews
  await prisma.destination.upsert({ where: { slug: "great-ocean-road" }, update: {}, create: { name: "Great Ocean Road", slug: "great-ocean-road", intro: "Limestone stacks and eucalypt gullies.", duration: "4–6 nights", season: "October to April", heroImage: "https://images.unsplash.com/photo-1578233797281-b0fc57765263?auto=format&fit=crop&w=1800&q=70", stops: JSON.stringify([{ name: "Melbourne → Torquay" }]), practical: "Coastal wind rewards slow towing.", distanceMi: 420 } });
  await prisma.destination.upsert({ where: { slug: "grampians-silo-trail" }, update: {}, create: { name: "Grampians & Silo Trail", slug: "grampians-silo-trail", intro: "Sandstone ranges and painted silos.", duration: "6–8 nights", season: "September to November", heroImage: "https://images.pexels.com/photos/10782073/pexels-photo-10782073.jpeg?auto=compress&cs=tinysrgb&w=1800", stops: JSON.stringify([{ name: "Melbourne → Halls Gap" }]), practical: "Long hot roads — carry water.", distanceMi: 620 } });
  await prisma.destination.upsert({ where: { slug: "mornington-prom" }, update: {}, create: { name: "Mornington & the Prom", slug: "mornington-prom", intro: "Hot springs, penguins and granite headlands.", duration: "3–5 nights", season: "March to May", heroImage: "https://images.pexels.com/photos/38091997/pexels-photo-38091997.jpeg?auto=compress&cs=tinysrgb&w=1800", stops: JSON.stringify([{ name: "Melbourne → Sorrento" }]), practical: "Patchy signal inside the Prom — download offline maps.", distanceMi: 380 } });

  await prisma.faq.deleteMany({});
  for (const [i, [section, q, a]] of [
    ["Booking", "Do I need experience towing?", "No — every hire begins with a 40-minute accompanied handover."],
    ["Booking", "What is included in the price?", "Nightly rate, GST, gas, kit and roadside cover. Cleaning and refundable deposit shown separately."],
    ["Towing", "What licence do I need?", "Rowan suits most full car licences; Alder and Solace need a checked combination."],
  ].entries()) {
    await prisma.faq.create({ data: { section, question: q, answer: a, sort: i } });
  }

  console.log("Seed complete: 3 caravans, extras, rules, 5 demo bookings, hold, payments, refund, document, maintenance.");
}

main().catch((e) => { console.error(e); process.exit(1); }).finally(() => prisma.$disconnect());
