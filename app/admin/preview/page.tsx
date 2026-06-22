"use client";

import { useEffect, useState } from "react";
import { BrandConfig } from "@/data/brand";

export default function PreviewPage() {
  const [config, setConfig] = useState<BrandConfig | null>(null);

  useEffect(() => {
    fetch("/api/brand")
      .then((r) => r.json())
      .then((data: BrandConfig) => setConfig(data))
      .catch(() => {});
  }, []);

  return (
    <div className="px-8 py-10 h-full flex flex-col">
      <h1 className="font-display text-2xl tracking-wide mb-1">Preview</h1>
      <p className="font-mono text-xs text-[#8A7560] mb-6">
        Live storefront preview alongside your current brand configuration.
      </p>

      <div className="flex gap-6 flex-1 min-h-0">
        {/* Storefront iframe */}
        <div className="flex-1 border border-[#D8D0C0] bg-white overflow-hidden">
          <div className="bg-[#F7F5F0] border-b border-[#D8D0C0] px-4 py-2 flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-[#D8D0C0]" />
            <div className="w-2.5 h-2.5 rounded-full bg-[#D8D0C0]" />
            <div className="w-2.5 h-2.5 rounded-full bg-[#D8D0C0]" />
            <span className="font-mono text-xs text-[#8A7560] ml-2">{typeof window !== "undefined" ? window.location.host : ""}/chat</span>
          </div>
          <iframe
            src="/chat"
            className="w-full"
            style={{ height: "calc(100% - 37px)" }}
            title="Storefront preview"
          />
        </div>

        {/* Config JSON */}
        <div className="w-72 shrink-0 flex flex-col gap-4">
          <div className="border border-[#D8D0C0] bg-white flex-1 overflow-auto">
            <div className="px-4 py-3 border-b border-[#D8D0C0] bg-[#F7F5F0]">
              <p className="font-mono text-xs text-[#6B5D4E] uppercase tracking-widest">
                Active Config
              </p>
            </div>
            {config ? (
              <pre className="font-mono text-xs text-[#4A3728] p-4 whitespace-pre-wrap leading-relaxed">
                {JSON.stringify(config, null, 2)}
              </pre>
            ) : (
              <p className="font-mono text-xs text-[#8A7560] p-4">Loading…</p>
            )}
          </div>

          <a
            href="/chat"
            target="_blank"
            rel="noopener noreferrer"
            className="block text-center bg-[#1A1A1A] text-white font-mono text-xs tracking-widest uppercase px-6 py-3 hover:bg-[#333] transition-colors"
          >
            Open Chat →
          </a>
        </div>
      </div>
    </div>
  );
}
