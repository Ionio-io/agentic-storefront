import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

// ─── In-memory fallback when MongoDB is unavailable ───────────────────────────

interface DemandData {
  viewCount: number;
  cartAddCount: number;
  wishlistCount: number;
  lastReset: number;
}

const memStore = new Map<string, DemandData>();

function getOrCreate(productId: string): DemandData {
  if (!memStore.has(productId)) {
    memStore.set(productId, {
      viewCount: 0, cartAddCount: 0, wishlistCount: 0, lastReset: Date.now(),
    });
  }
  const entry = memStore.get(productId)!;
  // Reset if older than 24h
  if (Date.now() - entry.lastReset > 86_400_000) {
    entry.viewCount = 0;
    entry.cartAddCount = 0;
    entry.wishlistCount = 0;
    entry.lastReset = Date.now();
  }
  return entry;
}

function buildUrgencyLabel(data: DemandData): string | null {
  if (data.cartAddCount >= 20) return `🔥 ${data.cartAddCount}+ added to bag today`;
  if (data.cartAddCount >= 5) return `🔥 ${data.cartAddCount} people added this today`;
  if (data.viewCount >= 50) return `👁 ${data.viewCount}+ people viewing`;
  if (data.wishlistCount >= 10) return `♡ ${data.wishlistCount} people have wishlisted this`;
  return null;
}

// ─── GET /api/demand?productId=X ─────────────────────────────────────────────

export async function GET(req: NextRequest): Promise<NextResponse> {
  const productId = req.nextUrl.searchParams.get("productId");
  if (!productId) return NextResponse.json({ error: "productId required" }, { status: 400 });

  try {
    const { connectDB, DemandSignalModel } = await import("@/lib/mongodb");
    await connectDB();

    let doc = await DemandSignalModel.findOne({ productId }).lean() as DemandData & { lastReset: Date } | null;

    // Reset if older than 24h
    if (doc && Date.now() - new Date(doc.lastReset).getTime() > 86_400_000) {
      await DemandSignalModel.findOneAndUpdate(
        { productId },
        { $set: { viewCount: 0, cartAddCount: 0, wishlistCount: 0, lastReset: new Date() } }
      );
      doc = null;
    }

    const data: DemandData = doc
      ? { viewCount: doc.viewCount, cartAddCount: doc.cartAddCount, wishlistCount: doc.wishlistCount, lastReset: new Date(doc.lastReset).getTime() }
      : { viewCount: 0, cartAddCount: 0, wishlistCount: 0, lastReset: Date.now() };

    return NextResponse.json({ ...data, urgencyLabel: buildUrgencyLabel(data) });
  } catch {
    // Fallback to in-memory
    const data = getOrCreate(productId);
    return NextResponse.json({ ...data, urgencyLabel: buildUrgencyLabel(data) });
  }
}

// ─── POST /api/demand — { productId, action } ─────────────────────────────────

export async function POST(req: NextRequest): Promise<NextResponse> {
  const { productId, action } = (await req.json()) as {
    productId: string;
    action: "view" | "cart" | "wishlist";
  };
  if (!productId || !action) return NextResponse.json({ ok: false }, { status: 400 });

  const inc: Record<string, number> = {};
  if (action === "view")     inc.viewCount = 1;
  if (action === "cart")     inc.cartAddCount = 1;
  if (action === "wishlist") inc.wishlistCount = 1;

  try {
    const { connectDB, DemandSignalModel } = await import("@/lib/mongodb");
    await connectDB();

    const doc = await DemandSignalModel.findOneAndUpdate(
      { productId },
      { $inc: inc, $set: { updatedAt: new Date() }, $setOnInsert: { lastReset: new Date() } },
      { upsert: true, new: true }
    ).lean() as unknown as DemandData & { lastReset: Date };

    return NextResponse.json({ ok: true, urgencyLabel: buildUrgencyLabel({
      ...doc,
      lastReset: new Date(doc.lastReset).getTime(),
    }) });
  } catch {
    // Fallback
    const data = getOrCreate(productId);
    if (action === "view")     data.viewCount++;
    if (action === "cart")     data.cartAddCount++;
    if (action === "wishlist") data.wishlistCount++;
    return NextResponse.json({ ok: true, urgencyLabel: buildUrgencyLabel(data) });
  }
}
