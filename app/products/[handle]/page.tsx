"use client";
import { useState, useRef, useEffect } from "react";
import { useParams, notFound } from "next/navigation";
import Link from "next/link";
import { ChevronRight, Sparkles, X, Send, Loader2, RefreshCw } from "lucide-react";
import { DEMO_PRODUCTS } from "@/data/products";
import { StorefrontHeader } from "@/components/storefront/StorefrontHeader";
import { FloatingChatWidget } from "@/components/storefront/FloatingChatWidget";
import { VTOWidget } from "@/components/chat/VTOWidget";
import { WishlistButton } from "@/components/storefront/WishlistButton";
import { SizePredictor } from "@/components/storefront/SizePredictor";
import { DemandBadge } from "@/components/storefront/DemandBadge";
import { recordPDPScroll, recordSizeTap, getSessionProfile, buildAgentContext } from "@/lib/behavior-tracker";
import { getLocalProfile, buildProfileAgentContext } from "@/lib/style-memory";
import { renderMarkdown } from "@/components/chat/MessageBubble";
import { addRecentlyViewed, getRecentlyViewed } from "@/lib/recently-viewed";
import { Product } from "@/types";

// ── Compact product card used inside the AI drawer ──────────────────────────

function DrawerProductCard({ product }: { product: Product }) {
  return (
    <Link href={`/products/${product.handle}`} className="flex items-center gap-3 border border-gray-100 hover:border-dark p-2 transition-colors group">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={product.image_urls[0]} alt={product.title} className="w-12 h-16 object-cover object-top flex-shrink-0 bg-[#F7F4F0]" />
      <div className="min-w-0 flex-1">
        <p className="font-sans text-[10px] text-taupe uppercase tracking-wide mb-0.5">{product.vendor}</p>
        <p className="font-sans text-xs text-dark line-clamp-2 leading-snug group-hover:text-dark/70 transition-colors">{product.title}</p>
        <p className="font-display text-sm font-500 text-dark mt-1">₹{product.price.toLocaleString("en-IN")}</p>
      </div>
      <ChevronRight size={13} className="text-gray-300 group-hover:text-dark transition-colors flex-shrink-0" />
    </Link>
  );
}

// ── AI Stylist Side Drawer ──────────────────────────────────────────────────

type AiMsg =
  | { role: "user"; content: string }
  | { role: "assistant"; content: string; products?: Product[] };

const FALLBACK_QUESTIONS = (product: Product) => [
  `How does the ${product.title} fit? Should I size up?`,
  `What occasions is this perfect for?`,
  `What shoes pair well with this?`,
];

const CHAT_STORAGE_KEY = (productId: string) => `pdp-chat-${productId}`;

