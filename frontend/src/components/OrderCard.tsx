"use client";

import { Order } from "@/types/routing";
import { Card } from "./Card";

interface OrderCardProps {
  order: Order;
  onToggle: (id: string) => void;
}

export function OrderCard({ order, onToggle }: OrderCardProps) {
  return (
    <Card
      interactive
      onClick={() => onToggle(order.id)}
      className={`shadow-none transition-all duration-150 ${
        order.selected
          ? "border-[var(--color-sage)] bg-[#f0f7f2]"
          : "border-[var(--color-warm)] bg-white"
      }`}
    >
      <div className="px-4 py-3 flex items-center gap-3">
        {/* Checkbox */}
        <span
          className="flex-shrink-0 w-5 h-5 rounded-full border-[1.5px] flex items-center justify-center transition-all"
          style={{
            background: order.selected ? "var(--color-forest)" : "white",
            borderColor: order.selected
              ? "var(--color-forest)"
              : "var(--color-warm)",
          }}
        >
          {order.selected && (
            <svg viewBox="0 0 12 12" fill="none" width="9" height="9">
              <path
                d="M2 6l3 3 5-5"
                stroke="#f5f0e8"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          )}
        </span>

        {/* Order info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <span
              style={{
                fontFamily: "'Playfair Display', serif",
                fontWeight: 600,
                fontSize: "0.9rem",
                color: "var(--color-forest)",
              }}
            >
              {order.id}
            </span>
            <span
              className="text-xs font-medium px-2 py-0.5 rounded-full"
              style={{ background: "#f0f7f2", color: "var(--color-sage)" }}
            >
              ${order.price.toFixed(2)}
            </span>
          </div>
          <p
            className="text-xs mt-0.5 truncate"
            style={{ color: "var(--color-sage)" }}
          >
            {order.address}
          </p>
          <div className="flex items-center gap-3 mt-1">
            <span
              className="text-xs font-light"
              style={{ color: "var(--color-sage)" }}
            >
              {order.weight} lb
            </span>
            <span
              className="text-xs font-light"
              style={{ color: "var(--color-sage)" }}
            >
              {order.time}
            </span>
          </div>
        </div>
      </div>
    </Card>
  );
}
