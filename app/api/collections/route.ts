import { NextRequest, NextResponse } from "next/server";
import { verifyAdminToken, COOKIE_NAME } from "@/lib/admin-auth";

export const dynamic = "force-dynamic";

// GET /api/collections — list all collections (public)
export async function GET() {
  if (!process.env.MONGODB_URI) return NextResponse.json({ collections: [] });

  try {
    const { connectDB, CollectionModel } = await import("@/lib/mongodb");
    await connectDB();
    const collections = await CollectionModel.find().sort({ createdAt: -1 }).lean();
    return NextResponse.json({ collections });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

// POST /api/collections — create a new collection (admin)
export async function POST(req: NextRequest) {
  const token = req.cookies.get(COOKIE_NAME)?.value;
  if (!(await verifyAdminToken(token))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!process.env.MONGODB_URI) return NextResponse.json({ error: "MongoDB not configured" }, { status: 503 });

  const body = await req.json() as { name: string; slug?: string; description?: string; coverImage?: string; productIds?: string[] };
  if (!body.name) return NextResponse.json({ error: "name required" }, { status: 400 });

  const slug = body.slug ?? body.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

  try {
    const { connectDB, CollectionModel } = await import("@/lib/mongodb");
    await connectDB();
    const col = await CollectionModel.create({
      name: body.name,
      slug,
      description: body.description,
      coverImage: body.coverImage,
      productIds: body.productIds ?? [],
    });
    return NextResponse.json({ ok: true, collection: col });
  } catch (err: unknown) {
    const msg = String(err);
    if (msg.includes("duplicate")) return NextResponse.json({ error: "Slug already exists" }, { status: 409 });
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
