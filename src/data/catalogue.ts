// Static catalogue mirrors the Prisma seed so public pages render
// instantly and consistently, even before the database is seeded.
// Booking-critical reads (availability, pricing enforcement) always go
// through the server-side services backed by the database.

export type CatalogueImage = { url: string; alt: string; kind: string };

export type CatalogueCaravan = {
  slug: string;
  name: string;
  tagline: string;
  description: string;
  category: string;
  berths: number;
  maxTravellers: number;
  baseNightlyPence: number;
  weekendNightlyPence: number;
  weeklyDiscountPct: number;
  minNights: number;
  maxNights: number;
  cleaningFeePence: number;
  securityDepositPence: number;
  mileagePerNight: number;
  mtplmKg: number;
  lengthM: number;
  widthM: number;
  offRoad: boolean;
  shower: boolean;
  heating: boolean;
  kitchen: string;
  towRequirement: string;
  location: string;
  images: CatalogueImage[];
  floorplanNotes: string;
  equipment: string[];
};

export const CARAVANS: CatalogueCaravan[] = [
  {
    slug: "the-rowan",
    name: "The Rowan",
    tagline: "Compact touring caravan for two",
    description:
      "A compact touring layout for two, with a fitted kitchen, dedicated sleeping area, and clearly listed towing requirements. Rowan is easy to tow, quick to settle, and at home down narrow Cotswold lanes as well as on open coastal roads.",
    category: "Compact Tourer",
    berths: 2,
    maxTravellers: 2,
    baseNightlyPence: 9500,
    weekendNightlyPence: 11000,
    weeklyDiscountPct: 10,
    minNights: 2,
    maxNights: 21,
    cleaningFeePence: 7500,
    securityDepositPence: 50000,
    mileagePerNight: 100,
    mtplmKg: 1350,
    lengthM: 7.1,
    widthM: 2.23,
    offRoad: false,
    shower: true,
    heating: true,
    kitchen: "Two-burner hob, oven/grill, 85L fridge, sink with hot water",
    towRequirement: "Min. 1,600kg braked towing capacity. Category B licence (check post-1997 weight limits).",
    location: "Bath — Lansdown Depot",
    images: [
      { url: "https://images.unsplash.com/photo-1523987355523-c7b5b0dd90a7?auto=format&fit=crop&w=1600&q=70", alt: "The Rowan caravan parked beside a pine forest at dawn", kind: "exterior" },
      { url: "https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?auto=format&fit=crop&w=1600&q=70", alt: "Awning and camp chairs outside the caravan in soft evening light", kind: "exterior" },
      { url: "https://images.unsplash.com/photo-1510312305653-8ed496efae75?auto=format&fit=crop&w=1600&q=70", alt: "Compact caravan interior with timber finishes and made-up double bed", kind: "sleeping" },
      { url: "https://images.unsplash.com/photo-1556911220-bff31c812dba?auto=format&fit=crop&w=1600&q=70", alt: "Fitted caravan kitchen with hob and preparation space", kind: "kitchen" },
    ],
    floorplanNotes: "Front lounge converts to transverse double (1.9 × 1.35m). Rear washroom with shower and cassette toilet. Central kitchen with full-height storage opposite.",
    equipment: [" Bedding pack available", "Kitchen inventory + cool box", "Awning + outdoor furniture", "Levelling blocks, hitch lock, spare wheel", "240V hook-up lead + battery + solar trickle"],
  },
  {
    slug: "the-alder",
    name: "The Alder",
    tagline: "Premium two-berth with separate shower",
    description:
      "Our most considered two-berth. A fixed island bed, separate shower room, and a reading corner by the panoramic window. Alder suits slow weeks: cook breakfast with the windows open, sleep beneath a quiet sky, take the long way home.",
    category: "Premium Two-Berth",
    berths: 2,
    maxTravellers: 2,
    baseNightlyPence: 14500,
    weekendNightlyPence: 16500,
    weeklyDiscountPct: 12,
    minNights: 3,
    maxNights: 28,
    cleaningFeePence: 8500,
    securityDepositPence: 65000,
    mileagePerNight: 120,
    mtplmKg: 1550,
    lengthM: 7.9,
    widthM: 2.45,
    offRoad: false,
    shower: true,
    heating: true,
    kitchen: "Three-burner hob, oven, microwave, 133L fridge-freezer",
    towRequirement: "Min. 1,900kg braked towing capacity. Category B (check combined MAM) or B+E.",
    location: "Bath — Lansdown Depot",
    images: [
      { url: "https://images.unsplash.com/photo-1516937941344-00b4e0337589?auto=format&fit=crop&w=1600&q=70", alt: "The Alder caravan on open moorland under a wide sky", kind: "exterior" },
      { url: "https://images.unsplash.com/photo-1496545672447-f699b503d270?auto=format&fit=crop&w=1600&q=70", alt: "Alder lounge with wool throws and oak table in morning light", kind: "living" },
      { url: "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=1600&q=70", alt: "Fixed island bed with linen and reading lights", kind: "sleeping" },
      { url: "https://images.unsplash.com/photo-1484154218962-a197022b5858?auto=format&fit=crop&w=1600&q=70", alt: "Kitchen and dining area with natural materials", kind: "kitchen" },
    ],
    floorplanNotes: "Fixed island bed (1.95 × 1.5m) aft. Full-width washroom with separate shower cubicle. Front lounge with panoramic window and two reading chairs.",
    equipment: ["Premium linen pack available", "Nespresso + full kitchen inventory", "Air awning + outdoor furniture", "Motor mover fitted", "100W solar + 110Ah leisure battery"],
  },
  {
    slug: "the-solace",
    name: "The Solace",
    tagline: "Family caravan sleeping four",
    description:
      "A larger family layout sleeping four without compromise: fixed bunks for children, a convertible front double for adults, and a proper washroom. Solace carries the extra chairs, the extra coats, and the extra patience a family week requires.",
    category: "Family Four-Berth",
    berths: 4,
    maxTravellers: 5,
    baseNightlyPence: 16500,
    weekendNightlyPence: 18500,
    weeklyDiscountPct: 15,
    minNights: 3,
    maxNights: 28,
    cleaningFeePence: 9500,
    securityDepositPence: 75000,
    mileagePerNight: 120,
    mtplmKg: 1750,
    lengthM: 8.6,
    widthM: 2.5,
    offRoad: false,
    shower: true,
    heating: true,
    kitchen: "Full cooker, large fridge-freezer, dining for five",
    towRequirement: "Min. 2,200kg braked towing capacity. B+E or checked B entitlement required. Tow-car matching check at handover.",
    location: "Bath — Lansdown Depot",
    images: [
      { url: "https://images.unsplash.com/photo-1504851149312-7a075b496cc7?auto=format&fit=crop&w=1600&q=70", alt: "The Solace family caravan beside a lake at golden hour", kind: "exterior" },
      { url: "https://images.unsplash.com/photo-1537225228614-56cc3556d7ed?auto=format&fit=crop&w=1600&q=70", alt: "Family lounge with bunk area beyond", kind: "living" },
      { url: "https://images.unsplash.com/photo-1519710164239-da123dc03ef4?auto=format&fit=crop&w=1600&q=70", alt: "Dining area set for breakfast", kind: "living" },
      { url: "https://images.unsplash.com/photo-1505691938895-1758d7feb511?auto=format&fit=crop&w=1600&q=70", alt: "Fixed bunks with individual reading lights", kind: "sleeping" },
    ],
    floorplanNotes: "Rear fixed bunks (1.85 × 0.7m each). Front lounge converts to double (2.0 × 1.45m). Mid washroom with shower. Full-height wardrobe and under-seat storage throughout.",
    equipment: ["Family bedding + travel cot on request", "Full kitchen + outdoor cooking set", "Large air awning, windbreak, furniture for five", "Bike rack (2–4 bikes)", "Solar + external 240V + water containers"],
  },
];

