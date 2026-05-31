"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import L from "leaflet";
import { MapContainer, Marker, Polyline, TileLayer, Tooltip, useMap } from "react-leaflet";
import { MapPinned } from "lucide-react";

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
};

const ANIMATION_DURATION_MS = 12000;

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

function FitRouteBounds({
  origin,
  destination,
}: {
  origin: Coordinate;
  destination: Coordinate;
}) {
  const map = useMap();

  useEffect(() => {
    const bounds = L.latLngBounds(
      [origin.lat, origin.lng],
      [destination.lat, destination.lng]
    );

    if (bounds.isValid()) {
      map.fitBounds(bounds, { padding: [42, 42], maxZoom: 8 });
    }
  }, [destination.lat, destination.lng, map, origin.lat, origin.lng]);

  return null;
}

export default function ShipmentRouteMap({
  originAirport,
  destAirport,
}: ShipmentRouteMapProps) {
  const animationFrameRef = useRef<number | null>(null);
  const animationStartRef = useRef<number | null>(null);
  const [progress, setProgress] = useState(0);

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
    };
  }, [
    destAirport?.latitude,
    destAirport?.longitude,
    originAirport?.latitude,
    originAirport?.longitude,
  ]);

  const icons = useMemo(() => {
    if (!route) return null;

    const bearing = getBearing(route.origin, route.destination);

    const airportIcon = (variant: "origin" | "destination") =>
      L.divIcon({
        className: "",
        html: `<div class="sl-route-marker sl-route-marker-${variant}"></div>`,
        iconAnchor: [8, 8],
        iconSize: [16, 16],
      });

    return {
      origin: airportIcon("origin"),
      destination: airportIcon("destination"),
      plane: L.divIcon({
        className: "",
        html: `
          <div class="sl-route-plane" style="transform: rotate(${bearing}deg);">
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M21.5 12.2 3 21l3.2-8.8L3 3.4l18.5 8.8Z" />
            </svg>
          </div>
        `,
        iconAnchor: [18, 18],
        iconSize: [36, 36],
      }),
    };
  }, [route]);

  useEffect(() => {
    if (!route) return undefined;

    animationStartRef.current = null;

    function animate(timestamp: number) {
      if (animationStartRef.current === null) {
        animationStartRef.current = timestamp;
      }

      const elapsed = (timestamp - animationStartRef.current) % ANIMATION_DURATION_MS;
      setProgress(elapsed / ANIMATION_DURATION_MS);
      animationFrameRef.current = window.requestAnimationFrame(animate);
    }

    animationFrameRef.current = window.requestAnimationFrame(animate);

    return () => {
      if (animationFrameRef.current !== null) {
        window.cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [route]);

  const planePosition = useMemo(() => {
    if (!route) return null;

    return {
      lat: route.origin.lat + (route.destination.lat - route.origin.lat) * progress,
      lng: route.origin.lng + (route.destination.lng - route.origin.lng) * progress,
    };
  }, [progress, route]);

  return (
    <section className="rounded-xl border border-[#e8edf4] bg-[#f8fafc] p-5">
      <div className="mb-4 flex items-center gap-2 text-[#1a2d5a]">
        <MapPinned size={18} strokeWidth={2.4} />
        <h2 className="text-sm font-black uppercase tracking-[0.4px]">
          Shipment Route Map
        </h2>
      </div>

      {!route || !icons || !planePosition ? (
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

          <div className="sl-shipment-map">
            <MapContainer
              center={[route.origin.lat, route.origin.lng]}
              zoom={4}
              scrollWheelZoom={false}
              className="h-full w-full"
            >
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              <FitRouteBounds origin={route.origin} destination={route.destination} />
              <Polyline
                positions={[
                  [route.origin.lat, route.origin.lng],
                  [route.destination.lat, route.destination.lng],
                ]}
                pathOptions={{ color: "#1a2d5a", weight: 3, opacity: 0.75, dashArray: "8 10" }}
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
              <Marker position={[planePosition.lat, planePosition.lng]} icon={icons.plane} />
            </MapContainer>
          </div>
        </>
      )}
    </section>
  );
}
