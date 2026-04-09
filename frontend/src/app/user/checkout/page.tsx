"use client";

import { useMemo, useState } from "react";

type CartItem = {
  id: number;
  name: string;
  price: number;
  quantity: number;
};

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
  const [cartItems] = useState<CartItem[]>([
    { id: 1, name: "Apples", price: 12.99, quantity: 1 },
    { id: 2, name: " Oranges", price: 3.99, quantity: 2 },
    { id: 3, name: "Chicken ", price: 14.5, quantity: 1 },
  ]);

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
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const subtotal = useMemo(() => {
    return cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
  }, [cartItems]);

  const deliveryFee = 4.99;
  const tax = subtotal * 0.08;
  const total = subtotal + deliveryFee + tax;

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

    if (
      !deliveryInfo.fullName ||
      !deliveryInfo.phone ||
      !deliveryInfo.addressLine1 ||
      !deliveryInfo.city ||
      !deliveryInfo.zipCode
    ) {
      setErrorMessage("Please fill in all required fields.");
      return;
    }

    try {
      setLoading(true);

      const payload = {
        customerName: deliveryInfo.fullName,
        items: cartItems,
        deliveryInfo,
        subtotal,
        deliveryFee,
        tax,
        total,
      };

      const response = await fetch("http://localhost:5000/orders", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error("Failed to place order");
      }

      const result = await response.json();
      setSuccessMessage(
        `Order placed successfully! Order ID: ${result.id ?? "Created"}`,
      );
    } catch (error) {
      console.error(error);
      setErrorMessage("Failed to place order. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-zinc-100 px-6 py-10 text-black">
      <div className="mx-auto max-w-6xl">
        <h1 className="mb-8 text-4xl font-bold">Checkout</h1>

        <div className="grid gap-8 md:grid-cols-2">
          <div className="rounded-2xl bg-white p-6 shadow">
            <h2 className="mb-4 text-2xl font-semibold">
              Delivery Information
            </h2>

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
          </div>

          <div className="rounded-2xl bg-white p-6 shadow">
            <h2 className="mb-4 text-2xl font-semibold">Order Summary</h2>

            <div className="space-y-4">
              {cartItems.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between border-b pb-3"
                >
                  <div>
                    <p className="font-medium">{item.name}</p>
                    <p className="text-sm text-zinc-500">
                      Qty: {item.quantity}
                    </p>
                  </div>
                  <p>${(item.price * item.quantity).toFixed(2)}</p>
                </div>
              ))}
            </div>

            <div className="mt-6 space-y-2 text-sm">
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
              disabled={loading}
              className="mt-6 w-full rounded-xl bg-black px-4 py-3 text-white transition hover:bg-zinc-800 disabled:opacity-50"
            >
              {loading ? "Processing..." : "Place Order"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
