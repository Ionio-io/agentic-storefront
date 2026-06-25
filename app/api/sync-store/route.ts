import { NextRequest, NextResponse } from "next/server";
import { verifyAdminToken, COOKIE_NAME } from "@/lib/admin-auth";

export const dynamic = "force-dynamic";

// GET /api/sync-store — list all sync stores (admin)
export async function GET(req: NextRequest) {
  const token = req.cookies.get(COOKIE_NAME)?.value;
  if (!(await verifyAdminToken(token))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!process.env.MONGODB_URI) return NextResponse.json({ stores: [] });

  try {
    const { connectDB, SyncStoreModel } = await import("@/lib/mongodb");
    await connectDB();
    const stores = await SyncStoreModel.find().sort({ createdAt: -1 }).lean();
    return NextResponse.json({ stores });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

// POST /api/sync-store — add a sync store (admin)
export async function POST(req: NextRequest) {
  const token = req.cookies.get(COOKIE_NAME)?.value;
  if (!(await verifyAdminToken(token))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!process.env.MONGODB_URI) return NextResponse.json({ error: "MongoDB not configured" }, { status: 503 });

  const body = await req.json() as { storeUrl: string; name: string; schedule?: "manual" | "6h" | "12h" | "24h" };
  if (!body.storeUrl || !body.name) return NextResponse.json({ error: "storeUrl and name required" }, { status: 400 });

  try {
    const { connectDB, SyncStoreModel } = await import("@/lib/mongodb");
    await connectDB();
    const store = await SyncStoreModel.create({
      storeUrl: body.storeUrl.trim().replace(/\/+$/, ""),
      name: body.name.trim(),
      schedule: body.schedule ?? "manual",
      enabled: true,
    });
    return NextResponse.json({ ok: true, store });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

// PATCH /api/sync-store — update a store (admin) — body: { id, ...fields }
export async function PATCH(req: NextRequest) {
  const token = req.cookies.get(COOKIE_NAME)?.value;
  if (!(await verifyAdminToken(token))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id, ...update } = await req.json() as { id: string; [key: string]: unknown };
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

  try {
    const { connectDB, SyncStoreModel } = await import("@/lib/mongodb");
    await connectDB();
    const store = await SyncStoreModel.findByIdAndUpdate(id, { $set: update }, { new: true });
    if (!store) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json({ ok: true, store });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

// DELETE /api/sync-store — delete a store (admin) — body: { id }
export async function DELETE(req: NextRequest) {
  const token = req.cookies.get(COOKIE_NAME)?.value;
  if (!(await verifyAdminToken(token))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await req.json() as { id: string };
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

  try {
    const { connectDB, SyncStoreModel } = await import("@/lib/mongodb");
    await connectDB();
    await SyncStoreModel.findByIdAndDelete(id);
    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
