import { NextRequest, NextResponse } from "next/server";
import { verifyAdminToken, COOKIE_NAME } from "@/lib/admin-auth";

export const dynamic = "force-dynamic";

// GET /api/catalog/dead-stock?days=30&maxViews=5
// Returns products with no views (or very low views) over the given period
export async function GET(req: NextRequest) {
  const token = req.cookies.get(COOKIE_NAME)?.value;
  if (!(await verifyAdminToken(token))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!process.env.MONGODB_URI) return NextResponse.json({ error: "MongoDB not configured" }, { status: 503 });

  const { searchParams } = new URL(req.url);
  const days     = parseInt(searchParams.get("days") ?? "30");
  const maxViews = parseInt(searchParams.get("maxViews") ?? "5");
  const cutoff   = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

  try {
    const { connectDB, ProductModel } = await import("@/lib/mongodb");
    await connectDB();

    const products = await ProductModel.find({
      $or: [
        { view_count: { $lte: maxViews } },
        { last_viewed_at: { $lt: cutoff } },
        { last_viewed_at: { $exists: false } },
      ],
    })
      .sort({ view_count: 1, imported_at: 1 })
      .limit(100)
      .lean();

    return NextResponse.json({ ok: true, products, count: products.length });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
