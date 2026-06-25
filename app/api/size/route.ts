import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

interface SizeRequest {
  height: number;
  weight: number;
  bodyShape: "straight" | "pear" | "athletic" | "plus" | "hourglass";
  fitPreference: "fitted" | "regular" | "relaxed";
  productType: string;
  gender?: "female" | "male";
}

interface SizeResult {
  size: string;
  confidence: number;
  explanation: string;
  tips: string[];
  sizeRange?: string;
}

const FEMALE_SIZES = ["XS", "S", "M", "L", "XL", "XXL"];
const MALE_SIZES   = ["XS", "S", "M", "L", "XL", "XXL"];
const BOTTOM_SIZES = ["28", "30", "32", "34", "36", "38", "40"];

function isBottom(productType: string) {
  return /trouser|jean|pant|skirt|palazzo|legging|bottom/i.test(productType);
}

function predictLocal(req: SizeRequest): SizeResult {
  const { height, weight, bodyShape, fitPreference, productType, gender = "female" } = req;

  // Estimate bust/chest and waist in inches from height + weight
  let bust: number, waist: number;

  if (gender === "female") {
    const base = height < 155 ? { b: 30, w: 24, hw: 45 }
                : height < 165 ? { b: 32, w: 26, hw: 50 }
                : height < 173 ? { b: 33, w: 27, hw: 55 }
                               : { b: 34, w: 28, hw: 60 };
    const delta = (weight - base.hw) * 0.38;
    bust  = base.b + delta;
    waist = base.w + delta;

    if (bodyShape === "plus")     { bust += 2; waist += 2; }
    if (bodyShape === "hourglass") waist -= 1.5;
    if (bodyShape === "athletic")  bust  += 1;
    if (bodyShape === "pear")      bust  -= 1;
  } else {
    const base = height < 168 ? { b: 36, w: 30, hw: 60 }
                : height < 175 ? { b: 38, w: 32, hw: 65 }
                : height < 183 ? { b: 40, w: 34, hw: 72 }
                               : { b: 42, w: 36, hw: 82 };
    const delta = (weight - base.hw) * 0.32;
    bust  = base.b + delta;
    waist = base.w + delta;
  }

  const roundBust  = Math.round(bust);
  const roundWaist = Math.round(waist);

  // Map to size
  let size: string;
  let sizes: string[];

  if (isBottom(productType)) {
    sizes = BOTTOM_SIZES;
    if (waist <= 26.5) size = "28";
    else if (waist <= 28.5) size = "30";
    else if (waist <= 30.5) size = "32";
    else if (waist <= 32.5) size = "34";
    else if (waist <= 34.5) size = "36";
    else if (waist <= 36.5) size = "38";
    else size = "40";
  } else if (gender === "female") {
    sizes = FEMALE_SIZES;
    if (bust <= 31.5) size = "XS";
    else if (bust <= 33.5) size = "S";
    else if (bust <= 35.5) size = "M";
    else if (bust <= 37.5) size = "L";
    else if (bust <= 40) size = "XL";
    else size = "XXL";
  } else {
    sizes = MALE_SIZES;
    if (bust <= 37) size = "XS";
    else if (bust <= 39) size = "S";
    else if (bust <= 41) size = "M";
    else if (bust <= 43) size = "L";
    else if (bust <= 45) size = "XL";
    else size = "XXL";
  }

  // Apply fit preference
  const idx = sizes.indexOf(size);
  if (fitPreference === "fitted"  && idx > 0)              size = sizes[idx - 1];
  if (fitPreference === "relaxed" && idx < sizes.length - 1) size = sizes[idx + 1];

  // Build explanation
  const measurement = isBottom(productType)
    ? `waist ~${roundWaist}"`
    : `${gender === "female" ? "bust" : "chest"} ~${roundBust}", waist ~${roundWaist}"`;

  const explanation = `Based on your height (${height} cm) and weight (${weight} kg), your estimated ${measurement}. For ${productType} with a ${fitPreference} fit, we recommend size ${size}.`;

  const tips: string[] = [];
  if (bodyShape === "pear" && !isBottom(productType))
    tips.push("Your hips run wider — consider sizing up on bottoms while keeping this size for tops.");
  else if (bodyShape === "hourglass")
    tips.push("Hourglass figures fit best in stretchy or adjustable waistbands for bottoms.");
  else if (bodyShape === "athletic")
    tips.push("Broad shoulders may need a size up in shirts; take it in at the waist if needed.");

  if (/ethnic|kurta|suit/i.test(productType))
    tips.push("Indian ethnic wear is cut slightly loose — if between sizes, size down for a neater silhouette.");
  else if (/shirt|top|dress/i.test(productType))
    tips.push("Western tops run slightly smaller — if in doubt between two sizes, go up.");

  tips.push(fitPreference === "relaxed"
    ? "You prefer a relaxed fit — this size gives you comfortable room to move."
    : fitPreference === "fitted"
    ? "For a truly fitted look, try both this size and one size up before deciding."
    : "This is a standard size recommendation — works well for most occasions.");

  // Detect borderline (within 0.5" of a boundary)
  let sizeRange: string | undefined;
  const prevSize = sizes[sizes.indexOf(size) - (fitPreference === "fitted" ? 0 : 1)];
  if (Math.abs(bust - Math.round(bust)) < 0.3 && prevSize)
    sizeRange = `${prevSize}–${size}`;

  return { size, confidence: 82, explanation, tips: tips.slice(0, 3), sizeRange };
}

