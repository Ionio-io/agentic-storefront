import { NextRequest, NextResponse } from "next/server";
import { v4 as uuidv4 } from "uuid";

export const dynamic = "force-dynamic";

const SESSION_COOKIE = "wss-session";
const COOKIE_MAX_AGE = 60 * 60 * 24 * 365; // 1 year

function getOrCreateSessionId(req: NextRequest): { sessionId: string; isNew: boolean } {
  const existing = req.cookies.get(SESSION_COOKIE)?.value;
  if (existing) return { sessionId: existing, isNew: false };
  return { sessionId: uuidv4(), isNew: true };
}

// ─── GET /api/style-profile ──────────────────────────────────────────────────

export async function GET(req: NextRequest): Promise<NextResponse> {
  const { sessionId } = getOrCreateSessionId(req);

  try {
    const { connectDB, StyleProfileModel } = await import("@/lib/mongodb");
    await connectDB();
    const profile = await StyleProfileModel.findOne({ sessionId }).lean();
    return NextResponse.json(profile ?? {});
  } catch {
    return NextResponse.json({});
  }
}

// ─── POST /api/style-profile — upsert profile fields ────────────────────────

export async function POST(req: NextRequest): Promise<NextResponse> {
  const { sessionId, isNew } = getOrCreateSessionId(req);
  const body = await req.json();

  const res = NextResponse.json({ ok: true });

  if (isNew) {
    res.cookies.set(SESSION_COOKIE, sessionId, {
      httpOnly: true,
      sameSite: "lax",
      maxAge: COOKIE_MAX_AGE,
      path: "/",
    });
  }

  try {
    const { connectDB, StyleProfileModel } = await import("@/lib/mongodb");
    await connectDB();

    // Build $set payload from body — only non-null fields
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const set: Record<string, any> = { updatedAt: new Date() };

    if (body.sizeProfile) {
      for (const [k, v] of Object.entries(body.sizeProfile)) {
        if (v != null) set[`sizeProfile.${k}`] = v;
      }
    }
    if (body.stylePreferences) {
      for (const [k, v] of Object.entries(body.stylePreferences)) {
        if (v != null) set[`stylePreferences.${k}`] = v;
      }
    }
    if (body.giftFinderUsed != null) set.giftFinderUsed = body.giftFinderUsed;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const push: Record<string, any> = {};
    if (Array.isArray(body.recentSearches) && body.recentSearches.length > 0) {
      push.recentSearches = {
        $each: body.recentSearches.slice(0, 5),
        $slice: -10,
        $position: 0,
      };
    }
    if (Array.isArray(body.savedProductIds) && body.savedProductIds.length > 0) {
      push.savedProductIds = { $each: body.savedProductIds };
    }
    if (Array.isArray(body.viewedProductIds) && body.viewedProductIds.length > 0) {
      push.viewedProductIds = { $each: body.viewedProductIds.slice(0, 5), $slice: -50 };
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const update: Record<string, any> = { $set: set };
    if (Object.keys(push).length > 0) update.$push = push;

    await StyleProfileModel.findOneAndUpdate(
      { sessionId },
      update,
      { upsert: true }
    );
  } catch { /* DB unavailable — profile saved in localStorage only */ }

  return res;
}

// ─── DELETE /api/style-profile/wishlist — remove product from wishlist ───────

export async function DELETE(req: NextRequest): Promise<NextResponse> {
  const { sessionId } = getOrCreateSessionId(req);
  const { productId } = await req.json() as { productId: string };

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
