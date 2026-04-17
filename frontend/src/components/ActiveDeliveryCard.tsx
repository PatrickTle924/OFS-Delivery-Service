"use client";

import { useEffect, useState } from "react";
import { MiniMap } from "./MiniMap";
import { ActiveDelivery } from "@/types/routing";
import { Card, CardBody, CardLabel, CardTitle } from "./Card";
import { RiRobot3Fill } from "react-icons/ri";
import { IoTimer } from "react-icons/io5";
import { IoClose } from "react-icons/io5";

interface ActiveDeliveryCardProps {
  delivery: ActiveDelivery;
  onTrack: (tripId: string) => void;
  onCancel: (tripId: string) => void;
}

export function ActiveDeliveryCard({
  delivery,
  onTrack,
  onCancel,
}: ActiveDeliveryCardProps) {
  const [showTrackingModal, setShowTrackingModal] = useState(false);

  const handleOpenTracking = () => {
    setShowTrackingModal(true);
    onTrack(delivery.tripId);
  };

  const handleCancelRoute = () => {
    const confirmed = window.confirm(
      "Are you sure you want to cancel this route?",
    );
    if (!confirmed) return;

    onCancel(delivery.tripId);
    setShowTrackingModal(false);
  };

  useEffect(() => {
    if (!showTrackingModal) return;

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, [showTrackingModal]);

  return (
    <>
      <Card>
        <div className="flex flex-col sm:flex-row items-stretch">
          <div className="sm:w-56 h-44 sm:h-56 flex-shrink-0 overflow-hidden">
            <MiniMap delivery={delivery} className="w-full h-full" />
          </div>

          <CardBody className="flex-1 flex flex-col justify-between gap-4">
            <div className="space-y-2">
              <CardTitle>Active Delivery</CardTitle>
              <CardLabel>
                {delivery.tripId}
                {delivery.status ? ` • ${delivery.status}` : ""}
              </CardLabel>

              <div className="mt-3 grid grid-cols-2 gap-3">
                <div
                  className="rounded-xl p-3 flex items-center gap-3 h-full"
                  style={{ background: "var(--color-warm)" }}
                >
                  <RiRobot3Fill size={32} color="var(--color-sage)" />
                  <div className="flex flex-col justify-center">
                    <p
                      className="text-[10px] font-medium uppercase tracking-wide"
                      style={{ color: "var(--color-sage)" }}
                    >
                      Robot
                    </p>
                    <p
                      className="text-sm font-bold leading-tight"
                      style={{
                        color: "var(--color-forest)",
                        fontFamily: "'Syne', sans-serif",
                      }}
                    >
                      {delivery.robotId}
                    </p>
                  </div>
                </div>

                <div
                  className="rounded-xl p-3 flex items-center gap-3 h-full"
                  style={{ background: "var(--color-warm)" }}
                >
                  <IoTimer size={32} color="var(--color-clay)" />
                  <div className="flex flex-col justify-center">
                    <p
                      className="text-[10px] font-medium uppercase tracking-wide"
                      style={{ color: "var(--color-sage)" }}
                    >
                      ETA
                    </p>
                    <p
                      className="text-sm font-bold leading-tight"
                      style={{
                        color: "var(--color-clay)",
                        fontFamily: "'Syne', sans-serif",
                      }}
                    >
                      {delivery.eta} mins
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={handleOpenTracking}
                className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white transition-all duration-200 hover:opacity-90"
                style={{
                  background:
                    "linear-gradient(135deg, var(--color-clay) 0%, var(--color-sage) 100%)",
                }}
              >
                View Robot Path
              </button>

              <button
                onClick={handleCancelRoute}
                className="px-4 py-2.5 rounded-xl text-sm font-semibold text-white transition-colors duration-200 bg-red-600 hover:bg-red-700"
              >
                Cancel Route
              </button>
            </div>
          </CardBody>
        </div>
      </Card>

      {showTrackingModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4 py-6">
          <div
            className="relative w-full max-w-6xl rounded-3xl shadow-2xl overflow-hidden"
            style={{ background: "var(--color-cream)" }}
          >
            <button
              onClick={() => setShowTrackingModal(false)}
              className="absolute right-4 top-4 z-10 rounded-full p-2 bg-white/90 hover:bg-white shadow"
              aria-label="Close tracking map"
            >
              <IoClose size={24} />
            </button>

            <div className="p-5 border-b border-black/10">
              <h2
                className="text-2xl font-bold"
                style={{
                  color: "var(--color-forest)",
                  fontFamily: "'Syne', sans-serif",
                }}
              >
                Live Robot Tracking
              </h2>
              <p
                className="text-sm mt-1"
                style={{ color: "var(--color-sage)" }}
              >
                {delivery.tripId}
                {delivery.status ? ` • ${delivery.status}` : ""}
              </p>
            </div>

            <div className="p-5">
              <MiniMap
                delivery={delivery}
                className="w-full h-[70vh]"
                focusMode
              />
            </div>

            <div className="p-5 pt-0">
              <button
                onClick={handleCancelRoute}
                className="px-4 py-2.5 rounded-xl text-sm font-semibold text-white transition-colors duration-200 bg-red-600 hover:bg-red-700"
              >
                Cancel Route
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
