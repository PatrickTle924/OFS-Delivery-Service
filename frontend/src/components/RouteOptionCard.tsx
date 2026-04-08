"use client";

import { RouteOption } from "@/types/routing";
import { Card, CardBody, CardLabel, CardTitle } from "./Card";
import { FaClock } from "react-icons/fa6";
import { MdOutlineSocialDistance } from "react-icons/md";

interface RouteOptionCardProps {
  route: RouteOption;
  onApprove: (routeId: number) => void;
}

export function RouteOptionCard({ route, onApprove }: RouteOptionCardProps) {
  return (
    <Card>
      <CardBody className="flex flex-col gap-4">
        <div className="flex items-start justify-between gap-2">
          <div>
            <CardLabel>Optimized Route</CardLabel>
            <CardTitle>{route.subtitle}</CardTitle>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div
            className="rounded-xl px-3 py-2.5 flex items-center gap-2.5"
            style={{
              background: "var(--color-cream)",
              border: "1px solid var(--color-warm)",
            }}
          >
            <FaClock size={32} color="var(--color-warm)" />
            <div>
              <p
                className="text-[10px] font-medium uppercase tracking-wide"
                style={{ color: "var(--color-sage)" }}
              >
                Est. time
              </p>
              <p
                style={{
                  fontFamily: "'Playfair Display', serif",
                  fontWeight: 600,
                  fontSize: "1rem",
                  color: "var(--color-forest)",
                }}
              >
                {route.estimatedTime}{" "}
                <span
                  className="text-xs font-light"
                  style={{ fontFamily: "'DM Sans', sans-serif" }}
                >
                  min
                </span>
              </p>
            </div>
          </div>

          <div
            className="rounded-xl px-3 py-2.5 flex items-center gap-2.5"
            style={{
              background: "var(--color-cream)",
              border: "1px solid var(--color-warm)",
            }}
          >
            <MdOutlineSocialDistance size={32} color="var(--color-warm)" />
            <div>
              <p
                className="text-[10px] font-medium uppercase tracking-wide"
                style={{ color: "var(--color-sage)" }}
              >
                Distance
              </p>
              <p
                style={{
                  fontFamily: "'Playfair Display', serif",
                  fontWeight: 600,
                  fontSize: "1rem",
                  color: "var(--color-forest)",
                }}
              >
                {route.totalDistance}{" "}
                <span
                  className="text-xs font-light"
                  style={{ fontFamily: "'DM Sans', sans-serif" }}
                >
                  mi
                </span>
              </p>
            </div>
          </div>
        </div>

        <ol className="space-y-2">
          {route.stops.map((stop, i) => (
            <li key={i} className="flex items-center gap-3 text-sm">
              <span
                className="flex-shrink-0 w-5 h-5 rounded-full text-[10px] font-semibold flex items-center justify-center"
                style={{
                  background: "var(--color-forest)",
                  color: "var(--color-cream)",
                }}
              >
                {i + 1}
              </span>
              <span
                className="font-light"
                style={{ color: "var(--color-forest)" }}
              >
                {stop.address}
              </span>
            </li>
          ))}
        </ol>

        <div className="flex gap-2 pt-1">
          <button
            onClick={() => onApprove(route.id)}
            className="flex-1 py-2.5 px-3 rounded-xl text-sm font-medium text-[var(--color-cream)] transition-all duration-200 hover:opacity-90"
            style={{ background: "var(--color-forest)" }}
          >
            Approve Route
          </button>
        </div>
      </CardBody>
    </Card>
  );
}
