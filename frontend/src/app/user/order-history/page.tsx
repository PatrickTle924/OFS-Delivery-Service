"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Navbar from "@/components/Navbar";
import OrderCard, { OrderData } from "@/components/OrderCard";
import Link from "next/link";
import { getStoredUser, isCustomerUser } from "@/lib/auth";

export default function OrderHistoryPage() {
  const router = useRouter();
  const [orders, setOrders] = useState<OrderData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const user = getStoredUser();
    if (!isCustomerUser(user)) {
      router.replace("/login-register");
      return;
    }

    async function fetchOrders() {
      try {
        const res = await fetch("http://localhost:5000/orders/history");

        if (!res.ok) {
          throw new Error("Failed to fetch orders");
        }

        const data = await res.json();
        setOrders(data);
      } catch (error) {
        console.error("Error fetching orders:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchOrders();
  }, [router]);

  return (
    <main className="min-h-screen bg-cream font-dm relative pb-20">
      {/* Background gradients */}
      <div className="pointer-events-none fixed top-[-10%] left-[-10%] w-150 h-150 rounded-full bg-[radial-gradient(ellipse_at_center,rgba(168,213,181,0.18)_0%,transparent_65%)] -z-10" />
      <div className="pointer-events-none fixed bottom-[-10%] right-[-10%] w-150 h-150 rounded-full bg-[radial-gradient(ellipse_at_center,rgba(196,133,90,0.10)_0%,transparent_65%)] -z-10" />

      <Navbar alwaysFrosted />

      <div className="max-w-5xl mx-auto px-8 pt-32">
        {/* Header */}
        <div className="mb-12">
          <p className="text-sage text-xs font-medium tracking-[0.14em] uppercase mb-2">
            Account
          </p>
          <h1 className="font-playfair text-4xl md:text-5xl text-forest">
            Order <em className="text-clay">History</em>
          </h1>
          <p className="text-sm text-[#777] font-light mt-4">
            Manage your past deliveries and reorder your organic favorites.
          </p>
        </div>

        {/* Loading State */}
        {loading ? (
          <p className="text-forest/60">Loading orders...</p>
        ) : (
          <div className="flex flex-col gap-4 overflow-y-auto max-h-[70vh] pr-2 scrollbar-thin scrollbar-thumb-sage/20 scrollbar-track-transparent">
            {/* Orders List */}
            {orders.map((order) => (
              <OrderCard key={order.order_id} order={order} />
            ))}

            {/* Empty State */}
            {orders.length === 0 && (
              <div className="text-center py-20 bg-white/40 rounded-3xl border border-dashed border-forest/10">
                <p className="font-playfair text-xl text-forest/40">
                  No orders yet.
                </p>
                <Link
                  href="/user/browse"
                  className="text-sage text-sm underline mt-2 inline-block"
                >
                  Start shopping
                </Link>
              </div>
            )}
          </div>
        )}
      </div>
    </main>
  );
}
