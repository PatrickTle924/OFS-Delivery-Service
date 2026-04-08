"use client";

import { useEffect, useRef } from "react";
import mapboxgl, { LngLatBounds } from "mapbox-gl";
import { renderToStaticMarkup } from "react-dom/server";
import { FaCarAlt } from "react-icons/fa";
import { ActiveDelivery } from "@/types/routing";
import { FaWarehouse } from "react-icons/fa";

mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || "";

interface MiniMapProps {
  delivery: ActiveDelivery;
  className?: string;
  focusMode?: boolean;
  showTraffic?: boolean;
  showInfoPanel?: boolean;
}

export function MiniMap({
  delivery,
  className = "",
  focusMode = false,
  showTraffic = false,
  showInfoPanel = false,
}: MiniMapProps) {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const stopMarkersRef = useRef<mapboxgl.Marker[]>([]);
  const robotMarkerRef = useRef<mapboxgl.Marker | null>(null);
  const warehouseMarkersRef = useRef<mapboxgl.Marker[]>([]);
  const hasFittedRef = useRef(false);

  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;
    if (!mapboxgl.accessToken) return;

    const initialCenter: [number, number] = delivery.robotPosition
      ? [delivery.robotPosition.lng, delivery.robotPosition.lat]
      : delivery.routeGeometry?.coordinates?.length
        ? [
            delivery.routeGeometry.coordinates[0][0],
            delivery.routeGeometry.coordinates[0][1],
          ]
        : delivery.mapPoints?.length
          ? [delivery.mapPoints[0].lng, delivery.mapPoints[0].lat]
          : [-121.89, 37.335];

    const map = new mapboxgl.Map({
      container: mapContainerRef.current,
      style: "mapbox://styles/mapbox/streets-v12",
      center: initialCenter,
      zoom: focusMode ? 12 : 11,
      attributionControl: false,
    });

    map.addControl(new mapboxgl.NavigationControl(), "top-right");

    map.on("load", () => {
      updateMap(map);
      if (showTraffic) {
        addTrafficLayers(map);
      }
    });

    mapRef.current = map;

    return () => {
      stopMarkersRef.current.forEach((marker) => marker.remove());
      stopMarkersRef.current = [];

      warehouseMarkersRef.current.forEach((marker) => marker.remove());
      warehouseMarkersRef.current = [];

      if (robotMarkerRef.current) {
        robotMarkerRef.current.remove();
        robotMarkerRef.current = null;
      }

      map.remove();
      mapRef.current = null;
      hasFittedRef.current = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !map.isStyleLoaded()) return;

    updateMap(map);

    if (showTraffic) {
      addTrafficLayers(map);
    } else {
      removeTrafficLayers(map);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [delivery, focusMode, showTraffic]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    const handleResize = () => {
      map.resize();
    };

    const timeout = window.setTimeout(() => {
      map.resize();
    }, 100);

    window.addEventListener("resize", handleResize);

    return () => {
      window.clearTimeout(timeout);
      window.removeEventListener("resize", handleResize);
    };
  }, [focusMode]);

  const updateMap = (map: mapboxgl.Map) => {
    console.log("MiniMap delivery:", delivery);
    console.log("fullRoute:", delivery.routeGeometry);
    console.log("traveledPath:", delivery.traveledPath);
    console.log("mapPoints:", delivery.mapPoints);
    console.log("robotPosition:", delivery.robotPosition);
    if (!map.isStyleLoaded()) return;

    const fullRoute = delivery.routeGeometry ?? null;
    const traveledPath = delivery.traveledPath ?? null;
    const mapPoints = delivery.mapPoints ?? [];
    const robotPosition = delivery.robotPosition ?? null;

    upsertGeoJsonSource(map, "full-route-source", {
      type: "Feature",
      geometry: fullRoute ?? { type: "LineString", coordinates: [] },
      properties: {},
    });

    if (!map.getLayer("full-route-layer")) {
      map.addLayer({
        id: "full-route-layer",
        type: "line",
        source: "full-route-source",
        paint: {
          "line-color": "#2563eb",
          "line-width": focusMode ? 6 : 4,
          "line-opacity": 0.95,
        },
      });
    }

    upsertGeoJsonSource(map, "traveled-route-source", {
      type: "Feature",
      geometry: traveledPath ?? { type: "LineString", coordinates: [] },
      properties: {},
    });

    if (!map.getLayer("traveled-route-layer")) {
      map.addLayer({
        id: "traveled-route-layer",
        type: "line",
        source: "traveled-route-source",
        paint: {
          "line-color": "#16a34a",
          "line-width": focusMode ? 7 : 5,
          "line-opacity": 0.95,
        },
      });
    }

    stopMarkersRef.current.forEach((marker) => marker.remove());
    stopMarkersRef.current = [];

    mapPoints.forEach((point) => {
      const el = document.createElement("div");
      el.style.width = focusMode ? "30px" : "24px";
      el.style.height = focusMode ? "30px" : "24px";
      el.style.borderRadius = "9999px";
      el.style.display = "flex";
      el.style.alignItems = "center";
      el.style.justifyContent = "center";
      el.style.color = "white";
      el.style.fontWeight = "700";
      el.style.fontSize = focusMode ? "12px" : "10px";
      el.style.border = "2px solid white";
      el.style.boxShadow = "0 4px 10px rgba(0,0,0,0.2)";
      el.style.background = point.completed ? "#16a34a" : "#2563eb";
      el.innerText = point.label;

      const marker = new mapboxgl.Marker({ element: el })
        .setLngLat([point.lng, point.lat])
        .addTo(map);

      stopMarkersRef.current.push(marker);
    });

    warehouseMarkersRef.current.forEach((marker) => marker.remove());
    warehouseMarkersRef.current = [];

    const routeCoords = fullRoute?.coordinates ?? [];
    const startCoord = routeCoords.length > 0 ? routeCoords[0] : null;
    const endCoord =
      routeCoords.length > 1 ? routeCoords[routeCoords.length - 1] : null;

    if (startCoord) {
      const startEl = document.createElement("div");
      startEl.style.minWidth = focusMode ? "92px" : "74px";
      startEl.style.height = focusMode ? "34px" : "28px";
      startEl.style.padding = "0 10px";
      startEl.style.borderRadius = "9999px";
      startEl.style.display = "flex";
      startEl.style.alignItems = "center";
      startEl.style.justifyContent = "center";
      startEl.style.color = "white";
      startEl.style.fontWeight = "700";
      startEl.style.fontSize = focusMode ? "12px" : "11px";
      startEl.style.border = "2px solid white";
      startEl.style.boxShadow = "0 6px 16px rgba(0,0,0,0.22)";
      startEl.style.background = "#14532d";
      startEl.innerHTML = renderToStaticMarkup(
        <FaWarehouse size={focusMode ? 18 : 14} color="white" />,
      );

      const startMarker = new mapboxgl.Marker({
        element: startEl,
        anchor: "bottom",
      })
        .setLngLat([startCoord[0], startCoord[1]])
        .addTo(map);

      warehouseMarkersRef.current.push(startMarker);
    }

    if (endCoord && startCoord && !samePoint(startCoord, endCoord)) {
      const endEl = document.createElement("div");
      endEl.style.minWidth = focusMode ? "104px" : "84px";
      endEl.style.height = focusMode ? "34px" : "28px";
      endEl.style.padding = "0 10px";
      endEl.style.borderRadius = "9999px";
      endEl.style.display = "flex";
      endEl.style.alignItems = "center";
      endEl.style.justifyContent = "center";
      endEl.style.color = "white";
      endEl.style.fontWeight = "700";
      endEl.style.fontSize = focusMode ? "12px" : "11px";
      endEl.style.border = "2px solid white";
      endEl.style.boxShadow = "0 6px 16px rgba(0,0,0,0.22)";
      endEl.style.background = "#9a3412";
      endEl.innerText = "Return";

      const endMarker = new mapboxgl.Marker({
        element: endEl,
        anchor: "bottom",
      })
        .setLngLat([endCoord[0], endCoord[1]])
        .addTo(map);

      warehouseMarkersRef.current.push(endMarker);
    }

    if (robotMarkerRef.current) {
      robotMarkerRef.current.remove();
      robotMarkerRef.current = null;
    }

    if (robotPosition) {
      const robotEl = document.createElement("div");
      robotEl.style.width = focusMode ? "36px" : "30px";
      robotEl.style.height = focusMode ? "36px" : "30px";
      robotEl.style.borderRadius = "9999px";
      robotEl.style.background = "#c2410c";
      robotEl.style.border = "3px solid white";
      robotEl.style.boxShadow = "0 6px 16px rgba(0,0,0,0.25)";
      robotEl.style.display = "flex";
      robotEl.style.alignItems = "center";
      robotEl.style.justifyContent = "center";

      robotEl.innerHTML = renderToStaticMarkup(
        <FaCarAlt size={focusMode ? 18 : 14} color="white" />,
      );

      robotMarkerRef.current = new mapboxgl.Marker({ element: robotEl })
        .setLngLat([robotPosition.lng, robotPosition.lat])
        .addTo(map);
    }

    const allCoords: [number, number][] = [];

    if (fullRoute?.coordinates?.length) {
      fullRoute.coordinates.forEach((coord) => {
        allCoords.push([coord[0], coord[1]]);
      });
    }

    mapPoints.forEach((point) => {
      allCoords.push([point.lng, point.lat]);
    });

    if (robotPosition) {
      allCoords.push([robotPosition.lng, robotPosition.lat]);
    }

    if (allCoords.length > 0) {
      const bounds = new LngLatBounds(allCoords[0], allCoords[0]);
      allCoords.forEach((coord) => bounds.extend(coord));

      if (!focusMode && !hasFittedRef.current) {
        map.fitBounds(bounds, { padding: 40, duration: 0 });
        hasFittedRef.current = true;
      }

      if (focusMode) {
        map.fitBounds(bounds, { padding: 60, duration: 500, maxZoom: 14 });
      }
    }
  };

  const info = delivery.trafficInfo;

  return (
    <div className={`relative ${className}`}>
      {showInfoPanel && (
        <div className="absolute left-4 top-4 z-10 flex flex-wrap gap-2">
          <InfoBadge
            label="ETA"
            value={`${info?.estimatedTime ?? delivery.eta ?? 0} min`}
          />
          <InfoBadge
            label="Distance"
            value={`${info?.totalDistance ?? 0} km`}
          />
          {"totalWeight" in (info ?? {}) && info?.totalWeight !== undefined ? (
            <InfoBadge label="Weight" value={`${info.totalWeight} lbs`} />
          ) : null}
          {showTraffic ? <InfoBadge label="Traffic" value="Live" /> : null}
        </div>
      )}

      <div
        ref={mapContainerRef}
        style={{
          borderRadius: focusMode ? "20px" : "0px",
          minHeight: focusMode ? "70vh" : "100%",
          width: "100%",
        }}
      />
    </div>
  );
}

