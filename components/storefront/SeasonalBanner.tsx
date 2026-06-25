"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { X } from "lucide-react";
import { getPrimaryOccasion, getDaysUntil, type Occasion } from "@/lib/occasions";

const DISMISS_KEY = "agentDismissedOccasion";

export function SeasonalBanner() {
  const [occasion, setOccasion] = useState<Occasion | null>(null);
  const [dismissed, setDismissed] = useState(true); // start hidden to avoid flash

  useEffect(() => {
    const primary = getPrimaryOccasion();
    if (!primary) return;

    const dismissedId = localStorage.getItem(DISMISS_KEY);
    if (dismissedId === primary.id) return;

    setOccasion(primary);
    setDismissed(false);
  }, []);

  function dismiss(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (occasion) localStorage.setItem(DISMISS_KEY, occasion.id);
    setDismissed(true);
  }

  if (dismissed || !occasion) return null;

  const days = getDaysUntil(occasion);
  const daysLabel = days === 0 ? "today!" : days === 1 ? "tomorrow!" : `in ${days} days`;

  return (
    <div className="relative bg-charcoal border-b border-gold/20 animate-fade-in">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <Link
          href={occasion.shopPath}
          className="flex items-center justify-center gap-3 py-2.5 group"
        >
          <span className="text-gold text-sm">{occasion.emoji}</span>
          <p className="font-sans text-[12px] text-cream/90 tracking-wide">
            <span className="text-gold font-500">{occasion.name}</span>{" "}
            {daysLabel} —{" "}
            <span className="underline group-hover:text-gold transition-colors">{occasion.description}</span>
          </p>
          <span className="text-gold/60 text-xs hidden sm:block">→</span>
          {/* Color swatches */}
          <div className="hidden sm:flex items-center gap-1">
            {occasion.colorPalette.slice(0, 3).map((color) => (
              <span
                key={color}
                className="font-mono text-[9px] text-gold/50 border border-gold/20 px-1.5 py-0.5 rounded-sm"
              >
                {color}
              </span>
            ))}
          </div>
        </Link>
      </div>
      <button
        onClick={dismiss}
        className="absolute right-4 top-1/2 -translate-y-1/2 text-cream/40 hover:text-cream transition-colors p-1"
        aria-label="Dismiss"
        style={{ position: "absolute", top: "50%", right: "1rem", transform: "translateY(-50%)" }}
      >
        <X size={13} strokeWidth={1.5} />
      </button>
    </div>
  );
}
