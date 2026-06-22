import { NextRequest, NextResponse } from "next/server";
import { hashPassword, verifyPassword, createUserToken, USER_COOKIE, USER_COOKIE_MAX_AGE } from "@/lib/user-auth";
import { memFindByEmail, memCreate } from "@/lib/mem-store";

export async function POST(req: NextRequest) {
  let body: { name?: string; email?: string; password?: string };
  try { body = await req.json(); }
  catch { return NextResponse.json({ error: "Invalid request" }, { status: 400 }); }

  const { name, email, password } = body;
  if (!name?.trim() || !email?.trim() || !password) {
    return NextResponse.json({ error: "Name, email and password are required" }, { status: 400 });
  }
  if (password.length < 6) {
    return NextResponse.json({ error: "Password must be at least 6 characters" }, { status: 400 });
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: "Invalid email address" }, { status: 400 });
  }

  // Try MongoDB first
  if (process.env.MONGODB_URI) {
    try {
      const { connectDB, UserModel } = await import("@/lib/mongodb");
      await connectDB();

      const exists = await UserModel.findOne({ email: email.toLowerCase() }).lean();
      if (exists) {
        return NextResponse.json({ error: "An account with this email already exists" }, { status: 409 });
      }

      const passwordHash = await hashPassword(password);
      const user = await UserModel.create({
        name: name.trim(),
        email: email.toLowerCase().trim(),
        passwordHash,
      });

      const token = await createUserToken({ userId: String(user._id), email: user.email, name: user.name });
      const res = NextResponse.json({ ok: true, user: { name: user.name, email: user.email } });
      res.cookies.set(USER_COOKIE, token, {
        httpOnly: true, sameSite: "lax", path: "/",
        maxAge: USER_COOKIE_MAX_AGE,
        secure: process.env.NODE_ENV === "production",
      });
      return res;
    } catch (err) {
      console.error("[auth/register] MongoDB error:", err);
      // Fall through to in-memory store
    }
  }

  // In-memory fallback (no MongoDB or connection failed)
  const existing = memFindByEmail(email);
  if (existing) {
    // Check if same password (re-registering same user in-memory)
    const match = await verifyPassword(password, existing.passwordHash);
    if (!match) {
      return NextResponse.json({ error: "An account with this email already exists" }, { status: 409 });
    }
  }

  const passwordHash = await hashPassword(password);
  const user = existing ?? memCreate(name, email, passwordHash);
  const token = await createUserToken({ userId: user._id, email: user.email, name: user.name });

  const res = NextResponse.json({
    ok: true,
    user: { name: user.name, email: user.email },
    warning: "Running without MongoDB — account will reset when the server restarts.",
  });
  res.cookies.set(USER_COOKIE, token, {
    httpOnly: true, sameSite: "lax", path: "/",
    maxAge: USER_COOKIE_MAX_AGE,
    secure: process.env.NODE_ENV === "production",
  });
  return res;
}
