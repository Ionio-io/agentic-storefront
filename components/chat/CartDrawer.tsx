"use client";
import Image from "next/image";
import { useState } from "react";
import { X, ShoppingBag, Trash2, Plus, Minus, CheckCircle, ArrowLeft } from "lucide-react";
import { CartItem, ShippingAddress } from "@/types";

const INDIAN_STATES = [
  "Andhra Pradesh","Arunachal Pradesh","Assam","Bihar","Chhattisgarh",
  "Goa","Gujarat","Haryana","Himachal Pradesh","Jharkhand","Karnataka",
  "Kerala","Madhya Pradesh","Maharashtra","Manipur","Meghalaya","Mizoram",
  "Nagaland","Odisha","Punjab","Rajasthan","Sikkim","Tamil Nadu","Telangana",
  "Tripura","Uttar Pradesh","Uttarakhand","West Bengal",
  "Delhi","Jammu & Kashmir","Ladakh","Puducherry","Chandigarh",
];

interface Props {
  items: CartItem[];
  open: boolean;
  onClose: () => void;
  onUpdateQty: (productId: string, size: string, delta: number) => void;
  agentName?: string;
  onRemove: (productId: string, size: string) => void;
  onCheckoutComplete?: () => void;
}

type View = "cart" | "checkout" | "confirmed";

const EMPTY_ADDR: ShippingAddress = {
  name: "", phone: "", line1: "", city: "", state: "", pincode: "",
};

