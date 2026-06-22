import { NextRequest, NextResponse } from "next/server";
import { verifyPassword, createUserToken, USER_COOKIE, USER_COOKIE_MAX_AGE } from "@/lib/user-auth";

export async function POST(req: NextRequest) {
  if (!process.env.MONGODB_URI) {
    return NextResponse.json(
      { error: "User accounts require MongoDB. Set MONGODB_URI in your environment." },
      { status: 503 }
    );
  }

  let body: { email?: string; password?: string };
  try { body = await req.json(); }
  catch { return NextResponse.json({ error: "Invalid request" }, { status: 400 }); }

  const { email, password } = body;
  if (!email || !password) {
    return NextResponse.json({ error: "Email and password are required" }, { status: 400 });
  }

  try {
    const { connectDB, UserModel } = await import("@/lib/mongodb");
    await connectDB();

    const user = await UserModel.findOne({ email: email.toLowerCase() });
    if (!user) {
      return NextResponse.json({ error: "Invalid email or password" }, { status: 401 });
    }

    const valid = await verifyPassword(password, user.passwordHash);
    if (!valid) {
      return NextResponse.json({ error: "Invalid email or password" }, { status: 401 });
    }

    // Update lastActive
    user.lastActive = new Date();
    await user.save();

    const token = await createUserToken({
      userId: String(user._id),
      email: user.email,
      name: user.name,
    });

    const res = NextResponse.json({
      ok: true,
      user: { name: user.name, email: user.email },
    });
    res.cookies.set(USER_COOKIE, token, {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      maxAge: USER_COOKIE_MAX_AGE,
      secure: process.env.NODE_ENV === "production",
    });
    return res;
  } catch (err) {
    console.error("[auth/login]", err);
    return NextResponse.json({ error: "Login failed. Please try again." }, { status: 500 });
  }
}