const OPENROUTER_BASE = "https://openrouter.ai/api/v1";

const SIZE_CHARTS = `
INDIAN WOMEN'S ETHNIC WEAR: XS(bust 30-31"), S(32-33"), M(34-35"), L(36-37"), XL(38-40"), XXL(41-43")
WOMEN'S WESTERN WEAR: XS(bust 30-32"), S(32-34"), M(34-36"), L(36-38"), XL(38-40"), XXL(40-43")
MEN'S SHIRTS: XS(chest 36-37"), S(38-39"), M(40-41"), L(42-43"), XL(44-45"), XXL(46-48")
BOTTOMS (waist): 28(26-27"), 30(28-29"), 32(30-31"), 34(32-33"), 36(34-35"), 38(36-37"), 40(38-39")
`;

export async function POST(req: NextRequest): Promise<NextResponse> {
  let body: SizeRequest;
  try {
    body = (await req.json()) as SizeRequest;
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const { height, weight, bodyShape, fitPreference, productType, gender = "female" } = body;

  if (!height || !weight || !bodyShape || !fitPreference || !productType) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  // Try LLM first if API key is available
  if (process.env.OPENROUTER_API_KEY) {
    try {
      const prompt = `You are an Indian fashion sizing expert. Give a size recommendation as JSON only.

Shopper: height=${height}cm, weight=${weight}kg, bodyShape=${bodyShape}, fit=${fitPreference}, gender=${gender}, garment=${productType}

${SIZE_CHARTS}

Return ONLY this JSON (no markdown):
{"size":"M","confidence":85,"explanation":"2-3 sentences with estimated measurements","tips":["tip1","tip2"],"sizeRange":"S-M or omit if not borderline"}`;

      const res = await fetch(`${OPENROUTER_BASE}/chat/completions`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
          "Content-Type": "application/json",
          "HTTP-Referer": process.env.NEXT_PUBLIC_APP_URL ?? "",
          "X-Title": "AI Size Predictor",
        },
        body: JSON.stringify({
          model: "anthropic/claude-sonnet-4-6",
          messages: [{ role: "user", content: prompt }],
          temperature: 0,
          max_tokens: 350,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        const raw: string = data.choices?.[0]?.message?.content ?? "";
        const content = raw.replace(/^```(?:json)?\s*/i, "").replace(/```\s*$/i, "").trim();
        const match = content.match(/\{[\s\S]*\}/);
        if (match) {
          const result = JSON.parse(match[0]) as SizeResult;
          if (result.size && result.explanation) {
            return NextResponse.json(result);
          }
        }
      }
    } catch {
      // fall through to local prediction
    }
  }

  // Algorithmic fallback — always works, no API needed
  return NextResponse.json(predictLocal(body));
}
