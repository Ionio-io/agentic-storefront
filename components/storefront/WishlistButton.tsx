"use client";
import { useState, useEffect } from "react";
import { Heart } from "lucide-react";
import { getLocalProfile, saveLocalProfile } from "@/lib/style-memory";

interface Props {
  productId: string;
  className?: string;
}

export function WishlistButton({ productId, className = "" }: Props) {
  const [saved, setSaved] = useState(false);
  const [animating, setAnimating] = useState(false);

  useEffect(() => {
    const profile = getLocalProfile();
    setSaved(profile?.savedProductIds?.includes(productId) ?? false);
  }, [productId]);

  async function toggle(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();

    const next = !saved;
    setSaved(next);
    setAnimating(true);
    setTimeout(() => setAnimating(false), 400);

    // Update localStorage
    const profile = getLocalProfile() ?? {};
    const current = profile.savedProductIds ?? [];
    const updated = next
      ? Array.from(new Set([...current, productId]))
      : current.filter((id) => id !== productId);
    saveLocalProfile({ savedProductIds: updated });

    // Sync to server
    try {
      if (next) {
        await fetch("/api/wishlist", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ productId }),
        });
        // Also log demand signal
        await fetch("/api/demand", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ productId, action: "wishlist" }),
        });
      } else {
        await fetch("/api/wishlist", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ productId }),
        });
      }
    } catch { /* silent — localStorage is source of truth */ }
  }

  return (
    <button
      onClick={toggle}
      className={`w-9 h-9 bg-white rounded-full flex items-center justify-center shadow-sm hover:shadow-md transition-all ${animating ? "scale-125" : "scale-100"} duration-200 ${className}`}
      aria-label={saved ? "Remove from wishlist" : "Add to wishlist"}
      title={saved ? "Remove from wishlist" : "Save to wishlist"}
    >
      <Heart
        size={16}
        strokeWidth={1.5}
        className={`transition-all duration-200 ${saved ? "fill-red-500 text-red-500" : "text-dark"}`}
      />
    </button>
  );
}

// Helper: wishlist count badge for header
export function useWishlistCount(): number {
  const [count, setCount] = useState(0);
  useEffect(() => {
    function read() {
      const profile = getLocalProfile();
      setCount(profile?.savedProductIds?.length ?? 0);
    }
    read();
    window.addEventListener("storage", read);
    return () => window.removeEventListener("storage", read);
  }, []);
  return count;
}