export type ExtraDef = { slug: string; name: string; description: string; pricePence: number; unit: string };

export const EXTRAS: ExtraDef[] = [
  { slug: "bedding-pack", name: "Bedding pack", description: "Laundered duvet, pillows, linen and towels per person.", pricePence: 3500, unit: "per_person" },
  { slug: "kitchen-pack", name: "Kitchen upgrade", description: "Outdoor cooking set, cool box and pantry staples.", pricePence: 2500, unit: "per_rental" },
  { slug: "outdoor-furniture", name: "Outdoor furniture", description: "Two chairs, table and windbreak (five-piece for Solace).", pricePence: 2000, unit: "per_rental" },
  { slug: "awning", name: "Air awning", description: "Drive-away air awning fitted at collection, with groundsheet.", pricePence: 4500, unit: "per_rental" },
  { slug: "bike-rack", name: "Bike rack + hire", description: "Tow-bar rack for two bikes; touring bikes available.", pricePence: 3000, unit: "per_rental" },
  { slug: "extra-mileage", name: "Extra mileage (250 mi)", description: "Additional 250 miles added to your allowance.", pricePence: 5500, unit: "per_item" },
  { slug: "early-pickup", name: "Early collection", description: "Collect from 09:00 with full handover and tow check.", pricePence: 3500, unit: "per_rental" },
];

export type DestinationDef = {
  slug: string; name: string; intro: string; duration: string; season: string;
  heroImage: string; distanceMi: number; stops: { name: string; note: string }[]; practical: string;
};

