import { NextRequest, NextResponse } from "next/server";
import { verifyUserToken, USER_COOKIE } from "@/lib/user-auth";

export async function GET(req: NextRequest) {
  const token = req.cookies.get(USER_COOKIE)?.value;
  const user = await verifyUserToken(token);
  if (!user) return NextResponse.json({ user: null });
  return NextResponse.json({ user: { name: user.name, email: user.email, userId: user.userId } });
}
