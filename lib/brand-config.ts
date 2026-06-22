import { DEFAULT_BRAND, BrandConfig } from "@/data/brand";

// Use global so the cache survives Next.js HMR module reloads in dev mode.
declare global {
  // eslint-disable-next-line no-var
  var _brandCache: BrandConfig | null | undefined;
  // eslint-disable-next-line no-var
  var _brandCachedAt: number | undefined;
}

const TTL_MS = 15_000;

export async function getBrandConfig(): Promise<BrandConfig> {
  const now = Date.now();
  if (global._brandCache && now - (global._brandCachedAt ?? 0) < TTL_MS) {
    return global._brandCache;
  }

  if (process.env.MONGODB_URI) {
    try {
      const { connectDB, BrandConfigModel } = await import("@/lib/mongodb");
      await connectDB();
      const doc = await BrandConfigModel.findOne({ key: "brand" }).lean() as { value?: BrandConfig } | null;
      if (doc?.value) {
        global._brandCache = doc.value as BrandConfig;
        global._brandCachedAt = now;
        return global._brandCache;
      }
    } catch {
      // MongoDB unavailable — fall through to default
    }
  }

  return DEFAULT_BRAND;
}

export async function saveBrandConfig(config: BrandConfig): Promise<void> {
  global._brandCache = config;
  global._brandCachedAt = Date.now();

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
  global._brandCache = null;
  global._brandCachedAt = 0;
}
