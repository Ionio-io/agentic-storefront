"use client";
import { useState } from "react";
import Link from "next/link";
import {
  Sparkles, Ruler, Camera, Gift, Calendar, Brain, TrendingUp,
  Shirt, Heart, ChevronRight,
} from "lucide-react";

interface Feature {
  id: string;
  icon: React.ReactNode;
  badge?: string;
  title: string;
  subtitle: string;
  description: string;
  cta: string;
  href: string;
  color: string; // bg tint
}

const FEATURES: Feature[] = [
  {
    id: "ai-stylist",
    icon: <Sparkles size={20} strokeWidth={1.5} />,
    badge: "Most used",
    title: "AI Stylist",
    subtitle: "Natural language shopping",
    description: "Describe what you need — occasion, mood, budget — in plain English. The AI finds the perfect pieces and builds complete looks.",
    cta: "Try AI Stylist",
    href: "/chat",
    color: "bg-gold/8",
  },
  {
    id: "size-predictor",
    icon: <Ruler size={20} strokeWidth={1.5} />,
    title: "Smart Size Predictor",
    subtitle: "AI-powered fit recommendation",
    description: "Enter your height, weight, and body shape. Our AI cross-references Indian garment size charts and tells you exactly what to order.",
    cta: "Find Your Size",
    href: "/shop",
    color: "bg-blue-50",
  },
  {
    id: "virtual-tryon",
    icon: <Shirt size={20} strokeWidth={1.5} />,
    badge: "Wow factor",
    title: "Virtual Try-On",
    subtitle: "See it on yourself before buying",
    description: "Upload your photo and try any garment on yourself in seconds. Powered by fal.ai — photorealistic results with real lighting.",
    cta: "Try On Now",
    href: "/shop",
    color: "bg-purple-50",
  },
  {
    id: "visual-search",
    icon: <Camera size={20} strokeWidth={1.5} />,
    title: "Visual Search",
    subtitle: "Shop from any image",
    description: "Screenshot something you love on Instagram or Pinterest. Upload it — our AI identifies the style and finds matching pieces in the catalog.",
    cta: "Search by Image",
    href: "/shop",
    color: "bg-emerald-50",
  },
  {
    id: "gift-finder",
    icon: <Gift size={20} strokeWidth={1.5} />,
    title: "Gift Finder",
    subtitle: "Perfect gifts, every time",
    description: "Who are you buying for? Their style, your budget, the occasion — tell the AI and get 3–4 curated gift options in seconds.",
    cta: "Find a Gift",
    href: "/shop",
    color: "bg-rose-50",
  },
  {
    id: "occasion-shopping",
    icon: <Calendar size={20} strokeWidth={1.5} />,
    title: "Festival Shopping",
    subtitle: "Occasion-aware discovery",
    description: "Diwali in 27 days? The storefront knows the full Indian festival calendar and surfaces the right looks at the right time — automatically.",
    cta: "Shop by Occasion",
    href: "/shop",
    color: "bg-orange-50",
  },
  {
    id: "outfit-builder",
    icon: <Sparkles size={20} strokeWidth={1.5} />,
    title: "Complete the Look",
    subtitle: "AI outfit completion",
    description: "Found a kurta you love? Click 'Style with AI' on any product page and get 3 complementary pieces that complete a full look instantly.",
    cta: "See It Live",
    href: "/shop",
    color: "bg-teal-50",
  },
  {
    id: "style-memory",
    icon: <Brain size={20} strokeWidth={1.5} />,
    title: "Style Memory",
    subtitle: "Remembers you across visits",
    description: "The AI learns your size, favourite colours, and usual budget. Return visits feel like your personal stylist already knows you.",
    cta: "Build Your Profile",
    href: "/chat",
    color: "bg-violet-50",
  },
  {
    id: "demand-signals",
    icon: <TrendingUp size={20} strokeWidth={1.5} />,
    title: "Live Demand Signals",
    subtitle: "Real-time popularity data",
    description: "See which products are trending right now — '43 people added this today'. Drives urgency from real browsing and cart data.",
    cta: "See Trending",
    href: "/shop",
    color: "bg-amber-50",
  },
  {
    id: "wishlist",
    icon: <Heart size={20} strokeWidth={1.5} />,
    title: "Smart Wishlist",
    subtitle: "Save and style later",
    description: "Heart any product to save it. Ask the AI to 'build outfits from my wishlist' — it combines your saved pieces into complete looks.",
    cta: "Try Wishlist",
    href: "/shop",
    color: "bg-pink-50",
  },
];

export function AIFeaturesShowcase() {
  const [active, setActive] = useState<string | null>(null);

  return (
    <section className="py-20 bg-[#F7F4F0] border-t border-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 border border-gold/30 bg-gold/5 px-4 py-1.5 rounded-full mb-5">
            <span className="text-gold text-sm">✦</span>
            <span className="font-sans text-xs tracking-[0.15em] uppercase text-dark">AI-Powered Shopping</span>
          </div>
          <h2 className="font-display text-4xl sm:text-5xl font-300 text-dark mb-4 leading-tight">
            10 AI features.<br />
            <span className="text-taupe">One storefront.</span>
          </h2>
          <p className="font-sans text-sm text-taupe max-w-xl mx-auto leading-relaxed">
            Every feature is live and working. Click any card to try it yourself.
          </p>
        </div>

        {/* Feature grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {FEATURES.map((f) => (
            <div
              key={f.id}
              onMouseEnter={() => setActive(f.id)}
              onMouseLeave={() => setActive(null)}
              className={`relative group border rounded-lg p-5 transition-all duration-200 cursor-pointer ${
                active === f.id
                  ? "border-dark shadow-md bg-white"
                  : "border-gray-200 bg-white hover:border-gray-300"
              }`}
            >
              {f.badge && (
                <span className="absolute top-4 right-4 font-sans text-[9px] tracking-[0.1em] uppercase text-gold border border-gold/30 bg-gold/5 px-2 py-0.5 rounded-full">
                  {f.badge}
                </span>
              )}

              {/* Icon */}
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center mb-4 text-dark transition-colors ${
                active === f.id ? "bg-dark text-gold" : f.color
              }`}>
                {f.icon}
              </div>

              <p className="font-display text-lg text-dark leading-tight mb-0.5">{f.title}</p>
              <p className="font-sans text-[10px] tracking-[0.1em] uppercase text-taupe mb-3">{f.subtitle}</p>
              <p className="font-sans text-xs text-gray-500 leading-relaxed mb-5">{f.description}</p>

              <Link
                href={f.href}
                className={`inline-flex items-center gap-1.5 font-sans text-xs transition-all duration-150 ${
                  active === f.id
                    ? "text-dark font-500"
                    : "text-taupe hover:text-dark"
                }`}
              >
                {f.cta}
                <ChevronRight size={11} className={`transition-transform ${active === f.id ? "translate-x-0.5" : ""}`} />
              </Link>
            </div>
          ))}
        </div>

        {/* Bottom CTA */}
        <div className="mt-12 text-center">
          <Link
            href="/chat"
            className="inline-flex items-center gap-3 bg-dark text-cream font-sans text-xs tracking-[0.15em] uppercase px-8 py-4 hover:bg-warm transition-colors"
          >
            <Sparkles size={14} className="text-gold" strokeWidth={1.5} />
            Start with AI Stylist — it does everything
          </Link>
          <p className="font-sans text-[11px] text-taupe mt-3">No sign-up needed. Try it free.</p>
        </div>
      </div>
    </section>
  );
}
