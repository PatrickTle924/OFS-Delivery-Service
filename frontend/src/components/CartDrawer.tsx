"use client";

import Link from "next/link";
import { CartItem, Product, CATEGORY_STYLES, DELIVERY_THRESHOLD, DELIVERY_FEE } from "@/types/shop";

// ── Icons ──────────────────────────────────────────────────────────
const IconX = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="w-3.5 h-3.5">
    <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
  </svg>
);

const IconPlus = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="w-3.5 h-3.5">
    <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
  </svg>
);

const IconMinus = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="w-3.5 h-3.5">
    <line x1="5" y1="12" x2="19" y2="12"/>
  </svg>
);

const IconWeight = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
    <circle cx="12" cy="7" r="4"/>
    <path d="M5.5 21h13L17 11H7L5.5 21z"/>
  </svg>
);

const IconTruck = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
    <rect x="1" y="3" width="15" height="13" rx="1"/>
    <path d="M16 8h4l3 5v4h-7V8z"/>
    <circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/>
  </svg>
);

const IconCartEmpty = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-12 h-12 text-forest/20">
    <circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/>
    <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>
  </svg>
);

// ── Props ──────────────────────────────────────────────────────────
interface CartDrawerProps {
  open: boolean;
  onClose: () => void;
  cart: CartItem[];
  onAdd: (product: Product) => void;
  onRemove: (id: number) => void;
  onDelete: (id: number) => void;
}

