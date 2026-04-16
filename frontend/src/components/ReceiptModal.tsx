"use client";

import { useState, useEffect } from "react";
import { fetchOrderDetails } from "@/lib/api-service";

interface ReceiptItem {
  product: {
    id: number;
    name: string;
    category: string;
    price: number;
    weight: number;
    stock: number;
    description: string;
    imageUrl: string;
  };
  quantity: number;
  unit_price: number;
  unit_weight: number;
  subtotal: number;
}

interface ReceiptData {
  order_id: number;
  ordered_at: string;
  total_cost: number;
  subtotal: number;
  delivery_fee: number;
  status: string;
  delivery_address: string;
  delivery_city: string;
  delivery_state: string;
  delivery_zip: string;
  items: ReceiptItem[];
}

interface ReceiptModalProps {
  orderId: number;
  isOpen: boolean;
  onClose: () => void;
}

export default function ReceiptModal({ orderId, isOpen, onClose }: ReceiptModalProps) {
  const [receipt, setReceipt] = useState<ReceiptData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;

    const loadReceipt = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await fetchOrderDetails(orderId);
        setReceipt(data);
      } catch (err) {
        setError("Failed to load receipt");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    loadReceipt();
  }, [isOpen, orderId]);

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/30 backdrop-blur-sm z-40"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-2xl max-h-[90vh] bg-cream rounded-3xl shadow-2xl z-50 overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-cream border-b border-forest/10 px-8 py-6 flex justify-between items-center">
          <h2 className="font-playfair text-2xl text-forest">Order Receipt</h2>
          <button
            onClick={onClose}
            className="text-forest/40 hover:text-forest transition-colors"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="px-8 py-8">
          {loading ? (
            <p className="text-forest/60 text-center py-8">Loading receipt...</p>
          ) : error ? (
            <p className="text-red-500 text-center py-8">{error}</p>
          ) : receipt ? (
            <div className="space-y-8">
              {/* Order Header */}
              <div className="border-b border-forest/10 pb-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <p className="text-xs font-medium text-forest/40 uppercase tracking-widest mb-1">
                      Order #{receipt.order_id}
                    </p>
                    <p className="text-sm text-forest/60">
                      {new Date(receipt.ordered_at).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>
                  <span className="text-xs font-bold uppercase tracking-tighter px-3 py-1 rounded-full bg-sage/20 text-forest border border-sage/40">
                    {receipt.status}
                  </span>
                </div>

                {/* Delivery Address */}
                <div className="mt-4">
                  <p className="text-xs font-medium text-forest/40 uppercase tracking-widest mb-2">
                    Delivery Address
                  </p>
                  <p className="text-sm text-forest">
                    {receipt.delivery_address}
                  </p>
                  <p className="text-sm text-forest/60">
                    {receipt.delivery_city}, {receipt.delivery_state} {receipt.delivery_zip}
                  </p>
                </div>
              </div>

              {/* Items */}
              <div>
                <h3 className="text-sm font-bold text-forest uppercase tracking-widest mb-4">
                  Items
                </h3>
                <div className="space-y-3">
                  {receipt.items.map((item, idx) => (
                    <div
                      key={idx}
                      className="flex justify-between items-start pb-3 border-b border-forest/5"
                    >
                      <div className="flex-1">
                        <p className="font-medium text-forest text-sm">
                          {item.product.name}
                        </p>
                        <p className="text-xs text-forest/60">
                          {item.quantity} × ${item.unit_price.toFixed(2)}
                        </p>
                      </div>
                      <p className="font-medium text-forest text-sm ml-4">
                        ${item.subtotal.toFixed(2)}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Totals */}
              <div className="bg-white/50 rounded-xl p-6 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-forest/60">Subtotal</span>
                  <span className="text-forest font-medium">
                    ${receipt.subtotal.toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-forest/60">Delivery Fee</span>
                  <span className="text-forest font-medium">
                    ${receipt.delivery_fee.toFixed(2)}
                  </span>
                </div>
                <div className="border-t border-forest/10 pt-2 flex justify-between">
                  <span className="font-bold text-forest">Total</span>
                  <span className="font-bold text-forest">
                    ${receipt.total_cost.toFixed(2)}
                  </span>
                </div>
              </div>

              {/* Close Button */}
              <button
                onClick={onClose}
                className="w-full bg-forest text-cream font-medium py-3 rounded-xl hover:bg-sage transition-colors"
              >
                Close Receipt
              </button>
            </div>
          ) : null}
        </div>
      </div>
    </>
  );
}
