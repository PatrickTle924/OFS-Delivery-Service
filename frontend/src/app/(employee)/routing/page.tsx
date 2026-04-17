"use client";

import { useEffect, useState } from "react";
import EmployeeSidebar from "@/components/EmployeeSidebar";
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
  startTrip,
  cancelRoute,
} from "@/lib/api-service";
import Link from "next/link";
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

  const loadDashboardData = async (showLoading = false) => {
    try {
      if (showLoading) {
        setLoadingOrders(true);
      }

      const [ordersData, activeData] = await Promise.all([
        fetchOrders(),
        fetchActiveDelivery(),
      ]);

      setOrders(ordersData);
      setActiveDelivery(activeData.activeDelivery ?? null);
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Failed to load dashboard";
      setError(message);
    } finally {
      if (showLoading) {
        setLoadingOrders(false);
      }
    }
  };

  useEffect(() => {
    setError(null);
    void loadDashboardData(true);
  }, []);

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      void loadDashboardData(false);
    }, 3000);

    return () => {
      window.clearInterval(intervalId);
    };
  }, []);

  const handleCancelRoute = async (tripId: string) => {
    try {
      setError(null);
      setCompletionMessage(null);

      const numericId = Number(tripId.replace("Trip #", ""));

      await cancelRoute(numericId);

      await loadDashboardData(false);
      setRoutes([]);
      setApprovedRoutePreview(null);
      setCompletionMessage(`Trip ${tripId} was cancelled.`);
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Failed to cancel route";
      setError(message);
    }
  };

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

      if (activeDelivery?.status === "assigned") {
        await startTrip(numericId);
      }

      await loadDashboardData(false);
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
        <EmployeeSidebar active="routing" />

        <main className="px-4 py-6 md:px-6">
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
                  onCancel={handleCancelRoute}
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

          <div className="mt-6">
            <Link
              href="/empdashboard"
              className="text-sage font-medium underline underline-offset-2 hover:text-forest transition-colors"
            >
              ← Back to Dashboard
            </Link>
          </div>
        </main>
      </div>
    </EmployeeRoute>
  );
}
