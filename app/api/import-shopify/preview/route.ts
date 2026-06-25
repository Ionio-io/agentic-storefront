import { NextRequest, NextResponse } from "next/server";
import { classifyProduct } from "@/lib/taxonomy";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

interface ShopifyProduct {
  product_type?: string;
  vendor?: string;
  images?: Array<{ src?: string }>;
}

export interface PreviewType {
  name: string;    // raw Shopify product_type
  sub: string;     // our sub classification
  count: number;
  sample: string;  // first image URL from this type
}

export interface PreviewGroup {
  main: string;    // our main classification
  count: number;
  types: PreviewType[];
}

export interface PreviewResponse {
  ok: true;
  total: number;
  pages: number;
  groups: PreviewGroup[];
}

export async function POST(req: NextRequest) {
  const { storeUrl } = await req.json() as { storeUrl: string };
  if (!storeUrl?.trim()) {
    return NextResponse.json({ error: "storeUrl is required" }, { status: 400 });
  }

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
      return NextResponse.json({ error: `Could not reach ${base}. Check the URL.` }, { status: 400 });
    }

    if (!res.ok) {
      return NextResponse.json(
        { error: `Store returned HTTP ${res.status}. The store may restrict public access.` },
        { status: 400 }
      );
    }

    let data: { products?: ShopifyProduct[] };
    try { data = await res.json() as { products?: ShopifyProduct[] }; }
    catch { return NextResponse.json({ error: "Response was not valid JSON." }, { status: 400 }); }

    const batch = data.products ?? [];
    if (batch.length === 0) break;
    all.push(...batch);
    page++;
    if (page > 50) break;
  }

  if (all.length === 0) {
    return NextResponse.json({ error: "No products found at that URL." }, { status: 400 });
  }

  // Build: map[rawType] → { count, firstImageSrc }
  const typeCounts = new Map<string, { count: number; sample: string }>();
  for (const p of all) {
    const rawType = p.product_type?.trim() || "Uncategorized";
    const entry = typeCounts.get(rawType) ?? { count: 0, sample: "" };
    entry.count++;
    if (!entry.sample && p.images?.[0]?.src) entry.sample = p.images[0].src;
    typeCounts.set(rawType, entry);
  }

  // Group by main category using taxonomy
  const mainGroups = new Map<string, PreviewGroup>();
  for (const [rawType, { count, sample }] of Array.from(typeCounts.entries())) {
    const { main, sub } = classifyProduct(rawType);
    if (!mainGroups.has(main)) {
      mainGroups.set(main, { main, count: 0, types: [] });
    }
    const group = mainGroups.get(main)!;
    group.count += count;
    group.types.push({ name: rawType, sub, count, sample });
  }

  const groups: PreviewGroup[] = Array.from(mainGroups.values())
    .sort((a, b) => b.count - a.count)
    .map((g) => ({ ...g, types: g.types.sort((a, b) => b.count - a.count) }));

  return NextResponse.json({ ok: true, total: all.length, pages: page - 1, groups } satisfies PreviewResponse);
}
