"use client";

import { useEffect, useRef, useState } from "react";
import { Product } from "@/types";

interface CatalogResponse {
  products: Product[];
  total: number;
  page: number;
  pages: number;
}

export default function CatalogPage() {
  const [catalog, setCatalog] = useState<CatalogResponse | null>(null);
  const [page, setPage] = useState(1);
  const [gender, setGender] = useState("all");
  const [uploadStatus, setUploadStatus] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const fetchCatalog = (p = page, g = gender) => {
    fetch(`/api/catalog?page=${p}&limit=20&gender=${g}`)
      .then((r) => r.json())
      .then((data: CatalogResponse) => setCatalog(data))
      .catch(() => {});
  };

  useEffect(() => {
    fetchCatalog();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, gender]);

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setUploadStatus("Parsing JSON…");

    try {
      const text = await file.text();
      const json = JSON.parse(text);

      setUploadStatus("Uploading to catalog…");
      const res = await fetch("/api/catalog", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(json),
      });
      const data = await res.json();

      if (res.ok) {
        setUploadStatus(
          `✓ ${data.count} products uploaded (${data.storage}). ${data.note ?? ""}`
        );
        fetchCatalog(1, gender);
        setPage(1);
      } else {
        setUploadStatus(`Error: ${data.error}`);
      }
    } catch {
      setUploadStatus("Invalid JSON file.");
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  const stats = catalog
    ? {
        total: catalog.total,
        women: catalog.products.filter((p) => p.gender === "female").length,
        men: catalog.products.filter((p) => p.gender === "male").length,
      }
    : null;

  return (
    <div className="px-8 py-10">
      <h1 className="font-display text-2xl tracking-wide mb-1">Catalog</h1>
      <p className="font-mono text-xs text-[#8A7560] mb-8">
        Browse your product catalog or upload a Shopify JSON export.
      </p>

      {/* Stats */}
      {catalog && (
        <div className="grid grid-cols-3 gap-4 mb-8">
          {[
            { label: "Total Products", value: catalog.total },
            { label: "Women", value: stats?.women },
            { label: "Men", value: stats?.men },
          ].map((s) => (
            <div key={s.label} className="bg-white border border-[#D8D0C0] px-5 py-4">
              <p className="font-display text-2xl">{s.value ?? "—"}</p>
              <p className="font-mono text-xs text-[#8A7560] mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>
      )}

      {/* Upload */}
      <div className="bg-white border border-[#D8D0C0] px-6 py-5 mb-8">
        <p className="font-mono text-xs text-[#6B5D4E] uppercase tracking-widest mb-3">
          Upload Product Catalog
        </p>
        <p className="font-sans text-sm text-[#6B5D4E] mb-4">
          Accepts a Shopify JSON export (<code className="bg-[#F7F5F0] px-1">{"{ products: [...] }"}</code>) or an array of products in our format.
          Max 500 products per upload.
        </p>
        <label className="cursor-pointer">
          <input
            ref={fileRef}
            type="file"
            accept=".json,application/json"
            onChange={handleUpload}
            disabled={uploading}
            className="hidden"
          />
          <span className="inline-block border border-[#D8D0C0] font-mono text-xs tracking-widest px-6 py-2.5 hover:bg-[#F7F5F0] transition-colors cursor-pointer">
            {uploading ? "Uploading…" : "Choose JSON File"}
          </span>
        </label>
        {uploadStatus && (
          <p className="font-mono text-xs mt-3 text-[#4A3728] max-w-lg leading-relaxed">
            {uploadStatus}
          </p>
        )}
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4 mb-4">
        <select
          value={gender}
          onChange={(e) => { setGender(e.target.value); setPage(1); }}
          className="border border-[#D8D0C0] bg-white px-3 py-2 font-mono text-xs focus:outline-none focus:border-[#C9A84C]"
        >
          <option value="all">All genders</option>
          <option value="female">Women</option>
          <option value="male">Men</option>
        </select>
        <span className="font-mono text-xs text-[#8A7560]">
          {catalog ? `${catalog.total} products · page ${catalog.page} of ${catalog.pages}` : "Loading…"}
        </span>
      </div>

      {/* Product table */}
      <div className="bg-white border border-[#D8D0C0] overflow-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[#D8D0C0] bg-[#F7F5F0]">
              {["Image", "Title", "Type", "Gender", "Price", "Sizes", "VTON"].map((h) => (
                <th key={h} className="px-4 py-3 font-mono text-xs text-[#6B5D4E] uppercase tracking-widest text-left">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {(catalog?.products ?? []).map((p) => (
              <tr key={p.id} className="border-b border-[#F0EBE3] hover:bg-[#FAFAF7]">
                <td className="px-4 py-2">
                  {p.image_urls[0] ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={p.image_urls[0]} alt={p.title} className="w-10 h-12 object-cover" />
                  ) : (
                    <div className="w-10 h-12 bg-[#F0EBE3]" />
                  )}
                </td>
                <td className="px-4 py-2 font-sans text-xs max-w-[180px] truncate">{p.title}</td>
                <td className="px-4 py-2 font-mono text-xs text-[#8A7560]">{p.product_type}</td>
                <td className="px-4 py-2 font-mono text-xs">{p.gender}</td>
                <td className="px-4 py-2 font-mono text-xs">₹{p.price}</td>
                <td className="px-4 py-2 font-mono text-xs">{p.sizes.join(", ")}</td>
                <td className="px-4 py-2 font-mono text-xs text-[#C9A84C]">{p.vton_category}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {catalog && catalog.pages > 1 && (
        <div className="flex gap-2 mt-4">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="border border-[#D8D0C0] font-mono text-xs px-4 py-2 disabled:opacity-40 hover:bg-[#F7F5F0]"
          >
            ← Prev
          </button>
          <button
            onClick={() => setPage((p) => Math.min(catalog.pages, p + 1))}
            disabled={page === catalog.pages}
            className="border border-[#D8D0C0] font-mono text-xs px-4 py-2 disabled:opacity-40 hover:bg-[#F7F5F0]"
          >
            Next →
          </button>
        </div>
      )}
    </div>
  );
}