export const DESTINATIONS: DestinationDef[] = [
  {
    slug: "cotswold-lanes",
    name: "Cotswold Lanes",
    intro: "Honey-stone villages, farm shops and quiet escarpment lanes. An unhurried first journey — short towing days, generous stopping.",
    duration: "4–6 nights",
    season: "April to October; mornings are kindest in May and September.",
    heroImage: "https://images.unsplash.com/photo-1467269204594-9661b134dd2b?auto=format&fit=crop&w=1800&q=70",
    distanceMi: 180,
    stops: [
      { name: "Bath → Castle Combe", note: "28 mi. Collect at Lansdown, tow check, then an easy shakedown leg." },
      { name: "Bibury & Coln Valley", note: "Farm shop stop, water-meadow walk. Level riverside pitches." },
      { name: "Broadway & the Escarpment", note: "Long views, dark skies. Two-night stay recommended." },
    ],
    practical: "Narrow lanes around Bibury and Castle Combe reward slow towing and folded mirrors. Book small-orchard sites ahead in August.",
  },
  {
    slug: "pembrokeshire-coast",
    name: "Pembrokeshire Coast",
    intro: "Cliff paths, island boats and wide Atlantic light. Longer towing days balanced by two-night stays and sea air.",
    duration: "6–8 nights",
    season: "May to September; prevailing wind eases in high summer.",
    heroImage: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1800&q=70",
    distanceMi: 420,
    stops: [
      { name: "Bath → St Davids", note: "Longest leg (c. 180 mi). Early start, service stop at Cardiff Gate." },
      { name: "Whitesands & St Brides", note: "Surf beaches, coast-path mornings. Exposed pitches — windbreak advised." },
      { name: "Tenby & Caldey Sound", note: "Harbour town, boat day, final slow return via the Gower." },
    ],
    practical: "Coastal sites are exposed; awnings need storm straps. Check height barriers on beach car parks before towing in.",
  },
  {
    slug: "brecon-dark-skies",
    name: "Brecon Dark Skies",
    intro: "Reservoirs, waterfalls and a protected night sky. Autumn is magnificent; winter travel suits Alder with heating.",
    duration: "3–5 nights",
    season: "September to March for stars; June for waterfalls after rain.",
    heroImage: "https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?auto=format&fit=crop&w=1800&q=70",
    distanceMi: 210,
    stops: [
      { name: "Bath → Abergavenny", note: "Gateway market town. Provisioning stop — excellent butchers and bakery." },
      { name: "Talybont & the Reservoirs", note: "Dark-sky reserve. No-drain pitches; carry water containers." },
      { name: "Waterfall Country", note: "Short walks from the van. Return via Hay-on-Wye bookshops." },
    ],
    practical: "Phone signal is patchy beyond Talybont — download offline maps. Night temperatures fall fast; heating briefing included.",
  },
];

export type JournalDef = { slug: string; title: string; category: string; excerpt: string; heroImage: string; body: string[] };

export const JOURNAL: JournalDef[] = [
  {
    slug: "first-tow",
    title: "Towing for the first time: a calm guide",
    category: "Towing advice",
    excerpt: "Mirrors, noseweight, and the forgotten art of arriving slowly. What our handover actually covers.",
    heroImage: "https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?auto=format&fit=crop&w=1600&q=70",
    body: [
      "Every Hartley & Moor handover includes a forty-minute tow check: hitch, breakaway cable, electrics, mirrors, noseweight and a short accompanied drive.",
      "The single habit that matters most is separation distance. Leave four seconds to the vehicle ahead, plan braking early, and take roundabouts one decision at a time.",
      "We set the tyre pressures, torque the wheel bolts and record the noseweight with you. You leave with a printed card of your outfit's weights and a number to call — answered by someone who tows.",
    ],
  },
  {
    slug: "packing-light",
    title: "What to pack for a week in a two-berth",
    category: "Packing advice",
    excerpt: "The honest list: what lives in the van already, and what deserves space in the car.",
    heroImage: "https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?auto=format&fit=crop&w=1600&q=70",
    body: [
      "Each caravan carries crockery, cooking kit, levelling gear, hook-up leads, water containers and a toolkit. Bedding packs are optional and laundered between hires.",
      "Bring soft bags rather than hard cases, walking boots, a warm layer even in August, and food for the first night — you will not want to shop after handover.",
      "Leave at home: mains kettle (we supply a hob kettle), firewood from home (most sites forbid it), and any urge to fill every locker. Payload matters.",
    ],
  },
  {
    slug: "slow-mornings",
    title: "In praise of slow mornings",
    category: "Travel inspiration",
    excerpt: "Why our itineraries keep towing days under two hours — and what fills the hours instead.",
    heroImage: "https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?auto=format&fit=crop&w=1600&q=70",
    body: [
      "Caravan travel rewards the short day. A ninety-minute tow, an unhurried pitch-up, lunch with the door open — then the afternoon is yours.",
      "Our routes are written around that rhythm: farm shops before noon, walks from the pitch, one proper stop a day rather than three hurried ones.",
      "Leave room for the unexpected. The best hour of last season, by common consent, was an unplanned layby above Talybont with tea and red kites.",
    ],
  },
];
