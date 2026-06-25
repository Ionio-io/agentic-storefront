"use client";
// Client-only behavior tracking — sessionStorage only, no server calls.
// Tracks hover dwell, scroll depth, size taps to personalize product grid ranking.

import { Product } from "@/types";

export interface BehaviorSignal {
  productId: string;
  handle: string;
  hoverDuration: number;
  scrolledPDP: boolean;
  sizeViewed?: string;
  colors: string[];
  priceRange: string;
  productType: string;
  timestamp: number;
}

export interface SessionProfile {
  preferredColors: string[];
  preferredTypes: string[];
  preferredPriceMin: number;
  preferredPriceMax: number;
  viewedProductIds: string[];
  signals: BehaviorSignal[];
  isPersonalized: boolean; // true once >= 3 signals
}

const KEY = "agentBehavior";

function extractColors(product: Product): string[] {
  const colorWords = ["blue", "red", "green", "black", "white", "pink", "yellow", "purple",
    "orange", "brown", "grey", "gray", "beige", "lilac", "maroon", "teal", "navy", "gold",
    "silver", "mustard", "coral", "peach", "cream", "ivory", "nude", "tan", "olive", "rust"];
  const haystack = (product.title + " " + product.tags.join(" ")).toLowerCase();
  return colorWords.filter((c) => haystack.includes(c));
}

function priceRangeLabel(price: number): string {
  if (price < 1000) return "under-1000";
  if (price < 2000) return "1000-2000";
  if (price < 3000) return "2000-3000";
  return "3000-plus";
}

function readSession(): SessionProfile {
  if (typeof sessionStorage === "undefined") return defaultProfile();
  try {
    const raw = sessionStorage.getItem(KEY);
    if (raw) return JSON.parse(raw) as SessionProfile;
  } catch { /* ignore */ }
  return defaultProfile();
}

function defaultProfile(): SessionProfile {
  return {
    preferredColors: [],
    preferredTypes: [],
    preferredPriceMin: 0,
    preferredPriceMax: Infinity,
    viewedProductIds: [],
    signals: [],
    isPersonalized: false,
  };
}

function writeSession(profile: SessionProfile) {
  if (typeof sessionStorage === "undefined") return;
  try {
    sessionStorage.setItem(KEY, JSON.stringify(profile));
  } catch { /* quota exceeded — ignore */ }
}

function recompute(signals: BehaviorSignal[]): Omit<SessionProfile, "signals" | "viewedProductIds" | "isPersonalized"> {
  // Only count signals with meaningful dwell (>1500ms) or explicit interaction
  const strong = signals.filter((s) => s.hoverDuration > 1500 || s.scrolledPDP || s.sizeViewed);

  const colorCounts: Record<string, number> = {};
  const typeCounts: Record<string, number> = {};
  const prices: number[] = [];

  for (const s of strong) {
    for (const c of s.colors) colorCounts[c] = (colorCounts[c] ?? 0) + 1;
    typeCounts[s.productType] = (typeCounts[s.productType] ?? 0) + 1;
  }

  const preferredColors = Object.entries(colorCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([c]) => c);

  const preferredTypes = Object.entries(typeCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 2)
    .map(([t]) => t);

  // Price range from recent strong signals
  for (const s of strong.slice(-6)) {
    const [rawMin, rawMax] = s.priceRange.split("-");
    const mn = Number(rawMin);
    if (!isNaN(mn)) prices.push(mn);
    const mx = rawMax === "plus" ? mn * 1.5 : Number(rawMax);
    if (!isNaN(mx)) prices.push(mx);
  }

  return {
    preferredColors,
    preferredTypes,
    preferredPriceMin: prices.length ? Math.min(...prices) : 0,
    preferredPriceMax: prices.length ? Math.max(...prices) : Infinity,
  };
}

