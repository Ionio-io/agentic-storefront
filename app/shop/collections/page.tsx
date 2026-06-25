"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Collection } from "@/types";
import { StorefrontHeader } from "@/components/storefront/StorefrontHeader";
import { FloatingChatWidget } from "@/components/storefront/FloatingChatWidget";

export default function CollectionsIndexPage() {
  const [collections, setCollections] = useState<Collection[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/collections")
      .then((r) => r.json())
      .then((d) => setCollections(d.collections ?? []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="min-h-screen bg-white">
      <StorefrontHeader />

      <div className="border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <nav className="flex items-center gap-2 font-sans text-xs text-taupe">
            <Link href="/" className="hover:text-dark transition-colors">Home</Link>
            <span>/</span>
            <span className="text-dark">Collections</span>
          </nav>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <h1 className="font-display text-3xl font-400 text-dark mb-2">Collections</h1>
        <p className="font-sans text-sm text-taupe mb-10">Curated edits, one click away.</p>

        {loading && (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="bg-gray-100 w-full mb-3" style={{ aspectRatio: "3/4" }} />
                <div className="h-3 bg-gray-100 rounded w-3/4 mb-1.5" />
                <div className="h-2.5 bg-gray-100 rounded w-1/2" />
              </div>
            ))}
          </div>
        )}

        {!loading && collections.length === 0 && (
          <div className="text-center py-24">
            <p className="font-display text-xl text-taupe">No collections yet</p>
            <p className="font-sans text-sm text-taupe mt-2">Check back soon for curated edits.</p>
          </div>
        )}

        {!loading && collections.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-6">
            {collections.map((col) => (
              <Link key={col._id} href={`/shop/collections/${col.slug}`} className="group block">
                <div className="relative overflow-hidden bg-[#F7F4F0] mb-3" style={{ aspectRatio: "3/4" }}>
                  {col.coverImage
                    // eslint-disable-next-line @next/next/no-img-element
                    ? <img src={col.coverImage} alt={col.name} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                    : <div className="w-full h-full flex items-center justify-center">
                        <span className="font-display text-2xl text-gray-200">{col.name[0]}</span>
                      </div>
                  }
                  <div className="absolute inset-0 bg-dark/0 group-hover:bg-dark/10 transition-colors duration-300" />
                  <div className="absolute bottom-0 left-0 right-0 translate-y-full group-hover:translate-y-0 transition-transform duration-300">
                    <div className="bg-dark text-cream font-sans text-[11px] tracking-[0.1em] uppercase text-center py-2.5">
                      View Collection
                    </div>
                  </div>
                </div>
                <p className="font-display text-base text-dark">{col.name}</p>
                {col.description && <p className="font-sans text-xs text-taupe mt-0.5 line-clamp-2">{col.description}</p>}
                <p className="font-mono text-[10px] text-taupe mt-1">{col.productIds.length} pieces</p>
              </Link>
            ))}
          </div>
        )}
      </div>

      <FloatingChatWidget />
    </div>
  );
}
