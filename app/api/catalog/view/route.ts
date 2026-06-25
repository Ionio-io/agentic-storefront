import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

// POST /api/catalog/view  { id: string }
// Increments view_count and updates last_viewed_at — no auth required (public endpoint)
export async function POST(req: NextRequest) {
  const { id } = await req.json().catch(() => ({})) as { id?: string };
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

  if (!process.env.MONGODB_URI) return NextResponse.json({ ok: true }); // silent no-op if no DB

  try {
    const { connectDB, ProductModel } = await import("@/lib/mongodb");
    await connectDB();
    await ProductModel.updateOne(
      { id },
      { $inc: { view_count: 1 }, $set: { last_viewed_at: new Date() } }
    );
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: true }); // non-critical — swallow error
  }
}
