import { NextRequest } from "next/server";
import { TOOL_DEFINITIONS, executeToolCall } from "@/lib/agent-tools";
import { getBrandConfig } from "@/lib/brand-config";
import { verifyUserToken, USER_COOKIE } from "@/lib/user-auth";
import { getOccasionAgentContext } from "@/lib/occasions";
import { Product } from "@/types";

const OPENROUTER_BASE = "https://openrouter.ai/api/v1";
const MODEL = "openai/gpt-4o-mini";
const VISION_MODEL = "openai/gpt-4o-mini";

// ─── Context types ─────────────────────────────────────────────────────────────

interface UserPrefs {
  gender?: string;
  sizes?: string[];
  maxBudget?: number;
  name?: string;
}

interface RichContext {
  userPrefs?: UserPrefs;
  styleMemory?: string;       // from lib/style-memory buildProfileAgentContext()
  behaviorContext?: string;   // from lib/behavior-tracker buildAgentContext()
  wishlistIds?: string[];
  isGiftMode?: boolean;
  giftContext?: string;
}

// ─── System prompt builder ─────────────────────────────────────────────────────

function buildSystemPrompt(
  cfg: Awaited<ReturnType<typeof getBrandConfig>>,
  ctx: RichContext
): string {
  const { userPrefs, styleMemory, behaviorContext, wishlistIds, isGiftMode, giftContext } = ctx;

  // User profile from DB (logged-in users)
  const prefLines = userPrefs
    ? [
        userPrefs.name && `Shopper's name: ${userPrefs.name}`,
        userPrefs.gender && userPrefs.gender !== "all" && `Default gender section: ${userPrefs.gender}`,
        userPrefs.sizes?.length && `Preferred sizes: ${userPrefs.sizes.join(", ")}`,
        userPrefs.maxBudget && `Budget ceiling: ₹${userPrefs.maxBudget}`,
      ].filter(Boolean).join("\n")
    : "";

  // Seasonal / festival context
  const seasonalCtx = getOccasionAgentContext();

  // Wishlist context
  const wishlistCtx = wishlistIds?.length
    ? `WISHLIST: Shopper has ${wishlistIds.length} saved item${wishlistIds.length === 1 ? "" : "s"} (IDs: ${wishlistIds.join(", ")}). When they mention their wishlist or ask to build outfits from saved items, call get_wishlist_products with these IDs.`
    : "";

  // Gift mode
  const giftCtx = isGiftMode
    ? `GIFT MODE ACTIVE: ${giftContext ?? "Shopper is buying for someone else."} Prioritise complete sets, statement pieces, and items with wide size availability (XS–XXL or 28–40). Suggest gift wrapping at the end naturally.`
    : "";

  const contextBlock = [prefLines, styleMemory, behaviorContext, seasonalCtx, wishlistCtx, giftCtx]
    .filter(Boolean)
    .join("\n\n");

  return `You are ${cfg.agentName}, the personal AI stylist for ${cfg.name} — ${cfg.tagline}.

${cfg.agentPersona}

BRAND:
${cfg.brandDescription}
${contextBlock ? `\n--- SHOPPER CONTEXT ---\n${contextBlock}\n--- END CONTEXT ---\n` : ""}
TOOL SELECTION — call tools in this priority order:
1. search_products — any request for clothing, outfits, or styles. Always include gender, max_price, occasion, and product_type when the shopper mentions them.
2. build_outfit — shopper wants "a complete look", "what goes with this", or outfit ideas around a specific piece.
3. get_similar_products — "show more like this", "other options", "alternatives".
4. filter_by_size — shopper mentions their size or asks what's available in a specific size.
5. get_wishlist_products — shopper asks about their wishlist, saved items, or to build looks from saved pieces.

RESPONSE RULES:
- ALWAYS call a tool before responding to any product-related question. NEVER fabricate or describe products not returned by a tool call.
- Product cards render automatically in the UI from tool results. Do NOT repeat product names, prices, sizes, or URLs in your text.
- After tool results, write 1–2 natural, conversational sentences. Vary your phrasing — never open two consecutive messages the same way.
- Speak like a knowledgeable stylist who genuinely cares. "This kurta would look stunning for Diwali" beats "Here are some kurtas."
- After showing products, naturally progress: invite virtual try-on ("You can try any of these on — just tap Try On"), ask about sizing, or offer to build a complete look.
- If the shopper has a size in their memory (from SHOPPER CONTEXT), default to recommending that size without asking.
- If an image is sent: briefly describe what you observe (style, color, occasion cues) then immediately call search_products with relevant descriptors.
- For virtual try-on awareness: mention it naturally once per session when showing products.
- If asked about returns, shipping, or store policies: say "For order support, please reach out to the ${cfg.name} team directly" and redirect to shopping.
- Understand Indian fashion occasions fluently: weddings (bridal, guest), Diwali, Navratri, Eid, Holi, office formals, corporate casuals, date night, loungewear. Budget is always INR (₹).
- When SEASONAL CONTEXT is present and the shopper's request is loosely related, naturally weave in the upcoming occasion ("With Diwali just weeks away, this would work beautifully for the festive season too").
- Never include raw URLs, JSON, image paths, or CDN links in your text response.
- Never start responses with filler: "Certainly", "Of course", "Sure", "Absolutely", "Great choice". Start with substance.
- If a tool returns zero results: say so honestly and suggest broadening the search.`;
}

