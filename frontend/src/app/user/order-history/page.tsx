"use client";

import { useEffect, useState } from "react";
import Navbar from "@/components/Navbar";
import OrderCard, { OrderData } from "@/components/OrderCard";
import Link from "next/link";
import CustomerRoute from "@/components/CustomerRoute";
import { fetchOrderHistory, OrderHistoryItem } from "@/lib/api-service";

function normalizeStatus(status: string): OrderData["status"] {
  const value = status.trim().toLowerCase();

  if (value === "pending") return "pending";
  if (value === "assigned") return "in progress";
  if (value === "delivered") return "delivered";
  if (value === "cancelled") return "cancelled";
  if (value === "in progress" || value === "in_progress") return "in progress";

  return "pending";
}

function mapOrder(order: OrderHistoryItem): OrderData {
  return {
    order_id: order.order_id,
    ordered_at: order.ordered_at ?? "",
    total_cost: order.total_cost,
    status: normalizeStatus(order.status),
    item_count: order.item_count,
  };
}

export default function OrderHistoryPage() {
  const [orders, setOrders] = useState<OrderData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadOrders() {
      try {
        const data = await fetchOrderHistory();
        setOrders(data.map(mapOrder));
      } catch (error) {
        console.error("Error fetching orders:", error);
        setOrders([]);
      } finally {
        setLoading(false);
      }
    }

    loadOrders();
  }, []);

  return (
    <CustomerRoute>
      <main className="min-h-screen bg-cream font-dm relative pb-20">
        <div className="pointer-events-none fixed top-[-10%] left-[-10%] w-150 h-150 rounded-full bg-[radial-gradient(ellipse_at_center,rgba(168,213,181,0.18)_0%,transparent_65%)] -z-10" />
        <div className="pointer-events-none fixed bottom-[-10%] right-[-10%] w-150 h-150 rounded-full bg-[radial-gradient(ellipse_at_center,rgba(196,133,90,0.10)_0%,transparent_65%)] -z-10" />

        <Navbar alwaysFrosted />

        <div className="max-w-5xl mx-auto px-8 pt-32">
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

          {loading ? (
            <p className="text-forest/60">Loading orders...</p>
          ) : (
            <div className="flex flex-col gap-4 overflow-y-auto max-h-[70vh] pr-2 scrollbar-thin scrollbar-thumb-sage/20 scrollbar-track-transparent">
              {orders.map((order) => (
                <OrderCard key={order.order_id} order={order} />
              ))}

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
    </CustomerRoute>
  );
}
