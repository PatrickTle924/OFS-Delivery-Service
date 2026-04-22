"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Navbar from "@/components/Navbar";
import CustomerRoute from "@/components/CustomerRoute";
import { useCart } from "@/context/CartContext";
import { fetchUserProfile, placeOrder } from "@/lib/api-service";
import { DELIVERY_FEE, DELIVERY_THRESHOLD } from "@/types/shop";

type DeliveryInfo = {
  fullName: string;
  phone: string;
  addressLine1: string;
  addressLine2: string;
  city: string;
  zipCode: string;
  instructions: string;
};

export default function CheckoutPage() {
  const router = useRouter();

  const {
    cart,
    totalItems,
    totalPrice,
    addToCart,
    removeOne,
    removeFromCart,
    clearCart,
  } = useCart();

  const [deliveryInfo, setDeliveryInfo] = useState<DeliveryInfo>({
    fullName: "",
    phone: "",
    addressLine1: "",
    addressLine2: "",
    city: "",
    zipCode: "",
    instructions: "",
  });

  const [loading, setLoading] = useState(false);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const profile = await fetchUserProfile();

        const fullName = `${profile.firstName} ${profile.lastName}`.trim();
        const address = profile.address || "";
        const city = "San Jose";

        setDeliveryInfo((prev) => ({
          ...prev,
          fullName,
          phone: profile.phone || "",
          addressLine1: address,
          city: city,
        }));
      } catch (error) {
        console.error("Failed to load profile for checkout:", error);
      } finally {
        setLoadingProfile(false);
      }
    };

    loadProfile();
  }, []);

  const subtotal = totalPrice;
  const totalWeight = useMemo(
    () =>
      cart.reduce(
        (acc, item) => acc + (item.product.weight || 0) * item.quantity,
        0,
      ),
    [cart],
  );
  const deliveryFee = useMemo(
    () => (totalWeight < DELIVERY_THRESHOLD ? 0 : DELIVERY_FEE),
    [totalWeight],
  );
  const tax = useMemo(() => subtotal * 0.08, [subtotal]);
  const total = useMemo(
    () => subtotal + deliveryFee + tax,
    [subtotal, deliveryFee, tax],
  );

  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) {
    const { name, value } = e.target;
    setDeliveryInfo((prev) => ({
      ...prev,
      [name]: value,
    }));
  }

  async function handlePlaceOrder() {
    setErrorMessage("");
    setSuccessMessage("");

    if (cart.length === 0) {
      setErrorMessage("Your cart is empty.");
      return;
    }

    if (
      !deliveryInfo.fullName.trim() ||
      !deliveryInfo.phone.trim() ||
      !deliveryInfo.addressLine1.trim() ||
      !deliveryInfo.city.trim() ||
      !deliveryInfo.zipCode.trim()
    ) {
      setErrorMessage("Please fill in all required fields.");
      return;
    }

    try {
      setLoading(true);

      const address = `${deliveryInfo.addressLine1}, ${deliveryInfo.city}, CA ${deliveryInfo.zipCode}`;
      const res = await fetch(
        `http://localhost:5000/geocode?address=${encodeURIComponent(address)}`,
      );

      const data = await res.json();
      const lat = data.lat;
      const lng = data.lng;

      if (!res.ok) {
        throw new Error(data.error || "Geocoding failed");
      }

      if (typeof data.lat !== "number" || typeof data.lng !== "number") {
        throw new Error("Invalid geocoding response");
      }

      console.log(data);
      const payload = {
        deliveryInfo,
        items: cart.map((item) => ({
          product: {
            id: item.product.id,
            name: item.product.name,
            price: item.product.price,
            weight: item.product.weight,
          },
          quantity: item.quantity,
        })),
        subtotal,
        deliveryFee,
        tax,
        total,
        total_weight: totalWeight,
        delivery_lat: lat,
        delivery_lng: lng,
      };

      const result = await placeOrder(payload);

      setSuccessMessage(
        `Order placed successfully! Order ID: ${result.order_id}`,
      );

      clearCart();
      localStorage.removeItem("ofs-cart");
      router.push("/user/order-history");
    } catch (error) {
      console.error(error);
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Failed to place order. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <CustomerRoute>
      <div className="min-h-screen bg-[#f7f3eb] px-6 py-10 text-[#1f4d36]">
        <Navbar alwaysFrosted cartItemCount={totalItems} />

        <div className="mx-auto max-w-6xl pt-24">
          <div className="mb-8">
            <p className="mb-2 text-sm uppercase tracking-[0.2em] text-[#a06d42]">
              OFS Market
            </p>
            <h1 className="text-5xl font-semibold leading-tight text-[#1f4d36]">
              Checkout for fresh groceries,
              <span className="ml-2 italic text-[#c4855a]">
                delivered today.
              </span>
            </h1>
            <p className="mt-3 max-w-2xl text-sm text-[#666]">
              Review your items, confirm your delivery information, and place
              your order.
            </p>
          </div>

          <div className="grid gap-8 md:grid-cols-2">
            <div className="rounded-3xl border border-[#e7ddcc] bg-white/80 p-6 shadow-sm">
              <h2 className="mb-2 text-3xl font-semibold text-[#1f4d36]">
                Delivery Information
              </h2>
              <p className="mb-5 text-sm text-[#666]">
                We prefilled what we already know from your account.
              </p>

              {loadingProfile ? (
                <p className="text-sm text-zinc-500">Loading profile...</p>
              ) : (
                <div className="grid gap-4">
                  <input
                    name="fullName"
                    placeholder="Full Name"
                    value={deliveryInfo.fullName}
                    onChange={handleChange}
                    className="rounded-xl border-[1.5px] border-[#ddd] bg-white/80 px-4 py-3 text-sm text-[#1a1a14] placeholder:text-[#bbb] outline-none transition-all duration-200 focus:border-[#4a7c59] focus:ring-2 focus:ring-[#4a7c59]/10"
                  />
                  <input
                    name="phone"
                    placeholder="Phone Number"
                    value={deliveryInfo.phone}
                    onChange={handleChange}
                    className="rounded-xl border-[1.5px] border-[#ddd] bg-white/80 px-4 py-3 text-sm text-[#1a1a14] placeholder:text-[#bbb] outline-none transition-all duration-200 focus:border-[#4a7c59] focus:ring-2 focus:ring-[#4a7c59]/10"
                  />
                  <input
                    name="addressLine1"
                    placeholder="Street Address"
                    value={deliveryInfo.addressLine1}
                    onChange={handleChange}
                    className="rounded-xl border-[1.5px] border-[#ddd] bg-white/80 px-4 py-3 text-sm text-[#1a1a14] placeholder:text-[#bbb] outline-none transition-all duration-200 focus:border-[#4a7c59] focus:ring-2 focus:ring-[#4a7c59]/10"
                  />
                  <input
                    name="addressLine2"
                    placeholder="Apartment / Unit"
                    value={deliveryInfo.addressLine2}
                    onChange={handleChange}
                    className="rounded-xl border-[1.5px] border-[#ddd] bg-white/80 px-4 py-3 text-sm text-[#1a1a14] placeholder:text-[#bbb] outline-none transition-all duration-200 focus:border-[#4a7c59] focus:ring-2 focus:ring-[#4a7c59]/10"
                  />
                  <div className="grid gap-4 sm:grid-cols-2">
                    <input
                      name="city"
                      placeholder="City"
                      value={deliveryInfo.city}
                      onChange={handleChange}
                      className="rounded-xl border-[1.5px] border-[#ddd] bg-white/80 px-4 py-3 text-sm text-[#1a1a14] placeholder:text-[#bbb] outline-none transition-all duration-200 focus:border-[#4a7c59] focus:ring-2 focus:ring-[#4a7c59]/10"
                    />
                    <input
                      name="zipCode"
                      placeholder="ZIP Code"
                      value={deliveryInfo.zipCode}
                      onChange={handleChange}
                      className="rounded-xl border-[1.5px] border-[#ddd] bg-white/80 px-4 py-3 text-sm text-[#1a1a14] placeholder:text-[#bbb] outline-none transition-all duration-200 focus:border-[#4a7c59] focus:ring-2 focus:ring-[#4a7c59]/10"
                    />
                  </div>
                  <textarea
                    name="instructions"
                    placeholder="Delivery Instructions"
                    value={deliveryInfo.instructions}
                    onChange={handleChange}
                    className="rounded-xl border-[1.5px] border-[#ddd] bg-white/80 px-4 py-3 text-sm text-[#1a1a14] placeholder:text-[#bbb] outline-none transition-all duration-200 focus:border-[#4a7c59] focus:ring-2 focus:ring-[#4a7c59]/10"
                    rows={4}
                  />
                </div>
              )}
            </div>

            <div className="rounded-3xl border border-[#e7ddcc] bg-white/80 p-6 shadow-sm">
              <h2 className="mb-4 text-3xl font-semibold text-[#1f4d36]">
                Order Summary
              </h2>

              <div className="space-y-4">
                {cart.map((item) => (
                  <div
                    key={item.product.id}
                    className="rounded-2xl border border-[#efe5d7] bg-[#fcfaf5] p-4"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="font-medium text-[#1f4d36]">
                          {item.product.name}
                        </p>
                        <div className="mt-2 flex items-center gap-2 text-sm text-zinc-500">
                          <button
                            onClick={() => removeOne(item.product.id)}
                            className="rounded-lg border border-[#d8d2c6] px-2 py-1 hover:bg-[#f1e7d8]"
                          >
                            -
                          </button>
                          <span>Qty: {item.quantity}</span>
                          <button
                            onClick={() => addToCart(item.product)}
                            className="rounded-lg border border-[#d8d2c6] px-2 py-1 hover:bg-[#f1e7d8]"
                          >
                            +
                          </button>
                          <button
                            onClick={() => removeFromCart(item.product.id)}
                            className="ml-2 text-red-600 hover:text-red-700"
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                      <p className="font-medium text-[#1f4d36]">
                        ${(item.product.price * item.quantity).toFixed(2)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-6 space-y-2 rounded-2xl bg-[#f8f2e8] p-5 text-sm">
                <div className="flex justify-between">
                  <span>Items</span>
                  <span>{totalItems}</span>
                </div>
                <div className="flex justify-between">
                  <span>Total Weight</span>
                  <span>{totalWeight.toFixed(2)} lbs</span>
                </div>
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span>${subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Delivery Fee</span>
                  <span>${deliveryFee.toFixed(2)}</span>
                </div>
                <p className="text-xs text-zinc-500">
                  Orders under {DELIVERY_THRESHOLD} lbs ship free. Orders at{" "}
                  {DELIVERY_THRESHOLD} lbs or more have a $
                  {DELIVERY_FEE.toFixed(2)} delivery fee.
                </p>
                <div className="flex justify-between">
                  <span>Tax</span>
                  <span>${tax.toFixed(2)}</span>
                </div>
                <div className="flex justify-between border-t border-[#ddd] pt-3 text-lg font-bold text-[#1f4d36]">
                  <span>Total</span>
                  <span>${total.toFixed(2)}</span>
                </div>
              </div>

              {errorMessage && (
                <p className="mt-4 rounded-xl border border-[#f5c0c0] bg-[#fdeaea] px-4 py-3 text-sm text-red-600">
                  {errorMessage}
                </p>
              )}

              {successMessage && (
                <p className="mt-4 rounded-xl border border-[#b7dec1] bg-[#edf8f0] px-4 py-3 text-sm text-green-700">
                  {successMessage}
                </p>
              )}

              <button
                onClick={handlePlaceOrder}
                disabled={loading || loadingProfile || cart.length === 0}
                className="mt-6 w-full rounded-xl bg-[#1f4d36] px-4 py-3 text-white transition hover:bg-[#2f644a] disabled:opacity-50"
              >
                {loading ? "Processing..." : "Place Order"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </CustomerRoute>
  );
}