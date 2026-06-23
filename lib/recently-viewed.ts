import { Product } from "@/types";

const KEY = "recently-viewed";
const MAX = 6;

export function addRecentlyViewed(product: Product): void {
  try {
    const current = getRecentlyViewed().filter((p) => p.id !== product.id);
    localStorage.setItem(KEY, JSON.stringify([product, ...current].slice(0, MAX)));
  } catch {}
}

export function getRecentlyViewed(): Product[] {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as Product[]) : [];
  } catch {
    return [];
  }
}
