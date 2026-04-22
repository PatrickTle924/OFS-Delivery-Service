"use client";

import { useState, useEffect } from "react";

interface Product {
  id: number;
  name: string;
  category: string;
  price: number;
  weight: number;
  stock: number;
}

interface CartEntry {
  product: Product;
  quantity: number;
}

interface CustomerInfo {
  firstName: string;
  lastName: string;
  email: string;
  address: string;
}

interface CreateOrderModalProps {
  open: boolean;
  onClose: () => void;
  onOrderCreated: () => void;
}

const DELIVERY_FEE = 4.99;

export default function CreateOrderModal({
  open,
  onClose,
  onOrderCreated,
}: CreateOrderModalProps) {
  const [step, setStep] = useState<"customer" | "products" | "address" | "review">("customer");

  // Customer lookup
  const [emailInput, setEmailInput] = useState("");
  const [customer, setCustomer] = useState<CustomerInfo | null>(null);
  const [customerError, setCustomerError] = useState("");
  const [lookingUp, setLookingUp] = useState(false);

  // Products
  const [products, setProducts] = useState<Product[]>([]);
  const [cart, setCart] = useState<Map<number, CartEntry>>(new Map());
  const [productSearch, setProductSearch] = useState("");

  // Delivery address
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [zip, setZip] = useState("");

  // Submission
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");

  useEffect(() => {
    if (open) {
      fetch("http://localhost:5000/products")
        .then((r) => r.json())
        .then(setProducts)
        .catch(() => setProducts([]));
    }
  }, [open]);

  const reset = () => {
    setStep("customer");
    setEmailInput("");
    setCustomer(null);
    setCustomerError("");
    setCart(new Map());
    setProductSearch("");
    setAddress("");
    setCity("");
    setState("");
    setZip("");
    setSubmitError("");
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const lookupCustomer = async () => {
    const email = emailInput.trim().toLowerCase();
    if (!email) return;
    setLookingUp(true);
    setCustomerError("");
    setCustomer(null);
    try {
      const res = await fetch(
        `http://localhost:5000/profile?email=${encodeURIComponent(email)}`
      );
      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error || "Customer not found");
      }
      const data = await res.json();
      if (data.role !== "customer") {
        throw new Error("This account is not a customer");
      }
      setCustomer({
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        address: data.address || "",
      });
      // Pre-fill address from customer profile
      const parts = (data.address || "").split(",").map((p: string) => p.trim());
      setAddress(parts[0] || "");
      setCity(parts[1] || "");
      setState(parts[2]?.split(" ")[0] || "");
      setZip(parts[2]?.split(" ")[1] || "");
    } catch (err: any) {
      setCustomerError(err.message || "Customer not found");
    } finally {
      setLookingUp(false);
    }
  };

  const setQty = (product: Product, qty: number) => {
    setCart((prev) => {
      const next = new Map(prev);
      if (qty <= 0) {
        next.delete(product.id);
      } else {
        next.set(product.id, { product, quantity: qty });
      }
      return next;
    });
  };

  const cartEntries = Array.from(cart.values());
  const subtotal = cartEntries.reduce(
    (sum, e) => sum + e.product.price * e.quantity,
    0
  );
  const total = subtotal + DELIVERY_FEE;
  const totalWeight = cartEntries.reduce(
    (sum, e) => sum + e.product.weight * e.quantity,
    0
  );

  const filteredProducts = products.filter((p) =>
    p.name.toLowerCase().includes(productSearch.toLowerCase()) ||
    p.category.toLowerCase().includes(productSearch.toLowerCase())
  );

  const handleSubmit = async () => {
    if (!customer) return;
    if (cart.size === 0) { setSubmitError("Add at least one product."); return; }
    if (!address || !city || !zip) { setSubmitError("Fill in the delivery address."); return; }

    setSubmitting(true);
    setSubmitError("");
    try {
      const res = await fetch("http://localhost:5000/orders/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customer_email: customer.email,
          items: cartEntries.map((e) => ({
            product_id: e.product.id,
            quantity: e.quantity,
          })),
          delivery_address: address,
          delivery_city: city,
          delivery_state: state,
          delivery_zip: zip,
        }),
      });

      let data: any = null;
      try {
        data = await res.json();
      } catch {
        throw new Error("Server returned an unexpected response. Make sure the backend is running.");
      }

      if (!res.ok) throw new Error(data?.error || "Failed to create order");
      onOrderCreated();
      reset();
      onClose();
    } catch (err: any) {
      setSubmitError(err.message || "Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const canProceedFromCustomer = !!customer;
  const canProceedFromProducts = cart.size > 0;
  const canProceedFromAddress = !!address && !!city && !!zip;

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 bg-forest/30 backdrop-blur-sm z-50 transition-opacity duration-300 ${
          open ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        }`}
        onClick={handleClose}
      />

      {/* Drawer */}
      <div
        className={`fixed right-0 top-0 h-full w-full max-w-xl bg-cream z-50 shadow-2xl transition-transform duration-300 ease-in-out flex flex-col ${
          open ? "translate-x-0" : "translate-x-full"
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-forest/10 shrink-0">
          <div>
            <h2 className="font-playfair text-2xl text-forest">Create Order</h2>
            <p className="text-xs text-forest/40 mt-0.5">
              {step === "customer" && "Step 1 of 4 — Find Customer"}
              {step === "products" && "Step 2 of 4 — Select Products"}
              {step === "address" && "Step 3 of 4 — Delivery Address"}
              {step === "review" && "Step 4 of 4 — Review & Submit"}
            </p>
          </div>
          <button
            onClick={handleClose}
            className="p-2 rounded-xl hover:bg-forest/5 transition-colors text-forest/40 hover:text-forest"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Step progress bar */}
        <div className="flex h-1 shrink-0">
          {["customer", "products", "address", "review"].map((s, i) => (
            <div
              key={s}
              className={`flex-1 transition-colors duration-300 ${
                ["customer", "products", "address", "review"].indexOf(step) >= i
                  ? "bg-sage"
                  : "bg-forest/10"
              }`}
            />
          ))}
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-6">

          {/* ── Step 1: Customer ── */}
          {step === "customer" && (
            <div className="flex flex-col gap-5">
              <p className="text-sm text-[#777]">Enter the customer's email to look them up.</p>

              <div className="flex gap-2">
                <input
                  type="email"
                  value={emailInput}
                  onChange={(e) => setEmailInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && lookupCustomer()}
                  placeholder="customer@email.com"
                  className="flex-1 rounded-xl border-[1.5px] border-sage/40 focus:border-sage focus:ring-2 focus:ring-sage/10 outline-none bg-white px-4 py-3 text-sm text-forest"
                />
                <button
                  onClick={lookupCustomer}
                  disabled={lookingUp || !emailInput.trim()}
                  className="px-4 py-3 bg-forest text-cream text-sm font-medium rounded-xl hover:bg-sage transition-colors disabled:opacity-50"
                >
                  {lookingUp ? "..." : "Find"}
                </button>
              </div>

              {customerError && (
                <p className="text-sm text-[#b94040] bg-clay/10 border border-clay/20 rounded-xl px-4 py-3">
                  {customerError}
                </p>
              )}

              {customer && (
                <div className="bg-sage/10 border border-sage/20 rounded-xl px-4 py-4 flex flex-col gap-1">
                  <p className="font-medium text-forest">
                    {customer.firstName} {customer.lastName}
                  </p>
                  <p className="text-sm text-forest/60">{customer.email}</p>
                  {customer.address && (
                    <p className="text-xs text-forest/40 mt-1">{customer.address}</p>
                  )}
                </div>
              )}
            </div>
          )}

          {/* ── Step 2: Products ── */}
          {step === "products" && (
            <div className="flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <p className="text-sm text-[#777]">Select products and quantities.</p>
                {cart.size > 0 && (
                  <span className="text-xs font-medium text-sage bg-sage/10 border border-sage/20 px-2.5 py-1 rounded-full">
                    {cartEntries.reduce((s, e) => s + e.quantity, 0)} items · ${subtotal.toFixed(2)}
                  </span>
                )}
              </div>

              <input
                type="text"
                value={productSearch}
                onChange={(e) => setProductSearch(e.target.value)}
                placeholder="Search products..."
                className="w-full rounded-xl border-[1.5px] border-sage/40 focus:border-sage focus:ring-2 focus:ring-sage/10 outline-none bg-white px-4 py-2.5 text-sm text-forest"
              />

              <div className="flex flex-col gap-2">
                {filteredProducts.map((product) => {
                  const qty = cart.get(product.id)?.quantity ?? 0;
                  return (
                    <div
                      key={product.id}
                      className={`flex items-center justify-between p-3 rounded-xl border transition-colors ${
                        qty > 0
                          ? "bg-sage/5 border-sage/30"
                          : "bg-white border-forest/10"
                      }`}
                    >
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-forest truncate">{product.name}</p>
                        <p className="text-xs text-[#999]">
                          ${product.price.toFixed(2)} · {product.weight} lbs · {product.stock} in stock
                        </p>
                      </div>
                      <div className="flex items-center gap-2 ml-3 shrink-0">
                        <button
                          onClick={() => setQty(product, qty - 1)}
                          disabled={qty === 0}
                          className="w-7 h-7 rounded-lg border border-forest/15 text-forest text-sm font-bold hover:bg-forest/5 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                        >
                          −
                        </button>
                        <span className="w-6 text-center text-sm font-medium text-forest tabular-nums">
                          {qty}
                        </span>
                        <button
                          onClick={() => setQty(product, qty + 1)}
                          disabled={qty >= product.stock}
                          className="w-7 h-7 rounded-lg border border-forest/15 text-forest text-sm font-bold hover:bg-forest/5 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                        >
                          +
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ── Step 3: Address ── */}
          {step === "address" && (
            <div className="flex flex-col gap-5">
              <p className="text-sm text-[#777]">Confirm or update the delivery address.</p>

              <div className="flex flex-col gap-3">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-medium text-forest/60 uppercase tracking-widest">Street Address</label>
                  <input
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="123 Main St"
                    className="rounded-xl border-[1.5px] border-sage/40 focus:border-sage focus:ring-2 focus:ring-sage/10 outline-none bg-white px-4 py-3 text-sm text-forest"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-medium text-forest/60 uppercase tracking-widest">City</label>
                    <input
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      placeholder="San Jose"
                      className="rounded-xl border-[1.5px] border-sage/40 focus:border-sage focus:ring-2 focus:ring-sage/10 outline-none bg-white px-4 py-3 text-sm text-forest"
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-medium text-forest/60 uppercase tracking-widest">State</label>
                    <input
                      value={state}
                      onChange={(e) => setState(e.target.value)}
                      placeholder="CA"
                      className="rounded-xl border-[1.5px] border-sage/40 focus:border-sage focus:ring-2 focus:ring-sage/10 outline-none bg-white px-4 py-3 text-sm text-forest"
                    />
                  </div>
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-medium text-forest/60 uppercase tracking-widest">ZIP Code</label>
                  <input
                    value={zip}
                    onChange={(e) => setZip(e.target.value)}
                    placeholder="95124"
                    className="rounded-xl border-[1.5px] border-sage/40 focus:border-sage focus:ring-2 focus:ring-sage/10 outline-none bg-white px-4 py-3 text-sm text-forest"
                  />
                </div>
              </div>
            </div>
          )}

          {/* ── Step 4: Review ── */}
          {step === "review" && (
            <div className="flex flex-col gap-5">
              <div className="bg-sage/10 border border-sage/20 rounded-xl px-4 py-4 flex flex-col gap-1">
                <p className="text-xs font-medium text-forest/40 uppercase tracking-widest mb-1">Customer</p>
                <p className="font-medium text-forest">{customer?.firstName} {customer?.lastName}</p>
                <p className="text-sm text-forest/60">{customer?.email}</p>
              </div>

              <div className="bg-white border border-forest/10 rounded-xl px-4 py-4">
                <p className="text-xs font-medium text-forest/40 uppercase tracking-widest mb-3">Items</p>
                <div className="flex flex-col gap-2">
                  {cartEntries.map((e) => (
                    <div key={e.product.id} className="flex justify-between text-sm">
                      <span className="text-forest">
                        {e.product.name} <span className="text-forest/40">× {e.quantity}</span>
                      </span>
                      <span className="text-forest font-medium tabular-nums">
                        ${(e.product.price * e.quantity).toFixed(2)}
                      </span>
                    </div>
                  ))}
                </div>
                <div className="border-t border-forest/10 mt-3 pt-3 flex flex-col gap-1.5">
                  <div className="flex justify-between text-sm text-forest/60">
                    <span>Subtotal</span>
                    <span>${subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm text-forest/60">
                    <span>Delivery fee</span>
                    <span>${DELIVERY_FEE.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm text-forest/60">
                    <span>Total weight</span>
                    <span>{totalWeight.toFixed(2)} lbs</span>
                  </div>
                  <div className="flex justify-between font-medium text-forest mt-1">
                    <span>Total</span>
                    <span>${total.toFixed(2)}</span>
                  </div>
                </div>
              </div>

              <div className="bg-white border border-forest/10 rounded-xl px-4 py-4">
                <p className="text-xs font-medium text-forest/40 uppercase tracking-widest mb-2">Delivery Address</p>
                <p className="text-sm text-forest">{address}</p>
                <p className="text-sm text-forest">{city}, {state} {zip}</p>
              </div>

              {submitError && (
                <p className="text-sm text-[#b94040] bg-clay/10 border border-clay/20 rounded-xl px-4 py-3">
                  {submitError}
                </p>
              )}
            </div>
          )}
        </div>

        {/* Footer navigation */}
        <div className="px-6 py-4 border-t border-forest/10 shrink-0 flex gap-3">
          {step !== "customer" && (
            <button
              onClick={() => {
                if (step === "products") setStep("customer");
                else if (step === "address") setStep("products");
                else if (step === "review") setStep("address");
              }}
              className="flex-1 py-3 rounded-xl border border-forest/15 text-forest text-sm font-medium hover:bg-forest/5 transition-colors"
            >
              Back
            </button>
          )}

          {step === "customer" && (
            <button
              disabled={!canProceedFromCustomer}
              onClick={() => setStep("products")}
              className="flex-1 py-3 bg-forest text-cream text-sm font-medium rounded-xl hover:bg-sage transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Continue
            </button>
          )}
          {step === "products" && (
            <button
              disabled={!canProceedFromProducts}
              onClick={() => setStep("address")}
              className="flex-1 py-3 bg-forest text-cream text-sm font-medium rounded-xl hover:bg-sage transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Continue
            </button>
          )}
          {step === "address" && (
            <button
              disabled={!canProceedFromAddress}
              onClick={() => setStep("review")}
              className="flex-1 py-3 bg-forest text-cream text-sm font-medium rounded-xl hover:bg-sage transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Review Order
            </button>
          )}
          {step === "review" && (
            <button
              disabled={submitting}
              onClick={handleSubmit}
              className="flex-1 py-3 bg-forest text-cream text-sm font-medium rounded-xl hover:bg-sage shadow-lg shadow-forest/10 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? "Placing Order..." : "Place Order"}
            </button>
          )}
        </div>
      </div>
    </>
  );
}
