"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import L from "leaflet";
import { MapContainer, Marker, Polyline, TileLayer, Tooltip, useMap } from "react-leaflet";
import { MapPinned } from "lucide-react";
import type { DivIcon, LatLngTuple, Marker as LeafletMarker } from "leaflet";

type Airport = {
  iataCode: string;
  name: string;
  city: string | null;
  country: string | null;
  latitude: string | number | null;
  longitude: string | number | null;
};

type Coordinate = {
  lat: number;
  lng: number;
};

type ShipmentRouteMapProps = {
  originAirport: Airport | null;
  destAirport: Airport | null;
  status?: string | null;
  deliveryStatus?: string | null;
  progress?: number | null;
};

const ANIMATION_DURATION_MS = 12000;
const ROUTE_CURVE_STEPS = 40;
const ROUTE_PAUSE_DURATION_MS = 1200;

function parseCoordinate(value: string | number | null, min: number, max: number) {
  if (value === null || value === "") return null;

  const numericValue = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(numericValue)) return null;
  if (numericValue < min || numericValue > max) return null;

  return numericValue;
}

function formatAirportLabel(airport: Airport | null) {
  if (!airport) return "N/A";

  const location = [airport.city, airport.country].filter(Boolean).join(", ");
  return location ? `${airport.iataCode} - ${location}` : airport.iataCode;
}

function getBearing(origin: Coordinate, destination: Coordinate) {
  const lat1 = (origin.lat * Math.PI) / 180;
  const lat2 = (destination.lat * Math.PI) / 180;
  const lngDelta = ((destination.lng - origin.lng) * Math.PI) / 180;
  const y = Math.sin(lngDelta) * Math.cos(lat2);
  const x =
    Math.cos(lat1) * Math.sin(lat2) -
    Math.sin(lat1) * Math.cos(lat2) * Math.cos(lngDelta);

  return (Math.atan2(y, x) * 180) / Math.PI + 90;
}

function clampProgress(value: number) {
  return Math.min(Math.max(value, 0), 1);
}

function normalizeProgress(value?: number | null) {
  if (typeof value !== "number" || !Number.isFinite(value)) return null;
  return clampProgress(value > 1 ? value / 100 : value);
}

function getPlaneMode(status?: string | null, deliveryStatus?: string | null) {
  const normalizedStatus = status?.toLowerCase().replace(/\s+/g, "_") || "";
  const normalizedDeliveryStatus =
    deliveryStatus?.toLowerCase().replace(/\s+/g, "_") || "";
  const statusValues = [normalizedStatus, normalizedDeliveryStatus].filter(Boolean);

  if (
    statusValues.some((value) =>
      ["delivered", "arrived_at_destination", "out_for_delivery", "ready_for_pickup"].includes(value)
    )
  ) {
    return "destination";
  }

  if (
    statusValues.some((value) =>
      ["in_transit", "departed", "transshipment"].includes(value)
    )
  ) {
    return "moving";
  }

  if (
    statusValues.some((value) =>
      ["pending", "booked", "processing", "received_at_warehouse", "security_cleared", "manifested"].includes(value)
    )
  ) {
    return "origin";
  }

  return "moving";
}

function createRoutePoints(origin: Coordinate, destination: Coordinate) {
  const lngDelta = destination.lng - origin.lng;
  const latDelta = destination.lat - origin.lat;
  const distance = Math.hypot(lngDelta, latDelta);
  const curveOffset = Math.min(Math.max(distance * 0.12, 0.8), 8);
  const control: Coordinate = {
    lat: (origin.lat + destination.lat) / 2 + curveOffset,
    lng: (origin.lng + destination.lng) / 2,
  };
  const points: LatLngTuple[] = [];

  for (let index = 0; index <= ROUTE_CURVE_STEPS; index += 1) {
    const t = index / ROUTE_CURVE_STEPS;
    const inverseT = 1 - t;
    points.push([
      inverseT * inverseT * origin.lat +
        2 * inverseT * t * control.lat +
        t * t * destination.lat,
      inverseT * inverseT * origin.lng +
        2 * inverseT * t * control.lng +
        t * t * destination.lng,
    ]);
  }

  return points;
}

