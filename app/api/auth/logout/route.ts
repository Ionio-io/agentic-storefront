import { NextResponse } from "next/server";
import { USER_COOKIE } from "@/lib/user-auth";

export async function POST() {
  const res = NextResponse.json({ ok: true });
  res.cookies.set(USER_COOKIE, "", { maxAge: 0, path: "/" });
  return res;
}
