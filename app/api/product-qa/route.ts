import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const OPENROUTER_BASE = "https://openrouter.ai/api/v1";

// ─── In-memory cache — avoids regenerating Q&A on every PDP visit ─────────────
interface QAResult {
  questions: string[];
  answers: string[];
}
const qaCache = new Map<string, QAResult>();

export async function POST(req: NextRequest): Promise<NextResponse> {
  const { productId, title, description, productType, tags, vendor } = await req.json() as {
    productId: string;
    title: string;
    description: string;
    productType: string;
    tags: string[];
    vendor?: string;
  };

  if (!productId || !title) {
    return NextResponse.json({ questions: [], answers: [] }, { status: 400 });
  }

  if (qaCache.has(productId)) {
    return NextResponse.json(qaCache.get(productId));
  }

  const tagStr = tags.slice(0, 15).join(", ");
  const isEthnic = /ethnic|kurta|suit|salwar|dupatta|lehenga|saree/i.test(productType + tagStr);
  const isBottom = /trouser|jeans|pant|skirt/i.test(productType + tagStr);
  const isMen = /men|male|shirts|polo|t-shirt/i.test(productType + tagStr);

  const contextHint = isEthnic
    ? "This is an Indian ethnic wear product. Questions about fabric comfort for ceremonies, whether dupatta is included, running small vs large vs Indian ethnic sizing, and occasion suitability are very relevant."
    : isBottom
    ? "This is a bottom wear product. Questions about stretch, waist flexibility, length, and fit through hips/thighs are very relevant."
    : isMen
    ? "This is menswear. Questions about shoulder fit, sleeve length, collar, fabric breathability for Indian weather, and office vs casual use are very relevant."
    : "This is a women's western wear product. Questions about see-through fabric, length, neckline, body type suitability, and styling are very relevant.";

  const prompt = `You are a knowledgeable Indian fashion stylist at ${vendor ?? "this brand"}.

PRODUCT:
Name: ${title}
Type: ${productType}
Description: ${description?.slice(0, 300)}
Tags: ${tagStr}

${contextHint}

Generate exactly 5 specific questions a real buyer would have about THIS product — the exact hesitations that stop someone from purchasing. Make them sound like they were written by real shoppers.

Also write a helpful, accurate answer for each question based on the product details and typical Indian fashion conventions.

Return ONLY a JSON object with this exact structure:
{
  "questions": ["Q1", "Q2", "Q3", "Q4", "Q5"],
  "answers": ["A1", "A2", "A3", "A4", "A5"]
}

Questions should be specific to this product, not generic. No markdown, no preamble.`;

  try {
    const res = await fetch(`${OPENROUTER_BASE}/chat/completions`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "anthropic/claude-sonnet-4-6",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.4,
        max_tokens: 600,
      }),
    });

    if (!res.ok) throw new Error(`OpenRouter ${res.status}`);

    const data = await res.json();
    const content = data.choices?.[0]?.message?.content ?? "{}";

    let result: QAResult;
    try {
      const stripped = content.replace(/^```(?:json)?\s*/i, "").replace(/```\s*$/i, "").trim();
      result = JSON.parse(stripped) as QAResult;
    } catch {
      const match = content.match(/\{[\s\S]*\}/);
      if (match) {
        result = JSON.parse(match[0]) as QAResult;
      } else {
        throw new Error("Parse failed");
      }
    }

    // Validate
    if (!Array.isArray(result.questions) || result.questions.length === 0) {
      throw new Error("Invalid Q&A structure");
    }

    // Cache it
    qaCache.set(productId, result);

    // Limit cache size
    if (qaCache.size > 200) {
      const firstKey = qaCache.keys().next().value;
      if (firstKey) qaCache.delete(firstKey);
    }

    return NextResponse.json(result);
  } catch (err) {
    console.error("[product-qa]", err);
    return NextResponse.json({ questions: [], answers: [] });
  }
}
