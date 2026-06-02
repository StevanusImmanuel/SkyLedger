'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';

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

function ShipmentMapComponent({ shipments }: ShipmentMapProps) {
  const mapRef = useRef<any>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const [isClient, setIsClient] = useState(false);
  const [isMapReady, setIsMapReady] = useState(false);
  const animationFramesRef = useRef<Map<string, number>>(new Map());
  const markersRef = useRef<Map<string, any>>(new Map());
  const timeoutsRef = useRef<Map<string, NodeJS.Timeout>>(new Map());
  const lastShipmentIdsRef = useRef<string>('');

  console.log('[ShipmentMap] Component render - Received shipments:', shipments.length);

  useEffect(() => {
    setIsClient(true);
    // Import Leaflet CSS dynamically
    if (typeof window !== 'undefined') {
      import('leaflet/dist/leaflet.css');
    }
  }, []);

  useEffect(() => {
    console.log('[ShipmentMap init] Starting map initialization, isClient:', isClient, 'hasContainer:', !!mapContainerRef.current, 'hasMap:', !!mapRef.current);

    if (!isClient || !mapContainerRef.current || mapRef.current) return;

    // Dynamically import Leaflet only on client side
    import('leaflet').then((L) => {
      console.log('[ShipmentMap init] Leaflet imported');

      if (!mapContainerRef.current || mapRef.current) return;

      // Initialize map
      const map = L.map(mapContainerRef.current, {
        center: [20, 0],
        zoom: 2,
        zoomControl: true,
        scrollWheelZoom: true,
        preferCanvas: false,
      });

      mapRef.current = map;
      console.log('[ShipmentMap init] Map initialized successfully');

      // Add tile layer
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors',
        maxZoom: 19,
      }).addTo(map);

      // Wait for map to fully load before signaling ready
      map.whenReady(() => {
        console.log('[ShipmentMap init] Map is fully ready');
        setIsMapReady(true);
      });
    });

    return () => {
      // Cleanup on unmount
      console.log('[ShipmentMap] Cleaning up map');

      // Cancel all animations
      animationFramesRef.current.forEach(frameId => cancelAnimationFrame(frameId));
      animationFramesRef.current.clear();

      // Clear all timeouts
      timeoutsRef.current.forEach(timeout => clearTimeout(timeout));
      timeoutsRef.current.clear();

      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, [isClient]);

  useEffect(() => {
    console.log('[ShipmentMap useEffect] Running with:', {
      isMapReady,
      shipmentsLength: shipments.length,
      shipmentIds: shipments.map(s => s.id)
    });

    if (!isMapReady || !mapRef.current) {
      console.log('[ShipmentMap useEffect] Early return - map not ready');
      return;
    }

    // Check if shipments have actually changed
    const currentShipmentIds = shipments.map(s => s.id).sort().join(',');
    if (currentShipmentIds === lastShipmentIdsRef.current && shipments.length > 0) {
      console.log('[ShipmentMap useEffect] Shipments unchanged, skipping re-render');
      return;
    }

    console.log('[ShipmentMap useEffect] Shipments changed - OLD:', lastShipmentIdsRef.current, 'NEW:', currentShipmentIds);
    lastShipmentIdsRef.current = currentShipmentIds;

    const map = mapRef.current;

    // Import Leaflet dynamically
    import('leaflet').then((L) => {
      console.log('[ShipmentMap] Leaflet loaded, processing', shipments.length, 'shipments');

      // Process shipments immediately
      processShipments(L, map, shipments);
    });

    function processShipments(L: any, map: any, shipments: ShipmentMapData[]) {
      console.log('[ShipmentMap processShipments] Starting to process', shipments.length, 'shipments');

      // Get current shipment IDs
      const currentIds = new Set(shipments.map(s => s.id));
      const existingIds = new Set(markersRef.current.keys());

      // Remove shipments that no longer exist
      existingIds.forEach(id => {
        if (!currentIds.has(id)) {
          console.log('[ShipmentMap] Removing shipment:', id);

          // Cancel animation
          const frameId = animationFramesRef.current.get(id);
          if (frameId) {
            cancelAnimationFrame(frameId);
            animationFramesRef.current.delete(id);
          }

          // Clear timeout
          const timeout = timeoutsRef.current.get(id);
          if (timeout) {
            clearTimeout(timeout);
            timeoutsRef.current.delete(id);
          }

          // Remove marker safely
          const marker = markersRef.current.get(id);
          if (marker) {
            try {
              if (map.hasLayer(marker)) {
                map.removeLayer(marker);
              }
            } catch (e) {
              console.warn('[ShipmentMap] Error removing marker:', e);
            }
            markersRef.current.delete(id);
          }
        }
      });

      // Create plane icon
      const planeIcon = L.divIcon({
        html: `<svg width="24" height="24" viewBox="0 0 24 24" fill="#1a2d5a" stroke="#fff" stroke-width="1.5">
          <path d="M17.8 19.2L16 11l3.5-3.5C21 6 21 4 21 4s-2 0-3.5 1.5L14 9 5.8 7.2c-.5-.1-.9.1-1.1.5l-.3.5c-.2.5-.1 1 .3 1.3L9 12l-2 3H4l-1 1 3 2 2 3 1-1v-3l3-2 3.5 3.3c.3.4.8.5 1.3.3l.5-.2c.4-.3.6-.7.5-1.2z"/>
        </svg>`,
        className: 'plane-marker',
        iconSize: [24, 24],
        iconAnchor: [12, 12],
      });

      const bounds: any[] = [];

      // Add or update shipments
      shipments.forEach((shipment, index) => {
        const origin: [number, number] = [shipment.originLat, shipment.originLng];
        const dest: [number, number] = [shipment.destLat, shipment.destLng];

        console.log('[ShipmentMap] Processing shipment:', shipment.id, shipment.awbNumber, 'from', origin, 'to', dest);

        bounds.push(origin, dest);

        // Skip if marker already exists and is animating
        if (markersRef.current.has(shipment.id)) {
          console.log('[ShipmentMap] Shipment', shipment.id, 'already exists, skipping');
          return;
        }

        console.log('[ShipmentMap] Creating NEW plane for', shipment.awbNumber);

        // Draw flight path
        const pathColor = shipment.status === 'in_transit' ? '#0ea5e9' :
                         shipment.status === 'delayed' ? '#ef4444' : '#8b5cf6';

        const pathLine = L.polyline([origin, dest], {
          color: pathColor,
          weight: 2,
          opacity: 0.6,
          dashArray: '5, 10',
        }).addTo(map);

        console.log('[ShipmentMap] Flight path added for', shipment.awbNumber);

        // Create animated plane marker
        const marker = L.marker(origin, { icon: planeIcon }).addTo(map);

        console.log('[ShipmentMap] Plane marker created and added to map at origin:', origin);

        // Bind popup
        marker.bindPopup(`
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

        // Store marker
        markersRef.current.set(shipment.id, marker);

        // Add click handler
        marker.on('click', () => {
          router.push(`/shipments/${shipment.id}`);
        });

        // Calculate distance for duration (longer routes = longer animation)
        const distance = Math.sqrt(
          Math.pow(dest[0] - origin[0], 2) + Math.pow(dest[1] - origin[1], 2)
        );
        const baseDuration = 25000; // 25 seconds base
        const duration = Math.max(baseDuration, Math.min(baseDuration * (distance / 50), 45000)); // 25-45 seconds

        console.log('[ShipmentMap] Animation duration for', shipment.awbNumber, ':', duration, 'ms (distance:', distance.toFixed(2), ')');

        let animationStartTime = Date.now();

        const animate = () => {
          if (!markersRef.current.has(shipment.id)) {
            console.log('[ShipmentMap] Animation stopped - marker removed for', shipment.awbNumber);
            return;
          }

          const now = Date.now();
          const elapsed = now - animationStartTime;
          const progress = Math.min(elapsed / duration, 1);

          // Linear interpolation for smooth, steady movement
          const currentLat = origin[0] + (dest[0] - origin[0]) * progress;
          const currentLng = origin[1] + (dest[1] - origin[1]) * progress;

          // Log every 5% progress
          if (Math.floor(progress * 20) !== Math.floor(((progress - 0.01) * 20))) {
            console.log('[ShipmentMap] Animating', shipment.awbNumber, '- Progress:', (progress * 100).toFixed(1) + '%', 'Position:', [currentLat.toFixed(4), currentLng.toFixed(4)]);
          }

          // Update marker position safely
          try {
            const currentMarker = markersRef.current.get(shipment.id);
            if (currentMarker) {
              currentMarker.setLatLng([currentLat, currentLng]);

              // Calculate rotation angle to face the destination
              const angle = Math.atan2(dest[1] - origin[1], dest[0] - origin[0]) * (180 / Math.PI);
              const markerElement = currentMarker.getElement();
              if (markerElement) {
                markerElement.style.transform = `rotate(${angle}deg)`;
              }
            }
          } catch (e) {
            console.warn('[ShipmentMap] Error updating marker position:', e);
            return;
          }

          // Continue animation if not complete
          if (progress < 1) {
            const frameId = requestAnimationFrame(animate);
            animationFramesRef.current.set(shipment.id, frameId);
          } else {
            // Reached destination - loop back to origin
            console.log('[ShipmentMap] Animation complete for', shipment.awbNumber, '- restarting in 3s');

            const timeout = setTimeout(() => {
              const currentMarker = markersRef.current.get(shipment.id);
              if (currentMarker) {
                currentMarker.setLatLng(origin);
                animationStartTime = Date.now();
                console.log('[ShipmentMap] Restarting animation for', shipment.awbNumber);
                const frameId = requestAnimationFrame(animate);
                animationFramesRef.current.set(shipment.id, frameId);
              }
            }, 3000);

            timeoutsRef.current.set(shipment.id, timeout);
          }
        };

        // Start animation immediately
        console.log('[ShipmentMap] Starting animation NOW for', shipment.awbNumber);
        const frameId = requestAnimationFrame(animate);
        animationFramesRef.current.set(shipment.id, frameId);

        // Add origin marker (green)
        L.circleMarker(origin, {
          radius: 6,
          fillColor: '#10b981',
          color: '#fff',
          weight: 2,
          opacity: 1,
          fillOpacity: 0.8,
        })
          .addTo(map)
          .bindPopup(`<div style="font-size: 12px; font-weight: 600;">${shipment.originIata}</div>`);

        console.log('[ShipmentMap] Origin marker added at', origin);

        // Add destination marker (red)
        L.circleMarker(dest, {
          radius: 6,
          fillColor: '#ef4444',
          color: '#fff',
          weight: 2,
          opacity: 1,
          fillOpacity: 0.8,
        })
          .addTo(map)
          .bindPopup(`<div style="font-size: 12px; font-weight: 600;">${shipment.destIata}</div>`);

        console.log('[ShipmentMap] Destination marker added at', dest);
      });

      // Fit map to show all markers
      if (bounds.length > 0) {
        try {
          console.log('[ShipmentMap] Fitting bounds to show all markers');
          map.fitBounds(bounds, { padding: [50, 50], animate: false });
        } catch (e) {
          console.warn('[ShipmentMap] Error fitting bounds:', e);
        }
      }

      console.log('[ShipmentMap] Finished processing. Active markers:', markersRef.current.size, 'Active animations:', animationFramesRef.current.size);
    }
  }, [shipments, isMapReady, router]);

  if (!isClient) {
    return (
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
    );
  }

  return (
    <div className="sl-chart-card" style={{ height: 400 }}>
      <div className="sl-chart-header">
        <div>
          <p className="sl-chart-title">Active Shipments Map</p>
          <p className="sl-chart-subtitle">{shipments.length} active shipment{shipments.length !== 1 ? 's' : ''} • Real-time flight tracking</p>
        </div>
      </div>
      <div
        ref={mapContainerRef}
        style={{
          height: 320,
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
