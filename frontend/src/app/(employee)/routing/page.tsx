"use client";

import { useState } from "react";
import { Order, RouteOption, ActiveDelivery } from "@/types/routing";
import { DeliveryRoutes } from "@/components/DeliveryRoutes";
import { SuggestedRoutes } from "@/components/SuggestedRoutes";
import { ActiveDeliveryCard } from "@/components/ActiveDeliveryCard";

const MOCK_ORDERS: Order[] = [
  {
    id: "Order #1021",
    weight: 18,
    address: "123 South St",
    time: "2:00 PM",
    price: 70.2,
  },
  {
    id: "Order #1022",
    weight: 17,
    address: "123 North St",
    time: "2:10 PM",
    price: 50.2,
  },
  {
    id: "Order #1023",
    weight: 16,
    address: "123 East St",
    time: "2:15 PM",
    price: 60.2,
  },
  {
    id: "Order #1024",
    weight: 15,
    address: "123 West St",
    time: "2:20 PM",
    price: 40.2,
  },
];

const MOCK_ROUTES: RouteOption[] = [
  {
    id: 1,
    title: "Route Option #1",
    subtitle: "Fastest Time",
    estimatedTime: 26,
    totalDistance: 9.1,
    stops: [
      { label: "1", address: "550 South St" },
      { label: "2", address: "660 North St" },
      { label: "3", address: "110 West St" },
    ],
  },
  {
    id: 2,
    title: "Route Option #2",
    subtitle: "Shortest Distance",
    estimatedTime: 34,
    totalDistance: 7.1,
    stops: [
      { label: "1", address: "123 South St" },
      { label: "2", address: "222 North St" },
      { label: "3", address: "444 West St" },
    ],
  },
];

const MOCK_ACTIVE: ActiveDelivery = {
  tripId: "Trip #203",
  robotId: "Robot-01",
  eta: 23,
  mapPoints: [
    { x: 110, y: 140, label: "1" },
    { x: 90, y: 60, label: "2" },
    { x: 230, y: 80, label: "3" },
  ],
  mapLines: [
    { from: 0, to: 1 },
    { from: 1, to: 2 },
  ],
};

export default function DeliveryDashboardPage() {
  const [showRoutes, setShowRoutes] = useState(true);

  const handleGenerateRoutes = (selectedIds: string[]) => {
    console.log("Generating routes for:", selectedIds);
    setShowRoutes(true);
  };

  const handleViewMap = (routeId: number) => console.log("View map:", routeId);
  const handleApprove = (routeId: number) => console.log("Approved:", routeId);
  const handleTrackRobot = (tripId: string) => console.log("Tracking:", tripId);

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
            <DeliveryRoutes
              orders={MOCK_ORDERS}
              onGenerateRoutes={handleGenerateRoutes}
            />
          </div>

          <div className="flex-1 flex flex-col gap-5">
            <ActiveDeliveryCard
              delivery={MOCK_ACTIVE}
              onTrack={handleTrackRobot}
            />
            <SuggestedRoutes
              routes={showRoutes ? MOCK_ROUTES : []}
              onViewMap={handleViewMap}
              onApprove={handleApprove}
            />
          </div>
        </div>
      </main>
    </div>
  );
}
