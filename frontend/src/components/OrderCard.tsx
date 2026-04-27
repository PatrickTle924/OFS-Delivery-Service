"use client";

import { useState } from "react";
import { useCart } from "@/context/CartContext";
import ReceiptModal from "./ReceiptModal";
import ReportModal from "./ReportModal";
import { fetchOrderDetails } from "@/lib/api-service";
import type { Product } from "@/types/shop";

// Types based on our ORM
export interface OrderData {
  order_id: number;
  ordered_at: string;
  total_cost: number;
  status: "pending" | "delivered" | "cancelled" | "in progress";
  item_count: number;
}

interface OrderItem {
  product: Product;
  quantity: number;
}

const STATUS_STYLES = {
  "in progress": "bg-mint/30 text-forest border-mint/50",
  delivered: "bg-sage/20 text-forest border-sage/40",
  cancelled: "bg-clay/10 text-[#b94040] border-clay/20",
  pending: "bg-warm/40 text-forest/70 border-warm/60",
};

export default function OrderCard({ order }: { order: OrderData }) {
  const [rating, setRating] = useState(0);
  const [showReceipt, setShowReceipt] = useState(false);
  const [showReport, setShowReport] = useState(false);
  const [isOrderingAgain, setIsOrderingAgain] = useState(false);
  const { addToCart } = useCart();

  const style = STATUS_STYLES[order.status] || STATUS_STYLES.pending;

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const handleOrderAgain = async () => {
    setIsOrderingAgain(true);
    try {
      const orderDetails = await fetchOrderDetails(order.order_id);
      orderDetails.items.forEach((item: OrderItem) => {
        for (let i = 0; i < item.quantity; i++) {
          addToCart(item.product);
        }
      });
      alert("Order items added to cart!");
    } catch (error) {
      console.error("Failed to order again:", error);
      alert("Failed to add items to cart");
    } finally {
      setIsOrderingAgain(false);
    }
  };

  return (
    <>
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

        {/* Middle: Star Rating
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
        */}
        
        {/* Right: Actions */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => setShowReport(true)}
            className="text-[#b94040] text-xs font-medium px-3 py-2 rounded-lg border border-clay/25 hover:bg-clay/10 transition-colors"
          >
            Report Issue
          </button>
          <button
            onClick={() => setShowReceipt(true)}
            className="text-forest text-xs font-medium px-3 py-2 rounded-lg border border-forest/10 hover:bg-forest/5 transition-colors"
          >
            View Receipt
          </button>
          <button
            onClick={handleOrderAgain}
            disabled={isOrderingAgain}
            className="bg-forest text-cream text-xs font-medium px-3 py-2 rounded-lg hover:bg-sage shadow-sm shadow-forest/10 transition-all hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isOrderingAgain ? "Adding..." : "Order Again"}
          </button>
        </div>
      </div>

      <ReceiptModal
        orderId={order.order_id}
        isOpen={showReceipt}
        onClose={() => setShowReceipt(false)}
      />

      <ReportModal
        open={showReport}
        orderId={order.order_id}
        onClose={() => setShowReport(false)}
      />
    </>
  );
}
