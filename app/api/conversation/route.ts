import { NextRequest, NextResponse } from "next/server";
import { verifyUserToken, USER_COOKIE } from "@/lib/user-auth";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const token = req.cookies.get(USER_COOKIE)?.value;
  const user = await verifyUserToken(token);
  if (!user) return NextResponse.json({ messages: [] });

  const { connectDB, ConversationModel } = await import("@/lib/mongodb");
  await connectDB();

  const convo = await ConversationModel.findOne({ userId: user.userId }).lean() as { messages?: unknown[] } | null;
  return NextResponse.json({ messages: convo?.messages ?? [] });
}

export async function DELETE(req: NextRequest) {
  const token = req.cookies.get(USER_COOKIE)?.value;
  const user = await verifyUserToken(token);
  if (!user) return NextResponse.json({ ok: false });

  const { connectDB, ConversationModel } = await import("@/lib/mongodb");
  await connectDB();

  await ConversationModel.deleteOne({ userId: user.userId });
  return NextResponse.json({ ok: true });
}

export async function POST(req: NextRequest) {
  const token = req.cookies.get(USER_COOKIE)?.value;
  const user = await verifyUserToken(token);
  if (!user) return NextResponse.json({ ok: false });

  let body: { messages: Array<{ role: string; content: string; timestamp?: string }> };
  try { body = await req.json(); }
  catch { return NextResponse.json({ error: "Invalid request" }, { status: 400 }); }

  const { connectDB, ConversationModel, UserModel } = await import("@/lib/mongodb");
  await connectDB();

  // findOneAndUpdate returns the ORIGINAL doc (new: false default).
  // If null, this is a brand-new conversation — increment the count once.
  // On subsequent saves (debounced updates), only refresh lastActive.
  const existing = await ConversationModel.findOneAndUpdate(
    { userId: user.userId },
    { messages: body.messages, updatedAt: new Date() },
    { upsert: true, new: false }
  );

  if (!existing) {
    // First time this conversation is saved — count it
    await UserModel.findByIdAndUpdate(user.userId, {
      $inc: { conversationCount: 1 },
      lastActive: new Date(),
    });
  } else {
    // Ongoing conversation — just keep lastActive fresh
    await UserModel.findByIdAndUpdate(user.userId, { lastActive: new Date() });
  }

  return NextResponse.json({ ok: true });
}
