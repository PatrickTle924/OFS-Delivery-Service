"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Navbar from "@/components/Navbar";
import CustomerRoute from "@/components/CustomerRoute";
import { useCart } from "@/context/CartContext";
import { fetchUserProfile, placeOrder } from "@/lib/api-service";

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

        setDeliveryInfo((prev) => ({
          ...prev,
          fullName,
          phone: profile.phone || "",
          addressLine1: address,
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
  const deliveryFee = useMemo(() => 4.99, []);
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

      const total_weight = cart.reduce(
        (acc, item) => acc + (item.product.weight || 0) * item.quantity,
        0,
      );

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
        total_weight,
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
      <div className="min-h-screen bg-zinc-100 px-6 py-10 text-black">
        <Navbar alwaysFrosted cartItemCount={totalItems} />
        <div className="mx-auto max-w-6xl pt-24">
          <h1 className="mb-8 text-4xl font-bold">Checkout</h1>

          <div className="grid gap-8 md:grid-cols-2">
            <div className="rounded-2xl bg-white p-6 shadow">
              <h2 className="mb-4 text-2xl font-semibold">
                Delivery Information
              </h2>

              {loadingProfile ? (
                <p className="text-sm text-zinc-500">Loading profile...</p>
              ) : (
                <div className="grid gap-4">
                  <input
                    name="fullName"
                    placeholder="Full Name"
                    value={deliveryInfo.fullName}
                    onChange={handleChange}
                    className="rounded-lg border p-3"
                  />
                  <input
                    name="phone"
                    placeholder="Phone Number"
                    value={deliveryInfo.phone}
                    onChange={handleChange}
                    className="rounded-lg border p-3"
                  />
                  <input
                    name="addressLine1"
                    placeholder="Street Address"
                    value={deliveryInfo.addressLine1}
                    onChange={handleChange}
                    className="rounded-lg border p-3"
                  />
                  <input
                    name="addressLine2"
                    placeholder="Apartment / Unit"
                    value={deliveryInfo.addressLine2}
                    onChange={handleChange}
                    className="rounded-lg border p-3"
                  />
                  <input
                    name="city"
                    placeholder="City"
                    value={deliveryInfo.city}
                    onChange={handleChange}
                    className="rounded-lg border p-3"
                  />
                  <input
                    name="zipCode"
                    placeholder="ZIP Code"
                    value={deliveryInfo.zipCode}
                    onChange={handleChange}
                    className="rounded-lg border p-3"
                  />
                  <textarea
                    name="instructions"
                    placeholder="Delivery Instructions"
                    value={deliveryInfo.instructions}
                    onChange={handleChange}
                    className="rounded-lg border p-3"
                    rows={4}
                  />
                </div>
              )}
            </div>

            <div className="rounded-2xl bg-white p-6 shadow">
              <h2 className="mb-4 text-2xl font-semibold">Order Summary</h2>

              <div className="space-y-4">
                {cart.map((item) => (
                  <div
                    key={item.product.id}
                    className="flex items-center justify-between border-b pb-3"
                  >
                    <div>
                      <p className="font-medium">{item.product.name}</p>
                      <div className="mt-1 flex items-center gap-2 text-sm text-zinc-500">
                        <button
                          onClick={() => removeOne(item.product.id)}
                          className="rounded border px-2"
                        >
                          -
                        </button>
                        <span>Qty: {item.quantity}</span>
                        <button
                          onClick={() => addToCart(item.product)}
                          className="rounded border px-2"
                        >
                          +
                        </button>
                        <button
                          onClick={() => removeFromCart(item.product.id)}
                          className="ml-2 text-red-600"
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                    <p>${(item.product.price * item.quantity).toFixed(2)}</p>
                  </div>
                ))}
              </div>

              <div className="mt-6 space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Items</span>
                  <span>{totalItems}</span>
                </div>
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span>${subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Delivery Fee</span>
                  <span>${deliveryFee.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Tax</span>
                  <span>${tax.toFixed(2)}</span>
                </div>
                <div className="flex justify-between border-t pt-3 text-lg font-bold">
                  <span>Total</span>
                  <span>${total.toFixed(2)}</span>
                </div>
              </div>

              {errorMessage && (
                <p className="mt-4 text-sm text-red-600">{errorMessage}</p>
              )}

              {successMessage && (
                <p className="mt-4 text-sm text-green-600">{successMessage}</p>
              )}

              <button
                onClick={handlePlaceOrder}
                disabled={loading || loadingProfile || cart.length === 0}
                className="mt-6 w-full rounded-xl bg-black px-4 py-3 text-white transition hover:bg-zinc-800 disabled:opacity-50"
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
