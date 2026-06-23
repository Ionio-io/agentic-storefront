"use client";
import { useState, useMemo, useRef, useEffect, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { SlidersHorizontal, X, ChevronDown, Search, Sparkles, Loader2, ArrowRight } from "lucide-react";
import { DEMO_PRODUCTS } from "@/data/products";
import { Product } from "@/types";
import { StorefrontHeader } from "@/components/storefront/StorefrontHeader";
import { FloatingChatWidget } from "@/components/storefront/FloatingChatWidget";
import { VisualSearch } from "@/components/storefront/VisualSearch";
import { WishlistButton } from "@/components/storefront/WishlistButton";
import { recordHover, getSessionProfile, rankProducts, type SessionProfile } from "@/lib/behavior-tracker";

const PRODUCT_TYPES = Array.from(new Set(DEMO_PRODUCTS.map((p) => p.product_type))).sort();
const PRICE_RANGES = [
  { label: "Under ₹1,000", min: 0, max: 1000 },
  { label: "₹1,000 – ₹2,000", min: 1000, max: 2000 },
  { label: "₹2,000 – ₹3,000", min: 2000, max: 3000 },
  { label: "Over ₹3,000", min: 3000, max: Infinity },
];

// ── Product card with 1500ms hover tracking ──────────────────────────────────

function TrackedProductCard({
  product,
  onHoverSignal,
}: {
  product: Product;
  onHoverSignal: () => void;
}) {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  function handleEnter() {
    timerRef.current = setTimeout(() => {
      recordHover(product, 1500);
      onHoverSignal();
    }, 1500);
  }

  function handleLeave() {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }

  return (
    <Link
      href={`/products/${product.handle}`}
      className="group block"
      onMouseEnter={handleEnter}
      onMouseLeave={handleLeave}
    >
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
        <div className="absolute bottom-0 left-0 right-0 translate-y-full group-hover:translate-y-0 transition-transform duration-300">
          <div className="bg-dark text-cream font-sans text-[11px] tracking-[0.1em] uppercase text-center py-2.5">
            View Product
          </div>
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

function ShopContent() {
  const params = useSearchParams();

  // Filter state
  const [gender, setGender] = useState<"" | "female" | "male">(
    (params.get("gender") as "female" | "male") ?? ""
  );
  const [category, setCategory] = useState(params.get("category") ?? "");
  const [priceRange, setPriceRange] = useState<number | null>(null);
  const [sort, setSort] = useState("featured");
  const [filtersOpen, setFiltersOpen] = useState(false);

  // Search state
  const [searchMode, setSearchMode] = useState<"keyword" | "ai">("keyword");
  const [keywordQuery, setKeywordQuery] = useState("");
  const [aiQuery, setAiQuery] = useState("");
  const [aiResults, setAiResults] = useState<Product[] | null>(null);
  const [aiUnderstood, setAiUnderstood] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const didAutoSearch = useRef(false);
  const [showBackToTop, setShowBackToTop] = useState(false);

  useEffect(() => {
    const onScroll = () => setShowBackToTop(window.scrollY > 400);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // AI search bar — cycling placeholder + inline ghost autocomplete
  const AI_PLACEHOLDERS = [
    "Describe what you're looking for — occasion, mood, budget…",
    "Try: festive kurta for Diwali under ₹2000",
    "Try: smart casual look for men under ₹3000",
    "Try: summer dresses for a beach trip",
    "Try: ethnic wear for a wedding function",
    "Try: office outfit for women in blue",
  ];
  const AI_AUTOCOMPLETE = [
    "Ethnic kurta for women under ₹1500",
    "Ethnic suits for women",
    "Ethnic wear for a wedding function",
    "Summer dress for beach trip",
    "Summer dresses for a beach trip",
    "Office formals for women in blue",
    "Office outfit for women in blue",
    "Smart casual shirt for men",
    "Smart casual look for men under ₹3000",
    "Formal shirts under ₹2000",
    "Formal trousers under ₹2000",
    "Casual tees in blue",
    "Casual tees in white or navy",
    "Festive kurta for Diwali under ₹2000",
    "Festive ethnic wear for Diwali",
    "Wedding guest outfit under ₹3000",
    "Loungewear for staying home",
    "Loungewear",
  ];

  const [phIdx, setPhIdx] = useState(0);
  const [phVisible, setPhVisible] = useState(true);
  const [ghostText, setGhostText] = useState("");

  useEffect(() => {
    if (searchMode !== "ai" || aiQuery) return;
    const t = setInterval(() => {
      setPhVisible(false);
      setTimeout(() => { setPhIdx((i) => (i + 1) % AI_PLACEHOLDERS.length); setPhVisible(true); }, 350);
    }, 3200);
    return () => clearInterval(t);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchMode, aiQuery]);

  function computeGhost(query: string): string {
    if (!query.trim()) return "";
    const q = query.toLowerCase();
    const match = AI_AUTOCOMPLETE.find((s) => s.toLowerCase().startsWith(q));
    return match ? match.slice(query.length) : "";
  }

  // Visual search state
  const [vsResults, setVsResults] = useState<Product[] | null>(null);
  const [vsQuery, setVsQuery] = useState("");

  // Personalization state
  const [sessionProfile, setSessionProfile] = useState<SessionProfile | null>(null);

  // Sync filter state when URL params change (e.g. clicking Women / Men in nav)
  useEffect(() => {
    setGender((params.get("gender") as "female" | "male") ?? "");
    setCategory(params.get("category") ?? "");
    setAiResults(null);
    setVsResults(null);
    setKeywordQuery("");
  }, [params]);

  // Auto-fire AI search when ?q= is in URL (from occasion banners, homepage CTAs, etc.)
  useEffect(() => {
    if (didAutoSearch.current) return;
    const q = params.get("q");
    if (!q?.trim()) return;
    didAutoSearch.current = true;
    setSearchMode("ai");
    setAiQuery(q);
    setAiLoading(true);
    fetch("/api/search", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query: q, gender: params.get("gender") ?? undefined }),
    })
      .then((r) => r.json())
      .then((data) => {
        setAiResults(data.products ?? []);
        setAiUnderstood(data.understood ?? `Showing results for "${q}"`);
      })
      .catch(() => {
        setAiResults([]);
        setAiUnderstood("Search failed — showing all products.");
      })
      .finally(() => setAiLoading(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function onHoverSignal() {
    const profile = getSessionProfile();
    if (profile.isPersonalized) setSessionProfile({ ...profile });
  }

  // Keyword-filtered products
  const filtered = useMemo(() => {
    let list = [...DEMO_PRODUCTS];
    if (gender) list = list.filter((p) => p.gender === gender);
    if (category) list = list.filter((p) => p.product_type === category);
    if (priceRange !== null) {
      const range = PRICE_RANGES[priceRange];
      list = list.filter((p) => p.price >= range.min && p.price < range.max);
    }
    if (keywordQuery.trim()) {
      const words = keywordQuery.toLowerCase().trim().split(/\s+/);
      const scored = list.map((p) => {
        const haystack = [
          p.title,
          p.vendor,
          p.product_type,
          p.description ?? "",
          ...p.tags,
        ].join(" ").toLowerCase();
        const score = words.reduce((s, w) => s + (haystack.includes(w) ? 1 : 0), 0);
        return { p, score };
      }).filter(({ score }) => score > 0);
      scored.sort((a, b) => b.score - a.score);
      list = scored.map(({ p }) => p);
    }
    if (sort === "price-asc") list.sort((a, b) => a.price - b.price);
    if (sort === "price-desc") list.sort((a, b) => b.price - a.price);
    return list;
  }, [gender, category, priceRange, keywordQuery, sort]);

  // Final display: AI results > visual search > personalized filter > filter
  const displayProducts = useMemo(() => {
    if (searchMode === "ai" && aiResults !== null) return aiResults;
    if (vsResults !== null) return vsResults;
    if (sessionProfile?.isPersonalized && sort === "featured") return rankProducts(filtered, sessionProfile);
    return filtered;
  }, [searchMode, aiResults, vsResults, filtered, sessionProfile, sort]);

  const isAiResultsActive = searchMode === "ai" && aiResults !== null;
  const isVsActive = vsResults !== null;
  const isPersonalized = !isAiResultsActive && !isVsActive && sessionProfile?.isPersonalized && sort === "featured";

  const activeFilters = [
    gender && (gender === "female" ? "Women" : "Men"),
    category,
    priceRange !== null && PRICE_RANGES[priceRange].label,
  ].filter(Boolean) as string[];

  function clearAll() {
    setGender(""); setCategory(""); setPriceRange(null); setKeywordQuery("");
    setAiResults(null); setAiQuery(""); setAiUnderstood("");
    setVsResults(null); setVsQuery("");
  }

  async function runAiSearch(e?: React.FormEvent) {
    e?.preventDefault();
    if (!aiQuery.trim() || aiLoading) return;
    setAiLoading(true);
    setAiResults(null);
    setAiUnderstood("");
    try {
      const res = await fetch("/api/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: aiQuery }),
      });
      const data = await res.json();
      setAiResults(data.products ?? []);
      setAiUnderstood(data.understood ?? "");
    } catch {
      setAiResults([]);
      setAiUnderstood("Search failed. Please try again.");
    } finally {
      setAiLoading(false);
    }
  }

  async function runQuickSearch(q: string, genderHint?: string) {
    setSearchMode("ai");
    setAiLoading(true);
    setAiResults(null);
    setAiUnderstood("");
    try {
      const res = await fetch("/api/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: q, gender: genderHint || undefined }),
      });
      const data = await res.json();
      setAiResults(data.products ?? []);
      setAiUnderstood(data.understood ?? `Showing results for "${q}"`);
    } catch {
      setAiResults([]);
      setAiUnderstood("Search failed. Please try again.");
    } finally {
      setAiLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-white">
      <StorefrontHeader />

      {/* Breadcrumb */}
      <div className="border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <nav className="flex items-center gap-2 font-sans text-xs text-taupe">
            <Link href="/" className="hover:text-dark transition-colors">Home</Link>
            <span>/</span>
            <span className="text-dark">Shop</span>
          </nav>
        </div>
      </div>

      {/* Search bar */}
      <div className="border-b border-gray-100 bg-[#FAFAF8]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5">

          {/* Mode tabs — underline style */}
          <div className="flex items-center gap-7 mb-4">
            <button
              onClick={() => { setSearchMode("keyword"); setAiResults(null); setVsResults(null); }}
              className={`flex items-center gap-1.5 font-sans text-xs tracking-[0.14em] uppercase pb-1.5 border-b-2 transition-all duration-200 ${
                searchMode === "keyword" ? "border-dark text-dark" : "border-transparent text-taupe hover:text-dark"
              }`}
            >
              <Search size={11} strokeWidth={1.5} />
              Keyword
            </button>
            <button
              onClick={() => { setSearchMode("ai"); setKeywordQuery(""); setVsResults(null); }}
              className={`flex items-center gap-1.5 font-sans text-xs tracking-[0.14em] uppercase pb-1.5 border-b-2 transition-all duration-200 ${
                searchMode === "ai" ? "border-gold text-dark" : "border-transparent text-taupe hover:text-dark"
              }`}
            >
              <span className={searchMode === "ai" ? "text-gold" : ""}>✦</span>
              AI Search
            </button>
          </div>

          {/* Animations for AI search bar */}
          <style>{`
            @keyframes aiGlow { 0%,100% { box-shadow: 0 0 0 0 rgba(180,150,80,0); } 50% { box-shadow: 0 0 0 3px rgba(180,150,80,0.18); } }
            .ai-input-glow { animation: aiGlow 2.4s ease-in-out infinite; }
          `}</style>

          {/* Keyword input */}
          {searchMode === "keyword" ? (
            <div className="flex gap-2 items-stretch max-w-2xl">
              <div className="relative flex-1 group">
                <Search
                  size={15}
                  strokeWidth={1.5}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300 group-focus-within:text-dark transition-colors pointer-events-none"
                />
                <input
                  ref={searchInputRef}
                  type="text"
                  value={keywordQuery}
                  onChange={(e) => setKeywordQuery(e.target.value)}
                  placeholder="Search by name, brand, or style…"
                  className="w-full font-sans text-sm text-dark pl-11 pr-10 py-3.5 border border-gray-200 bg-white outline-none focus:border-dark transition-colors placeholder:text-gray-300"
                />
                {keywordQuery && (
                  <button
                    onClick={() => setKeywordQuery("")}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-300 hover:text-dark transition-colors"
                  >
                    <X size={14} strokeWidth={1.5} />
                  </button>
                )}
              </div>
              <VisualSearch
                onResults={(products, query) => {
                  setVsResults(products);
                  setVsQuery(query);
                  setSearchMode("keyword");
                }}
              />
            </div>
          ) : (
            /* AI input — cycling placeholder + inline ghost autocomplete */
            <form onSubmit={runAiSearch} className="relative max-w-2xl ai-input-glow border border-gold/40 focus-within:border-gold bg-white transition-colors">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gold text-base pointer-events-none select-none">✦</span>

              {/* Ghost text layer — sits behind the real input */}
              {ghostText && (
                <div aria-hidden className="absolute inset-0 flex items-center pl-11 pr-32 pointer-events-none overflow-hidden">
                  <span className="font-sans text-sm whitespace-pre">
                    <span style={{ color: "transparent" }}>{aiQuery}</span>
                    <span className="text-gray-300">{ghostText}</span>
                  </span>
                </div>
              )}

              <input
                autoFocus
                type="text"
                value={aiQuery}
                onChange={(e) => {
                  setAiQuery(e.target.value);
                  setGhostText(computeGhost(e.target.value));
                }}
                onKeyDown={(e) => {
                  if ((e.key === "Tab" || e.key === "ArrowRight") && ghostText) {
                    e.preventDefault();
                    const full = aiQuery + ghostText;
                    setAiQuery(full);
                    setGhostText("");
                  }
                }}
                placeholder={!aiQuery && phVisible ? AI_PLACEHOLDERS[phIdx] : ""}
                className="w-full font-sans text-sm text-dark pl-11 pr-32 py-3.5 bg-transparent outline-none placeholder:text-gray-300"
              />
              <button
                type="submit"
                disabled={!aiQuery.trim() || aiLoading}
                className="absolute right-0 top-0 bottom-0 flex items-center gap-2 bg-dark text-cream font-sans text-xs tracking-[0.12em] uppercase px-5 hover:bg-warm transition-colors disabled:opacity-40"
              >
                {aiLoading
                  ? <Loader2 size={12} strokeWidth={1.5} className="animate-spin" />
                  : <ArrowRight size={13} strokeWidth={1.5} />}
                Search
              </button>
            </form>
          )}

          {/* Status banners */}
          {isVsActive && (
            <div className="mt-3.5 flex items-center gap-2">
              <span className="text-gold text-xs">◉</span>
              <p className="font-sans text-xs text-taupe italic">Showing visually similar items{vsQuery ? ` — "${vsQuery.slice(0, 80)}"` : ""}</p>
              <button onClick={() => { setVsResults(null); setVsQuery(""); }} className="font-sans text-xs text-taupe underline hover:text-dark ml-2">Clear</button>
            </div>
          )}
          {isAiResultsActive && aiUnderstood && (
            <div className="mt-3.5 flex items-center gap-2">
              <span className="text-gold text-xs">✦</span>
              <p className="font-sans text-xs text-taupe italic">{aiUnderstood}</p>
              <button onClick={() => { setAiResults(null); setAiQuery(""); }} className="font-sans text-xs text-taupe underline hover:text-dark ml-2">Clear</button>
            </div>
          )}

          {/* AI quick suggestions */}
          {searchMode === "ai" && !aiResults && !aiLoading && (
            <div className="flex flex-wrap gap-2 mt-3.5">
              {["Ethnic suits for women", "Formal shirts under ₹2000", "Casual tees in blue", "Loungewear"].map((s) => (
                <button
                  key={s}
                  onClick={() => runQuickSearch(s)}
                  className="font-sans text-[11px] text-taupe border border-gray-200 bg-white px-3.5 py-1.5 hover:border-gold hover:text-dark transition-colors"
                >
                  {s}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* Header row */}
        <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
          <div>
            <h1 className="font-display text-2xl font-400 text-dark">
              {isAiResultsActive ? "AI Search Results" : isVsActive ? "Visual Search Results" : (
                gender === "female" ? "Women" : gender === "male" ? "Men" : "All Products"
              )}
              {!isAiResultsActive && !isVsActive && category && ` · ${category}`}
            </h1>
            <p className="font-sans text-xs text-taupe mt-0.5 flex items-center gap-1.5">
              {displayProducts.length} products
              {isPersonalized && (
                <span className="font-sans text-[10px] text-gold border border-gold/30 bg-gold/5 px-2 py-0.5 rounded-full">
                  ✦ Personalised for your session
                </span>
              )}
            </p>
          </div>

          <div className="flex items-center gap-3">
            {!isAiResultsActive && !isVsActive && (
              <div className="relative">
                <select
                  value={sort}
                  onChange={(e) => setSort(e.target.value)}
                  className="appearance-none font-sans text-xs text-dark border border-gray-200 pl-3 pr-8 py-2 bg-white hover:border-dark transition-colors outline-none cursor-pointer"
                >
                  <option value="featured">Featured</option>
                  <option value="price-asc">Price: Low to High</option>
                  <option value="price-desc">Price: High to Low</option>
                </select>
                <ChevronDown size={12} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-taupe pointer-events-none" />
              </div>
            )}

            {!isAiResultsActive && (
              <button
                onClick={() => setFiltersOpen(true)}
                className="lg:hidden flex items-center gap-1.5 font-sans text-xs text-dark border border-gray-200 px-3 py-2 hover:border-dark transition-colors"
              >
                <SlidersHorizontal size={13} strokeWidth={1.5} />
                Filters {activeFilters.length > 0 && `(${activeFilters.length})`}
              </button>
            )}
          </div>
        </div>

        {/* Active filter chips */}
        {!isAiResultsActive && !isVsActive && activeFilters.length > 0 && (
          <div className="flex flex-wrap items-center gap-2 mb-6">
            {activeFilters.map((f) => (
              <span key={f} className="inline-flex items-center gap-1.5 font-sans text-xs border border-dark text-dark px-3 py-1">
                {f}
              </span>
            ))}
            <button onClick={clearAll} className="font-sans text-xs text-taupe hover:text-dark transition-colors underline">
              Clear all
            </button>
          </div>
        )}

        <div className="flex gap-8">
          {/* Sidebar — desktop, hidden during AI/visual search */}
          {!isAiResultsActive && !isVsActive && (
            <aside className="hidden lg:block w-52 flex-shrink-0">
              <div className="sticky top-24 space-y-7">
                <div>
                  <p className="font-sans text-[10px] tracking-[0.2em] uppercase text-taupe mb-3">Gender</p>
                  <div className="space-y-2">
                    {(["", "female", "male"] as const).map((g) => (
                      <button key={g} onClick={() => setGender(g)}
                        className={`block font-sans text-sm transition-colors ${gender === g ? "text-dark font-500" : "text-taupe hover:text-dark"}`}>
                        {g === "" ? "All" : g === "female" ? "Women" : "Men"}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <p className="font-sans text-[10px] tracking-[0.2em] uppercase text-taupe mb-3">Category</p>
                  <div className="space-y-2">
                    <button onClick={() => setCategory("")}
                      className={`block font-sans text-sm transition-colors ${category === "" ? "text-dark font-500" : "text-taupe hover:text-dark"}`}>All</button>
                    {PRODUCT_TYPES.map((t) => (
                      <button key={t} onClick={() => setCategory(t)}
                        className={`block font-sans text-sm transition-colors ${category === t ? "text-dark font-500" : "text-taupe hover:text-dark"}`}>{t}</button>
                    ))}
                  </div>
                </div>

                <div>
                  <p className="font-sans text-[10px] tracking-[0.2em] uppercase text-taupe mb-3">Price</p>
                  <div className="space-y-2">
                    <button onClick={() => setPriceRange(null)}
                      className={`block font-sans text-sm transition-colors ${priceRange === null ? "text-dark font-500" : "text-taupe hover:text-dark"}`}>All Prices</button>
                    {PRICE_RANGES.map((r, i) => (
                      <button key={r.label} onClick={() => setPriceRange(i)}
                        className={`block font-sans text-sm transition-colors ${priceRange === i ? "text-dark font-500" : "text-taupe hover:text-dark"}`}>{r.label}</button>
                    ))}
                  </div>
                </div>
              </div>
            </aside>
          )}

          {/* Product grid */}
          <div className="flex-1 min-w-0">
            {aiLoading ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4 lg:gap-5">
                {Array.from({ length: 8 }).map((_, i) => (
                  <div key={i} className="animate-pulse">
                    <div className="bg-gray-100 w-full mb-3" style={{ aspectRatio: "3/4" }} />
                    <div className="h-2.5 bg-gray-100 rounded w-1/3 mb-2" />
                    <div className="h-3 bg-gray-100 rounded w-4/5 mb-1.5" />
                    <div className="h-3 bg-gray-100 rounded w-2/3 mb-3" />
                    <div className="h-3.5 bg-gray-100 rounded w-1/4" />
                  </div>
                ))}
              </div>
            ) : displayProducts.length === 0 ? (
              <div className="text-center py-20">
                <p className="font-display text-xl text-taupe mb-2">
                  {isAiResultsActive ? "No products matched your search" : isVsActive ? "No similar products found" : "No products found"}
                </p>
                <p className="font-sans text-xs text-taupe mb-4">
                  {isAiResultsActive ? "Try rephrasing your query or switch to keyword mode." : isVsActive ? "Try a different image or browse by category." : "Try adjusting your filters."}
                </p>
                <button onClick={clearAll} className="font-sans text-xs text-dark underline">
                  {isAiResultsActive || isVsActive ? "Clear search" : "Clear filters"}
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4 lg:gap-5">
                {displayProducts.map((product) => (
                  <TrackedProductCard
                    key={product.id}
                    product={product}
                    onHoverSignal={onHoverSignal}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile filter drawer */}
      {filtersOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-dark/40" onClick={() => setFiltersOpen(false)} />
          <div className="absolute right-0 top-0 bottom-0 w-72 bg-white overflow-y-auto">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
              <p className="font-display text-lg text-dark">Filters</p>
              <button onClick={() => setFiltersOpen(false)} className="text-taupe hover:text-dark transition-colors">
                <X size={18} strokeWidth={1.5} />
              </button>
            </div>
            <div className="px-5 py-6 space-y-7">
              <div>
                <p className="font-sans text-[10px] tracking-[0.2em] uppercase text-taupe mb-3">Gender</p>
                <div className="space-y-3">
                  {(["", "female", "male"] as const).map((g) => (
                    <button key={g} onClick={() => setGender(g)}
                      className={`block font-sans text-sm ${gender === g ? "text-dark font-500" : "text-taupe"}`}>
                      {g === "" ? "All" : g === "female" ? "Women" : "Men"}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <p className="font-sans text-[10px] tracking-[0.2em] uppercase text-taupe mb-3">Category</p>
                <div className="space-y-3">
                  <button onClick={() => setCategory("")}
                    className={`block font-sans text-sm ${category === "" ? "text-dark font-500" : "text-taupe"}`}>All</button>
                  {PRODUCT_TYPES.map((t) => (
                    <button key={t} onClick={() => setCategory(t)}
                      className={`block font-sans text-sm ${category === t ? "text-dark font-500" : "text-taupe"}`}>{t}</button>
                  ))}
                </div>
              </div>
              <div>
                <p className="font-sans text-[10px] tracking-[0.2em] uppercase text-taupe mb-3">Price</p>
                <div className="space-y-3">
                  <button onClick={() => setPriceRange(null)}
                    className={`block font-sans text-sm ${priceRange === null ? "text-dark font-500" : "text-taupe"}`}>All Prices</button>
                  {PRICE_RANGES.map((r, i) => (
                    <button key={r.label} onClick={() => setPriceRange(i)}
                      className={`block font-sans text-sm ${priceRange === i ? "text-dark font-500" : "text-taupe"}`}>{r.label}</button>
                  ))}
                </div>
              </div>
            </div>
            <div className="px-5 py-4 border-t border-gray-100">
              <button onClick={() => setFiltersOpen(false)}
                className="w-full bg-dark text-cream font-sans text-xs tracking-[0.15em] uppercase py-3">
                Show {filtered.length} Results
              </button>
            </div>
          </div>
        </div>
      )}

      <FloatingChatWidget />

      {/* Back to top */}
      {showBackToTop && (
        <button
          onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          className="fixed bottom-24 right-6 z-40 w-9 h-9 bg-dark text-cream flex items-center justify-center shadow-lg hover:bg-warm transition-colors"
          aria-label="Back to top"
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M7 12V2M2 7l5-5 5 5" />
          </svg>
        </button>
      )}
    </div>
  );
}

export default function ShopPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-white" />}>
      <ShopContent />
    </Suspense>
  );
}
