import { NextResponse } from "next/server";
import { DEMO_PRODUCTS } from "@/data/products";
import { classifyProduct } from "@/lib/taxonomy";

export const dynamic = "force-dynamic";

export interface CategoryType {
  name: string;   // raw product_type
  sub: string;    // our sub classification
  count: number;
}

export interface CategoryGroup {
  main: string;
  count: number;
  types: CategoryType[];
}

function buildGroups(
  typeCounts: Map<string, number>
): CategoryGroup[] {
  const mainMap = new Map<string, CategoryGroup>();
  for (const [rawType, count] of Array.from(typeCounts.entries())) {
    const { main, sub } = classifyProduct(rawType);
    if (!mainMap.has(main)) mainMap.set(main, { main, count: 0, types: [] });
    const g = mainMap.get(main)!;
    g.count += count;
    g.types.push({ name: rawType, sub, count });
  }
  return Array.from(mainMap.values())
    .sort((a, b) => b.count - a.count)
    .map((g) => ({ ...g, types: g.types.sort((a, b) => b.count - a.count) }));
}

export async function GET() {
  if (process.env.MONGODB_URI) {
    try {
      const { connectDB, ProductModel } = await import("@/lib/mongodb");
      await connectDB();

      // Aggregate counts by product_type in one query
      const agg = await ProductModel.aggregate<{ _id: string; count: number }>([
        { $group: { _id: "$product_type", count: { $sum: 1 } } },
      ]);

      const typeCounts = new Map<string, number>();
      let total = 0;
      for (const { _id, count } of agg) {
        if (_id) { typeCounts.set(_id, count); total += count; }
      }

      if (total > 0) {
        const groups = buildGroups(typeCounts);
        return NextResponse.json({ groups, total });
      }
    } catch {
      // fall through
    }
  }

  // Static fallback
  const typeCounts = new Map<string, number>();
  for (const p of DEMO_PRODUCTS) {
    typeCounts.set(p.product_type, (typeCounts.get(p.product_type) ?? 0) + 1);
  }
  const groups = buildGroups(typeCounts);
  return NextResponse.json({ groups, total: DEMO_PRODUCTS.length });
}
