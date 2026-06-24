"use client";
// Client-side style profile helpers.
// Reads/writes localStorage and debounces sync to /api/style-profile.

export interface SizeProfile {
  top?: string;    // XS/S/M/L/XL/XXL
  bottom?: string; // 28/30/32/34/36
  ethnic?: string;
  fitPref?: "fitted" | "regular" | "relaxed";
  height?: number; // cm
  weight?: number; // kg
  bodyShape?: "hourglass" | "rectangle" | "spoon" | "trapezoid" | "triangle" | "inverted" | "oval";
}

export interface StylePreferences {
  colors?: string[];
  occasions?: string[];
  budgetMin?: number;
  budgetMax?: number;
}

export interface StyleProfile {
  sizeProfile?: SizeProfile;
  stylePreferences?: StylePreferences;
  recentSearches?: string[];
  viewedProductIds?: string[];
  savedProductIds?: string[];
  giftFinderUsed?: boolean;
  updatedAt?: number;
}

const LS_KEY = "westsideStyleProfile";
let syncTimer: ReturnType<typeof setTimeout> | null = null;

export function getLocalProfile(): StyleProfile | null {
  if (typeof localStorage === "undefined") return null;
  try {
    const raw = localStorage.getItem(LS_KEY);
    return raw ? (JSON.parse(raw) as StyleProfile) : null;
  } catch {
    return null;
  }
}

export function saveLocalProfile(updates: Partial<StyleProfile>): void {
  if (typeof localStorage === "undefined") return;
  try {
    const current = getLocalProfile() ?? {};
    const merged: StyleProfile = {
      ...current,
      ...updates,
      sizeProfile: updates.sizeProfile ? { ...current.sizeProfile, ...updates.sizeProfile } : current.sizeProfile,
      stylePreferences: updates.stylePreferences
        ? { ...current.stylePreferences, ...updates.stylePreferences }
        : current.stylePreferences,
      recentSearches: updates.recentSearches ?? current.recentSearches,
      savedProductIds: updates.savedProductIds ?? current.savedProductIds,
      updatedAt: Date.now(),
    };
    localStorage.setItem(LS_KEY, JSON.stringify(merged));

    // Debounced server sync
    if (syncTimer) clearTimeout(syncTimer);
    syncTimer = setTimeout(() => syncProfileToServer(merged), 3000);
  } catch { /* quota exceeded */ }
}

export async function syncProfileToServer(profile: StyleProfile): Promise<void> {
  try {
    await fetch("/api/style-profile", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(profile),
    });
  } catch { /* network error — silent */ }
}

export async function mergeWithServerProfile(local: StyleProfile): Promise<StyleProfile> {
  try {
    const res = await fetch("/api/style-profile");
    if (!res.ok) return local;
    const server = (await res.json()) as StyleProfile;
    // Local wins on conflicts (more recent)
    const merged: StyleProfile = {
      ...server,
      ...local,
      sizeProfile: { ...server.sizeProfile, ...local.sizeProfile },
      stylePreferences: { ...server.stylePreferences, ...local.stylePreferences },
      savedProductIds: Array.from(
        new Set([...(server.savedProductIds ?? []), ...(local.savedProductIds ?? [])])
      ),
      recentSearches: Array.from(
        new Set([...(local.recentSearches ?? []), ...(server.recentSearches ?? [])])
      ).slice(0, 10),
    };
    return merged;
  } catch {
    return local;
  }
}

export function addRecentSearch(query: string): void {
  const profile = getLocalProfile() ?? {};
  const searches = [query, ...(profile.recentSearches ?? []).filter((s) => s !== query)].slice(0, 10);
  saveLocalProfile({ recentSearches: searches });
}

export function buildProfileAgentContext(profile: StyleProfile): string {
  const lines: string[] = [];
  if (profile.sizeProfile?.top) lines.push(`usual size in tops: ${profile.sizeProfile.top}`);
  if (profile.sizeProfile?.ethnic) lines.push(`usual size in ethnic wear: ${profile.sizeProfile.ethnic}`);
  if (profile.sizeProfile?.bottom) lines.push(`usual size in bottoms: ${profile.sizeProfile.bottom}`);
  if (profile.sizeProfile?.fitPref) lines.push(`prefers ${profile.sizeProfile.fitPref} fit`);
  if (profile.stylePreferences?.budgetMin != null && profile.stylePreferences?.budgetMax != null) {
    lines.push(`budget ₹${profile.stylePreferences.budgetMin}–₹${profile.stylePreferences.budgetMax}`);
  }
  if (profile.stylePreferences?.colors?.length) {
    lines.push(`favourite colours: ${profile.stylePreferences.colors.join(", ")}`);
  }
  if (profile.stylePreferences?.occasions?.length) {
    lines.push(`typically shops for: ${profile.stylePreferences.occasions.join(", ")}`);
  }
  if (profile.recentSearches?.length) {
    lines.push(`recent searches: ${profile.recentSearches.slice(0, 3).join(", ")}`);
  }
  if (profile.savedProductIds?.length) {
    lines.push(`has ${profile.savedProductIds.length} item${profile.savedProductIds.length === 1 ? "" : "s"} in wishlist`);
  }
  if (!lines.length) return "";
  return `SHOPPER MEMORY:\n${lines.map((l) => `• ${l}`).join("\n")}\nApply these as defaults — always prioritise sizes and budget stated above.`;
}
