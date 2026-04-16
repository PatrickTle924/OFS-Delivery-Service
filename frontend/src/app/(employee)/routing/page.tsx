"use client";

import { useEffect, useRef, useState } from "react";
import { DeliveryRoutes } from "@/components/DeliveryRoutes";
import { SuggestedRoutes } from "@/components/SuggestedRoutes";
import { ActiveDeliveryCard } from "@/components/ActiveDeliveryCard";

import {
  Order,
  RouteOption,
  ActiveDelivery,
  RoutePreview,
} from "@/types/routing";
import {
  fetchOrders,
  fetchActiveDelivery,
  optimizeRoutes,
  approveRoute,
  startSimulation,
  startTrip,
} from "@/lib/api-service";
import Link from "next/dist/client/link";
import EmployeeRoute from "@/components/EmployeeRoute";

export default function DeliveryDashboardPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(true);
  const [loadingRoutes, setLoadingRoutes] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [completionMessage, setCompletionMessage] = useState<string | null>(
    null,
  );

  const [routes, setRoutes] = useState<RouteOption[]>([]);
  const [activeDelivery, setActiveDelivery] = useState<ActiveDelivery | null>(
    null,
  );
  const [approvedRoutePreview, setApprovedRoutePreview] =
    useState<RoutePreview | null>(null);

  const simulationRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        setLoadingOrders(true);
        setError(null);

        const [ordersData, activeData] = await Promise.all([
          fetchOrders(),
          fetchActiveDelivery(),
        ]);

        setOrders(ordersData);
        setActiveDelivery(activeData.activeDelivery ?? null);
        setRoutes([]);
      } catch (err: unknown) {
        const message =
          err instanceof Error ? err.message : "Failed to load dashboard";
        setError(message);
      } finally {
        setLoadingOrders(false);
      }
    };

    loadDashboardData();
  }, []);

  useEffect(() => {
    return () => {
      if (simulationRef.current) {
        clearInterval(simulationRef.current);
      }
    };
  }, []);

  const handleGenerateRoutes = async (selectedIds: number[]) => {
    try {
      setLoadingRoutes(true);
      setError(null);
      setCompletionMessage(null);

      setRoutes([]);
      setApprovedRoutePreview(null);

      const data: {
        suggestedRoutes?: RouteOption[];
        routePreview?: RoutePreview | null;
      } = await optimizeRoutes(selectedIds);

      setRoutes(data.suggestedRoutes ?? []);
      setApprovedRoutePreview(data.routePreview ?? null);
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Failed to generate routes";
      setError(message);
      setRoutes([]);
      setApprovedRoutePreview(null);
    } finally {
      setLoadingRoutes(false);
    }
  };

  const handleApprove = async (_routeId: number) => {
    try {
      if (!approvedRoutePreview) {
        throw new Error("No route preview available");
      }

      setLoadingRoutes(true);
      setError(null);
      setCompletionMessage(null);

      const data = await approveRoute({
        routeData: approvedRoutePreview,
        orderIds: approvedRoutePreview.orderIds,
      });

      setActiveDelivery(data.activeDelivery ?? null);
      setRoutes([]);
      setApprovedRoutePreview(null);

      const refreshedOrders = await fetchOrders();
      setOrders(refreshedOrders);
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Failed to approve route";
      setError(message);
    } finally {
      setLoadingRoutes(false);
    }
  };

  const handleTrackRobot = async (tripId: string) => {
    try {
      setError(null);
      setCompletionMessage(null);

      const numericId = Number(tripId.replace("Trip #", ""));

      if (simulationRef.current) {
        clearInterval(simulationRef.current);
        simulationRef.current = null;
      }

      if (activeDelivery?.status === "assigned") {
        await startTrip(numericId);
        const refreshed = await fetchActiveDelivery();
        setActiveDelivery(refreshed.activeDelivery ?? null);
      }

      simulationRef.current = startSimulation(
        numericId,
        (updatedDelivery) => {
          setActiveDelivery(updatedDelivery ?? null);
        },
        async () => {
          const [refreshedOrders, refreshedDelivery] = await Promise.all([
            fetchOrders(),
            fetchActiveDelivery(),
          ]);

          setOrders(refreshedOrders);

          if (refreshedDelivery.activeDelivery) {
            setActiveDelivery(refreshedDelivery.activeDelivery);
          } else {
            setActiveDelivery((prev) =>
              prev
                ? {
                    ...prev,
                    status: "completed",
                  }
                : null,
            );
          }

          setCompletionMessage(`Trip ${tripId} completed successfully.`);

          if (simulationRef.current) {
            clearInterval(simulationRef.current);
            simulationRef.current = null;
          }
        },
        1000,
      );
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Failed to track robot";
      setError(message);
    }
  };

  return (
    <EmployeeRoute>
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

              {completionMessage && (
                <div className="rounded-xl border border-green-200 bg-green-50 p-4 text-sm text-green-700">
                  {completionMessage}
                </div>
              )}

              {activeDelivery && activeDelivery.tripId && (
                <ActiveDeliveryCard
                  delivery={activeDelivery}
                  onTrack={handleTrackRobot}
                />
              )}

              {routes.length > 0 && approvedRoutePreview && (
                <SuggestedRoutes
                  routes={routes}
                  routePreview={approvedRoutePreview}
                  onApprove={handleApprove}
                />
              )}
            </div>
          </div>
          <Link
            href="/empdashboard"
            className="text-sage font-medium underline underline-offset-2 hover:text-forest transition-colors"
          >
            ← Back to Dashboard
          </Link>
        </main>
      </div>
    </EmployeeRoute>
  );
}
