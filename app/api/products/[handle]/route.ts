import { NextRequest, NextResponse } from "next/server";
import { DEMO_PRODUCTS } from "@/data/products";

export const dynamic = "force-dynamic";

export async function GET(
  _req: NextRequest,
  { params }: { params: { handle: string } }
) {
  const { handle } = params;

  if (process.env.MONGODB_URI) {
    try {
      const { connectDB, ProductModel } = await import("@/lib/mongodb");
      await connectDB();
      const product = await ProductModel.findOne({ handle }).lean();
      if (product) return NextResponse.json(product);
    } catch { /* fall through to static */ }
  }

  const product = DEMO_PRODUCTS.find((p) => p.handle === handle);
  if (!product) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(product);
}
