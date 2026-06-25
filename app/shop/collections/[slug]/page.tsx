"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { Collection, Product } from "@/types";
import { StorefrontHeader } from "@/components/storefront/StorefrontHeader";
import { FloatingChatWidget } from "@/components/storefront/FloatingChatWidget";
import { WishlistButton } from "@/components/storefront/WishlistButton";
import { recordHover } from "@/lib/behavior-tracker";
import { useRef } from "react";

function ProductCard({ product }: { product: Product }) {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  return (
    <Link
      href={`/products/${product.handle}`}
      className="group block"
      onMouseEnter={() => { timerRef.current = setTimeout(() => recordHover(product, 1500), 1500); }}
      onMouseLeave={() => { if (timerRef.current) { clearTimeout(timerRef.current); timerRef.current = null; } }}
    >
      <div className="relative overflow-hidden bg-[#F7F4F0] mb-3" style={{ aspectRatio: "3/4" }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={product.image_urls[0]} alt={product.title}
          className="w-full h-full object-cover object-top transition-transform duration-500 group-hover:scale-105" />
        {product.image_urls[1] && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={product.image_urls[1]} alt={product.title}
            className="absolute inset-0 w-full h-full object-cover object-top opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
        )}
        {product.is_new && (
          <div className="absolute top-0 left-0 bg-[#C9A84C] text-white font-mono text-[9px] tracking-widest px-2 py-1 uppercase">New</div>
        )}
        <div className="absolute bottom-0 left-0 right-0 translate-y-full group-hover:translate-y-0 transition-transform duration-300">
          <div className="bg-dark text-cream font-sans text-[11px] tracking-[0.1em] uppercase text-center py-2.5">View Product</div>
        </div>
        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
          <WishlistButton productId={product.id} />
        </div>
      </div>
      <div>
        <p className="font-sans text-[10px] text-taupe tracking-wide uppercase mb-0.5">{product.vendor}</p>
        <p className="font-sans text-sm text-dark line-clamp-2 leading-snug mb-1.5">{product.title}</p>
        <p className="font-display text-base font-500 text-dark">₹{product.price.toLocaleString("en-IN")}</p>
      </div>
    </Link>
  );
}

export default function CollectionPage() {
  const { slug } = useParams<{ slug: string }>();
  const [collection, setCollection] = useState<Collection | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!slug) return;
    fetch(`/api/collections/${slug}`)
      .then((r) => { if (r.status === 404) { setNotFound(true); return null; } return r.json(); })
      .then((d) => { if (d) { setCollection(d.collection); setProducts(d.products ?? []); } })
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));
  }, [slug]);

  return (
    <div className="min-h-screen bg-white">
      <StorefrontHeader />

      <div className="border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <nav className="flex items-center gap-2 font-sans text-xs text-taupe">
            <Link href="/" className="hover:text-dark transition-colors">Home</Link>
            <span>/</span>
            <Link href="/shop/collections" className="hover:text-dark transition-colors">Collections</Link>
            <span>/</span>
            <span className="text-dark">{collection?.name ?? slug}</span>
          </nav>
        </div>
      </div>

      {collection?.coverImage && (
        <div className="relative h-56 sm:h-72 overflow-hidden">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={collection.coverImage} alt={collection.name} className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-dark/30 flex items-end">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full pb-8">
              <h1 className="font-display text-3xl sm:text-4xl text-white font-400">{collection.name}</h1>
              {collection.description && <p className="font-sans text-sm text-white/80 mt-1">{collection.description}</p>}
            </div>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {!collection?.coverImage && (
          <>
            <h1 className="font-display text-3xl font-400 text-dark mb-1">{collection?.name ?? "Collection"}</h1>
            {collection?.description && <p className="font-sans text-sm text-taupe mb-2">{collection.description}</p>}
          </>
        )}

        {loading && (
          <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-5 mt-6">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="bg-gray-100 w-full mb-3" style={{ aspectRatio: "3/4" }} />
                <div className="h-2.5 bg-gray-100 rounded w-1/3 mb-2" />
                <div className="h-3 bg-gray-100 rounded w-4/5 mb-1.5" />
                <div className="h-3.5 bg-gray-100 rounded w-1/4" />
              </div>
            ))}
          </div>
        )}

        {notFound && !loading && (
          <div className="text-center py-24">
            <p className="font-display text-xl text-taupe">Collection not found</p>
            <Link href="/shop/collections" className="font-sans text-xs text-taupe underline mt-3 inline-block">Browse all collections</Link>
          </div>
        )}

        {!loading && !notFound && (
          <>
            <p className="font-sans text-xs text-taupe mb-6">{products.length} pieces</p>
            {products.length === 0 ? (
              <div className="text-center py-16">
                <p className="font-display text-xl text-taupe">No products in this collection yet</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-5">
                {products.map((p) => <ProductCard key={p.id} product={p} />)}
              </div>
            )}
          </>
        )}
      </div>

      <FloatingChatWidget />
    </div>
  );
}
