"use client";

import { useEffect, useState } from "react";
import { Order, RouteOption, ActiveDelivery } from "@/types/routing";
import { DeliveryRoutes } from "@/components/DeliveryRoutes";
import { SuggestedRoutes } from "@/components/SuggestedRoutes";
import { ActiveDeliveryCard } from "@/components/ActiveDeliveryCard";
import { fetchOrders, optimizeRoutes } from "@/lib/api-service";

export default function DeliveryDashboardPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(true);
  const [loadingRoutes, setLoadingRoutes] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [routes, setRoutes] = useState<RouteOption[]>([]);
  const [activeDelivery, setActiveDelivery] = useState<ActiveDelivery | null>(
    null,
  );

  useEffect(() => {
    const loadOrders = async () => {
      try {
        setLoadingOrders(true);
        setError(null);

        const data: Order[] = await fetchOrders();
        setOrders(data);
      } catch (err: unknown) {
        const message =
          err instanceof Error ? err.message : "Failed to load orders";
        setError(message);
      } finally {
        setLoadingOrders(false);
      }
    };

    loadOrders();
  }, []);

  const handleGenerateRoutes = async (selectedIds: number[]) => {
    try {
      setLoadingRoutes(true);
      setError(null);

      // clear previous results before generating new ones
      setRoutes([]);
      setActiveDelivery(null);

      const data: {
        suggestedRoutes?: RouteOption[];
        activeDelivery?: ActiveDelivery | null;
      } = await optimizeRoutes(selectedIds);

      setRoutes(data.suggestedRoutes ?? []);
      setActiveDelivery(data.activeDelivery ?? null);
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Failed to generate routes";
      setError(message);
      setRoutes([]);
      setActiveDelivery(null);
    } finally {
      setLoadingRoutes(false);
    }
  };

  const handleViewMap = (routeId: number) => {
    console.log("View map:", routeId);
  };

  const handleApprove = (routeId: number) => {
    console.log("Approved:", routeId);
  };

  const handleTrackRobot = (tripId: string) => {
    console.log("Tracking:", tripId);
  };

  return (
    <div
      className="min-h-screen"
      style={{
        background: "var(--color-cream)",
        fontFamily: "'DM Sans', sans-serif",
      }}
    >
      <main className="w-full px-4 py-6 md:px-6">
        <div className="flex flex-col lg:flex-row gap-5">
          <div className="w-full lg:w-80 flex-shrink-0 lg:h-[calc(100vh-5.5rem)] lg:sticky lg:top-6">
            {loadingOrders ? (
              <div className="rounded-xl border border-zinc-200 bg-white p-4 text-sm">
                Loading orders...
              </div>
            ) : (
              <DeliveryRoutes
                orders={orders}
                onGenerateRoutes={handleGenerateRoutes}
              />
            )}
          </div>

          <div className="flex-1 flex flex-col gap-5">
            {loadingRoutes && (
              <div className="rounded-xl border border-zinc-200 bg-white p-4 text-sm">
                Generating optimized route...
              </div>
            )}

            {error && (
              <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                {error}
              </div>
            )}

            {activeDelivery && (
              <ActiveDeliveryCard
                delivery={activeDelivery}
                onTrack={handleTrackRobot}
              />
            )}

            {routes.length > 0 && (
              <SuggestedRoutes
                routes={routes}
                onViewMap={handleViewMap}
                onApprove={handleApprove}
              />
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
