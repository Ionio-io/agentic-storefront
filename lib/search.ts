import { DEMO_PRODUCTS } from "@/data/products";
import { Product } from "@/types";

export function searchLocal(
  query: string,
  gender: string,
  maxPrice?: number,
  limit = 4
): Product[] {
  const words = query.toLowerCase().split(/\s+/).filter(Boolean);
  return DEMO_PRODUCTS.filter((p) => {
    const matchesGender = gender === "all" || p.gender === gender;
    const matchesPrice  = !maxPrice || p.price <= maxPrice;
    const matchesQuery  =
      words.length === 0 ||
      words.some((w) =>
        p.title.toLowerCase().includes(w) ||
        p.description.toLowerCase().includes(w) ||
        p.product_type.toLowerCase().includes(w) ||
        p.vendor.toLowerCase().includes(w) ||
        p.tags.some((t) => t.toLowerCase().includes(w))
      );
    return matchesGender && matchesPrice && matchesQuery;
  }).slice(0, limit);
}
