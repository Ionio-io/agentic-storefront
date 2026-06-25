"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Search, Package, MessageCircle, X, ShoppingBag, Heart } from "lucide-react";
import { useWishlistCount } from "@/components/storefront/WishlistButton";
import { useBrand } from "@/lib/brand-context";

const NAV_LINKS = [
  { label: "Women", href: "/shop?gender=female" },
  { label: "Men", href: "/shop?gender=male" },
  { label: "New Arrivals", href: "/shop?isNew=true" },
  { label: "Collections", href: "/shop/collections" },
];

export function StorefrontHeader() {
  const router = useRouter();
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [scrolled, setScrolled] = useState(false);
  const wishlistCount = useWishlistCount();
  const brand = useBrand();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  function submitSearch(e: React.FormEvent) {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    router.push(`/chat?q=${encodeURIComponent(searchQuery.trim())}`);
    setSearchOpen(false);
    setSearchQuery("");
  }

  return (
    <>
      <header
        className={`sticky top-0 z-40 bg-white transition-shadow duration-200 ${scrolled ? "shadow-sm" : ""}`}
      >
        {/* Top bar */}
        <div className="border-b border-gray-100">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">

              {/* Logo */}
              <Link href="/" className="font-display text-lg font-600 tracking-widest text-dark uppercase flex-shrink-0">
                {brand.name}
              </Link>

              {/* Center nav */}
              <nav className="hidden md:flex items-center gap-8">
                {NAV_LINKS.map((link) => (
                  <Link
                    key={link.label}
                    href={link.href}
                    className="font-sans text-xs tracking-[0.12em] uppercase text-gray-600 hover:text-dark transition-colors duration-150"
                  >
                    {link.label}
                  </Link>
                ))}
              </nav>

              {/* Right icons */}
              <div className="flex items-center gap-4">
                <button
                  onClick={() => setSearchOpen(true)}
                  aria-label="Search"
                  className="text-gray-500 hover:text-dark transition-colors"
                >
                  <Search size={18} strokeWidth={1.5} />
                </button>

                <Link
                  href="/chat"
                  aria-label="AI Stylist"
                  className="text-gray-500 hover:text-dark transition-colors"
                  title="Chat with AI Stylist"
                >
                  <MessageCircle size={18} strokeWidth={1.5} />
                </Link>

                <Link
                  href="/wishlist"
                  aria-label="My Wishlist"
                  className="relative text-gray-500 hover:text-dark transition-colors"
                >
                  <Heart size={17} strokeWidth={1.5} />
                  {wishlistCount > 0 && (
                    <span className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-red-500 text-white text-[9px] font-700 font-sans rounded-full flex items-center justify-center">
                      {wishlistCount}
                    </span>
                  )}
                </Link>
                <Link
                  href="/orders"
                  aria-label="My Orders"
                  className="text-gray-500 hover:text-dark transition-colors"
                >
                  <Package size={18} strokeWidth={1.5} />
                </Link>
              </div>

            </div>
          </div>
        </div>

        {/* Mobile nav row */}
        <div className="md:hidden border-b border-gray-100 overflow-x-auto scrollbar-hide">
          <div className="flex items-center gap-6 px-4 py-2.5">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.label}
                href={link.href}
                className="font-sans text-[11px] tracking-[0.12em] uppercase text-gray-500 hover:text-dark transition-colors whitespace-nowrap"
              >
                {link.label}
              </Link>
            ))}
          </div>
        </div>
      </header>

      {/* Search overlay */}
      {searchOpen && (
        <div className="fixed inset-0 z-50 bg-white flex flex-col">
          <div className="border-b border-gray-100 px-4 sm:px-8 py-4 flex items-center gap-4">
            <form onSubmit={submitSearch} className="flex-1 flex items-center gap-3">
              <Search size={18} strokeWidth={1.5} className="text-gray-400 flex-shrink-0" />
              <input
                autoFocus
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder='Search or ask anything — "floral dress under ₹2000 for a wedding"'
                className="flex-1 font-sans text-base text-dark placeholder:text-gray-300 outline-none bg-transparent"
              />
            </form>
            <button onClick={() => setSearchOpen(false)} className="text-gray-400 hover:text-dark transition-colors">
              <X size={20} strokeWidth={1.5} />
            </button>
          </div>

          <div className="flex-1 flex flex-col items-center justify-center gap-4 px-6 text-center">
            <ShoppingBag size={32} strokeWidth={1} className="text-gray-200" />
            <p className="font-sans text-sm text-gray-400 max-w-xs">
              Type anything — our AI stylist will find exactly what you need.
            </p>
            <div className="flex flex-wrap justify-center gap-2 mt-2">
              {["Party dresses for women", "Men's formal shirts", "Ethnic kurta for Diwali", "Casual tees under ₹1000"].map((s) => (
                <button
                  key={s}
                  onClick={() => { router.push(`/chat?q=${encodeURIComponent(s)}`); setSearchOpen(false); }}
                  className="font-sans text-xs text-gray-500 border border-gray-200 px-3 py-1.5 rounded-full hover:border-dark hover:text-dark transition-colors"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
