import { NextRequest, NextResponse } from "next/server";
import { buildOutfit } from "@/lib/agent-tools";

export const dynamic = "force-dynamic";

// POST { product_id, style? } → { products }
// Finds 2-3 complementary pieces to complete a look around the given product.
export async function POST(req: NextRequest) {
  const { product_id, style = "any" } = await req.json();
  if (!product_id) return NextResponse.json({ products: [] });
  const products = await buildOutfit({ base_product_id: product_id, style });
  return NextResponse.json({ products });
}