export function CartDrawer({ items, open, onClose, onUpdateQty, onRemove, onCheckoutComplete, agentName = "your stylist" }: Props) {
  const [view, setView] = useState<View>("cart");
  const [addr, setAddr] = useState<ShippingAddress>(EMPTY_ADDR);
  const [placing, setPlacing] = useState(false);
  const [orderId, setOrderId] = useState("");
  const [errors, setErrors] = useState<Partial<ShippingAddress>>({});
  const [orderError, setOrderError] = useState<string | null>(null);

  const total = items.reduce((sum, i) => sum + i.product.price * i.quantity, 0);
  const count = items.reduce((sum, i) => sum + i.quantity, 0);

  function validate(): boolean {
    const e: Partial<ShippingAddress> = {};
    if (!addr.name.trim()) e.name = "Required";
    if (!/^\d{10}$/.test(addr.phone.trim())) e.phone = "Enter 10-digit number";
    if (!addr.line1.trim()) e.line1 = "Required";
    if (!addr.city.trim()) e.city = "Required";
    if (!addr.state) e.state = "Required";
    if (!/^\d{6}$/.test(addr.pincode.trim())) e.pincode = "Enter 6-digit pincode";
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function placeOrder() {
    if (!validate()) return;
    setPlacing(true);
    setOrderError(null);
    try {
      const orderItems = items.map((i) => ({
        productId: i.product.id,
        title: i.product.title,
        size: i.size,
        quantity: i.quantity,
        price: i.product.price,
        imageUrl: i.product.image_urls[0] ?? "",
      }));
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items: orderItems, shippingAddress: addr, total }),
      });
      const data = await res.json();
      if (data.ok) {
        setOrderId(data.orderId);
        setView("confirmed");
        onCheckoutComplete?.();
      } else {
        setOrderError(data.error ?? "Order placement failed. Please try again.");
      }
    } catch {
      setOrderError("Network error. Please check your connection and try again.");
    } finally {
      setPlacing(false);
    }
  }

  function handleClose() {
    setView("cart");
    setAddr(EMPTY_ADDR);
    setErrors({});
    setOrderId("");
    onClose();
  }

  const inputCls = (err?: string) =>
    `w-full font-sans text-xs text-dark bg-white border ${err ? "border-red-400" : "border-border"} px-3 py-2.5 outline-none focus:border-dark transition-colors placeholder:text-border`;

  return (
    <>
      {open && (
        <div className="fixed inset-0 bg-dark/20 z-40 backdrop-blur-[2px]" onClick={handleClose} />
      )}

      <div
        className={`fixed top-0 right-0 h-full w-[22rem] bg-cream z-50 flex flex-col border-l border-border transition-transform duration-300 ease-in-out ${
          open ? "translate-x-0" : "translate-x-full"
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-border bg-white">
          <div className="flex items-center gap-3">
            {view === "checkout" && (
              <button onClick={() => setView("cart")} className="text-taupe hover:text-dark mr-1">
                <ArrowLeft size={14} strokeWidth={1.5} />
              </button>
            )}
            <ShoppingBag size={16} strokeWidth={1.5} className="text-gold" />
            <div>
              <h2 className="font-display text-dark text-base leading-none">
                {view === "cart" ? "Your Bag" : view === "checkout" ? "Checkout" : "Order Placed"}
              </h2>
              {view === "cart" && count > 0 && (
                <p className="font-sans text-[9px] tracking-[0.2em] uppercase text-taupe mt-0.5">
                  {count} {count === 1 ? "item" : "items"}
                </p>
              )}
            </div>
          </div>
          <button onClick={handleClose} aria-label="Close cart" className="text-taupe hover:text-dark transition-colors p-1">
            <X size={15} strokeWidth={1.5} />
          </button>
        </div>

        {/* ── CART VIEW ── */}
        {view === "cart" && (
          <>
            <div className="flex-1 overflow-y-auto px-5 py-5 space-y-3 scrollbar-thin scrollbar-thumb-border scrollbar-track-transparent">
              {items.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full gap-4">
                  <span className="text-4xl font-display text-border/60">✦</span>
                  <div className="text-center">
                    <p className="font-sans text-xs text-taupe">Your bag is empty</p>
                    <p className="font-sans text-[10px] text-border mt-1 tracking-wide">Ask {agentName} to find something beautiful</p>
                  </div>
                </div>
              ) : (
                items.map((item) => (
                  <div key={`${item.product.id}-${item.size}`} className="flex gap-3 bg-white border border-border p-3">
                    <div className="relative w-14 flex-shrink-0 overflow-hidden" style={{ height: "4.5rem" }}>
                      <Image src={item.product.image_urls[0]} alt={item.product.title} fill className="object-cover object-top" sizes="56px" unoptimized />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-sans text-[9px] tracking-[0.15em] uppercase text-taupe leading-none mb-1">{item.product.vendor}</p>
                      <p className="font-sans text-xs text-dark leading-snug line-clamp-2 mb-1.5">{item.product.title}</p>
                      <div className="flex items-center justify-between">
                        <span className="font-display italic text-gold text-sm">₹{(item.product.price * item.quantity).toLocaleString("en-IN")}</span>
                        <span className="font-sans text-[9px] tracking-wide text-taupe">Size: {item.size}</span>
                      </div>
                      <div className="flex items-center gap-2 mt-2">
                        <button onClick={() => onUpdateQty(item.product.id, item.size, -1)} className="w-5 h-5 border border-border text-taupe hover:border-dark hover:text-dark transition-colors flex items-center justify-center">
                          <Minus size={9} strokeWidth={1.5} />
                        </button>
                        <span className="font-sans text-xs text-dark w-4 text-center">{item.quantity}</span>
                        <button onClick={() => onUpdateQty(item.product.id, item.size, 1)} className="w-5 h-5 border border-border text-taupe hover:border-dark hover:text-dark transition-colors flex items-center justify-center">
                          <Plus size={9} strokeWidth={1.5} />
                        </button>
                        <button onClick={() => onRemove(item.product.id, item.size)} className="ml-auto text-border hover:text-red-400 transition-colors">
                          <Trash2 size={12} strokeWidth={1.5} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
            {items.length > 0 && (
              <div className="border-t border-border bg-white px-6 py-5 space-y-4">
                <div className="flex justify-between items-baseline">
                  <span className="font-sans text-[10px] tracking-[0.15em] uppercase text-taupe">Subtotal</span>
                  <span className="font-display italic text-gold text-xl">₹{total.toLocaleString("en-IN")}</span>
                </div>
                <p className="font-sans text-[9px] tracking-wide text-border">Free shipping on orders above ₹999</p>
                <button
                  onClick={() => setView("checkout")}
                  className="w-full font-sans text-[10px] tracking-[0.15em] uppercase border border-dark bg-dark text-cream py-3.5 hover:bg-charcoal transition-colors duration-200"
                >
                  Proceed to Checkout
                </button>
                <button onClick={handleClose} className="w-full font-sans text-[10px] tracking-[0.12em] uppercase text-taupe hover:text-dark transition-colors py-1">
                  Continue Shopping
                </button>
              </div>
            )}
          </>
        )}

        {/* ── CHECKOUT VIEW ── */}
        {view === "checkout" && (
          <div className="flex-1 overflow-y-auto px-5 py-5 space-y-4">
            <div>
              <p className="font-sans text-[9px] tracking-[0.2em] uppercase text-taupe mb-3">Shipping Details</p>
              <div className="space-y-2.5">
                <div>
                  <input value={addr.name} onChange={(e) => setAddr((a) => ({ ...a, name: e.target.value }))} placeholder="Full Name" className={inputCls(errors.name)} />
                  {errors.name && <p className="text-red-400 text-[10px] mt-0.5">{errors.name}</p>}
                </div>
                <div>
                  <input value={addr.phone} onChange={(e) => setAddr((a) => ({ ...a, phone: e.target.value }))} placeholder="Phone Number" className={inputCls(errors.phone)} maxLength={10} />
                  {errors.phone && <p className="text-red-400 text-[10px] mt-0.5">{errors.phone}</p>}
                </div>
                <div>
                  <input value={addr.line1} onChange={(e) => setAddr((a) => ({ ...a, line1: e.target.value }))} placeholder="Address Line" className={inputCls(errors.line1)} />
                  {errors.line1 && <p className="text-red-400 text-[10px] mt-0.5">{errors.line1}</p>}
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <input value={addr.city} onChange={(e) => setAddr((a) => ({ ...a, city: e.target.value }))} placeholder="City" className={inputCls(errors.city)} />
                    {errors.city && <p className="text-red-400 text-[10px] mt-0.5">{errors.city}</p>}
                  </div>
                  <div>
                    <input value={addr.pincode} onChange={(e) => setAddr((a) => ({ ...a, pincode: e.target.value }))} placeholder="Pincode" className={inputCls(errors.pincode)} maxLength={6} />
                    {errors.pincode && <p className="text-red-400 text-[10px] mt-0.5">{errors.pincode}</p>}
                  </div>
                </div>
                <div>
                  <select value={addr.state} onChange={(e) => setAddr((a) => ({ ...a, state: e.target.value }))} className={inputCls(errors.state)}>
                    <option value="">Select State</option>
                    {INDIAN_STATES.map((s) => <option key={s}>{s}</option>)}
                  </select>
                  {errors.state && <p className="text-red-400 text-[10px] mt-0.5">{errors.state}</p>}
                </div>
              </div>
            </div>

            <div className="bg-white border border-border p-4 space-y-2">
              <p className="font-sans text-[9px] tracking-[0.2em] uppercase text-taupe">Payment Method</p>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full border-2 border-gold bg-gold/20 flex-shrink-0" />
                <span className="font-sans text-xs text-dark">Cash on Delivery</span>
              </div>
              <p className="font-sans text-[9px] text-taupe">Pay when your order arrives at your door</p>
            </div>

            <div className="bg-white border border-border p-4 space-y-2">
              <p className="font-sans text-[9px] tracking-[0.2em] uppercase text-taupe">Order Summary</p>
              {items.map((i) => (
                <div key={`${i.product.id}-${i.size}`} className="flex justify-between font-sans text-xs text-dark">
                  <span className="truncate mr-2">{i.product.title} × {i.quantity} ({i.size})</span>
                  <span className="flex-shrink-0">₹{(i.product.price * i.quantity).toLocaleString("en-IN")}</span>
                </div>
              ))}
              <div className="border-t border-border pt-2 flex justify-between">
                <span className="font-sans text-[10px] uppercase tracking-wide text-taupe">Total</span>
                <span className="font-display italic text-gold">₹{total.toLocaleString("en-IN")}</span>
              </div>
            </div>

            {orderError && (
              <p className="font-sans text-[11px] text-red-600 bg-red-50 border border-red-200 px-3 py-2 leading-relaxed">
                {orderError}
              </p>
            )}
            <button
              onClick={placeOrder}
              disabled={placing}
              className="w-full font-sans text-[10px] tracking-[0.15em] uppercase border border-dark bg-dark text-cream py-3.5 hover:bg-charcoal transition-colors duration-200 disabled:opacity-50"
            >
              {placing ? "Placing Order…" : "Place Order (COD)"}
            </button>
          </div>
        )}

        {/* ── CONFIRMED VIEW ── */}
        {view === "confirmed" && (
          <div className="flex-1 flex flex-col items-center justify-center px-8 text-center gap-5">
            <CheckCircle size={40} strokeWidth={1} className="text-gold" />
            <div>
              <h3 className="font-display text-dark text-lg">Order Confirmed!</h3>
              <p className="font-sans text-xs text-taupe mt-2">
                Your order <span className="text-dark font-medium">{orderId}</span> has been placed successfully.
              </p>
              <p className="font-sans text-[10px] text-border mt-2 leading-relaxed">
                Pay ₹{total.toLocaleString("en-IN")} when your order arrives.
              </p>
            </div>
            <button
              onClick={handleClose}
              className="font-sans text-[10px] tracking-[0.15em] uppercase border border-dark bg-dark text-cream px-8 py-3 hover:bg-charcoal transition-colors"
            >
              Continue Shopping
            </button>
          </div>
        )}
      </div>
    </>
  );
}
