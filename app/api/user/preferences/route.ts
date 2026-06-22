import { NextRequest, NextResponse } from "next/server";
import { verifyUserToken, USER_COOKIE } from "@/lib/user-auth";

export async function GET(req: NextRequest) {
  const token = req.cookies.get(USER_COOKIE)?.value;
  const user = await verifyUserToken(token);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { connectDB, UserModel } = await import("@/lib/mongodb");
  await connectDB();

  const dbUser = await UserModel.findById(user.userId).select("preferences name email").lean() as {
    preferences?: { gender?: string; sizes?: string[]; maxBudget?: number };
    name?: string;
    email?: string;
  } | null;
  return NextResponse.json({ preferences: dbUser?.preferences ?? {}, name: dbUser?.name, email: dbUser?.email });
}

export async function PATCH(req: NextRequest) {
  const token = req.cookies.get(USER_COOKIE)?.value;
  const user = await verifyUserToken(token);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let body: { gender?: string; sizes?: string[]; maxBudget?: number };
  try { body = await req.json(); }
  catch { return NextResponse.json({ error: "Invalid request" }, { status: 400 }); }

  const { connectDB, UserModel } = await import("@/lib/mongodb");
  await connectDB();

  const update: Record<string, unknown> = {};
  if (body.gender !== undefined) update["preferences.gender"] = body.gender;
  if (body.sizes !== undefined) update["preferences.sizes"] = body.sizes;
  if (body.maxBudget !== undefined) update["preferences.maxBudget"] = body.maxBudget;

  await UserModel.findByIdAndUpdate(user.userId, { $set: update });
  return NextResponse.json({ ok: true });
}
