export const dynamic = "force-dynamic";
import { getBrandConfig } from "@/lib/brand-config";
import { DEMO_PRODUCTS } from "@/data/products";
import { AdminDashboard } from "@/components/admin/AdminDashboard";

async function getUserStats() {
  if (!process.env.MONGODB_URI) return { total: 0, newThisWeek: 0, activeToday: 0, noMongo: true };
  try {
    const { connectDB, UserModel } = await import("@/lib/mongodb");
    await connectDB();
    const now = new Date();
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const dayAgo  = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const [total, newThisWeek, activeToday] = await Promise.all([
      UserModel.countDocuments(),
      UserModel.countDocuments({ createdAt: { $gte: weekAgo } }),
      UserModel.countDocuments({ lastActive: { $gte: dayAgo } }),
    ]);
    return { total, newThisWeek, activeToday, noMongo: false };
  } catch {
    return { total: 0, newThisWeek: 0, activeToday: 0, noMongo: true };
  }
}

export default async function AdminPage() {
  const [brand, userStats] = await Promise.all([getBrandConfig(), getUserStats()]);

  const totalProducts  = DEMO_PRODUCTS.length;
  const womenProducts  = DEMO_PRODUCTS.filter((p) => p.gender === "female").length;
  const menProducts    = DEMO_PRODUCTS.filter((p) => p.gender === "male").length;

  return (
    <AdminDashboard
      brand={brand}
      stats={{ totalProducts, womenProducts, menProducts }}
      userStats={userStats}
      systemStatus={{
        hasVton:        !!process.env.FAL_KEY,
        hasOpenRouter:  !!process.env.OPENROUTER_API_KEY,
        hasMongo:       !!process.env.MONGODB_URI,
      }}
    />
  );
}
