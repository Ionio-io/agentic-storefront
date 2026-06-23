import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const SESSION_COOKIE = "wss-session";

function getSessionId(req: NextRequest): string | null {
  return req.cookies.get(SESSION_COOKIE)?.value ?? null;
}

// GET /api/wishlist — returns array of product IDs
export async function GET(req: NextRequest): Promise<NextResponse> {
  const sessionId = getSessionId(req);
  if (!sessionId) return NextResponse.json({ productIds: [] });

  try {
    const { connectDB, StyleProfileModel } = await import("@/lib/mongodb");
    await connectDB();
    const profile = await StyleProfileModel.findOne({ sessionId }, { savedProductIds: 1 }).lean() as
      { savedProductIds?: string[] } | null;
    return NextResponse.json({ productIds: profile?.savedProductIds ?? [] });
  } catch {
    return NextResponse.json({ productIds: [] });
  }
}

// POST /api/wishlist — { productId } — toggle add
export async function POST(req: NextRequest): Promise<NextResponse> {
  const sessionId = getSessionId(req);
  const { productId } = (await req.json()) as { productId: string };
  if (!productId) return NextResponse.json({ ok: false }, { status: 400 });

  try {
    const { connectDB, StyleProfileModel, DemandSignalModel } = await import("@/lib/mongodb");
    await connectDB();
    await StyleProfileModel.findOneAndUpdate(
      { sessionId: sessionId ?? productId },
      { $addToSet: { savedProductIds: productId } },
      { upsert: true }
    );
    // Increment wishlist demand signal
    await DemandSignalModel.findOneAndUpdate(
      { productId },
      { $inc: { wishlistCount: 1 }, $set: { updatedAt: new Date() }, $setOnInsert: { lastReset: new Date() } },
      { upsert: true }
    );
  } catch { /* ignore */ }

  return NextResponse.json({ ok: true });
}

// DELETE /api/wishlist — { productId } — remove
export async function DELETE(req: NextRequest): Promise<NextResponse> {
  const sessionId = getSessionId(req);
  const { productId } = (await req.json()) as { productId: string };
  if (!productId || !sessionId) return NextResponse.json({ ok: false }, { status: 400 });

  try {
    const { connectDB, StyleProfileModel } = await import("@/lib/mongodb");
    await connectDB();
    await StyleProfileModel.findOneAndUpdate(
      { sessionId },
      { $pull: { savedProductIds: productId } }
    );
  } catch { /* ignore */ }

  return NextResponse.json({ ok: true });
}
