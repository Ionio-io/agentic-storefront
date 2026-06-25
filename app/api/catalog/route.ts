import { NextRequest, NextResponse } from "next/server";
import { DEMO_PRODUCTS } from "@/data/products";
import { Product } from "@/types";
import { classifyProduct } from "@/lib/taxonomy";

export const dynamic = "force-dynamic";

// ─── GET /api/catalog?page=1&limit=20&gender=all&type= ───────────────────────

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const page      = Math.max(1, parseInt(searchParams.get("page")   ?? "1"));
  const limit     = Math.min(500, parseInt(searchParams.get("limit") ?? "20"));
  const gender    = searchParams.get("gender") ?? "all";
  const type      = searchParams.get("type")?.toLowerCase() ?? "";
  const mainCat   = searchParams.get("mainCat") ?? "";
  const isNew     = searchParams.get("isNew") === "true";
  const sizeParam = searchParams.get("size") ?? "";
  const sortParam = searchParams.get("sort") ?? "";
  const search    = searchParams.get("search")?.trim() ?? "";

  // Try MongoDB first (uploaded catalog), fall back to demo products
  if (process.env.MONGODB_URI) {
    try {
      const { connectDB, ProductModel } = await import("@/lib/mongodb");
      await connectDB();

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const filter: Record<string, any> = {};
      if (gender !== "all") filter.gender = gender;

      if (search) {
        const re = { $regex: search, $options: "i" };
        filter.$or = [
          { title: re },
          { vendor: re },
          { product_type: re },
          { tags: re },
          { description: re },
        ];
      } else if (type) {
        filter.product_type = { $regex: type, $options: "i" };
      } else if (mainCat) {
        const allTypes = await ProductModel.distinct("product_type") as string[];
        const matching = allTypes.filter((t) => classifyProduct(t).main === mainCat);
        if (matching.length > 0) {
          filter.$or = [
            { main_category: mainCat },
            { main_category: { $exists: false }, product_type: { $in: matching } },
          ];
        } else {
          filter.main_category = mainCat;
        }
      }

      if (isNew) filter.is_new = true;
      if (sizeParam) filter.available_sizes = sizeParam.toUpperCase();

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let sortOrder: Record<string, any> = {};
      if (sortParam === "featured") sortOrder = { is_featured: -1, _id: -1 };
      else if (sortParam === "price-asc") sortOrder = { price: 1 };
      else if (sortParam === "price-desc") sortOrder = { price: -1 };

      const [total, products, womenTotal, menTotal, newTotal] = await Promise.all([
        ProductModel.countDocuments(filter),
        ProductModel.find(filter)
          .sort(sortOrder)
          .skip((page - 1) * limit)
          .limit(limit)
          .lean(),
        ProductModel.countDocuments({ gender: "female" }),
        ProductModel.countDocuments({ gender: "male" }),
        ProductModel.countDocuments({ is_new: true }),
      ]);

      if (total > 0 || search) {
        return NextResponse.json({
          products,
          total,
          page,
          pages: Math.ceil(total / limit),
          womenTotal,
          menTotal,
          newTotal,
        });
      }
    } catch {
      // Fall through to static data
    }
  }

  // Static fallback
  let products = DEMO_PRODUCTS as Product[];
  if (gender !== "all") products = products.filter((p) => p.gender === gender);

  if (search) {
    const q = search.toLowerCase();
    products = products.filter((p) =>
      [p.title, p.vendor, p.product_type, p.description ?? "", ...p.tags].join(" ").toLowerCase().includes(q)
    );
  } else if (type) {
    products = products.filter((p) => p.product_type.toLowerCase().includes(type));
  } else if (mainCat) {
    products = products.filter((p) => classifyProduct(p.product_type).main === mainCat);
  }

  if (isNew) products = products.filter((p) => p.is_new);
  if (sizeParam) products = products.filter((p) => (p.available_sizes ?? p.sizes).includes(sizeParam.toUpperCase()));

  const allDemo = DEMO_PRODUCTS as Product[];
  const total = products.length;
  const start = (page - 1) * limit;
  const items = products.slice(start, start + limit);

  return NextResponse.json({
    products: items,
    total,
    page,
    pages: Math.ceil(total / limit),
    womenTotal: allDemo.filter((p) => p.gender === "female").length,
    menTotal: allDemo.filter((p) => p.gender === "male").length,
    newTotal: allDemo.filter((p) => p.is_new).length,
  });
}

// ─── POST /api/catalog — upload Shopify JSON or our product format ────────────

