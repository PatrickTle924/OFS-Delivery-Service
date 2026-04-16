"use client";

import { useEffect, useMemo, useState } from "react";

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

type StoredUser = {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
};

type UserProfile = {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address: string;
  role: string;
};

export default function CheckoutPage() {
  const [cartItems] = useState<CartItem[]>([
    { id: 1, name: "Apples", price: 12.99, quantity: 1 },
    { id: 2, name: "Oranges", price: 3.99, quantity: 2 },
    { id: 3, name: "Chicken", price: 14.5, quantity: 1 },
  ]);

  const [deliveryInfo, setDeliveryInfo] = useState<DeliveryInfo>({
    fullName: "",
    phone: "",
    addressLine1: "",
    addressLine2: "",
    city: "San Jose",
    zipCode: "",
    instructions: "",
  });

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [profileLoading, setProfileLoading] = useState(true);

  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const subtotal = useMemo(() => {
    return cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
  }, [cartItems]);

  const deliveryFee = 4.99;
  const tax = subtotal * 0.08;
  const total = subtotal + deliveryFee + tax;

  useEffect(() => {
    async function loadProfile() {
      try {
        setProfileLoading(true);

        const storedUserRaw = localStorage.getItem("ofsUser");
        if (!storedUserRaw) {
          setProfileLoading(false);
          return;
        }

        const storedUser: StoredUser = JSON.parse(storedUserRaw);
        if (!storedUser?.email) {
          setProfileLoading(false);
          return;
        }

        const response = await fetch(
          `http://localhost:5000/profile?email=${encodeURIComponent(
            storedUser.email,
          )}`,
        );

        if (!response.ok) {
          throw new Error("Failed to fetch profile");
        }

        const profileData: UserProfile = await response.json();
        setProfile(profileData);

        setDeliveryInfo((prev) => ({
          ...prev,
          fullName:
            `${profileData.firstName ?? ""} ${
              profileData.lastName ?? ""
            }`.trim(),
          phone: profileData.phone ?? "",
          addressLine1: profileData.address ?? "",
          city: prev.city || "San Jose",
        }));
      } catch (error) {
        console.error("Failed to prefill profile:", error);
      } finally {
        setProfileLoading(false);
      }
    }

    loadProfile();
  }, []);

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
    <div className="min-h-screen bg-[#f7f3eb] px-6 py-10 text-[#1f4d36]">
      <div className="mx-auto max-w-6xl">
        <div className="mb-8">
          <p className="mb-2 text-sm uppercase tracking-[0.2em] text-[#a06d42]">
            OFS Market
          </p>
          <h1 className="font-playfair text-5xl leading-tight">
            Checkout for fresh groceries,
            <span className="ml-2 italic text-[#c4855a]">delivered today.</span>
          </h1>
          <p className="mt-3 max-w-2xl text-sm text-[#666]">
            Review your items, confirm your delivery information, and place your
            order.
          </p>
        </div>

        <div className="mb-8 rounded-3xl border border-[#e7ddcc] bg-white/70 p-6 shadow-sm">
          <p className="mb-1 text-xs uppercase tracking-[0.2em] text-[#a06d42]">
            Signed in as
          </p>

          {profileLoading ? (
            <p className="text-sm text-[#666]">Loading profile...</p>
          ) : profile ? (
            <>
              <h2 className="font-playfair text-3xl text-[#1f4d36]">
                {profile.firstName} {profile.lastName}
              </h2>
              <p className="text-sm text-[#666]">{profile.email}</p>
            </>
          ) : (
            <p className="text-sm text-[#666]">
              Could not load profile details.
            </p>
          )}
        </div>

        <div className="grid gap-8 md:grid-cols-2">
          <div className="rounded-3xl border border-[#e7ddcc] bg-white/80 p-6 shadow-sm">
            <h2 className="mb-2 font-playfair text-3xl text-[#1f4d36]">
              Delivery Information
            </h2>
            <p className="mb-5 text-sm text-[#666]">
              We prefilled what we already know from your account.
            </p>

            <div className="grid gap-4">
              <input
                name="fullName"
                placeholder="Full Name"
                value={deliveryInfo.fullName}
                onChange={handleChange}
                className="rounded-xl border-[1.5px] border-[#ddd] bg-white/80 p-3 text-sm text-[#1a1a14] placeholder:text-[#bbb] outline-none focus:border-[#4a7c59] focus:ring-2 focus:ring-[#4a7c59]/10"
              />
              <input
                name="phone"
                placeholder="Phone Number"
                value={deliveryInfo.phone}
                onChange={handleChange}
                className="rounded-xl border-[1.5px] border-[#ddd] bg-white/80 p-3 text-sm text-[#1a1a14] placeholder:text-[#bbb] outline-none focus:border-[#4a7c59] focus:ring-2 focus:ring-[#4a7c59]/10"
              />
              <input
                name="addressLine1"
                placeholder="Street Address"
                value={deliveryInfo.addressLine1}
                onChange={handleChange}
                className="rounded-xl border-[1.5px] border-[#ddd] bg-white/80 p-3 text-sm text-[#1a1a14] placeholder:text-[#bbb] outline-none focus:border-[#4a7c59] focus:ring-2 focus:ring-[#4a7c59]/10"
              />
              <input
                name="addressLine2"
                placeholder="Apartment / Unit"
                value={deliveryInfo.addressLine2}
                onChange={handleChange}
                className="rounded-xl border-[1.5px] border-[#ddd] bg-white/80 p-3 text-sm text-[#1a1a14] placeholder:text-[#bbb] outline-none focus:border-[#4a7c59] focus:ring-2 focus:ring-[#4a7c59]/10"
              />
              <input
                name="city"
                placeholder="City"
                value={deliveryInfo.city}
                onChange={handleChange}
                className="rounded-xl border-[1.5px] border-[#ddd] bg-white/80 p-3 text-sm text-[#1a1a14] placeholder:text-[#bbb] outline-none focus:border-[#4a7c59] focus:ring-2 focus:ring-[#4a7c59]/10"
              />
              <input
                name="zipCode"
                placeholder="ZIP Code"
                value={deliveryInfo.zipCode}
                onChange={handleChange}
                className="rounded-xl border-[1.5px] border-[#ddd] bg-white/80 p-3 text-sm text-[#1a1a14] placeholder:text-[#bbb] outline-none focus:border-[#4a7c59] focus:ring-2 focus:ring-[#4a7c59]/10"
              />
              <textarea
                name="instructions"
                placeholder="Delivery Instructions"
                value={deliveryInfo.instructions}
                onChange={handleChange}
                className="rounded-xl border-[1.5px] border-[#ddd] bg-white/80 p-3 text-sm text-[#1a1a14] placeholder:text-[#bbb] outline-none focus:border-[#4a7c59] focus:ring-2 focus:ring-[#4a7c59]/10"
                rows={4}
              />
            </div>
          </div>

          <div className="rounded-3xl border border-[#e7ddcc] bg-white/80 p-6 shadow-sm">
            <h2 className="mb-4 font-playfair text-3xl text-[#1f4d36]">
              Order Summary
            </h2>

            <div className="space-y-4">
              {cartItems.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between rounded-2xl border border-[#efe5d7] bg-[#fcfaf5] p-4"
                >
                  <div>
                    <p className="font-medium">{item.name}</p>
                    <p className="text-sm text-zinc-500">Qty: {item.quantity}</p>
                  </div>
                  <p>${(item.price * item.quantity).toFixed(2)}</p>
                </div>
              ))}
            </div>

            <div className="mt-6 space-y-2 rounded-2xl bg-[#f8f2e8] p-5 text-sm">
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
              disabled={loading}
              className="mt-6 w-full rounded-xl bg-[#1f4d36] px-4 py-3 text-white transition hover:bg-zinc-800 disabled:opacity-50"
            >
              {loading ? "Processing..." : "Place Order →"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}