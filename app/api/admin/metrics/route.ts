import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyAdminToken } from "@/lib/admin-auth";
import { DEMO_PRODUCTS } from "@/data/products";

export const dynamic = "force-dynamic";

async function getCatalogStats() {
  if (process.env.MONGODB_URI) {
    try {
      const { connectDB, ProductModel } = await import("@/lib/mongodb");
      await connectDB();
      const total = await ProductModel.estimatedDocumentCount();
      if (total > 0) {
        const [women, men] = await Promise.all([
          ProductModel.countDocuments({ gender: "female" }),
          ProductModel.countDocuments({ gender: "male" }),
        ]);
        return { total, women, men };
      }
    } catch { /* fall through */ }
  }
  return {
    total: DEMO_PRODUCTS.length,
    women: DEMO_PRODUCTS.filter((p) => p.gender === "female").length,
    men:   DEMO_PRODUCTS.filter((p) => p.gender === "male").length,
  };
}

export async function GET() {
  const jar = await cookies();
  const token = jar.get("admin_session")?.value;
  if (!(await verifyAdminToken(token))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const catalog = await getCatalogStats();
  const base = { catalog };

  if (!process.env.MONGODB_URI) {
    return NextResponse.json({ ...base, noMongo: true, daily: [], activeNow: 0, newToday: 0, total: 0 });
  }

  try {
    const { connectDB, UserModel } = await import("@/lib/mongodb");
    await connectDB();

    const now          = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const dayAgo       = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    const [daily, activeNow, newToday, total] = await Promise.all([
      UserModel.aggregate([
        { $match: { createdAt: { $gte: sevenDaysAgo } } },
        { $group: { _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } }, count: { $sum: 1 } } },
        { $sort: { _id: 1 } },
      ]),
      UserModel.countDocuments({ lastActive: { $gte: dayAgo } }),
      UserModel.countDocuments({ createdAt:  { $gte: dayAgo } }),
      UserModel.countDocuments(),
    ]);

    return NextResponse.json({ ...base, noMongo: false, daily, activeNow, newToday, total });
  } catch {
    return NextResponse.json({ ...base, noMongo: true, daily: [], activeNow: 0, newToday: 0, total: 0 });
  }
}
