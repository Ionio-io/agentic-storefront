import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyAdminToken } from "@/lib/admin-auth";
import { DEMO_PRODUCTS } from "@/data/products";

export const dynamic = "force-dynamic";

export async function GET() {
  const jar = await cookies();
  const token = jar.get("admin_session")?.value;
  if (!(await verifyAdminToken(token))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const catalogTotal = DEMO_PRODUCTS.length;
  const catalogWomen = DEMO_PRODUCTS.filter((p) => p.gender === "female").length;
  const catalogMen   = DEMO_PRODUCTS.filter((p) => p.gender === "male").length;

  const base = { catalog: { total: catalogTotal, women: catalogWomen, men: catalogMen } };

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
