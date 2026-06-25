import { NextRequest, NextResponse } from "next/server";
import { verifyAdminToken, COOKIE_NAME } from "@/lib/admin-auth";

export const dynamic = "force-dynamic";

export async function PATCH(req: NextRequest) {
  const token = req.cookies.get(COOKIE_NAME)?.value;
  if (!(await verifyAdminToken(token))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { ids, update } = await req.json() as { ids: string[]; update: Record<string, unknown> };
  if (!ids?.length || !update) return NextResponse.json({ error: "ids and update required" }, { status: 400 });

  if (!process.env.MONGODB_URI) return NextResponse.json({ error: "MongoDB not configured" }, { status: 503 });

  try {
    const { connectDB, ProductModel } = await import("@/lib/mongodb");
    await connectDB();
    const result = await ProductModel.updateMany({ id: { $in: ids } }, { $set: update });
    return NextResponse.json({ ok: true, modified: result.modifiedCount });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
