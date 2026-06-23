"use client";
import { useState, useEffect } from "react";

interface Props {
  productId: string;
}

export function DemandBadge({ productId }: Props) {
  const [label, setLabel] = useState<string | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    let mounted = true;
    fetch(`/api/demand?productId=${encodeURIComponent(productId)}`)
      .then((r) => r.json())
      .then((data: { urgencyLabel: string | null }) => {
        if (!mounted) return;
        if (data.urgencyLabel) {
          setLabel(data.urgencyLabel);
          // Slide in after short delay for visual effect
          setTimeout(() => setVisible(true), 800);
        }
      })
      .catch(() => { /* silent */ });
    return () => { mounted = false; };
  }, [productId]);

  if (!label) return null;

  return (
    <div
      className={`flex items-center gap-2 transition-all duration-500 ${
        visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2"
      }`}
    >
      <span className="font-sans text-xs text-dark bg-gold/10 border border-gold/20 px-3 py-1.5 rounded-full">
        {label}
      </span>
    </div>
  );
}
