import { NextRequest, NextResponse } from "next/server";
import { searchLocal } from "@/lib/search";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const query    = searchParams.get("q") ?? "";
  const gender   = searchParams.get("gender") ?? "all";
  const maxPrice = searchParams.get("maxPrice");
  const limit    = parseInt(searchParams.get("limit") ?? "4", 10);

  const maxPriceNum = maxPrice ? parseFloat(maxPrice) : undefined;

  // Try MongoDB first, fall back to static data
  if (process.env.MONGODB_URI) {
    try {
      const { connectDB, ProductModel } = await import("@/lib/mongodb");
      await connectDB();

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const filter: Record<string, any> = {};
      if (query) {
        filter.$or = [
          { title:        { $regex: query, $options: "i" } },
          { description:  { $regex: query, $options: "i" } },
          { product_type: { $regex: query, $options: "i" } },
          { tags:         { $elemMatch: { $regex: query, $options: "i" } } },
          { vendor:       { $regex: query, $options: "i" } },
        ];
      }
      if (gender !== "all") filter.gender = gender;
      if (maxPriceNum)      filter.price = { $lte: maxPriceNum };

      const products = await ProductModel.find(filter).limit(limit).lean();
      return NextResponse.json({ products, source: "mongodb" });
    } catch {
      // Fall through to static
    }
  }

  const products = searchLocal(query, gender, maxPriceNum, limit);
  return NextResponse.json({ products, source: "static" });
}
