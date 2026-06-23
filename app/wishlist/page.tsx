"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { Heart, ArrowLeft } from "lucide-react";
import { DEMO_PRODUCTS } from "@/data/products";
import { getLocalProfile, saveLocalProfile } from "@/lib/style-memory";
import { StorefrontHeader } from "@/components/storefront/StorefrontHeader";
import { FloatingChatWidget } from "@/components/storefront/FloatingChatWidget";

export default function WishlistPage() {
  const [savedIds, setSavedIds] = useState<string[]>([]);

  useEffect(() => {
    const profile = getLocalProfile();
    setSavedIds(profile?.savedProductIds ?? []);
  }, []);

  function remove(productId: string) {
    const profile = getLocalProfile() ?? {};
    const updated = (profile.savedProductIds ?? []).filter((id) => id !== productId);
    saveLocalProfile({ savedProductIds: updated });
    setSavedIds(updated);
    fetch("/api/wishlist", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ productId }),
    }).catch(() => {});
  }

  const savedProducts = DEMO_PRODUCTS.filter((p) => savedIds.includes(p.id));

  return (
    <div className="min-h-screen bg-white">
      <StorefrontHeader />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Link href="/shop" className="text-taupe hover:text-dark transition-colors">
            <ArrowLeft size={16} strokeWidth={1.5} />
          </Link>
          <div className="flex items-center gap-2.5">
            <Heart size={18} strokeWidth={1.5} className={savedProducts.length > 0 ? "fill-red-500 text-red-500" : "text-taupe"} />
            <h1 className="font-display text-2xl font-400 text-dark">Wishlist</h1>
            {savedProducts.length > 0 && (
              <span className="font-sans text-sm text-taupe">· {savedProducts.length} {savedProducts.length === 1 ? "item" : "items"}</span>
            )}
          </div>
        </div>

        {savedProducts.length === 0 ? (
          <div className="text-center py-24 border border-dashed border-gray-200 bg-[#FAFAF8]">
            <Heart size={36} strokeWidth={1} className="text-gray-200 mx-auto mb-4" />
            <p className="font-display text-xl font-300 text-dark mb-2">Your wishlist is empty</p>
            <p className="font-sans text-sm text-taupe mb-7 max-w-xs mx-auto leading-relaxed">
              Tap the heart on any product to save it here for later.
            </p>
            <Link
              href="/shop"
              className="inline-flex items-center gap-2 bg-dark text-cream font-sans text-xs tracking-[0.15em] uppercase px-6 py-3 hover:bg-warm transition-colors"
            >
              Browse Products
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-5">
            {savedProducts.map((product) => (
              <div key={product.id} className="group">
                <Link href={`/products/${product.handle}`} className="block">
                  <div className="relative overflow-hidden bg-[#F7F4F0] mb-3" style={{ aspectRatio: "3/4" }}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={product.image_urls[0]}
                      alt={product.title}
                      className="w-full h-full object-cover object-top transition-transform duration-500 group-hover:scale-105"
                    />
                    {/* Remove button */}
                    <button
                      onClick={(e) => { e.preventDefault(); remove(product.id); }}
                      className="absolute top-2.5 right-2.5 w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-sm hover:shadow-md transition-all"
                      title="Remove from wishlist"
                    >
                      <Heart size={14} strokeWidth={1.5} className="fill-red-500 text-red-500" />
                    </button>
                  </div>
                </Link>
                <p className="font-sans text-[10px] text-taupe tracking-wide uppercase mb-0.5">{product.vendor}</p>
                <p className="font-sans text-sm text-dark line-clamp-2 leading-snug mb-1.5">{product.title}</p>
                <p className="font-display text-base font-500 text-dark">₹{product.price.toLocaleString("en-IN")}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      <FloatingChatWidget />
    </div>
  );
}
