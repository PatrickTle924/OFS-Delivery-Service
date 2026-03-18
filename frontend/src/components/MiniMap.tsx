"use client";

import { useEffect, useRef } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";

export function MiniMap({ className = "" }: { className?: string }) {
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const mapContainerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!mapContainerRef.current) return;
    if (mapRef.current) return;

    mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN!;

    mapRef.current = new mapboxgl.Map({
      container: mapContainerRef.current,
      style: "mapbox://styles/mapbox/light-v11",
      center: [-122.2712, 37.8044],
      zoom: 12,
      interactive: false,
    });

    mapRef.current.on("load", () => {
      const map = mapRef.current!;

      const route = {
        type: "Feature" as const,
        properties: {},
        geometry: {
          type: "LineString" as const,
          coordinates: [
            [-122.2712, 37.8044],
            [-122.261, 37.79],
            [-122.25, 37.78],
          ],
        },
      };
      map.addSource("route", {
        type: "geojson",
        data: route,
      });

      map.addLayer({
        id: "route-line",
        type: "line",
        source: "route",
        paint: {
          "line-color": "#4a7c59",
          "line-width": 4,
          "line-opacity": 0.85,
        },
      });

      // markers
      route.geometry.coordinates.forEach((coord, i) => {
        new mapboxgl.Marker({
          color: i === 0 ? "#c0392b" : "#1e3a28",
        })
          .setLngLat(coord as [number, number])
          .addTo(map);
      });

      const bounds = new mapboxgl.LngLatBounds();
      route.geometry.coordinates.forEach((c) =>
        bounds.extend(c as [number, number]),
      );

      map.fitBounds(bounds, { padding: 30 });
    });

    return () => {
      mapRef.current?.remove();
    };
  }, []);

  return (
    <div
      ref={mapContainerRef}
      className={`w-full h-full rounded-xl overflow-hidden ${className}`}
    />
  );
}
