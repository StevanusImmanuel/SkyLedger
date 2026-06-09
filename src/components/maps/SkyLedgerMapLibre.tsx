"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import type {
  ExpressionSpecification,
  FilterSpecification,
  GeoJSONSource,
  Map as MapLibreMap,
  MapGeoJSONFeature,
  Marker as MapLibreMarker,
  MapMouseEvent,
  Popup as MapLibrePopup,
  StyleSpecification,
} from "maplibre-gl";
import type { MapAircraft, MapLngLat, MapRoute } from "@/lib/map/skyLedgerMapAdapter";

const ESRI_WORLD_IMAGERY_TILE_URL =
  "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}";

const SATELLITE_LAYER_ID = "satellite";
const ROUTES_SOURCE_ID = "skyledger-maplibre-routes";
const ROUTES_GLOW_LAYER_ID = "skyledger-maplibre-routes-glow";
const ROUTES_LAYER_ID = "skyledger-maplibre-routes-line";
const ROUTES_HOVER_GLOW_LAYER_ID = "skyledger-maplibre-routes-hover-glow";
const ROUTES_HOVER_LAYER_ID = "skyledger-maplibre-routes-hover-line";
const COMPLETED_ROUTES_SOURCE_ID = "skyledger-maplibre-completed-routes";
const COMPLETED_ROUTES_GLOW_LAYER_ID = "skyledger-maplibre-completed-routes-glow";
const COMPLETED_ROUTES_LAYER_ID = "skyledger-maplibre-completed-routes-line";
const COMPLETED_ROUTES_HOVER_GLOW_LAYER_ID = "skyledger-maplibre-completed-routes-hover-glow";
const COMPLETED_ROUTES_HOVER_LAYER_ID = "skyledger-maplibre-completed-routes-hover-line";
const NO_HOVER_SHIPMENT_KEY = "__skyledger-no-hover-shipment__";
const ROUTE_CURVE_STEPS = 44;
const ROUTE_DASH_SEQUENCE: number[][] = [
  [2.4, 2.2],
  [1.8, 2.8],
  [1.2, 3.4],
  [2.8, 1.8],
];
const HOVER_QUERY_LAYER_IDS = [
  ROUTES_GLOW_LAYER_ID,
  ROUTES_LAYER_ID,
  ROUTES_HOVER_GLOW_LAYER_ID,
  ROUTES_HOVER_LAYER_ID,
  COMPLETED_ROUTES_GLOW_LAYER_ID,
  COMPLETED_ROUTES_LAYER_ID,
  COMPLETED_ROUTES_HOVER_GLOW_LAYER_ID,
  COMPLETED_ROUTES_HOVER_LAYER_ID,
];

type SkyLedgerMapLibreProps = {
  aircraft?: MapAircraft[];
  className?: string;
  enableAnimation?: boolean;
  enableGlobe?: boolean;
  height?: number | string;
  maxItems?: number;
  routes?: MapRoute[];
};

type MapViewMode = "routes-only" | "satellite" | "status-focus";

type ProjectionCapableMap = MapLibreMap & {
  setProjection?: (projection: { type: "globe" } | "globe" | { type: "mercator" } | "mercator") => void;
};

type MarkerRegistration = {
  marker: MapLibreMarker;
  element: HTMLButtonElement;
  onClick: (event: MouseEvent) => void;
  onFocus: () => void;
  onBlur: () => void;
  onMouseEnter: () => void;
  onMouseLeave: () => void;
  rotator: HTMLSpanElement | null;
  shipmentKey: string;
};

type RouteProperties = {
  id: string;
  code: string;
  progress: number;
  shipmentKey: string;
  status: string;
  statusKey: ShipmentStatusKey;
  trailColor: string;
  trailGlowColor: string;
  trailGlowOpacity: number;
  trailOpacity: number;
};

type ShipmentStatusKey =
  | "customs"
  | "delayed"
  | "delivered"
  | "in-transit"
  | "pending"
  | "unknown";

type ShipmentStatusStyle = {
  key: ShipmentStatusKey;
  label: string;
  markerAccent: string;
  markerFill: string;
  markerGlow: string;
  markerRing: string;
  trailColor: string;
  trailGlowColor: string;
  trailGlowOpacity: number;
  trailOpacity: number;
};

type MapViewModeItem = {
  label: string;
  mode: MapViewMode;
};

type MapViewModeLayerStyle = {
  completedGlowOpacityMultiplier: number;
  completedGlowWidth: number;
  completedLineOpacityMultiplier: number;
  completedLineWidth: number;
  routeGlowOpacity: number;
  routeGlowWidth: number;
  routeLineOpacity: number;
  routeLineWidth: number;
  satelliteOpacity: number;
};

const STATUS_STYLES: Record<ShipmentStatusKey, ShipmentStatusStyle> = {
  delivered: {
    key: "delivered",
    label: "Delivered",
    markerAccent: "#86efac",
    markerFill: "rgba(22, 101, 52, 0.38)",
    markerGlow: "rgba(134, 239, 172, 0.72)",
    markerRing: "rgba(187, 247, 208, 0.94)",
    trailColor: "#bbf7d0",
    trailGlowColor: "#22c55e",
    trailGlowOpacity: 0.34,
    trailOpacity: 0.9,
  },
  "in-transit": {
    key: "in-transit",
    label: "In Transit",
    markerAccent: "#22d3ee",
    markerFill: "rgba(8, 145, 178, 0.34)",
    markerGlow: "rgba(34, 211, 238, 0.8)",
    markerRing: "rgba(165, 243, 252, 0.96)",
    trailColor: "#f8fafc",
    trailGlowColor: "#22d3ee",
    trailGlowOpacity: 0.38,
    trailOpacity: 0.94,
  },
  pending: {
    key: "pending",
    label: "Pending",
    markerAccent: "#cbd5e1",
    markerFill: "rgba(71, 85, 105, 0.36)",
    markerGlow: "rgba(203, 213, 225, 0.45)",
    markerRing: "rgba(226, 232, 240, 0.76)",
    trailColor: "#cbd5e1",
    trailGlowColor: "#94a3b8",
    trailGlowOpacity: 0.22,
    trailOpacity: 0.62,
  },
  customs: {
    key: "customs",
    label: "Customs",
    markerAccent: "#c4b5fd",
    markerFill: "rgba(109, 40, 217, 0.34)",
    markerGlow: "rgba(196, 181, 253, 0.72)",
    markerRing: "rgba(221, 214, 254, 0.92)",
    trailColor: "#ddd6fe",
    trailGlowColor: "#8b5cf6",
    trailGlowOpacity: 0.32,
    trailOpacity: 0.84,
  },
  delayed: {
    key: "delayed",
    label: "Delayed",
    markerAccent: "#fbbf24",
    markerFill: "rgba(180, 83, 9, 0.4)",
    markerGlow: "rgba(251, 191, 36, 0.78)",
    markerRing: "rgba(254, 240, 138, 0.94)",
    trailColor: "#fde68a",
    trailGlowColor: "#f59e0b",
    trailGlowOpacity: 0.36,
    trailOpacity: 0.88,
  },
  unknown: {
    key: "unknown",
    label: "Other",
    markerAccent: "#67e8f9",
    markerFill: "rgba(3, 7, 18, 0.42)",
    markerGlow: "rgba(34, 211, 238, 0.62)",
    markerRing: "rgba(207, 250, 254, 0.82)",
    trailColor: "#e2e8f0",
    trailGlowColor: "#22d3ee",
    trailGlowOpacity: 0.28,
    trailOpacity: 0.78,
  },
};

const STATUS_LEGEND_ITEMS: ShipmentStatusKey[] = [
  "delivered",
  "in-transit",
  "pending",
  "customs",
  "delayed",
  "unknown",
];

const MAP_VIEW_MODE_ITEMS: MapViewModeItem[] = [
  { label: "Satellite", mode: "satellite" },
  { label: "Routes only", mode: "routes-only" },
  { label: "Status focus", mode: "status-focus" },
];

const MAP_VIEW_MODE_LAYER_STYLES: Record<MapViewMode, MapViewModeLayerStyle> = {
  satellite: {
    completedGlowOpacityMultiplier: 1,
    completedGlowWidth: 13,
    completedLineOpacityMultiplier: 1,
    completedLineWidth: 4.8,
    routeGlowOpacity: 0.34,
    routeGlowWidth: 15,
    routeLineOpacity: 0.96,
    routeLineWidth: 7,
    satelliteOpacity: 1,
  },
  "routes-only": {
    completedGlowOpacityMultiplier: 1.08,
    completedGlowWidth: 14,
    completedLineOpacityMultiplier: 1.04,
    completedLineWidth: 5.2,
    routeGlowOpacity: 0.44,
    routeGlowWidth: 16,
    routeLineOpacity: 0.98,
    routeLineWidth: 7.4,
    satelliteOpacity: 0.38,
  },
  "status-focus": {
    completedGlowOpacityMultiplier: 1.2,
    completedGlowWidth: 17,
    completedLineOpacityMultiplier: 1.12,
    completedLineWidth: 6.2,
    routeGlowOpacity: 0.12,
    routeGlowWidth: 10,
    routeLineOpacity: 0.26,
    routeLineWidth: 4.4,
    satelliteOpacity: 0.78,
  },
};