interface ShopifyProduct {
  id?: string | number;
  handle?: string;
  title?: string;
  body_html?: string;
  product_type?: string;
  vendor?: string;
  tags?: string | string[];
  variants?: Array<{ price?: string; option1?: string }>;
  images?: Array<{ src?: string }>;
}

const VTON_MAP: Record<string, "upper" | "lower" | "one-pieces"> = {
  "t-shirts": "upper", "polo shirts": "upper", "casual shirts": "upper",
  "formal shirts": "upper", "jackets": "upper", "ethnic tops": "upper",
  "tops": "upper", "kurtas": "upper", "sweatshirts": "upper",
  "dresses": "one-pieces", "ethnic dresses": "one-pieces", "ethnic suits": "one-pieces",
  "jumpsuits": "one-pieces", "co-ord sets": "one-pieces",
  "jeans": "lower", "formal trousers": "lower", "casual trousers": "lower",
  "joggers": "lower", "shorts": "lower", "skirts": "lower",
  "leggings": "lower", "palazzos": "lower",
};

function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
}

function inferVtonCategory(productType: string): "upper" | "lower" | "one-pieces" {
  const key = productType.toLowerCase();
  return VTON_MAP[key] ?? "upper";
}

function inferGender(tags: string[], productType: string, vendor: string): "male" | "female" {
  const haystack = [...tags, productType, vendor].join(" ").toLowerCase();
  if (haystack.includes("women") || haystack.includes("female") || haystack.includes("ladies"))
    return "female";
  if (haystack.includes("men") || haystack.includes("male") || haystack.includes("gents"))
    return "male";
  return "female";
}

const SIZE_TOKENS = new Set(["xs","s","m","l","xl","xxl","2xl","3xl","28","30","32","34","36","38","40","42","one size"]);

function extractSizes(tags: string[]): string[] {
  return tags
    .map((t) => t.toLowerCase().trim())
    .filter((t) => SIZE_TOKENS.has(t))
    .map((t) => t.toUpperCase());
}

export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  // Accept either { products: ShopifyProduct[] } (Shopify export) or Product[]
  let raw: ShopifyProduct[] = [];
  if (Array.isArray(body)) {
    raw = body as ShopifyProduct[];
  } else if (
    typeof body === "object" && body !== null &&
    "products" in body && Array.isArray((body as Record<string, unknown>).products)
  ) {
    raw = (body as { products: ShopifyProduct[] }).products;
  } else {
    return NextResponse.json({ error: "Expected { products: [...] } or [...]" }, { status: 400 });
  }

  if (raw.length === 0) {
    return NextResponse.json({ error: "Empty product list" }, { status: 400 });
  }
  if (raw.length > 500) {
    return NextResponse.json({ error: "Max 500 products per upload" }, { status: 400 });
  }

  const converted: Product[] = raw.map((p, i) => {
    const tagsRaw: string[] = Array.isArray(p.tags)
      ? p.tags
      : typeof p.tags === "string"
        ? p.tags.split(",").map((t: string) => t.trim())
        : [];

    const priceStr = p.variants?.[0]?.price ?? "0";
    const price = Math.round(parseFloat(priceStr));
    const productType = p.product_type ?? "Tops";
    const sizes = extractSizes(tagsRaw);

    return {
      id: String(p.id ?? `upload-${i}`),
      handle: p.handle ?? `product-${i}`,
      title: p.title ?? "Untitled",
      description: p.body_html ? stripHtml(p.body_html) : "",
      product_type: productType,
      vendor: p.vendor ?? "",
      gender: inferGender(tagsRaw, productType, p.vendor ?? ""),
      price,
      available: true,
      image_urls: (p.images ?? []).map((img) => img.src ?? "").filter(Boolean),
      tags: tagsRaw,
      sizes: sizes.length > 0 ? sizes : ["S", "M", "L", "XL"],
      vton_category: inferVtonCategory(productType),
    };
  });

  // If MongoDB is available, upsert products
  if (process.env.MONGODB_URI) {
    try {
      const { connectDB, ProductModel } = await import("@/lib/mongodb");
      await connectDB();
      const ops = converted.map((p) => ({
        updateOne: {
          filter: { id: p.id },
          update: { $set: p },
          upsert: true,
        },
      }));
      await ProductModel.bulkWrite(ops);
      return NextResponse.json({ ok: true, count: converted.length, storage: "mongodb" });
    } catch (err) {
      console.error("[catalog] MongoDB upsert failed:", err);
    }
  }

  // No MongoDB — return the parsed products for the caller to handle
  return NextResponse.json({
    ok: true,
    count: converted.length,
    storage: "static",
    products: converted,
    note: "MongoDB not configured. Products returned but not persisted. Set MONGODB_URI to enable persistence.",
  });
}
