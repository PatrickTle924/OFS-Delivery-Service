"use client";

import { useMemo, useState, useEffect } from "react";
import { RouteOption, RoutePreview, ActiveDelivery } from "@/types/routing";
import { RouteOptionCard } from "./RouteOptionCard";
import { MiniMap } from "./MiniMap";

interface SuggestedRoutesProps {
  routes: RouteOption[];
  routePreview: RoutePreview | null;
  onApprove: (routeId: number) => void;
}

export function SuggestedRoutes({
  routes,
  routePreview,
  onApprove,
}: SuggestedRoutesProps) {
  const [selectedRouteId, setSelectedRouteId] = useState<number | null>(null);

  useEffect(() => {
    if (routes.length > 0) {
      setSelectedRouteId(routes[0].id);
    } else {
      setSelectedRouteId(null);
    }
  }, [routes]);

  const previewDelivery: ActiveDelivery | null = useMemo(() => {
    if (!routePreview || routes.length === 0) return null;

    return {
      tripId: "Preview Route",
      tripNumericId: 0,
      robotId: "Robot-01",
      eta: routePreview.estimatedTime,
      status: "preview",
      mapPoints: routePreview.mapPoints ?? [],
      mapLines: [],
      routeGeometry: routePreview.routeGeometry ?? null,
      traveledPath: null,
      robotPosition: null,
      trafficInfo: {
        estimatedTime: routePreview.estimatedTime,
        totalDistance: routePreview.totalDistance,
        totalWeight: routePreview.totalWeight,
        trafficEnabled: true,
      },
    };
  }, [routePreview, routes]);
  if (routes.length === 0) {
    return (
      <div
        className="flex flex-col items-center justify-center h-36 rounded-2xl border-2 border-dashed"
        style={{ borderColor: "var(--color-warm)", background: "white" }}
      >
        <span
          className="w-7 h-7 rounded-xl mb-2"
          style={{ background: "var(--color-warm)" }}
        />
        <p
          className="text-sm font-light"
          style={{ color: "var(--color-sage)" }}
        >
          Select orders and generate routes
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center">
      <div className="w-full">
        <h2
          className="mb-4"
          style={{
            fontFamily: "'Playfair Display', serif",
            fontWeight: 600,
            fontSize: "1.2rem",
            color: "var(--color-forest)",
            letterSpacing: "-0.01em",
          }}
        >
          Suggested Routes
        </h2>

        <div className="gap-4 flex flex-col">
          {routes.map((route) => (
            <div
              key={route.id}
              onClick={() => setSelectedRouteId(route.id)}
              className={`transition-all ${
                selectedRouteId === route.id
                  ? "ring-2 ring-offset-2 rounded-2xl"
                  : ""
              }`}
              style={
                selectedRouteId === route.id
                  ? ({
                      ringColor: "var(--color-forest)",
                    } as React.CSSProperties)
                  : undefined
              }
            >
              <RouteOptionCard route={route} onApprove={onApprove} />
            </div>
          ))}
        </div>
      </div>

      {previewDelivery && (
        <div className="w-full max-w-5xl mt-6">
          <div
            className="rounded-3xl border bg-white shadow-sm overflow-hidden"
            style={{ borderColor: "var(--color-warm)" }}
          >
            <div className="px-5 pt-5 pb-3">
              <h3
                className="text-lg"
                style={{
                  fontFamily: "'Playfair Display', serif",
                  fontWeight: 600,
                  color: "var(--color-forest)",
                }}
              >
                Route Map Preview
              </h3>
              <p
                className="text-sm mt-1"
                style={{ color: "var(--color-sage)" }}
              >
                Traffic-aware preview with ETA and distance
              </p>
            </div>

            <div className="px-5 pb-5">
              <MiniMap
                delivery={previewDelivery}
                focusMode
                showTraffic
                showInfoPanel
                className="w-full"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