function getRoutePointAtProgress(points: LatLngTuple[], progress: number) {
  if (points.length === 0) {
    return {
      position: [0, 0] as LatLngTuple,
      bearing: 90,
    };
  }

  if (points.length === 1) {
    return {
      position: points[0],
      bearing: 90,
    };
  }

  const boundedProgress = clampProgress(progress);
  const segmentFloat = boundedProgress * (points.length - 1);
  const segmentIndex = Math.min(Math.floor(segmentFloat), points.length - 2);
  const segmentProgress = segmentFloat - segmentIndex;
  const start = points[segmentIndex];
  const end = points[segmentIndex + 1];
  const position: LatLngTuple = [
    start[0] + (end[0] - start[0]) * segmentProgress,
    start[1] + (end[1] - start[1]) * segmentProgress,
  ];

  return {
    position,
    bearing: getBearing(
      { lat: start[0], lng: start[1] },
      { lat: end[0], lng: end[1] }
    ),
  };
}

function FitRouteBounds({
  origin,
  destination,
}: {
  origin: Coordinate;
  destination: Coordinate;
}) {
  const map = useMap();

  useEffect(() => {
    if (!map || !map.getContainer().isConnected) return;

    const bounds = L.latLngBounds(
      [origin.lat, origin.lng],
      [destination.lat, destination.lng]
    );

    if (!bounds.isValid()) return;

    const animationFrameId = window.requestAnimationFrame(() => {
      if (map.getContainer().isConnected) {
        map.fitBounds(bounds, { padding: [42, 42], maxZoom: 8 });
      }
    });

    return () => window.cancelAnimationFrame(animationFrameId);
  }, [destination.lat, destination.lng, map, origin.lat, origin.lng]);

  return null;
}

