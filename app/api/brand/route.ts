import { NextRequest, NextResponse } from "next/server";
import { getBrandConfig, saveBrandConfig, clearBrandConfigCache } from "@/lib/brand-config";
import { verifyAdminToken, COOKIE_NAME } from "@/lib/admin-auth";
import { BrandConfig } from "@/data/brand";

export const dynamic = "force-dynamic";

export async function GET() {
  const config = await getBrandConfig();
  return NextResponse.json(config);
}

export async function POST(req: NextRequest) {
  const token = req.cookies.get(COOKIE_NAME)?.value;
  if (!(await verifyAdminToken(token))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body: BrandConfig = await req.json();

    const required: (keyof BrandConfig)[] = [
      "name", "tagline", "agentName", "agentPersona", "brandDescription",
      "primaryColor", "welcomeMessage",
    ];
    for (const field of required) {
      if (!body[field] || typeof body[field] !== "string") {
        return NextResponse.json({ error: `Missing field: ${field}` }, { status: 400 });
      }
    }

    await saveBrandConfig(body);
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
}

export async function DELETE(req: NextRequest) {
  const token = req.cookies.get(COOKIE_NAME)?.value;
  if (!(await verifyAdminToken(token))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  clearBrandConfigCache();
  return NextResponse.json({ ok: true });
}
