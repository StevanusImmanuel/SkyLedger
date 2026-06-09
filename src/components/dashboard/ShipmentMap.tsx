'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import type {
  LatLngTuple,
  Layer,
  Map as LeafletMap,
  Marker as LeafletMarker,
} from 'leaflet';

type ShipmentMapData = {
  id: string;
  awbNumber: string;
  originLat: number;
  originLng: number;
  originIata: string;
  destLat: number;
  destLng: number;
  destIata: string;
  status: string;
};

type ShipmentMapProps = {
  shipments: ShipmentMapData[];
};

type RouteAnimation = {
  marker: LeafletMarker;
  origin: LatLngTuple;
  destination: LatLngTuple;
  bearing: number;
  startedAt: number;
  duration: number;
  pauseDuration: number;
  rotationElement: HTMLElement | null;
};

const ROUTE_ANIMATION_DURATION_MS = 30000;
const ROUTE_PAUSE_DURATION_MS = 2000;
const ROUTE_STAGGER_MS = 1400;

function isValidCoordinate(lat: number, lng: number) {
  return (
    Number.isFinite(lat) &&
    Number.isFinite(lng) &&
    lat >= -90 &&
    lat <= 90 &&
    lng >= -180 &&
    lng <= 180
  );
}

function getShipmentSignature(shipments: ShipmentMapData[]) {
  return shipments
    .map((shipment) =>
      [
        shipment.id,
        shipment.originLat,
        shipment.originLng,
        shipment.destLat,
        shipment.destLng,
        shipment.status,
      ].join(':')
    )
    .sort()
    .join('|');
}

function getPathColor(status: string) {
  if (status === 'in_transit') return '#0ea5e9';
  if (status === 'delayed') return '#ef4444';
  return '#8b5cf6';
}

function interpolatePoint(
  origin: LatLngTuple,
  destination: LatLngTuple,
  progress: number
): LatLngTuple {
  return [
    origin[0] + (destination[0] - origin[0]) * progress,
    origin[1] + (destination[1] - origin[1]) * progress,
  ];
}

function getBearing(origin: LatLngTuple, destination: LatLngTuple) {
  const lat1 = (origin[0] * Math.PI) / 180;
  const lat2 = (destination[0] * Math.PI) / 180;
  const lngDelta = ((destination[1] - origin[1]) * Math.PI) / 180;
  const y = Math.sin(lngDelta) * Math.cos(lat2);
  const x =
    Math.cos(lat1) * Math.sin(lat2) -
    Math.sin(lat1) * Math.cos(lat2) * Math.cos(lngDelta);

  return (Math.atan2(y, x) * 180) / Math.PI + 90;
}

