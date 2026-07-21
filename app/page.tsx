"use client";
import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowRight, Sparkles } from "lucide-react";
import { Product } from "@/types";
import { StorefrontHeader } from "@/components/storefront/StorefrontHeader";
import { WishlistButton } from "@/components/storefront/WishlistButton";

const CATEGORY_TILES_BASE = [
  {
    label: "Top Wear",
    sub: "Shirts, Polos & Tees",
    href: "/shop?gender=male&mainCat=Tops",
    imageKey: "tops" as const,
  },
  {
    label: "Bottom Wear",
    sub: "Jeans, Trousers & Cargos",
    href: "/shop?gender=male&mainCat=Bottoms",
    imageKey: "bottoms" as const,
  },
  {
    label: "New Arrivals",
    sub: "Fresh This Season",
    href: "/shop?gender=male&isNew=true",
    imageKey: "new" as const,
  },
  {
    label: "Accessories",
    sub: "Bags, Belts & More",
    href: "/shop?gender=male&mainCat=Accessories",
    imageKey: "accessories" as const,
  },
];

const FILTER_TABS = ["All", "Shirts", "T-Shirts", "Polo", "Cargos", "Jeans", "Trousers", "Jacket", "Shacket", "Hoodies"];

const PROMPTS = [
  "Sharp office shirts under ₹1500",
  "Smart casual look for the weekend",
  "Complete night-out outfit",
  "Slim fit polo under ₹1500",
  "Check shirt for casual outings",
];

