"use client";
import { useState, useRef, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { v4 as uuidv4 } from "uuid";
import { ShoppingBag, ArrowLeft, Package } from "lucide-react";
import { Message, CartItem, Product } from "@/types";
import { MessageBubble, TypingIndicator } from "./MessageBubble";
import { ChatInput } from "./ChatInput";
import { VTOWidget } from "./VTOWidget";
import { CartDrawer } from "./CartDrawer";
import { getPrimaryOccasion, getDaysUntil } from "@/lib/occasions";

interface Props {
  initialQuery?: string;
  agentName?: string;
  welcomeMessage?: string;
  brandName?: string;
}

export function ChatWindow({
  initialQuery,
  agentName = "Aria",
  welcomeMessage = "Good to have you here. I'm Aria — your Westside stylist. Tell me what you're looking for today: an occasion, a mood, a budget, or just browse.",
  brandName = "Westside",
}: Props) {
  // Build two-message greeting: base intro + optional festival nudge
  const primaryOccasion = getPrimaryOccasion();

  const baseGreeting: Message = {
    id: "greeting",
    role: "assistant",
    content: welcomeMessage,
    timestamp: new Date(),
  };

  const occasionGreeting: Message | null = primaryOccasion
    ? (() => {
        const days = getDaysUntil(primaryOccasion);
        const daysText = days === 0 ? "today!" : days === 1 ? "tomorrow!" : `in ${days} days.`;
        return {
          id: "occasion",
          role: "assistant" as const,
          content: `${primaryOccasion.emoji} By the way — ${primaryOccasion.name} is ${daysText} Looking for the perfect festive outfit? Just ask me!`,
          timestamp: new Date(),
        };
      })()
    : null;

  const baseMessages: Message[] = [baseGreeting, ...(occasionGreeting ? [occasionGreeting] : [])];

  const occasionSuggestions: string[] | undefined = primaryOccasion
    ? [
        `What to wear for ${primaryOccasion.name}?`,
        `Show me ${primaryOccasion.name} outfits under ₹2000`,
        "Casual western outfit for women",
        "Office look for men under ₹3000",
      ]
    : undefined;

  const router = useRouter();
  const baseMessagesRef = useRef<Message[]>(baseMessages);
  const [messages, setMessages] = useState<Message[]>(baseMessages);
  const [thinking, setThinking] = useState(false);
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [cartOpen, setCartOpen] = useState(false);
  const [vtoProduct, setVtoProduct] = useState<Product | null>(null);
  const [historyLoaded, setHistoryLoaded] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);
  const initialQueryRef = useRef(initialQuery);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, thinking]);

  useEffect(() => {
    return () => { abortRef.current?.abort(); };
  }, []);

  // Load persisted conversation for logged-in users
  useEffect(() => {
    fetch("/api/conversation")
      .then((r) => r.json())
      .then((data) => {
        if (data.messages?.length > 0) {
          const loaded: Message[] = data.messages.map((m: { role: string; content: string; timestamp?: string }) => ({
            id: uuidv4(),
            role: m.role as "user" | "assistant",
            content: m.content,
            timestamp: m.timestamp ? new Date(m.timestamp) : new Date(),
          }));
          setMessages([...baseMessagesRef.current, ...loaded]);
        }
      })
      .catch(() => {/* not logged in — ignore */})
      .finally(() => setHistoryLoaded(true));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Auto-save conversation (debounced 2s) for logged-in users
  useEffect(() => {
    if (!historyLoaded) return;
    const nonGreeting = messages.filter((m) => m.role === "user" || (m.role === "assistant" && m.id !== "greeting" && m.id !== "occasion"));
    if (nonGreeting.length === 0) return;
    const t = setTimeout(() => {
      fetch("/api/conversation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: nonGreeting.map((m) => ({ role: m.role, content: m.content, timestamp: m.timestamp })),
        }),
      }).catch(() => {});
    }, 2000);
    return () => clearTimeout(t);
  }, [messages, historyLoaded]);

  const cartCount = cartItems.reduce((s, i) => s + i.quantity, 0);

  const addToCart = useCallback((item: CartItem) => {
    setCartItems((prev) => {
      const idx = prev.findIndex(
        (c) => c.product.id === item.product.id && c.size === item.size
      );
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = { ...next[idx], quantity: next[idx].quantity + 1 };
        return next;
      }
      return [...prev, item];
    });
    setCartOpen(true);
  }, []);

  const updateQty = useCallback((productId: string, size: string, delta: number) => {
    setCartItems((prev) =>
      prev
        .map((c) =>
          c.product.id === productId && c.size === size
            ? { ...c, quantity: c.quantity + delta }
            : c
        )
        .filter((c) => c.quantity > 0)
    );
  }, []);

  const removeItem = useCallback((productId: string, size: string) => {
    setCartItems((prev) =>
      prev.filter((c) => !(c.product.id === productId && c.size === size))
    );
  }, []);

  const handleCheckoutComplete = useCallback(() => {
    setCartItems([]);
  }, []);

  const clearChat = useCallback(() => {
    setMessages(baseMessagesRef.current);
    fetch("/api/conversation", { method: "DELETE" }).catch(() => {});
  }, []);

  const sendMessage = useCallback(async (text: string, imageBase64?: string) => {
    if (thinking) return;

    const userMsg: Message = {
      id: uuidv4(),
      role: "user",
      content: imageBase64 ? `🖼️ ${text || "Find similar products"}` : text,
      timestamp: new Date(),
    };
    const assistantId = uuidv4();
    const assistantMsg: Message = {
      id: assistantId,
      role: "assistant",
      content: "",
      products: [],
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMsg, assistantMsg]);
    setThinking(true);

    const history = [...messages, userMsg].map((m) => ({ role: m.role, content: m.content }));
    abortRef.current = new AbortController();

    try {
      const body: Record<string, unknown> = { messages: history };
      if (imageBase64) {
        body.imageBase64 = imageBase64;
        body.imageQuery = text || "Find products similar to this image";
      }

      const res = await fetch("/api/agent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
        signal: abortRef.current.signal,
      });

      if (!res.body) return;

      const reader = res.body.getReader();
      const dec = new TextDecoder();
      let buf = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buf += dec.decode(value, { stream: true });

        const lines = buf.split("\n");
        buf = lines.pop() ?? "";

        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          const raw = line.slice(6).trim();
          if (!raw) continue;

          let event: { type: string; content?: string; products?: Product[] };
          try { event = JSON.parse(raw); } catch { continue; }

          if (event.type === "text" && event.content) {
            setMessages((prev) =>
              prev.map((m) =>
                m.id === assistantId
                  ? { ...m, content: m.content + event.content }
                  : m
              )
            );
          }

          if (event.type === "products" && event.products?.length) {
            setMessages((prev) =>
              prev.map((m) =>
                m.id === assistantId
                  ? { ...m, products: [...(m.products ?? []), ...(event.products ?? [])] }
                  : m
              )
            );
          }

          if (event.type === "error" && event.content) {
            setMessages((prev) =>
              prev.map((m) =>
                m.id === assistantId ? { ...m, content: event.content ?? "" } : m
              )
            );
          }
        }
      }
    } catch (err) {
      if ((err as Error).name !== "AbortError") {
        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantId
              ? { ...m, content: "Something went wrong. Please try again." }
              : m
          )
        );
      }
    } finally {
      setThinking(false);
    }
  }, [messages, thinking]);

  const handleImageSend = useCallback((base64: string, filename: string) => {
    void sendMessage(`Find products similar to: ${filename}`, base64);
  }, [sendMessage]);

  // Auto-send initial query on mount
  useEffect(() => {
    const q = initialQueryRef.current;
    if (!q) return;
    const t = setTimeout(() => sendMessage(q), 600);
    return () => clearTimeout(t);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const isFirst = !messages.some((m) => m.role === "user") && !thinking;

  return (
    <div className="flex flex-col h-screen bg-cream">
      {/* Header */}
      <header className="flex items-center justify-between px-6 md:px-10 py-4 bg-cream border-b border-border/60 flex-shrink-0">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.push("/")}
            aria-label="Back to home"
            className="text-taupe hover:text-dark transition-colors"
          >
            <ArrowLeft size={15} strokeWidth={1.5} />
          </button>
          <div className="flex items-center gap-3">
            <span className="font-display text-base font-600 tracking-widest uppercase text-dark">
              {brandName}
            </span>
            <span className="text-border text-xs">·</span>
            <div className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-gold animate-pulse" />
              <span className="font-sans text-xs tracking-[0.12em] uppercase text-taupe">
                {agentName}
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {messages.some((m) => m.role === "user") && (
            <button
              onClick={clearChat}
              aria-label="Clear chat"
              className="font-sans text-[10px] tracking-[0.1em] uppercase text-taupe hover:text-dark transition-colors border border-border px-2 py-1 hover:border-dark"
            >
              Clear
            </button>
          )}
          <button
            onClick={() => router.push("/orders")}
            aria-label="My orders"
            className="text-taupe hover:text-dark transition-colors"
          >
            <Package size={16} strokeWidth={1.5} />
          </button>
          <button
            onClick={() => setCartOpen(true)}
            aria-label={`Open cart${cartCount > 0 ? ` (${cartCount} items)` : ""}`}
            className="relative group"
          >
            <ShoppingBag
              size={18}
              strokeWidth={1.5}
              className="text-taupe group-hover:text-dark transition-colors"
            />
            {cartCount > 0 && (
              <span className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-gold text-dark text-[9px] font-700 font-sans rounded-full flex items-center justify-center">
                {cartCount}
              </span>
            )}
          </button>
        </div>
      </header>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto scrollbar-thin">
        <div className="max-w-2xl mx-auto px-4 md:px-6 py-8 space-y-6">
          {messages.map((m) => (
            <MessageBubble
              key={m.id}
              message={m}
              onAddToCart={addToCart}
              onTryOn={setVtoProduct}
            />
          ))}
          {thinking && <TypingIndicator />}
          <div ref={bottomRef} />
        </div>
      </div>

      {/* Input */}
      <div className="bg-cream border-t border-border/60 flex-shrink-0">
        <div className="max-w-2xl mx-auto px-4 md:px-6 py-5">
          <ChatInput
            onSend={sendMessage}
            onImageSend={handleImageSend}
            disabled={thinking}
            showSuggestions={isFirst}
            agentName={agentName}
            suggestions={occasionSuggestions}
          />
        </div>
      </div>

      {vtoProduct && (
        <VTOWidget product={vtoProduct} onClose={() => setVtoProduct(null)} />
      )}
      <CartDrawer
        items={cartItems}
        open={cartOpen}
        onClose={() => setCartOpen(false)}
        onUpdateQty={updateQty}
        onRemove={removeItem}
        onCheckoutComplete={handleCheckoutComplete}
        agentName={agentName}
      />
    </div>
  );
}
