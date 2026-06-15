"use client";

import { useEffect, useRef, useState } from "react";
import "maplibre-gl/dist/maplibre-gl.css";
import { mockAircraft, type MockAircraft } from "@/lib/mockAircraft";
import type {
  GeoJSONSource,
  Map as MapLibreMap,
  Marker as MapLibreMarker,
  Popup as MapLibrePopup,
  StyleSpecification,
} from "maplibre-gl";

const ESRI_WORLD_IMAGERY_TILE_URL =
  "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}";

const INITIAL_CENTER: [number, number] = [106.8456, -6.2088];
const ROUTES_SOURCE_ID = "aircraft-routes";
const ROUTES_LAYER_ID = "aircraft-routes-line";
const ROUTE_CURVE_STEPS = 48;
const ROUTE_DASH_SEQUENCE: number[][] = [
  [2, 2],
  [1.5, 2.5],
  [1, 3],
  [2.5, 1.5],
];

type WorldMapLeafletProps = {
  className?: string;
  ariaLabel?: string;
};

type ProjectionCapableMap = MapLibreMap & {
  setProjection?: (projection: { type: "globe" } | "globe") => void;
};

type RouteProperties = {
  id: string;
  callsign: string;
  status: MockAircraft["status"];
};

type RouteFeatureCollection = {
  type: "FeatureCollection";
  features: Array<{
    type: "Feature";
    properties: RouteProperties;
    geometry: {
      type: "LineString";
      coordinates: [number, number][];
    };
  }>;
};

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
        id: "satellite",
        type: "raster",
        source: "satellite",
      },
    ],
  };
}

function enableGlobeProjection(map: MapLibreMap) {
  const projectionMap = map as ProjectionCapableMap;

  if (typeof projectionMap.setProjection !== "function") {
    return;
  }

  try {
    projectionMap.setProjection({ type: "globe" });
  } catch {
    try {
      projectionMap.setProjection("globe");
    } catch {
      // Older MapLibre versions may not support globe projection.
    }
  }
}

function normalizeLongitude(lng: number) {
  if (lng > 180) return lng - 360;
  if (lng < -180) return lng + 360;
  return lng;
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
  const curveStrength = Math.min(Math.max(distance * 0.18, 2), 16);
  const controlLng = midLng;
  const controlLat = midLat + curveStrength;
  const coordinates: [number, number][] = [];

  for (let index = 0; index <= steps; index += 1) {
    const t = index / steps;
    const inverseT = 1 - t;
    const lng =
      inverseT * inverseT * startLng +
      2 * inverseT * t * controlLng +
      t * t * endLng;
    const lat =
      inverseT * inverseT * startLat +
      2 * inverseT * t * controlLat +
      t * t * endLat;

    coordinates.push([normalizeLongitude(lng), lat]);
  }

  return coordinates;
}

function createRouteFeatureCollection(): RouteFeatureCollection {
  return {
    type: "FeatureCollection",
    features: mockAircraft.map((aircraft) => ({
      type: "Feature",
      properties: {
        id: aircraft.id,
        callsign: aircraft.callsign,
        status: aircraft.status,
      },
      geometry: {
        type: "LineString",
        coordinates: createCurvedRoute(
          [aircraft.originCoords.lng, aircraft.originCoords.lat],
          [aircraft.destinationCoords.lng, aircraft.destinationCoords.lat]
        ),
      },
    })),
  };
}

const ROUTE_FEATURE_COLLECTION = createRouteFeatureCollection();

function escapeHtml(value: string | number) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function formatAircraftStatus(status: MockAircraft["status"]) {
  return status.charAt(0).toUpperCase() + status.slice(1);
}

function createAircraftPopupHtml(aircraft: MockAircraft) {
  const route = `${aircraft.origin} \u2192 ${aircraft.destination}`;

  return `
    <div class="sl-aircraft-popup-card">
      <div class="sl-aircraft-popup-kicker">Selected Aircraft</div>
      <div class="sl-aircraft-popup-title">${escapeHtml(aircraft.callsign)}</div>
      <dl class="sl-aircraft-popup-list">
        <div><dt>Airline</dt><dd>${escapeHtml(aircraft.airline)}</dd></div>
        <div><dt>Aircraft</dt><dd>${escapeHtml(aircraft.aircraftType)}</dd></div>
        <div><dt>Route</dt><dd>${escapeHtml(route)}</dd></div>
        <div><dt>Altitude</dt><dd>${escapeHtml(aircraft.altitudeFt.toLocaleString())} ft</dd></div>
        <div><dt>Speed</dt><dd>${escapeHtml(aircraft.speedKts)} kts</dd></div>
        <div><dt>Heading</dt><dd>${escapeHtml(aircraft.heading)}&deg;</dd></div>
        <div><dt>Status</dt><dd>${escapeHtml(formatAircraftStatus(aircraft.status))}</dd></div>
      </dl>
    </div>
  `;
}

