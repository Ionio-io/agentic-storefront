import { NextRequest, NextResponse } from "next/server";
import { searchProducts } from "@/lib/agent-tools";
import { getBrandConfig } from "@/lib/brand-config";

export const dynamic = "force-dynamic";

const OPENROUTER_BASE = "https://openrouter.ai/api/v1";

// Extracts structured search intent from a natural-language query using the LLM,
// then runs the actual search against the catalog.
// POST { query, gender?, max_price? } → { products, understood }
export async function POST(req: NextRequest) {
  const body = await req.json();
  const { query, gender: hintGender } = body as { query: string; gender?: string };

  if (!query?.trim()) return NextResponse.json({ products: [], understood: "" });

  const brandConfig = await getBrandConfig();

  // Step 1: use LLM to extract intent — gender, occasion, price ceiling, product type
  try {
    const res = await fetch(`${OPENROUTER_BASE}/chat/completions`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
        "Content-Type": "application/json",
        "HTTP-Referer": process.env.NEXT_PUBLIC_APP_URL ?? "",
        "X-Title": `${brandConfig.name} Search`,
      },
      body: JSON.stringify({
        model: "openai/gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: `You are a search intent parser for ${brandConfig.name}, an Indian fashion brand.
Catalog: women's ethnic wear (Ethnic Suits), dresses (Dresses), tops (Tops), loungewear (Loungewear), trousers (Trousers);
menswear: shirts (Shirts, Formal Shirts, Casual Shirts, Polo Shirts), T-shirts (T-Shirts), jeans (Jeans), trousers (Trousers), jackets (Jackets).
Prices ₹599–₹3,999. Extract search parameters from the user query.`,
          },
          { role: "user", content: query },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "extract_intent",
              description: "Extract structured search parameters from user query",
              parameters: {
                type: "object",
                properties: {
                  refined_query: {
                    type: "string",
                    description: "Core search keywords — style, colour, fabric. Remove budget/occasion words.",
                  },
                  gender: {
                    type: "string",
                    enum: ["male", "female", "all"],
                    description: "Infer from context. Default 'all' if ambiguous.",
                  },
                  max_price: {
                    type: "number",
                    description: "Budget ceiling in INR only if explicitly stated.",
                  },
                  occasion: {
                    type: "string",
                    enum: ["casual", "office", "festive", "wedding", "party", "daily", "any"],
                  },
                  product_type: {
                    type: "string",
                    description: "Match exactly: Dresses, Tops, Trousers, Ethnic Suits, Shirts, T-Shirts, Jeans, Jackets, Loungewear, Polo Shirts. Omit if not clearly stated.",
                  },
                  understood: {
                    type: "string",
                    description: "One sentence: what you understood the shopper wants, e.g. 'Showing festive ethnic sets for women under ₹3,000'",
                  },
                },
                required: ["refined_query", "gender", "understood"],
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "extract_intent" } },
        max_tokens: 250,
        temperature: 0,
      }),
    });

    if (res.ok) {
      const data = await res.json();
      const call = data.choices?.[0]?.message?.tool_calls?.[0];
      if (call?.function?.arguments) {
        const args = JSON.parse(call.function.arguments);
        // LLM-detected gender wins — only use hintGender when LLM couldn't determine one
        const resolvedGender = (args.gender && args.gender !== "all") ? args.gender : (hintGender ?? "all");
        const products = await searchProducts({
          query: args.refined_query,
          gender: resolvedGender,
          max_price: args.max_price,
          occasion: args.occasion,
          product_type: args.product_type,
          limit: 20,
        });
        return NextResponse.json({ products, understood: args.understood });
      }
    }
  } catch { /* fall through to keyword search */ }

  // Fallback: plain keyword search across all products
  const products = await searchProducts({ query, gender: "all", limit: 20 });
  return NextResponse.json({ products, understood: `Showing results for "${query}"` });
}
