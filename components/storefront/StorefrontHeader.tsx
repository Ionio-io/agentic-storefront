"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Search, Package, MessageCircle, X, Heart } from "lucide-react";
import { useWishlistCount } from "@/components/storefront/WishlistButton";

const NAV_LINKS = [
  { label: "Shop All", href: "/shop?gender=male" },
  { label: "Shirts", href: "/shop?gender=male&category=Shirts" },
  { label: "Polo", href: "/shop?gender=male&category=Polo" },
  { label: "T-Shirts", href: "/shop?gender=male&category=T-Shirts" },
  { label: "Jeans", href: "/shop?gender=male&category=Jeans" },
  { label: "Trousers", href: "/shop?gender=male&category=Trousers" },
];

export function StorefrontHeader() {
  const router = useRouter();
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [scrolled, setScrolled] = useState(false);
  const wishlistCount = useWishlistCount();

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
      {/* Announcement bar */}
      <div className="bg-[#EE4740] text-white text-center py-2 px-4">
        <p className="font-sans text-[11px] tracking-[0.15em] uppercase font-semibold">
          Free Shipping on Prepaid Orders Across India
        </p>
      </div>

      <header className={`sticky top-0 z-40 bg-white transition-shadow duration-200 ${scrolled ? "shadow-sm" : ""}`}>
        <div className="border-b border-gray-100">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">

              {/* Logo */}
              <Link href="/" className="flex-shrink-0">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/logo-tbh.svg" alt="The Bear House" className="h-8 w-auto" />
              </Link>

              {/* Center nav */}
              <nav className="hidden md:flex items-center gap-7">
                {NAV_LINKS.map((link) => (
                  <Link
                    key={link.label}
                    href={link.href}
                    className="font-sans text-[11px] tracking-[0.1em] uppercase text-gray-600 hover:text-[#EE4740] transition-colors duration-150 font-medium"
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
                  className="text-gray-600 hover:text-[#EE4740] transition-colors"
                >
                  <Search size={18} strokeWidth={1.5} />
                </button>

                <Link
                  href="/chat"
                  aria-label="AI Stylist"
                  className="text-gray-600 hover:text-[#EE4740] transition-colors"
                  title="Chat with Leo — AI Stylist"
                >
                  <MessageCircle size={18} strokeWidth={1.5} />
                </Link>

                <Link
                  href="/wishlist"
                  aria-label="My Wishlist"
                  className="relative text-gray-600 hover:text-[#EE4740] transition-colors"
                >
                  <Heart size={17} strokeWidth={1.5} />
                  {wishlistCount > 0 && (
                    <span className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-[#EE4740] text-white text-[9px] font-bold rounded-full flex items-center justify-center">
                      {wishlistCount}
                    </span>
                  )}
                </Link>

                <Link
                  href="/orders"
                  aria-label="My Orders"
                  className="text-gray-600 hover:text-[#EE4740] transition-colors"
                >
                  <Package size={18} strokeWidth={1.5} />
                </Link>
              </div>

            </div>
          </div>
        </div>

        {/* Mobile nav row */}
        <div className="md:hidden border-b border-gray-100 overflow-x-auto scrollbar-hide">
          <div className="flex items-center gap-5 px-4 py-2.5">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.label}
                href={link.href}
                className="font-sans text-[10px] tracking-[0.1em] uppercase text-gray-500 hover:text-[#EE4740] transition-colors whitespace-nowrap font-medium"
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
                placeholder='Search or ask Leo — "check shirt under ₹1500 for the weekend"'
                className="flex-1 font-sans text-base text-gray-900 placeholder:text-gray-300 outline-none bg-transparent"
              />
            </form>
            <button onClick={() => setSearchOpen(false)} className="text-gray-400 hover:text-gray-700 transition-colors">
              <X size={20} strokeWidth={1.5} />
            </button>
          </div>
          <div className="flex-1 flex flex-col items-center justify-center gap-4 px-6 text-center">
            <div className="w-12 h-12 rounded-full bg-[#EE4740]/10 flex items-center justify-center">
              <Search size={22} strokeWidth={1.5} className="text-[#EE4740]" />
            </div>
            <p className="font-sans text-sm text-gray-400 max-w-xs">
              Ask Leo anything — our AI stylist finds exactly what you need.
            </p>
            <div className="flex flex-wrap justify-center gap-2 mt-2">
              {["Sharp office shirts", "Polo under ₹1500", "Check shirts for the weekend", "Casual tees under ₹1000"].map((s) => (
                <button
                  key={s}
                  onClick={() => { router.push(`/chat?q=${encodeURIComponent(s)}`); setSearchOpen(false); }}
                  className="font-sans text-xs text-gray-500 border border-gray-200 px-3 py-1.5 rounded-full hover:border-[#EE4740] hover:text-[#EE4740] transition-colors"
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
