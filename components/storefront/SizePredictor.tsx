"use client";
import { useState, useEffect } from "react";
import { X, Loader2, CheckCircle2, Ruler } from "lucide-react";
import { getLocalProfile, saveLocalProfile, type SizeProfile } from "@/lib/style-memory";

interface SizeResult {
  size: string;
  confidence: number;
  explanation: string;
  tips: string[];
  sizeRange?: string;
}

interface Props {
  productType: string;
  gender: "male" | "female";
  onSizeSelect: (size: string) => void;
  onClose: () => void;
}

const BODY_SHAPES = [
  { value: "straight", label: "Straight", desc: "Bust, waist, hips roughly equal" },
  { value: "pear", label: "Pear", desc: "Hips wider than bust" },
  { value: "hourglass", label: "Hourglass", desc: "Bust and hips equal, defined waist" },
  { value: "athletic", label: "Athletic", desc: "Broad shoulders, narrow hips" },
  { value: "plus", label: "Plus", desc: "Fuller figure throughout" },
] as const;

const FIT_PREFS = [
  { value: "fitted", label: "Fitted", desc: "Close to body" },
  { value: "regular", label: "Regular", desc: "Standard cut" },
  { value: "relaxed", label: "Relaxed", desc: "Loose, comfortable" },
] as const;

