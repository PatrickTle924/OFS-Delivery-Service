"use client";

import Navbar from "@/components/Navbar";
import OrderCard, { OrderData } from "@/components/OrderCard";
import Link from "next/link";

//dummy data just to display stuff
const DUMMY_ORDERS: OrderData[] = [
  {
    order_id: 8492,
    ordered_at: "2026-03-15T14:30:00Z",
    total_cost: 64.2,
    status: "in progress",
    item_count: 5,
  },
  {
    order_id: 8421,
    ordered_at: "2026-03-10T10:15:00Z",
    total_cost: 124.5,
    status: "delivered",
    item_count: 12,
  },
  {
    order_id: 8305,
    ordered_at: "2026-02-28T18:45:00Z",
    total_cost: 32.1,
    status: "cancelled",
    item_count: 3,
  },
  {
    order_id: 8210,
    ordered_at: "2026-02-14T09:00:00Z",
    total_cost: 88.75,
    status: "delivered",
    item_count: 8,
  },
];

export default function OrderHistoryPage() {
  return (
    <main className="min-h-screen bg-cream font-dm relative pb-20">
      {/* Background gradients matches Home/Browse */}
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

        {/* Scrollable List Area */}
        <div className="flex flex-col gap-4 overflow-y-auto max-h-[70vh] pr-2 scrollbar-thin scrollbar-thumb-sage/20 scrollbar-track-transparent">
          {DUMMY_ORDERS.map((order) => (
            <OrderCard key={order.order_id} order={order} />
          ))}

          {DUMMY_ORDERS.length === 0 && (
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
      </div>
    </main>
  );
}
