"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { X, Sparkles } from "lucide-react";

export function FloatingChatWidget() {
  const [dismissed, setDismissed] = useState(false);
  const [showTooltip, setShowTooltip] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setShowTooltip(true), 3000);
    return () => clearTimeout(timer);
  }, []);

  if (dismissed) return null;

  return (
    <div className="fixed bottom-6 right-6 z-30 flex flex-col items-end gap-2">
      {showTooltip && (
        <div className="relative bg-dark text-cream text-xs font-sans px-4 py-2.5 rounded-2xl rounded-br-sm shadow-lg max-w-[180px] text-center leading-relaxed">
          Need styling help? Ask our AI stylist!
          <button
            onClick={() => setShowTooltip(false)}
            className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-white text-dark rounded-full flex items-center justify-center shadow-sm"
            aria-label="Dismiss"
          >
            <X size={8} strokeWidth={2.5} />
          </button>
        </div>
      )}

      <div className="flex items-center gap-2">
        <button
          onClick={() => setDismissed(true)}
          className="text-gray-400 hover:text-gray-600 transition-colors p-1"
          aria-label="Dismiss chat widget"
        >
          <X size={12} strokeWidth={2} />
        </button>
        <Link
          href="/chat"
          className="w-14 h-14 bg-dark text-cream rounded-full shadow-xl flex items-center justify-center hover:bg-warm hover:shadow-2xl transition-all duration-200 group"
          aria-label="Open AI Stylist"
        >
          <Sparkles size={22} strokeWidth={1.5} className="group-hover:scale-110 transition-transform duration-200" />
        </Link>
      </div>
    </div>
  );
}
