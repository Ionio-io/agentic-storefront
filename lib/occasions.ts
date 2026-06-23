// Indian fashion festival calendar — 2026-2027
// Shopping windows open 3-4 weeks before the occasion.

export interface Occasion {
  id: string;
  name: string;
  emoji: string;
  date: Date;
  windowStart: Date;
  windowEnd: Date;
  searchQuery: string;
  gender: "female" | "male" | "all";
  occasion: "festive" | "wedding" | "casual" | "party";
  description: string;
  colorPalette: string[];
  suggestedCategories: string[];
  shopPath: string; // URL to shop page
}

function d(year: number, month: number, day: number): Date {
  return new Date(year, month - 1, day);
}
function daysOffset(base: Date, days: number): Date {
  const r = new Date(base);
  r.setDate(r.getDate() + days);
  return r;
}

export const OCCASIONS: Occasion[] = [
  {
    id: "raksha-bandhan",
    name: "Raksha Bandhan",
    emoji: "🪢",
    date: d(2026, 8, 9),
    windowStart: d(2026, 7, 19),
    windowEnd: d(2026, 8, 9),
    searchQuery: "ethnic kurta salwar festive",
    gender: "female",
    occasion: "festive",
    description: "Shop Raksha Bandhan outfits — ethnic sets, salwar kameez, and gift-ready festive looks",
    colorPalette: ["Pink", "Red", "Yellow", "Orange"],
    suggestedCategories: ["Ethnic Suits", "Dresses", "Tops"],
    shopPath: "/shop?occasion=festive&gender=female&q=Raksha+Bandhan+ethnic+kurta",
  },
  {
    id: "ganesh-chaturthi",
    name: "Ganesh Chaturthi",
    emoji: "🪔",
    date: d(2026, 8, 27),
    windowStart: d(2026, 8, 6),
    windowEnd: d(2026, 8, 27),
    searchQuery: "festive ethnic traditional yellow green",
    gender: "all",
    occasion: "festive",
    description: "Celebrate Ganesh Chaturthi in traditional festive wear — vibrant kurtas and ethnic sets",
    colorPalette: ["Yellow", "Green", "Saffron", "Orange"],
    suggestedCategories: ["Ethnic Suits", "Trousers", "Shirts"],
    shopPath: "/shop?occasion=festive&q=Ganesh+Chaturthi+ethnic",
  },
  {
    id: "navratri",
    name: "Navratri",
    emoji: "🌸",
    date: d(2026, 9, 29),
    windowStart: d(2026, 9, 5),
    windowEnd: d(2026, 10, 8),
    searchQuery: "navratri chaniya choli ethnic dance festive colorful",
    gender: "female",
    occasion: "festive",
    description: "Navratri collection — chaniya cholis, lehengas, ethnic sets in every day's colour",
    colorPalette: ["Red", "Royal Blue", "Yellow", "Green", "Purple", "Orange"],
    suggestedCategories: ["Ethnic Suits", "Dresses"],
    shopPath: "/shop?occasion=festive&gender=female&q=Navratri+ethnic+colorful",
  },
  {
    id: "dussehra",
    name: "Dussehra",
    emoji: "🏹",
    date: d(2026, 10, 8),
    windowStart: d(2026, 9, 17),
    windowEnd: d(2026, 10, 8),
    searchQuery: "festive ethnic traditional embroidery",
    gender: "all",
    occasion: "festive",
    description: "Dussehra festive outfits — rich ethnic wear with traditional embroideries",
    colorPalette: ["Saffron", "Red", "Gold", "Maroon"],
    suggestedCategories: ["Ethnic Suits", "Shirts", "Trousers"],
    shopPath: "/shop?occasion=festive&q=Dussehra+traditional",
  },
  {
    id: "diwali",
    name: "Diwali",
    emoji: "✨",
    date: d(2026, 10, 20),
    windowStart: d(2026, 9, 20),
    windowEnd: d(2026, 10, 22),
    searchQuery: "diwali festive ethnic silk embroidery sequin zari gold",
    gender: "all",
    occasion: "festive",
    description: "Shop Diwali outfits — silks, embroideries, sequin work, and ethnic sets in rich festive hues",
    colorPalette: ["Gold", "Maroon", "Emerald", "Royal Blue", "Mustard"],
    suggestedCategories: ["Ethnic Suits", "Dresses", "Formal Shirts", "Trousers"],
    shopPath: "/shop?occasion=festive&q=Diwali+ethnic+silk+embroidery",
  },
  {
    id: "christmas",
    name: "Christmas",
    emoji: "🎄",
    date: d(2026, 12, 25),
    windowStart: d(2026, 12, 1),
    windowEnd: d(2026, 12, 31),
    searchQuery: "party evening dress festive western",
    gender: "all",
    occasion: "party",
    description: "Christmas & New Year party looks — dresses, evening wear, and festive western outfits",
    colorPalette: ["Red", "Green", "Gold", "Black", "White"],
    suggestedCategories: ["Dresses", "Tops", "Jackets", "Formal Shirts"],
    shopPath: "/shop?occasion=party&q=Christmas+party+dress",
  },
  {
    id: "new-year",
    name: "New Year",
    emoji: "🎆",
    date: d(2027, 1, 1),
    windowStart: d(2026, 12, 20),
    windowEnd: d(2027, 1, 2),
    searchQuery: "party evening glam sequin dress new year",
    gender: "all",
    occasion: "party",
    description: "Ring in 2027 in style — glam party outfits, sequins, and statement pieces",
    colorPalette: ["Gold", "Silver", "Black", "Champagne"],
    suggestedCategories: ["Dresses", "Tops", "Jackets"],
    shopPath: "/shop?occasion=party&q=New+Year+party+glamour",
  },
  {
    id: "pongal",
    name: "Pongal / Makar Sankranti",
    emoji: "🌾",
    date: d(2027, 1, 14),
    windowStart: d(2027, 1, 1),
    windowEnd: d(2027, 1, 15),
    searchQuery: "ethnic traditional south indian salwar kurta",
    gender: "female",
    occasion: "festive",
    description: "Pongal & Sankranti ethnic wear — traditional kurtas, salwars, and festive sets",
    colorPalette: ["Yellow", "Green", "Orange", "White"],
    suggestedCategories: ["Ethnic Suits"],
    shopPath: "/shop?occasion=festive&gender=female&q=Pongal+ethnic+traditional",
  },
  {
    id: "valentine",
    name: "Valentine's Day",
    emoji: "💝",
    date: d(2027, 2, 14),
    windowStart: d(2027, 2, 1),
    windowEnd: d(2027, 2, 14),
    searchQuery: "red pink romantic dress date night",
    gender: "female",
    occasion: "party",
    description: "Valentine's Day looks — romantic dresses, blush pink, and date night outfits",
    colorPalette: ["Red", "Pink", "Blush", "Mauve"],
    suggestedCategories: ["Dresses", "Tops"],
    shopPath: "/shop?occasion=party&gender=female&q=Valentine+romantic+dress",
  },
  {
    id: "holi",
    name: "Holi",
    emoji: "🎨",
    date: d(2027, 3, 14),
    windowStart: d(2027, 2, 22),
    windowEnd: d(2027, 3, 15),
    searchQuery: "white ethnic kurta casual cotton holi",
    gender: "all",
    occasion: "casual",
    description: "Holi outfits — breathable whites, cotton kurtas, and easy-to-wash festival wear",
    colorPalette: ["White", "Light Pink", "Light Yellow", "Pastel"],
    suggestedCategories: ["Ethnic Suits", "T-Shirts", "Tops"],
    shopPath: "/shop?occasion=casual&q=Holi+white+cotton+kurta",
  },
];

