"use client";

import { useEffect, useState } from "react";
import { SyncStore } from "@/types";

export default function SyncPage() {
  const [stores, setStores] = useState<SyncStore[]>([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState({ name: "", storeUrl: "", schedule: "manual" as SyncStore["schedule"] });

  const fetchStores = () => {
    fetch("/api/sync-store")
      .then((r) => r.json())
      .then((d) => setStores(d.stores ?? []))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchStores(); }, []);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name || !form.storeUrl) return;
    setStatus("Adding…");
    const res = await fetch("/api/sync-store", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const d = await res.json();
    if (res.ok) {
      setStatus("✓ Store added");
      setAdding(false);
      setForm({ name: "", storeUrl: "", schedule: "manual" });
      fetchStores();
    } else {
      setStatus(`Error: ${d.error}`);
    }
  }

  async function handleSync(storeId: string, name: string) {
    setStatus(`Syncing ${name}…`);
    const res = await fetch("/api/sync-store/run", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ storeId }),
    });
    const d = await res.json();
    if (res.ok) {
      setStatus(`✓ ${name}: ${d.imported} products synced`);
      fetchStores();
    } else {
      setStatus(`Error: ${d.error}`);
    }
  }

  async function handleToggle(store: SyncStore) {
    await fetch("/api/sync-store", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: store._id, enabled: !store.enabled }),
    });
    fetchStores();
  }

  async function handleSchedule(store: SyncStore, schedule: SyncStore["schedule"]) {
    await fetch("/api/sync-store", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: store._id, schedule }),
    });
    fetchStores();
  }

  async function handleDelete(store: SyncStore) {
    if (!confirm(`Remove "${store.name}"?`)) return;
    await fetch("/api/sync-store", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: store._id }),
    });
    fetchStores();
  }

  return (
    <div className="px-8 py-10">
      <div className="flex items-start justify-between mb-1">
        <h1 className="font-display text-2xl tracking-wide">Sync Stores</h1>
        <button onClick={() => setAdding(true)}
          className="border border-[#C9A84C] bg-[#C9A84C] text-white font-mono text-xs tracking-widest px-5 py-2.5 hover:bg-[#b8963e] transition-colors">
          + Add Store
        </button>
      </div>
      <p className="font-mono text-xs text-[#8A7560] mb-8">Connect Shopify stores and configure auto-sync schedules.</p>

      {status && (
        <div className="mb-6 font-mono text-xs text-[#4A3728] bg-[#C9A84C]/10 border border-[#C9A84C]/30 px-4 py-3">
          {status}
        </div>
      )}

      {loading && <p className="font-mono text-xs text-[#8A7560]">Loading…</p>}

      {!loading && stores.length === 0 && !adding && (
        <div className="bg-white border border-[#D8D0C0] px-6 py-10 text-center">
          <p className="font-mono text-xs text-[#8A7560]">No stores connected yet.</p>
          <button onClick={() => setAdding(true)}
            className="mt-4 font-mono text-xs text-[#C9A84C] hover:underline">+ Connect your first store</button>
        </div>
      )}

      {stores.map((store) => (
        <div key={store._id} className="bg-white border border-[#D8D0C0] px-6 py-5 mb-4">
          <div className="flex items-start gap-4 flex-wrap">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className="font-sans text-sm font-semibold text-[#2C2C2C]">{store.name}</span>
                <span className={`font-mono text-[10px] px-1.5 py-0.5 ${store.enabled ? "bg-green-100 text-green-700" : "bg-[#F0EBE3] text-[#8A7560]"}`}>
                  {store.enabled ? "Active" : "Paused"}
                </span>
              </div>
              <p className="font-mono text-xs text-[#8A7560] truncate">{store.storeUrl}</p>
              <div className="flex items-center gap-4 mt-2">
                <span className="font-mono text-[10px] text-[#B0A090]">
                  Last sync: {store.lastSync ? new Date(store.lastSync).toLocaleString() : "Never"}
                </span>
                {store.lastCount !== undefined && (
                  <span className="font-mono text-[10px] text-[#B0A090]">{store.lastCount.toLocaleString()} products</span>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2 flex-wrap shrink-0">
              <select value={store.schedule} onChange={(e) => handleSchedule(store, e.target.value as SyncStore["schedule"])}
                className="border border-[#D8D0C0] bg-white px-2 py-1.5 font-mono text-xs focus:outline-none focus:border-[#C9A84C]">
                <option value="manual">Manual</option>
                <option value="6h">Every 6h</option>
                <option value="12h">Every 12h</option>
                <option value="24h">Daily</option>
              </select>

              <button onClick={() => handleSync(store._id!, store.name)}
                className="font-mono text-xs px-3 py-1.5 border border-[#C9A84C] text-[#C9A84C] hover:bg-[#C9A84C] hover:text-white transition-colors">
                Sync Now
              </button>

              <button onClick={() => handleToggle(store)}
                className="font-mono text-xs px-3 py-1.5 border border-[#D8D0C0] text-[#6B5D4E] hover:bg-[#F7F5F0] transition-colors">
                {store.enabled ? "Pause" : "Resume"}
              </button>

              <button onClick={() => handleDelete(store)}
                className="font-mono text-xs px-3 py-1.5 border border-[#D8D0C0] text-[#B0A090] hover:text-red-600 hover:border-red-200 transition-colors">
                Remove
              </button>
            </div>
          </div>
        </div>
      ))}

      {/* Add store form */}
      {adding && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
          onClick={(e) => { if (e.target === e.currentTarget) setAdding(false); }}>
          <form onSubmit={handleAdd} className="bg-[#FAF8F4] border border-[#D8D0C0] w-full max-w-md mx-4 p-6 shadow-2xl">
            <p className="font-display text-lg tracking-wide mb-5">Connect a Store</p>

            <label className="block mb-4">
              <span className="font-mono text-xs text-[#6B5D4E] uppercase tracking-widest block mb-1.5">Store Name</span>
              <input required value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                placeholder="My Shopify Store" className="w-full border border-[#D8D0C0] px-3 py-2 font-mono text-xs focus:outline-none focus:border-[#C9A84C]" />
            </label>

            <label className="block mb-4">
              <span className="font-mono text-xs text-[#6B5D4E] uppercase tracking-widest block mb-1.5">Store URL</span>
              <input required type="url" value={form.storeUrl} onChange={(e) => setForm((f) => ({ ...f, storeUrl: e.target.value }))}
                placeholder="https://mystore.myshopify.com" className="w-full border border-[#D8D0C0] px-3 py-2 font-mono text-xs focus:outline-none focus:border-[#C9A84C]" />
            </label>

            <label className="block mb-6">
              <span className="font-mono text-xs text-[#6B5D4E] uppercase tracking-widest block mb-1.5">Auto-sync Schedule</span>
              <select value={form.schedule} onChange={(e) => setForm((f) => ({ ...f, schedule: e.target.value as SyncStore["schedule"] }))}
                className="w-full border border-[#D8D0C0] bg-white px-3 py-2 font-mono text-xs focus:outline-none focus:border-[#C9A84C]">
                <option value="manual">Manual only</option>
                <option value="6h">Every 6 hours</option>
                <option value="12h">Every 12 hours</option>
                <option value="24h">Daily</option>
              </select>
            </label>

            <div className="flex gap-3">
              <button type="submit" className="flex-1 border border-[#C9A84C] bg-[#C9A84C] text-white font-mono text-xs tracking-widest py-2.5 hover:bg-[#b8963e] transition-colors">
                Add Store
              </button>
              <button type="button" onClick={() => setAdding(false)}
                className="border border-[#D8D0C0] font-mono text-xs tracking-widest px-5 py-2.5 hover:bg-[#F7F5F0] transition-colors">
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="mt-8 bg-[#F7F5F0] border border-[#D8D0C0] px-5 py-4">
        <p className="font-mono text-xs text-[#6B5D4E] uppercase tracking-widest mb-2">Auto-sync via Cron</p>
        <p className="font-sans text-xs text-[#8A7560] leading-relaxed">
          Scheduled syncs run via <code className="bg-white px-1">/api/sync-store/cron</code>. Configure in <code className="bg-white px-1">vercel.json</code> — set <code className="bg-white px-1">CRON_SECRET</code> in env vars to secure the endpoint.
        </p>
      </div>
    </div>
  );
}