function createAircraftMarkerElement(aircraft: MockAircraft) {
  const marker = document.createElement("button");
  marker.type = "button";
  marker.className = "aircraft-marker";
  marker.dataset.aircraftId = aircraft.id;
  marker.setAttribute(
    "aria-label",
    `${aircraft.callsign}, ${aircraft.airline}, ${aircraft.origin} to ${aircraft.destination}`
  );
  marker.style.width = "48px";
  marker.style.height = "48px";
  marker.style.padding = "0";
  marker.style.border = "0";
  marker.style.borderRadius = "999px";
  marker.style.background = "rgba(3, 7, 18, 0.16)";
  marker.style.cursor = "pointer";
  marker.style.display = "flex";
  marker.style.alignItems = "center";
  marker.style.justifyContent = "center";
  marker.style.filter = "drop-shadow(0 0 10px rgba(34, 211, 238, 0.7))";

  marker.innerHTML = `
    <span
      class="aircraft-marker-icon"
      style="display:flex;align-items:center;justify-content:center;width:48px;height:48px;transform:rotate(${aircraft.heading}deg);transform-origin:center;"
    >
      <svg width="48" height="48" viewBox="0 0 48 48" aria-hidden="true" focusable="false">
        <circle cx="24" cy="24" r="19" fill="rgba(3, 7, 18, 0.38)" stroke="#22d3ee" stroke-width="1.6" />
        <path
          d="M24 7.5c1.1 0 2 .8 2.2 1.9l2.2 11.2 10.1 5.2c.7.4 1.1 1.1 1 1.9l-.2 2.1-11.1-2.5-1.7 8.1 3.5 2.9-.2 1.8-5.8-1.7-5.8 1.7-.2-1.8 3.5-2.9-1.7-8.1-11.1 2.5-.2-2.1c-.1-.8.3-1.5 1-1.9l10.1-5.2 2.2-11.2c.2-1.1 1.1-1.9 2.2-1.9Z"
          fill="#ffffff"
          stroke="#22d3ee"
          stroke-width="1.3"
          stroke-linejoin="round"
        />
      </svg>
    </span>
  `;

  marker.addEventListener("mouseenter", () => {
    marker.style.filter = "drop-shadow(0 0 16px rgba(34, 211, 238, 0.95))";
    marker.style.background = "rgba(34, 211, 238, 0.14)";
  });
  marker.addEventListener("mouseleave", () => {
    marker.style.filter = "drop-shadow(0 0 10px rgba(34, 211, 238, 0.7))";
    marker.style.background = "rgba(3, 7, 18, 0.16)";
  });

  return marker;
}