export function getUpcomingOccasions(today = new Date(), maxDays = 60): Occasion[] {
  const cutoff = daysOffset(today, maxDays);
  return OCCASIONS.filter(
    (o) => o.windowStart <= cutoff && o.windowEnd >= today
  ).sort((a, b) => a.date.getTime() - b.date.getTime());
}

export function getPrimaryOccasion(today = new Date()): Occasion | null {
  const upcoming = getUpcomingOccasions(today, 60);
  return upcoming[0] ?? null;
}

export function getDaysUntil(occasion: Occasion, today = new Date()): number {
  const diff = occasion.date.getTime() - today.getTime();
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
}

export function getOccasionAgentContext(today = new Date()): string {
  const upcoming = getUpcomingOccasions(today, 60);
  if (upcoming.length === 0) return "";

  const primary = upcoming[0];
  const daysAway = getDaysUntil(primary, today);
  const otherNames = upcoming.slice(1, 3).map((o) => o.name).join(", ");

  let ctx = `SEASONAL CONTEXT: ${primary.name} is ${daysAway} day${daysAway === 1 ? "" : "s"} away (${primary.date.toLocaleDateString("en-IN", { day: "numeric", month: "long" })}). `;
  ctx += `Shoppers are actively looking for ${primary.description.toLowerCase()}. `;
  ctx += `Popular colours: ${primary.colorPalette.join(", ")}. `;
  ctx += `Top categories: ${primary.suggestedCategories.join(", ")}. `;
  if (otherNames) ctx += `Also coming up: ${otherNames}. `;
  ctx += `Proactively mention ${primary.name} when it is relevant to the shopper's request. If they ask for "something festive" or an occasion-neutral outfit, lean into ${primary.name} themes.`;

  return ctx;
}
