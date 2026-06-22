import { DEFAULT_BRAND, BrandConfig } from "@/data/brand";
import fs from "fs";
import path from "path";

// Global cache survives Next.js HMR module reloads in dev
declare global {
  // eslint-disable-next-line no-var
  var _brandCache: BrandConfig | null | undefined;
  // eslint-disable-next-line no-var
  var _brandCachedAt: number | undefined;
}

const TTL_MS = 15_000;

// Local file fallback — persists across server restarts without MongoDB
const OVERRIDE_PATH = path.join(process.cwd(), "data", "brand-override.json");

function readOverrideFile(): BrandConfig | null {
  try {
    return JSON.parse(fs.readFileSync(OVERRIDE_PATH, "utf-8")) as BrandConfig;
  } catch {
    return null;
  }
}

function writeOverrideFile(config: BrandConfig): void {
  try {
    fs.writeFileSync(OVERRIDE_PATH, JSON.stringify(config, null, 2));
  } catch {
    // read-only filesystem (Vercel production) — in-memory cache only
  }
}

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
      // MongoDB unavailable — fall through
    }
  }

  // File-based fallback (local dev without MongoDB, survives restarts)
  const fileConfig = readOverrideFile();
  if (fileConfig) {
    global._brandCache = fileConfig;
    global._brandCachedAt = now;
    return fileConfig;
  }

  return DEFAULT_BRAND;
}

export async function saveBrandConfig(config: BrandConfig): Promise<void> {
  global._brandCache = config;
  global._brandCachedAt = Date.now();

  if (process.env.MONGODB_URI) {
    try {
      const { connectDB, BrandConfigModel } = await import("@/lib/mongodb");
      await connectDB();
      await BrandConfigModel.findOneAndUpdate(
        { key: "brand" },
        { key: "brand", value: config },
        { upsert: true, new: true }
      );
      return;
    } catch {
      // MongoDB unavailable — fall through to file
    }
  }

  // Write to file so config persists across server restarts
  writeOverrideFile(config);
}

export function clearBrandConfigCache(): void {
  global._brandCache = null;
  global._brandCachedAt = 0;
  try { fs.unlinkSync(OVERRIDE_PATH); } catch { /* ignore */ }
}
