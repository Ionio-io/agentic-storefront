"use client";

import { useEffect, useState } from "react";
import { BrandConfig, DEFAULT_BRAND } from "@/data/brand";

export default function AgentPage() {
  const [form, setForm] = useState<BrandConfig>(DEFAULT_BRAND);
  const [status, setStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [showPrompt, setShowPrompt] = useState(false);

  useEffect(() => {
    fetch("/api/brand")
      .then((r) => r.json())
      .then((data: BrandConfig) => setForm(data))
      .catch(() => {});
  }, []);

  const set = (key: keyof BrandConfig, value: string) =>
    setForm((f) => ({ ...f, [key]: value }));

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setStatus("saving");
    try {
      const res = await fetch("/api/brand", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      setStatus(res.ok ? "saved" : "error");
      setTimeout(() => setStatus("idle"), 2500);
    } catch {
      setStatus("error");
    }
  }

  const previewPrompt = `You are ${form.agentName}, the personal AI stylist for ${form.name} — ${form.tagline}.

${form.agentPersona}

BRAND:
${form.brandDescription}

TOOL SELECTION — call tools in this priority order:
1. search_products — any request for clothing, outfits, or styles
2. build_outfit — "complete look", "what goes with this"
3. get_similar_products — "show more like this", "alternatives"
4. filter_by_size — shopper mentions their size

RESPONSE RULES:
- ALWAYS call a tool before responding to any product-related question
- Product cards render automatically in the UI — do not repeat product names or prices in text
- Speak like a knowledgeable stylist, not a search engine
- After showing products, invite virtual try-on or suggest a complete look
- Never include raw URLs, JSON, or image paths in text
- Never start with filler words (Certainly, Sure, Absolutely, Of course)
- If zero results: say so and suggest broadening the search`;

  return (
    <div className="max-w-2xl mx-auto px-8 py-10">
      <h1 className="font-display text-2xl tracking-wide mb-1">Agent Config</h1>
      <p className="font-mono text-xs text-[#8A7560] mb-8">
        Configure how your AI shopping assistant introduces itself and behaves.
      </p>

      <form onSubmit={handleSave} className="space-y-6">
        <div>
          <label className="block font-mono text-xs text-[#6B5D4E] uppercase tracking-widest mb-1.5">
            Agent Name
          </label>
          <input
            type="text"
            value={form.agentName}
            onChange={(e) => set("agentName", e.target.value)}
            placeholder="e.g. Aria, Zara, Mia"
            className="w-full border border-[#D8D0C0] bg-white px-4 py-3 font-sans text-sm text-[#1A1A1A] focus:outline-none focus:border-[#C9A84C]"
          />
        </div>

        <div>
          <label className="block font-mono text-xs text-[#6B5D4E] uppercase tracking-widest mb-1.5">
            Agent Persona
          </label>
          <textarea
            value={form.agentPersona}
            onChange={(e) => set("agentPersona", e.target.value)}
            rows={4}
            placeholder="Describe the agent's personality, tone, and expertise…"
            className="w-full border border-[#D8D0C0] bg-white px-4 py-3 font-sans text-sm text-[#1A1A1A] focus:outline-none focus:border-[#C9A84C] resize-y"
          />
          <p className="font-mono text-xs text-[#8A7560] mt-1">
            This text is injected directly into the system prompt.
          </p>
        </div>

        <div>
          <label className="block font-mono text-xs text-[#6B5D4E] uppercase tracking-widest mb-1.5">
            Welcome Message
          </label>
          <textarea
            value={form.welcomeMessage}
            onChange={(e) => set("welcomeMessage", e.target.value)}
            rows={3}
            placeholder="The first message shown to shoppers when they open the chat…"
            className="w-full border border-[#D8D0C0] bg-white px-4 py-3 font-sans text-sm text-[#1A1A1A] focus:outline-none focus:border-[#C9A84C] resize-y"
          />
        </div>

        {/* System prompt preview */}
        <div>
          <button
            type="button"
            onClick={() => setShowPrompt((v) => !v)}
            className="font-mono text-xs text-[#C9A84C] hover:underline"
          >
            {showPrompt ? "Hide" : "Show"} system prompt preview →
          </button>
          {showPrompt && (
            <pre className="mt-3 bg-[#1A1A1A] text-[#E8DFD0] font-mono text-xs p-4 whitespace-pre-wrap leading-relaxed overflow-auto max-h-72">
              {previewPrompt}
            </pre>
          )}
        </div>

        <div className="pt-2">
          <button
            type="submit"
            disabled={status === "saving"}
            className="bg-[#1A1A1A] text-white font-mono text-xs tracking-widest uppercase px-8 py-3 hover:bg-[#333] disabled:opacity-50 transition-colors"
          >
            {status === "saving" ? "Saving…" : status === "saved" ? "Saved ✓" : "Save Changes"}
          </button>
          {status === "error" && (
            <p className="font-mono text-xs text-red-600 mt-2">Failed to save. Please try again.</p>
          )}
        </div>
      </form>
    </div>
  );
}
