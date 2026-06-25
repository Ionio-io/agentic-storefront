"use client";
import { useState } from "react";
import { Gift, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { saveLocalProfile } from "@/lib/style-memory";

const RELATIONS = ["Partner", "Mother", "Sister", "Friend", "Father", "Brother", "Self"] as const;
const STYLES = ["Ethnic", "Western", "Formal", "Casual", "Sporty"] as const;
const OCCASIONS = ["Birthday", "Diwali", "Wedding", "Anniversary", "Just because"] as const;

type Relation = typeof RELATIONS[number];
type Style = typeof STYLES[number];
type OccasionType = typeof OCCASIONS[number];

interface Props {
  brandName?: string;
}

export function GiftFinder({ brandName = "Ionio" }: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [relation, setRelation] = useState<Relation | null>(null);
  const [styles, setStyles] = useState<Style[]>([]);
  const [budget, setBudget] = useState(2000);
  const [occasion, setOccasion] = useState<OccasionType | null>(null);

  function toggleStyle(s: Style) {
    setStyles((prev) => prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]);
  }

  function find() {
    if (!relation || !occasion) return;

    const stylesStr = styles.length > 0 ? styles.join(", ") : "any style";
    const prompt = encodeURIComponent(
      `I'm looking for a gift for my ${relation.toLowerCase()}. They love ${stylesStr}. Budget is ₹${budget.toLocaleString("en-IN")}. It's for ${occasion}. Find 3–4 great gift options from ${brandName}'s collection — complete sets, statement pieces with wide size options are ideal.`
    );

    // Save that gift finder was used
    saveLocalProfile({ giftFinderUsed: true });
    fetch("/api/style-profile", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ giftFinderUsed: true }),
    }).catch(() => {});

    setOpen(false);
    router.push(`/chat?q=${prompt}`);
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-1.5 font-sans text-[11px] text-taupe hover:text-dark transition-colors border border-dashed border-gray-200 hover:border-gray-400 px-3 py-1.5 rounded-full"
      >
        <Gift size={11} strokeWidth={1.5} /> Finding a gift?
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="absolute inset-0 bg-dark/50 backdrop-blur-sm" onClick={() => setOpen(false)} />
          <div className="relative bg-white w-full sm:w-[440px] shadow-2xl sm:rounded-lg animate-fade-up overflow-y-auto max-h-screen sm:max-h-[90vh]">

            <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100 sticky top-0 bg-white z-10">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-gold/10 rounded-full flex items-center justify-center">
                  <Gift size={15} className="text-gold" />
                </div>
                <div>
                  <p className="font-display text-lg text-dark">Gift Finder</p>
                  <p className="font-sans text-[11px] text-taupe">Let AI find the perfect gift</p>
                </div>
              </div>
              <button onClick={() => setOpen(false)} className="text-taupe hover:text-dark transition-colors">
                <X size={18} strokeWidth={1.5} />
              </button>
            </div>

            <div className="px-6 py-6 space-y-6">

              {/* Who is this for */}
              <div>
                <p className="font-sans text-[10px] tracking-[0.2em] uppercase text-taupe mb-3">Who is this for?</p>
                <div className="flex flex-wrap gap-2">
                  {RELATIONS.map((r) => (
                    <button
                      key={r}
                      onClick={() => setRelation(r)}
                      className={`font-sans text-sm px-4 py-2 border rounded-full transition-all ${
                        relation === r ? "border-dark bg-dark text-cream" : "border-gray-200 text-dark hover:border-dark"
                      }`}
                    >
                      {r}
                    </button>
                  ))}
                </div>
              </div>

              {/* Their style */}
              <div>
                <p className="font-sans text-[10px] tracking-[0.2em] uppercase text-taupe mb-3">Their style <span className="normal-case">(select all that apply)</span></p>
                <div className="flex flex-wrap gap-2">
                  {STYLES.map((s) => (
                    <button
                      key={s}
                      onClick={() => toggleStyle(s)}
                      className={`font-sans text-sm px-4 py-2 border rounded-full transition-all ${
                        styles.includes(s) ? "border-dark bg-dark text-cream" : "border-gray-200 text-dark hover:border-dark"
                      }`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>

              {/* Budget */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <p className="font-sans text-[10px] tracking-[0.2em] uppercase text-taupe">Budget</p>
                  <p className="font-display text-lg text-dark">₹{budget.toLocaleString("en-IN")}</p>
                </div>
                <input
                  type="range"
                  min={500}
                  max={5000}
                  step={250}
                  value={budget}
                  onChange={(e) => setBudget(Number(e.target.value))}
                  className="w-full accent-dark cursor-pointer"
                />
                <div className="flex justify-between mt-1">
                  <span className="font-sans text-[10px] text-taupe">₹500</span>
                  <span className="font-sans text-[10px] text-taupe">₹5,000</span>
                </div>
              </div>

              {/* Occasion */}
              <div>
                <p className="font-sans text-[10px] tracking-[0.2em] uppercase text-taupe mb-3">Occasion</p>
                <div className="flex flex-wrap gap-2">
                  {OCCASIONS.map((o) => (
                    <button
                      key={o}
                      onClick={() => setOccasion(o)}
                      className={`font-sans text-sm px-4 py-2 border rounded-full transition-all ${
                        occasion === o ? "border-dark bg-dark text-cream" : "border-gray-200 text-dark hover:border-dark"
                      }`}
                    >
                      {o}
                    </button>
                  ))}
                </div>
              </div>

              <button
                onClick={find}
                disabled={!relation || !occasion}
                className="w-full bg-dark text-cream font-sans text-xs tracking-[0.15em] uppercase py-4 hover:bg-warm transition-colors disabled:opacity-40 flex items-center justify-center gap-2"
              >
                <Gift size={14} strokeWidth={1.5} /> Find Perfect Gifts
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