export function recordHover(product: Product, durationMs: number): void {
  const profile = readSession();
  const existing = profile.signals.find((s) => s.productId === product.id);
  if (existing) {
    existing.hoverDuration = Math.max(existing.hoverDuration, durationMs);
    existing.timestamp = Date.now();
  } else {
    profile.signals.push({
      productId: product.id,
      handle: product.handle,
      hoverDuration: durationMs,
      scrolledPDP: false,
      colors: extractColors(product),
      priceRange: priceRangeLabel(product.price),
      productType: product.product_type,
      timestamp: Date.now(),
    });
  }
  if (!profile.viewedProductIds.includes(product.id)) {
    profile.viewedProductIds.push(product.id);
  }
  const computed = recompute(profile.signals);
  Object.assign(profile, computed);
  profile.isPersonalized = profile.signals.filter((s) => s.hoverDuration > 1500).length >= 3;
  writeSession(profile);
}

export function recordPDPScroll(product: Product): void {
  const profile = readSession();
  const existing = profile.signals.find((s) => s.productId === product.id);
  if (existing) {
    existing.scrolledPDP = true;
  } else {
    profile.signals.push({
      productId: product.id,
      handle: product.handle,
      hoverDuration: 0,
      scrolledPDP: true,
      colors: extractColors(product),
      priceRange: priceRangeLabel(product.price),
      productType: product.product_type,
      timestamp: Date.now(),
    });
  }
  const computed = recompute(profile.signals);
  Object.assign(profile, computed);
  profile.isPersonalized = profile.signals.filter((s) => s.scrolledPDP || s.hoverDuration > 1500).length >= 3;
  writeSession(profile);
}

export function recordSizeTap(product: Product, size: string): void {
  const profile = readSession();
  const existing = profile.signals.find((s) => s.productId === product.id);
  if (existing) {
    existing.sizeViewed = size;
  } else {
    profile.signals.push({
      productId: product.id,
      handle: product.handle,
      hoverDuration: 0,
      scrolledPDP: false,
      sizeViewed: size,
      colors: extractColors(product),
      priceRange: priceRangeLabel(product.price),
      productType: product.product_type,
      timestamp: Date.now(),
    });
  }
  const computed = recompute(profile.signals);
  Object.assign(profile, computed);
  profile.isPersonalized = true;
  writeSession(profile);
}

export function getSessionProfile(): SessionProfile {
  return readSession();
}

export function rankProducts(products: Product[], profile: SessionProfile): Product[] {
  if (!profile.isPersonalized || profile.signals.length < 3) return products;

  return [...products].sort((a, b) => {
    let scoreA = 0;
    let scoreB = 0;

    // Color match
    const colorsA = extractColors(a);
    const colorsB = extractColors(b);
    for (const c of profile.preferredColors) {
      if (colorsA.includes(c)) scoreA += 2;
      if (colorsB.includes(c)) scoreB += 2;
    }

    // Type match
    if (profile.preferredTypes.includes(a.product_type)) scoreA += 3;
    if (profile.preferredTypes.includes(b.product_type)) scoreB += 3;

    // Price proximity (prefer items in their usual range)
    const priceMin = profile.preferredPriceMin;
    const priceMax = profile.preferredPriceMax === Infinity ? 10000 : profile.preferredPriceMax;
    const priceMid = (priceMin + priceMax) / 2;
    const distA = Math.abs(a.price - priceMid);
    const distB = Math.abs(b.price - priceMid);
    if (distA < distB) scoreA += 1;
    else if (distB < distA) scoreB += 1;

    // Already viewed — deprioritize slightly
    if (profile.viewedProductIds.includes(a.id)) scoreA -= 1;
    if (profile.viewedProductIds.includes(b.id)) scoreB -= 1;

    return scoreB - scoreA;
  });
}

export function buildAgentContext(profile: SessionProfile): string {
  if (!profile.isPersonalized) return "";
  const parts: string[] = [];
  if (profile.preferredColors.length) parts.push(`gravitates toward ${profile.preferredColors.join(", ")} colours`);
  if (profile.preferredTypes.length) parts.push(`interested in ${profile.preferredTypes.join(", ")}`);
  if (profile.preferredPriceMax < 5000) parts.push(`budget seems to be ₹${profile.preferredPriceMin}–₹${profile.preferredPriceMax}`);
  if (!parts.length) return "";
  return `SESSION BEHAVIOUR: Shopper ${parts.join("; ")}.`;
}
