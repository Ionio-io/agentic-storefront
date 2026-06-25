"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { Product } from "@/types";
import type { PreviewGroup } from "@/app/api/import-shopify/preview/route";

interface CatalogResponse {
  products: Product[];
  total: number;
  page: number;
  pages: number;
}

type Tab = "catalog" | "deadstock";

export default function CatalogPage() {
  const [tab, setTab] = useState<Tab>("catalog");
  const [catalog, setCatalog] = useState<CatalogResponse | null>(null);
  const [page, setPage] = useState(1);
  const [gender, setGender] = useState("all");
  const [uploadStatus, setUploadStatus] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  // URL import
  const [importUrl, setImportUrl] = useState("");
  const [clearExisting, setClearExisting] = useState(false);
  const [importStatus, setImportStatus] = useState<string | null>(null);
  const [importing, setImporting] = useState(false);

  // Preview modal
  const [scanning, setScanning] = useState(false);
  const [previewTotal, setPreviewTotal] = useState(0);
  const [previewGroups, setPreviewGroups] = useState<PreviewGroup[] | null>(null);
  const [selectedTypes, setSelectedTypes] = useState<Set<string>>(new Set());
  const [expandedMains, setExpandedMains] = useState<Set<string>>(new Set());

  // Bulk edit
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkStatus, setBulkStatus] = useState<string | null>(null);

  // Price override edit
  const [editingPrice, setEditingPrice] = useState<{ id: string; value: string } | null>(null);

  // Dead stock
  const [deadStock, setDeadStock] = useState<Product[] | null>(null);
  const [loadingDead, setLoadingDead] = useState(false);

  const fetchCatalog = useCallback((p = page, g = gender) => {
    fetch(`/api/catalog?page=${p}&limit=20&gender=${g}`)
      .then((r) => r.json())
      .then((data: CatalogResponse) => setCatalog(data))
      .catch(() => {});
  }, [page, gender]);

  useEffect(() => { fetchCatalog(); }, [fetchCatalog]);

  useEffect(() => {
    if (tab === "deadstock" && !deadStock) {
      setLoadingDead(true);
      fetch("/api/catalog/dead-stock")
        .then((r) => r.json())
        .then((d) => { setDeadStock(d.products ?? []); })
        .catch(() => setDeadStock([]))
        .finally(() => setLoadingDead(false));
    }
  }, [tab, deadStock]);

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true); setUploadStatus("Parsing JSON…");
    try {
      const json = JSON.parse(await file.text());
      setUploadStatus("Uploading…");
      const res = await fetch("/api/catalog", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(json) });
      const data = await res.json();
      if (res.ok) { setUploadStatus(`✓ ${data.count} products uploaded (${data.storage}). ${data.note ?? ""}`); fetchCatalog(1, gender); setPage(1); }
      else setUploadStatus(`Error: ${data.error}`);
    } catch { setUploadStatus("Invalid JSON file."); }
    finally { setUploading(false); if (fileRef.current) fileRef.current.value = ""; }
  }

  async function handleScan() {
    if (!importUrl.trim()) return;
    setScanning(true); setImportStatus("Scanning store…"); setPreviewGroups(null);
    try {
      const res = await fetch("/api/import-shopify/preview", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ storeUrl: importUrl.trim() }),
      });
      const data = await res.json() as { ok?: boolean; total?: number; groups?: PreviewGroup[]; error?: string };
      if (!res.ok || !data.ok) { setImportStatus(`Error: ${data.error}`); setScanning(false); return; }
      setImportStatus(null);
      setPreviewTotal(data.total ?? 0);
      setPreviewGroups(data.groups ?? []);
      const allTypes = new Set<string>();
      for (const g of (data.groups ?? [])) for (const t of g.types) allTypes.add(t.name);
      setSelectedTypes(allTypes);
      setExpandedMains(new Set((data.groups ?? []).map((g) => g.main)));
    } catch { setImportStatus("Request failed. Check the URL."); setScanning(false); }
  }

  function toggleMain(group: PreviewGroup) {
    const allSelected = group.types.every((t) => selectedTypes.has(t.name));
    setSelectedTypes((prev) => {
      const next = new Set(prev);
      if (allSelected) group.types.forEach((t) => next.delete(t.name));
      else group.types.forEach((t) => next.add(t.name));
      return next;
    });
  }

  function toggleType(name: string) {
    setSelectedTypes((prev) => { const next = new Set(prev); next.has(name) ? next.delete(name) : next.add(name); return next; });
  }

  function toggleExpand(main: string) {
    setExpandedMains((prev) => { const next = new Set(prev); next.has(main) ? next.delete(main) : next.add(main); return next; });
  }

  function selectAllTypes(select: boolean) {
    if (!previewGroups) return;
    if (select) {
      const all = new Set<string>();
      for (const g of previewGroups) for (const t of g.types) all.add(t.name);
      setSelectedTypes(all);
    } else {
      setSelectedTypes(new Set());
    }
  }

  async function handleImport() {
    if (!importUrl.trim() || !previewGroups) return;
    setImporting(true); setImportStatus("Importing…");
    try {
      const res = await fetch("/api/import-shopify", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ storeUrl: importUrl.trim(), clearExisting, categories: Array.from(selectedTypes) }),
      });
      const data = await res.json() as { ok?: boolean; imported?: number; pages?: number; storage?: string; error?: string; note?: string };
      if (res.ok && data.ok) {
        setImportStatus(`✓ ${data.imported} products imported across ${data.pages} pages (${data.storage}). ${data.note ?? ""}`);
        setPreviewGroups(null); setScanning(false);
        fetchCatalog(1, gender); setPage(1);
      } else { setImportStatus(`Error: ${data.error}`); }
    } catch { setImportStatus("Request failed."); }
    finally { setImporting(false); }
  }

  // ── Bulk actions ──────────────────────────────────────────────────────────

  function toggleSelectAll() {
    if (!catalog) return;
    if (selectedIds.size === catalog.products.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(catalog.products.map((p) => p.id)));
    }
  }

  function toggleSelect(id: string) {
    setSelectedIds((prev) => { const next = new Set(prev); next.has(id) ? next.delete(id) : next.add(id); return next; });
  }

  async function bulkUpdate(update: Record<string, unknown>, label: string) {
    if (!selectedIds.size) return;
    setBulkStatus(`${label}…`);
    const res = await fetch("/api/catalog/bulk", {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ids: Array.from(selectedIds), update }),
    });
    const d = await res.json();
    if (res.ok) { setBulkStatus(`✓ ${d.modified} products updated`); fetchCatalog(); setSelectedIds(new Set()); }
    else setBulkStatus(`Error: ${d.error}`);
  }

  async function handleClearNew() {
    setBulkStatus("Clearing NEW flags…");
    const body = selectedIds.size ? { ids: Array.from(selectedIds) } : {};
    const res = await fetch("/api/catalog/clear-new", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const d = await res.json();
    if (res.ok) { setBulkStatus(`✓ ${d.modified} products updated`); fetchCatalog(); setSelectedIds(new Set()); }
    else setBulkStatus(`Error: ${d.error}`);
  }

  async function savePriceOverride(productId: string, value: string) {
    const price = parseFloat(value);
    if (isNaN(price)) { setEditingPrice(null); return; }
    await fetch("/api/catalog/bulk", {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ids: [productId], update: { price_override: price } }),
    });
    setEditingPrice(null);
    fetchCatalog();
  }

  // Derived selection counts
  const selectedCount = previewGroups
    ? previewGroups.flatMap((g) => g.types).filter((t) => selectedTypes.has(t.name)).reduce((s, t) => s + t.count, 0)
    : 0;
  const totalTypes = previewGroups?.flatMap((g) => g.types).length ?? 0;
  const newCount = catalog?.products.filter((p) => p.is_new).length ?? 0;
  const allPageSelected = !!(catalog && catalog.products.length > 0 && catalog.products.every((p) => selectedIds.has(p.id)));

  return (
    <div className="px-8 py-10">
      <h1 className="font-sans text-2xl font-bold text-[#111827] tracking-tight mb-1">Catalog</h1>
      <p className="font-mono text-xs text-[#6B7280] mb-8">Manage your product catalog — upload or import from any Shopify store.</p>

      {/* Stats */}
      {catalog && (
        <div className="grid grid-cols-4 gap-4 mb-8">
          {[
            { label: "Total Products", value: catalog.total },
            { label: "Women", value: catalog.products.filter((p) => p.gender === "female").length },
            { label: "Men", value: catalog.products.filter((p) => p.gender === "male").length },
            { label: "New Arrivals", value: newCount, highlight: newCount > 0 },
          ].map((s) => (
            <div key={s.label} className={`bg-white border px-5 py-4 ${s.highlight ? "border-[#C9A84C]" : "border-[#E4E7EC]"}`}>
              <p className={`font-sans text-2xl font-bold tracking-tight ${s.highlight ? "text-[#C9A84C]" : "text-[#111827]"}`}>{s.value ?? "—"}</p>
              <p className="font-mono text-xs text-[#6B7280] mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>
      )}

      {/* Upload */}
      <div className="bg-white border border-[#D8D0C0] px-6 py-5 mb-6">
        <p className="font-mono text-xs text-[#6B5D4E] uppercase tracking-widest mb-3">Upload JSON</p>
        <p className="font-sans text-sm text-[#6B5D4E] mb-4">
          Accepts a Shopify JSON export (<code className="bg-[#F7F5F0] px-1">{"{ products: [...] }"}</code>). Max 500 products.
        </p>
        <label className="cursor-pointer">
          <input ref={fileRef} type="file" accept=".json,application/json" onChange={handleUpload} disabled={uploading} className="hidden" />
          <span className="inline-block border border-[#D8D0C0] font-mono text-xs tracking-widest px-6 py-2.5 hover:bg-[#F7F5F0] transition-colors cursor-pointer">
            {uploading ? "Uploading…" : "Choose JSON File"}
          </span>
        </label>
        {uploadStatus && <p className="font-mono text-xs mt-3 text-[#4A3728] max-w-lg leading-relaxed">{uploadStatus}</p>}
      </div>

      {/* Shopify URL Importer */}
      <div className="bg-white border border-[#D8D0C0] px-6 py-5 mb-8">
        <p className="font-mono text-xs text-[#6B5D4E] uppercase tracking-widest mb-3">Import from Shopify Store</p>
        <p className="font-sans text-sm text-[#6B5D4E] mb-4">
          Paste any public Shopify URL — scan to preview categories first, then choose what to import.
        </p>
        <div className="flex gap-3 items-center flex-wrap">
          <input
            type="url" value={importUrl}
            onChange={(e) => { setImportUrl(e.target.value); setPreviewGroups(null); setImportStatus(null); }}
            placeholder="https://store.myshopify.com"
            disabled={scanning || importing}
            className="flex-1 min-w-[260px] border border-[#D8D0C0] font-mono text-xs px-3 py-2.5 focus:outline-none focus:border-[#C9A84C] disabled:opacity-50"
          />
          <button
            onClick={handleScan}
            disabled={scanning || importing || !importUrl.trim()}
            className="border border-[#C9A84C] bg-[#C9A84C] text-white font-mono text-xs tracking-widest px-6 py-2.5 hover:bg-[#b8963e] transition-colors disabled:opacity-40"
          >
            {scanning && !previewGroups ? "Scanning…" : "Scan & Preview"}
          </button>
        </div>
        {importStatus && (
          <p className="font-mono text-xs mt-3 text-[#4A3728] max-w-xl leading-relaxed">{importStatus}</p>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-0 mb-4 border-b border-[#D8D0C0]">
        {([["catalog", "All Products"], ["deadstock", "Dead Stock"]] as const).map(([t, label]) => (
          <button key={t} onClick={() => setTab(t)}
            className={`font-mono text-xs tracking-widest px-5 py-2.5 border-b-2 transition-colors ${tab === t ? "border-[#C9A84C] text-[#4A3728]" : "border-transparent text-[#8A7560] hover:text-[#4A3728]"}`}>
            {label}
          </button>
        ))}
      </div>

      {/* Bulk action bar */}
      {tab === "catalog" && selectedIds.size > 0 && (
        <div className="bg-[#C9A84C]/10 border border-[#C9A84C]/30 px-5 py-3 mb-4 flex items-center gap-3 flex-wrap">
          <span className="font-mono text-xs text-[#4A3728]">{selectedIds.size} selected</span>
          <button onClick={() => bulkUpdate({ is_featured: true }, "Marking featured")}
            className="font-mono text-xs px-3 py-1.5 border border-[#C9A84C] text-[#C9A84C] hover:bg-[#C9A84C] hover:text-white transition-colors">★ Mark Featured</button>
          <button onClick={() => bulkUpdate({ is_featured: false }, "Removing featured")}
            className="font-mono text-xs px-3 py-1.5 border border-[#D8D0C0] text-[#6B5D4E] hover:bg-[#F7F5F0] transition-colors">☆ Remove Featured</button>
          <button onClick={handleClearNew}
            className="font-mono text-xs px-3 py-1.5 border border-[#D8D0C0] text-[#6B5D4E] hover:bg-[#F7F5F0] transition-colors">Clear NEW</button>
          <button onClick={() => bulkUpdate({ available: false }, "Hiding products")}
            className="font-mono text-xs px-3 py-1.5 border border-[#D8D0C0] text-[#6B5D4E] hover:bg-[#F7F5F0] transition-colors">Hide</button>
          <button onClick={() => setSelectedIds(new Set())}
            className="font-mono text-xs text-[#8A7560] hover:text-[#4A3728] ml-auto">✕ Deselect</button>
          {bulkStatus && <span className="font-mono text-xs text-[#4A3728]">{bulkStatus}</span>}
        </div>
      )}

      {tab === "catalog" && (
        <>
          {/* Filters + controls row */}
          <div className="flex items-center gap-4 mb-4 flex-wrap">
            <select value={gender} onChange={(e) => { setGender(e.target.value); setPage(1); setSelectedIds(new Set()); }}
              className="border border-[#D8D0C0] bg-white px-3 py-2 font-mono text-xs focus:outline-none focus:border-[#C9A84C]">
              <option value="all">All genders</option>
              <option value="female">Women</option>
              <option value="male">Men</option>
            </select>
            <span className="font-mono text-xs text-[#8A7560]">
              {catalog ? `${catalog.total} products · page ${catalog.page} of ${catalog.pages}` : "Loading…"}
            </span>
            <button onClick={handleClearNew} className="ml-auto font-mono text-xs px-4 py-2 border border-[#D8D0C0] hover:bg-[#F7F5F0] transition-colors text-[#6B5D4E]">
              Clear All NEW Flags
            </button>
          </div>

          <div className="bg-white border border-[#D8D0C0] overflow-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[#D8D0C0] bg-[#F7F5F0]">
                  <th className="px-4 py-3">
                    <input type="checkbox" checked={allPageSelected} onChange={toggleSelectAll} className="accent-[#C9A84C]" />
                  </th>
                  {["Image", "Title", "Category", "Gender", "Price", "Sizes", "VTON", "Flags"].map((h) => (
                    <th key={h} className="px-4 py-3 font-sans text-xs font-semibold text-[#374151] uppercase tracking-widest text-left">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {(catalog?.products ?? []).map((p) => {
                  const isSelected = selectedIds.has(p.id);
                  const displayPrice = p.price_override ?? p.price;
                  const isEditing = editingPrice?.id === p.id;
                  return (
                    <tr key={p.id} className={`border-b border-[#F0EBE3] hover:bg-[#FAFAF7] ${isSelected ? "bg-[#FFFDF5]" : ""}`}>
                      <td className="px-4 py-2">
                        <input type="checkbox" checked={isSelected} onChange={() => toggleSelect(p.id)} className="accent-[#C9A84C]" />
                      </td>
                      <td className="px-4 py-2">
                        <div className="relative w-10 h-12">
                          {p.image_urls[0]
                            // eslint-disable-next-line @next/next/no-img-element
                            ? <img src={p.image_urls[0]} alt={p.title} className="w-full h-full object-cover" />
                            : <div className="w-full h-full bg-[#F0EBE3]" />}
                          {p.is_new && (
                            <span className="absolute -top-1 -left-1 bg-[#C9A84C] text-white font-mono text-[7px] px-1 py-0.5 leading-none">NEW</span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-2 font-sans text-xs max-w-[160px] truncate">{p.title}</td>
                      <td className="px-4 py-2">
                        <span className="font-mono text-xs text-[#8A7560] block">{p.main_category ?? "—"}</span>
                        <span className="font-mono text-[10px] text-[#B0A090]">{p.product_type}</span>
                      </td>
                      <td className="px-4 py-2 font-mono text-xs">{p.gender}</td>
                      <td className="px-4 py-2 font-mono text-xs">
                        {isEditing ? (
                          <div className="flex items-center gap-1">
                            <input
                              autoFocus
                              type="number"
                              value={editingPrice!.value}
                              onChange={(e) => setEditingPrice({ id: p.id, value: e.target.value })}
                              onBlur={() => savePriceOverride(p.id, editingPrice!.value)}
                              onKeyDown={(e) => { if (e.key === "Enter") savePriceOverride(p.id, editingPrice!.value); if (e.key === "Escape") setEditingPrice(null); }}
                              className="w-20 border border-[#C9A84C] px-1.5 py-0.5 text-xs font-mono focus:outline-none"
                            />
                          </div>
                        ) : (
                          <button onClick={() => setEditingPrice({ id: p.id, value: String(displayPrice) })}
                            className="hover:text-[#C9A84C] transition-colors group flex items-center gap-1">
                            ₹{displayPrice}
                            {p.price_override && <span className="text-[#C9A84C] text-[9px]">✎</span>}
                            <span className="text-[10px] opacity-0 group-hover:opacity-50">✎</span>
                          </button>
                        )}
                      </td>
                      <td className="px-4 py-2 font-mono text-xs">{(p.available_sizes ?? p.sizes).join(", ")}</td>
                      <td className="px-4 py-2 font-mono text-xs text-[#C9A84C]">{p.vton_category}</td>
                      <td className="px-4 py-2">
                        <div className="flex gap-1 items-center">
                          {p.is_featured && <span className="text-[#C9A84C] text-sm" title="Featured">★</span>}
                          {p.is_new && <span className="font-mono text-[9px] bg-[#C9A84C] text-white px-1 py-0.5">NEW</span>}
                          <button onClick={() => fetch("/api/catalog/bulk", {
                            method: "PATCH", headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({ ids: [p.id], update: { is_featured: !p.is_featured } }),
                          }).then(() => fetchCatalog())}
                            className="text-xs text-[#B0A090] hover:text-[#C9A84C] transition-colors ml-1" title={p.is_featured ? "Remove featured" : "Mark featured"}>
                            {p.is_featured ? "☆" : "★"}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {catalog && catalog.pages > 1 && (
            <div className="flex gap-2 mt-4">
              <button onClick={() => { setPage((p) => Math.max(1, p - 1)); setSelectedIds(new Set()); }} disabled={page === 1}
                className="border border-[#D8D0C0] font-mono text-xs px-4 py-2 disabled:opacity-40 hover:bg-[#F7F5F0]">← Prev</button>
              <button onClick={() => { setPage((p) => Math.min(catalog.pages, p + 1)); setSelectedIds(new Set()); }} disabled={page === catalog.pages}
                className="border border-[#D8D0C0] font-mono text-xs px-4 py-2 disabled:opacity-40 hover:bg-[#F7F5F0]">Next →</button>
            </div>
          )}
        </>
      )}

      {/* Dead stock tab */}
      {tab === "deadstock" && (
        <div>
          <p className="font-mono text-xs text-[#8A7560] mb-4">Products with low views or no recent activity (≤5 views or not viewed in 30 days).</p>
          {loadingDead && <p className="font-mono text-xs text-[#8A7560]">Loading…</p>}
          {deadStock && !loadingDead && (
            deadStock.length === 0
              ? <p className="font-mono text-xs text-[#8A7560]">No dead stock found — all products have recent activity.</p>
              : (
                <div className="bg-white border border-[#D8D0C0] overflow-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-[#D8D0C0] bg-[#F7F5F0]">
                        {["Image", "Title", "Category", "Price", "Views", "Last Viewed"].map((h) => (
                          <th key={h} className="px-4 py-3 font-sans text-xs font-semibold text-[#374151] uppercase tracking-widest text-left">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {deadStock.map((p) => (
                        <tr key={p.id} className="border-b border-[#F0EBE3] hover:bg-[#FAFAF7]">
                          <td className="px-4 py-2">
                            <div className="w-10 h-12">
                              {p.image_urls[0]
                                // eslint-disable-next-line @next/next/no-img-element
                                ? <img src={p.image_urls[0]} alt={p.title} className="w-full h-full object-cover" />
                                : <div className="w-full h-full bg-[#F0EBE3]" />}
                            </div>
                          </td>
                          <td className="px-4 py-2 font-sans text-xs max-w-[160px] truncate">{p.title}</td>
                          <td className="px-4 py-2 font-mono text-xs text-[#8A7560]">{p.main_category ?? p.product_type}</td>
                          <td className="px-4 py-2 font-mono text-xs">₹{p.price_override ?? p.price}</td>
                          <td className="px-4 py-2 font-mono text-xs text-[#B0A090]">{p.view_count ?? 0}</td>
                          <td className="px-4 py-2 font-mono text-xs text-[#B0A090]">
                            {p.last_viewed_at ? new Date(p.last_viewed_at).toLocaleDateString() : "Never"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )
          )}
        </div>
      )}

      {/* ── Import Preview Modal ─────────────────────────────────────────────── */}
      {previewGroups && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
          onClick={(e) => { if (e.target === e.currentTarget) { setPreviewGroups(null); setScanning(false); } }}>
          <div className="bg-white rounded-lg w-full max-w-xl mx-4 max-h-[88vh] flex flex-col shadow-2xl overflow-hidden">

            {/* Header */}
            <div className="px-6 pt-6 pb-4 border-b border-[#E4E7EC]">
              <div className="flex items-start justify-between gap-4 mb-4">
                <div>
                  <h2 className="font-sans text-base font-bold text-[#111827] tracking-tight">Choose What to Import</h2>
                  <p className="font-mono text-xs text-[#6B7280] mt-1">
                    from {importUrl.replace(/^https?:\/\//, "").replace(/\/$/, "")}
                  </p>
                </div>
                <button onClick={() => { setPreviewGroups(null); setScanning(false); }}
                  className="w-7 h-7 flex items-center justify-center rounded-md text-[#9CA3AF] hover:bg-[#F3F4F6] hover:text-[#374151] transition-colors shrink-0 text-sm">✕</button>
              </div>

              {/* Pill stats */}
              <div className="flex gap-2 flex-wrap mb-4">
                {[
                  { label: `${previewTotal.toLocaleString()} products` },
                  { label: `${previewGroups.length} categories` },
                  { label: `${totalTypes} types` },
                ].map((s) => (
                  <span key={s.label} className="inline-flex items-center font-mono text-[10px] font-600 text-[#374151] bg-[#F3F4F6] border border-[#E4E7EC] px-2.5 py-1 rounded-full">{s.label}</span>
                ))}
              </div>

              <div className="flex items-center justify-between">
                <div className="flex gap-3">
                  <button onClick={() => selectAllTypes(true)} className="font-mono text-xs text-[#C9A84C] hover:underline font-semibold">Select all</button>
                  <button onClick={() => selectAllTypes(false)} className="font-mono text-xs text-[#9CA3AF] hover:text-[#374151] hover:underline">None</button>
                </div>
                <span className="font-sans text-xs font-semibold text-[#111827]">
                  {selectedCount.toLocaleString()} selected
                </span>
              </div>

              <label className="flex items-center gap-2 mt-3 cursor-pointer">
                <input type="checkbox" checked={clearExisting} onChange={(e) => setClearExisting(e.target.checked)} className="accent-[#C9A84C]" />
                <span className="font-mono text-xs text-[#6B7280]">Replace existing catalog on import</span>
              </label>
            </div>

            {/* Category groups */}
            <div className="overflow-y-auto flex-1 bg-[#F9FAFB]">
              {previewGroups.map((group) => {
                const allSel = group.types.every((t) => selectedTypes.has(t.name));
                const someSel = !allSel && group.types.some((t) => selectedTypes.has(t.name));
                const isExpanded = expandedMains.has(group.main);

                return (
                  <div key={group.main} className="border-b border-[#E4E7EC]">
                    <div className="flex items-center gap-3 px-5 py-3 bg-white hover:bg-[#F9FAFB] transition-colors">
                      <input
                        type="checkbox" checked={allSel}
                        ref={(el) => { if (el) el.indeterminate = someSel; }}
                        onChange={() => toggleMain(group)}
                        className="accent-[#C9A84C] shrink-0"
                      />
                      <button onClick={() => toggleExpand(group.main)} className="flex-1 flex items-center gap-2 text-left">
                        <span className="font-sans text-sm font-semibold text-[#111827]">{group.main}</span>
                        <span className="font-mono text-xs text-[#9CA3AF]">{group.count.toLocaleString()}</span>
                        <span className="ml-auto font-mono text-[10px] text-[#9CA3AF]">
                          {isExpanded ? "▲" : "▼"} {group.types.length} types
                        </span>
                      </button>
                    </div>

                    {isExpanded && (
                      <div>
                        {group.types.map((t) => (
                          <label key={t.name}
                            className="flex items-center gap-3 pl-11 pr-5 py-2 cursor-pointer hover:bg-[#F3F4F6] transition-colors border-t border-[#F3F4F6]">
                            <input type="checkbox" checked={selectedTypes.has(t.name)} onChange={() => toggleType(t.name)}
                              className="accent-[#C9A84C] shrink-0" />
                            <div className="flex-1 min-w-0">
                              <span className="font-sans text-xs text-[#374151]">{t.name}</span>
                              {t.sub !== t.name && (
                                <span className="font-mono text-[10px] text-[#9CA3AF] ml-2">→ {t.sub}</span>
                              )}
                            </div>
                            <span className="font-mono text-[10px] text-[#9CA3AF] shrink-0">{t.count.toLocaleString()}</span>
                          </label>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t border-[#E4E7EC] bg-white flex items-center gap-3">
              <button onClick={handleImport} disabled={importing || selectedCount === 0}
                className="flex-1 bg-[#111827] text-white font-sans text-sm font-semibold py-2.5 rounded-md hover:bg-[#1F2937] transition-colors disabled:opacity-40">
                {importing ? "Importing…" : `Import ${selectedCount.toLocaleString()} Products`}
              </button>
              <button onClick={() => { setPreviewGroups(null); setScanning(false); }}
                className="border border-[#E4E7EC] font-sans text-sm font-medium text-[#374151] px-5 py-2.5 rounded-md hover:bg-[#F3F4F6] transition-colors">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
