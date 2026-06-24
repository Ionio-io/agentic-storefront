"use client";
import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ShoppingBag } from "lucide-react";
import { Product, CartItem } from "@/types";
import { clsx } from "clsx";

interface Props {
  product: Product;
  onAddToCart: (item: CartItem) => void;
  onTryOn: (product: Product) => void;
}

export function ProductCard({ product, onAddToCart, onTryOn }: Props) {
  const [selectedSize, setSelectedSize] = useState<string>("");
  const [added, setAdded] = useState(false);
  const [hovered, setHovered] = useState(false);

  function handleAdd() {
    if (!selectedSize) return;
    onAddToCart({ product, size: selectedSize, quantity: 1 });
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  }

  const imgSrc = hovered && product.image_urls[1]
    ? product.image_urls[1]
    : product.image_urls[0];

  return (
    <div className="group bg-white border border-border hover:border-gold/40 transition-colors duration-300 w-56 flex-shrink-0 overflow-hidden">
      {/* Image */}
      <div
        className="relative h-64 bg-ivory overflow-hidden cursor-pointer"
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        onClick={() => onTryOn(product)}
      >
        <Image
          src={imgSrc}
          alt={product.title}
          fill
          className="object-cover object-top transition-all duration-700 group-hover:scale-[1.04]"
          sizes="224px"
          unoptimized
        />

        {/* Try-on overlay */}
        <div className="absolute inset-0 bg-dark/0 group-hover:bg-dark/30 transition-all duration-300 flex items-center justify-center">
          <button
            onClick={(e) => { e.stopPropagation(); onTryOn(product); }}
            className="font-sans text-xs tracking-[0.15em] uppercase text-white bg-dark/80 backdrop-blur-sm px-4 py-2 opacity-0 group-hover:opacity-100 transition-all duration-300 translate-y-2 group-hover:translate-y-0 border border-white/20"
          >
            ✦ Try On
          </button>
        </div>

        {/* Vendor tag */}
        <span className="absolute top-2.5 left-2.5 font-sans text-[10px] tracking-[0.15em] uppercase bg-white/90 backdrop-blur-sm text-dark px-2 py-0.5">
          {product.vendor}
        </span>
      </div>

      {/* Details */}
      <div className="p-3 border-t border-border/60">
        <p className="font-sans text-[9px] tracking-[0.2em] uppercase text-taupe mb-1">
          {product.product_type}
        </p>
        <Link href={`/products/${product.handle}`} className="block group/title">
          <h3 className="font-sans text-xs font-500 text-dark leading-snug line-clamp-2 mb-2 group-hover/title:text-dark/70 transition-colors">
            {product.title}
          </h3>
          <p className="font-display italic text-gold text-base font-400 mb-3">
            ₹{product.price.toLocaleString("en-IN")}
          </p>
        </Link>

        {/* Sizes */}
        <div className="flex flex-wrap gap-1 mb-3">
          {product.sizes.map((s) => (
            <button
              key={s}
              onClick={() => setSelectedSize(s)}
              className={clsx(
                "font-sans text-[9px] tracking-wide px-1.5 py-0.5 border transition-all duration-150",
                selectedSize === s
                  ? "bg-dark border-dark text-gold"
                  : "border-border text-taupe hover:border-dark/40"
              )}
            >
              {s}
            </button>
          ))}
        </div>

        {/* Actions */}
        <div className="flex gap-1.5">
          <button
            onClick={handleAdd}
            disabled={!selectedSize || added}
            className={clsx(
              "flex-1 flex items-center justify-center gap-1.5 font-sans text-[10px] tracking-[0.1em] uppercase py-2 border transition-all duration-200",
              added
                ? "border-gold/50 bg-gold/10 text-gold"
                : selectedSize
                ? "border-dark bg-dark text-cream hover:bg-charcoal"
                : "border-border text-border cursor-not-allowed"
            )}
          >
            <ShoppingBag size={11} strokeWidth={1.5} />
            {added ? "Added" : "Add to Bag"}
          </button>
          <button
            onClick={() => onTryOn(product)}
            className="font-sans text-[10px] tracking-[0.1em] uppercase py-2 px-3 border border-gold/40 text-gold hover:bg-gold/5 transition-all duration-200"
          >
            Try
          </button>
        </div>
      </div>
    </div>
  );
}
