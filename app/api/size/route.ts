import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const OPENROUTER_BASE = "https://openrouter.ai/api/v1";

// ─── Indian garment size charts ───────────────────────────────────────────────

const SIZE_CHARTS = `
INDIAN WOMEN'S ETHNIC WEAR (Ethnic Suits, Kurtas, Kurtis):
XS: bust 30–31", waist 25–26", hips 34–35"
S:  bust 32–33", waist 26–28", hips 36–37"
M:  bust 34–35", waist 28–30", hips 38–39"
L:  bust 36–37", waist 30–32", hips 40–41"
XL: bust 38–40", waist 32–34", hips 42–44"
XXL: bust 41–43", waist 35–37", hips 45–47"
Note: Indian ethnic wear is cut slightly loose — if between sizes, go down one.

WOMEN'S WESTERN WEAR (Tops, T-Shirts, Dresses):
XS: bust 30–32", waist 24–26"
S:  bust 32–34", waist 26–28"
M:  bust 34–36", waist 28–30"
L:  bust 36–38", waist 30–32"
XL: bust 38–40", waist 32–34"
XXL: bust 40–43", waist 34–37"
Note: Western tops run slightly small — if between sizes, size up.

WOMEN'S BOTTOMS / TROUSERS (waist in inches):
28: waist 26–27"
30: waist 28–29"
32: waist 30–31"
34: waist 32–33"
36: waist 34–35"
38: waist 36–37"
40: waist 38–39"
Note: Denim waistband sits 1" tight — size up if in doubt.

MEN'S SHIRTS (Indian sizing runs slightly smaller than Western):
XS: chest 36–37"
S:  chest 38–39"
M:  chest 40–41"
L:  chest 42–43"
XL: chest 44–45"
XXL: chest 46–48"
Note: Indian shirts have shorter sleeves; order up if you have broad shoulders.

MEN'S TROUSERS (waist in inches, similar to Western):
28: waist 27–28"
30: waist 29–30"
32: waist 31–32"
34: waist 33–34"
36: waist 35–36"
38: waist 37–38"
40: waist 39–40"
`;

// ─── Body shape → measurement estimation logic (embedded in prompt) ───────────

const BODY_ESTIMATION_GUIDANCE = `
When estimating measurements from height, weight, and body shape:

For WOMEN:
- Height 145–155cm, Weight 45–55kg → typically bust 32–34", waist 25–27", hips 35–37"
- Height 155–165cm, Weight 50–60kg → typically bust 33–35", waist 26–28", hips 36–38"
- Height 155–165cm, Weight 60–70kg → typically bust 35–37", waist 29–32", hips 38–41"
- Height 155–165cm, Weight 70–80kg → typically bust 37–40", waist 32–35", hips 41–44"
- Height 165–175cm, Weight 55–65kg → typically bust 34–36", waist 27–30", hips 37–40"
- Height 165–175cm, Weight 65–80kg → typically bust 36–39", waist 30–34", hips 40–43"

Body shape modifiers:
- PEAR: hips 2–4" larger than bust; size by hips for bottoms, bust for tops
- HOURGLASS: bust and hips roughly equal, waist 10–12" smaller; size by bust/hips
- ATHLETIC: shoulders broad, hips narrow; size by shoulders/chest
- PLUS: all measurements scale up proportionally; prefer ethnic runs-large sizing
- STRAIGHT: bust/waist/hips within 2" of each other; standard sizing applies

For MEN:
- Height 160–168cm, Weight 55–65kg → typically chest 36–38", waist 30–32"
- Height 168–175cm, Weight 65–75kg → typically chest 38–40", waist 32–34"
- Height 175–183cm, Weight 70–85kg → typically chest 40–42", waist 34–36"
- Height 183–190cm, Weight 80–95kg → typically chest 42–44", waist 36–38"

Fit preference modifier:
- FITTED: subtract 1 size from the standard recommendation
- REGULAR: use the standard recommendation
- RELAXED: add 1 size to the standard recommendation (but not beyond XXL/40)
`;

interface SizeRequest {
  height: number;
  weight: number;
  age?: number;
  bodyShape: "straight" | "pear" | "athletic" | "plus" | "hourglass";
  fitPreference: "fitted" | "regular" | "relaxed";
  productType: string;
  gender?: "female" | "male";
}

interface SizeResult {
  size: string;
  confidence: number;  // 0-100
  explanation: string;
  tips: string[];
  sizeRange?: string;  // e.g. "Between S and M"
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    const body = (await req.json()) as SizeRequest;
    const { height, weight, bodyShape, fitPreference, productType, gender = "female" } = body;

    if (!height || !weight || !bodyShape || !fitPreference || !productType) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const prompt = `You are a precise Indian fashion sizing expert. A shopper needs a size recommendation.

SHOPPER DETAILS:
- Height: ${height}cm
- Weight: ${weight}kg
- Body Shape: ${bodyShape}
- Fit Preference: ${fitPreference}
- Gender: ${gender}
- Garment Category: ${productType}

${BODY_ESTIMATION_GUIDANCE}

${SIZE_CHARTS}

TASK:
1. Estimate the shopper's approximate chest/bust, waist, and hip measurements from their height, weight, and body shape using the guidance above.
2. Apply the fit preference modifier.
3. Map to the correct size for the garment category.
4. Return a JSON object with exactly these fields:
{
  "size": "M",               // single size label (XS/S/M/L/XL/XXL or 28/30/32/34/36/38/40)
  "confidence": 85,          // 0-100 — how confident you are (lower if borderline)
  "explanation": "...",      // 2-3 sentences explaining WHY this size. Mention estimated measurements. Be specific.
  "tips": ["...", "..."],    // 2-3 practical tips for this shopper for this garment type
  "sizeRange": "S-M"        // only if borderline between two sizes; omit otherwise
}

Be specific and helpful. Mention the estimated measurements in your explanation. Focus on Indian sizing conventions.
Respond with ONLY the JSON object, no markdown, no preamble.`;

    const res = await fetch(`${OPENROUTER_BASE}/chat/completions`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "openai/gpt-4o-mini",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.1,
        max_tokens: 400,
      }),
    });

    if (!res.ok) {
      throw new Error(`OpenRouter ${res.status}`);
    }

    const data = await res.json();
    const content = data.choices?.[0]?.message?.content ?? "{}";

    let result: SizeResult;
    try {
      result = JSON.parse(content) as SizeResult;
    } catch {
      // Try to extract JSON from response
      const match = content.match(/\{[\s\S]*\}/);
      if (match) {
        result = JSON.parse(match[0]) as SizeResult;
      } else {
        throw new Error("Failed to parse size recommendation");
      }
    }

    return NextResponse.json(result);
  } catch (err) {
    console.error("[size]", err);
    return NextResponse.json(
      { error: "Size prediction unavailable. Please use our size guide." },
      { status: 500 }
    );
  }
}
