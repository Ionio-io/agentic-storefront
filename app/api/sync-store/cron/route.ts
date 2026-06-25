import { NextRequest, NextResponse } from "next/server";
import { classifyProduct } from "@/lib/taxonomy";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

const SIZE_TOKENS = new Set([
  "xs","s","m","l","xl","xxl","2xl","3xl",
  "28","30","32","34","36","38","40","42","one size",
]);

const VTON_MAP: Record<string, "upper" | "lower" | "one-pieces"> = {
  "t-shirts":"upper","polo shirts":"upper","casual shirts":"upper","formal shirts":"upper",
  "jackets":"upper","ethnic tops":"upper","tops":"upper","kurtas":"upper","sweatshirts":"upper","shirts":"upper",
  "dresses":"one-pieces","ethnic dresses":"one-pieces","ethnic suits":"one-pieces","jumpsuits":"one-pieces","co-ord sets":"one-pieces",
  "jeans":"lower","formal trousers":"lower","casual trousers":"lower","trousers":"lower","joggers":"lower",
  "shorts":"lower","skirts":"lower","leggings":"lower","palazzos":"lower","pants":"lower",
};

function stripHtml(html: string) { return html.replace(/<[^>]*>/g," ").replace(/\s+/g," ").trim(); }
function inferVton(t: string): "upper"|"lower"|"one-pieces" { return VTON_MAP[t.toLowerCase()] ?? "upper"; }
function inferGender(tags: string[], type: string, vendor: string): "male"|"female" {
  const h = [...tags, type, vendor].join(" ").toLowerCase();
  if (h.includes("women")||h.includes("female")||h.includes("ladies")) return "female";
  if (h.includes("men")||h.includes("male")||h.includes("gents")) return "male";
  return "female";
}

async function syncStore(storeUrl: string, storeId: string) {
  const { ProductModel, SyncStoreModel } = await import("@/lib/mongodb");
  const base = storeUrl.replace(/\/+$/, "");
  const all: Record<string, unknown>[] = [];
  let page = 1;

  while (true) {
    const url = `${base}/products.json?page=${page}&limit=250`;
    let res: Response;
    try {
      res = await fetch(url, {
        headers: { "User-Agent": "Mozilla/5.0 (compatible; catalog-importer/1.0)" },
        signal: AbortSignal.timeout(15000),
      });
    } catch { break; }
    if (!res.ok) break;
    const data = await res.json() as { products?: Record<string, unknown>[] };
    const batch = data.products ?? [];
    if (!batch.length) break;
    all.push(...batch);
    page++;
    if (page > 50) break;
  }

  if (all.length === 0) return { imported: 0 };

  const now = new Date().toISOString();
  const ops = all.map((p, i) => {
    const tagsRaw: string[] = Array.isArray(p.tags) ? p.tags as string[]
      : typeof p.tags === "string" ? (p.tags as string).split(",").map((t: string) => t.trim()).filter(Boolean) : [];
    const productType = (p.product_type as string) ?? "Tops";
    const variants = (p.variants as Array<{ price?: string; option1?: string; available?: boolean; inventory_quantity?: number }>) ?? [];
    const available_sizes = variants
      .filter((v) => v.available !== false && (v.inventory_quantity === undefined || v.inventory_quantity > 0))
      .map((v) => (v.option1 ?? "").trim().toUpperCase())
      .filter((s) => SIZE_TOKENS.has(s.toLowerCase()));
    const sizes = tagsRaw.map((t) => t.toLowerCase().trim()).filter((t) => SIZE_TOKENS.has(t)).map((t) => t.toUpperCase());
    const { main, sub } = classifyProduct(productType);
    const product = {
      id: String(p.id ?? `cron-${storeId}-${i}`),
      handle: (p.handle as string) ?? `product-${i}`,
      title: (p.title as string) ?? "Untitled",
      description: p.body_html ? stripHtml(p.body_html as string) : "",
      product_type: productType, vendor: (p.vendor as string) ?? "",
      gender: inferGender(tagsRaw, productType, (p.vendor as string) ?? ""),
      price: Math.round(parseFloat((variants[0]?.price) ?? "0")),
      available: true,
      image_urls: (p.images as Array<{ src?: string }> ?? []).map((img) => img.src ?? "").filter(Boolean),
      tags: tagsRaw,
      sizes: sizes.length > 0 ? sizes : ["S","M","L","XL"],
      available_sizes: available_sizes.length > 0 ? available_sizes : undefined,
      vton_category: inferVton(productType),
      main_category: main, sub_category: sub, imported_at: now,
    };
    return { updateOne: { filter: { id: product.id }, update: { $set: product }, upsert: true } };
  });

  await ProductModel.bulkWrite(ops);
  await SyncStoreModel.findByIdAndUpdate(storeId, { $set: { lastSync: new Date(), lastCount: all.length } });
  return { imported: all.length };
}

// GET /api/sync-store/cron — called by Vercel Cron
// Secured by CRON_SECRET in Authorization header
export async function GET(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (secret) {
    const auth = req.headers.get("authorization") ?? "";
    if (auth !== `Bearer ${secret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  if (!process.env.MONGODB_URI) return NextResponse.json({ ok: true, skipped: "no db" });

  const { connectDB, SyncStoreModel } = await import("@/lib/mongodb");
  await connectDB();

  const now = new Date();
  const scheduleMap: Record<string, number> = { "6h": 6, "12h": 12, "24h": 24 };
  const stores = await SyncStoreModel.find({ enabled: true, schedule: { $ne: "manual" } }).lean();

  const results: { name: string; imported?: number; error?: string }[] = [];

  for (const store of stores) {
    const hours = scheduleMap[store.schedule as string] ?? 24;
    const due = store.lastSync
      ? new Date(store.lastSync).getTime() + hours * 60 * 60 * 1000
      : 0;
    if (now.getTime() < due) {
      results.push({ name: store.name, imported: -1 }); // skipped
      continue;
    }
    try {
      const r = await syncStore(store.storeUrl as string, String(store._id));
      results.push({ name: store.name, imported: r.imported });
    } catch (err) {
      results.push({ name: store.name, error: String(err) });
    }
  }

  return NextResponse.json({ ok: true, ran: results });
}
