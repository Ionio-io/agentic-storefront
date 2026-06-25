import { NextRequest, NextResponse } from "next/server";
import { verifyAdminToken, COOKIE_NAME } from "@/lib/admin-auth";

export const dynamic = "force-dynamic";

// GET /api/collections/[slug] — fetch collection + its products (public)
export async function GET(_req: NextRequest, { params }: { params: { slug: string } }) {
  const { slug } = params;
  if (!process.env.MONGODB_URI) return NextResponse.json({ error: "Not found" }, { status: 404 });

  try {
    const { connectDB, CollectionModel, ProductModel } = await import("@/lib/mongodb");
    await connectDB();
    const col = await CollectionModel.findOne({ slug }).lean() as { productIds?: string[]; [key: string]: unknown } | null;
    if (!col) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const products = await ProductModel.find({ id: { $in: col.productIds ?? [] } }).lean();
    return NextResponse.json({ collection: col, products });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

// PATCH /api/collections/[slug] — update collection (admin)
export async function PATCH(req: NextRequest, { params }: { params: { slug: string } }) {
  const token = req.cookies.get(COOKIE_NAME)?.value;
  if (!(await verifyAdminToken(token))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!process.env.MONGODB_URI) return NextResponse.json({ error: "MongoDB not configured" }, { status: 503 });

  const body = await req.json();
  try {
    const { connectDB, CollectionModel } = await import("@/lib/mongodb");
    await connectDB();
    const col = await CollectionModel.findOneAndUpdate(
      { slug: params.slug },
      { $set: body },
      { new: true }
    );
    if (!col) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json({ ok: true, collection: col });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

// DELETE /api/collections/[slug] — delete collection (admin)
export async function DELETE(req: NextRequest, { params }: { params: { slug: string } }) {
  const token = req.cookies.get(COOKIE_NAME)?.value;
  if (!(await verifyAdminToken(token))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!process.env.MONGODB_URI) return NextResponse.json({ error: "MongoDB not configured" }, { status: 503 });

  try {
    const { connectDB, CollectionModel } = await import("@/lib/mongodb");
    await connectDB();
    await CollectionModel.deleteOne({ slug: params.slug });
    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
