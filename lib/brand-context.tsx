"use client";
import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { DEFAULT_BRAND, BrandConfig } from "@/data/brand";

const BrandContext = createContext<BrandConfig>(DEFAULT_BRAND);

export function BrandProvider({ children }: { children: ReactNode }) {
  const [brand, setBrand] = useState<BrandConfig>(DEFAULT_BRAND);

  useEffect(() => {
    fetch("/api/brand")
      .then((r) => r.json())
      .then((data: BrandConfig) => { if (data?.name) setBrand(data); })
      .catch(() => {});
  }, []);

  return <BrandContext.Provider value={brand}>{children}</BrandContext.Provider>;
}

export function useBrand(): BrandConfig {
  return useContext(BrandContext);
}