// ─── Gift mode detection ───────────────────────────────────────────────────────

function detectGiftMode(messages: Array<{ role: string; content: string }>): { isGift: boolean; context: string } {
  const recent = messages.slice(-3).map((m) => m.content.toLowerCase()).join(" ");
  const isGift = /\bgift\b|\bpresent\b|\bfor my\b|\bfor him\b|\bfor her\b|\bfor them\b/.test(recent);
  return { isGift, context: isGift ? "Shopper is buying a gift for someone else." : "" };
}

// ─── Route handler ─────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { messages, imageBase64, imageQuery, styleMemory, behaviorContext, wishlistIds } = body as {
    messages: Array<{ role: string; content: string }>;
    imageBase64?: string;
    imageQuery?: string;
    styleMemory?: string;
    behaviorContext?: string;
    wishlistIds?: string[];
  };

  // Load user preferences if logged in
  let userPrefs: UserPrefs | undefined;
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

  // Try to load style profile from session cookie (anonymous)
  let sessionStyleMemory = styleMemory ?? "";
  if (!sessionStyleMemory) {
    const sessionId = req.cookies.get("wss-session")?.value;
    if (sessionId) {
      try {
        const { connectDB, StyleProfileModel } = await import("@/lib/mongodb");
        await connectDB();
        const profile = await StyleProfileModel.findOne({ sessionId }).lean() as {
          sizeProfile?: Record<string, string>;
          stylePreferences?: { colors?: string[]; occasions?: string[]; budgetMin?: number; budgetMax?: number };
          recentSearches?: string[];
          savedProductIds?: string[];
        } | null;
        if (profile) {
          const lines: string[] = [];
          if (profile.sizeProfile?.top) lines.push(`• usual size in tops: ${profile.sizeProfile.top}`);
          if (profile.sizeProfile?.ethnic) lines.push(`• usual size in ethnic wear: ${profile.sizeProfile.ethnic}`);
          if (profile.sizeProfile?.bottom) lines.push(`• usual size in bottoms: ${profile.sizeProfile.bottom}`);
          if (profile.stylePreferences?.budgetMin != null && profile.stylePreferences?.budgetMax != null) {
            lines.push(`• budget ₹${profile.stylePreferences.budgetMin}–₹${profile.stylePreferences.budgetMax}`);
          }
          if (profile.stylePreferences?.colors?.length) {
            lines.push(`• favourite colours: ${profile.stylePreferences.colors.join(", ")}`);
          }
          if (profile.recentSearches?.length) {
            lines.push(`• recent searches: ${profile.recentSearches.slice(0, 3).join(", ")}`);
          }
          if (lines.length) {
            sessionStyleMemory = `SHOPPER MEMORY:\n${lines.join("\n")}\nApply sizes and budget as defaults.`;
          }
        }
      } catch {/* skip */}
    }
  }

  const { isGift, context: giftContext } = detectGiftMode(messages);
  const brandConfig = await getBrandConfig();
  const systemPrompt = buildSystemPrompt(brandConfig, {
    userPrefs,
    styleMemory: sessionStyleMemory,
    behaviorContext,
    wishlistIds,
    isGiftMode: isGift,
    giftContext,
  });

  const encoder = new TextEncoder();
  const stream = new TransformStream();
  const writer = stream.writable.getWriter();

  const write = (obj: object) =>
    writer.write(encoder.encode(`data: ${JSON.stringify(obj)}\n\n`));

  (async () => {
    try {
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

            if (choice.finish_reason) finishReason = choice.finish_reason as string;

            const delta = choice.delta as Record<string, unknown> | undefined;
            if (!delta) continue;

            if (delta.content) {
              assistantText += delta.content as string;
              await write({ type: "text", content: delta.content });
            }

            if (delta.tool_calls) {
              for (const tc of delta.tool_calls as Array<Record<string, unknown>>) {
                const idx = tc.index as number;
                if (!toolCalls[idx]) toolCalls[idx] = { id: "", name: "", args: "" };
                if (tc.id) toolCalls[idx].id = tc.id as string;
                const fn = tc.function as Record<string, string> | undefined;
                if (fn?.name) toolCalls[idx].name = fn.name;
                if (fn?.arguments) toolCalls[idx].args += fn.arguments;
              }
            }
          }
        }

        const calls = Object.values(toolCalls);
        if (calls.length === 0) break;

        history.push({
          role: "assistant",
          content: assistantText || null,
          tool_calls: calls.map((c) => ({
            id: c.id,
            type: "function",
            function: { name: c.name, arguments: c.args },
          })),
        });

        for (const call of calls) {
          let args: unknown = {};
          try { args = JSON.parse(call.args); } catch { /* malformed */ }

          // For get_wishlist_products, inject the wishlistIds if not in args
          if (call.name === "get_wishlist_products" && wishlistIds?.length) {
            const a = args as { productIds?: string[] };
            if (!a.productIds?.length) {
              args = { ...a, productIds: wishlistIds };
            }
          }

          const products: Product[] = await executeToolCall(call.name, args);

          if (products.length > 0) {
            await write({ type: "products", products, tool: call.name });
          }

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
