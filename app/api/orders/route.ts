import { NextRequest, NextResponse } from "next/server";
import { verifyUserToken, USER_COOKIE } from "@/lib/user-auth";

export const dynamic = "force-dynamic";

function genOrderId() {
  return "WS" + Date.now().toString(36).toUpperCase() + Math.random().toString(36).slice(2, 5).toUpperCase();
}

export async function POST(req: NextRequest) {
  let body: { items: unknown[]; shippingAddress: unknown; total: number };
  try { body = await req.json(); }
  catch { return NextResponse.json({ error: "Invalid request" }, { status: 400 }); }

  const { items, shippingAddress, total } = body;
  if (!items?.length || !shippingAddress || !total) {
    return NextResponse.json({ error: "Missing order details" }, { status: 400 });
  }

  const token = req.cookies.get(USER_COOKIE)?.value;
  const user = await verifyUserToken(token);

  if (!process.env.MONGODB_URI) {
    return NextResponse.json({ error: "Order service unavailable — database not configured" }, { status: 503 });
  }

  try {
    const { connectDB, OrderModel } = await import("@/lib/mongodb");
    await connectDB();

    const orderId = genOrderId();
    const order = await OrderModel.create({
      orderId,
      userId: user?.userId ?? null,
      items,
      shippingAddress,
      total,
      paymentMethod: "COD",
      status: "confirmed",
      createdAt: new Date(),
    });

    return NextResponse.json({ ok: true, orderId: order.orderId });
  } catch (err) {
    console.error("[orders POST]", err);
    return NextResponse.json({ error: "Failed to place order. Please try again." }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  const token = req.cookies.get(USER_COOKIE)?.value;
  const user = await verifyUserToken(token);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  if (!process.env.MONGODB_URI) {
    return NextResponse.json({ orders: [] });
  }

  try {
    const { connectDB, OrderModel } = await import("@/lib/mongodb");
    await connectDB();
    const orders = await OrderModel.find({ userId: user.userId }).sort({ createdAt: -1 }).lean();
    return NextResponse.json({ orders });
  } catch (err) {
    console.error("[orders GET]", err);
    return NextResponse.json({ orders: [] });
  }
}
