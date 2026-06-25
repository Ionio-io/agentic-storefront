"use client";

import { useEffect, useState } from "react";
import { Collection, Product } from "@/types";

export default function CollectionsPage() {
  const [collections, setCollections] = useState<Collection[]>([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState<Collection | null>(null);
  const [form, setForm] = useState({ name: "", description: "", coverImage: "" });

  // Product picker (for adding products to a collection)
  const [pickerOpen, setPickerOpen] = useState(false);
  const [pickerProducts, setPickerProducts] = useState<Product[]>([]);
  const [pickerSelected, setPickerSelected] = useState<Set<string>>(new Set());
  const [pickerSearch, setPickerSearch] = useState("");

  // Image picker (for selecting cover image from catalog)
  const [imagePicker, setImagePicker] = useState(false);
  const [imagePickerProducts, setImagePickerProducts] = useState<Product[]>([]);
  const [imagePickerSearch, setImagePickerSearch] = useState("");

  const fetchCollections = () => {
    fetch("/api/collections")
      .then((r) => r.json())
      .then((d) => setCollections(d.collections ?? []))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchCollections(); }, []);

  function openCreate() {
    setForm({ name: "", description: "", coverImage: "" });
    setEditing(null);
    setCreating(true);
  }

  function openEdit(col: Collection) {
    setForm({ name: col.name, description: col.description ?? "", coverImage: col.coverImage ?? "" });
    setEditing(col);
    setCreating(true);
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name) return;
    setStatus("Saving…");

    if (editing) {
      const res = await fetch(`/api/collections/${editing.slug}`, {
        method: "PATCH", headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const d = await res.json();
      if (res.ok) { setStatus("✓ Collection updated"); setCreating(false); fetchCollections(); }
      else setStatus(`Error: ${d.error}`);
    } else {
      const res = await fetch("/api/collections", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const d = await res.json();
      if (res.ok) { setStatus("✓ Collection created"); setCreating(false); fetchCollections(); }
      else setStatus(`Error: ${d.error}`);
    }
  }

  async function handleDelete(col: Collection) {
    if (!confirm(`Delete "${col.name}"?`)) return;
    await fetch(`/api/collections/${col.slug}`, { method: "DELETE" });
    fetchCollections();
  }

  async function openImagePicker() {
    setImagePickerSearch("");
    if (imagePickerProducts.length === 0) {
      const d = await fetch("/api/catalog?limit=500").then((r) => r.json());
      setImagePickerProducts(d.products ?? []);
    }
    setImagePicker(true);
  }

  async function openPicker(col: Collection) {
    setEditing(col);
    setPickerSelected(new Set(col.productIds));
    setPickerSearch("");
    if (pickerProducts.length === 0) {
      const d = await fetch("/api/catalog?limit=500").then((r) => r.json());
      setPickerProducts(d.products ?? []);
    }
    setPickerOpen(true);
  }

  async function savePicker() {
    if (!editing) return;
    setStatus("Saving products…");
    const res = await fetch(`/api/collections/${editing.slug}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ productIds: Array.from(pickerSelected) }),
    });
    const d = await res.json();
    if (res.ok) { setStatus(`✓ ${pickerSelected.size} products in collection`); setPickerOpen(false); fetchCollections(); }
    else setStatus(`Error: ${d.error}`);
  }

  const filtered = pickerProducts.filter((p) =>
    !pickerSearch || p.title.toLowerCase().includes(pickerSearch.toLowerCase()) || p.product_type.toLowerCase().includes(pickerSearch.toLowerCase())
  );

  return (
    <div className="px-8 py-10">
      <div className="flex items-start justify-between mb-1">
        <h1 className="font-display text-2xl tracking-wide">Collections</h1>
        <button onClick={openCreate}
          className="border border-[#C9A84C] bg-[#C9A84C] text-white font-mono text-xs tracking-widest px-5 py-2.5 hover:bg-[#b8963e] transition-colors">
          + New Collection
        </button>
      </div>
      <p className="font-mono text-xs text-[#8A7560] mb-8">Curate product groups — these appear as browseable collections in your storefront.</p>

      {status && (
        <div className="mb-6 font-mono text-xs text-[#4A3728] bg-[#C9A84C]/10 border border-[#C9A84C]/30 px-4 py-3">{status}</div>
      )}

      {loading && <p className="font-mono text-xs text-[#8A7560]">Loading…</p>}

      {!loading && collections.length === 0 && !creating && (
        <div className="bg-white border border-[#D8D0C0] px-6 py-10 text-center">
          <p className="font-mono text-xs text-[#8A7560]">No collections yet.</p>
          <button onClick={openCreate} className="mt-4 font-mono text-xs text-[#C9A84C] hover:underline">+ Create your first collection</button>
        </div>
      )}

      <div className="grid grid-cols-1 gap-4">
        {collections.map((col) => (
          <div key={col._id} className="bg-white border border-[#D8D0C0] px-6 py-5 flex items-start gap-4">
            {col.coverImage && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={col.coverImage} alt={col.name} className="w-16 h-16 object-cover shrink-0" />
            )}
            <div className="flex-1 min-w-0">
              <div className="flex items-baseline gap-2 mb-0.5">
                <span className="font-sans text-sm font-semibold text-[#2C2C2C]">{col.name}</span>
                <span className="font-mono text-[10px] text-[#B0A090]">/{col.slug}</span>
              </div>
              {col.description && <p className="font-sans text-xs text-[#8A7560] mb-1">{col.description}</p>}
              <span className="font-mono text-[10px] text-[#B0A090]">{col.productIds.length} products</span>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button onClick={() => openPicker(col)}
                className="font-mono text-xs px-3 py-1.5 border border-[#D8D0C0] text-[#6B5D4E] hover:bg-[#F7F5F0] transition-colors">
                Edit Products
              </button>
              <button onClick={() => openEdit(col)}
                className="font-mono text-xs px-3 py-1.5 border border-[#D8D0C0] text-[#6B5D4E] hover:bg-[#F7F5F0] transition-colors">
                Edit
              </button>
              <a href={`/shop/collections/${col.slug}`} target="_blank"
                className="font-mono text-xs px-3 py-1.5 border border-[#D8D0C0] text-[#C9A84C] hover:bg-[#F7F5F0] transition-colors">
                View ↗
              </a>
              <button onClick={() => handleDelete(col)}
                className="font-mono text-xs px-3 py-1.5 border border-[#D8D0C0] text-[#B0A090] hover:text-red-600 transition-colors">
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Create / Edit modal */}
      {creating && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
          onClick={(e) => { if (e.target === e.currentTarget) setCreating(false); }}>
          <form onSubmit={handleSave} className="bg-[#FAF8F4] border border-[#D8D0C0] w-full max-w-md mx-4 p-6 shadow-2xl">
            <p className="font-display text-lg tracking-wide mb-5">{editing ? "Edit Collection" : "New Collection"}</p>

            <label className="block mb-4">
              <span className="font-mono text-xs text-[#6B5D4E] uppercase tracking-widest block mb-1.5">Name *</span>
              <input required value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                placeholder="Summer Essentials" className="w-full border border-[#D8D0C0] px-3 py-2 font-mono text-xs focus:outline-none focus:border-[#C9A84C]" />
            </label>

            <label className="block mb-4">
              <span className="font-mono text-xs text-[#6B5D4E] uppercase tracking-widest block mb-1.5">Description</span>
              <textarea value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                placeholder="Optional tagline…" rows={2}
                className="w-full border border-[#D8D0C0] px-3 py-2 font-mono text-xs focus:outline-none focus:border-[#C9A84C] resize-none" />
            </label>

            <div className="block mb-6">
              <span className="font-mono text-xs text-[#6B5D4E] uppercase tracking-widest block mb-1.5">Cover Image URL</span>
              <div className="flex gap-2">
                <input value={form.coverImage} onChange={(e) => setForm((f) => ({ ...f, coverImage: e.target.value }))}
                  placeholder="https://cdn.shopify.com/…"
                  className="flex-1 border border-[#D8D0C0] px-3 py-2 font-mono text-xs focus:outline-none focus:border-[#C9A84C]" />
                <button type="button" onClick={openImagePicker}
                  className="shrink-0 border border-[#D8D0C0] font-mono text-xs px-3 py-2 text-[#6B5D4E] hover:bg-[#F7F5F0] transition-colors whitespace-nowrap">
                  Pick from catalog
                </button>
              </div>
              <p className="font-mono text-[10px] text-[#B0A090] mt-1.5">Use a Shopify CDN URL from your product catalog — local paths won&apos;t work.</p>
            </div>

            <div className="flex gap-3">
              <button type="submit" className="flex-1 border border-[#C9A84C] bg-[#C9A84C] text-white font-mono text-xs tracking-widest py-2.5 hover:bg-[#b8963e] transition-colors">
                {editing ? "Save Changes" : "Create Collection"}
              </button>
              <button type="button" onClick={() => setCreating(false)}
                className="border border-[#D8D0C0] font-mono text-xs tracking-widest px-5 py-2.5 hover:bg-[#F7F5F0] transition-colors">
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Image picker modal */}
      {imagePicker && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
          onClick={(e) => { if (e.target === e.currentTarget) setImagePicker(false); }}>
          <div className="bg-white rounded-lg w-full max-w-2xl mx-4 max-h-[85vh] flex flex-col shadow-2xl overflow-hidden">
            <div className="px-6 py-5 border-b border-[#E4E7EC]">
              <div className="flex items-center justify-between mb-3">
                <h2 className="font-sans text-base font-bold text-[#111827]">Pick Cover Image</h2>
                <button onClick={() => setImagePicker(false)}
                  className="w-7 h-7 flex items-center justify-center rounded-md text-[#9CA3AF] hover:bg-[#F3F4F6] hover:text-[#374151] transition-colors text-sm">✕</button>
              </div>
              <input
                value={imagePickerSearch}
                onChange={(e) => setImagePickerSearch(e.target.value)}
                placeholder="Search products…"
                className="w-full border border-[#E4E7EC] rounded-md px-3 py-2 font-mono text-xs focus:outline-none focus:border-[#C9A84C]"
              />
            </div>
            <div className="overflow-y-auto flex-1 p-4">
              <div className="grid grid-cols-3 gap-3">
                {imagePickerProducts
                  .filter((p) => !imagePickerSearch || p.title.toLowerCase().includes(imagePickerSearch.toLowerCase()))
                  .flatMap((p) => p.image_urls.filter(Boolean).slice(0, 1).map((url) => ({ url, title: p.title })))
                  .map(({ url, title }) => (
                    <button key={url} type="button"
                      onClick={() => { setForm((f) => ({ ...f, coverImage: url })); setImagePicker(false); }}
                      className="group relative aspect-square overflow-hidden rounded-md border border-[#E4E7EC] hover:border-[#C9A84C] transition-all focus:outline-none focus:ring-2 focus:ring-[#C9A84C]">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={url} alt={title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200" />
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-end">
                        <p className="w-full px-2 py-1 font-sans text-[10px] text-white font-semibold opacity-0 group-hover:opacity-100 bg-black/50 truncate transition-opacity">{title}</p>
                      </div>
                    </button>
                  ))}
              </div>
            </div>
            <div className="px-6 py-3 border-t border-[#E4E7EC] bg-[#F9FAFB]">
              <p className="font-mono text-[10px] text-[#9CA3AF]">Click any image to use it as the cover. These are Shopify CDN URLs from your imported catalog.</p>
            </div>
          </div>
        </div>
      )}

      {/* Product picker modal */}
      {pickerOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
          onClick={(e) => { if (e.target === e.currentTarget) setPickerOpen(false); }}>
          <div className="bg-[#FAF8F4] border border-[#D8D0C0] w-full max-w-2xl mx-4 max-h-[85vh] flex flex-col shadow-2xl">
            <div className="px-6 py-5 border-b border-[#D8D0C0]">
              <div className="flex items-center justify-between">
                <p className="font-display text-lg tracking-wide">Choose Products</p>
                <span className="font-mono text-xs text-[#4A3728]">{pickerSelected.size} selected</span>
              </div>
              <input
                value={pickerSearch} onChange={(e) => setPickerSearch(e.target.value)}
                placeholder="Search by title or type…"
                className="mt-3 w-full border border-[#D8D0C0] px-3 py-2 font-mono text-xs focus:outline-none focus:border-[#C9A84C]"
              />
            </div>

            <div className="overflow-y-auto flex-1">
              {filtered.map((p) => {
                const checked = pickerSelected.has(p.id);
                return (
                  <label key={p.id} className="flex items-center gap-3 px-6 py-2.5 cursor-pointer hover:bg-[#F7F5F0] transition-colors border-b border-[#F0EBE3]">
                    <input type="checkbox" checked={checked} className="accent-[#C9A84C]"
                      onChange={() => setPickerSelected((prev) => { const next = new Set(prev); checked ? next.delete(p.id) : next.add(p.id); return next; })} />
                    {p.image_urls[0] && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={p.image_urls[0]} alt={p.title} className="w-8 h-10 object-cover shrink-0" />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="font-sans text-xs text-[#2C2C2C] truncate">{p.title}</p>
                      <p className="font-mono text-[10px] text-[#B0A090]">{p.product_type} · ₹{p.price}</p>
                    </div>
                  </label>
                );
              })}
            </div>

            <div className="px-6 py-4 border-t border-[#D8D0C0] bg-white flex items-center gap-3">
              <button onClick={savePicker}
                className="flex-1 border border-[#C9A84C] bg-[#C9A84C] text-white font-mono text-xs tracking-widest py-2.5 hover:bg-[#b8963e] transition-colors">
                Save {pickerSelected.size} Products
              </button>
              <button onClick={() => setPickerOpen(false)}
                className="border border-[#D8D0C0] font-mono text-xs tracking-widest px-5 py-2.5 hover:bg-[#F7F5F0] transition-colors">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