export default function CartDrawer({ open, onClose, cart, onAdd, onRemove, onDelete }: CartDrawerProps) {
  const totalItems  = cart.reduce((s, i) => s + i.quantity, 0);
  const totalPrice  = cart.reduce((s, i) => s + i.product.price  * i.quantity, 0);
  const totalWeight = cart.reduce((s, i) => s + i.product.weight * i.quantity, 0);
  const deliveryFee = totalWeight >= DELIVERY_THRESHOLD ? DELIVERY_FEE : 0;
  const orderTotal  = totalPrice + deliveryFee;

  return (
    <>
      {/* Backdrop */}
      {open && (
        <div
          className="fixed inset-0 bg-forest/20 backdrop-blur-sm z-50"
          onClick={onClose}
        />
      )}

      {/* Drawer */}
      <div
        className={`fixed top-0 right-0 h-full w-full max-w-md bg-cream z-50 shadow-2xl shadow-forest/20 flex flex-col transition-transform duration-300 ease-in-out ${
          open ? "translate-x-0" : "translate-x-full"
        }`}
      >
        {/* Decorative gradients */}
        <div className="absolute top-0 right-0 w-72 h-72 rounded-full bg-[radial-gradient(ellipse_at_top_right,rgba(168,213,181,0.20)_0%,transparent_65%)] pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-60 h-60 rounded-full bg-[radial-gradient(ellipse_at_bottom_left,rgba(196,133,90,0.10)_0%,transparent_65%)] pointer-events-none" />

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-warm/60 relative z-10">
          <div>
            <h2 className="font-playfair text-2xl text-forest">Your Cart</h2>
            <p className="text-xs text-forest/50 font-light mt-0.5">
              {totalItems === 0
                ? "No items yet"
                : `${totalItems} item${totalItems !== 1 ? "s" : ""}`}
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-xl bg-warm/60 flex items-center justify-center text-forest hover:bg-warm transition-colors duration-200"
          >
            <IconX />
          </button>
        </div>

        {/* Items */}
        <div className="flex-1 overflow-y-auto px-6 py-4 relative z-10">
          {cart.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center text-forest/40 gap-4">
              <IconCartEmpty />
              <p className="font-playfair text-xl">Your cart is empty</p>
              <p className="text-sm font-light">Add some fresh items to get started.</p>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {cart.map((item) => (
                <div
                  key={item.product.id}
                  className="flex items-center gap-3 bg-white/70 rounded-2xl p-3 border border-white/80 shadow-sm"
                >
                  {/* Thumbnail */}
                  <div className="w-14 h-14 rounded-xl overflow-hidden shrink-0 bg-warm/40">
                    <img
                      src={item.product.imageUrl}
                      alt={item.product.name}
                      className="w-full h-full object-cover"
                    />
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-forest truncate">{item.product.name}</p>
                    <p className="text-xs text-forest/40 font-light mt-0.5">
                      ${item.product.price.toFixed(2)} × {item.quantity}
                      {" · "}{(item.product.weight * item.quantity).toFixed(2)} lbs
                    </p>
                    <p className="text-xs font-medium text-forest/70 mt-0.5">
                      ${(item.product.price * item.quantity).toFixed(2)}
                    </p>
                  </div>

                  {/* Quantity controls */}
                  <div className="flex items-center gap-2 shrink-0">
                    <div className="flex items-center gap-1 bg-warm/60 rounded-lg p-0.5">
                      <button
                        onClick={() => onRemove(item.product.id)}
                        className="w-6 h-6 rounded-md bg-white flex items-center justify-center text-forest hover:bg-sage hover:text-cream transition-colors duration-200"
                      >
                        <IconMinus />
                      </button>
                      <span className="w-5 text-center text-xs font-medium text-forest">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() => onAdd(item.product)}
                        disabled={item.quantity >= item.product.stock}
                        className={`w-6 h-6 rounded-md flex items-center justify-center transition-colors duration-200 ${
                          item.quantity >= item.product.stock
                            ? "bg-warm/40 text-forest/25 cursor-not-allowed"
                            : "bg-white text-forest hover:bg-sage hover:text-cream"
                        }`}
                      >
                        <IconPlus />
                      </button>
                    </div>
                    <button
                      onClick={() => onDelete(item.product.id)}
                      className="w-6 h-6 flex items-center justify-center text-forest/25 hover:text-[#b94040] transition-colors duration-200"
                    >
                      <IconX />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer — totals + checkout */}
        {cart.length > 0 && (
          <div className="px-6 py-5 border-t border-warm/60 relative z-10 bg-cream/80 backdrop-blur-sm">

            <div className="flex items-center justify-between text-sm mb-2">
              <span className="flex items-center gap-1.5 text-forest/60 font-light">
                <IconWeight />Total weight
              </span>
              <span className="font-medium text-forest">{totalWeight.toFixed(2)} lbs</span>
            </div>

            <div className="flex items-center justify-between text-sm mb-3">
              <span className="flex items-center gap-1.5 text-forest/60 font-light">
                <IconTruck />Delivery fee
              </span>
              {deliveryFee === 0
                ? <span className="text-sage font-medium">Free</span>
                : <span className="font-medium text-forest">${deliveryFee.toFixed(2)}</span>
              }
            </div>

            {/* Free delivery progress bar */}
            {deliveryFee === 0 && totalWeight > 0 && (
              <div className="mb-3">
                <div className="flex justify-between text-[10px] text-forest/40 mb-1">
                  <span>Free delivery progress</span>
                  <span>{totalWeight.toFixed(1)} / {DELIVERY_THRESHOLD} lbs</span>
                </div>
                <div className="h-1.5 w-full bg-warm rounded-full overflow-hidden">
                  <div
                    className="h-full bg-linear-to-r from-sage to-mint rounded-full transition-all duration-500"
                    style={{ width: `${Math.min((totalWeight / DELIVERY_THRESHOLD) * 100, 100)}%` }}
                  />
                </div>
              </div>
            )}

            <div className="h-px bg-warm/80 my-3" />

            <div className="flex items-center justify-between mb-5">
              <span className="font-medium text-forest">Order Total</span>
              <span className="font-playfair text-2xl text-forest">${orderTotal.toFixed(2)}</span>
            </div>

            <Link
              href="/user/checkout"
              className="block w-full text-center bg-forest text-cream font-medium py-3.5 rounded-xl hover:bg-sage transition-colors duration-200 shadow-lg shadow-forest/20 text-base"
            >
              Proceed to Checkout →
            </Link>
          </div>
        )}
      </div>
    </>
  );
}