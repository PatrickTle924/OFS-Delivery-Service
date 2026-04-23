"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import Navbar from "@/components/Navbar";
import CustomerRoute from "@/components/CustomerRoute";
import { verifyCheckoutSession } from "@/app/actions/stripe";
import { placeOrder, type PlaceOrderInput } from "@/lib/api-service";
import { useCart } from "@/context/CartContext";

const PENDING_ORDER_KEY_PREFIX = "ofs-pending-order-";
const PLACED_ORDER_KEY_PREFIX = "ofs-placed-order-";

function CheckoutCompleteContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { clearCart, totalItems } = useCart();

  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [message, setMessage] = useState("Finalizing your order...");
  const [orderId, setOrderId] = useState<number | null>(null);

  useEffect(() => {
    let isCancelled = false;

    const finalizeOrder = async () => {
      try {
        const sessionId = searchParams.get("session_id");

        if (!sessionId) {
          throw new Error("Missing Stripe session id.");
        }

        const existingOrderId = localStorage.getItem(
          `${PLACED_ORDER_KEY_PREFIX}${sessionId}`,
        );
        if (existingOrderId) {
          if (!isCancelled) {
            setOrderId(Number(existingOrderId));
            setMessage("Payment confirmed. Your order was already finalized.");
            setStatus("success");
          }
          return;
        }

        const session = await verifyCheckoutSession(sessionId);

        if (session.paymentStatus !== "paid") {
          throw new Error(
            "Payment was not completed. Please try checkout again.",
          );
        }

        const pendingOrderRaw = localStorage.getItem(
          `${PENDING_ORDER_KEY_PREFIX}${sessionId}`,
        );

        if (!pendingOrderRaw) {
          throw new Error(
            "We could not find your pending order details. Please contact support if your card was charged.",
          );
        }

        const pendingOrder = JSON.parse(pendingOrderRaw) as PlaceOrderInput;

        const order = await placeOrder({
          ...pendingOrder,
          stripe_session_id: sessionId,
          payment_intent_id: session.paymentIntentId || undefined,
        });

        localStorage.setItem(
          `${PLACED_ORDER_KEY_PREFIX}${sessionId}`,
          String(order.order_id),
        );
        localStorage.removeItem(`${PENDING_ORDER_KEY_PREFIX}${sessionId}`);

        clearCart();

        if (!isCancelled) {
          setOrderId(order.order_id);
          setMessage("Payment confirmed and order submitted successfully.");
          setStatus("success");
        }
      } catch (error) {
        if (!isCancelled) {
          setStatus("error");
          setMessage(
            error instanceof Error
              ? error.message
              : "Unable to finalize your order.",
          );
        }
      }
    };

    finalizeOrder();

    return () => {
      isCancelled = true;
    };
  }, [searchParams, clearCart]);

  return (
    <div className="min-h-screen bg-[#f7f3eb] px-6 py-10 text-[#1f4d36]">
      <Navbar alwaysFrosted cartItemCount={totalItems} />

      <div className="mx-auto max-w-3xl pt-24">
        <div className="rounded-3xl border border-[#e7ddcc] bg-white p-8 shadow-sm">
          <p className="text-sm uppercase tracking-[0.2em] text-[#a06d42]">
            OFS Market
          </p>
          <h1 className="mt-2 text-4xl font-semibold text-[#1f4d36]">
            Checkout Complete
          </h1>

          <p className="mt-4 rounded-xl bg-[#f8f2e8] px-4 py-3 text-sm text-[#4a4a45]">
            {message}
          </p>

          {status === "loading" && (
            <p className="mt-4 text-sm text-zinc-500">Please wait...</p>
          )}

          {status === "success" && (
            <div className="mt-5 space-y-3">
              {orderId ? (
                <p className="text-sm text-[#1f4d36]">Your order number is #{orderId}.</p>
              ) : null}
              <button
                onClick={() => router.push("/user/orders")}
                className="w-full rounded-xl bg-[#1f4d36] px-4 py-3 text-white transition hover:bg-[#2f644a]"
              >
                View My Orders
              </button>
            </div>
          )}

          {status === "error" && (
            <div className="mt-5 space-y-3">
              <button
                onClick={() => router.push("/user/checkout")}
                className="w-full rounded-xl bg-[#1f4d36] px-4 py-3 text-white transition hover:bg-[#2f644a]"
              >
                Back to Checkout
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function CheckoutCompletePage() {
  return (
    <CustomerRoute>
      <Suspense
        fallback={
          <div className="min-h-screen bg-[#f7f3eb] px-6 py-10 text-[#1f4d36]">
            <Navbar alwaysFrosted cartItemCount={0} />
            <div className="mx-auto max-w-3xl pt-24">
              <div className="rounded-3xl border border-[#e7ddcc] bg-white p-8 shadow-sm">
                <p className="text-sm text-zinc-500">Loading checkout result...</p>
              </div>
            </div>
          </div>
        }
      >
        <CheckoutCompleteContent />
      </Suspense>
    </CustomerRoute>
  );
}
