"use client";
import { useState, useRef } from "react";
import Image from "next/image";
import { X, Upload, RotateCcw, Download } from "lucide-react";
import { Product } from "@/types";

interface Props {
  product: Product;
  onClose: () => void;
}

const SAMPLE_PERSON =
  "https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?w=512&h=768&fit=crop&q=80";

export function VTOWidget({ product, onClose }: Props) {
  const [personUrl, setPersonUrl] = useState<string>(SAMPLE_PERSON);
  const [result, setResult] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  function uploadPerson(file: File) {
    const reader = new FileReader();
    reader.onload = (e) => setPersonUrl(e.target?.result as string);
    reader.readAsDataURL(file);
  }

  async function runTryOn() {
    setLoading(true);
    setResult(null);
    setError(null);
    try {
      const res = await fetch("/api/vton", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          garment_image_url: product.image_urls[0],
          person_image_url: personUrl,
          vton_category: product.vton_category,
        }),
      });
      const data = await res.json();
      if (data.result_url) setResult(data.result_url);
      else setError(data.error ?? "Try-on failed. Please try again.");
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-dark/50 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
      <div className="bg-cream border border-border w-full max-w-2xl overflow-hidden animate-fade-up shadow-2xl">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-white">
          <div className="flex items-center gap-3">
            <span className="text-gold">✦</span>
            <div>
              <h2 className="font-display font-600 text-dark text-lg leading-tight">
                Virtual Try-On
              </h2>
              <p className="font-sans text-[10px] tracking-[0.15em] uppercase text-taupe">
                Powered by fal.ai · Nano Banana 2
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close virtual try-on"
          className="text-taupe hover:text-dark transition-colors p-1"
          >
            <X size={16} strokeWidth={1.5} />
          </button>
        </div>

        <div className="p-6">
          <div className="grid grid-cols-2 gap-4 mb-5">
            {/* Person photo */}
            <div>
              <p className="font-sans text-[9px] tracking-[0.2em] uppercase text-taupe mb-2">
                Your Photo
              </p>
              <div
                className="relative h-64 bg-ivory border border-border hover:border-gold/50 transition-colors cursor-pointer overflow-hidden group"
                onClick={() => inputRef.current?.click()}
              >
                <Image
                  src={personUrl}
                  alt="Person"
                  fill
                  className="object-cover object-top"
                  sizes="256px"
                  unoptimized
                />
                <div className="absolute inset-0 bg-dark/0 group-hover:bg-dark/25 transition-all duration-300 flex items-center justify-center opacity-0 group-hover:opacity-100">
                  <div className="bg-white border border-border p-2">
                    <Upload size={14} strokeWidth={1.5} className="text-gold" />
                  </div>
                </div>
              </div>
              <p className="font-sans text-[9px] tracking-wide text-taupe mt-1.5 text-center">
                Click to upload your photo
              </p>
              <input
                ref={inputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => e.target.files?.[0] && uploadPerson(e.target.files[0])}
              />
            </div>

            {/* Result */}
            <div>
              <p className="font-sans text-[9px] tracking-[0.2em] uppercase text-taupe mb-2">
                Try-On Result
              </p>
              <div className="relative h-64 bg-ivory border border-border flex items-center justify-center overflow-hidden">
                {result ? (
                  <Image
                    src={result}
                    alt="Try-on result"
                    fill
                    className="object-cover object-top"
                    sizes="256px"
                    unoptimized
                  />
                ) : loading ? (
                  <div className="flex flex-col items-center gap-3 text-taupe">
                    <div className="flex gap-1.5">
                      {[0, 1, 2].map((i) => (
                        <span
                          key={i}
                          className="w-1 h-1 rounded-full bg-gold animate-pulse-dot"
                          style={{ animationDelay: `${i * 0.2}s` }}
                        />
                      ))}
                    </div>
                    <p className="font-sans text-xs">Generating try-on…</p>
                    <p className="font-sans text-[10px] text-border">~30 seconds</p>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-2 text-border">
                    <span className="text-2xl">✦</span>
                    <p className="font-sans text-xs">Result appears here</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Garment strip */}
          <div className="flex items-center gap-3 border border-border/60 bg-white px-4 py-3 mb-4">
            <div className="relative w-10 h-12 flex-shrink-0 overflow-hidden">
              <Image
                src={product.image_urls[0]}
                alt={product.title}
                fill
                className="object-cover object-top"
                sizes="40px"
                unoptimized
              />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-sans text-xs font-500 text-dark line-clamp-1">{product.title}</p>
              <p className="font-sans text-[10px] text-taupe">
                {product.vendor} · <span className="font-display italic text-gold">₹{product.price.toLocaleString("en-IN")}</span>
              </p>
            </div>
            <span className="font-sans text-[9px] tracking-[0.15em] uppercase text-taupe bg-gold/10 px-2 py-0.5">
              {product.vton_category}
            </span>
          </div>

          {error && (
            <p className="font-sans text-xs text-red-500 mb-3 border border-red-100 bg-red-50/50 px-3 py-2">
              {error}
            </p>
          )}

          {/* Actions */}
          <div className="flex gap-2">
            <button
              onClick={runTryOn}
              disabled={loading}
              className="flex-1 font-sans text-xs tracking-[0.15em] uppercase py-3 border border-dark bg-dark text-cream hover:bg-charcoal transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <span className="flex gap-1">
                    {[0, 1, 2].map((i) => (
                      <span
                        key={i}
                        className="w-1 h-1 rounded-full bg-gold animate-pulse-dot"
                        style={{ animationDelay: `${i * 0.2}s` }}
                      />
                    ))}
                  </span>
                  Generating
                </>
              ) : (
                <>✦ Try On Now</>
              )}
            </button>
            {result && (
              <>
                <button
                  onClick={runTryOn}
                  className="p-3 border border-border text-taupe hover:border-gold hover:text-gold transition-colors"
                  title="Regenerate"
                >
                  <RotateCcw size={14} strokeWidth={1.5} />
                </button>
                <a
                  href={result}
                  download="tryon-result.jpg"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-3 border border-border text-taupe hover:border-gold hover:text-gold transition-colors"
                  title="Download"
                >
                  <Download size={14} strokeWidth={1.5} />
                </a>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
