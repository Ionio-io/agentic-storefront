"use client";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, X } from "lucide-react";

const SUGGESTIONS = [
  "Party dresses for women",
  "Men's formal office shirts",
  "Ethnic wear for Diwali",
  "Casual tees under ₹1000",
];

const PLACEHOLDERS = [
  "A dress for a dinner party…",
  "Smart casuals for men…",
  "Ethnic kurta for Diwali…",
  "Something light and casual…",
];

type Step = "role" | "user-form" | "admin-form";
type UserMode = "login" | "register";

export default function HomePage() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [phIdx, setPhIdx] = useState(0);
  const [focused, setFocused] = useState(false);
  const [step, setStep] = useState<Step | null>(null);
  const [pendingQuery, setPendingQuery] = useState("");
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [brandName, setBrandName] = useState("Westside");
  const [agentName, setAgentName] = useState("Aria");

  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((data) => { if (data?.user) setIsLoggedIn(true); })
      .catch(() => {});
    fetch("/api/brand", { cache: "no-store" })
      .then((r) => r.json())
      .then((d) => {
        if (d?.name) setBrandName(d.name);
        if (d?.agentName) setAgentName(d.agentName);
      })
      .catch(() => {});
  }, []);

  // Shopper auth state
  const [userMode, setUserMode] = useState<UserMode>("login");
  const [userName, setUserName] = useState("");
  const [userEmail, setUserEmail] = useState("");
  const [userPass, setUserPass] = useState("");
  const [userStatus, setUserStatus] = useState<"idle" | "loading" | "error">("idle");
  const [userError, setUserError] = useState("");

  // Admin auth state
  const [adminUser, setAdminUser] = useState("");
  const [adminPass, setAdminPass] = useState("");
  const [adminStatus, setAdminStatus] = useState<"idle" | "loading" | "error">("idle");
  const [adminError, setAdminError] = useState("");

  const inputRef = useRef<HTMLInputElement>(null);
  const emailRef = useRef<HTMLInputElement>(null);
  const adminUserRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const t = setInterval(() => {
      if (!focused && !query) setPhIdx((i) => (i + 1) % PLACEHOLDERS.length);
    }, 3500);
    return () => clearTimeout(t);
  }, [focused, query]);

  useEffect(() => {
    if (step === "user-form")  setTimeout(() => emailRef.current?.focus(), 60);
    if (step === "admin-form") setTimeout(() => adminUserRef.current?.focus(), 60);
  }, [step]);

  function openModal(q?: string) {
    const pending = (q ?? query).trim();
    setPendingQuery(pending);
    if (isLoggedIn) {
      router.push(pending ? `/chat?q=${encodeURIComponent(pending)}` : "/chat");
      return;
    }
    setStep("role");
  }

  function closeModal() {
    setStep(null);
    setUserStatus("idle"); setUserError("");
    setAdminStatus("idle"); setAdminError("");
    setTimeout(() => inputRef.current?.focus(), 50);
  }

  function goGuest() {
    closeModal();
    router.push(pendingQuery ? `/chat?q=${encodeURIComponent(pendingQuery)}` : "/chat");
  }

  async function handleUserSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!userEmail || !userPass || userStatus === "loading") return;
    setUserStatus("loading"); setUserError("");

    const endpoint = userMode === "register" ? "/api/auth/register" : "/api/auth/login";
    const body = userMode === "register"
      ? { name: userName, email: userEmail, password: userPass }
      : { email: userEmail, password: userPass };

    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (res.ok) {
        closeModal();
        router.push(pendingQuery ? `/chat?q=${encodeURIComponent(pendingQuery)}` : "/chat");
      } else {
        setUserError(data.error ?? "Something went wrong");
        setUserStatus("error");
      }
    } catch {
      setUserError("Network error. Please try again.");
      setUserStatus("error");
    }
  }

  async function handleAdminSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!adminUser || !adminPass || adminStatus === "loading") return;
    setAdminStatus("loading"); setAdminError("");

    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: adminUser, password: adminPass }),
      });
      const data = await res.json();
      if (res.ok) {
        closeModal();
        router.push("/admin");
      } else {
        setAdminError(data.error ?? "Invalid credentials");
        setAdminStatus("error");
      }
    } catch {
      setAdminError("Network error. Please try again.");
      setAdminStatus("error");
    }
  }

  return (
    <div className="min-h-screen bg-cream flex flex-col overflow-hidden">

      {/* Nav */}
      <nav className="flex items-center justify-between px-8 md:px-16 py-6 border-b border-border/50">
        <span className="font-display text-xl font-600 tracking-widest text-dark uppercase">{brandName}</span>
        <button onClick={() => { setPendingQuery(query.trim()); setStep("role"); }} className="font-sans text-xs tracking-[0.15em] uppercase text-taupe hover:text-dark transition-colors">
          Open Storefront →
        </button>
      </nav>

      {/* Hero */}
      <main className="flex-1 flex flex-col items-center justify-center px-6 text-center py-20">
        <div className="animate-fade-up animate-delay-100 inline-flex items-center gap-2.5 mb-10" style={{ animationFillMode: "both" }}>
          <span className="text-gold text-xs">✦</span>
          <span className="font-sans text-xs tracking-[0.25em] uppercase text-taupe">AI Styling Assistant · Powered by {agentName}</span>
          <span className="text-gold text-xs">✦</span>
        </div>
        <div className="overflow-hidden mb-2">
          <h1 className="font-display text-[4.5rem] md:text-[7rem] lg:text-[8.5rem] leading-[0.92] font-300 text-dark animate-fade-up animate-delay-200" style={{ animationFillMode: "both" }}>
            Dress with
          </h1>
        </div>
        <div className="overflow-hidden mb-10">
          <h1 className="font-display text-[4.5rem] md:text-[7rem] lg:text-[8.5rem] leading-[0.92] font-600 italic text-gold animate-fade-up animate-delay-300" style={{ animationFillMode: "both" }}>
            intention.
          </h1>
        </div>
        <div className="w-24 h-px bg-gold mb-8 animate-rule-grow animate-delay-400" style={{ animationFillMode: "both" }} />
        <p className="font-sans text-taupe text-base md:text-lg leading-relaxed max-w-sm mb-12 animate-fade-up animate-delay-500" style={{ animationFillMode: "both" }}>
          Tell {agentName} what you&apos;re looking for. She curates, styles, and lets you try it on before you buy.
        </p>

        {/* Input */}
        <div className="w-full max-w-lg mb-8 animate-fade-up animate-delay-600" style={{ animationFillMode: "both" }}>
          <div className="underline-sweep border-b border-border group/input pb-4">
            <div className="flex items-end gap-4">
              <span className="text-gold text-lg flex-shrink-0 mb-0.5 transition-transform duration-300 group-focus-within/input:scale-125">✦</span>
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && openModal()}
                onFocus={() => setFocused(true)}
                onBlur={() => setFocused(false)}
                placeholder={PLACEHOLDERS[phIdx]}
                className="flex-1 bg-transparent outline-none font-display text-xl md:text-2xl text-dark placeholder:text-border placeholder:italic placeholder:font-300 pb-1"
                autoFocus
              />
              <button onClick={() => openModal()} className="flex-shrink-0 w-9 h-9 rounded-full border border-dark bg-transparent hover:bg-dark text-dark hover:text-gold transition-all duration-300 flex items-center justify-center mb-0.5">
                <ArrowRight size={15} strokeWidth={1.5} />
              </button>
            </div>
          </div>
        </div>

        {/* Suggestions */}
        <div className="flex flex-wrap justify-center gap-x-6 gap-y-2 animate-fade-up animate-delay-700" style={{ animationFillMode: "both" }}>
          {SUGGESTIONS.map((s) => (
            <button key={s} onClick={() => openModal(s)} className="font-sans text-xs tracking-[0.15em] uppercase text-taupe hover:text-dark border-b border-transparent hover:border-gold transition-all duration-200 pb-0.5">
              {s}
            </button>
          ))}
        </div>
      </main>

      {/* Feature strip */}
      <section className="border-t border-border/50">
        <div className="max-w-4xl mx-auto px-6 py-8 grid grid-cols-1 sm:grid-cols-3 gap-px bg-border/40">
          {[
            { label: "Conversational", desc: "Natural language discovery with your personal AI stylist" },
            { label: "Virtual Try-On", desc: "See any garment on you before buying — powered by fal.ai" },
            { label: "Curated", desc: "Budget-aware, occasion-driven recommendations in seconds" },
          ].map((f) => (
            <div key={f.label} className="bg-cream px-8 py-6 text-left hover:bg-ivory transition-colors duration-300">
              <p className="font-display italic text-gold text-lg font-400 mb-1.5">{f.label}</p>
              <p className="font-sans text-xs text-taupe leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Agentic features */}
      <section className="border-t border-border/50 bg-ivory">
        <div className="max-w-4xl mx-auto px-6 py-16">
          <div className="flex items-center gap-4 mb-12">
            <div className="h-px flex-1 bg-border" />
            <span className="font-sans text-[10px] tracking-[0.3em] uppercase text-taupe">Agentic Storefront · What {agentName} Can Do</span>
            <div className="h-px flex-1 bg-border" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-px bg-border/40">
            {[
              { label: "Natural Language Discovery", desc: `Just say what you want — "a floral dress under ₹2000 for a wedding" — and ${agentName} searches the entire catalog instantly. No filters, no dropdown menus.` },
              { label: "Virtual Try-On", desc: "Upload your photo and see exactly how any garment looks on you before buying. Reduces guesswork and cuts down returns — all inside the chat." },
              { label: "Conversational Checkout", desc: "Pick your size and add to bag without leaving the conversation. No page redirects, no long forms — the entire purchase happens right here." },
              { label: "Intent-Aware Recommendations", desc: `Tell ${agentName} your occasion, budget, or vibe and she narrows down to exactly what you need. The agent understands context, not just keywords.` },
              { label: "Personal Stylist Memory", desc: `${agentName} remembers your style preferences and size across visits. Every conversation gets more personalised — like a stylist who already knows you.` },
              { label: "First-Party Brand Experience", desc: `This is a storefront the brand owns — not a third-party chatbot. ${agentName} carries ${brandName}'s personality and keeps you in a direct relationship with the brand.` },
            ].map((f) => (
              <div key={f.label} className="bg-ivory px-8 py-7 hover:bg-cream transition-colors duration-300 group">
                <div className="flex items-start gap-3 mb-2">
                  <span className="text-gold text-xs mt-0.5 group-hover:scale-110 transition-transform duration-300">✦</span>
                  <p className="font-display italic text-dark text-base font-400 leading-tight">{f.label}</p>
                </div>
                <p className="font-sans text-xs text-taupe leading-relaxed pl-6">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <footer className="border-t border-border/50">
        <div className="text-center py-4 text-[11px] tracking-[0.15em] uppercase text-border font-sans">
          {brandName} · Built with Next.js, OpenRouter, fal.ai
        </div>
      </footer>

      {/* ── Modal ── */}
      {step && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center"
          onClick={(e) => { if (e.target === e.currentTarget) closeModal(); }}
        >
          <div className="absolute inset-0 bg-dark/50 backdrop-blur-sm" />

          <div
            className="relative w-full sm:max-w-[420px] bg-cream mx-4 sm:mx-auto shadow-2xl"
            style={{ animation: "modalUp 0.22s cubic-bezier(0.16,1,0.3,1)" }}
          >
            {/* Close */}
            <button onClick={closeModal} className="absolute top-4 right-4 w-7 h-7 flex items-center justify-center text-taupe hover:text-dark transition-colors" aria-label="Close">
              <X size={15} />
            </button>

            {/* ── Role selector ── */}
            {step === "role" && (
              <div className="px-8 pt-7 pb-8">
                <p className="font-mono text-[9px] tracking-[0.3em] uppercase text-taupe mb-1">Welcome</p>
                <h2 className="font-display text-2xl text-dark mb-6 leading-tight">How would you like to continue?</h2>

                <div className="space-y-2.5">
                  {/* Guest */}
                  <button
                    onClick={goGuest}
                    className="w-full group flex items-center gap-4 border border-border bg-white px-5 py-4 hover:border-gold transition-all duration-200 text-left"
                  >
                    <div className="w-9 h-9 bg-ivory flex items-center justify-center group-hover:bg-gold/10 transition-colors flex-shrink-0">
                      <span className="text-gold text-sm">✦</span>
                    </div>
                    <div>
                      <p className="font-display text-base text-dark group-hover:text-gold transition-colors">Shop with {agentName}</p>
                      <p className="font-sans text-[11px] text-taupe mt-0.5">Browse and try on as a guest — no account needed</p>
                    </div>
                  </button>

                  {/* Account */}
                  <button
                    onClick={() => { setStep("user-form"); setUserMode("login"); }}
                    className="w-full group flex items-center gap-4 border border-border bg-white px-5 py-4 hover:border-dark transition-all duration-200 text-left"
                  >
                    <div className="w-9 h-9 bg-ivory flex items-center justify-center group-hover:bg-dark/5 transition-colors flex-shrink-0">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-taupe">
                        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
                      </svg>
                    </div>
                    <div>
                      <p className="font-display text-base text-dark">My Account</p>
                      <p className="font-sans text-[11px] text-taupe mt-0.5">Sign in or create an account to save your preferences</p>
                    </div>
                  </button>

                  {/* Admin */}
                  <button
                    onClick={() => setStep("admin-form")}
                    className="w-full group flex items-center gap-4 border border-border bg-white px-5 py-4 hover:border-dark/40 transition-all duration-200 text-left opacity-70 hover:opacity-100"
                  >
                    <div className="w-9 h-9 bg-ivory flex items-center justify-center group-hover:bg-dark/5 transition-colors flex-shrink-0">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-taupe">
                        <circle cx="12" cy="12" r="3"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14M4.93 4.93a10 10 0 0 0 0 14.14"/>
                      </svg>
                    </div>
                    <div>
                      <p className="font-display text-sm text-dark">Admin Panel</p>
                      <p className="font-sans text-[11px] text-taupe mt-0.5">Brand management — authorised personnel only</p>
                    </div>
                  </button>
                </div>
              </div>
            )}

            {/* ── Shopper login/register ── */}
            {step === "user-form" && (
              <div className="px-8 pt-7 pb-8">
                <button onClick={() => setStep("role")} className="font-mono text-[9px] tracking-[0.2em] uppercase text-taupe hover:text-dark transition-colors mb-4 flex items-center gap-1">
                  ← Back
                </button>
                <p className="font-mono text-[9px] tracking-[0.3em] uppercase text-taupe mb-1">
                  {userMode === "login" ? "Sign In" : "Create Account"}
                </p>
                <h2 className="font-display text-2xl text-dark mb-6 leading-tight">
                  {userMode === "login" ? "Welcome back" : `Join ${brandName}`}
                </h2>

                <form onSubmit={handleUserSubmit} className="space-y-4">
                  {userMode === "register" && (
                    <div>
                      <label className="block font-mono text-[9px] tracking-[0.2em] uppercase text-taupe mb-1.5">Full Name</label>
                      <input type="text" value={userName} onChange={(e) => setUserName(e.target.value)} required placeholder="Your name" className="w-full border-b border-border bg-transparent py-2.5 font-sans text-sm text-dark placeholder:text-border outline-none focus:border-dark transition-colors" />
                    </div>
                  )}
                  <div>
                    <label className="block font-mono text-[9px] tracking-[0.2em] uppercase text-taupe mb-1.5">Email</label>
                    <input ref={emailRef} type="email" value={userEmail} onChange={(e) => setUserEmail(e.target.value)} required autoComplete="email" placeholder="you@example.com" className="w-full border-b border-border bg-transparent py-2.5 font-sans text-sm text-dark placeholder:text-border outline-none focus:border-dark transition-colors" />
                  </div>
                  <div>
                    <label className="block font-mono text-[9px] tracking-[0.2em] uppercase text-taupe mb-1.5">Password</label>
                    <input type="password" value={userPass} onChange={(e) => setUserPass(e.target.value)} required autoComplete={userMode === "login" ? "current-password" : "new-password"} placeholder="••••••••" className="w-full border-b border-border bg-transparent py-2.5 font-sans text-sm text-dark placeholder:text-border outline-none focus:border-dark transition-colors" />
                  </div>

                  {userStatus === "error" && (
                    <p className="font-mono text-[10px] text-red-600 bg-red-50 border border-red-200 px-3 py-2 leading-relaxed">
                      {userError}
                    </p>
                  )}

                  <button type="submit" disabled={userStatus === "loading"} className="w-full bg-dark text-cream font-mono text-[10px] tracking-[0.2em] uppercase py-3.5 hover:bg-warm disabled:opacity-40 transition-colors mt-1">
                    {userStatus === "loading" ? (
                      <span className="flex items-center justify-center gap-2">
                        <span className="w-3 h-3 border border-cream/30 border-t-cream rounded-full animate-spin" />
                        {userMode === "login" ? "Signing in…" : "Creating account…"}
                      </span>
                    ) : userMode === "login" ? "Sign In →" : "Create Account →"}
                  </button>
                </form>

                <div className="mt-5 pt-5 border-t border-border/60 text-center">
                  <button
                    onClick={() => { setUserMode(userMode === "login" ? "register" : "login"); setUserStatus("idle"); setUserError(""); }}
                    className="font-mono text-[9px] tracking-[0.15em] uppercase text-taupe hover:text-dark transition-colors"
                  >
                    {userMode === "login" ? "No account? Register →" : "Already have an account? Sign in →"}
                  </button>
                </div>
              </div>
            )}

            {/* ── Admin login ── */}
            {step === "admin-form" && (
              <div className="px-8 pt-7 pb-8">
                <button onClick={() => setStep("role")} className="font-mono text-[9px] tracking-[0.2em] uppercase text-taupe hover:text-dark transition-colors mb-4 flex items-center gap-1">
                  ← Back
                </button>
                <p className="font-mono text-[9px] tracking-[0.3em] uppercase text-taupe mb-1">Admin Panel</p>
                <h2 className="font-display text-2xl text-dark mb-6 leading-tight">Sign In</h2>

                <form onSubmit={handleAdminSubmit} className="space-y-4">
                  <div>
                    <label className="block font-mono text-[9px] tracking-[0.2em] uppercase text-taupe mb-1.5">Username</label>
                    <input ref={adminUserRef} type="text" value={adminUser} onChange={(e) => setAdminUser(e.target.value)} autoComplete="username" placeholder="admin" className="w-full border-b border-border bg-transparent py-2.5 font-sans text-sm text-dark placeholder:text-border outline-none focus:border-dark transition-colors" />
                  </div>
                  <div>
                    <label className="block font-mono text-[9px] tracking-[0.2em] uppercase text-taupe mb-1.5">Password</label>
                    <input type="password" value={adminPass} onChange={(e) => setAdminPass(e.target.value)} autoComplete="current-password" placeholder="••••••••" className="w-full border-b border-border bg-transparent py-2.5 font-sans text-sm text-dark placeholder:text-border outline-none focus:border-dark transition-colors" />
                  </div>

                  {adminStatus === "error" && (
                    <p className="font-mono text-[10px] text-red-600 bg-red-50 border border-red-200 px-3 py-2">
                      {adminError}
                    </p>
                  )}

                  <button type="submit" disabled={!adminUser || !adminPass || adminStatus === "loading"} className="w-full bg-dark text-cream font-mono text-[10px] tracking-[0.2em] uppercase py-3.5 hover:bg-warm disabled:opacity-40 transition-colors mt-1">
                    {adminStatus === "loading" ? (
                      <span className="flex items-center justify-center gap-2">
                        <span className="w-3 h-3 border border-cream/30 border-t-cream rounded-full animate-spin" />
                        Signing in…
                      </span>
                    ) : "Sign In →"}
                  </button>
                </form>
              </div>
            )}
          </div>
        </div>
      )}

      <style>{`
        @keyframes modalUp {
          from { opacity: 0; transform: translateY(14px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