function ShipmentMapComponent({ shipments }: ShipmentMapProps) {
  const mapRef = useRef<LeafletMap | null>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const [isMapReady, setIsMapReady] = useState(false);
  const [isContainerReady, setIsContainerReady] = useState(false);
  const animationFrameRef = useRef<number | null>(null);
  const timeoutIdsRef = useRef<number[]>([]);
  const routeAnimationsRef = useRef<RouteAnimation[]>([]);
  const layersRef = useRef<Layer[]>([]);
  const lastShipmentSignatureRef = useRef<string>('');
  const renderGenerationRef = useRef(0);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      import('leaflet/dist/leaflet.css');
    }
  }, []);

  const stopAnimations = useCallback(() => {
    if (animationFrameRef.current !== null) {
      window.cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }

    timeoutIdsRef.current.forEach((timeoutId) => window.clearTimeout(timeoutId));
    timeoutIdsRef.current = [];
    routeAnimationsRef.current = [];
  }, []);

  useEffect(() => {
    const container = mapContainerRef.current;

    if (!container) return;

    const mapElement = container;
    let isDisposed = false;

    function updateContainerReady() {
      if (isDisposed) return;

      const width = mapElement.clientWidth;
      const height = mapElement.clientHeight;
      setIsContainerReady(width > 0 && height > 0);
    }

    updateContainerReady();

    const resizeObserver = new ResizeObserver(updateContainerReady);
    resizeObserver.observe(mapElement);
    window.addEventListener('resize', updateContainerReady);

    return () => {
      isDisposed = true;
      resizeObserver.disconnect();
      window.removeEventListener('resize', updateContainerReady);
    };
  }, []);

  useEffect(() => {
    let isDisposed = false;
    let invalidateFrameId: number | null = null;

    if (!isContainerReady || !mapContainerRef.current || mapRef.current) return;

    // Dynamically import Leaflet only on client side
    import('leaflet').then((L) => {
      if (isDisposed || !mapContainerRef.current || mapRef.current) return;

      // Initialize map
      const map = L.map(mapContainerRef.current, {
        center: [20, 0],
        zoom: 2,
        zoomControl: true,
        scrollWheelZoom: true,
      });

      mapRef.current = map;

      // Add tile layer
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors',
        maxZoom: 19,
      }).addTo(map);

      // Signal that map is ready
      invalidateFrameId = window.requestAnimationFrame(() => {
        invalidateFrameId = null;
        if (!isDisposed && mapRef.current === map) {
          map.invalidateSize();
        }
      });
      setIsMapReady(true);
    });

    return () => {
      isDisposed = true;
      stopAnimations();

      if (invalidateFrameId !== null) {
        window.cancelAnimationFrame(invalidateFrameId);
      }

      layersRef.current.forEach((layer) => {
        if (mapRef.current?.hasLayer(layer)) {
          mapRef.current.removeLayer(layer);
        }
      });
      layersRef.current = [];

      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
      setIsMapReady(false);
    };
  }, [isContainerReady, stopAnimations]);

  useEffect(() => {
    if (!isMapReady) return;

    // Check if shipments have actually changed
    const currentShipmentSignature = getShipmentSignature(shipments);
    if (currentShipmentSignature === lastShipmentSignatureRef.current) {
      return;
    }

    lastShipmentSignatureRef.current = currentShipmentSignature;
    renderGenerationRef.current += 1;
    const renderGeneration = renderGenerationRef.current;

    const map = mapRef.current;
    if (!map || !map.getContainer().isConnected) return;
    const activeMap = map;

    // Import Leaflet dynamically
    import('leaflet').then((L) => {
      if (
        renderGeneration !== renderGenerationRef.current ||
        mapRef.current !== activeMap ||
        !activeMap.getContainer().isConnected
      ) {
        return;
      }

      stopAnimations();

      layersRef.current.forEach((layer) => {
        if (activeMap.hasLayer(layer)) {
          activeMap.removeLayer(layer);
        }
      });
      layersRef.current = [];

      // Create plane icon
      const planeIcon = L.divIcon({
        html: `<span class="plane-marker-rotator">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="#1a2d5a" stroke="#fff" stroke-width="1.5" aria-hidden="true" focusable="false">
            <path d="M17.8 19.2L16 11l3.5-3.5C21 6 21 4 21 4s-2 0-3.5 1.5L14 9 5.8 7.2c-.5-.1-.9.1-1.1.5l-.3.5c-.2.5-.1 1 .3 1.3L9 12l-2 3H4l-1 1 3 2 2 3 1-1v-3l3-2 3.5 3.3c.3.4.8.5 1.3.3l.5-.2c.4-.3.6-.7.5-1.2z"/>
          </svg>
        </span>`,
        className: 'plane-marker',
        iconSize: [24, 24],
        iconAnchor: [12, 12],
      });

      const bounds: LatLngTuple[] = [];
      const nextAnimations: RouteAnimation[] = [];
      const validShipments = shipments.filter((shipment) =>
        isValidCoordinate(shipment.originLat, shipment.originLng) &&
        isValidCoordinate(shipment.destLat, shipment.destLng)
      );

      // Add shipment routes with animation
      validShipments.forEach((shipment, index) => {
        const origin: LatLngTuple = [shipment.originLat, shipment.originLng];
        const dest: LatLngTuple = [shipment.destLat, shipment.destLng];

        bounds.push(origin, dest);

        // Draw flight path
        const routeLine = L.polyline([origin, dest], {
          color: getPathColor(shipment.status),
          weight: 2,
          opacity: 0.6,
          dashArray: '5, 10',
        }).addTo(activeMap);
        layersRef.current.push(routeLine);

        // Create animated plane marker
        const marker = L.marker(origin, { icon: planeIcon })
          .addTo(activeMap)
          .bindPopup(`
            <div style="font-family: system-ui; padding: 4px;">
              <div style="font-weight: 700; font-size: 13px; color: #1a2d5a; margin-bottom: 4px;">
                ${shipment.awbNumber}
              </div>
              <div style="font-size: 11px; color: #64748b; margin-bottom: 2px;">
                ${shipment.originIata} → ${shipment.destIata}
              </div>
              <div style="font-size: 11px; color: #64748b;">
                Status: ${shipment.status.replace('_', ' ').toUpperCase()}
              </div>
            </div>
          `);

        layersRef.current.push(marker);

        // Add click handler to navigate to shipment details
        marker.on('click', () => {
          router.push(`/shipments/${shipment.id}`);
        });

        const markerElement = marker.getElement();
        const rotationElement = markerElement?.querySelector<HTMLElement>(
          '.plane-marker-rotator'
        ) ?? null;

        if (rotationElement) {
          rotationElement.style.transform = `rotate(${getBearing(origin, dest)}deg)`;
        }

        nextAnimations.push({
          marker,
          origin,
          destination: dest,
          bearing: getBearing(origin, dest),
          startedAt: performance.now() + index * ROUTE_STAGGER_MS,
          duration: ROUTE_ANIMATION_DURATION_MS,
          pauseDuration: ROUTE_PAUSE_DURATION_MS,
          rotationElement,
        });

        // Add origin marker
        const originMarker = L.circleMarker(origin, {
          radius: 6,
          fillColor: '#10b981',
          color: '#fff',
          weight: 2,
          opacity: 1,
          fillOpacity: 0.8,
        })
          .addTo(activeMap)
          .bindPopup(`<div style="font-size: 12px; font-weight: 600;">${shipment.originIata}</div>`);
        layersRef.current.push(originMarker);

        // Add destination marker
        const destinationMarker = L.circleMarker(dest, {
          radius: 6,
          fillColor: '#ef4444',
          color: '#fff',
          weight: 2,
          opacity: 1,
          fillOpacity: 0.8,
        })
          .addTo(activeMap)
          .bindPopup(`<div style="font-size: 12px; font-weight: 600;">${shipment.destIata}</div>`);
        layersRef.current.push(destinationMarker);
      });

      routeAnimationsRef.current = nextAnimations;

      function animateRoutes(timestamp: number) {
        if (mapRef.current !== activeMap || !activeMap.getContainer().isConnected) {
          stopAnimations();
          return;
        }

        routeAnimationsRef.current.forEach((animation) => {
          const markerElement = animation.marker.getElement();

          if (!markerElement || !markerElement.isConnected || !activeMap.hasLayer(animation.marker)) {
            return;
          }

          const cycleDuration = animation.duration + animation.pauseDuration;
          const elapsed = Math.max(0, timestamp - animation.startedAt);
          const cycleElapsed = elapsed % cycleDuration;
          const progress = Math.min(cycleElapsed / animation.duration, 1);
          const nextPosition = interpolatePoint(
            animation.origin,
            animation.destination,
            progress
          );

          animation.marker.setLatLng(nextPosition);

          if (animation.rotationElement) {
            animation.rotationElement.style.transform = `rotate(${animation.bearing}deg)`;
          }
        });

        animationFrameRef.current = window.requestAnimationFrame(animateRoutes);
      }

      if (
        routeAnimationsRef.current.length > 0 &&
        mapRef.current === activeMap &&
        activeMap.getContainer().isConnected
      ) {
        animationFrameRef.current = window.requestAnimationFrame(animateRoutes);
      }

      // Fit map to show all markers
      if (
        bounds.length > 0 &&
        mapRef.current === activeMap &&
        activeMap.getContainer().isConnected
      ) {
        activeMap.fitBounds(bounds, { padding: [50, 50] });
      }
    });
  }, [shipments, isMapReady, router, stopAnimations]);

  return (
    <div className="sl-chart-card" style={{ height: 400 }}>
      <div className="sl-chart-header">
        <div>
          <p className="sl-chart-title">Active Shipments Map</p>
          <p className="sl-chart-subtitle">Real-time flight tracking</p>
        </div>
        <div style={{ fontSize: 11, color: '#64748b' }}>
          {shipments.length} active shipment{shipments.length !== 1 ? 's' : ''}
        </div>
      </div>
      <div
        ref={mapContainerRef}
        style={{
          height: 320,
          minHeight: 320,
          width: '100%',
          borderRadius: 8,
          overflow: 'hidden',
        }}
      />
      <style jsx global>{`
        .plane-marker {
          background: transparent;
          border: none;
          cursor: pointer;
        }
        .plane-marker:hover {
          filter: brightness(1.2);
        }
        .plane-marker svg {
          display: block;
        }
        .plane-marker-rotator {
          display: block;
          height: 24px;
          transform-origin: center;
          width: 24px;
          will-change: transform;
        }
        .leaflet-popup-content-wrapper {
          border-radius: 8px;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        }
        .leaflet-popup-content {
          margin: 8px;
        }
      `}</style>
    </div>
  );
}

// Export with ssr disabled
export const ShipmentMap = dynamic(() => Promise.resolve(ShipmentMapComponent), {
  ssr: false,
  loading: () => (
    <div className="sl-chart-card" style={{ height: 400 }}>
      <div className="sl-chart-header">
        <div>
          <p className="sl-chart-title">Active Shipments Map</p>
          <p className="sl-chart-subtitle">Real-time flight tracking</p>
        </div>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 320 }}>
        <p style={{ color: '#94a3b8', fontSize: 13 }}>Loading map...</p>
      </div>
    </div>
  ),
});
