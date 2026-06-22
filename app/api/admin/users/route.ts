import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  if (!process.env.MONGODB_URI) {
    return NextResponse.json({ users: [], total: 0, page: 1, pages: 0, noMongo: true });
  }

  const { searchParams } = new URL(req.url);
  const page   = Math.max(1, parseInt(searchParams.get("page")   ?? "1"));
  const limit  = Math.min(50, parseInt(searchParams.get("limit") ?? "20"));
  const search = searchParams.get("search")?.trim() ?? "";

  try {
    const { connectDB, UserModel } = await import("@/lib/mongodb");
    await connectDB();

    const filter = search
      ? {
          $or: [
            { name:  { $regex: search, $options: "i" } },
            { email: { $regex: search, $options: "i" } },
          ],
        }
      : {};

    const [total, users] = await Promise.all([
      UserModel.countDocuments(filter),
      UserModel.find(filter)
        .select("name email createdAt lastActive conversationCount preferences")
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
    ]);

    return NextResponse.json({
      users,
      total,
      page,
      pages: Math.ceil(total / limit),
    });
  } catch (err) {
    console.error("[admin/users]", err instanceof Error ? err.message : err);
    return NextResponse.json({ users: [], total: 0, page: 1, pages: 0, noMongo: true });
  }
}
