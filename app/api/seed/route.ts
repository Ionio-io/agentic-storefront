import { NextResponse } from "next/server";
import { connectDB, ProductModel } from "@/lib/mongodb";
import { DEMO_PRODUCTS } from "@/data/products";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await connectDB();
    await ProductModel.deleteMany({});
    await ProductModel.insertMany(DEMO_PRODUCTS);
    return NextResponse.json({ ok: true, seeded: DEMO_PRODUCTS.length });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ ok: false, error: String(err) }, { status: 500 });
  }
}
