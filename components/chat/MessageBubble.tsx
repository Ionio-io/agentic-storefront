"use client";
import { Message, CartItem, Product } from "@/types";
import { ProductCard } from "./ProductCard";
import { clsx } from "clsx";

interface Props {
  message: Message;
  onAddToCart: (item: CartItem) => void;
  onTryOn: (product: Product) => void;
}

// Lightweight markdown renderer — handles bold, ordered/unordered lists, paragraphs
export function parseInline(text: string): React.ReactNode[] {
  const parts = text.split(/(\*\*[^*]+\*\*|\*[^*]+\*)/);
  return parts.map((part, i) => {
    if (part.startsWith("**") && part.endsWith("**")) return <strong key={i}>{part.slice(2, -2)}</strong>;
    if (part.startsWith("*") && part.endsWith("*")) return <em key={i}>{part.slice(1, -1)}</em>;
    return part;
  });
}

export function renderMarkdown(text: string): React.ReactNode {
  const lines = text.split("\n");
  const nodes: React.ReactNode[] = [];
  let i = 0;
  while (i < lines.length) {
    const line = lines[i];
    if (!line.trim()) { i++; continue; }
    // Ordered list
    if (/^\d+\.\s/.test(line)) {
      const items: string[] = [];
      while (i < lines.length && /^\d+\.\s/.test(lines[i])) {
        items.push(lines[i].replace(/^\d+\.\s+/, ""));
        i++;
      }
      nodes.push(
        <ul key={i} className="space-y-1.5 my-1.5">
          {items.map((it, j) => (
            <li key={j} className="flex gap-2.5">
              <span className="flex-shrink-0 text-gold mt-0.5">•</span>
              <span>{parseInline(it)}</span>
            </li>
          ))}
        </ul>
      );
      continue;
    }
    // Unordered list
    if (/^[-*]\s/.test(line)) {
      const items: string[] = [];
      while (i < lines.length && /^[-*]\s/.test(lines[i])) {
        items.push(lines[i].replace(/^[-*]\s+/, ""));
        i++;
      }
      nodes.push(
        <ul key={i} className="space-y-1 my-1.5">
          {items.map((it, j) => (
            <li key={j} className="flex gap-2">
              <span className="flex-shrink-0 text-taupe mt-0.5">·</span>
              <span>{parseInline(it)}</span>
            </li>
          ))}
        </ul>
      );
      continue;
    }
    nodes.push(<p key={i} className="my-1">{parseInline(line)}</p>);
    i++;
  }
  return nodes;
}

export function TypingIndicator() {
  return (
    <div className="flex items-start gap-3 animate-fade-in">
      <div className="w-6 h-6 rounded-full bg-gold/10 border border-gold/30 flex items-center justify-center flex-shrink-0 mt-0.5">
        <span className="text-gold text-[10px]">✦</span>
      </div>
      <div className="bg-white border border-border rounded-lg rounded-tl-sm px-4 py-3">
        <div className="flex gap-1.5 items-center h-4">
          {[0, 1, 2].map((i) => (
            <span
              key={i}
              className="w-1 h-1 rounded-full bg-gold animate-pulse-dot"
              style={{ animationDelay: `${i * 0.2}s` }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

export function MessageBubble({ message, onAddToCart, onTryOn }: Props) {
  const isUser = message.role === "user";

  return (
    <div
      className={clsx(
        "flex items-start gap-3 animate-fade-up",
        isUser ? "flex-row-reverse" : "flex-row"
      )}
    >
      {/* Avatar — Aria only */}
      {!isUser && (
        <div className="w-6 h-6 rounded-full bg-gold/10 border border-gold/30 flex items-center justify-center flex-shrink-0 mt-0.5">
          <span className="text-gold text-[10px]">✦</span>
        </div>
      )}

      <div className={clsx("flex flex-col gap-3", isUser ? "items-end max-w-[75%]" : "items-start max-w-[88%]")}>
        {/* Image in user message */}
        {isUser && message.imageBase64 && (
          <div className="mb-1">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={`data:image/jpeg;base64,${message.imageBase64}`}
              alt="Uploaded image"
              className="max-h-52 max-w-[260px] w-auto object-cover rounded-lg border border-border"
            />
          </div>
        )}

        {/* Bubble */}
        {message.content && (
          <div
            className={clsx(
              "text-sm leading-[1.7] px-4 py-3",
              isUser
                ? "bg-ivory border border-border rounded-lg rounded-tr-sm text-dark font-sans"
                : "bg-white border border-border/70 rounded-lg rounded-tl-sm text-dark font-sans shadow-[0_1px_4px_rgba(0,0,0,0.04)]"
            )}
          >
            {isUser ? (
              message.content
            ) : (
              <div className="text-sm leading-relaxed [&_strong]:font-600 [&_strong]:text-dark [&_ol]:list-decimal [&_ol]:pl-4 [&_ul]:list-disc [&_ul]:pl-4 [&_li]:my-0.5">
                {renderMarkdown(message.content)}
              </div>
            )}
          </div>
        )}

        {/* Product cards */}
        {message.products && message.products.length > 0 && (
          <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide -mx-1 px-1 w-[calc(100vw-6rem)] max-w-[640px]">
            {message.products.map((p) => (
              <ProductCard
                key={p.id}
                product={p}
                onAddToCart={onAddToCart}
                onTryOn={onTryOn}
              />
            ))}
          </div>
        )}

        {/* VTO result */}
        {message.vtoResult && (
          <div className="border border-border rounded-lg overflow-hidden">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={message.vtoResult}
              alt="Try-on result"
              className="w-56 object-cover"
            />
            <div className="bg-gold/5 border-t border-border px-3 py-2 text-xs text-taupe font-sans tracking-wide">
              ✦ Virtual Try-On Result
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