export default function HomePage() {
  const router = useRouter();
  const [aiQuery, setAiQuery] = useState("");
  const [activeTab, setActiveTab] = useState("All");
  const [placeholder, setPlaceholder] = useState(PROMPTS[0]);
  const [isFocused, setIsFocused] = useState(false);
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [catImages, setCatImages] = useState<Record<string, string>>({
    tops: "",
    bottoms: "",
    new: "",
    accessories: "",
  });
  const inputRef = useRef<HTMLInputElement>(null);

  // Fetch one product per category for tile images
  useEffect(() => {
    Promise.all([
      fetch("/api/catalog?gender=male&type=Shirts&limit=2").then((r) => r.json()),
      fetch("/api/catalog?gender=male&type=Trousers&limit=2").then((r) => r.json()),
      fetch("/api/catalog?gender=male&isNew=true&type=Polo&limit=2").then((r) => r.json()),
      fetch("/api/catalog?gender=male&type=Sunglasses&limit=2").then((r) => r.json()),
    ])
      .then(([shirts, bottoms, newArrivals, acc]) => {
        const pick = (data: { products?: Product[] }) => {
          const products = data.products ?? [];
          const withImg = products.find((p) => p.image_urls?.[0]);
          return withImg?.image_urls?.[0] ?? "";
        };
        setCatImages({
          tops: pick(shirts),
          bottoms: pick(bottoms),
          new: pick(newArrivals),
          accessories: pick(acc),
        });
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    const cat = activeTab === "All" ? "" : activeTab;
    const url = cat
      ? `/api/catalog?gender=male&limit=8&type=${encodeURIComponent(cat)}`
      : `/api/catalog?gender=male&limit=8`;
    fetch(url)
      .then((r) => r.json())
      .then((data: { products?: Product[] }) => {
        setFeaturedProducts(data.products ?? []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [activeTab]);

  useEffect(() => {
    if (isFocused) return;
    let promptIdx = 0;
    let charIdx = PROMPTS[0].length;
    let deleting = true;
    let tid: ReturnType<typeof setTimeout>;
    function tick() {
      const current = PROMPTS[promptIdx];
      if (deleting) {
        charIdx = Math.max(0, charIdx - 1);
        setPlaceholder(current.slice(0, charIdx));
        if (charIdx === 0) {
          deleting = false;
          promptIdx = (promptIdx + 1) % PROMPTS.length;
          tid = setTimeout(tick, 350);
        } else {
          tid = setTimeout(tick, 28);
        }
      } else {
        const next = PROMPTS[promptIdx];
        charIdx = Math.min(next.length, charIdx + 1);
        setPlaceholder(next.slice(0, charIdx));
        if (charIdx === next.length) {
          deleting = true;
          tid = setTimeout(tick, 2200);
        } else {
          tid = setTimeout(tick, 55);
        }
      }
    }
    tid = setTimeout(tick, 1200);
    return () => clearTimeout(tid);
  }, [isFocused]);

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (!aiQuery.trim()) return;
    router.push(`/chat?q=${encodeURIComponent(aiQuery.trim())}`);
  }

  return (
    <div className="min-h-screen bg-white">
      <StorefrontHeader />

      {/* Hero */}
      <section className="relative bg-[#F8F8F8] border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-20">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left: text + AI search */}
            <div>
              <div className="inline-flex items-center gap-2 bg-[#EE4740]/10 text-[#EE4740] rounded-full px-3 py-1 mb-6">
                <Sparkles size={12} />
                <span className="font-sans text-[11px] font-semibold tracking-wide uppercase">AI-Powered Styling</span>
              </div>
              <h1 className="font-display text-[2.8rem] sm:text-[3.5rem] lg:text-[4rem] leading-[1.0] font-300 text-gray-900 mb-4">
                Shop All<br />
                <span className="text-[#EE4740] font-600">Menswear</span>
              </h1>
              <p className="font-sans text-base text-gray-500 leading-relaxed max-w-sm mb-8">
                India&apos;s sharpest menswear — shirts, polos, jeans, trousers, and everything in between. Styled by Leo, your AI stylist.
              </p>

              {/* AI Search */}
              <form onSubmit={handleSearch} className="flex items-center bg-white border-2 border-[#EE4740] max-w-md mb-4">
                <span className="pl-4 pr-2 text-[#EE4740] text-sm flex-shrink-0">✦</span>
                <input
                  ref={inputRef}
                  type="text"
                  value={aiQuery}
                  onChange={(e) => setAiQuery(e.target.value)}
                  onFocus={() => setIsFocused(true)}
                  onBlur={() => setIsFocused(false)}
                  placeholder={placeholder}
                  className="flex-1 font-sans text-sm text-gray-800 placeholder:text-gray-300 outline-none bg-transparent py-3.5 pr-2"
                />
                <button
                  type="submit"
                  className="flex-shrink-0 m-1.5 bg-[#EE4740] text-white px-4 py-2 font-sans text-xs tracking-widest uppercase hover:bg-red-600 transition-colors"
                >
                  Ask Leo
                </button>
              </form>

              {/* Quick prompts */}
              <div className="flex flex-wrap gap-2">
                {PROMPTS.slice(0, 3).map((p) => (
                  <button
                    key={p}
                    onClick={() => router.push(`/chat?q=${encodeURIComponent(p)}`)}
                    className="font-sans text-[11px] text-gray-500 border border-gray-200 px-3 py-1.5 hover:border-[#EE4740] hover:text-[#EE4740] transition-all duration-150 rounded-sm"
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>

            {/* Right: category tiles 2x2 */}
            <div className="hidden lg:grid grid-cols-2 gap-3 h-[460px]">
              {CATEGORY_TILES_BASE.map((cat) => {
                const img = catImages[cat.imageKey];
                return (
                  <Link
                    key={cat.label}
                    href={cat.href}
                    className="group relative overflow-hidden block bg-gray-100"
                  >
                    {img && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={img}
                        alt={cat.label}
                        className="w-full h-full object-cover object-top transition-transform duration-500 group-hover:scale-105"
                      />
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/10 to-transparent" />
                    <div className="absolute bottom-0 left-0 right-0 p-4">
                      <p className="font-display text-white text-base font-600 leading-tight uppercase tracking-wide">{cat.label}</p>
                      <p className="font-sans text-white/70 text-[11px] mt-0.5">{cat.sub}</p>
                    </div>
                    <div className="absolute top-2.5 right-2.5 opacity-0 group-hover:opacity-100 transition-opacity">
                      <div className="bg-[#EE4740] text-white w-7 h-7 flex items-center justify-center">
                        <ArrowRight size={12} strokeWidth={2} />
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* Category tiles — mobile */}
      <section className="lg:hidden max-w-7xl mx-auto px-4 sm:px-6 py-8">
        <div className="grid grid-cols-2 gap-3">
          {CATEGORY_TILES_BASE.map((cat) => {
            const img = catImages[cat.imageKey];
            return (
              <Link
                key={cat.label}
                href={cat.href}
                className="group relative overflow-hidden block bg-gray-100"
                style={{ aspectRatio: "4/5" }}
              >
                {img && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={img} alt={cat.label} className="w-full h-full object-cover object-top" />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-3">
                  <p className="font-display text-white text-sm font-600 uppercase">{cat.label}</p>
                  <p className="font-sans text-white/70 text-[10px]">{cat.sub}</p>
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      {/* Shop All Menswear */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex items-center justify-between mb-6">
          <h2 className="font-display text-2xl font-400 text-gray-900 uppercase tracking-wide">Shop All Menswear</h2>
          <Link href="/shop?gender=male" className="font-sans text-xs tracking-[0.12em] uppercase text-[#EE4740] hover:underline flex items-center gap-1">
            View All <ArrowRight size={12} strokeWidth={2} />
          </Link>
        </div>

        {/* Filter tabs */}
        <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide mb-8 pb-2">
          {FILTER_TABS.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-shrink-0 font-sans text-[12px] tracking-wide px-4 py-2 rounded-full border transition-colors duration-150 ${
                activeTab === tab
                  ? "bg-[#EE4740] text-white border-[#EE4740]"
                  : "bg-white text-gray-600 border-gray-200 hover:border-[#EE4740] hover:text-[#EE4740]"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Product grid */}
        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="bg-gray-100 mb-3" style={{ aspectRatio: "3/4" }} />
                <div className="h-3 bg-gray-100 rounded mb-2 w-3/4" />
                <div className="h-3 bg-gray-100 rounded w-1/2" />
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {featuredProducts.map((product) => {
              const isSale = product.price_override != null && product.price_override < product.price;
              const badge = isSale ? "SALE" : product.is_new ? "NEW" : null;
              return (
                <div key={product.id} className="group">
                  <Link href={`/products/${product.handle}`} className="block">
                    <div className="relative overflow-hidden bg-[#F5F5F5] mb-3" style={{ aspectRatio: "3/4" }}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={product.image_urls[0]}
                        alt={product.title}
                        className="w-full h-full object-cover object-top transition-transform duration-500 group-hover:scale-105"
                      />
                      {product.image_urls[1] && (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={product.image_urls[1]}
                          alt={product.title}
                          className="absolute inset-0 w-full h-full object-cover object-top opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                        />
                      )}
                      {badge && (
                        <div className={`absolute top-2 left-2 font-sans text-[9px] tracking-[0.15em] uppercase px-2 py-0.5 font-semibold ${badge === "SALE" ? "bg-[#EE4740] text-white" : "bg-gray-900 text-white"}`}>
                          {badge}
                        </div>
                      )}
                      <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                        <WishlistButton productId={product.id} />
                      </div>
                      <div className="absolute bottom-0 left-0 right-0 translate-y-full group-hover:translate-y-0 transition-transform duration-300">
                        <div className="bg-[#EE4740] text-white font-sans text-[11px] tracking-[0.12em] uppercase text-center py-2.5">
                          Quick View
                        </div>
                      </div>
                    </div>
                    <p className="font-sans text-[10px] text-gray-400 tracking-wide uppercase mb-0.5">{product.vendor}</p>
                    <p className="font-sans text-sm text-gray-800 line-clamp-2 leading-snug mb-1.5">{product.title}</p>
                    <p className="font-sans text-sm font-semibold text-gray-900">₹{product.price.toLocaleString("en-IN")}</p>
                  </Link>
                </div>
              );
            })}
          </div>
        )}

        <div className="text-center mt-10">
          <Link
            href="/shop?gender=male"
            className="inline-flex items-center gap-2 border-2 border-[#EE4740] text-[#EE4740] font-sans text-sm tracking-[0.12em] uppercase px-8 py-3 hover:bg-[#EE4740] hover:text-white transition-colors duration-200"
          >
            View All Menswear <ArrowRight size={14} strokeWidth={1.5} />
          </Link>
        </div>
      </section>

      {/* AI Stylist Banner */}
      <section className="bg-[#EE4740] py-14 px-4">
        <div className="max-w-2xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-white/20 text-white rounded-full px-3 py-1 mb-5">
            <Sparkles size={12} />
            <span className="font-sans text-[11px] font-semibold tracking-wide uppercase">Meet Leo</span>
          </div>
          <h2 className="font-display text-3xl sm:text-4xl font-300 text-white mb-3 leading-tight">
            Your Personal AI Stylist
          </h2>
          <p className="font-sans text-white/80 text-sm leading-relaxed mb-8 max-w-md mx-auto">
            Tell Leo your occasion, budget, or vibe — and he&apos;ll build complete outfits from The Bear House catalog, just for you.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              href="/chat"
              className="inline-flex items-center gap-2 bg-white text-[#EE4740] font-sans text-sm tracking-[0.1em] uppercase px-8 py-3 font-semibold hover:bg-gray-50 transition-colors"
            >
              Chat with Leo <ArrowRight size={14} strokeWidth={2} />
            </Link>
            <Link
              href="/shop"
              className="inline-flex items-center gap-2 border border-white/50 text-white font-sans text-sm tracking-[0.1em] uppercase px-8 py-3 hover:bg-white/10 transition-colors"
            >
              Browse Catalog
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-8 mb-10">
            <div className="col-span-2 sm:col-span-1">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/logo-tbh.svg" alt="The Bear House" className="h-7 w-auto mb-4 brightness-0 invert" />
              <p className="font-sans text-xs text-gray-400 leading-relaxed">Dress Sharp. Live Bold.</p>
            </div>
            <div>
              <p className="font-sans text-[10px] tracking-[0.2em] uppercase text-gray-500 mb-4">Shop</p>
              <ul className="space-y-2.5">
                {["Shirts", "Polo", "T-Shirts", "Jeans", "Trousers"].map((l) => (
                  <li key={l}>
                    <Link href={`/shop?gender=male&category=${l}`} className="font-sans text-xs text-gray-400 hover:text-white transition-colors">{l}</Link>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <p className="font-sans text-[10px] tracking-[0.2em] uppercase text-gray-500 mb-4">Help</p>
              <ul className="space-y-2.5">
                {[{ label: "Size Guide", href: "/shop" }, { label: "Returns & Exchange", href: "/shop" }, { label: "Track Order", href: "/orders" }, { label: "Contact Us", href: "/chat" }].map((l) => (
                  <li key={l.label}><Link href={l.href} className="font-sans text-xs text-gray-400 hover:text-white transition-colors">{l.label}</Link></li>
                ))}
              </ul>
            </div>
            <div>
              <p className="font-sans text-[10px] tracking-[0.2em] uppercase text-gray-500 mb-4">AI Features</p>
              <ul className="space-y-2.5">
                <li><Link href="/chat" className="font-sans text-xs text-gray-400 hover:text-white transition-colors">Leo — AI Stylist</Link></li>
                <li><span className="font-sans text-xs text-gray-400">Virtual Try-On</span></li>
                <li><span className="font-sans text-xs text-gray-400">Style Recommendations</span></li>
                <li><span className="font-sans text-xs text-gray-400">Outfit Builder</span></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 pt-6 flex flex-col sm:flex-row items-center justify-between gap-3">
            <p className="font-sans text-[11px] text-gray-500">© {new Date().getFullYear()} The Bear House. All rights reserved.</p>
            <p className="font-sans text-[11px] text-gray-600">Powered by Ionio AI</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