function ProductAIDrawer({ product, onClose, onSizeSelect }: { product: Product; onClose: () => void; onSizeSelect?: (size: string) => void }) {
  const [messages, setMessages] = useState<AiMsg[]>(() => {
    try {
      const saved = localStorage.getItem(CHAT_STORAGE_KEY(product.id));
      return saved ? (JSON.parse(saved) as AiMsg[]) : [];
    } catch { return []; }
  });
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [aiQuestions, setAiQuestions] = useState<string[]>([]);
  const [aiAnswers, setAiAnswers] = useState<string[]>([]);
  const [showSizePredictorInDrawer, setShowSizePredictorInDrawer] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  // Persist messages to localStorage whenever they change
  useEffect(() => {
    if (messages.length === 0) return;
    try {
      localStorage.setItem(CHAT_STORAGE_KEY(product.id), JSON.stringify(messages));
    } catch { /* storage full — ignore */ }
  }, [messages, product.id]);

  function clearHistory() {
    localStorage.removeItem(CHAT_STORAGE_KEY(product.id));
    setMessages([]);
  }

  // Load AI-generated Q&A for this product
  useEffect(() => {
    fetch("/api/product-qa", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        productId: product.id,
        title: product.title,
        description: product.description,
        productType: product.product_type,
        tags: product.tags,
        vendor: product.vendor,
      }),
    })
      .then((r) => r.json())
      .then((data) => {
        if (data.questions?.length) {
          setAiQuestions(data.questions.slice(0, 3));
          setAiAnswers((data.answers ?? []).slice(0, 3));
        }
      })
      .catch(() => {});
  }, [product.id, product.title, product.description, product.product_type, product.tags, product.vendor]);

  const quickQuestions = aiQuestions.length > 0 ? aiQuestions : FALLBACK_QUESTIONS(product);

  const systemSeed = `The shopper is viewing: "${product.title}" by ${product.vendor} (product_id: "${product.id}"), ₹${product.price.toLocaleString("en-IN")}. Category: ${product.product_type}. Sizes: ${product.sizes.join(", ")}. Gender: ${product.gender === "female" ? "Women" : "Men"}. If asked to build a look or find complementary pieces, call build_outfit with base_product_id: "${product.id}".`;

  // For pre-generated Q&A — answer instantly without hitting the agent
  function sendInstant(question: string, answer: string) {
    setMessages((prev) => [
      ...prev,
      { role: "user", content: question },
      { role: "assistant", content: answer },
    ]);
  }

  // Build a complete look — calls /api/outfit directly, no agent round-trip
  async function buildLook() {
    if (loading) return;
    setMessages((prev) => [
      ...prev,
      { role: "user", content: `Build me a complete look with the ${product.title}` },
    ]);
    setLoading(true);
    try {
      const res = await fetch("/api/outfit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ product_id: product.id }),
      });
      const data = await res.json();
      const products: Product[] = data.products ?? [];
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: products.length > 0
            ? `Here are some pieces that pair great with your ${product.product_type} — tap any card to view it:`
            : `I couldn't find specific matches right now. Try searching for ${product.gender === "male" ? "shirts or tops for men" : "tops or jackets for women"} to complete this look.`,
          products: products.length > 0 ? products : undefined,
        },
      ]);
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "Something went wrong. Please try again." },
      ]);
    } finally {
      setLoading(false);
    }
  }

  async function send(text?: string) {
    const userMsg = (text ?? input).trim();
    if (!userMsg || loading) return;
    setInput("");

    const newMessages: AiMsg[] = [...messages, { role: "user", content: userMsg }];
    setMessages(newMessages);
    setLoading(true);

    const agentMessages = [
      { role: "user", content: systemSeed },
      { role: "assistant", content: `I can see you're looking at the ${product.title}. What would you like to know?` },
      ...newMessages.map((m) => ({ role: m.role, content: m.content })),
    ];

    // Attach wishlist IDs and session context
    const localProfile = getLocalProfile();
    const sessionProf = getSessionProfile();
    const wishlistIds = localProfile?.savedProductIds ?? [];
    const styleMemory = buildProfileAgentContext(localProfile ?? {});
    const behaviorContext = buildAgentContext(sessionProf);

    try {
      const resp = await fetch("/api/agent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: agentMessages, wishlistIds, styleMemory, behaviorContext }),
      });

      if (!resp.body) throw new Error();
      const reader = resp.body.getReader();
      const dec = new TextDecoder();
      let buffer = "";
      let assistantText = "";
      let assistantProducts: Product[] = [];

      setMessages((prev) => [...prev, { role: "assistant", content: "", products: [] }]);

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += dec.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";

        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          const raw = line.slice(6).trim();
          if (raw === "[DONE]") continue;
          try {
            const evt = JSON.parse(raw);
            if (evt.type === "text") {
              assistantText += evt.content;
              setMessages((prev) => {
                const updated = [...prev];
                updated[updated.length - 1] = { role: "assistant", content: assistantText, products: assistantProducts };
                return updated;
              });
            }
            if (evt.type === "products" && Array.isArray(evt.products)) {
              assistantProducts = [...assistantProducts, ...evt.products];
              setMessages((prev) => {
                const updated = [...prev];
                updated[updated.length - 1] = { role: "assistant", content: assistantText, products: assistantProducts };
                return updated;
              });
            }
          } catch { /* skip malformed */ }
        }
      }
    } catch {
      setMessages((prev) => [...prev, { role: "assistant", content: "Something went wrong. Please try again." }]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex">
      <div className="flex-1 bg-dark/30 backdrop-blur-sm" onClick={onClose} />
      <div className="flex flex-col bg-white w-full sm:w-[400px] h-full shadow-2xl">

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 flex-shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 bg-dark rounded-full flex items-center justify-center">
              <Sparkles size={13} className="text-gold" />
            </div>
            <div>
              <p className="font-display text-base text-dark leading-tight">AI Stylist</p>
              <p className="font-sans text-[10px] text-taupe">Ask anything about this product</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {messages.length > 0 && (
              <button
                onClick={clearHistory}
                title="Clear history"
                className="font-sans text-[10px] tracking-[0.1em] uppercase text-taupe hover:text-dark transition-colors border border-gray-200 px-2 py-1 hover:border-dark"
              >
                Clear
              </button>
            )}
            <button onClick={onClose} className="text-taupe hover:text-dark transition-colors p-1">
              <X size={18} strokeWidth={1.5} />
            </button>
          </div>
        </div>

        {/* Product context strip */}
        <div className="flex items-center gap-3 px-5 py-3 bg-[#FAFAFA] border-b border-gray-100 flex-shrink-0">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={product.image_urls[0]} alt={product.title} className="w-10 h-14 object-cover object-top flex-shrink-0 bg-[#F7F4F0]" />
          <div className="min-w-0">
            <p className="font-sans text-xs font-500 text-dark line-clamp-1">{product.title}</p>
            <p className="font-sans text-[11px] text-taupe">₹{product.price.toLocaleString("en-IN")} · {product.product_type}</p>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
          {messages.length === 0 && (
            <div className="space-y-2 pt-2">
              {/* Greeting */}
              <div className="flex items-start gap-2.5 mb-4">
                <div className="w-6 h-6 bg-dark rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-gold text-[10px]">✦</span>
                </div>
                <div className="bg-gray-100 text-dark rounded-2xl rounded-bl-sm px-4 py-2.5 font-sans text-sm leading-relaxed">
                  Hi! I can see you&apos;re looking at <strong>{product.title}</strong>. What would you like to know — sizing advice, styling ideas, or occasion recommendations?
                </div>
              </div>

              <p className="font-sans text-xs text-taupe mb-2">
                {aiQuestions.length > 0 ? "AI-generated questions:" : "Quick questions:"}
              </p>
              {quickQuestions.map((q, idx) => {
                const preAnswer = aiAnswers[idx];
                return (
                  <button
                    key={q}
                    onClick={() => preAnswer ? sendInstant(q, preAnswer) : send(q)}
                    className="block w-full text-left font-sans text-xs text-dark border border-gray-200 px-3 py-2.5 hover:border-dark hover:bg-gray-50 transition-all rounded"
                  >
                    {q}
                  </button>
                );
              })}
              <div className="mt-4 pt-4 border-t border-gray-100 space-y-2">
                <p className="font-sans text-xs text-taupe mb-1">Or try:</p>
                <button
                  onClick={() => setShowSizePredictorInDrawer(true)}
                  className="block w-full text-left font-sans text-xs text-dark border border-gold/30 bg-gold/5 px-3 py-2.5 hover:border-gold hover:bg-gold/10 transition-all rounded flex items-center gap-2"
                >
                  <span className="text-gold">✦</span> Find my size for this {product.product_type}
                </button>
                <button
                  onClick={buildLook}
                  className="block w-full text-left font-sans text-xs text-dark border border-gray-200 px-3 py-2.5 hover:border-dark hover:bg-gray-50 transition-all rounded flex items-center gap-2"
                >
                  <span className="text-taupe">◈</span> Build a complete look with this
                </button>
              </div>
            </div>
          )}

          {messages.map((m, i) => (
            <div key={i} className={`flex flex-col ${m.role === "user" ? "items-end" : "items-start"}`}>
              <div className={`max-w-[88%] font-sans text-sm leading-relaxed px-4 py-2.5 rounded-2xl ${
                m.role === "user"
                  ? "bg-dark text-cream rounded-br-sm"
                  : "bg-gray-100 text-dark rounded-bl-sm"
              }`}>
                {m.role === "user" ? (
                  m.content
                ) : m.content ? (
                  <div className="[&_strong]:font-600 [&_ol]:list-decimal [&_ol]:pl-4 [&_ul]:list-disc [&_ul]:pl-4 [&_li]:my-0.5 [&_p]:my-1">
                    {renderMarkdown(m.content)}
                  </div>
                ) : loading && i === messages.length - 1 ? (
                  <span className="flex gap-1.5 py-0.5">
                    {[0,1,2].map(j => <span key={j} className="w-1.5 h-1.5 bg-taupe rounded-full animate-pulse-dot" style={{ animationDelay: `${j*0.2}s` }} />)}
                  </span>
                ) : <span className="opacity-30">…</span>}
              </div>
              {m.role === "assistant" && m.products && m.products.length > 0 && (
                <div className="w-full mt-2 space-y-2">
                  {m.products.map((p) => (
                    <DrawerProductCard key={p.id} product={p} />
                  ))}
                </div>
              )}
            </div>
          ))}

          {loading && messages[messages.length - 1]?.role !== "assistant" && (
            <div className="flex justify-start">
              <div className="bg-gray-100 px-4 py-3 rounded-2xl rounded-bl-sm">
                <span className="flex gap-1.5">
                  {[0,1,2].map(j => <span key={j} className="w-1.5 h-1.5 bg-taupe rounded-full animate-pulse-dot" style={{ animationDelay: `${j*0.2}s` }} />)}
                </span>
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        {/* Input */}
        <form
          onSubmit={(e) => { e.preventDefault(); send(); }}
          className="flex items-center gap-3 px-4 py-3 border-t border-gray-100 flex-shrink-0"
        >
          <input
            autoFocus
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask about sizing, fit, styling…"
            className="flex-1 font-sans text-sm text-dark placeholder:text-gray-300 outline-none bg-transparent"
          />
          <button
            type="submit"
            disabled={!input.trim() || loading}
            className="w-8 h-8 bg-dark rounded-full flex items-center justify-center text-cream disabled:opacity-30 flex-shrink-0 transition-opacity"
          >
            {loading ? <Loader2 size={13} className="animate-spin" /> : <Send size={13} strokeWidth={1.5} />}
          </button>
        </form>
      </div>

      {/* Size predictor overlay — triggered from within the drawer */}
      {showSizePredictorInDrawer && (
        <SizePredictor
          productType={product.product_type}
          gender={product.gender}
          onSizeSelect={(size) => {
            setShowSizePredictorInDrawer(false);
            onSizeSelect?.(size);
            setMessages((prev) => [
              ...prev,
              {
                role: "assistant",
                content: `Based on your measurements, I recommend size **${size}** for this ${product.product_type}. I've pre-selected it on the page for you — just hit "Add to Bag" when you're ready.`,
              },
            ]);
          }}
          onClose={() => setShowSizePredictorInDrawer(false)}
        />
      )}
    </div>
  );
}

// ── Complete Outfit section ─────────────────────────────────────────────────

function CompleteOutfit({ product, onOpenAI }: { product: Product; onOpenAI: () => void }) {
  const [outfitProducts, setOutfitProducts] = useState<Product[]>(
    DEMO_PRODUCTS.filter((p) => p.id !== product.id && p.gender === product.gender && p.product_type !== product.product_type).slice(0, 4)
  );
  const [loading, setLoading] = useState(false);
  const [aiDone, setAiDone] = useState(false);

  async function buildAiLook() {
    setLoading(true);
    try {
      const res = await fetch("/api/outfit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ product_id: product.id, style: "any" }),
      });
      const data = await res.json();
      if (data.products?.length > 0) {
        setOutfitProducts(data.products);
        setAiDone(true);
      }
    } catch { /* keep static fallback */ }
    finally { setLoading(false); }
  }

  return (
    <section className="border-t border-gray-100 bg-[#FAFAFA] py-14">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="font-display text-2xl font-400 text-dark">Complete the Look</h2>
            {aiDone && (
              <p className="font-sans text-xs text-taupe mt-0.5 flex items-center gap-1">
                <span className="text-gold">✦</span> AI-curated for this piece
              </p>
            )}
          </div>
          <div className="flex items-center gap-3">
            {aiDone && (
              <button
                onClick={() => { setAiDone(false); buildAiLook(); }}
                className="text-taupe hover:text-dark transition-colors"
                title="Refresh AI look"
              >
                <RefreshCw size={14} strokeWidth={1.5} />
              </button>
            )}
            {!aiDone && (
              <button
                onClick={buildAiLook}
                disabled={loading}
                className="flex items-center gap-2 border border-dark text-dark font-sans text-xs tracking-[0.1em] uppercase px-4 py-2 hover:bg-dark hover:text-cream transition-all duration-200 disabled:opacity-40"
              >
                {loading ? <Loader2 size={12} className="animate-spin" /> : <Sparkles size={12} strokeWidth={1.5} />}
                {loading ? "Styling…" : "Style with AI"}
              </button>
            )}
            <button
              onClick={onOpenAI}
              className="font-sans text-xs text-taupe underline hover:text-dark transition-colors"
            >
              Ask AI stylist
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 lg:gap-5">
          {outfitProducts.map((rec) => (
            <Link key={rec.id} href={`/products/${rec.handle}`} className="group block">
              <div className="relative overflow-hidden bg-[#F7F4F0] mb-3" style={{ aspectRatio: "3/4" }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={rec.image_urls[0]}
                  alt={rec.title}
                  className="w-full h-full object-cover object-top transition-transform duration-500 group-hover:scale-105"
                />
              </div>
              <p className="font-sans text-[10px] text-taupe uppercase tracking-wide mb-0.5">{rec.vendor}</p>
              <p className="font-sans text-sm text-dark line-clamp-2 leading-snug mb-1">{rec.title}</p>
              <p className="font-display text-base font-500 text-dark">₹{rec.price.toLocaleString("en-IN")}</p>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

// ── Size Guide Modal ────────────────────────────────────────────────────────

const SIZE_CHARTS: Record<string, { columns: string[]; rows: string[][] }> = {
  default: {
    columns: ["Size", "Chest (in)", "Waist (in)", "Hip (in)"],
    rows: [
      ["XS", "32–33", "26–27", "35–36"],
      ["S",  "34–35", "28–29", "37–38"],
      ["M",  "36–37", "30–31", "39–40"],
      ["L",  "38–40", "32–34", "41–43"],
      ["XL", "41–43", "35–37", "44–46"],
      ["XXL","44–46", "38–40", "47–49"],
    ],
  },
  bottoms: {
    columns: ["Size", "Waist (in)", "Hip (in)", "Length (in)"],
    rows: [
      ["XS", "26–27", "35–36", "38"],
      ["S",  "28–29", "37–38", "38"],
      ["M",  "30–31", "39–40", "39"],
      ["L",  "32–34", "41–43", "39"],
      ["XL", "35–37", "44–46", "40"],
      ["XXL","38–40", "47–49", "40"],
    ],
  },
};

const BOTTOM_TYPES = ["Trousers", "Jeans", "Skirts", "Leggings", "Palazzos", "Joggers"];

function SizeGuideModal({ productType, onClose }: { productType: string; onClose: () => void }) {
  const chart = BOTTOM_TYPES.some((t) => productType.toLowerCase().includes(t.toLowerCase()))
    ? SIZE_CHARTS.bottoms
    : SIZE_CHARTS.default;

  return (
    <div className="fixed inset-0 z-50 bg-dark/40 backdrop-blur-sm flex items-center justify-center p-4" onClick={onClose}>
      <div
        className="bg-white w-full max-w-lg shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div>
            <p className="font-display text-lg font-400 text-dark">Size Guide</p>
            <p className="font-sans text-[11px] text-taupe mt-0.5">All measurements in inches</p>
          </div>
          <button onClick={onClose} className="text-taupe hover:text-dark transition-colors">
            <X size={18} strokeWidth={1.5} />
          </button>
        </div>
        <div className="p-6 overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-gray-100">
                {chart.columns.map((col) => (
                  <th key={col} className="font-sans text-[10px] tracking-[0.12em] uppercase text-taupe pb-3 pr-6 font-400">{col}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {chart.rows.map(([size, ...vals]) => (
                <tr key={size} className="border-b border-gray-50 last:border-0">
                  <td className="font-sans text-sm font-500 text-dark py-3 pr-6">{size}</td>
                  {vals.map((v, i) => (
                    <td key={i} className="font-sans text-sm text-gray-600 py-3 pr-6">{v}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="px-6 pb-5 pt-1">
          <p className="font-sans text-[11px] text-taupe">Tip: If you&apos;re between sizes, go one size up for a relaxed fit.</p>
        </div>
      </div>
    </div>
  );
}

// ── Recently Viewed ─────────────────────────────────────────────────────────

function RecentlyViewed({ currentId }: { currentId: string }) {
  const [products, setProducts] = useState<Product[]>([]);

  useEffect(() => {
    setProducts(getRecentlyViewed().filter((p) => p.id !== currentId));
  }, [currentId]);

  if (products.length === 0) return null;

  return (
    <section className="border-t border-gray-100 py-14">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="font-display text-2xl font-400 text-dark mb-8">Recently Viewed</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
          {products.map((p) => (
            <Link key={p.id} href={`/products/${p.handle}`} className="group block">
              <div className="relative overflow-hidden bg-[#F7F4F0] mb-2.5" style={{ aspectRatio: "3/4" }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={p.image_urls[0]} alt={p.title} className="w-full h-full object-cover object-top transition-transform duration-500 group-hover:scale-105" />
              </div>
              <p className="font-sans text-[10px] text-taupe uppercase tracking-wide mb-0.5 truncate">{p.vendor}</p>
              <p className="font-sans text-xs text-dark line-clamp-2 leading-snug mb-1">{p.title}</p>
              <p className="font-display text-sm font-500 text-dark">₹{p.price.toLocaleString("en-IN")}</p>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

// ── Main PDP component ──────────────────────────────────────────────────────

export default function ProductDetailPage() {
  const { handle } = useParams<{ handle: string }>();
  const product = DEMO_PRODUCTS.find((p) => p.handle === handle);

  const [selectedImage, setSelectedImage] = useState(0);
  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  const [added, setAdded] = useState(false);
  const [showAI, setShowAI] = useState(false);
  const [showVTO, setShowVTO] = useState(false);
  const [showSizePredictor, setShowSizePredictor] = useState(false);
  const [showSizeGuide, setShowSizeGuide] = useState(false);

  if (!product) notFound();

  // Track view demand signal on page load + recently viewed
  useEffect(() => {
    if (!product) return;
    addRecentlyViewed(product);
    fetch("/api/demand", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ productId: product.id, action: "view" }),
    }).catch(() => {});
    const p = product;
    const handleScroll = () => {
      if (window.scrollY > 200) recordPDPScroll(p);
    };
    window.addEventListener("scroll", handleScroll, { once: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [product]);

  function addToCart() {
    if (!selectedSize || !product) return;
    fetch("/api/demand", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ productId: product.id, action: "cart" }),
    }).catch(() => {});
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  }

  function handleSizeSelect(size: string) {
    if (!product) return;
    setSelectedSize(size);
    recordSizeTap(product, size);
  }

  return (
    <div className="min-h-screen bg-white">
      <StorefrontHeader />

      {/* Breadcrumb */}
      <div className="border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <nav className="flex items-center gap-1.5 font-sans text-xs text-taupe flex-wrap">
            <Link href="/" className="hover:text-dark transition-colors">Home</Link>
            <ChevronRight size={11} />
            <Link href="/shop" className="hover:text-dark transition-colors">Shop</Link>
            <ChevronRight size={11} />
            <Link href={`/shop?category=${encodeURIComponent(product.product_type)}`} className="hover:text-dark transition-colors">
              {product.product_type}
            </Link>
            <ChevronRight size={11} />
            <span className="text-dark line-clamp-1 max-w-[200px]">{product.title}</span>
          </nav>
        </div>
      </div>

      {/* Product section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-14">
        <div className="grid lg:grid-cols-2 gap-10 lg:gap-16">

          {/* Images */}
          <div className="flex gap-3">
            {product.image_urls.length > 1 && (
              <div className="flex flex-col gap-2 flex-shrink-0">
                {product.image_urls.map((url, i) => (
                  <button
                    key={i}
                    onClick={() => setSelectedImage(i)}
                    className="w-14 overflow-hidden border transition-colors"
                    style={{ height: "72px", borderColor: selectedImage === i ? "#0D0B08" : "#E5E7EB" }}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={url} alt="" className="w-full h-full object-cover object-top" />
                  </button>
                ))}
              </div>
            )}

            <div className="flex-1 relative overflow-hidden bg-[#F7F4F0]" style={{ aspectRatio: "3/4" }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={product.image_urls[selectedImage]}
                alt={product.title}
                className="w-full h-full object-cover object-top"
              />
              <div className="absolute top-3 right-3">
                <WishlistButton productId={product.id} />
              </div>
            </div>
          </div>

          {/* Product info */}
          <div className="flex flex-col">
            <p className="font-sans text-xs tracking-[0.15em] uppercase text-taupe mb-2">{product.vendor}</p>
            <h1 className="font-display text-3xl font-400 text-dark mb-3 leading-snug">{product.title}</h1>
            <p className="font-display text-2xl font-500 text-dark mb-6">₹{product.price.toLocaleString("en-IN")}</p>

            <p className="font-sans text-sm text-gray-600 leading-relaxed mb-7">{product.description}</p>

            {/* Sizes */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-3">
                <p className="font-sans text-xs tracking-[0.15em] uppercase text-dark">Select Size</p>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setShowSizePredictor(true)}
                    className="font-sans text-xs text-gold hover:text-dark transition-colors flex items-center gap-1"
                  >
                    <span>✦</span> Find My Size
                  </button>
                  <span className="text-gray-200 select-none">|</span>
                  <button onClick={() => setShowSizeGuide(true)} className="font-sans text-xs text-taupe underline hover:text-dark transition-colors">Size Guide</button>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                {product.sizes.map((size) => (
                  <button
                    key={size}
                    onClick={() => handleSizeSelect(size)}
                    className={`min-w-[44px] h-10 px-3 font-sans text-sm border transition-all duration-150 ${
                      selectedSize === size
                        ? "border-dark bg-dark text-cream"
                        : "border-gray-200 text-dark hover:border-dark"
                    }`}
                  >
                    {size}
                  </button>
                ))}
              </div>
              {!selectedSize && <p className="font-sans text-xs text-taupe mt-2">Please select a size to add to bag</p>}

              {/* Demand badge — urgency signal */}
              <div className="mt-3">
                <DemandBadge productId={product.id} />
              </div>
            </div>

            {/* CTAs */}
            <div className="flex flex-col gap-3 mb-6">
              <button
                onClick={addToCart}
                disabled={!selectedSize}
                className={`w-full font-sans text-sm tracking-[0.1em] uppercase py-4 transition-all duration-200 ${
                  added ? "bg-green-700 text-white" :
                  selectedSize ? "bg-dark text-cream hover:bg-warm" :
                  "bg-gray-100 text-gray-300 cursor-not-allowed"
                }`}
              >
                {added ? "✓ Added to Bag" : "Add to Bag"}
              </button>

              <button
                onClick={() => setShowVTO(true)}
                className="w-full font-sans text-sm tracking-[0.1em] uppercase py-4 border border-dark text-dark hover:bg-dark hover:text-cream transition-all duration-200 flex items-center justify-center gap-2"
              >
                ✦ Virtual Try-On
              </button>
            </div>

            {/* AI Stylist CTA */}
            <button
              onClick={() => setShowAI(true)}
              className="w-full font-sans text-xs tracking-[0.1em] uppercase py-4 border border-dark text-dark hover:bg-dark hover:text-cream transition-all duration-200 flex items-center justify-center gap-2 mb-7"
            >
              <Sparkles size={13} strokeWidth={1.5} />
              Ask AI Stylist
            </button>

            {/* Product meta */}
            <div className="border-t border-gray-100 pt-5 space-y-2.5">
              {[
                ["Category", product.product_type],
                ["Brand", product.vendor],
                ["Gender", product.gender === "female" ? "Women" : "Men"],
                ["Available in", product.sizes.join(", ")],
              ].map(([k, v]) => (
                <div key={k} className="flex gap-2">
                  <span className="font-sans text-xs text-taupe w-24 flex-shrink-0">{k}</span>
                  <span className="font-sans text-xs text-dark">{v}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Complete the Look */}
      <CompleteOutfit product={product} onOpenAI={() => setShowAI(true)} />

      {/* Recently Viewed */}
      <RecentlyViewed currentId={product.id} />

      {/* AI Drawer */}
      {showAI && (
        <ProductAIDrawer
          product={product}
          onClose={() => setShowAI(false)}
          onSizeSelect={(size) => { setSelectedSize(size); setShowAI(false); }}
        />
      )}

      {/* VTO */}
      {showVTO && <VTOWidget product={product} onClose={() => setShowVTO(false)} />}

      {/* Size Guide */}
      {showSizeGuide && (
        <SizeGuideModal productType={product.product_type} onClose={() => setShowSizeGuide(false)} />
      )}

      {/* Size Predictor */}
      {showSizePredictor && (
        <SizePredictor
          productType={product.product_type}
          gender={product.gender}
          onSizeSelect={(size) => {
            setSelectedSize(size);
            setShowSizePredictor(false);
          }}
          onClose={() => setShowSizePredictor(false)}
        />
      )}

      <FloatingChatWidget />
    </div>
  );
}
