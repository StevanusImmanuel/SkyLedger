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
  const animationFramesRef = useRef<number[]>([]);
  const markersRef = useRef<any[]>([]);
  const lastShipmentIdsRef = useRef<string>('');

  useEffect(() => {
    setIsClient(true);
    // Import Leaflet CSS dynamically
    if (typeof window !== 'undefined') {
      import('leaflet/dist/leaflet.css');
    }
  }, []);

  useEffect(() => {
    if (!isClient || !mapContainerRef.current || mapRef.current) return;

    // Dynamically import Leaflet only on client side
    import('leaflet').then((L) => {
      if (!mapContainerRef.current || mapRef.current) return;

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
      setIsMapReady(true);
    });

    return () => {
      // Cancel all animations on cleanup
      animationFramesRef.current.forEach(id => cancelAnimationFrame(id));
      animationFramesRef.current = [];

      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, [isClient]);

  useEffect(() => {
    if (!isMapReady || shipments.length === 0) {
      return;
    }

    // Check if shipments have actually changed
    const currentShipmentIds = shipments.map(s => s.id).sort().join(',');
    if (currentShipmentIds === lastShipmentIdsRef.current) {
      return;
    }

    lastShipmentIdsRef.current = currentShipmentIds;

    const map = mapRef.current;
    if (!map) {
      return;
    }

    // Import Leaflet dynamically
    import('leaflet').then((L) => {
      // Cancel previous animations
      animationFramesRef.current.forEach(id => cancelAnimationFrame(id));
      animationFramesRef.current = [];

      // Clear existing markers and layers ONLY when shipments change
      markersRef.current.forEach(marker => {
        if (marker && map.hasLayer(marker)) {
          map.removeLayer(marker);
        }
      });
      markersRef.current = [];

      // Clear existing layers except tile layer
      map.eachLayer((layer: any) => {
        if (layer instanceof L.Marker || layer instanceof L.Polyline || layer instanceof L.CircleMarker) {
          map.removeLayer(layer);
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

      // Add shipment routes with animation
      shipments.forEach((shipment, index) => {
        const origin: [number, number] = [shipment.originLat, shipment.originLng];
        const dest: [number, number] = [shipment.destLat, shipment.destLng];

        bounds.push(origin, dest);

        // Draw flight path
        const pathColor = shipment.status === 'in_transit' ? '#0ea5e9' :
                         shipment.status === 'delayed' ? '#ef4444' : '#8b5cf6';

        L.polyline([origin, dest], {
          color: pathColor,
          weight: 2,
          opacity: 0.6,
          dashArray: '5, 10',
        }).addTo(map);

        // Create animated plane marker
        const marker = L.marker(origin, { icon: planeIcon })
          .addTo(map)
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

        // Store marker in ref
        markersRef.current.push(marker);

        // Add click handler to navigate to shipment details
        marker.on('click', () => {
          router.push(`/shipments/${shipment.id}`);
        });

        // Animate plane movement
        const duration = 30000; // 30 seconds for full journey (moderate pace)
        let animationStartTime = Date.now() + (index * 2000); // Stagger start times

        const animate = () => {
          const now = Date.now();
          const elapsed = now - animationStartTime;
          const progress = Math.min(elapsed / duration, 1);

          // Linear interpolation for smooth, steady movement
          const currentLat = origin[0] + (dest[0] - origin[0]) * progress;
          const currentLng = origin[1] + (dest[1] - origin[1]) * progress;

          // Update marker position
          marker.setLatLng([currentLat, currentLng]);

          // Calculate rotation angle to face the destination
          const angle = Math.atan2(dest[0] - origin[0], dest[1] - origin[1]) * (180 / Math.PI);
          const markerElement = marker.getElement();
          if (markerElement) {
            markerElement.style.transform = `rotate(${angle}deg)`;
          }

          // Continue animation if not complete
          if (progress < 1) {
            const frameId = requestAnimationFrame(animate);
            animationFramesRef.current.push(frameId);
          } else {
            // Reached destination - loop back to origin
            setTimeout(() => {
              marker.setLatLng(origin);
              animationStartTime = Date.now(); // Reset start time for new loop
              const newFrameId = requestAnimationFrame(animate);
              animationFramesRef.current.push(newFrameId);
            }, 2000); // Wait 2 seconds at destination before restarting
          }
        };

        // Start animation after initial delay
        const delayMs = index * 2000;

        setTimeout(() => {
          const frameId = requestAnimationFrame(animate);
          animationFramesRef.current.push(frameId);
        }, delayMs);

        // Add origin marker
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

        // Add destination marker
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
      });

      // Fit map to show all markers
      if (bounds.length > 0) {
        map.fitBounds(bounds, { padding: [50, 50] });
      }
    });
  }, [shipments, isMapReady]);

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
