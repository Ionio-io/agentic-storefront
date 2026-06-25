import { NextRequest, NextResponse } from "next/server";

const OPENROUTER_BASE = "https://openrouter.ai/api/v1";
const MODEL = "anthropic/claude-sonnet-4-6";

export async function POST(req: NextRequest) {
  const { userMessage, assistantMessage } = await req.json() as {
    userMessage: string;
    assistantMessage: string;
  };

  try {
    const res = await fetch(`${OPENROUTER_BASE}/chat/completions`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: MODEL,
        messages: [
          {
            role: "system",
            content: `You generate short follow-up question chips for a fashion shopping chat. Given what the shopper asked and what the stylist replied, suggest exactly 3 follow-up questions the shopper might ask next.

Rules:
- Each question must be 4–7 words max
- Make them specific to what was just discussed (products shown, occasion, style, budget)
- Vary them: one about the items shown, one about styling/pairing, one about alternatives or price
- Use natural shopper language (not formal)
- Return ONLY a raw JSON array, no explanation: ["question 1", "question 2", "question 3"]`,
          },
          {
            role: "user",
            content: `Shopper: "${userMessage}"\n\nStylist: "${assistantMessage.slice(0, 400)}"`,
          },
        ],
        temperature: 0.85,
        max_tokens: 80,
      }),
    });

    if (!res.ok) return NextResponse.json({ suggestions: [] });

    const data = await res.json() as { choices?: Array<{ message?: { content?: string } }> };
    const raw = data.choices?.[0]?.message?.content ?? "[]";
    const content = raw.replace(/^```(?:json)?\s*/i, "").replace(/```\s*$/i, "").trim();

    const parsed = JSON.parse(content);
    if (Array.isArray(parsed) && parsed.length > 0) {
      return NextResponse.json({ suggestions: (parsed as string[]).slice(0, 3) });
    }
  } catch { /* fall through */ }

  return NextResponse.json({ suggestions: [] });
}
