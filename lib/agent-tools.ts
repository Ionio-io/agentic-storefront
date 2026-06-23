import { DEMO_PRODUCTS } from "@/data/products";
import { Product } from "@/types";

// ─── Tool Definitions (OpenAI function-calling schema) ────────────────────────

export const TOOL_DEFINITIONS = [
  {
    type: "function",
    function: {
      name: "get_wishlist_products",
      description:
        "Fetch the products saved in the shopper's wishlist. Use this when the shopper says 'my wishlist', 'items I saved', 'build an outfit from my saved items', or 'what did I save'.",
      parameters: {
        type: "object",
        properties: {
          productIds: {
            type: "array",
            items: { type: "string" },
            description: "Array of product IDs from the shopper's wishlist. These will be provided in the system context.",
          },
        },
        required: ["productIds"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "search_products",
      description:
        "Search the brand catalog for products. Use this whenever the shopper asks for clothing, outfits, or anything to wear. Supports filtering by gender, price, occasion, and product type.",
      parameters: {
        type: "object",
        properties: {
          query: {
            type: "string",
            description:
              "Natural language search query — e.g. 'floral dress', 'ethnic kurta', 'slim fit jeans', 'formal shirt'",
          },
          gender: {
            type: "string",
            enum: ["male", "female", "all"],
            description: "Shopper gender. Infer from context; use 'all' if unknown.",
          },
          max_price: {
            type: "number",
            description: "Maximum price in INR. Omit if no budget constraint.",
          },
          occasion: {
            type: "string",
            enum: ["casual", "office", "festive", "wedding", "party", "daily", "any"],
            description:
              "Occasion context to improve relevance. Maps to product tags.",
          },
          product_type: {
            type: "string",
            description:
              "Narrow to a specific product type: Dresses, T-Shirts, Jeans, Kurtas, Tops, Jackets, Trousers, Ethnic Suits, Formal Shirts, Casual Shirts, Polo Shirts, etc.",
          },
          limit: {
            type: "number",
            description: "Max results to return. Default 4, max 6.",
          },
        },
        required: ["query"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "build_outfit",
      description:
        "Given a base product the shopper likes, find 2–3 complementary pieces to complete a full outfit. Use this when the shopper asks for a 'complete look', 'full outfit', or 'what goes with this'.",
      parameters: {
        type: "object",
        properties: {
          base_product_id: {
            type: "string",
            description: "The id of the product to build an outfit around.",
          },
          style: {
            type: "string",
            enum: ["casual", "formal", "festive", "party", "any"],
            description: "Desired outfit style. Default 'any'.",
          },
        },
        required: ["base_product_id"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "get_similar_products",
      description:
        "Find products similar to one the shopper is already looking at — same category, same gender, similar price range. Use when the shopper says 'show me more like this' or 'any other options'.",
      parameters: {
        type: "object",
        properties: {
          product_id: {
            type: "string",
            description: "The id of the reference product.",
          },
          limit: {
            type: "number",
            description: "Max results. Default 4.",
          },
        },
        required: ["product_id"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "filter_by_size",
      description:
        "Find all products available in a specific size. Use when the shopper mentions their size (e.g. 'I'm a medium', 'do you have this in XL', 'size 32 jeans').",
      parameters: {
        type: "object",
        properties: {
          size: {
            type: "string",
            description:
              "Size to filter by. Clothing: XS, S, M, L, XL, XXL. Bottoms: 28, 30, 32, 34, 36, 38, 40.",
          },
          gender: {
            type: "string",
            enum: ["male", "female", "all"],
            description: "Filter by gender. Default 'all'.",
          },
          product_type: {
            type: "string",
            description: "Optionally narrow to a specific product type.",
          },
        },
        required: ["size"],
      },
    },
  },
];

// ─── Occasion → tag keyword map ───────────────────────────────────────────────

const OCCASION_TAGS: Record<string, string[]> = {
  casual:  ["casual", "everyday", "relaxed", "daily", "cotton", "comfort"],
  office:  ["formal", "office", "work", "professional", "business"],
  festive: ["festive", "ethnic", "diwali", "traditional", "embroidery", "zari", "sequin"],
  wedding: ["wedding", "festive", "ethnic", "embroidery", "silk", "bridal"],
  party:   ["party", "evening", "night", "sequin", "embroidered", "dress"],
  daily:   ["casual", "everyday", "cotton", "comfortable", "basic"],
  any:     [],
};

// ─── MongoDB helper — returns ProductModel only when catalog has been uploaded ─

async function getProductModel() {
  if (!process.env.MONGODB_URI) return null;
  try {
    const { connectDB, ProductModel } = await import("@/lib/mongodb");
    await connectDB();
    const count = await ProductModel.estimatedDocumentCount();
    return count > 0 ? ProductModel : null;
  } catch {
    return null;
  }
}

// ─── Tool Implementations (async — try MongoDB first, fall back to static) ────

interface SearchArgs {
  query: string;
  gender?: string;
  max_price?: number;
  occasion?: string;
  product_type?: string;
  limit?: number;
}

export async function searchProducts(args: SearchArgs): Promise<Product[]> {
  const {
    query,
    gender = "all",
    max_price,
    occasion = "any",
    product_type,
    limit = 4,
  } = args;

  const maxResults = Math.min(limit, 20);
  const occasionWords = OCCASION_TAGS[occasion] ?? [];

  const PM = await getProductModel();
  if (PM) {
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const filter: Record<string, any> = {};
      if (gender !== "all") filter.gender = gender;
      if (max_price) filter.price = { $lte: max_price };
      if (product_type) filter.product_type = { $regex: product_type, $options: "i" };

      const terms = [
        ...query.toLowerCase().split(/\s+/).filter(Boolean),
        ...occasionWords,
      ].filter(Boolean);

      if (terms.length > 0) {
        const pattern = terms.join("|");
        filter.$or = [
          { title:        { $regex: pattern, $options: "i" } },
          { description:  { $regex: pattern, $options: "i" } },
          { product_type: { $regex: pattern, $options: "i" } },
          { tags:         { $elemMatch: { $regex: pattern, $options: "i" } } },
          { vendor:       { $regex: pattern, $options: "i" } },
        ];
      }

      const products = await PM.find(filter).limit(maxResults).lean() as unknown as Product[];
      if (products.length > 0) return products;
    } catch { /* fall through to static */ }
  }

  // Static fallback — score every product, return top maxResults
  const words = query.toLowerCase().split(/\s+/).filter(Boolean);
  const scored = DEMO_PRODUCTS.map((p) => {
    if (gender !== "all" && p.gender !== gender) return { p, score: -1 };
    if (max_price && p.price > max_price) return { p, score: -1 };
    if (product_type && !p.product_type.toLowerCase().includes(product_type.toLowerCase()))
      return { p, score: -1 };
    const haystack = [p.title, p.description, p.product_type, p.vendor, ...p.tags].join(" ").toLowerCase();
    const queryScore = words.filter((w) => haystack.includes(w)).length;
    // If no query words matched at all, still include with low score when searching broadly
    const occasionScore = occasionWords.filter((w) => haystack.includes(w)).length * 0.5;
    const total = queryScore + occasionScore;
    if (total === 0 && words.length > 0) return { p, score: -1 };
    return { p, score: total };
  });
  return scored
    .filter((s) => s.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, maxResults)
    .map((s) => s.p);
}

interface BuildOutfitArgs {
  base_product_id: string;
  style?: string;
}

export async function buildOutfit(args: BuildOutfitArgs): Promise<Product[]> {
  const { base_product_id, style = "any" } = args;
  const styleWords = style !== "any" ? OCCASION_TAGS[style] ?? [] : [];

  const PM = await getProductModel();

  // Find base product — MongoDB first, then static
  let base: Product | undefined;
  if (PM) {
    try {
      base = await PM.findOne({ id: base_product_id }).lean() as unknown as Product | undefined;
    } catch { /* fall through */ }
  }
  if (!base) base = DEMO_PRODUCTS.find((p) => p.id === base_product_id);
  if (!base) return [];

  const { gender, vton_category, price } = base;
  const priceMin = price * 0.5;
  const priceMax = price * 1.8;

  const targetCategories = vton_category === "lower" ? ["upper"] : ["lower"];

  if (PM) {
    try {
      const candidates = await PM.find({
        id:           { $ne: base_product_id },
        gender,
        vton_category: { $in: targetCategories },
        price:        { $gte: priceMin, $lte: priceMax },
      }).limit(10).lean() as unknown as Product[];

      if (candidates.length > 0) {
        return candidates
          .map((p) => {
            const haystack = [p.title, p.description, ...p.tags].join(" ").toLowerCase();
            return { p, score: styleWords.filter((w) => haystack.includes(w)).length };
          })
          .sort((a, b) => b.score - a.score)
          .slice(0, 3)
          .map((s) => s.p);
      }
    } catch { /* fall through */ }
  }

  // Static fallback
  const candidates = DEMO_PRODUCTS.filter((p) => {
    if (p.id === base_product_id) return false;
    if (p.gender !== gender) return false;
    if (!targetCategories.includes(p.vton_category)) return false;
    return p.price >= priceMin && p.price <= priceMax;
  });
  return candidates
    .map((p) => {
      const haystack = [p.title, p.description, ...p.tags].join(" ").toLowerCase();
      return { p, score: styleWords.filter((w) => haystack.includes(w)).length };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, 3)
    .map((s) => s.p);
}

interface GetSimilarArgs {
  product_id: string;
  limit?: number;
}

export async function getSimilarProducts(args: GetSimilarArgs): Promise<Product[]> {
  const { product_id, limit = 4 } = args;

  const PM = await getProductModel();

  let base: Product | undefined;
  if (PM) {
    try {
      base = await PM.findOne({ id: product_id }).lean() as unknown as Product | undefined;
    } catch { /* fall through */ }
  }
  if (!base) base = DEMO_PRODUCTS.find((p) => p.id === product_id);
  if (!base) return [];

  const { gender, product_type, price } = base;
  const priceMin = price * 0.7;
  const priceMax = price * 1.3;

  if (PM) {
    try {
      const products = await PM.find({
        id:           { $ne: product_id },
        gender,
        product_type,
        price:        { $gte: priceMin, $lte: priceMax },
      }).limit(limit).lean() as unknown as Product[];
      if (products.length > 0) return products;
    } catch { /* fall through */ }
  }

  return DEMO_PRODUCTS.filter(
    (p) =>
      p.id !== product_id &&
      p.gender === gender &&
      p.product_type === product_type &&
      p.price >= priceMin &&
      p.price <= priceMax
  ).slice(0, limit);
}

interface FilterBySizeArgs {
  size: string;
  gender?: string;
  product_type?: string;
}

export async function filterBySize(args: FilterBySizeArgs): Promise<Product[]> {
  const { size, gender = "all", product_type } = args;
  const norm = size.toUpperCase();

  const PM = await getProductModel();
  if (PM) {
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const filter: Record<string, any> = { sizes: norm };
      if (gender !== "all") filter.gender = gender;
      if (product_type) filter.product_type = { $regex: product_type, $options: "i" };

      const products = await PM.find(filter).limit(6).lean() as unknown as Product[];
      if (products.length > 0) return products;
    } catch { /* fall through */ }
  }

  return DEMO_PRODUCTS.filter((p) => {
    if (gender !== "all" && p.gender !== gender) return false;
    if (product_type && !p.product_type.toLowerCase().includes(product_type.toLowerCase()))
      return false;
    return p.sizes.some((s) => s.toUpperCase() === norm);
  }).slice(0, 6);
}

interface GetWishlistArgs {
  productIds: string[];
}

export async function getWishlistProducts(args: GetWishlistArgs): Promise<Product[]> {
  const { productIds } = args;
  if (!productIds?.length) return [];

  const PM = await getProductModel();
  if (PM) {
    try {
      const products = await PM.find({ id: { $in: productIds } }).limit(10).lean() as unknown as Product[];
      if (products.length > 0) return products;
    } catch { /* fall through */ }
  }
  return DEMO_PRODUCTS.filter((p) => productIds.includes(p.id)).slice(0, 10);
}

// ─── Dispatcher ───────────────────────────────────────────────────────────────

export async function executeToolCall(name: string, args: unknown): Promise<Product[]> {
  switch (name) {
    case "search_products":        return searchProducts(args as SearchArgs);
    case "build_outfit":           return buildOutfit(args as BuildOutfitArgs);
    case "get_similar_products":   return getSimilarProducts(args as GetSimilarArgs);
    case "filter_by_size":         return filterBySize(args as FilterBySizeArgs);
    case "get_wishlist_products":  return getWishlistProducts(args as GetWishlistArgs);
    default:                       return [];
  }
}