export function SizePredictor({ productType, gender, onSizeSelect, onClose }: Props) {
  const [step, setStep] = useState<"form" | "loading" | "result">("form");
  const [result, setResult] = useState<SizeResult | null>(null);
  const [error, setError] = useState("");

  const [height, setHeight] = useState<number | "">(160);
  const [weight, setWeight] = useState<number | "">(60);
  const [bodyShape, setBodyShape] = useState<SizeProfile["bodyShape"]>("straight");
  const [fitPref, setFitPref] = useState<SizeProfile["fitPref"]>("regular");

  // Load saved profile
  useEffect(() => {
    const saved = getLocalProfile();
    if (saved?.sizeProfile) {
      if (saved.sizeProfile.height) setHeight(saved.sizeProfile.height);
      if (saved.sizeProfile.weight) setWeight(saved.sizeProfile.weight);
      if (saved.sizeProfile.bodyShape) setBodyShape(saved.sizeProfile.bodyShape);
      if (saved.sizeProfile.fitPref) setFitPref(saved.sizeProfile.fitPref);
    }
  }, []);

  async function predict() {
    if (!height || !weight) return;
    setStep("loading");
    setError("");

    try {
      const res = await fetch("/api/size", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ height, weight, bodyShape, fitPreference: fitPref, productType, gender }),
      });
      const data = await res.json() as SizeResult & { error?: string };
      if (data.error) throw new Error(data.error);
      setResult(data);
      setStep("result");

      // Save to local profile
      const sizeKey = productType.toLowerCase().includes("trouser") || productType.toLowerCase().includes("jean")
        ? "bottom"
        : productType.toLowerCase().includes("ethnic") || productType.toLowerCase().includes("kurta") || productType.toLowerCase().includes("suit")
        ? "ethnic"
        : "top";

      saveLocalProfile({
        sizeProfile: {
          [sizeKey]: data.size,
          height: Number(height),
          weight: Number(weight),
          bodyShape,
          fitPref,
        },
      });
    } catch (e) {
      setError((e as Error).message || "Could not predict size. Please try again.");
      setStep("form");
    }
  }

  const confidenceColor = result
    ? result.confidence >= 80 ? "bg-green-500" : result.confidence >= 60 ? "bg-yellow-500" : "bg-orange-500"
    : "bg-gray-200";

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="absolute inset-0 bg-dark/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white w-full sm:w-[460px] sm:max-h-[90vh] overflow-y-auto shadow-2xl sm:rounded-lg animate-fade-up">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-dark rounded-full flex items-center justify-center">
              <Ruler size={14} className="text-gold" />
            </div>
            <div>
              <p className="font-display text-lg text-dark">Find Your Size</p>
              <p className="font-sans text-[11px] text-taupe">AI-powered recommendation for {productType}</p>
            </div>
          </div>
          <button onClick={onClose} className="text-taupe hover:text-dark transition-colors">
            <X size={18} strokeWidth={1.5} />
          </button>
        </div>

        {/* Form */}
        {step === "form" && (
          <div className="px-6 py-6 space-y-6">
            {error && (
              <div className="bg-red-50 border border-red-100 text-red-700 font-sans text-xs px-4 py-3 rounded">
                {error}
              </div>
            )}

            {/* Height & Weight */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="font-sans text-[10px] tracking-[0.15em] uppercase text-taupe block mb-2">
                  Height (cm)
                </label>
                <input
                  type="number"
                  value={height}
                  onChange={(e) => setHeight(e.target.value ? Number(e.target.value) : "")}
                  min={140} max={210}
                  className="w-full font-sans text-sm text-dark border border-gray-200 px-3 py-2.5 outline-none focus:border-dark transition-colors"
                  placeholder="e.g. 163"
                />
              </div>
              <div>
                <label className="font-sans text-[10px] tracking-[0.15em] uppercase text-taupe block mb-2">
                  Weight (kg)
                </label>
                <input
                  type="number"
                  value={weight}
                  onChange={(e) => setWeight(e.target.value ? Number(e.target.value) : "")}
                  min={35} max={180}
                  className="w-full font-sans text-sm text-dark border border-gray-200 px-3 py-2.5 outline-none focus:border-dark transition-colors"
                  placeholder="e.g. 58"
                />
              </div>
            </div>

            {/* Body Shape */}
            <div>
              <p className="font-sans text-[10px] tracking-[0.15em] uppercase text-taupe mb-3">Body Shape</p>
              <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
                {BODY_SHAPES.map((s) => (
                  <button
                    key={s.value}
                    onClick={() => setBodyShape(s.value)}
                    className={`flex flex-col items-center gap-1 py-2.5 px-1 border transition-all text-center rounded ${
                      bodyShape === s.value
                        ? "border-dark bg-dark text-cream"
                        : "border-gray-200 hover:border-dark text-dark"
                    }`}
                    title={s.desc}
                  >
                    <span className="font-sans text-[11px] leading-tight">{s.label}</span>
                  </button>
                ))}
              </div>
              {bodyShape && (
                <p className="font-sans text-[11px] text-taupe mt-2">
                  {BODY_SHAPES.find((s) => s.value === bodyShape)?.desc}
                </p>
              )}
            </div>

            {/* Fit Preference */}
            <div>
              <p className="font-sans text-[10px] tracking-[0.15em] uppercase text-taupe mb-3">Fit Preference</p>
              <div className="flex gap-2">
                {FIT_PREFS.map((f) => (
                  <button
                    key={f.value}
                    onClick={() => setFitPref(f.value)}
                    className={`flex-1 py-2.5 px-3 border text-center transition-all rounded ${
                      fitPref === f.value
                        ? "border-dark bg-dark text-cream"
                        : "border-gray-200 hover:border-dark text-dark"
                    }`}
                  >
                    <p className="font-sans text-xs font-500">{f.label}</p>
                    <p className="font-sans text-[10px] text-taupe mt-0.5" style={{ color: fitPref === f.value ? "rgba(250,250,245,0.6)" : undefined }}>
                      {f.desc}
                    </p>
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={predict}
              disabled={!height || !weight}
              className="w-full bg-dark text-cream font-sans text-xs tracking-[0.15em] uppercase py-4 hover:bg-warm transition-colors disabled:opacity-40 flex items-center justify-center gap-2"
            >
              <span className="text-gold">✦</span> Get My Size Recommendation
            </button>

            <p className="font-sans text-[10px] text-taupe text-center">
              Your measurements are used only for size prediction and saved to your profile.
            </p>
          </div>
        )}

        {/* Loading */}
        {step === "loading" && (
          <div className="px-6 py-16 flex flex-col items-center gap-4">
            <Loader2 size={28} className="text-gold animate-spin" />
            <p className="font-display text-lg text-dark">Calculating your size…</p>
            <p className="font-sans text-xs text-taupe text-center max-w-xs">
              AI is analysing your body proportions against our {productType} size chart
            </p>
          </div>
        )}

        {/* Result */}
        {step === "result" && result && (
          <div className="px-6 py-6 space-y-5">
            {/* Size recommendation */}
            <div className="text-center py-6 bg-[#FAFAFA] border border-gray-100 rounded">
              <p className="font-sans text-[10px] tracking-[0.2em] uppercase text-taupe mb-2">Recommended Size</p>
              <p className="font-display text-6xl font-300 text-dark">{result.size}</p>
              {result.sizeRange && (
                <p className="font-sans text-xs text-taupe mt-2">You&apos;re between {result.sizeRange} — we suggest {result.size}</p>
              )}

              {/* Confidence bar */}
              <div className="mt-4 px-8">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="font-sans text-[10px] text-taupe">Confidence</span>
                  <span className="font-sans text-[10px] text-dark font-500">{result.confidence}%</span>
                </div>
                <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${confidenceColor}`}
                    style={{ width: `${result.confidence}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Explanation */}
            <div>
              <p className="font-sans text-sm text-dark leading-relaxed">{result.explanation}</p>
            </div>

            {/* Tips */}
            {result.tips?.length > 0 && (
              <div className="space-y-2">
                <p className="font-sans text-[10px] tracking-[0.15em] uppercase text-taupe">Styling Tips</p>
                {result.tips.map((tip, i) => (
                  <div key={i} className="flex items-start gap-2.5">
                    <CheckCircle2 size={13} className="text-gold mt-0.5 flex-shrink-0" />
                    <p className="font-sans text-xs text-dark leading-relaxed">{tip}</p>
                  </div>
                ))}
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-3 pt-2">
              <button
                onClick={() => onSizeSelect(result.size)}
                className="flex-1 bg-dark text-cream font-sans text-xs tracking-[0.15em] uppercase py-3.5 hover:bg-warm transition-colors"
              >
                Select Size {result.size}
              </button>
              <button
                onClick={() => setStep("form")}
                className="border border-gray-200 text-taupe font-sans text-xs px-4 py-3.5 hover:border-dark hover:text-dark transition-colors"
              >
                Adjust
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
