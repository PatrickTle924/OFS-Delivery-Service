"use client";

import { RouteOption } from "@/types/routing";
import { RouteOptionCard } from "./RouteOptionCard";

interface SuggestedRoutesProps {
  routes: RouteOption[];
  onViewMap: (routeId: number) => void;
  onApprove: (routeId: number) => void;
}

export function SuggestedRoutes({
  routes,
  onViewMap,
  onApprove,
}: SuggestedRoutesProps) {
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
    <div>
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
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {routes.map((route) => (
          <RouteOptionCard
            key={route.id}
            route={route}
            onViewMap={onViewMap}
            onApprove={onApprove}
          />
        ))}
      </div>
    </div>
  );
}