export function WorldMapLeaflet({
  className = "",
  ariaLabel = "Live flight tracking satellite map",
}: WorldMapLeafletProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MapLibreMap | null>(null);
  const aircraftMarkersRef = useRef<MapLibreMarker[]>([]);
  const activePopupRef = useRef<MapLibrePopup | null>(null);
  const selectedMarkerElementRef = useRef<HTMLButtonElement | null>(null);
  const [loadState, setLoadState] = useState<"loading" | "ready" | "error">(
    "loading"
  );

  useEffect(() => {
    let isDisposed = false;
    let resizeObserver: ResizeObserver | null = null;
    let resizeFrameId: number | null = null;
    let routeAnimationFrameId: number | null = null;
    let routeDashFrame = 0;
    let lastRouteDashUpdate = 0;

    function clearAircraftMarkers() {
      aircraftMarkersRef.current.forEach((marker) => marker.remove());
      aircraftMarkersRef.current = [];
    }

    function clearSelectedAircraft() {
      selectedMarkerElementRef.current?.classList.remove("selected");
      selectedMarkerElementRef.current = null;
    }

    function clearActivePopup() {
      activePopupRef.current?.remove();
      activePopupRef.current = null;
      clearSelectedAircraft();
    }

    function showAircraftPopup(
      map: MapLibreMap,
      PopupConstructor: typeof import("maplibre-gl").Popup,
      aircraft: MockAircraft,
      markerElement: HTMLButtonElement
    ) {
      clearActivePopup();

      markerElement.classList.add("selected");
      selectedMarkerElementRef.current = markerElement;

      const popup = new PopupConstructor({
        className: "sl-aircraft-popup",
        closeButton: true,
        closeOnClick: false,
        focusAfterOpen: false,
        offset: 26,
      })
        .setLngLat([aircraft.lng, aircraft.lat])
        .setHTML(createAircraftPopupHtml(aircraft))
        .addTo(map);

      activePopupRef.current = popup;

      popup.on("close", () => {
        if (activePopupRef.current === popup) {
          activePopupRef.current = null;
        }

        if (selectedMarkerElementRef.current === markerElement) {
          markerElement.classList.remove("selected");
          selectedMarkerElementRef.current = null;
        }
      });
    }

    function scheduleResize() {
      if (!mapRef.current) return;

      if (resizeFrameId !== null) {
        window.cancelAnimationFrame(resizeFrameId);
      }

      resizeFrameId = window.requestAnimationFrame(() => {
        resizeFrameId = null;
        mapRef.current?.resize();
      });
    }

    function removeRouteLayers(map: MapLibreMap) {
      if (map.getLayer(ROUTES_LAYER_ID)) {
        map.removeLayer(ROUTES_LAYER_ID);
      }

      if (map.getSource(ROUTES_SOURCE_ID)) {
        map.removeSource(ROUTES_SOURCE_ID);
      }
    }

    function upsertRouteLayer(map: MapLibreMap) {
      const existingSource = map.getSource(ROUTES_SOURCE_ID) as
        | GeoJSONSource
        | undefined;

      if (existingSource) {
        existingSource.setData(ROUTE_FEATURE_COLLECTION);
      } else {
        map.addSource(ROUTES_SOURCE_ID, {
          type: "geojson",
          data: ROUTE_FEATURE_COLLECTION,
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
            "line-width": 2,
            "line-opacity": 0.72,
            "line-blur": 0.35,
            "line-dasharray": ROUTE_DASH_SEQUENCE[0],
          },
        });
      }
    }

    function animateRouteDashes(timestamp: number) {
      const map = mapRef.current;

      if (!map || isDisposed) return;

      if (timestamp - lastRouteDashUpdate > 160 && map.getLayer(ROUTES_LAYER_ID)) {
        routeDashFrame = (routeDashFrame + 1) % ROUTE_DASH_SEQUENCE.length;
        lastRouteDashUpdate = timestamp;
        map.setPaintProperty(
          ROUTES_LAYER_ID,
          "line-dasharray",
          ROUTE_DASH_SEQUENCE[routeDashFrame]
        );
      }

      routeAnimationFrameId = window.requestAnimationFrame(animateRouteDashes);
    }

    async function initializeMap() {
      if (typeof window === "undefined" || !mapContainerRef.current) {
        return;
      }

      const maplibregl = await import("maplibre-gl");

      if (isDisposed || !mapContainerRef.current || mapRef.current) {
        return;
      }

      const map = new maplibregl.Map({
        container: mapContainerRef.current,
        style: createSatelliteStyle(),
        center: INITIAL_CENTER,
        zoom: 3,
        minZoom: 1,
        maxZoom: 18,
        attributionControl: false,
      });

      mapRef.current = map;
      enableGlobeProjection(map);

      map.addControl(
        new maplibregl.AttributionControl({
          compact: true,
          customAttribution: "Esri World Imagery",
        }),
        "bottom-right"
      );

      map.once("load", () => {
        if (isDisposed) return;
        upsertRouteLayer(map);
        clearAircraftMarkers();
        aircraftMarkersRef.current = mockAircraft.map((aircraft) => {
          const element = createAircraftMarkerElement(aircraft);
          element.addEventListener("click", (event) => {
            event.preventDefault();
            event.stopPropagation();
            showAircraftPopup(map, maplibregl.Popup, aircraft, element);
          });

          return new maplibregl.Marker({
            element,
            anchor: "center",
            rotationAlignment: "map",
          })
            .setLngLat([aircraft.lng, aircraft.lat])
            .addTo(map);
        });
        setLoadState("ready");
        routeAnimationFrameId = window.requestAnimationFrame(animateRouteDashes);
        scheduleResize();
      });

      map.on("error", () => {
        if (isDisposed) return;
        setLoadState("error");
      });

      resizeObserver = new ResizeObserver(() => {
        scheduleResize();
      });
      resizeObserver.observe(mapContainerRef.current);

      window.addEventListener("resize", scheduleResize);
      scheduleResize();
    }

    initializeMap();

    return () => {
      isDisposed = true;
      resizeObserver?.disconnect();
      window.removeEventListener("resize", scheduleResize);
      if (resizeFrameId !== null) {
        window.cancelAnimationFrame(resizeFrameId);
      }
      if (routeAnimationFrameId !== null) {
        window.cancelAnimationFrame(routeAnimationFrameId);
      }
      clearActivePopup();
      clearAircraftMarkers();

      if (mapRef.current) {
        removeRouteLayers(mapRef.current);
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []);

  return (
    <div
      className={`sl-world-map-shell ${className}`.trim()}
      aria-label={ariaLabel}
      role="region"
    >
      <div ref={mapContainerRef} className="sl-world-map-canvas" />
      {loadState !== "ready" ? (
        <div className="sl-world-map-status" aria-live="polite">
          {loadState === "error"
            ? "Unable to load satellite map."
            : "Loading Esri satellite map..."}
        </div>
      ) : null}
      <div className="sl-world-map-vignette" aria-hidden="true" />
    </div>
  );
}
