"use client";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { DEMO_PRODUCTS } from "@/data/products";
import { StorefrontHeader } from "@/components/storefront/StorefrontHeader";
import { FloatingChatWidget } from "@/components/storefront/FloatingChatWidget";
import { SeasonalBanner } from "@/components/storefront/SeasonalBanner";
import { AIFeaturesShowcase } from "@/components/storefront/AIFeaturesShowcase";
import { WishlistButton } from "@/components/storefront/WishlistButton";
import { useBrand } from "@/lib/brand-context";

const CATEGORIES = [
  {
    label: "Women's Ethnic",
    sub: "Kurtas, Suits & Sets",
    href: "/shop?gender=female&category=Ethnic+Suits",
    image: "https://cdn.shopify.com/s/files/1/0266/6276/4597/files/301063880LILAC_1_c20748ad-57a2-4348-adef-fc96213cbad3.jpg?v=1779095828",
  },
  {
    label: "Women's Western",
    sub: "Tops, Dresses & Denim",
    href: "/shop?gender=female&category=Dresses",
    image: "https://cdn.shopify.com/s/files/1/0266/6276/4597/files/301064134LTMIDWASH_1.jpg?v=1778833305",
  },
  {
    label: "Men's Formals",
    sub: "Shirts, Trousers & More",
    href: "/shop?gender=male&q=formal+shirts+trousers+men",
    image: "https://cdn.shopify.com/s/files/1/0266/6276/4597/files/301056651NAVY_1_1.jpg?v=1778870576",
  },
  {
    label: "Loungewear",
    sub: "Comfortable Everyday",
    href: "/shop?category=Loungewear",
    image: "https://cdn.shopify.com/s/files/1/0266/6276/4597/files/301062229BLACK_1.jpg?v=1778769578",
  },
];

const FEATURED = DEMO_PRODUCTS.slice(0, 8);

// NEW / SALE badge map by index in FEATURED array
const FEATURED_BADGES: Record<number, "NEW" | "SALE"> = {
  0: "NEW",
  2: "SALE",
  4: "NEW",
  5: "SALE",
  7: "NEW",
};

