// Product taxonomy: maps raw Shopify product_type → { main, sub }
// Used during import AND for dynamic sidebar filtering on old products.

const RULES: Array<{ keywords: string[]; main: string; sub: string }> = [
  // ── Tops ──────────────────────────────────────────────────────────────
  { main: "Tops", sub: "T-Shirts",    keywords: ["t-shirt", "tshirt", "tee", "graphic tee"] },
  { main: "Tops", sub: "Shirts",      keywords: ["casual shirt", "formal shirt", "dress shirt", "overshirt"] },
  { main: "Tops", sub: "Polo",        keywords: ["polo"] },
  { main: "Tops", sub: "Sweatshirts", keywords: ["sweatshirt", "hoodie", "pullover", "sweater", "crewneck"] },
  { main: "Tops", sub: "Blouses",     keywords: ["blouse"] },
  { main: "Tops", sub: "Crop Tops",   keywords: ["crop top", "crop"] },
  { main: "Tops", sub: "Tank Tops",   keywords: ["tank top", "tank", "cami", "camisole", "sleeveless"] },
  { main: "Tops", sub: "Shirts",      keywords: ["shirt"] }, // catch-all shirts after specifics

  // ── Bottoms ───────────────────────────────────────────────────────────
  { main: "Bottoms", sub: "Jeans",     keywords: ["jeans", "denim"] },
  { main: "Bottoms", sub: "Trousers",  keywords: ["trouser", "formal trouser", "chino", "pant", "pants"] },
  { main: "Bottoms", sub: "Shorts",    keywords: ["short"] },
  { main: "Bottoms", sub: "Skirts",    keywords: ["skirt"] },
  { main: "Bottoms", sub: "Leggings",  keywords: ["legging"] },
  { main: "Bottoms", sub: "Joggers",   keywords: ["jogger", "trackpant", "track pant", "sweatpant"] },
  { main: "Bottoms", sub: "Palazzos",  keywords: ["palazzo"] },

  // ── Dresses & Sets ────────────────────────────────────────────────────
  { main: "Dresses & Sets", sub: "Dresses",    keywords: ["dress", "maxi", "midi", "gown", "bodycon", "sundress"] },
  { main: "Dresses & Sets", sub: "Jumpsuits",  keywords: ["jumpsuit", "playsuit", "romper", "dungaree"] },
  { main: "Dresses & Sets", sub: "Co-ord Sets", keywords: ["co-ord", "coord", "matching set", "twin set"] },

  // ── Outerwear ─────────────────────────────────────────────────────────
  { main: "Outerwear", sub: "Jackets",  keywords: ["jacket", "bomber", "biker", "puffer", "windbreaker"] },
  { main: "Outerwear", sub: "Blazers",  keywords: ["blazer", "suit jacket"] },
  { main: "Outerwear", sub: "Coats",    keywords: ["coat", "trench", "overcoat", "parka"] },
  { main: "Outerwear", sub: "Vests",    keywords: ["vest", "waistcoat", "gilet"] },

  // ── Ethnic Wear ───────────────────────────────────────────────────────
  { main: "Ethnic Wear", sub: "Kurtas",        keywords: ["kurta", "kurti", "ethnic top"] },
  { main: "Ethnic Wear", sub: "Salwar Suits",  keywords: ["salwar", "ethnic suit", "churidar", "anarkali"] },
  { main: "Ethnic Wear", sub: "Sarees",        keywords: ["saree", "sari"] },
  { main: "Ethnic Wear", sub: "Dupattas",      keywords: ["dupatta", "stole", "scarf"] },
  { main: "Ethnic Wear", sub: "Lehengas",      keywords: ["lehenga", "ghagra"] },
  { main: "Ethnic Wear", sub: "Sherwanis",     keywords: ["sherwani", "achkan", "bandhgala", "nehru jacket"] },
  { main: "Ethnic Wear", sub: "Ethnic Dresses", keywords: ["ethnic dress", "ethnic gown"] },

  // ── Activewear ────────────────────────────────────────────────────────
  { main: "Activewear", sub: "Sports Tops",   keywords: ["sports top", "sports bra", "gym top", "active top"] },
  { main: "Activewear", sub: "Track Pants",   keywords: ["track pant", "track bottom", "gym bottom"] },
  { main: "Activewear", sub: "Gym Wear",      keywords: ["gym", "sport", "active", "yoga", "athletic", "workout", "fitness", "compression"] },

  // ── Footwear ──────────────────────────────────────────────────────────
  { main: "Footwear", sub: "Sneakers",  keywords: ["sneaker", "trainer", "running shoe", "athletic shoe", "canvas shoe"] },
  { main: "Footwear", sub: "Heels",     keywords: ["heel", "pump", "stiletto", "wedge"] },
  { main: "Footwear", sub: "Flats",     keywords: ["flat", "loafer", "moccasin", "ballet flat"] },
  { main: "Footwear", sub: "Boots",     keywords: ["boot", "ankle boot", "chelsea boot"] },
  { main: "Footwear", sub: "Sandals",   keywords: ["sandal", "flip flop", "slipper", "slide", "kolhapuri"] },
  { main: "Footwear", sub: "Formal Shoes", keywords: ["formal shoe", "oxford", "derby", "brogue"] },

  // ── Accessories ───────────────────────────────────────────────────────
  { main: "Accessories", sub: "Bags",        keywords: ["bag", "handbag", "purse", "tote", "backpack", "sling", "clutch", "wallet"] },
  { main: "Accessories", sub: "Jewelry",     keywords: ["jewelry", "jewellery", "necklace", "earring", "bracelet", "ring", "anklet", "bangle"] },
  { main: "Accessories", sub: "Watches",     keywords: ["watch"] },
  { main: "Accessories", sub: "Belts",       keywords: ["belt"] },
  { main: "Accessories", sub: "Sunglasses",  keywords: ["sunglasses", "eyewear", "glasses", "shades"] },
  { main: "Accessories", sub: "Hats & Caps", keywords: ["hat", "cap", "beanie", "bucket hat", "beret"] },
  { main: "Accessories", sub: "Scarves",     keywords: ["scarf", "scarves", "wrap"] },
];

export interface TaxonomyResult {
  main: string;
  sub: string;
}

export function classifyProduct(productType: string): TaxonomyResult {
  const lower = productType.toLowerCase().trim();
  for (const rule of RULES) {
    for (const kw of rule.keywords) {
      if (lower.includes(kw)) {
        return { main: rule.main, sub: rule.sub };
      }
    }
  }
  return { main: "Other", sub: productType };
}