const SANDBOX_AIRCRAFT: MapAircraft[] = [
  {
    id: "skyl-maplibre-001",
    code: "SKY217",
    aircraftLabel: "Boeing 737-800",
    flightLabel: "SkyLedger Air",
    originName: "CGK",
    destinationName: "SIN",
    originCoords: { lat: -6.1256, lng: 106.6559 },
    destinationCoords: { lat: 1.3644, lng: 103.9915 },
    position: { lat: -3.28, lng: 105.62 },
    heading: 326,
    status: "In Transit",
    progress: 42,
  },
  {
    id: "skyl-maplibre-002",
    code: "GIA412",
    aircraftLabel: "Airbus A330-300",
    flightLabel: "Garuda Indonesia",
    originName: "DPS",
    destinationName: "NRT",
    originCoords: { lat: -8.7482, lng: 115.167 },
    destinationCoords: { lat: 35.7719, lng: 140.3929 },
    position: { lat: 9.62, lng: 125.72 },
    heading: 24,
    status: "Customs",
    progress: 54,
  },
  {
    id: "skyl-maplibre-003",
    code: "CTV801",
    aircraftLabel: "ATR 72-600",
    flightLabel: "Citilink Cargo",
    originName: "SUB",
    destinationName: "UPG",
    originCoords: { lat: -7.3798, lng: 112.7869 },
    destinationCoords: { lat: -5.0616, lng: 119.554 },
    position: { lat: -6.18, lng: 116.92 },
    heading: 78,
    status: "Pending",
    progress: 18,
  },
  {
    id: "skyl-maplibre-004",
    code: "SCO774",
    aircraftLabel: "Boeing 767-300F",
    flightLabel: "SkyLedger Cargo",
    originName: "SIN",
    destinationName: "HKG",
    originCoords: { lat: 1.3644, lng: 103.9915 },
    destinationCoords: { lat: 22.308, lng: 113.9185 },
    position: { lat: 9.82, lng: 109.72 },
    heading: 36,
    status: "Delayed",
    progress: 40,
  },
  {
    id: "skyl-maplibre-005",
    code: "CPA638",
    aircraftLabel: "Airbus A350-900",
    flightLabel: "Cathay Pacific Cargo",
    originName: "HKG",
    destinationName: "ICN",
    originCoords: { lat: 22.308, lng: 113.9185 },
    destinationCoords: { lat: 37.4602, lng: 126.4407 },
    position: { lat: 37.4602, lng: 126.4407 },
    heading: 31,
    status: "Delivered",
    progress: 100,
  },
];

function createSatelliteStyle(): StyleSpecification {
  return {
    version: 8,
    sources: {
      satellite: {
        type: "raster",
        tiles: [ESRI_WORLD_IMAGERY_TILE_URL],
        tileSize: 256,
        maxzoom: 18,
        attribution: "Esri World Imagery",
      },
    },
    layers: [
      {
        id: SATELLITE_LAYER_ID,
        type: "raster",
        source: "satellite",
      },
    ],
  };
}

function createCompletedRouteOpacityExpression(
  propertyName: "trailGlowOpacity" | "trailOpacity",
  fallbackOpacity: number,
  multiplier: number
): ExpressionSpecification {
  return [
    "*",
    ["coalesce", ["get", propertyName], fallbackOpacity],
    multiplier,
  ];
}

function createShipmentKeyFilter(shipmentKey: string | null): FilterSpecification {
  return ["==", ["get", "shipmentKey"], shipmentKey ?? NO_HOVER_SHIPMENT_KEY];
}

