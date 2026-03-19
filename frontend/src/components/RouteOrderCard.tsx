"use client";

<<<<<<< HEAD
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
=======
import { useState } from "react";

// Types based on our ORM
export interface OrderData {
  order_id: number;
  ordered_at: string;
  total_cost: number;
  status: "pending" | "delivered" | "cancelled" | "in progress";
  item_count: number;
}

const STATUS_STYLES = {
  "in progress": "bg-mint/30 text-forest border-mint/50",
  delivered: "bg-sage/20 text-forest border-sage/40",
  cancelled: "bg-clay/10 text-[#b94040] border-clay/20",
  pending: "bg-warm/40 text-forest/70 border-warm/60",
};

export default function OrderCard({ order }: { order: OrderData }) {
  const [rating, setRating] = useState(0);
  const style = STATUS_STYLES[order.status] || STATUS_STYLES.pending;

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  return (
    <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-white/90 p-6 shadow-sm hover:shadow-md transition-all duration-300 flex flex-col md:flex-row md:items-center justify-between gap-6">
      
      {/* Left: Order Info */}
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-3 mb-1">
          <span className="text-xs font-medium text-forest/40 uppercase tracking-widest">
            Order #{order.order_id}
          </span>
          <span className={`text-[10px] font-bold uppercase tracking-tighter px-2 py-0.5 rounded-full border ${style}`}>
            {order.status}
          </span>
        </div>
        <h3 className="font-playfair text-xl text-forest">
          {formatDate(order.ordered_at)}
        </h3>
        <p className="text-sm text-[#777] font-light">
          {order.item_count} items • ${order.total_cost.toFixed(2)} total
        </p>
      </div>

      {/* Middle: Star Rating */}
      <div className="flex flex-col gap-2">
        <p className="text-[10px] font-medium text-forest/40 uppercase tracking-widest">Rate your experience</p>
        <div className="flex gap-1">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              onClick={() => setRating(star)}
              className={`transition-transform hover:scale-110 ${
                star <= rating ? "text-clay" : "text-warm/40"
              }`}
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                <path fillRule="evenodd" d="M10.788 3.21c.448-1.077 1.976-1.077 2.424 0l2.082 5.007 5.404.433c1.164.093 1.636 1.545.749 2.305l-4.117 3.527 1.257 5.273c.271 1.136-.964 2.033-1.96 1.425L12 18.354 7.373 21.18c-.996.608-2.231-.29-1.96-1.425l1.257-5.273-4.117-3.527c-.887-.76-.415-2.212.749-2.305l5.404-.433 2.082-5.006z" clipRule="evenodd" />
              </svg>
            </button>
          ))}
        </div>
      </div>

      {/* Right: Actions */}
      <div className="flex items-center gap-3">
        <button className="text-forest text-sm font-medium px-5 py-2.5 rounded-xl border border-forest/10 hover:bg-forest/5 transition-colors">
          View Receipt
        </button>
        <button className="bg-forest text-cream text-sm font-medium px-5 py-2.5 rounded-xl hover:bg-sage shadow-lg shadow-forest/10 transition-all hover:-translate-y-0.5">
          Order Again
        </button>
      </div>
    </div>
  );
}
>>>>>>> c427bdf6e2a80f3b6c1c92d7de94423acec42358
