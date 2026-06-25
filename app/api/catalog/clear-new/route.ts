import { NextRequest, NextResponse } from "next/server";
import { verifyAdminToken, COOKIE_NAME } from "@/lib/admin-auth";

export const dynamic = "force-dynamic";

// POST /api/catalog/clear-new
// Body: { ids?: string[] }  — if omitted, clears ALL is_new flags
export async function POST(req: NextRequest) {
  const token = req.cookies.get(COOKIE_NAME)?.value;
  if (!(await verifyAdminToken(token))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!process.env.MONGODB_URI) return NextResponse.json({ error: "MongoDB not configured" }, { status: 503 });

  const body = await req.json().catch(() => ({})) as { ids?: string[] };
  const filter = body.ids?.length ? { id: { $in: body.ids } } : {};

  try {
    const { connectDB, ProductModel } = await import("@/lib/mongodb");
    await connectDB();
    const result = await ProductModel.updateMany(filter, { $set: { is_new: false } });
    return NextResponse.json({ ok: true, modified: result.modifiedCount });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