function isUsableShipmentKey(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function getAircraftShipmentKey(aircraft: MapAircraft) {
  return String(aircraft.code || aircraft.shipmentId || aircraft.id).trim();
}

function getRouteShipmentKey(route: MapRoute) {
  return String(route.code || route.id).trim();
}

function getShipmentKeyFromFeature(feature: GeoJSON.Feature | MapGeoJSONFeature) {
  const properties = feature.properties;
  if (!properties) return null;

  const shipmentKey = properties.shipmentKey ?? properties.code ?? properties.id;
  if (!isUsableShipmentKey(shipmentKey)) return null;

  return shipmentKey.trim();
}

function setLayerFilterIfPresent(
  map: MapLibreMap,
  layerId: string,
  filter: FilterSpecification
) {
  if (!map.getLayer(layerId)) return;

  try {
    map.setFilter(layerId, filter);
  } catch {
    // Ignore transient style updates while MapLibre is changing style state.
  }
}

function applyMapViewModeToMap(map: MapLibreMap, mode: MapViewMode) {
  const viewModeStyle = MAP_VIEW_MODE_LAYER_STYLES[mode];

  if (map.getLayer(SATELLITE_LAYER_ID)) {
    map.setPaintProperty(SATELLITE_LAYER_ID, "raster-opacity", viewModeStyle.satelliteOpacity);
  }

  if (map.getLayer(ROUTES_GLOW_LAYER_ID)) {
    map.setPaintProperty(ROUTES_GLOW_LAYER_ID, "line-opacity", viewModeStyle.routeGlowOpacity);
    map.setPaintProperty(ROUTES_GLOW_LAYER_ID, "line-width", viewModeStyle.routeGlowWidth);
  }

  if (map.getLayer(ROUTES_LAYER_ID)) {
    map.setPaintProperty(ROUTES_LAYER_ID, "line-opacity", viewModeStyle.routeLineOpacity);
    map.setPaintProperty(ROUTES_LAYER_ID, "line-width", viewModeStyle.routeLineWidth);
  }

  if (map.getLayer(ROUTES_HOVER_GLOW_LAYER_ID)) {
    map.setPaintProperty(
      ROUTES_HOVER_GLOW_LAYER_ID,
      "line-opacity",
      mode === "status-focus" ? 0.36 : 0.62
    );
    map.setPaintProperty(
      ROUTES_HOVER_GLOW_LAYER_ID,
      "line-width",
      mode === "status-focus" ? 18 : 20
    );
  }

  if (map.getLayer(ROUTES_HOVER_LAYER_ID)) {
    map.setPaintProperty(
      ROUTES_HOVER_LAYER_ID,
      "line-opacity",
      mode === "status-focus" ? 0.74 : 0.96
    );
    map.setPaintProperty(
      ROUTES_HOVER_LAYER_ID,
      "line-width",
      mode === "status-focus" ? 6.8 : 8.6
    );
  }

  if (map.getLayer(COMPLETED_ROUTES_GLOW_LAYER_ID)) {
    map.setPaintProperty(
      COMPLETED_ROUTES_GLOW_LAYER_ID,
      "line-opacity",
      createCompletedRouteOpacityExpression(
        "trailGlowOpacity",
        STATUS_STYLES["in-transit"].trailGlowOpacity,
        viewModeStyle.completedGlowOpacityMultiplier
      )
    );
    map.setPaintProperty(
      COMPLETED_ROUTES_GLOW_LAYER_ID,
      "line-width",
      viewModeStyle.completedGlowWidth
    );
  }

  if (map.getLayer(COMPLETED_ROUTES_LAYER_ID)) {
    map.setPaintProperty(
      COMPLETED_ROUTES_LAYER_ID,
      "line-opacity",
      createCompletedRouteOpacityExpression(
        "trailOpacity",
        STATUS_STYLES["in-transit"].trailOpacity,
        viewModeStyle.completedLineOpacityMultiplier
      )
    );
    map.setPaintProperty(
      COMPLETED_ROUTES_LAYER_ID,
      "line-width",
      viewModeStyle.completedLineWidth
    );
  }

  if (map.getLayer(COMPLETED_ROUTES_HOVER_GLOW_LAYER_ID)) {
    map.setPaintProperty(
      COMPLETED_ROUTES_HOVER_GLOW_LAYER_ID,
      "line-opacity",
      createCompletedRouteOpacityExpression(
        "trailGlowOpacity",
        STATUS_STYLES["in-transit"].trailGlowOpacity,
        mode === "status-focus" ? 1.8 : 1.55
      )
    );
    map.setPaintProperty(
      COMPLETED_ROUTES_HOVER_GLOW_LAYER_ID,
      "line-width",
      mode === "status-focus" ? 23 : 21
    );
  }

  if (map.getLayer(COMPLETED_ROUTES_HOVER_LAYER_ID)) {
    map.setPaintProperty(
      COMPLETED_ROUTES_HOVER_LAYER_ID,
      "line-opacity",
      createCompletedRouteOpacityExpression(
        "trailOpacity",
        STATUS_STYLES["in-transit"].trailOpacity,
        mode === "status-focus" ? 1.16 : 1.08
      )
    );
    map.setPaintProperty(
      COMPLETED_ROUTES_HOVER_LAYER_ID,
      "line-width",
      mode === "status-focus" ? 9.2 : 8.2
    );
  }
}

function applyMapViewModeToMarkers(registrations: MarkerRegistration[], mode: MapViewMode) {
  registrations.forEach((registration) => {
    if (mode === "routes-only") {
      registration.element.style.opacity = "0.72";
      return;
    }

    registration.element.style.opacity = "1";
  });
}

function applyMapViewModeToMarkerElements(root: HTMLElement | null, mode: MapViewMode) {
  root
    ?.querySelectorAll<HTMLElement>(".skyledger-maplibre-aircraft-marker")
    .forEach((element) => {
      element.style.opacity = mode === "routes-only" ? "0.72" : "1";
    });
}

function isValidLngLatPosition(coordinate: GeoJSON.Position) {
  const lng = Number(coordinate[0]);
  const lat = Number(coordinate[1]);

  return (
    Number.isFinite(lng) &&
    Number.isFinite(lat) &&
    lng >= -180 &&
    lng <= 180 &&
    lat >= -90 &&
    lat <= 90
  );
}

function getValidRouteBoundsCoordinates(
  routeFeatureCollection: GeoJSON.FeatureCollection<GeoJSON.LineString, RouteProperties>
) {
  return routeFeatureCollection.features
    .slice(0, 5)
    .flatMap((feature) => feature.geometry.coordinates)
    .filter(isValidLngLatPosition)
    .map((coordinate): MapLngLat => [Number(coordinate[0]), Number(coordinate[1])]);
}

function hasFittableRouteBounds(
  routeFeatureCollection: GeoJSON.FeatureCollection<GeoJSON.LineString, RouteProperties>
) {
  return getValidRouteBoundsCoordinates(routeFeatureCollection).length >= 2;
}

function fitMapToActiveRoutes(
  map: MapLibreMap,
  routeFeatureCollection: GeoJSON.FeatureCollection<GeoJSON.LineString, RouteProperties>
) {
  const coordinates = getValidRouteBoundsCoordinates(routeFeatureCollection);
  if (coordinates.length < 2) return false;

  const bounds = new maplibregl.LngLatBounds(coordinates[0], coordinates[0]);
  coordinates.slice(1).forEach((coordinate) => bounds.extend(coordinate));

  map.fitBounds(bounds, {
    duration: 900,
    essential: true,
    maxZoom: 6.2,
    padding: {
      bottom: 116,
      left: 80,
      right: 80,
      top: 88,
    },
  });

  return true;
}

function normalizeLongitude(lng: number) {
  if (lng > 180) return lng - 360;
  if (lng < -180) return lng + 360;
  return lng;
}

function clampValue(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function getShipmentStatusStyle(status: string): ShipmentStatusStyle {
  const normalizedStatus = status.toLowerCase();

  if (
    normalizedStatus.includes("delayed") ||
    normalizedStatus.includes("exception") ||
    normalizedStatus.includes("hold") ||
    normalizedStatus.includes("late")
  ) {
    return STATUS_STYLES.delayed;
  }

  if (
    normalizedStatus.includes("delivered") ||
    normalizedStatus.includes("complete") ||
    normalizedStatus.includes("arrived")
  ) {
    return STATUS_STYLES.delivered;
  }

  if (
    normalizedStatus.includes("custom") ||
    normalizedStatus.includes("clearance") ||
    normalizedStatus.includes("inspection")
  ) {
    return STATUS_STYLES.customs;
  }

  if (
    normalizedStatus.includes("pending") ||
    normalizedStatus.includes("processing") ||
    normalizedStatus.includes("standby") ||
    normalizedStatus.includes("awaiting")
  ) {
    return STATUS_STYLES.pending;
  }

  if (
    normalizedStatus.includes("transit") ||
    normalizedStatus.includes("route") ||
    normalizedStatus.includes("cruising") ||
    normalizedStatus.includes("climbing") ||
    normalizedStatus.includes("descending") ||
    normalizedStatus.includes("flight") ||
    normalizedStatus.includes("active")
  ) {
    return STATUS_STYLES["in-transit"];
  }

  return STATUS_STYLES.unknown;
}

function getRouteHeading(start: GeoJSON.Position, end: GeoJSON.Position) {
  const lngDelta = Number(end[0]) - Number(start[0]);
  const latDelta = Number(end[1]) - Number(start[1]);

  if (!Number.isFinite(lngDelta) || !Number.isFinite(latDelta)) return 0;

  return (((Math.atan2(lngDelta, latDelta) * 180) / Math.PI) + 360) % 360;
}

function sampleRouteAtProgress(
  coordinates: GeoJSON.Position[],
  progress: number
): { coordinate: MapLngLat; heading: number } | null {
  if (coordinates.length === 0) return null;

  if (coordinates.length === 1) {
    const coordinate = coordinates[0];
    return {
      coordinate: [Number(coordinate[0]), Number(coordinate[1])],
      heading: 0,
    };
  }

  const segmentDistances = coordinates.slice(1).map((coordinate, index) => {
    const previousCoordinate = coordinates[index];
    return Math.hypot(
      Number(coordinate[0]) - Number(previousCoordinate[0]),
      Number(coordinate[1]) - Number(previousCoordinate[1])
    );
  });
  const totalDistance = segmentDistances.reduce((sum, distance) => sum + distance, 0);

  if (totalDistance <= 0) {
    const coordinate = coordinates[0];
    return {
      coordinate: [Number(coordinate[0]), Number(coordinate[1])],
      heading: getRouteHeading(coordinates[0], coordinates[1]),
    };
  }

  const targetDistance = totalDistance * (clampValue(progress, 0, 100) / 100);
  let traversedDistance = 0;

  for (let index = 0; index < segmentDistances.length; index += 1) {
    const segmentDistance = segmentDistances[index];
    const nextTraversedDistance = traversedDistance + segmentDistance;

    if (targetDistance <= nextTraversedDistance || index === segmentDistances.length - 1) {
      const start = coordinates[index];
      const end = coordinates[index + 1];
      const segmentProgress =
        segmentDistance > 0
          ? clampValue((targetDistance - traversedDistance) / segmentDistance, 0, 1)
          : 0;

      return {
        coordinate: [
          Number(start[0]) + (Number(end[0]) - Number(start[0])) * segmentProgress,
          Number(start[1]) + (Number(end[1]) - Number(start[1])) * segmentProgress,
        ],
        heading: getRouteHeading(start, end),
      };
    }

    traversedDistance = nextTraversedDistance;
  }

  const finalCoordinate = coordinates.at(-1);
  const previousCoordinate = coordinates.at(-2);
  if (!finalCoordinate || !previousCoordinate) return null;

  return {
    coordinate: [Number(finalCoordinate[0]), Number(finalCoordinate[1])],
    heading: getRouteHeading(previousCoordinate, finalCoordinate),
  };
}

function createCompletedRouteCoordinates(
  coordinates: GeoJSON.Position[],
  progress: number
): MapLngLat[] {
  if (coordinates.length < 2) return [];

  const completedProgress = clampValue(progress, 0, 100);
  if (completedProgress <= 0) return [];

  const completedCoordinates: MapLngLat[] = [[Number(coordinates[0][0]), Number(coordinates[0][1])]];
  const segmentDistances = coordinates.slice(1).map((coordinate, index) => {
    const previousCoordinate = coordinates[index];
    return Math.hypot(
      Number(coordinate[0]) - Number(previousCoordinate[0]),
      Number(coordinate[1]) - Number(previousCoordinate[1])
    );
  });
  const totalDistance = segmentDistances.reduce((sum, distance) => sum + distance, 0);

  if (totalDistance <= 0) return [];

  const targetDistance = totalDistance * (completedProgress / 100);
  let traversedDistance = 0;

  for (let index = 0; index < segmentDistances.length; index += 1) {
    const segmentDistance = segmentDistances[index];
    const nextTraversedDistance = traversedDistance + segmentDistance;
    const start = coordinates[index];
    const end = coordinates[index + 1];

    if (targetDistance >= nextTraversedDistance) {
      completedCoordinates.push([Number(end[0]), Number(end[1])]);
      traversedDistance = nextTraversedDistance;
      continue;
    }

    const segmentProgress =
      segmentDistance > 0
        ? clampValue((targetDistance - traversedDistance) / segmentDistance, 0, 1)
        : 0;

    completedCoordinates.push([
      Number(start[0]) + (Number(end[0]) - Number(start[0])) * segmentProgress,
      Number(start[1]) + (Number(end[1]) - Number(start[1])) * segmentProgress,
    ]);
    break;
  }

  return completedCoordinates.filter(
    (coordinate) => Number.isFinite(coordinate[0]) && Number.isFinite(coordinate[1])
  );
}

function getAnimatedAircraftProgress(aircraft: MapAircraft, timestamp: number, index: number) {
  const baseProgress = clampValue(aircraft.progress ?? 50, 0, 100);

  if (baseProgress <= 0 || baseProgress >= 100) return baseProgress;

  const pulseOffset = Math.sin(timestamp / 1800 + index * 0.85) * 3.2;
  const crawlOffset = ((timestamp / 9000 + index * 0.19) % 1) * 1.3;
  return clampValue(
    baseProgress + pulseOffset + crawlOffset,
    Math.max(0, baseProgress - 4.5),
    Math.min(100, baseProgress + 4.5)
  );
}

function createCurvedRoute(
  start: [number, number],
  end: [number, number],
  steps = ROUTE_CURVE_STEPS
): [number, number][] {
  const [startLng, startLat] = start;
  let endLng = end[0];
  const endLat = end[1];
  const lngDelta = endLng - startLng;

  if (Math.abs(lngDelta) > 180) {
    endLng += lngDelta > 0 ? -360 : 360;
  }

  const midLng = (startLng + endLng) / 2;
  const midLat = (startLat + endLat) / 2;
  const distance = Math.hypot(endLng - startLng, endLat - startLat);
  const curveStrength = Math.min(Math.max(distance * 0.16, 1.2), 13);
  const coordinates: [number, number][] = [];

  for (let index = 0; index <= steps; index += 1) {
    const t = index / steps;
    const inverseT = 1 - t;
    const lng =
      inverseT * inverseT * startLng +
      2 * inverseT * t * midLng +
      t * t * endLng;
    const lat =
      inverseT * inverseT * startLat +
      2 * inverseT * t * (midLat + curveStrength) +
      t * t * endLat;

    coordinates.push([normalizeLongitude(lng), lat]);
  }

  return coordinates;
}

function createRoutesFromAircraft(aircraftItems: MapAircraft[]): MapRoute[] {
  return aircraftItems.map((aircraft) => ({
    id: `${aircraft.id}-route`,
    code: aircraft.code,
    originName: aircraft.originName,
    destinationName: aircraft.destinationName,
    originCoords: aircraft.originCoords,
    destinationCoords: aircraft.destinationCoords,
    coordinates: [
      [aircraft.originCoords.lng, aircraft.originCoords.lat],
      [aircraft.destinationCoords.lng, aircraft.destinationCoords.lat],
    ],
    status: aircraft.status,
    progress: aircraft.progress,
  }));
}

function resolveRouteCoordinates(route: MapRoute): MapLngLat[] {
  if (route.coordinates.length > 2) {
    return route.coordinates;
  }

  return createCurvedRoute(
    [route.originCoords.lng, route.originCoords.lat],
    [route.destinationCoords.lng, route.destinationCoords.lat]
  );
}

function createRouteFeatureCollection(
  routes: MapRoute[]
): GeoJSON.FeatureCollection<GeoJSON.LineString, RouteProperties> {
  return {
    type: "FeatureCollection",
    features: routes.map((route) => {
      const statusStyle = getShipmentStatusStyle(route.status);

      return {
        type: "Feature",
        properties: {
          id: route.id,
          code: route.code,
          progress: clampValue(route.progress ?? 0, 0, 100),
          shipmentKey: getRouteShipmentKey(route),
          status: route.status,
          statusKey: statusStyle.key,
          trailColor: statusStyle.trailColor,
          trailGlowColor: statusStyle.trailGlowColor,
          trailGlowOpacity: statusStyle.trailGlowOpacity,
          trailOpacity: statusStyle.trailOpacity,
        },
        geometry: {
          type: "LineString",
          coordinates: resolveRouteCoordinates(route),
        },
      };
    }),
  };
}

function createCompletedRouteFeatureCollection(
  routeFeatureCollection: GeoJSON.FeatureCollection<GeoJSON.LineString, RouteProperties>
): GeoJSON.FeatureCollection<GeoJSON.LineString, RouteProperties> {
  const features: GeoJSON.Feature<GeoJSON.LineString, RouteProperties>[] = [];

  routeFeatureCollection.features.forEach((feature) => {
    const completedCoordinates = createCompletedRouteCoordinates(
      feature.geometry.coordinates,
      feature.properties.progress
    );

    if (completedCoordinates.length < 2) return;

    features.push({
      type: "Feature",
      properties: feature.properties,
      geometry: {
        type: "LineString",
        coordinates: completedCoordinates,
      },
    });
  });

  return {
    type: "FeatureCollection",
    features,
  };
}

function escapeHtml(value: string | number) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function createAircraftPopupHtml(aircraft: MapAircraft) {
  const progress =
    typeof aircraft.progress === "number"
      ? `<div><dt>Progress</dt><dd>${escapeHtml(Math.round(aircraft.progress))}%</dd></div>`
      : "";

  return `
    <div class="skyledger-maplibre-popup-card">
      <div class="skyledger-maplibre-popup-kicker">Shipment flight</div>
      <div class="skyledger-maplibre-popup-title">${escapeHtml(aircraft.code)}</div>
      <dl class="skyledger-maplibre-popup-list">
        <div><dt>Shipment</dt><dd>${escapeHtml(aircraft.shipmentId ?? aircraft.code)}</dd></div>
        <div><dt>Origin</dt><dd>${escapeHtml(aircraft.originName)}</dd></div>
        <div><dt>Destination</dt><dd>${escapeHtml(aircraft.destinationName)}</dd></div>
        <div><dt>Status</dt><dd>${escapeHtml(aircraft.status)}</dd></div>
        ${progress}
      </dl>
    </div>
  `;
}

function createAircraftMarkerElement(aircraft: MapAircraft) {
  const statusStyle = getShipmentStatusStyle(aircraft.status);
  const shipmentKey = getAircraftShipmentKey(aircraft);
  const markerElement = document.createElement("button");
  markerElement.type = "button";
  markerElement.className = "skyledger-maplibre-aircraft-marker";
  markerElement.dataset.shipmentKey = shipmentKey;
  markerElement.dataset.shipmentStatus = statusStyle.key;
  markerElement.style.setProperty("--skyledger-aircraft-accent", statusStyle.markerAccent);
  markerElement.style.setProperty("--skyledger-aircraft-fill", statusStyle.markerFill);
  markerElement.style.setProperty("--skyledger-aircraft-glow", statusStyle.markerGlow);
  markerElement.style.setProperty("--skyledger-aircraft-ring", statusStyle.markerRing);
  markerElement.setAttribute(
    "aria-label",
    `${aircraft.code}, ${statusStyle.label}, ${aircraft.originName} to ${aircraft.destinationName}`
  );
  markerElement.innerHTML = `
    <span class="skyledger-maplibre-aircraft-rotator" style="transform: rotate(${aircraft.heading}deg);">
      <svg viewBox="0 0 48 48" aria-hidden="true" focusable="false">
        <circle cx="24" cy="24" r="18" fill="var(--skyledger-aircraft-fill)" stroke="var(--skyledger-aircraft-ring)" stroke-width="1.5" />
        <path
          d="M24 7.5c1.1 0 2 .8 2.2 1.9l2.2 11.2 10.1 5.2c.7.4 1.1 1.1 1 1.9l-.2 2.1-11.1-2.5-1.7 8.1 3.5 2.9-.2 1.8-5.8-1.7-5.8 1.7-.2-1.8 3.5-2.9-1.7-8.1-11.1 2.5-.2-2.1c-.1-.8.3-1.5 1-1.9l10.1-5.2 2.2-11.2c.2-1.1 1.1-1.9 2.2-1.9Z"
              fill="#ffffff"
              stroke="var(--skyledger-aircraft-accent)"
              stroke-width="1.25"
              stroke-linejoin="round"
            />
      </svg>
    </span>
  `;
  return markerElement;
}

function enableGlobeProjection(map: MapLibreMap) {
  const projectionMap = map as ProjectionCapableMap;

  if (typeof projectionMap.setProjection !== "function") return;

  try {
    projectionMap.setProjection({ type: "globe" });
  } catch {
    try {
      projectionMap.setProjection("globe");
    } catch {
      try {
        projectionMap.setProjection({ type: "mercator" });
      } catch {
        // Fallback remains MapLibre's default projection.
      }
    }
  }
}

function addRouteLayer(
  map: MapLibreMap,
  routeFeatureCollection: GeoJSON.FeatureCollection<GeoJSON.LineString, RouteProperties>
) {
  if (!map.getSource(ROUTES_SOURCE_ID)) {
    map.addSource(ROUTES_SOURCE_ID, {
      type: "geojson",
      data: routeFeatureCollection,
    });
  }

  if (!map.getLayer(ROUTES_GLOW_LAYER_ID)) {
    map.addLayer({
      id: ROUTES_GLOW_LAYER_ID,
      type: "line",
      source: ROUTES_SOURCE_ID,
      layout: {
        "line-cap": "round",
        "line-join": "round",
      },
      paint: {
        "line-color": "#22d3ee",
        "line-width": 15,
        "line-opacity": 0.34,
        "line-blur": 1.6,
      },
    });
  }

  if (!map.getLayer(ROUTES_LAYER_ID)) {
    map.addLayer({
      id: ROUTES_LAYER_ID,
      type: "line",
      source: ROUTES_SOURCE_ID,
      layout: {
        "line-cap": "round",
        "line-join": "round",
      },
      paint: {
        "line-color": "#22d3ee",
        "line-width": 7,
        "line-opacity": 0.96,
        "line-blur": 0.05,
      },
    });
  }

  if (!map.getLayer(ROUTES_HOVER_GLOW_LAYER_ID)) {
    map.addLayer({
      id: ROUTES_HOVER_GLOW_LAYER_ID,
      type: "line",
      source: ROUTES_SOURCE_ID,
      filter: createShipmentKeyFilter(null),
      layout: {
        "line-cap": "round",
        "line-join": "round",
      },
      paint: {
        "line-color": "#22d3ee",
        "line-width": 20,
        "line-opacity": 0.62,
        "line-blur": 2.1,
      },
    });
  }

  if (!map.getLayer(ROUTES_HOVER_LAYER_ID)) {
    map.addLayer({
      id: ROUTES_HOVER_LAYER_ID,
      type: "line",
      source: ROUTES_SOURCE_ID,
      filter: createShipmentKeyFilter(null),
      layout: {
        "line-cap": "round",
        "line-join": "round",
      },
      paint: {
        "line-color": "#cffafe",
        "line-width": 8.6,
        "line-opacity": 0.96,
        "line-blur": 0,
      },
    });
  }
}

function addCompletedRouteLayer(
  map: MapLibreMap,
  completedRouteFeatureCollection: GeoJSON.FeatureCollection<GeoJSON.LineString, RouteProperties>
) {
  if (!map.getSource(COMPLETED_ROUTES_SOURCE_ID)) {
    map.addSource(COMPLETED_ROUTES_SOURCE_ID, {
      type: "geojson",
      data: completedRouteFeatureCollection,
    });
  }

  if (!map.getLayer(COMPLETED_ROUTES_GLOW_LAYER_ID)) {
    map.addLayer({
      id: COMPLETED_ROUTES_GLOW_LAYER_ID,
      type: "line",
      source: COMPLETED_ROUTES_SOURCE_ID,
      layout: {
        "line-cap": "round",
        "line-join": "round",
      },
      paint: {
        "line-color": [
          "coalesce",
          ["get", "trailGlowColor"],
          STATUS_STYLES["in-transit"].trailGlowColor,
        ],
        "line-width": 13,
        "line-opacity": [
          "coalesce",
          ["get", "trailGlowOpacity"],
          STATUS_STYLES["in-transit"].trailGlowOpacity,
        ],
        "line-blur": 1.3,
      },
    });
  }

  if (!map.getLayer(COMPLETED_ROUTES_LAYER_ID)) {
    map.addLayer({
      id: COMPLETED_ROUTES_LAYER_ID,
      type: "line",
      source: COMPLETED_ROUTES_SOURCE_ID,
      layout: {
        "line-cap": "round",
        "line-join": "round",
      },
      paint: {
        "line-color": [
          "coalesce",
          ["get", "trailColor"],
          STATUS_STYLES["in-transit"].trailColor,
        ],
        "line-width": 4.8,
        "line-opacity": [
          "coalesce",
          ["get", "trailOpacity"],
          STATUS_STYLES["in-transit"].trailOpacity,
        ],
        "line-blur": 0.15,
      },
    });
  }

  if (!map.getLayer(COMPLETED_ROUTES_HOVER_GLOW_LAYER_ID)) {
    map.addLayer({
      id: COMPLETED_ROUTES_HOVER_GLOW_LAYER_ID,
      type: "line",
      source: COMPLETED_ROUTES_SOURCE_ID,
      filter: createShipmentKeyFilter(null),
      layout: {
        "line-cap": "round",
        "line-join": "round",
      },
      paint: {
        "line-color": [
          "coalesce",
          ["get", "trailGlowColor"],
          STATUS_STYLES["in-transit"].trailGlowColor,
        ],
        "line-width": 21,
        "line-opacity": createCompletedRouteOpacityExpression(
          "trailGlowOpacity",
          STATUS_STYLES["in-transit"].trailGlowOpacity,
          1.55
        ),
        "line-blur": 1.9,
      },
    });
  }

  if (!map.getLayer(COMPLETED_ROUTES_HOVER_LAYER_ID)) {
    map.addLayer({
      id: COMPLETED_ROUTES_HOVER_LAYER_ID,
      type: "line",
      source: COMPLETED_ROUTES_SOURCE_ID,
      filter: createShipmentKeyFilter(null),
      layout: {
        "line-cap": "round",
        "line-join": "round",
      },
      paint: {
        "line-color": [
          "coalesce",
          ["get", "trailColor"],
          STATUS_STYLES["in-transit"].trailColor,
        ],
        "line-width": 8.2,
        "line-opacity": createCompletedRouteOpacityExpression(
          "trailOpacity",
          STATUS_STYLES["in-transit"].trailOpacity,
          1.08
        ),
        "line-blur": 0,
      },
    });
  }
}

function removeRouteLayer(map: MapLibreMap) {
  if (map.getLayer(COMPLETED_ROUTES_HOVER_LAYER_ID)) {
    map.removeLayer(COMPLETED_ROUTES_HOVER_LAYER_ID);
  }

  if (map.getLayer(COMPLETED_ROUTES_HOVER_GLOW_LAYER_ID)) {
    map.removeLayer(COMPLETED_ROUTES_HOVER_GLOW_LAYER_ID);
  }

  if (map.getLayer(COMPLETED_ROUTES_LAYER_ID)) {
    map.removeLayer(COMPLETED_ROUTES_LAYER_ID);
  }

  if (map.getLayer(COMPLETED_ROUTES_GLOW_LAYER_ID)) {
    map.removeLayer(COMPLETED_ROUTES_GLOW_LAYER_ID);
  }

  if (map.getSource(COMPLETED_ROUTES_SOURCE_ID)) {
    map.removeSource(COMPLETED_ROUTES_SOURCE_ID);
  }

  if (map.getLayer(ROUTES_HOVER_LAYER_ID)) {
    map.removeLayer(ROUTES_HOVER_LAYER_ID);
  }

  if (map.getLayer(ROUTES_HOVER_GLOW_LAYER_ID)) {
    map.removeLayer(ROUTES_HOVER_GLOW_LAYER_ID);
  }

  if (map.getLayer(ROUTES_LAYER_ID)) {
    map.removeLayer(ROUTES_LAYER_ID);
  }

  if (map.getLayer(ROUTES_GLOW_LAYER_ID)) {
    map.removeLayer(ROUTES_GLOW_LAYER_ID);
  }

  if (map.getSource(ROUTES_SOURCE_ID)) {
    map.removeSource(ROUTES_SOURCE_ID);
  }
}

export function SkyLedgerMapLibre({
  aircraft,
  className = "",
  enableAnimation = true,
  enableGlobe = false,
  height = 520,
  maxItems = 5,
  routes,
}: SkyLedgerMapLibreProps) {
  const shellRef = useRef<HTMLElement>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const routeOverlayRef = useRef<SVGSVGElement>(null);
  const mapRef = useRef<MapLibreMap | null>(null);
  const markersRef = useRef<MarkerRegistration[]>([]);
  const popupRef = useRef<MapLibrePopup | null>(null);
  const normalizedMaxItems = Math.min(Math.max(maxItems, 1), 5);
  const activeAircraft = useMemo(
    () =>
      (aircraft && aircraft.length > 0 ? aircraft : SANDBOX_AIRCRAFT).slice(
        0,
        normalizedMaxItems
      ),
    [aircraft, normalizedMaxItems]
  );
  const activeRoutes = useMemo(() => {
    const routeSource =
      routes && routes.length > 0 ? routes : createRoutesFromAircraft(activeAircraft);
    return routeSource.slice(0, normalizedMaxItems);
  }, [activeAircraft, normalizedMaxItems, routes]);
  const routeFeatureCollection = useMemo(
    () => createRouteFeatureCollection(activeRoutes),
    [activeRoutes]
  );
  const hasFitRouteBounds = useMemo(
    () => hasFittableRouteBounds(routeFeatureCollection),
    [routeFeatureCollection]
  );
  const completedRouteFeatureCollection = useMemo(
    () => createCompletedRouteFeatureCollection(routeFeatureCollection),
    [routeFeatureCollection]
  );
  const aircraftRef = useRef<MapAircraft[]>(activeAircraft);
  const routeFeatureCollectionRef = useRef(routeFeatureCollection);
  const completedRouteFeatureCollectionRef = useRef(completedRouteFeatureCollection);
  const [loadState, setLoadState] = useState<"loading" | "ready" | "error">("loading");
  const [mapViewMode, setMapViewMode] = useState<MapViewMode>("satellite");
  const mapViewModeRef = useRef<MapViewMode>(mapViewMode);
  const hoveredShipmentKeyRef = useRef<string | null>(null);

  useEffect(() => {
    aircraftRef.current = activeAircraft;
    routeFeatureCollectionRef.current = routeFeatureCollection;
    completedRouteFeatureCollectionRef.current = completedRouteFeatureCollection;
  }, [activeAircraft, completedRouteFeatureCollection, routeFeatureCollection]);

  function handleMapViewModeChange(nextMode: MapViewMode) {
    mapViewModeRef.current = nextMode;
    setMapViewMode(nextMode);

    const map = mapRef.current;
    if (map) {
      applyMapViewModeToMap(map, nextMode);
    }

    applyMapViewModeToMarkers(markersRef.current, nextMode);
    applyMapViewModeToMarkerElements(shellRef.current, nextMode);
  }

  function handleFitActiveRoutes() {
    const map = mapRef.current;
    if (!map || loadState !== "ready") return;

    fitMapToActiveRoutes(map, routeFeatureCollectionRef.current);
  }

  function setHoveredShipmentKey(nextShipmentKey: string | null, force = false) {
    const normalizedShipmentKey = nextShipmentKey?.trim() || null;
    if (!force && hoveredShipmentKeyRef.current === normalizedShipmentKey) return;

    hoveredShipmentKeyRef.current = normalizedShipmentKey;
    shellRef.current?.setAttribute(
      "data-hovered-shipment",
      normalizedShipmentKey ? "true" : "false"
    );

    const hoverFilter = createShipmentKeyFilter(normalizedShipmentKey);
    const map = mapRef.current;
    if (map) {
      [
        ROUTES_HOVER_GLOW_LAYER_ID,
        ROUTES_HOVER_LAYER_ID,
        COMPLETED_ROUTES_HOVER_GLOW_LAYER_ID,
        COMPLETED_ROUTES_HOVER_LAYER_ID,
      ].forEach((layerId) => setLayerFilterIfPresent(map, layerId, hoverFilter));
    }

    markersRef.current.forEach((registration) => {
      const isActiveMarker =
        normalizedShipmentKey !== null &&
        registration.shipmentKey === normalizedShipmentKey;

      registration.element.classList.toggle("is-highlighted", isActiveMarker);
      registration.element.classList.toggle(
        "is-dimmed",
        normalizedShipmentKey !== null && !isActiveMarker
      );
    });
  }

  useEffect(() => {
    mapViewModeRef.current = mapViewMode;
  }, [mapViewMode]);

  useEffect(() => {
    const container = mapContainerRef.current;

    if (!container || mapRef.current) return;

    let isDisposed = false;
    let resizeObserver: ResizeObserver | null = null;
    let resizeFrameId: number | null = null;
    let routeAnimationFrameId: number | null = null;
    let routeDashFrame = 0;
    let lastRouteDashUpdate = 0;

    function clearPopup() {
      popupRef.current?.remove();
      popupRef.current = null;
    }

    function clearMarkers() {
      markersRef.current.forEach((registration) => {
        registration.element.removeEventListener("click", registration.onClick);
        registration.element.removeEventListener("focus", registration.onFocus);
        registration.element.removeEventListener("blur", registration.onBlur);
        registration.element.removeEventListener("mouseenter", registration.onMouseEnter);
        registration.element.removeEventListener("mouseleave", registration.onMouseLeave);
        registration.marker.remove();
      });
      markersRef.current = [];
    }

    function scheduleResize() {
      if (!mapRef.current || isDisposed) return;

      if (resizeFrameId !== null) {
        window.cancelAnimationFrame(resizeFrameId);
      }

      resizeFrameId = window.requestAnimationFrame(() => {
        resizeFrameId = null;
        mapRef.current?.resize();
      });
    }

    function updateAnimatedAircraftPositions(timestamp: number) {
      const features = routeFeatureCollectionRef.current.features;

      markersRef.current.forEach((registration, index) => {
        const aircraft = aircraftRef.current[index];
        const feature = features[index];
        if (!aircraft || !feature) return;

        const routeSample = sampleRouteAtProgress(
          feature.geometry.coordinates,
          getAnimatedAircraftProgress(aircraft, timestamp, index)
        );
        if (!routeSample) return;

        registration.marker.setLngLat(routeSample.coordinate);
        registration.rotator?.style.setProperty(
          "transform",
          `rotate(${routeSample.heading}deg)`
        );
      });
    }

    function animateMap(timestamp: number) {
      const map = mapRef.current;

      if (!map || isDisposed) return;

      updateAnimatedAircraftPositions(timestamp);

      if (timestamp - lastRouteDashUpdate > 220 && map.getLayer(ROUTES_LAYER_ID)) {
        routeDashFrame = (routeDashFrame + 1) % ROUTE_DASH_SEQUENCE.length;
        lastRouteDashUpdate = timestamp;
        map.setPaintProperty(
          ROUTES_LAYER_ID,
          "line-dasharray",
          ROUTE_DASH_SEQUENCE[routeDashFrame]
        );
      }

      routeAnimationFrameId = window.requestAnimationFrame(animateMap);
    }

    function addAircraftMarkers(map: MapLibreMap) {
      clearMarkers();

      markersRef.current = aircraftRef.current.map((aircraft, index) => {
        const shipmentKey = getAircraftShipmentKey(aircraft);
        const routeSample = sampleRouteAtProgress(
          routeFeatureCollectionRef.current.features[index]?.geometry.coordinates ?? [],
          aircraft.progress ?? 50
        );
        const element = createAircraftMarkerElement(aircraft);
        const rotator = element.querySelector<HTMLSpanElement>(
          ".skyledger-maplibre-aircraft-rotator"
        );
        const onClick = (event: MouseEvent) => {
          event.preventDefault();
          event.stopPropagation();

          clearPopup();
          popupRef.current = new maplibregl.Popup({
            className: "skyledger-maplibre-popup",
            closeButton: true,
            closeOnClick: true,
            focusAfterOpen: false,
            offset: 24,
          })
            .setLngLat([aircraft.position.lng, aircraft.position.lat])
            .setHTML(createAircraftPopupHtml(aircraft))
            .addTo(map);
        };
        const onMouseEnter = () => {
          setHoveredShipmentKey(shipmentKey);
          element.classList.add("is-hovered");
        };
        const onMouseLeave = () => {
          setHoveredShipmentKey(null);
          element.classList.remove("is-hovered");
        };
        const onFocus = onMouseEnter;
        const onBlur = onMouseLeave;

        element.addEventListener("click", onClick);
        element.addEventListener("focus", onFocus);
        element.addEventListener("blur", onBlur);
        element.addEventListener("mouseenter", onMouseEnter);
        element.addEventListener("mouseleave", onMouseLeave);

        const marker = new maplibregl.Marker({
          element,
          anchor: "center",
          rotationAlignment: "map",
        })
          .setLngLat(routeSample?.coordinate ?? [aircraft.position.lng, aircraft.position.lat])
          .addTo(map);

        if (routeSample) {
          rotator?.style.setProperty("transform", `rotate(${routeSample.heading}deg)`);
        }

        return {
          marker,
          element,
          onClick,
          onFocus,
          onBlur,
          onMouseEnter,
          onMouseLeave,
          rotator,
          shipmentKey,
        };
      });
    }

    function updateRouteOverlay() {
      const map = mapRef.current;
      const overlay = routeOverlayRef.current;

      if (!map || !overlay || isDisposed) return;

      routeFeatureCollectionRef.current.features.forEach((feature, index) => {
        const routePath = feature.geometry.coordinates
          .map((coordinate, coordinateIndex) => {
            const point = map.project([coordinate[0], coordinate[1]] as [number, number]);
            return `${coordinateIndex === 0 ? "M" : "L"} ${point.x.toFixed(1)} ${point.y.toFixed(1)}`;
          })
          .join(" ");

        overlay
          .querySelectorAll<SVGPathElement>(`[data-route-index="${index}"]`)
          .forEach((path) => {
            path.setAttribute("d", routePath);
          });
      });
    }

    function getHoverableRouteLayers(map: MapLibreMap) {
      return HOVER_QUERY_LAYER_IDS.filter((layerId) => Boolean(map.getLayer(layerId)));
    }

    function handleMapPointerMove(event: MapMouseEvent) {
      const map = mapRef.current;
      if (!map || isDisposed) return;

      const hoverableLayers = getHoverableRouteLayers(map);
      if (hoverableLayers.length === 0) return;

      let hoveredShipmentKey: string | null = null;

      try {
        const features = map.queryRenderedFeatures(event.point, {
          layers: hoverableLayers,
        });
        hoveredShipmentKey =
          features.map((feature) => getShipmentKeyFromFeature(feature)).find(Boolean) ??
          null;
      } catch {
        hoveredShipmentKey = null;
      }

      map.getCanvas().style.cursor = hoveredShipmentKey ? "pointer" : "";
      setHoveredShipmentKey(hoveredShipmentKey);
    }

    function handleMapCanvasLeave() {
      const map = mapRef.current;
      if (map) {
        map.getCanvas().style.cursor = "";
      }

      setHoveredShipmentKey(null);
    }

    let map: MapLibreMap;

    try {
      map = new maplibregl.Map({
        container,
        style: createSatelliteStyle(),
        center: [110.5, 1.8],
        zoom: 3.2,
        minZoom: 1,
        maxZoom: 18,
        pitch: 12,
        attributionControl: false,
      });
    } catch (error) {
      console.warn("[SkyLedgerMapLibre] MapLibre could not initialize.", error);
      shellRef.current?.setAttribute("data-load-state", "error");
      setLoadState("error");
      return () => {
        isDisposed = true;
      };
    }

    mapRef.current = map;
    if (enableGlobe) {
      enableGlobeProjection(map);
    }

    const navigationControl = new maplibregl.NavigationControl({
      visualizePitch: true,
      showCompass: true,
      showZoom: true,
    });
    const attributionControl = new maplibregl.AttributionControl({
      compact: true,
      customAttribution: "Esri World Imagery",
    });

    map.addControl(navigationControl, "top-right");
    map.addControl(attributionControl, "bottom-right");

    const handleMapLoad = () => {
      if (isDisposed) return;

      addRouteLayer(map, routeFeatureCollectionRef.current);
      addCompletedRouteLayer(map, completedRouteFeatureCollectionRef.current);
      applyMapViewModeToMap(map, mapViewMode);
      addAircraftMarkers(map);
      applyMapViewModeToMarkers(markersRef.current, mapViewModeRef.current);
      applyMapViewModeToMarkerElements(shellRef.current, mapViewModeRef.current);
      updateRouteOverlay();
      if (enableAnimation && routeAnimationFrameId === null) {
        routeAnimationFrameId = window.requestAnimationFrame(animateMap);
      }
      shellRef.current?.setAttribute("data-load-state", "ready");
      setLoadState("ready");
      scheduleResize();
    };

    const handleMapError = () => {
      if (!isDisposed) {
        shellRef.current?.setAttribute("data-load-state", "error");
        setLoadState("error");
      }
    };

    map.once("load", handleMapLoad);
    map.on("error", handleMapError);
    map.on("move", updateRouteOverlay);
    map.on("zoom", updateRouteOverlay);
    map.on("rotate", updateRouteOverlay);
    map.on("pitch", updateRouteOverlay);
    map.on("resize", updateRouteOverlay);
    map.on("mousemove", handleMapPointerMove);
    map.getCanvas().addEventListener("mouseleave", handleMapCanvasLeave);

    resizeObserver = new ResizeObserver(scheduleResize);
    resizeObserver.observe(container);
    window.addEventListener("resize", scheduleResize);
    scheduleResize();

    return () => {
      isDisposed = true;
      window.removeEventListener("resize", scheduleResize);
      resizeObserver?.disconnect();

      if (resizeFrameId !== null) {
        window.cancelAnimationFrame(resizeFrameId);
      }

      if (routeAnimationFrameId !== null) {
        window.cancelAnimationFrame(routeAnimationFrameId);
      }

      clearPopup();
      clearMarkers();

      if (mapRef.current) {
        const currentMap = mapRef.current;
        currentMap.off("error", handleMapError);
        currentMap.off("move", updateRouteOverlay);
        currentMap.off("zoom", updateRouteOverlay);
        currentMap.off("rotate", updateRouteOverlay);
        currentMap.off("pitch", updateRouteOverlay);
        currentMap.off("resize", updateRouteOverlay);
        currentMap.off("mousemove", handleMapPointerMove);
        currentMap.getCanvas().removeEventListener("mouseleave", handleMapCanvasLeave);
        removeRouteLayer(currentMap);
        currentMap.remove();
        mapRef.current = null;
      }
    };
  }, [enableAnimation, enableGlobe]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || loadState !== "ready") return;

    applyMapViewModeToMap(map, mapViewMode);
    applyMapViewModeToMarkers(markersRef.current, mapViewMode);
    applyMapViewModeToMarkerElements(shellRef.current, mapViewMode);
  }, [loadState, mapViewMode]);

  useEffect(() => {
    aircraftRef.current = activeAircraft;
    routeFeatureCollectionRef.current = routeFeatureCollection;
    completedRouteFeatureCollectionRef.current = completedRouteFeatureCollection;

    const map = mapRef.current;
    if (!map || !map.getSource(ROUTES_SOURCE_ID)) return;

    let isCancelled = false;
    const updateFrameId = window.requestAnimationFrame(() => {
      if (isCancelled || mapRef.current !== map) return;

      const routeSource = map.getSource(ROUTES_SOURCE_ID) as GeoJSONSource | undefined;
      routeSource?.setData(routeFeatureCollectionRef.current);
      const completedRouteSource = map.getSource(COMPLETED_ROUTES_SOURCE_ID) as
        | GeoJSONSource
        | undefined;
      completedRouteSource?.setData(completedRouteFeatureCollectionRef.current);

      popupRef.current?.remove();
      popupRef.current = null;

      markersRef.current.forEach((registration) => {
        registration.element.removeEventListener("click", registration.onClick);
        registration.element.removeEventListener("focus", registration.onFocus);
        registration.element.removeEventListener("blur", registration.onBlur);
        registration.element.removeEventListener("mouseenter", registration.onMouseEnter);
        registration.element.removeEventListener("mouseleave", registration.onMouseLeave);
        registration.marker.remove();
      });

      markersRef.current = aircraftRef.current.map((currentAircraft, index) => {
        const shipmentKey = getAircraftShipmentKey(currentAircraft);
        const routeSample = sampleRouteAtProgress(
          routeFeatureCollectionRef.current.features[index]?.geometry.coordinates ?? [],
          currentAircraft.progress ?? 50
        );
        const element = createAircraftMarkerElement(currentAircraft);
        const rotator = element.querySelector<HTMLSpanElement>(
          ".skyledger-maplibre-aircraft-rotator"
        );
        const onClick = (event: MouseEvent) => {
          event.preventDefault();
          event.stopPropagation();

          popupRef.current?.remove();
          popupRef.current = new maplibregl.Popup({
            className: "skyledger-maplibre-popup",
            closeButton: true,
            closeOnClick: true,
            focusAfterOpen: false,
            offset: 24,
          })
            .setLngLat([currentAircraft.position.lng, currentAircraft.position.lat])
            .setHTML(createAircraftPopupHtml(currentAircraft))
            .addTo(map);
        };
        const onMouseEnter = () => {
          setHoveredShipmentKey(shipmentKey);
          element.classList.add("is-hovered");
        };
        const onMouseLeave = () => {
          setHoveredShipmentKey(null);
          element.classList.remove("is-hovered");
        };
        const onFocus = onMouseEnter;
        const onBlur = onMouseLeave;

        element.addEventListener("click", onClick);
        element.addEventListener("focus", onFocus);
        element.addEventListener("blur", onBlur);
        element.addEventListener("mouseenter", onMouseEnter);
        element.addEventListener("mouseleave", onMouseLeave);

        const marker = new maplibregl.Marker({
          element,
          anchor: "center",
          rotationAlignment: "map",
        })
          .setLngLat(routeSample?.coordinate ?? [currentAircraft.position.lng, currentAircraft.position.lat])
          .addTo(map);

        if (routeSample) {
          rotator?.style.setProperty("transform", `rotate(${routeSample.heading}deg)`);
        }

        return {
          marker,
          element,
          onClick,
          onFocus,
          onBlur,
          onMouseEnter,
          onMouseLeave,
          rotator,
          shipmentKey,
        };
      });
      applyMapViewModeToMarkers(markersRef.current, mapViewModeRef.current);
      applyMapViewModeToMarkerElements(shellRef.current, mapViewModeRef.current);
      setHoveredShipmentKey(hoveredShipmentKeyRef.current, true);

      const overlay = routeOverlayRef.current;
      if (!overlay) return;

      routeFeatureCollectionRef.current.features.forEach((feature, index) => {
        const routePath = feature.geometry.coordinates
          .map((coordinate, coordinateIndex) => {
            const point = map.project([coordinate[0], coordinate[1]] as [number, number]);
            return `${coordinateIndex === 0 ? "M" : "L"} ${point.x.toFixed(1)} ${point.y.toFixed(1)}`;
          })
          .join(" ");

        overlay
          .querySelectorAll<SVGPathElement>(`[data-route-index="${index}"]`)
          .forEach((path) => {
            path.setAttribute("d", routePath);
          });
      });
    });

    return () => {
      isCancelled = true;
      window.cancelAnimationFrame(updateFrameId);
    };
  }, [activeAircraft, completedRouteFeatureCollection, routeFeatureCollection]);

  return (
    <section
      ref={shellRef}
      className={`skyledger-maplibre-shell ${className}`.trim()}
      data-completed-route-count={completedRouteFeatureCollection.features.length}
      data-load-state={loadState}
      data-view-mode={mapViewMode}
      style={{
        height,
        minHeight: typeof height === "number" ? Math.min(height, 420) : 420,
        width: "100%",
      }}
      aria-label="SkyLedger MapLibre satellite flight map"
    >
      <div ref={mapContainerRef} className="skyledger-maplibre-canvas" />
      <svg
        ref={routeOverlayRef}
        className="skyledger-maplibre-route-overlay"
        aria-hidden="true"
      >
        {routeFeatureCollection.features.map((feature, index) => (
          <g key={feature.properties.id}>
            <path data-route-index={index} className="skyledger-maplibre-route-glow" />
            <path data-route-index={index} className="skyledger-maplibre-route-line" />
          </g>
        ))}
      </svg>
      {loadState !== "ready" ? (
        <div className="skyledger-maplibre-status" aria-live="polite">
          {loadState === "error"
            ? "MapLibre satellite map could not be loaded."
            : "Loading MapLibre satellite map..."}
        </div>
      ) : null}
      <div className="skyledger-maplibre-vignette" aria-hidden="true" />
      <div className="skyledger-maplibre-view-toggle" aria-label="Map view mode">
        {MAP_VIEW_MODE_ITEMS.map((item) => (
          <button
            key={item.mode}
            type="button"
            className="skyledger-maplibre-view-toggle-button"
            aria-pressed={mapViewMode === item.mode}
            onClick={() => handleMapViewModeChange(item.mode)}
          >
            {item.label}
          </button>
        ))}
      </div>
      <button
        type="button"
        className="skyledger-maplibre-fit-button"
        disabled={loadState !== "ready" || !hasFitRouteBounds}
        onClick={handleFitActiveRoutes}
      >
        Fit routes
      </button>
      <aside className="skyledger-maplibre-legend" aria-label="Shipment status legend">
        <div className="skyledger-maplibre-legend-title">Status</div>
        <div className="skyledger-maplibre-legend-items">
          {STATUS_LEGEND_ITEMS.map((statusKey) => {
            const statusStyle = STATUS_STYLES[statusKey];

            return (
              <div className="skyledger-maplibre-legend-item" key={statusKey}>
                <span
                  className="skyledger-maplibre-legend-swatch"
                  style={{
                    backgroundColor: statusStyle.markerAccent,
                    boxShadow: `0 0 10px ${statusStyle.markerGlow}`,
                  }}
                  aria-hidden="true"
                />
                <span>{statusStyle.label}</span>
              </div>
            );
          })}
        </div>
      </aside>
      <style jsx global>{`
        .skyledger-maplibre-shell {
          position: relative;
          overflow: hidden;
          border-radius: 8px;
          background-color: #030712;
          background-image:
            radial-gradient(circle at 18% 24%, rgba(255, 255, 255, 0.72) 0 1px, transparent 1.5px),
            radial-gradient(circle at 72% 18%, rgba(34, 211, 238, 0.52) 0 1px, transparent 1.5px),
            radial-gradient(circle at 44% 68%, rgba(255, 255, 255, 0.48) 0 1px, transparent 1.5px),
            radial-gradient(circle at 86% 76%, rgba(255, 255, 255, 0.38) 0 1px, transparent 1.5px);
          background-size: 170px 170px, 230px 230px, 290px 290px, 210px 210px;
        }

        .skyledger-maplibre-shell::before {
          content: "";
          position: absolute;
          inset: 0;
          z-index: 1;
          pointer-events: none;
          background-image:
            radial-gradient(circle at 12% 16%, rgba(255, 255, 255, 0.42) 0 1px, transparent 1.5px),
            radial-gradient(circle at 84% 32%, rgba(255, 255, 255, 0.32) 0 1px, transparent 1.5px),
            radial-gradient(circle at 56% 88%, rgba(34, 211, 238, 0.3) 0 1px, transparent 1.5px);
          background-size: 130px 130px, 190px 190px, 240px 240px;
          opacity: 0.28;
        }

        .skyledger-maplibre-canvas {
          position: absolute;
          inset: 0;
          z-index: 0;
          width: 100%;
          height: 100%;
          background: #030712;
        }

        .skyledger-maplibre-route-overlay {
          position: absolute;
          inset: 0;
          z-index: 1;
          width: 100%;
          height: 100%;
          pointer-events: none;
        }

        .skyledger-maplibre-route-glow,
        .skyledger-maplibre-route-line {
          fill: none;
          stroke-linecap: round;
          stroke-linejoin: round;
        }

        .skyledger-maplibre-route-glow {
          stroke: #22d3ee;
          stroke-width: 10;
          stroke-opacity: 0.22;
          filter: drop-shadow(0 0 10px rgba(34, 211, 238, 0.75));
        }

        .skyledger-maplibre-route-line {
          stroke: #22d3ee;
          stroke-width: 3.5;
          stroke-dasharray: 10 12;
          stroke-opacity: 0.9;
        }

        .skyledger-maplibre-shell .maplibregl-map,
        .skyledger-maplibre-shell .maplibregl-canvas-container,
        .skyledger-maplibre-shell .maplibregl-canvas {
          width: 100% !important;
          height: 100% !important;
        }

        .skyledger-maplibre-shell .maplibregl-canvas {
          outline: none;
        }

        .skyledger-maplibre-vignette {
          position: absolute;
          inset: 0;
          z-index: 2;
          pointer-events: none;
          box-shadow: inset 0 0 120px 28px rgba(1, 4, 12, 0.84);
        }

        .skyledger-maplibre-status {
          position: absolute;
          inset: 0;
          z-index: 4;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 24px;
          background: rgba(3, 7, 18, 0.52);
          color: #cffafe;
          font-size: 13px;
          font-weight: 800;
          text-align: center;
        }

        .skyledger-maplibre-shell[data-load-state="ready"] .skyledger-maplibre-status {
          display: none;
        }

        .skyledger-maplibre-view-toggle {
          position: absolute;
          top: 12px;
          left: 12px;
          z-index: 3;
          display: inline-flex;
          max-width: calc(100% - 88px);
          padding: 3px;
          border: 1px solid rgba(148, 163, 184, 0.22);
          border-radius: 8px;
          background: rgba(3, 7, 18, 0.68);
          backdrop-filter: blur(10px);
          box-shadow: 0 14px 30px rgba(0, 0, 0, 0.22);
          gap: 2px;
        }

        .skyledger-maplibre-view-toggle-button {
          min-height: 28px;
          padding: 0 10px;
          border: 0;
          border-radius: 6px;
          background: transparent;
          color: rgba(226, 232, 240, 0.76);
          cursor: pointer;
          font-size: 10px;
          font-weight: 900;
          line-height: 1;
          white-space: nowrap;
          transition:
            background-color 160ms ease,
            color 160ms ease,
            box-shadow 160ms ease;
        }

        .skyledger-maplibre-view-toggle-button:hover {
          background: rgba(34, 211, 238, 0.12);
          color: #ffffff;
        }

        .skyledger-maplibre-view-toggle-button[aria-pressed="true"] {
          background: rgba(34, 211, 238, 0.2);
          box-shadow: inset 0 0 0 1px rgba(103, 232, 249, 0.32);
          color: #cffafe;
        }

        .skyledger-maplibre-fit-button {
          position: absolute;
          top: 54px;
          left: 12px;
          z-index: 3;
          min-height: 28px;
          padding: 0 11px;
          border: 1px solid rgba(103, 232, 249, 0.28);
          border-radius: 8px;
          background: rgba(3, 7, 18, 0.68);
          backdrop-filter: blur(10px);
          box-shadow: 0 14px 30px rgba(0, 0, 0, 0.2);
          color: #cffafe;
          cursor: pointer;
          font-size: 10px;
          font-weight: 900;
          line-height: 1;
          transition:
            background-color 160ms ease,
            border-color 160ms ease,
            color 160ms ease,
            opacity 160ms ease;
        }

        .skyledger-maplibre-fit-button:hover:not(:disabled) {
          border-color: rgba(103, 232, 249, 0.48);
          background: rgba(34, 211, 238, 0.16);
          color: #ffffff;
        }

        .skyledger-maplibre-fit-button:disabled {
          border-color: rgba(148, 163, 184, 0.16);
          color: rgba(148, 163, 184, 0.64);
          cursor: not-allowed;
          opacity: 0.68;
        }

        .skyledger-maplibre-shell[data-view-mode="routes-only"] .skyledger-maplibre-route-overlay {
          opacity: 1;
        }

        .skyledger-maplibre-shell[data-view-mode="routes-only"] .skyledger-maplibre-aircraft-marker {
          opacity: 0.72 !important;
        }

        .skyledger-maplibre-shell[data-view-mode="status-focus"] .skyledger-maplibre-route-overlay {
          opacity: 0.36;
        }

        .skyledger-maplibre-shell[data-view-mode="status-focus"] .skyledger-maplibre-aircraft-marker {
          opacity: 1 !important;
        }

        .skyledger-maplibre-legend {
          position: absolute;
          left: 12px;
          bottom: 12px;
          z-index: 3;
          width: min(186px, calc(100% - 24px));
          padding: 10px 11px 11px;
          border: 1px solid rgba(148, 163, 184, 0.22);
          border-radius: 8px;
          background: rgba(3, 7, 18, 0.66);
          backdrop-filter: blur(10px);
          box-shadow: 0 16px 32px rgba(0, 0, 0, 0.24);
          color: #e2e8f0;
          pointer-events: none;
        }

        .skyledger-maplibre-legend-title {
          margin-bottom: 8px;
          color: #cffafe;
          font-size: 10px;
          font-weight: 900;
          letter-spacing: 0.6px;
          line-height: 1;
          text-transform: uppercase;
        }

        .skyledger-maplibre-legend-items {
          display: grid;
          gap: 6px;
        }

        .skyledger-maplibre-legend-item {
          display: flex;
          align-items: center;
          min-width: 0;
          gap: 8px;
          color: rgba(226, 232, 240, 0.88);
          font-size: 10px;
          font-weight: 800;
          line-height: 1.1;
          white-space: nowrap;
        }

        .skyledger-maplibre-legend-swatch {
          display: inline-flex;
          width: 18px;
          height: 4px;
          flex: 0 0 18px;
          border-radius: 999px;
          opacity: 0.96;
        }

        .skyledger-maplibre-shell .maplibregl-ctrl-top-right {
          z-index: 3;
        }

        .skyledger-maplibre-shell .maplibregl-ctrl button {
          border-radius: 0;
        }

        .skyledger-maplibre-shell .maplibregl-ctrl-group,
        .skyledger-maplibre-shell .maplibregl-ctrl-attrib {
          border: 1px solid rgba(34, 211, 238, 0.24);
          background: rgba(3, 7, 18, 0.72);
          color: rgba(226, 232, 240, 0.82);
        }

        .skyledger-maplibre-shell .maplibregl-ctrl-attrib a {
          color: #67e8f9;
        }

        .skyledger-maplibre-aircraft-marker {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 46px;
          height: 46px;
          padding: 0;
          border: 0;
          border-radius: 999px;
          background: color-mix(
            in srgb,
            var(--skyledger-aircraft-accent, #22d3ee) 16%,
            rgba(3, 7, 18, 0.2)
          );
          cursor: pointer;
          filter: drop-shadow(
            0 0 10px var(--skyledger-aircraft-glow, rgba(34, 211, 238, 0.68))
          );
          transition:
            background-color 160ms ease,
            filter 160ms ease,
            transform 160ms ease;
        }

        .skyledger-maplibre-aircraft-marker.is-hovered {
          background: color-mix(
            in srgb,
            var(--skyledger-aircraft-accent, #22d3ee) 28%,
            rgba(3, 7, 18, 0.24)
          );
          filter: drop-shadow(
            0 0 16px var(--skyledger-aircraft-glow, rgba(34, 211, 238, 0.95))
          );
          transform: scale(1.08);
        }

        .skyledger-maplibre-aircraft-marker.is-highlighted {
          opacity: 1 !important;
          background: color-mix(
            in srgb,
            var(--skyledger-aircraft-accent, #22d3ee) 32%,
            rgba(3, 7, 18, 0.2)
          );
          filter: drop-shadow(
            0 0 20px var(--skyledger-aircraft-glow, rgba(34, 211, 238, 0.95))
          );
          transform: scale(1.1);
        }

        .skyledger-maplibre-aircraft-marker.is-dimmed {
          opacity: 0.42 !important;
          filter: drop-shadow(0 0 5px rgba(15, 23, 42, 0.45)) saturate(0.72);
          transform: scale(0.94);
        }

        .skyledger-maplibre-aircraft-rotator,
        .skyledger-maplibre-aircraft-rotator svg {
          display: block;
          width: 46px;
          height: 46px;
          transform-origin: center;
        }

        .skyledger-maplibre-shell[data-view-mode="routes-only"] .skyledger-maplibre-aircraft-marker {
          opacity: 0.72 !important;
        }

        .skyledger-maplibre-shell[data-view-mode="status-focus"] .skyledger-maplibre-aircraft-marker {
          opacity: 1 !important;
          filter: drop-shadow(
            0 0 18px var(--skyledger-aircraft-glow, rgba(34, 211, 238, 0.95))
          );
        }

        .skyledger-maplibre-shell .skyledger-maplibre-popup {
          z-index: 5;
        }

        .skyledger-maplibre-shell .skyledger-maplibre-popup .maplibregl-popup-content {
          width: min(260px, 74vw);
          padding: 0;
          overflow: hidden;
          border: 1px solid rgba(34, 211, 238, 0.58);
          border-radius: 8px;
          background: rgba(3, 7, 18, 0.9);
          box-shadow: 0 18px 42px rgba(0, 0, 0, 0.36);
          color: #e2e8f0;
        }

        .skyledger-maplibre-shell .skyledger-maplibre-popup .maplibregl-popup-tip {
          border-top-color: rgba(34, 211, 238, 0.58);
          border-bottom-color: rgba(34, 211, 238, 0.58);
          border-left-color: rgba(34, 211, 238, 0.58);
          border-right-color: rgba(34, 211, 238, 0.58);
        }

        .skyledger-maplibre-shell .skyledger-maplibre-popup .maplibregl-popup-close-button {
          top: 7px;
          right: 8px;
          width: 24px;
          height: 24px;
          border-radius: 6px;
          color: #cffafe;
          font-size: 18px;
          line-height: 22px;
        }

        .skyledger-maplibre-shell .skyledger-maplibre-popup .maplibregl-popup-close-button:hover {
          background: rgba(34, 211, 238, 0.16);
          color: #ffffff;
        }

        .skyledger-maplibre-popup-card {
          padding: 13px 14px 14px;
        }

        .skyledger-maplibre-popup-kicker {
          margin-bottom: 4px;
          color: #67e8f9;
          font-size: 9px;
          font-weight: 900;
          letter-spacing: 0.6px;
          text-transform: uppercase;
        }

        .skyledger-maplibre-popup-title {
          margin-bottom: 10px;
          color: #ffffff;
          font-size: 17px;
          font-weight: 900;
        }

        .skyledger-maplibre-popup-list {
          display: grid;
          gap: 7px;
          margin: 0;
        }

        .skyledger-maplibre-popup-list div {
          display: grid;
          grid-template-columns: 78px 1fr;
          gap: 10px;
        }

        .skyledger-maplibre-popup-list dt {
          color: #94a3b8;
          font-size: 10px;
          font-weight: 800;
          text-transform: uppercase;
        }

        .skyledger-maplibre-popup-list dd {
          margin: 0;
          color: #e2e8f0;
          font-size: 11px;
          font-weight: 700;
        }

        @media (max-width: 640px) {
          .skyledger-maplibre-view-toggle {
            top: 10px;
            left: 10px;
            max-width: calc(100% - 72px);
            overflow-x: auto;
          }

          .skyledger-maplibre-view-toggle-button {
            min-height: 27px;
            padding: 0 8px;
            font-size: 9px;
          }

          .skyledger-maplibre-fit-button {
            top: 50px;
            left: 10px;
            min-height: 27px;
            padding: 0 9px;
            font-size: 9px;
          }

          .skyledger-maplibre-legend {
            right: 10px;
            bottom: 10px;
            left: 10px;
            width: auto;
            padding: 9px 10px;
          }

          .skyledger-maplibre-legend-items {
            grid-template-columns: repeat(2, minmax(0, 1fr));
            column-gap: 10px;
            row-gap: 7px;
          }

          .skyledger-maplibre-legend-item {
            font-size: 9px;
          }
        }
      `}</style>
    </section>
  );
}

export default SkyLedgerMapLibre;
