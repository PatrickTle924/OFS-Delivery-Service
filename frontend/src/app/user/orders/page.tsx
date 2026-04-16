"use client";

import { useEffect, useState } from "react";
import Navbar from "@/components/Navbar";
import CustomerRoute from "@/components/CustomerRoute";
import { fetchOrderHistory, OrderHistoryItem } from "@/lib/api-service";

type OrderStatus = "pending" | "delivered" | "cancelled" | "in progress";

interface TimelineStepData {
  label: string;
  time: string;
  done: boolean;
  active: boolean;
}

interface UIOrder {
  id: number;
  items: number;
  weight: string;
  status: string;
  placedAt: string;
  address: string;
  eta: string;
  steps: TimelineStepData[];
}

function normalizeStatus(status: string): OrderStatus {
  const value = status.trim().toLowerCase();

  if (value === "pending") return "pending";
  if (value === "delivered") return "delivered";
  if (value === "cancelled") return "cancelled";
  if (value === "in progress" || value === "in_progress") return "in progress";

  return "pending";
}

function formatPlacedAt(dateString: string | null): string {
  if (!dateString) return "Date unavailable";

  const date = new Date(dateString);

  return date.toLocaleString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

function buildSteps(
  status: OrderStatus,
  orderedAt: string | null,
): TimelineStepData[] {
  const placedTime = orderedAt
    ? new Date(orderedAt).toLocaleTimeString("en-US", {
        hour: "numeric",
        minute: "2-digit",
      })
    : "—";

  if (status === "pending") {
    return [
      { label: "Order Placed", time: placedTime, done: true, active: false },
      {
        label: "Order Confirmed",
        time: "Processing",
        done: false,
        active: true,
      },
      {
        label: "Out for Delivery",
        time: "Waiting",
        done: false,
        active: false,
      },
      {
        label: "Delivered",
        time: "Pending",
        done: false,
        active: false,
      },
    ];
  }

  if (status === "in progress") {
    return [
      { label: "Order Placed", time: placedTime, done: true, active: false },
      {
        label: "Order Confirmed",
        time: "Confirmed",
        done: true,
        active: false,
      },
      {
        label: "Out for Delivery",
        time: "Now",
        done: false,
        active: true,
      },
      {
        label: "Delivered",
        time: "Soon",
        done: false,
        active: false,
      },
    ];
  }

  if (status === "delivered") {
    return [
      { label: "Order Placed", time: placedTime, done: true, active: false },
      {
        label: "Order Confirmed",
        time: "Confirmed",
        done: true,
        active: false,
      },
      {
        label: "Out for Delivery",
        time: "Completed",
        done: true,
        active: false,
      },
      {
        label: "Delivered",
        time: "Delivered",
        done: true,
        active: false,
      },
    ];
  }

  return [
    { label: "Order Placed", time: placedTime, done: true, active: false },
    {
      label: "Order Confirmed",
      time: "Stopped",
      done: false,
      active: false,
    },
    {
      label: "Out for Delivery",
      time: "Cancelled",
      done: false,
      active: false,
    },
    {
      label: "Delivered",
      time: "Cancelled",
      done: false,
      active: false,
    },
  ];
}

function toUIOrder(order: OrderHistoryItem): UIOrder {
  const normalizedStatus = normalizeStatus(order.status);

  return {
    id: order.order_id,
    items: order.item_count,
    weight: `${order.total_weight.toFixed(1)} lbs`,
    status:
      normalizedStatus === "in progress"
        ? "In Transit"
        : normalizedStatus.charAt(0).toUpperCase() + normalizedStatus.slice(1),
    placedAt: formatPlacedAt(order.ordered_at),
    address: order.delivery_address || "Address unavailable",
    eta:
      normalizedStatus === "delivered"
        ? "Delivered"
        : normalizedStatus === "cancelled"
          ? "Cancelled"
          : "Pending update",
    steps: buildSteps(normalizedStatus, order.ordered_at),
  };
}

function StatusBadge({ status }: { status: string }) {
  return (
    <div className="inline-flex items-center justify-center rounded-xl border border-warm bg-white/80 px-4 py-2 text-sm font-medium text-forest shadow-sm backdrop-blur-sm">
      {status}
    </div>
  );
}

function TimelineStep({
  step,
}: {
  step: { label: string; time: string; done: boolean; active: boolean };
}) {
  const isDone = step.done;
  const isActive = step.active;

  return (
    <div className="flex items-start gap-3">
      <div className="pt-1">
        {isDone ? (
          <div className="flex h-5 w-5 items-center justify-center rounded-full bg-forest text-cream text-[11px]">
            ✓
          </div>
        ) : isActive ? (
          <div className="h-5 w-5 rounded-full border-4 border-forest bg-forest" />
        ) : (
          <div className="h-5 w-5 rounded-full border-2 border-forest/25 bg-transparent" />
        )}
      </div>

      <div className="text-sm">
        <p
          className={`${
            isActive
              ? "font-semibold text-forest"
              : isDone
                ? "text-forest/80"
                : "text-forest/35"
          }`}
        >
          {step.label} - {step.time}
        </p>
      </div>
    </div>
  );
}

function OrderCard({ order }: { order: UIOrder }) {
  return (
    <div className="rounded-3xl border border-warm bg-white/70 p-6 shadow-sm backdrop-blur-sm md:p-8">
      <div className="mb-5 flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight text-forest">
            Order #{order.id}
          </h2>
          <p className="mt-1 text-sm text-forest/55">
            {order.items} items • {order.weight}
          </p>
        </div>

        <StatusBadge status={order.status} />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1.8fr_1fr]">
        <div className="rounded-2xl border border-warm/80 bg-[linear-gradient(180deg,rgba(255,255,255,0.5),rgba(246,241,233,0.7))] p-3">
          <div className="flex h-[260px] items-center justify-center rounded-xl border border-dashed border-forest/15 bg-forest/5 text-center text-base text-forest/45 md:h-[340px]">
            Live map not available in history view
          </div>
        </div>

        <div className="flex flex-col justify-between rounded-2xl border border-warm/70 bg-cream/60 p-5">
          <div className="space-y-5">
            <div>
              <p className="mb-1 text-sm font-semibold uppercase tracking-[0.08em] text-sage">
                Order Placed
              </p>
              <p className="text-sm text-forest/75">{order.placedAt}</p>
            </div>

            <div>
              <p className="mb-1 text-sm font-semibold uppercase tracking-[0.08em] text-sage">
                Delivery Address
              </p>
              <p className="text-sm text-forest/75">{order.address}</p>
            </div>

            <div>
              <p className="mb-1 text-sm font-semibold uppercase tracking-[0.08em] text-sage">
                Estimated Time of Arrival
              </p>
              <p className="text-3xl font-semibold tracking-tight text-forest">
                {order.eta}
              </p>
            </div>
          </div>

          <div className="mt-8 border-l-2 border-warm pl-4">
            <div className="space-y-4">
              {order.steps.map((step, idx) => (
                <TimelineStep key={idx} step={step} />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function OrdersPage() {
  const [orders, setOrders] = useState<UIOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadOrders() {
      try {
        const data = await fetchOrderHistory();
        const mapped = data.map(toUIOrder);
        setOrders(mapped);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load orders.");
      } finally {
        setLoading(false);
      }
    }

    loadOrders();
  }, []);

  return (
    <CustomerRoute>
      <div className="min-h-screen bg-cream font-dm relative">
        <div className="pointer-events-none fixed top-[-10%] left-[-10%] h-150 w-150 rounded-full bg-[radial-gradient(ellipse_at_center,rgba(168,213,181,0.18)_0%,transparent_65%)] -z-10" />
        <div className="pointer-events-none fixed bottom-[-10%] right-[-10%] h-150 w-150 rounded-full bg-[radial-gradient(ellipse_at_center,rgba(196,133,90,0.10)_0%,transparent_65%)] -z-10" />

        <Navbar alwaysFrosted />

        <main className="mx-auto max-w-7xl px-8 pb-16 pt-28">
          <div className="mb-10">
            <p className="mb-2 text-xs font-medium uppercase tracking-[0.14em] text-sage">
              OFS Orders
            </p>
            <h1 className="font-playfair text-4xl leading-tight text-forest md:text-5xl">
              Track Your <em className="text-clay">Orders</em>
            </h1>
            <p className="mt-3 max-w-2xl text-sm text-forest/55 md:text-base">
              Stay updated with your delivery progress, estimated arrival time,
              and latest order status.
            </p>
          </div>

          {loading ? (
            <div className="rounded-3xl border border-warm bg-white/70 p-6 shadow-sm backdrop-blur-sm text-forest/60">
              Loading your orders...
            </div>
          ) : error ? (
            <div className="rounded-3xl border border-[#f5c0c0] bg-[#fdeaea] p-6 text-[#b94040]">
              {error}
            </div>
          ) : orders.length === 0 ? (
            <div className="rounded-3xl border border-warm bg-white/70 p-6 shadow-sm backdrop-blur-sm text-forest/60">
              No orders found.
            </div>
          ) : (
            <div className="space-y-8">
              {orders.map((order) => (
                <OrderCard key={order.id} order={order} />
              ))}
            </div>
          )}
        </main>
      </div>
    </CustomerRoute>
  );
}
