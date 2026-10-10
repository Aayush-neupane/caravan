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
  // Records not mirrored by the static catalogue layout. When the live
  // catalogue layer supplies them (DB-backed fleet) they override these.
  excessMileagePencePerMile?: number;
  extras?: ExtraDef[];
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
      "A compact touring layout for two, with a fitted kitchen, dedicated sleeping area, and clearly listed towing requirements. Rowan is easy to tow, quick to settle, and at home down narrow Dandenong lanes as well as on open coastal roads.",
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
    excessMileagePencePerMile: 35,
    mtplmKg: 1350,
    lengthM: 7.1,
    widthM: 2.23,
    offRoad: false,
    shower: true,
    heating: true,
    kitchen: "Two-burner hob, oven/grill, 85L fridge, sink with hot water",
    towRequirement: "Min. 1,600kg braked towing capacity. Full car licence (check your state weight limits).",
    location: "Melbourne — Brunswick Depot",
    images: [
      { url: "https://images.pexels.com/photos/31995029/pexels-photo-31995029.jpeg?auto=compress&cs=tinysrgb&w=1600", alt: "The Rowan set up at a bush campsite among the trees", kind: "exterior" },
      { url: "https://images.pexels.com/photos/7163681/pexels-photo-7163681.jpeg?auto=compress&cs=tinysrgb&w=1600", alt: "Annexe awning set up beside the caravan at camp", kind: "exterior" },
      { url: "https://images.pexels.com/photos/26976127/pexels-photo-26976127.jpeg?auto=compress&cs=tinysrgb&w=1600", alt: "Double bed in soft daylight with privacy curtains", kind: "sleeping" },
      { url: "https://images.pexels.com/photos/7476238/pexels-photo-7476238.jpeg?auto=compress&cs=tinysrgb&w=1600", alt: "Galley kitchen being used to cook a meal", kind: "kitchen" },
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
    excessMileagePencePerMile: 35,
    mtplmKg: 1550,
    lengthM: 7.9,
    widthM: 2.45,
    offRoad: false,
    shower: true,
    heating: true,
    kitchen: "Three-burner hob, oven, microwave, 133L fridge-freezer",
    towRequirement: "Min. 1,900kg braked towing capacity. Full licence (check combined GCM) or upgraded entitlement.",
    location: "Melbourne — Brunswick Depot",
    images: [
      { url: "https://images.pexels.com/photos/3927311/pexels-photo-3927311.jpeg?auto=compress&cs=tinysrgb&w=1600", alt: "The Alder, a modern touring caravan pitched at camp", kind: "exterior" },
      { url: "https://images.pexels.com/photos/18797772/pexels-photo-18797772.jpeg?auto=compress&cs=tinysrgb&w=1600", alt: "Lounge with timber furniture in morning light", kind: "living" },
      { url: "https://images.unsplash.com/photo-1683582160988-5809b4886adc?auto=format&fit=crop&w=1600&q=70", alt: "Fixed bed with linen and reading lights", kind: "sleeping" },
      { url: "https://images.pexels.com/photos/7163683/pexels-photo-7163683.jpeg?auto=compress&cs=tinysrgb&w=1600", alt: "Kitchenette and dining area with modern amenities", kind: "kitchen" },
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
    excessMileagePencePerMile: 35,
    mtplmKg: 1750,
    lengthM: 8.6,
    widthM: 2.5,
    offRoad: false,
    shower: true,
    heating: true,
    kitchen: "Full cooker, large fridge-freezer, dining for five",
    towRequirement: "Min. 2,200kg braked towing capacity. Upgraded entitlement or checked combination required. Tow-car matching check at handover.",
    location: "Melbourne — Brunswick Depot",
    images: [
      { url: "https://images.pexels.com/photos/34160300/pexels-photo-34160300.jpeg?auto=compress&cs=tinysrgb&w=1600", alt: "The Solace by the water at golden hour", kind: "exterior" },
      { url: "https://images.pexels.com/photos/6187662/pexels-photo-6187662.jpeg?auto=compress&cs=tinysrgb&w=1600", alt: "Family lounge inside the caravan", kind: "living" },
      { url: "https://images.pexels.com/photos/6187663/pexels-photo-6187663.jpeg?auto=compress&cs=tinysrgb&w=1600", alt: "Family caravan pitched at a green campsite", kind: "exterior" },
      { url: "https://images.pexels.com/photos/19001462/pexels-photo-19001462.jpeg?auto=compress&cs=tinysrgb&w=1600", alt: "Sleeping area with a view out to the water", kind: "sleeping" },
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
  { slug: "extra-mileage", name: "Extra kilometres (400 km)", description: "Additional 400 km added to your allowance.", pricePence: 5500, unit: "per_item" },
  { slug: "early-pickup", name: "Early collection", description: "Collect from 09:00 with full handover and tow check.", pricePence: 3500, unit: "per_rental" },
];

export type DestinationDef = {
  slug: string; name: string; intro: string; duration: string; season: string;
  heroImage: string; distanceMi: number; stops: { name: string; note: string }[]; practical: string;
};

export const DESTINATIONS: DestinationDef[] = [
  {
    slug: "great-ocean-road",
    name: "Great Ocean Road",
    intro: "Limestone stacks, eucalypt gullies and slow coastal towns. An unhurried first journey — short towing days, generous stopping.",
    duration: "4–6 nights",
    season: "October to April; mornings are kindest in November and March.",
    heroImage: "https://images.unsplash.com/photo-1578233797281-b0fc57765263?auto=format&fit=crop&w=1800&q=70",
    distanceMi: 420,
    stops: [
      { name: "Melbourne → Torquay", note: "95 km. Collect at Brunswick, tow check, then an easy shakedown leg." },
      { name: "Lorne & Otways", note: "Rainforest detour, waterfall walk. Level holiday-park pitches." },
      { name: "Port Campbell & the Twelve Apostles", note: "Long views, ocean wind. Two-night stay recommended." },
    ],
    practical: "Coastal wind around Port Campbell rewards slow towing and storm straps. Book beachside parks ahead in January.",
  },
  {
    slug: "grampians-silo-trail",
    name: "Grampians & Silo Trail",
    intro: "Sandstone ranges, wildflower flats and painted silos. Longer towing days balanced by two-night stays and big skies.",
    duration: "6–8 nights",
    season: "September to November; wildflowers peak in spring.",
    heroImage: "https://images.pexels.com/photos/10782073/pexels-photo-10782073.jpeg?auto=compress&cs=tinysrgb&w=1800",
    distanceMi: 620,
    stops: [
      { name: "Melbourne → Halls Gap", note: "Longest leg (c. 260 km). Early start, fuel stop at Ballarat." },
      { name: "Wonderland & Boroka", note: "Lookout mornings, kangaroo-dotted ovals. Exposed pitches — windbreak advised." },
      { name: "Rupanyup & Sheep Hills", note: "Silo-art towns, pub stop, final slow return via the Pyrenees wine region." },
    ],
    practical: "Outback-edge roads are long and hot; carry water and check tyre pressures. Download offline maps beyond Ararat.",
  },
  {
    slug: "mornington-prom",
    name: "Mornington & the Prom",
    intro: "Hot springs, penguin parades and granite headlands. Autumn is magnificent; winter travel suits Alder with heating.",
    duration: "3–5 nights",
    season: "March to May for calm seas; June for cosy park cabins after rain.",
    heroImage: "https://images.pexels.com/photos/38091997/pexels-photo-38091997.jpeg?auto=compress&cs=tinysrgb&w=1800",
    distanceMi: 380,
    stops: [
      { name: "Melbourne → Sorrento", note: "Gateway peninsula town. Provisioning stop — excellent bakeries and bottle shops." },
      { name: "Wilsons Promontory", note: "Wombat flats, Tidal River camp. Book powered sites months ahead." },
      { name: "Phillip Island", note: "Penguin parade at dusk. Return via the Bass Highway farm gates." },
    ],
    practical: "Phone signal is patchy inside the Prom — download offline maps. Night temperatures fall fast; heating briefing included.",
  },
];

export type JournalDef = { slug: string; title: string; category: string; excerpt: string; heroImage: string; body: string[] };

export const JOURNAL: JournalDef[] = [
  {
    slug: "first-tow",
    title: "Towing for the first time: a calm guide",
    category: "Towing advice",
    excerpt: "Mirrors, ball weight, and the forgotten art of arriving slowly. What our handover actually covers.",
    heroImage: "https://images.pexels.com/photos/38212765/pexels-photo-38212765.jpeg?auto=compress&cs=tinysrgb&w=1600",
    body: [
      "Every Wattle & Wander handover includes a forty-minute tow check: hitch, breakaway cable, electrics, mirrors, ball weight and a short accompanied drive.",
      "The single habit that matters most is separation distance. Leave four seconds to the vehicle ahead, plan braking early, and take roundabouts one decision at a time.",
      "We set the tyre pressures, torque the wheel bolts and record the ball weight with you. You leave with a printed card of your outfit's weights and a number to call — answered by someone who tows.",
    ],
  },
  {
    slug: "packing-light",
    title: "What to pack for a week in a two-berth",
    category: "Packing advice",
    excerpt: "The honest list: what lives in the van already, and what deserves space in the car.",
    heroImage: "https://images.pexels.com/photos/10630987/pexels-photo-10630987.jpeg?auto=compress&cs=tinysrgb&w=1600",
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
    heroImage: "https://images.pexels.com/photos/6187660/pexels-photo-6187660.jpeg?auto=compress&cs=tinysrgb&w=1600",
    body: [
      "Caravan travel rewards the short day. A ninety-minute tow, an unhurried pitch-up, lunch with the door open — then the afternoon is yours.",
      "Our routes are written around that rhythm: farm shops before noon, walks from the pitch, one proper stop a day rather than three hurried ones.",
      "Leave room for the unexpected. The best hour of last season, by common consent, was an unplanned layby above Lorne with tea and black cockatoos.",
    ],
  },
];
