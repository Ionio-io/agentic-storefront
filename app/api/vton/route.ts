import { NextRequest, NextResponse } from "next/server";
import { runVTON, mapVtonCategory } from "@/lib/vton";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { garment_image_url, person_image_url, vton_category } = body;

    if (!garment_image_url || !person_image_url) {
      return NextResponse.json(
        { error: "garment_image_url and person_image_url are required" },
        { status: 400 }
      );
    }

    const cloth_type = mapVtonCategory(vton_category ?? "upper");

    const result_url = await runVTON({
      human_image_url: person_image_url,
      garment_image_url: garment_image_url,
      cloth_type,
    });

    return NextResponse.json({ result_url });
  } catch (err) {
    console.error("VTON error:", err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
