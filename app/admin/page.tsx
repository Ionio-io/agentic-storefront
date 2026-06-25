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

async function getProductStats() {
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
        return { totalProducts: total, womenProducts: women, menProducts: men };
      }
    } catch { /* fallback */ }
  }
  return {
    totalProducts: DEMO_PRODUCTS.length,
    womenProducts: DEMO_PRODUCTS.filter((p) => p.gender === "female").length,
    menProducts:   DEMO_PRODUCTS.filter((p) => p.gender === "male").length,
  };
}

export default async function AdminPage() {
  const [brand, userStats, stats] = await Promise.all([
    getBrandConfig(),
    getUserStats(),
    getProductStats(),
  ]);

  return (
    <AdminDashboard
      brand={brand}
      stats={stats}
      userStats={userStats}
      systemStatus={{
        hasVton:        !!process.env.FAL_KEY,
        hasOpenRouter:  !!process.env.OPENROUTER_API_KEY,
        hasMongo:       !!process.env.MONGODB_URI,
      }}
    />
  );
}