function InfoBadge({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-full bg-white/95 px-3 py-2 shadow-md border border-zinc-200">
      <div className="text-[11px] uppercase tracking-wide text-zinc-500">
        {label}
      </div>
      <div className="text-sm font-semibold text-zinc-900">{value}</div>
    </div>
  );
}

function addTrafficLayers(map: mapboxgl.Map) {
  if (!map.getSource("traffic-source")) {
    map.addSource("traffic-source", {
      type: "vector",
      url: "mapbox://mapbox.mapbox-traffic-v1",
    });
  }

  if (!map.getLayer("traffic-moderate-layer")) {
    map.addLayer(
      {
        id: "traffic-moderate-layer",
        type: "line",
        source: "traffic-source",
        "source-layer": "traffic",
        filter: ["==", ["get", "congestion"], "moderate"],
        paint: {
          "line-width": 2,
          "line-opacity": 0.55,
          "line-color": "#eab308",
        },
      },
      "full-route-layer",
    );
  }

  if (!map.getLayer("traffic-heavy-layer")) {
    map.addLayer(
      {
        id: "traffic-heavy-layer",
        type: "line",
        source: "traffic-source",
        "source-layer": "traffic",
        filter: [
          "any",
          ["==", ["get", "congestion"], "heavy"],
          ["==", ["get", "congestion"], "severe"],
        ],
        paint: {
          "line-width": 3,
          "line-opacity": 0.7,
          "line-color": "#dc2626",
        },
      },
      "full-route-layer",
    );
  }
}

function removeTrafficLayers(map: mapboxgl.Map) {
  if (map.getLayer("traffic-heavy-layer")) {
    map.removeLayer("traffic-heavy-layer");
  }
  if (map.getLayer("traffic-moderate-layer")) {
    map.removeLayer("traffic-moderate-layer");
  }
  if (map.getSource("traffic-source")) {
    map.removeSource("traffic-source");
  }
}

function upsertGeoJsonSource(
  map: mapboxgl.Map,
  sourceId: string,
  data: GeoJSON.Feature<GeoJSON.Geometry>,
) {
  const existing = map.getSource(sourceId) as
    | mapboxgl.GeoJSONSource
    | undefined;

  if (existing) {
    existing.setData(data);
    return;
  }

  map.addSource(sourceId, {
    type: "geojson",
    data,
  });
}

function samePoint(a: number[], b: number[], tolerance = 0.0001) {
  return Math.abs(a[0] - b[0]) < tolerance && Math.abs(a[1] - b[1]) < tolerance;
}
