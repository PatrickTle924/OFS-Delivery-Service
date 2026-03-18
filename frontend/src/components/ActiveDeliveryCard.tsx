"use client";

import { MiniMap } from "./MiniMap";
import { ActiveDelivery } from "@/types/routing";
import { Card, CardBody, CardLabel, CardTitle } from "./Card";
import { RiRobot3Fill } from "react-icons/ri";
import { IoTimer } from "react-icons/io5";

interface ActiveDeliveryCardProps {
  delivery: ActiveDelivery;
  onTrack: (tripId: string) => void;
}

export function ActiveDeliveryCard({
  delivery,
  onTrack,
}: ActiveDeliveryCardProps) {
  return (
    <Card>
      <div className="flex flex-col sm:flex-row items-stretch">
        {/* Map section */}
        <div className="sm:w-56 h-44 sm:h-auto flex-shrink-0 overflow-hidden">
          <MiniMap className="w-full h-full" />
        </div>

        {/* Info section */}
        <CardBody className="flex-1 flex flex-col justify-between gap-4">
          {/* Top content */}
          <div className="space-y-2">
            <CardTitle>Active Deliveries</CardTitle>
            <CardLabel>{delivery.tripId}</CardLabel>

            <div className="mt-3 grid grid-cols-2">
              {/* Robot */}
              <div
                className="rounded-xl p-3 flex items-center gap-3 h-full"
                style={{ background: "var(--brand-warm-gray)" }}
              >
                <RiRobot3Fill size={32} color="var(--brand-amber-light)" />
                <div className="flex flex-col justify-center">
                  <p
                    className="text-[10px] font-medium uppercase tracking-wide"
                    style={{ color: "var(--brand-muted)" }}
                  >
                    Robot
                  </p>
                  <p
                    className="text-sm font-bold leading-tight"
                    style={{
                      color: "var(--brand-text)",
                      fontFamily: "'Syne', sans-serif",
                    }}
                  >
                    {delivery.robotId}
                  </p>
                </div>
              </div>

              {/* ETA */}
              <div
                className="rounded-xl p-3 flex items-center gap-3 h-full"
                style={{ background: "var(--brand-warm-gray)" }}
              >
                <IoTimer size={32} color="var(--brand-amber-light)" />
                <div className="flex flex-col justify-center">
                  <p
                    className="text-[10px] font-medium uppercase tracking-wide"
                    style={{ color: "var(--brand-muted)" }}
                  >
                    ETA
                  </p>
                  <p
                    className="text-sm font-bold leading-tight"
                    style={{
                      color: "var(--brand-red)",
                      fontFamily: "'Syne', sans-serif",
                    }}
                  >
                    {delivery.eta} mins
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Button */}
          <button
            onClick={() => onTrack(delivery.tripId)}
            className="w-full py-2.5 rounded-xl text-sm font-semibold text-white transition-all duration-200"
            style={{
              background:
                "linear-gradient(135deg, var(--brand-red) 0%, var(--brand-amber) 100%)",
            }}
          >
            Track Robot
          </button>
        </CardBody>
      </div>
    </Card>
  );
}
