import { NextRequest, NextResponse } from "next/server";
import { Product } from "@/types";
import { classifyProduct } from "@/lib/taxonomy";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

const VTON_MAP: Record<string, "upper" | "lower" | "one-pieces"> = {
  "t-shirts": "upper", "polo shirts": "upper", "casual shirts": "upper",
  "formal shirts": "upper", "jackets": "upper", "ethnic tops": "upper",
  "tops": "upper", "kurtas": "upper", "sweatshirts": "upper", "shirts": "upper",
  "dresses": "one-pieces", "ethnic dresses": "one-pieces", "ethnic suits": "one-pieces",
  "jumpsuits": "one-pieces", "co-ord sets": "one-pieces",
  "jeans": "lower", "formal trousers": "lower", "casual trousers": "lower",
  "trousers": "lower", "joggers": "lower", "shorts": "lower", "skirts": "lower",
  "leggings": "lower", "palazzos": "lower", "pants": "lower",
};

interface ShopifyProduct {
  id?: string | number;
  handle?: string;
  title?: string;
  body_html?: string;
  product_type?: string;
  vendor?: string;
  tags?: string | string[];
  variants?: Array<{ price?: string; option1?: string; available?: boolean; inventory_quantity?: number }>;
  images?: Array<{ src?: string }>;
}

function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
}

function inferVtonCategory(productType: string): "upper" | "lower" | "one-pieces" {
  return VTON_MAP[productType.toLowerCase()] ?? "upper";
}

function inferGender(tags: string[], productType: string, vendor: string): "male" | "female" {
  const haystack = [...tags, productType, vendor].join(" ").toLowerCase();
  if (haystack.includes("women") || haystack.includes("female") || haystack.includes("ladies")) return "female";
  if (haystack.includes("men") || haystack.includes("male") || haystack.includes("gents")) return "male";
  return "female";
}

const SIZE_TOKENS = new Set([
  "xs","s","m","l","xl","xxl","2xl","3xl",
  "28","30","32","34","36","38","40","42","one size",
]);

function extractSizes(tags: string[]): string[] {
  return tags
    .map((t) => t.toLowerCase().trim())
    .filter((t) => SIZE_TOKENS.has(t))
    .map((t) => t.toUpperCase());
}

function convertProduct(p: ShopifyProduct, i: number): Product {
  const tagsRaw: string[] = Array.isArray(p.tags)
    ? p.tags
    : typeof p.tags === "string"
      ? p.tags.split(",").map((t) => t.trim()).filter(Boolean)
      : [];

  const price = Math.round(parseFloat(p.variants?.[0]?.price ?? "0"));
  const productType = p.product_type ?? "Tops";
  const sizes = extractSizes(tagsRaw);

  // Collect sizes from in-stock variants (Feature 11)
  const available_sizes = (p.variants ?? [])
    .filter((v) => v.available !== false && (v.inventory_quantity === undefined || v.inventory_quantity > 0))
    .map((v) => (v.option1 ?? "").trim().toUpperCase())
    .filter((s) => SIZE_TOKENS.has(s.toLowerCase()));

  const { main, sub } = classifyProduct(productType);
  return {
    id: String(p.id ?? `import-${i}`),
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
    available_sizes: available_sizes.length > 0 ? available_sizes : undefined,
    vton_category: inferVtonCategory(productType),
    main_category: main,
    sub_category: sub,
    is_new: true,
    imported_at: new Date().toISOString(),
  };
}

export async function POST(req: NextRequest) {
  const { storeUrl, clearExisting, categories } = await req.json() as {
    storeUrl: string;
    clearExisting?: boolean;
    categories?: string[]; // if provided, only import products in these product_types
  };

  if (!storeUrl?.trim()) {
    return NextResponse.json({ error: "storeUrl is required" }, { status: 400 });
  }

  // Normalize — strip trailing slash, strip /products.json if pasted
  const base = storeUrl.trim().replace(/\/+$/, "").replace(/\/products\.json.*$/, "");

  const all: ShopifyProduct[] = [];
  let page = 1;

  while (true) {
    const url = `${base}/products.json?page=${page}&limit=250`;
    let res: Response;
    try {
      res = await fetch(url, {
        headers: { "User-Agent": "Mozilla/5.0 (compatible; catalog-importer/1.0)" },
        signal: AbortSignal.timeout(15000),
      });
    } catch {
      return NextResponse.json({ error: `Could not reach ${base}. Check the URL and try again.` }, { status: 400 });
    }

    if (!res.ok) {
      return NextResponse.json(
        { error: `Store returned HTTP ${res.status}. The store may have disabled products.json access.` },
        { status: 400 }
      );
    }

    let data: { products?: ShopifyProduct[] };
    try {
      data = await res.json() as { products?: ShopifyProduct[] };
    } catch {
      return NextResponse.json({ error: "Response was not valid JSON. Make sure the URL is a Shopify store." }, { status: 400 });
    }

    const batch = data.products ?? [];
    if (batch.length === 0) break;

    all.push(...batch);
    page++;

    if (page > 50) break; // cap at 12,500 products
  }

  if (all.length === 0) {
    return NextResponse.json({ error: "No products found. The store may be empty or restrict public access." }, { status: 400 });
  }

  // Filter by selected categories if provided
  const filtered = categories && categories.length > 0
    ? all.filter((p) => {
        const type = (p.product_type ?? "Uncategorized").trim();
        return categories.includes(type);
      })
    : all;

  const converted = filtered.map(convertProduct);

  if (process.env.MONGODB_URI) {
    try {
      const { connectDB, ProductModel } = await import("@/lib/mongodb");
      await connectDB();

      if (clearExisting) await ProductModel.deleteMany({});

      const ops = converted.map((p) => ({
        updateOne: { filter: { id: p.id }, update: { $set: p }, upsert: true },
      }));
      await ProductModel.bulkWrite(ops);

      return NextResponse.json({ ok: true, imported: converted.length, pages: page - 1, storage: "mongodb" });
    } catch (err) {
      return NextResponse.json({ error: String(err) }, { status: 500 });
    }
  }

  return NextResponse.json({
    ok: true,
    imported: converted.length,
    pages: page - 1,
    storage: "static",
    note: "MongoDB not configured — products not persisted. Set MONGODB_URI to save them.",
  });
}
