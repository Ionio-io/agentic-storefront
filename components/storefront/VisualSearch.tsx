"use client";
import { useState, useRef } from "react";
import { Camera, X, Upload, Loader2 } from "lucide-react";
import { Product } from "@/types";

interface Props {
  onResults: (products: Product[], query: string) => void;
}

export function VisualSearch({ onResults }: Props) {
  const [open, setOpen] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);
  const cameraRef = useRef<HTMLInputElement>(null);

  function handleFile(file: File) {
    if (!file.type.startsWith("image/")) {
      setError("Please select an image file.");
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      setPreview(e.target?.result as string);
      setError("");
    };
    reader.readAsDataURL(file);
  }

  async function analyze() {
    if (!preview || loading) return;
    setLoading(true);
    setError("");

    try {
      // Extract base64 data (remove data:image/...;base64, prefix)
      const base64 = preview.split(",")[1];

      // Send to agent with image + extract instruction
      const res = await fetch("/api/agent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [
            {
              role: "user",
              content: "Analyze this fashion image. Identify the garment type, color, style, fabric if visible, and occasion it's suited for. Then search for similar items in the catalog.",
            },
          ],
          imageBase64: base64,
          imageQuery: "Analyze this fashion image. Identify garment type, color, style, fabric (if visible), and occasion. Then search for similar items in our catalog.",
        }),
      });

      if (!res.body) throw new Error("No response");

      const reader = res.body.getReader();
      const dec = new TextDecoder();
      let buffer = "";
      const products: Product[] = [];
      let extractedQuery = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += dec.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";

        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          const raw = line.slice(6).trim();
          if (raw === "[DONE]") continue;
          try {
            const evt = JSON.parse(raw) as { type: string; content?: string; products?: Product[] };
            if (evt.type === "text" && evt.content && !extractedQuery) {
              extractedQuery = evt.content.slice(0, 100);
            }
            if (evt.type === "products" && Array.isArray(evt.products)) {
              products.push(...evt.products);
            }
          } catch { /* skip */ }
        }
      }

      if (products.length === 0) {
        setError("No matching products found. Try a different image.");
        setLoading(false);
        return;
      }

      onResults(products, extractedQuery);
      setOpen(false);
      setPreview(null);
    } catch (e) {
      setError((e as Error).message || "Analysis failed. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  function reset() {
    setPreview(null);
    setError("");
    setLoading(false);
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center justify-center w-10 h-10 border border-gray-200 text-taupe hover:border-dark hover:text-dark transition-colors flex-shrink-0"
        title="Search by image"
        aria-label="Visual search — search by image"
      >
        <Camera size={16} strokeWidth={1.5} />
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="absolute inset-0 bg-dark/50 backdrop-blur-sm" onClick={() => { setOpen(false); reset(); }} />
          <div className="relative bg-white w-full sm:w-[420px] shadow-2xl sm:rounded-lg animate-fade-up overflow-hidden">

            <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100">
              <div className="flex items-center gap-3">
                <Camera size={18} className="text-gold" />
                <div>
                  <p className="font-display text-lg text-dark">Visual Search</p>
                  <p className="font-sans text-[11px] text-taupe">Upload a fashion image to find similar items</p>
                </div>
              </div>
              <button onClick={() => { setOpen(false); reset(); }} className="text-taupe hover:text-dark transition-colors">
                <X size={18} strokeWidth={1.5} />
              </button>
            </div>

            <div className="px-6 py-6">
              {!preview ? (
                <div className="space-y-3">
                  <div
                    className="border-2 border-dashed border-gray-200 hover:border-gold/50 transition-colors rounded-lg p-8 text-center cursor-pointer group"
                    onClick={() => fileRef.current?.click()}
                  >
                    <Upload size={28} className="text-gray-300 group-hover:text-gold/60 transition-colors mx-auto mb-3" />
                    <p className="font-sans text-sm text-dark mb-1">Drop an image here</p>
                    <p className="font-sans text-xs text-taupe">or click to upload from gallery</p>
                  </div>

                  <div className="flex gap-3">
                    <button
                      onClick={() => fileRef.current?.click()}
                      className="flex-1 flex items-center justify-center gap-2 border border-gray-200 text-dark font-sans text-xs tracking-[0.1em] uppercase py-3 hover:border-dark transition-colors"
                    >
                      <Upload size={13} strokeWidth={1.5} /> Upload Image
                    </button>
                    <button
                      onClick={() => cameraRef.current?.click()}
                      className="flex-1 flex items-center justify-center gap-2 border border-gray-200 text-dark font-sans text-xs tracking-[0.1em] uppercase py-3 hover:border-dark transition-colors"
                    >
                      <Camera size={13} strokeWidth={1.5} /> Take Photo
                    </button>
                  </div>

                  <p className="font-sans text-[10px] text-taupe text-center">
                    Works great with screenshots from Instagram, Pinterest, or magazine photos
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="relative bg-[#F7F4F0] rounded-lg overflow-hidden" style={{ aspectRatio: "3/4", maxHeight: "240px" }}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={preview} alt="Preview" className="w-full h-full object-contain" />
                    {!loading && (
                      <button
                        onClick={reset}
                        className="absolute top-2 right-2 w-7 h-7 bg-white rounded-full flex items-center justify-center shadow-sm hover:shadow-md transition-shadow"
                      >
                        <X size={12} strokeWidth={1.5} className="text-dark" />
                      </button>
                    )}
                  </div>

                  {error && (
                    <p className="font-sans text-xs text-red-600 bg-red-50 px-3 py-2 rounded">{error}</p>
                  )}

                  <button
                    onClick={analyze}
                    disabled={loading}
                    className="w-full bg-dark text-cream font-sans text-xs tracking-[0.15em] uppercase py-4 hover:bg-warm transition-colors disabled:opacity-40 flex items-center justify-center gap-2"
                  >
                    {loading ? (
                      <>
                        <Loader2 size={13} className="animate-spin" /> AI is analysing your image…
                      </>
                    ) : (
                      <><span className="text-gold">✦</span> Find Similar Items</>
                    )}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Hidden file inputs */}
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
      />
      <input
        ref={cameraRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
      />
    </>
  );
}
