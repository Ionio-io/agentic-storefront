import { DEFAULT_BRAND, BrandConfig } from "@/data/brand";

// Short TTL cache — avoids a DB hit on every agent call, but ensures admin
// changes propagate within 15 seconds even across warm Vercel lambda instances.
let _cache: BrandConfig | null = null;
let _cachedAt = 0;
const TTL_MS = 15_000;

export async function getBrandConfig(): Promise<BrandConfig> {
  if (_cache && Date.now() - _cachedAt < TTL_MS) return _cache;

  if (process.env.MONGODB_URI) {
    try {
      const { connectDB, BrandConfigModel } = await import("@/lib/mongodb");
      await connectDB();
      const doc = await BrandConfigModel.findOne({ key: "brand" }).lean() as { value?: BrandConfig } | null;
      if (doc?.value) {
        _cache = doc.value as BrandConfig;
        _cachedAt = Date.now();
        return _cache;
      }
    } catch {
      // MongoDB unavailable — fall through to default
    }
  }

  return DEFAULT_BRAND;
}

export async function saveBrandConfig(config: BrandConfig): Promise<void> {
  // Bust cache so the same lambda instance sees the new config immediately
  _cache = config;
  _cachedAt = Date.now();

  if (process.env.MONGODB_URI) {
    const { connectDB, BrandConfigModel } = await import("@/lib/mongodb");
    await connectDB();
    await BrandConfigModel.findOneAndUpdate(
      { key: "brand" },
      { key: "brand", value: config },
      { upsert: true, new: true }
    );
  }
}

export function clearBrandConfigCache(): void {
  _cache = null;
  _cachedAt = 0;
}