export default function HomePage() {
  const brand = useBrand();
  return (
    <div className="min-h-screen bg-white">
      <style>{`
        @keyframes heroFadeUp {
          from { opacity: 0; transform: translateY(22px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes heroFadeIn {
          from { opacity: 0; }
          to   { opacity: 1; }
        }
        @keyframes tileSlideUp {
          from { opacity: 0; transform: translateY(30px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .hero-text-1 { animation: heroFadeUp 0.65s ease-out both; animation-delay: 0ms; }
        .hero-text-2 { animation: heroFadeUp 0.65s ease-out both; animation-delay: 100ms; }
        .hero-text-3 { animation: heroFadeUp 0.65s ease-out both; animation-delay: 220ms; }
        .hero-text-4 { animation: heroFadeUp 0.65s ease-out both; animation-delay: 340ms; }
        .hero-img-1  { animation: heroFadeIn 0.9s ease-out both; animation-delay: 250ms; }
        .hero-img-2  { animation: heroFadeIn 0.9s ease-out both; animation-delay: 400ms; }
        .hero-img-3  { animation: heroFadeIn 0.9s ease-out both; animation-delay: 520ms; }
      `}</style>

      <StorefrontHeader />
      <SeasonalBanner />

      {/* Hero */}
      <section className="relative bg-[#F7F4F0] overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-0 min-h-[440px]">

            {/* Text */}
            <div className="flex flex-col justify-center pt-3 pb-20 lg:pt-4 lg:pb-32 pr-0 lg:pr-16">
              <p className="hero-text-1 font-mono text-[10px] tracking-[0.3em] uppercase text-taupe mb-4">
                New Season · Summer 2026
              </p>
              <h1 className="hero-text-2 font-display text-[3rem] sm:text-[4rem] lg:text-[4.5rem] leading-[0.92] font-300 text-dark mb-3">
                Style that<br />
                <span className="italic font-600">speaks</span> for<br />
                itself.
              </h1>
              <p className="hero-text-3 font-sans text-sm text-taupe leading-relaxed max-w-xs mt-4 mb-6">
                Discover the latest from {brand.name} — ethnic sets, western wear, and everything in between. Browse freely or let our AI stylist curate your look.
              </p>
              <div className="hero-text-4 flex flex-wrap gap-3">
                <Link
                  href="/shop"
                  className="inline-flex items-center gap-2 bg-dark text-cream font-sans text-xs tracking-[0.15em] uppercase px-6 py-3 hover:bg-warm transition-colors duration-200"
                >
                  Shop Now <ArrowRight size={13} strokeWidth={1.5} />
                </Link>
                <Link
                  href="/chat"
                  className="inline-flex items-center gap-2 border border-dark text-dark font-sans text-xs tracking-[0.15em] uppercase px-6 py-3 hover:bg-dark hover:text-cream transition-all duration-200"
                >
                  ✦ Ask AI Stylist
                </Link>
              </div>
            </div>

            {/* Image grid */}
            <div className="hidden lg:grid grid-cols-2 gap-2 py-5">
              <div className="hero-img-1 relative overflow-hidden">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={DEMO_PRODUCTS[0].image_urls[0]}
                  alt={DEMO_PRODUCTS[0].title}
                  className="w-full h-full object-cover object-top"
                />
              </div>
              <div className="flex flex-col gap-2">
                <div className="hero-img-2 relative overflow-hidden flex-1">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={DEMO_PRODUCTS[1].image_urls[0]}
                    alt={DEMO_PRODUCTS[1].title}
                    className="w-full h-full object-cover object-top"
                  />
                </div>
                <div className="hero-img-3 relative overflow-hidden flex-1">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={DEMO_PRODUCTS[3].image_urls[0]}
                    alt={DEMO_PRODUCTS[3].title}
                    className="w-full h-full object-cover object-top"
                  />
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* Category tiles */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
        <div className="flex items-center justify-between mb-8">
          <h2 className="font-display text-2xl font-400 text-dark">Shop by Category</h2>
          <Link href="/shop" className="font-sans text-xs tracking-[0.12em] uppercase text-taupe hover:text-dark transition-colors flex items-center gap-1.5">
            View All <ArrowRight size={12} strokeWidth={1.5} />
          </Link>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {CATEGORIES.map((cat, idx) => (
            <Link
              key={cat.label}
              href={cat.href}
              className="group relative overflow-hidden bg-[#F7F4F0] block"
              style={{ aspectRatio: "3/4", animation: "tileSlideUp 0.6s ease-out both", animationDelay: `${idx * 80}ms` }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={cat.image}
                alt={cat.label}
                className="w-full h-full object-cover object-top transition-transform duration-500 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-dark/60 via-transparent to-transparent" />
              <div className="absolute bottom-0 left-0 right-0 p-4">
                <p className="font-display text-cream text-lg font-500 leading-tight">{cat.label}</p>
                <p className="font-sans text-cream/70 text-[11px] mt-0.5">{cat.sub}</p>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Featured products */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-16">
        <div className="flex items-center justify-between mb-8">
          <h2 className="font-display text-2xl font-400 text-dark">Featured Products</h2>
          <Link href="/shop" className="font-sans text-xs tracking-[0.12em] uppercase text-taupe hover:text-dark transition-colors flex items-center gap-1.5">
            View All <ArrowRight size={12} strokeWidth={1.5} />
          </Link>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-5">
          {FEATURED.map((product, idx) => (
            <div
              key={product.id}
              className="group"
              style={{ animation: "tileSlideUp 0.6s ease-out both", animationDelay: `${idx * 60}ms` }}
            >
              <Link href={`/products/${product.handle}`} className="block">
              <div className="relative overflow-hidden bg-[#F7F4F0] mb-3" style={{ aspectRatio: "3/4" }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={product.image_urls[0]}
                  alt={product.title}
                  className="w-full h-full object-cover object-top transition-transform duration-500 group-hover:scale-105"
                />
                {product.image_urls[1] && (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img
                    src={product.image_urls[1]}
                    alt={product.title}
                    className="absolute inset-0 w-full h-full object-cover object-top opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                  />
                )}
                {FEATURED_BADGES[idx] && (
                  <div className={`absolute top-2.5 left-2.5 font-sans text-[9px] tracking-[0.15em] uppercase px-2 py-0.5 ${FEATURED_BADGES[idx] === "SALE" ? "bg-red-500 text-white" : "bg-dark text-cream"}`}>
                    {FEATURED_BADGES[idx]}
                  </div>
                )}
                <div className="absolute top-2.5 right-2.5 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                  <WishlistButton productId={product.id} />
                </div>
                <div className="absolute bottom-0 left-0 right-0 translate-y-full group-hover:translate-y-0 transition-transform duration-300">
                  <div className="bg-dark text-cream font-sans text-[11px] tracking-[0.1em] uppercase text-center py-2.5">
                    View Product
                  </div>
                </div>
              </div>
              <div>
                <p className="font-sans text-[11px] text-taupe tracking-wide uppercase mb-0.5">{product.vendor}</p>
                <p className="font-sans text-sm text-dark line-clamp-2 leading-snug mb-1.5">{product.title}</p>
                <p className="font-display text-base font-500 text-dark">₹{product.price.toLocaleString("en-IN")}</p>
              </div>
              </Link>
            </div>
          ))}
        </div>
      </section>

      {/* AI Feature strip */}
      <section className="bg-dark py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p className="font-mono text-[10px] tracking-[0.3em] uppercase text-gold/70 mb-4">AI-Powered Shopping</p>
          <h2 className="font-display text-3xl sm:text-4xl font-300 text-cream mb-3">
            Your personal <span className="italic">AI stylist</span> is here
          </h2>
          <p className="font-sans text-sm text-cream/50 max-w-md mx-auto mb-8 leading-relaxed">
            Describe what you need — occasion, budget, vibe — and our AI finds the perfect pieces. Try them on virtually before you buy.
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <Link
              href="/chat"
              className="inline-flex items-center gap-2 bg-gold text-dark font-sans text-xs tracking-[0.15em] uppercase px-7 py-3.5 hover:bg-gold/90 transition-colors duration-200"
            >
              ✦ Start Styling
            </Link>
            <Link
              href="/shop"
              className="inline-flex items-center gap-2 border border-cream/20 text-cream font-sans text-xs tracking-[0.15em] uppercase px-7 py-3.5 hover:bg-white/10 transition-colors duration-200"
            >
              Browse Catalog
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-px mt-16 border-t border-white/10 pt-12">
            {[
              { icon: "✦", title: "Natural Language Search", desc: "Say \"a blue dress for a beach wedding under ₹2000\" — AI finds it instantly." },
              { icon: "◎", title: "Virtual Try-On", desc: "Upload your photo and see any garment on you before buying." },
              { icon: "◈", title: "Outfit Building", desc: "Ask for a complete look and AI curates top, bottom, and accessories." },
            ].map((f) => (
              <div key={f.title} className="py-8 px-6 text-center">
                <div className="text-gold text-xl mb-3">{f.icon}</div>
                <p className="font-display text-cream text-base italic mb-2">{f.title}</p>
                <p className="font-sans text-cream/40 text-xs leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <AIFeaturesShowcase />

      <footer className="border-t border-gray-100 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-8 mb-10">
            <div>
              <p className="font-display text-dark text-base mb-4">{brand.name}</p>
              <p className="font-sans text-xs text-taupe leading-relaxed">{brand.tagline}</p>
            </div>
            <div>
              <p className="font-sans text-[10px] tracking-[0.2em] uppercase text-taupe mb-3">Shop</p>
              <ul className="space-y-2">
                {["Women", "Men", "Ethnic Wear", "New Arrivals"].map((l) => (
                  <li key={l}><Link href="/shop" className="font-sans text-xs text-taupe hover:text-dark transition-colors">{l}</Link></li>
                ))}
              </ul>
            </div>
            <div>
              <p className="font-sans text-[10px] tracking-[0.2em] uppercase text-taupe mb-3">Help</p>
              <ul className="space-y-2">
                {["Size Guide", "Returns", "Track Order", "Contact Us"].map((l) => (
                  <li key={l}><span className="font-sans text-xs text-taupe">{l}</span></li>
                ))}
              </ul>
            </div>
            <div>
              <p className="font-sans text-[10px] tracking-[0.2em] uppercase text-taupe mb-3">AI Features</p>
              <ul className="space-y-2">
                <li><Link href="/chat" className="font-sans text-xs text-taupe hover:text-dark transition-colors">AI Stylist Chat</Link></li>
                <li><span className="font-sans text-xs text-taupe">Virtual Try-On</span></li>
                <li><span className="font-sans text-xs text-taupe">Style Recommendations</span></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-100 pt-6 flex flex-col sm:flex-row items-center justify-between gap-3">
            <p className="font-sans text-[11px] text-taupe">© 2025 {brand.name}. All rights reserved.</p>
            <p className="font-sans text-[11px] text-taupe">Built with Next.js · AI by OpenRouter · Try-On by fal.ai</p>
          </div>
        </div>
      </footer>

      <FloatingChatWidget />
    </div>
  );
}
