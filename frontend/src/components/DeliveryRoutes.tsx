"use client";

import { useState } from "react";
import { Order } from "@/types/routing";
import { OrderCard } from "./RouteOrderCard";
import { Card } from "./Card";
import { FaRoute } from "react-icons/fa6";

interface DeliveryRoutesProps {
  orders: Order[];
  onGenerateRoutes: (selectedIds: string[]) => void;
}

export function DeliveryRoutes({
  orders,
  onGenerateRoutes,
}: DeliveryRoutesProps) {
  const [search, setSearch] = useState("");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const filtered = orders.filter(
    (o) =>
      o.id.toLowerCase().includes(search.toLowerCase()) ||
      o.address.toLowerCase().includes(search.toLowerCase()),
  );

  const toggleOrder = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const totalWeight = orders
    .filter((o) => selectedIds.has(o.id))
    .reduce((sum, o) => sum + o.weight, 0);

  return (
    <Card className="flex flex-col h-full">
      <div
        className="px-5 pt-6 pb-5 relative overflow-hidden"
        style={{
          background:
            "linear-gradient(135deg, var(--color-forest) 0%, var(--color-sage) 100%)",
        }}
      >
        <div
          className="absolute top-[-20%] right-[-10%] w-48 h-48 rounded-full pointer-events-none"
          style={{
            background:
              "radial-gradient(ellipse at center, rgba(168,213,181,0.18) 0%, transparent 65%)",
          }}
        />

        <div className="relative z-10">
          <div className="flex items-center gap-2.5 mb-4">
            <FaRoute size={20} color="var(--color-cream)" />
            <h2
              style={{
                fontFamily: "'Playfair Display', serif",
                fontWeight: 600,
                color: "var(--color-cream)",
                fontSize: "1.2rem",
                letterSpacing: "-0.01em",
              }}
            >
              Delivery Routes
            </h2>
          </div>

          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none opacity-50" />
            <input
              type="search"
              placeholder="Search orders..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2.5 text-sm rounded-xl border-0 focus:outline-none transition"
              style={{
                background: "rgba(245,240,232,0.15)",
                color: "var(--color-cream)",
                border: "1px solid rgba(168,213,181,0.25)",
                backdropFilter: "blur(4px)",
              }}
            />
          </div>
        </div>
      </div>

      <div
        className="flex-1 overflow-y-auto "
        style={{ background: "var(--color-cream)" }}
      >
        {filtered.length === 0 ? (
          <p
            className="text-sm text-center py-10 font-light"
            style={{ color: "var(--color-sage)" }}
          >
            No orders found
          </p>
        ) : (
          <div className="p-3 flex flex-col gap-2">
            {filtered.map((order) => (
              <OrderCard
                key={order.id}
                order={{ ...order, selected: selectedIds.has(order.id) }}
                onToggle={toggleOrder}
              />
            ))}
          </div>
        )}
      </div>

      <div
        className="px-5 py-4"
        style={{
          borderTop: "1px solid var(--color-warm)",
          background: "white",
        }}
      >
        <div className="flex justify-between items-center mb-3">
          <div>
            <p
              className="text-xs font-medium uppercase tracking-wide"
              style={{ color: "var(--color-sage)" }}
            >
              Total weight
            </p>
            <p
              style={{
                fontFamily: "'Playfair Display', serif",
                fontWeight: 600,
                fontSize: "1.1rem",
                color: "var(--color-forest)",
              }}
            >
              {totalWeight} lb
            </p>
          </div>
          <div className="text-right">
            <p
              className="text-xs font-medium uppercase tracking-wide"
              style={{ color: "var(--color-sage)" }}
            >
              Selected
            </p>
            <p
              style={{
                fontFamily: "'Playfair Display', serif",
                fontWeight: 600,
                fontSize: "1.1rem",
                color: "var(--color-forest)",
              }}
            >
              {selectedIds.size} / {orders.length}
            </p>
          </div>
        </div>
        <button
          onClick={() => onGenerateRoutes([...selectedIds])}
          disabled={selectedIds.size === 0}
          className="w-full py-3 rounded-xl text-sm font-medium tracking-wide transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed hover:opacity-90"
          style={{
            background: "var(--color-forest)",
            color: "var(--color-cream)",
          }}
        >
          Generate Optimized Routes
        </button>
      </div>
    </Card>
  );
}