function AnimatedPlaneMarker({
  icon,
  mode,
  progress,
  routePoints,
}: {
  icon: DivIcon;
  mode: "origin" | "moving" | "destination";
  progress: number | null;
  routePoints: LatLngTuple[];
}) {
  const map = useMap();
  const markerRef = useRef<LeafletMarker | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const timeoutRef = useRef<number | null>(null);
  const animationStartRef = useRef<number | null>(null);
  const [isMarkerReady, setIsMarkerReady] = useState(false);
  const initialProgress = mode === "destination" ? 1 : mode === "origin" ? 0 : progress ?? 0.35;
  const initialRoutePoint = getRoutePointAtProgress(routePoints, initialProgress);

  useEffect(() => {
    function stopAnimation() {
      if (animationFrameRef.current !== null) {
        window.cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }

      if (timeoutRef.current !== null) {
        window.clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    }

    function rotatePlane(bearing: number) {
      const rotationElement = markerRef.current
        ?.getElement()
        ?.querySelector<HTMLElement>(".sl-route-plane-rotator");

      if (rotationElement) {
        rotationElement.style.transform = `rotate(${bearing}deg)`;
      }
    }

    function setPlanePosition(nextProgress: number) {
      const marker = markerRef.current;

      if (
        !marker ||
        !map ||
        !map.getContainer().isConnected ||
        !map.hasLayer(marker) ||
        !marker.getElement()?.isConnected
      ) {
        return false;
      }

      const routePoint = getRoutePointAtProgress(routePoints, nextProgress);
      marker.setLatLng(routePoint.position);
      rotatePlane(routePoint.bearing);
      return true;
    }

    stopAnimation();
    animationStartRef.current = null;

    if (!isMarkerReady || routePoints.length < 2 || !map.getContainer().isConnected) {
      return stopAnimation;
    }

    if (mode !== "moving") {
      setPlanePosition(mode === "destination" ? 1 : 0);
      return stopAnimation;
    }

    const offsetProgress = progress ?? 0.35;

    function animate(timestamp: number) {
      if (animationStartRef.current === null) {
        animationStartRef.current = timestamp - offsetProgress * ANIMATION_DURATION_MS;
      }

      const elapsed = timestamp - animationStartRef.current;
      const cycleDuration = ANIMATION_DURATION_MS + ROUTE_PAUSE_DURATION_MS;
      const cycleElapsed = elapsed % cycleDuration;
      const nextProgress = Math.min(cycleElapsed / ANIMATION_DURATION_MS, 1);

      if (!setPlanePosition(nextProgress)) {
        stopAnimation();
        return;
      }

      animationFrameRef.current = window.requestAnimationFrame(animate);
    }

    animationFrameRef.current = window.requestAnimationFrame(animate);

    return stopAnimation;
  }, [isMarkerReady, map, mode, progress, routePoints]);

  return (
    <Marker
      ref={markerRef}
      position={initialRoutePoint.position}
      icon={icon}
      eventHandlers={{
        add: () => setIsMarkerReady(true),
        remove: () => setIsMarkerReady(false),
      }}
      zIndexOffset={1000}
    />
  );
}

export default function ShipmentRouteMap({
  originAirport,
  destAirport,
  status,
  deliveryStatus,
  progress,
}: ShipmentRouteMapProps) {
  const [isMapReady, setIsMapReady] = useState(false);
  const route = useMemo(() => {
    const originLat = parseCoordinate(originAirport?.latitude ?? null, -90, 90);
    const originLng = parseCoordinate(originAirport?.longitude ?? null, -180, 180);
    const destLat = parseCoordinate(destAirport?.latitude ?? null, -90, 90);
    const destLng = parseCoordinate(destAirport?.longitude ?? null, -180, 180);

    if (
      originLat === null ||
      originLng === null ||
      destLat === null ||
      destLng === null
    ) {
      return null;
    }

    return {
      origin: { lat: originLat, lng: originLng },
      destination: { lat: destLat, lng: destLng },
      points: createRoutePoints(
        { lat: originLat, lng: originLng },
        { lat: destLat, lng: destLng }
      ),
    };
  }, [
    destAirport?.latitude,
    destAirport?.longitude,
    originAirport?.latitude,
    originAirport?.longitude,
  ]);

  const icons = useMemo(() => {
    if (!route) return null;

    const airportIcon = (variant: "origin" | "destination") =>
      L.divIcon({
        className: "",
        html: `<div class="sl-route-marker sl-route-marker-${variant}">
          <span class="sl-route-marker-core"></span>
        </div>`,
        iconAnchor: [10, 10],
        iconSize: [20, 20],
      });

    return {
      origin: airportIcon("origin"),
      destination: airportIcon("destination"),
      plane: L.divIcon({
        className: "",
        html: `
          <div class="sl-route-plane">
            <span class="sl-route-plane-rotator">
              <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
                <path d="M21.5 12.2 3 21l3.2-8.8L3 3.4l18.5 8.8Z" />
              </svg>
            </span>
          </div>
        `,
        iconAnchor: [20, 20],
        iconSize: [40, 40],
      }),
    };
  }, [route]);

  const planeMode = useMemo(
    () => getPlaneMode(status, deliveryStatus),
    [deliveryStatus, status]
  );
  const normalizedProgress = useMemo(() => normalizeProgress(progress), [progress]);

  return (
    <section className="rounded-xl border border-[#e8edf4] bg-[#f8fafc] p-5">
      <div className="mb-4 flex items-center gap-2 text-[#1a2d5a]">
        <MapPinned size={18} strokeWidth={2.4} />
        <h2 className="text-sm font-black uppercase tracking-[0.4px]">
          Shipment Route Map
        </h2>
      </div>

      {!route || !icons ? (
        <div className="flex min-h-[380px] items-center justify-center rounded-lg border border-dashed border-[#cbd5e1] bg-white p-6 text-center text-sm font-bold text-[#64748b]">
          Map unavailable: airport coordinates missing.
        </div>
      ) : (
        <>
          <div className="mb-3 grid grid-cols-1 gap-3 md:grid-cols-2">
            <div className="rounded-lg border border-[#e8edf4] bg-white p-3">
              <div className="text-[10px] font-bold uppercase tracking-[0.5px] text-[#94a3b8]">
                Origin
              </div>
              <div className="mt-1 text-sm font-black text-[#0f172a]">
                {formatAirportLabel(originAirport)}
              </div>
              <div className="mt-1 text-xs font-medium text-[#64748b]">
                {originAirport?.name || "Airport data unavailable"}
              </div>
            </div>
            <div className="rounded-lg border border-[#e8edf4] bg-white p-3">
              <div className="text-[10px] font-bold uppercase tracking-[0.5px] text-[#94a3b8]">
                Destination
              </div>
              <div className="mt-1 text-sm font-black text-[#0f172a]">
                {formatAirportLabel(destAirport)}
              </div>
              <div className="mt-1 text-xs font-medium text-[#64748b]">
                {destAirport?.name || "Airport data unavailable"}
              </div>
            </div>
          </div>

          <div
            className="sl-shipment-map"
            style={{
              height: "clamp(380px, 42vw, 520px)",
              minHeight: 380,
              width: "100%",
            }}
          >
            <MapContainer
              center={[route.origin.lat, route.origin.lng]}
              zoom={4}
              scrollWheelZoom={false}
              className="h-full w-full"
              style={{ height: "100%", width: "100%" }}
              whenReady={() => setIsMapReady(true)}
            >
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              {isMapReady ? (
                <FitRouteBounds origin={route.origin} destination={route.destination} />
              ) : null}
              <Polyline
                positions={route.points}
                pathOptions={{
                  color: "#1a2d5a",
                  weight: 3,
                  opacity: 0.78,
                  dashArray: "9 11",
                  lineCap: "round",
                  lineJoin: "round",
                }}
              />
              <Marker position={[route.origin.lat, route.origin.lng]} icon={icons.origin}>
                <Tooltip direction="top" offset={[0, -8]}>
                  {formatAirportLabel(originAirport)}
                </Tooltip>
              </Marker>
              <Marker position={[route.destination.lat, route.destination.lng]} icon={icons.destination}>
                <Tooltip direction="top" offset={[0, -8]}>
                  {formatAirportLabel(destAirport)}
                </Tooltip>
              </Marker>
              {isMapReady ? (
                <AnimatedPlaneMarker
                  icon={icons.plane}
                  mode={planeMode}
                  progress={normalizedProgress}
                  routePoints={route.points}
                />
              ) : null}
            </MapContainer>
          </div>
        </>
      )}
      <style jsx global>{`
        .sl-shipment-map .sl-route-marker {
          align-items: center;
          background: #ffffff;
          border: 2px solid #ffffff;
          border-radius: 999px;
          box-shadow: 0 10px 22px rgba(15, 23, 42, 0.24);
          display: flex;
          height: 20px;
          justify-content: center;
          width: 20px;
        }

        .sl-shipment-map .sl-route-marker-core {
          border-radius: 999px;
          display: block;
          height: 10px;
          width: 10px;
        }

        .sl-shipment-map .sl-route-marker-origin .sl-route-marker-core {
          background: #0ea5e9;
        }

        .sl-shipment-map .sl-route-marker-destination .sl-route-marker-core {
          background: #16a34a;
        }

        .sl-shipment-map .sl-route-plane {
          align-items: center;
          background: #1a2d5a;
          border: 2px solid rgba(255, 255, 255, 0.96);
          border-radius: 999px;
          box-shadow: 0 16px 34px rgba(26, 45, 90, 0.3);
          display: flex;
          height: 40px;
          justify-content: center;
          width: 40px;
        }

        .sl-shipment-map .sl-route-plane-rotator {
          display: flex;
          height: 25px;
          transform-origin: center;
          width: 25px;
          will-change: transform;
        }

        .sl-shipment-map .sl-route-plane svg {
          display: block;
          fill: #ffffff;
          height: 25px;
          width: 25px;
        }
      `}</style>
    </section>
  );
}
