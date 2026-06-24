import { DEFAULT_BRAND, BrandConfig } from "@/data/brand";

// In-memory cache — good within a single serverless invocation
// On Vercel each invocation may be a fresh cold start, so MongoDB is
// the only true persistence layer. The cache just avoids duplicate DB
// reads within the same request lifecycle.
let _cache: BrandConfig | null = null;
let _cachedAt = 0;
const TTL_MS = 30_000;

export async function getBrandConfig(): Promise<BrandConfig> {
  const now = Date.now();
  if (_cache && now - _cachedAt < TTL_MS) return _cache;

  if (process.env.MONGODB_URI) {
    try {
      const { connectDB, BrandConfigModel } = await import("@/lib/mongodb");
      await connectDB();
      const doc = await BrandConfigModel.findOne({ key: "brand" })
        .maxTimeMS(4000)
        .lean() as { value?: BrandConfig } | null;
      if (doc?.value) {
        _cache = doc.value as BrandConfig;
        _cachedAt = now;
        return _cache;
      }
    } catch {
      // MongoDB unavailable or timed out — use default
    }
  }

  // Always return a valid config — never throw
  return DEFAULT_BRAND;
}

export async function saveBrandConfig(config: BrandConfig): Promise<void> {
  _cache = config;
  _cachedAt = Date.now();

  if (process.env.MONGODB_URI) {
    try {
      const { connectDB, BrandConfigModel } = await import("@/lib/mongodb");
      await connectDB();
      await BrandConfigModel.findOneAndUpdate(
        { key: "brand" },
        { key: "brand", value: config },
        { upsert: true, new: true }
      );
    } catch {
      // MongoDB unavailable — in-memory only for this invocation
    }
  }
}

export function clearBrandConfigCache(): void {
  _cache = null;
  _cachedAt = 0;
}
