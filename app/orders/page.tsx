"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Package, Clock } from "lucide-react";
import { Order } from "@/types";

export default function OrdersPage() {
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/orders")
      .then((r) => r.json())
      .then((data) => {
        if (data.error) { setError("Please log in to view your orders."); return; }
        setOrders(data.orders ?? []);
      })
      .catch(() => setError("Failed to load orders."))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="min-h-screen bg-cream">
      <header className="flex items-center gap-4 px-6 md:px-10 py-4 bg-cream border-b border-border/60">
        <button onClick={() => router.back()} className="text-taupe hover:text-dark transition-colors">
          <ArrowLeft size={15} strokeWidth={1.5} />
        </button>
        <div>
          <h1 className="font-display text-dark text-base leading-none">Your Orders</h1>
          {!loading && !error && (
            <p className="font-sans text-[10px] tracking-[0.15em] uppercase text-taupe mt-0.5">
              {orders.length} {orders.length === 1 ? "order" : "orders"}
            </p>
          )}
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-4 md:px-6 py-8 space-y-4">
        {loading && (
          <div className="flex items-center justify-center py-20">
            <span className="text-3xl font-display text-border/40 animate-pulse">✦</span>
          </div>
        )}

        {error && (
          <div className="text-center py-20">
            <p className="font-sans text-sm text-taupe">{error}</p>
            <button
              onClick={() => router.push("/chat")}
              className="mt-4 font-sans text-[10px] tracking-[0.15em] uppercase border border-dark text-dark px-6 py-2.5 hover:bg-dark hover:text-cream transition-colors"
            >
              Start Shopping
            </button>
          </div>
        )}

        {!loading && !error && orders.length === 0 && (
          <div className="text-center py-20">
            <Package size={32} strokeWidth={1} className="text-border mx-auto mb-4" />
            <p className="font-sans text-sm text-taupe">No orders yet</p>
            <button
              onClick={() => router.push("/chat")}
              className="mt-4 font-sans text-[10px] tracking-[0.15em] uppercase border border-dark text-dark px-6 py-2.5 hover:bg-dark hover:text-cream transition-colors"
            >
              Start Shopping
            </button>
          </div>
        )}

        {orders.map((order) => (
          <div key={order._id ?? order.orderId} className="bg-white border border-border p-5 space-y-4">
            <div className="flex items-start justify-between">
              <div>
                <p className="font-display text-dark text-sm">{order.orderId}</p>
                <div className="flex items-center gap-1.5 mt-1">
                  <Clock size={10} strokeWidth={1.5} className="text-taupe" />
                  <p className="font-sans text-[10px] text-taupe">
                    {new Date(order.createdAt).toLocaleDateString("en-IN", {
                      day: "numeric", month: "short", year: "numeric",
                    })}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <span className={`inline-block font-sans text-[9px] tracking-[0.15em] uppercase px-2 py-1 border ${
                  order.status === "confirmed"
                    ? "border-gold/40 text-gold bg-gold/5"
                    : order.status === "delivered"
                    ? "border-green-400/40 text-green-600 bg-green-50"
                    : "border-border text-taupe"
                }`}>
                  {order.status}
                </span>
                <p className="font-display italic text-gold mt-1">
                  ₹{order.total.toLocaleString("en-IN")}
                </p>
              </div>
            </div>

            <div className="space-y-2">
              {order.items.map((item, i) => (
                <div key={i} className="flex justify-between font-sans text-xs">
                  <span className="text-dark truncate mr-4">
                    {item.title} — {item.size} × {item.quantity}
                  </span>
                  <span className="text-taupe flex-shrink-0">
                    ₹{(item.price * item.quantity).toLocaleString("en-IN")}
                  </span>
                </div>
              ))}
            </div>

            <div className="border-t border-border pt-3">
              <p className="font-sans text-[10px] text-taupe">
                {order.shippingAddress.name} · {order.shippingAddress.city}, {order.shippingAddress.state} — {order.shippingAddress.pincode}
              </p>
              <p className="font-sans text-[9px] text-border mt-0.5">Cash on Delivery</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
