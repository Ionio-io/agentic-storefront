import { NextRequest } from "next/server";
import { TOOL_DEFINITIONS, executeToolCall } from "@/lib/agent-tools";
import { getBrandConfig } from "@/lib/brand-config";
import { verifyUserToken, USER_COOKIE } from "@/lib/user-auth";
import { Product } from "@/types";

const OPENROUTER_BASE = "https://openrouter.ai/api/v1";
const MODEL = "openai/gpt-4o-mini";
const VISION_MODEL = "openai/gpt-4o-mini";

function buildSystemPrompt(
  cfg: Awaited<ReturnType<typeof getBrandConfig>>,
  userPrefs?: { gender?: string; sizes?: string[]; maxBudget?: number; name?: string }
): string {
  const prefLines = userPrefs
    ? [
        userPrefs.name && `Shopper's name: ${userPrefs.name}`,
        userPrefs.gender && userPrefs.gender !== "all" && `Default gender section: ${userPrefs.gender}`,
        userPrefs.sizes?.length && `Preferred sizes: ${userPrefs.sizes.join(", ")}`,
        userPrefs.maxBudget && `Budget ceiling: ₹${userPrefs.maxBudget}`,
      ].filter(Boolean).join("\n")
    : "";

  return `You are ${cfg.agentName}, the personal AI stylist for ${cfg.name} — ${cfg.tagline}.

${cfg.agentPersona}

BRAND:
${cfg.brandDescription}
${prefLines ? `\nSHOPPER PROFILE:\n${prefLines}\nApply these as defaults for every tool call unless the shopper explicitly overrides them.` : ""}

TOOL SELECTION — call tools in this priority order:
1. search_products — any request for clothing, outfits, or styles. Always include gender, max_price, occasion, and product_type when the shopper mentions them.
2. build_outfit — shopper wants "a complete look", "what goes with this", or outfit ideas around a specific piece. Call with a product id or description.
3. get_similar_products — "show more like this", "other options", "alternatives". Call with the current product type and price range.
4. filter_by_size — shopper mentions their size or asks what's available in a specific size.

RESPONSE RULES:
- ALWAYS call a tool before responding to any product-related question. NEVER fabricate or describe products not returned by a tool call.
- Product cards render automatically in the UI from tool results. Do NOT repeat product names, prices, sizes, or URLs in your text.
- After tool results, write 1–2 natural, conversational sentences. Vary your phrasing — never open two consecutive messages the same way.
- Speak like a knowledgeable stylist who genuinely cares, not a search engine. "This kurta would look stunning for a Diwali evening" beats "Here are some kurtas."
- After showing products, naturally progress the conversation: invite virtual try-on ("You can try any of these on — just tap Try On"), ask about sizing or occasion, or offer to build a complete look.
- If an image is sent: briefly describe what you observe (style, color, occasion cues) then immediately call search_products with relevant descriptors.
- For virtual try-on awareness: the shopper can try any product on themselves using AI — you know this capability exists and should mention it naturally once per session when showing products.
- If asked about returns, shipping, or store policies: say "For order support, please reach out to the ${cfg.name} team directly" and redirect to shopping.
- If asked anything outside fashion and shopping: gently redirect. "I'm your stylist here — let me help you find something perfect instead."
- Understand Indian fashion occasions fluently: weddings (bridal, guest), Diwali, Eid, Holi, office formals, corporate casuals, date night, loungewear. Budget is always INR (₹).
- Never include raw URLs, JSON, image paths, or CDN links in your text response.
- Never start responses with filler: "Certainly", "Of course", "Sure", "Absolutely", "Great choice", "Awesome". Start with substance.
- If a tool returns zero results: say so honestly and suggest broadening the search ("I didn't find an exact match — want me to search a wider range?").`;
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { messages, imageBase64, imageQuery } = body as {
    messages: Array<{ role: string; content: string }>;
    imageBase64?: string;
    imageQuery?: string;
  };

  // Load user preferences if logged in
  let userPrefs: { gender?: string; sizes?: string[]; maxBudget?: number; name?: string } | undefined;
  const token = req.cookies.get(USER_COOKIE)?.value;
  const user = await verifyUserToken(token);
  if (user) {
    try {
      const { connectDB, UserModel } = await import("@/lib/mongodb");
      await connectDB();
      const dbUser = await UserModel.findById(user.userId).select("preferences name").lean() as {
        preferences?: { gender?: string; sizes?: string[]; maxBudget?: number };
        name?: string;
      } | null;
      if (dbUser) {
        userPrefs = { ...dbUser.preferences, name: dbUser.name };
      }
    } catch {/* DB unavailable — skip prefs */}
  }

  const brandConfig = await getBrandConfig();
  const systemPrompt = buildSystemPrompt(brandConfig, userPrefs);

  const encoder = new TextEncoder();
  const stream = new TransformStream();
  const writer = stream.writable.getWriter();

  const write = (obj: object) =>
    writer.write(encoder.encode(`data: ${JSON.stringify(obj)}\n\n`));

  (async () => {
    try {
      // Build history; inject image as vision message if provided
      const baseMessages = imageBase64
        ? [
            ...messages.slice(0, -1),
            {
              role: "user",
              content: [
                { type: "text", text: imageQuery ?? "Find products similar to this image" },
                { type: "image_url", image_url: { url: `data:image/jpeg;base64,${imageBase64}` } },
              ],
            },
          ]
        : messages;

      const history: Array<Record<string, unknown>> = [
        { role: "system", content: systemPrompt },
        ...baseMessages,
      ];

      // Agentic loop — runs until the model stops requesting tools
      let maxIterations = 6;

      while (maxIterations-- > 0) {
        const res = await fetch(`${OPENROUTER_BASE}/chat/completions`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
            "Content-Type": "application/json",
            "HTTP-Referer": process.env.NEXT_PUBLIC_APP_URL ?? "https://westside-storefront.demo",
            "X-Title": `${brandConfig.name} AI Storefront`,
          },
          body: JSON.stringify({
            model: imageBase64 ? VISION_MODEL : MODEL,
            messages: history,
            tools: TOOL_DEFINITIONS,
            tool_choice: "auto",
            stream: true,
            temperature: 0.7,
            max_tokens: 600,
          }),
        });

        if (!res.ok || !res.body) {
          await write({ type: "error", content: "Agent unavailable. Please try again." });
          break;
        }

        const reader = res.body.getReader();
        const dec = new TextDecoder();
        let buffer = "";

        let assistantText = "";
        const toolCalls: Record<number, { id: string; name: string; args: string }> = {};
        let finishReason = "";

        // Stream the response, accumulate tool calls and text
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += dec.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() ?? "";

          for (const line of lines) {
            if (!line.startsWith("data: ")) continue;
            const raw = line.slice(6).trim();
            if (raw === "[DONE]") {
              finishReason = finishReason || "stop";
              continue;
            }

            let chunk: Record<string, unknown>;
            try {
              chunk = JSON.parse(raw);
            } catch {
              continue;
            }

            const choice = (chunk.choices as Array<Record<string, unknown>>)?.[0];
            if (!choice) continue;

            if (choice.finish_reason) {
              finishReason = choice.finish_reason as string;
            }

            const delta = choice.delta as Record<string, unknown> | undefined;
            if (!delta) continue;

            // Stream text tokens to client
            if (delta.content) {
              assistantText += delta.content as string;
              await write({ type: "text", content: delta.content });
            }

            // Accumulate streaming tool call arguments
            if (delta.tool_calls) {
              for (const tc of delta.tool_calls as Array<Record<string, unknown>>) {
                const idx = tc.index as number;
                if (!toolCalls[idx]) {
                  toolCalls[idx] = { id: "", name: "", args: "" };
                }
                if (tc.id) toolCalls[idx].id = tc.id as string;
                const fn = tc.function as Record<string, string> | undefined;
                if (fn?.name) toolCalls[idx].name = fn.name;
                if (fn?.arguments) toolCalls[idx].args += fn.arguments;
              }
            }
          }
        }

        const calls = Object.values(toolCalls);

        // No tool calls — model is done
        if (calls.length === 0) break;

        // Push assistant turn with tool_calls into history
        history.push({
          role: "assistant",
          content: assistantText || null,
          tool_calls: calls.map((c) => ({
            id: c.id,
            type: "function",
            function: { name: c.name, arguments: c.args },
          })),
        });

        // Execute each tool call and push results back
        for (const call of calls) {
          let args: unknown = {};
          try {
            args = JSON.parse(call.args);
          } catch {
            /* malformed args — use empty object */
          }

          const products: Product[] = await executeToolCall(call.name, args);

          // Emit product cards to the client
          if (products.length > 0) {
            await write({ type: "products", products, tool: call.name });
          }

          // Tool result for the model (lightweight — no image_urls to keep context small)
          history.push({
            role: "tool",
            tool_call_id: call.id,
            content: JSON.stringify(
              products.slice(0, 6).map((p) => ({
                id: p.id,
                title: p.title,
                price: p.price,
                product_type: p.product_type,
                gender: p.gender,
                sizes: p.sizes,
                vton_category: p.vton_category,
                description: p.description?.slice(0, 120),
              }))
            ),
          });
        }

        // If the model explicitly stopped (not tool_calls), exit the loop
        if (finishReason === "stop") break;
      }

      await write({ type: "done" });
    } catch (err) {
      console.error("[agent]", err);
      await write({ type: "error", content: "Something went wrong. Please try again." });
    } finally {
      await writer.close();
    }
  })();

  return new Response(stream.readable, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
