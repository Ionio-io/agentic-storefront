"use client";

import { useEffect, useState } from "react";
import { BrandConfig, DEFAULT_BRAND } from "@/data/brand";

export default function BrandPage() {
  const [form, setForm] = useState<BrandConfig>(DEFAULT_BRAND);
  const [status, setStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");

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

  return (
    <div className="max-w-2xl mx-auto px-8 py-10">
      <h1 className="font-display text-2xl tracking-wide mb-1">Brand Identity</h1>
      <p className="font-mono text-xs text-[#8A7560] mb-8">
        This information is used to personalise the AI agent and storefront.
      </p>

      <form onSubmit={handleSave} className="space-y-6">
        <Field label="Brand Name" value={form.name} onChange={(v) => set("name", v)} />
        <Field label="Tagline" value={form.tagline} onChange={(v) => set("tagline", v)} />
        <Field
          label="Brand Description"
          value={form.brandDescription}
          onChange={(v) => set("brandDescription", v)}
          multiline
          hint="Describe your brand, product categories, price range, and style. The agent uses this to answer brand questions."
        />
        <Field
          label="Primary Colour (hex)"
          value={form.primaryColor}
          onChange={(v) => set("primaryColor", v)}
          hint="Used for UI accents. E.g. #C9A84C"
        />

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

function Field({
  label,
  value,
  onChange,
  multiline,
  hint,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  multiline?: boolean;
  hint?: string;
}) {
  return (
    <div>
      <label className="block font-mono text-xs text-[#6B5D4E] uppercase tracking-widest mb-1.5">
        {label}
      </label>
      {multiline ? (
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          rows={5}
          className="w-full border border-[#D8D0C0] bg-white px-4 py-3 font-sans text-sm text-[#1A1A1A] focus:outline-none focus:border-[#C9A84C] resize-y"
        />
      ) : (
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full border border-[#D8D0C0] bg-white px-4 py-3 font-sans text-sm text-[#1A1A1A] focus:outline-none focus:border-[#C9A84C]"
        />
      )}
      {hint && (
        <p className="font-mono text-xs text-[#8A7560] mt-1">{hint}</p>
      )}
    </div>
  );
}
