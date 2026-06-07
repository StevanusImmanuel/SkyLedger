'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import maplibregl from 'maplibre-gl';
import * as turf from '@turf/turf';
import 'maplibre-gl/dist/maplibre-gl.css';

type ShipmentMapData = {
  id: string;
  awbNumber: string;
  originLat: number;
  originLng: number;
  originIata: string;
  originName: string;
  originCountry: string;
  destLat: number;
  destLng: number;
  destIata: string;
  destName: string;
  destCountry: string;
  status: string;
  deliveryStatus: string;
  flightNumber: string;
  departureTime: string;
  arrivalTime: string;
  estimatedDelivery: string | null;
  weightKg: number;
};

type ShipmentMapProps = {
  shipments: ShipmentMapData[];
};

function ShipmentMapComponent({ shipments }: ShipmentMapProps) {
  const mapRef = useRef<maplibregl.Map | null>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const [isClient, setIsClient] = useState(false);
  const [isMapReady, setIsMapReady] = useState(false);
  const routeCacheRef = useRef<Record<string, any>>({});

  useEffect(() => {
    setIsClient(true);
  }, []);

  // Initialize Map
  useEffect(() => {
    if (!isClient || !mapContainerRef.current || mapRef.current) return;

    console.log('[ShipmentMap] Initializing MapLibre 3D Globe');

    const map = new maplibregl.Map({
      container: mapContainerRef.current,
      style: 'https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json',
      center: [15, 25],
      zoom: 1.6,
      pitch: 25,
    });

    mapRef.current = map;

    map.on('load', () => {
      console.log('[ShipmentMap] Map loaded, setting up globe projection and sky');
      
      // Force Globe projection
      map.setProjection({
        type: 'globe',
      });

      // Add Terrain support
      map.addSource('terrain-source', {
        type: 'raster-dem',
        tiles: ['https://demotiles.maplibre.org/terrain-tiles/{z}/{x}/{y}.png'],
        tileSize: 256,
        maxzoom: 14,
      });
      map.setTerrain({ source: 'terrain-source', exaggeration: 1.0 });

      // Note: MapLibre GL v5 natively renders the atmospheric sky on globe projection without a custom sky layer.

      // Draw and register customized plane symbol canvases
      registerPlaneIcons(map);

      // Set up sources and layers
      setupLayers(map);

      setIsMapReady(true);
    });

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, [isClient]);

  // Setup static sources and layers
  const setupLayers = (map: maplibregl.Map) => {
    // Geodesic Routes Layer
    map.addSource('routes-source', {
      type: 'geojson',
      data: { type: 'FeatureCollection', features: [] },
    });
    map.addLayer({
      id: 'routes-layer',
      type: 'line',
      source: 'routes-source',
      paint: {
        'line-color': '#6366f1',
        'line-width': 1.5,
        'line-opacity': 0.35,
        'line-dasharray': [4, 4],
      },
    });

    // Airport circles Layer
    map.addSource('airports-source', {
      type: 'geojson',
      data: { type: 'FeatureCollection', features: [] },
    });
    map.addLayer({
      id: 'airports-layer',
      type: 'circle',
      source: 'airports-source',
      paint: {
        'circle-radius': 4.5,
        'circle-color': ['get', 'color'],
        'circle-stroke-width': 1.5,
        'circle-stroke-color': '#0f172a',
      },
    });

    // Aircraft dynamic Layer
    map.addSource('aircraft-source', {
      type: 'geojson',
      data: { type: 'FeatureCollection', features: [] },
    });
    map.addLayer({
      id: 'aircraft-layer',
      type: 'symbol',
      source: 'aircraft-source',
      layout: {
        'icon-image': [
          'coalesce',
          ['concat', 'plane-', ['get', 'deliveryStatus']],
          'plane-default',
        ],
        'icon-size': 0.5,
        'icon-rotate': ['get', 'bearing'],
        'icon-rotation-alignment': 'map',
        'icon-allow-overlap': true,
        'icon-ignore-placement': true,
      },
    });
  };

  // Canvas drawing for glowing status plane markers with radar pulsing animations
  const registerPlaneIcons = (map: maplibregl.Map) => {
    const statuses = [
      'booked',
      'received_at_warehouse',
      'security_cleared',
      'manifested',
      'departed',
      'transshipment',
    ] as const;

    statuses.forEach((status) => {
      let color = '#a855f7'; // purple default
      let isMoving = false;
      if (status === 'departed' || status === 'transshipment') {
        color = '#0ea5e9'; // bright sky blue
        isMoving = true;
      }

      const size = 64;
      const pulsingIcon = {
        width: size,
        height: size,
        data: new Uint8Array(size * size * 4),
        context: null as CanvasRenderingContext2D | null,

        onAdd: function () {
          const canvas = document.createElement('canvas');
          canvas.width = this.width;
          canvas.height = this.height;
          this.context = canvas.getContext('2d');
        },

        render: function () {
          const duration = 1200;
          const t = (performance.now() % duration) / duration;
          const ctx = this.context;
          if (!ctx) return false;

          ctx.clearRect(0, 0, this.width, this.height);

          // Draw radar wave pulse for moving aircraft
          if (isMoving) {
            const maxRadius = (size / 2) * 0.85;
            const minRadius = (size / 2) * 0.25;
            const currentRadius = minRadius + (maxRadius - minRadius) * t;

            ctx.beginPath();
            ctx.arc(size / 2, size / 2, currentRadius, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(14, 165, 233, ${0.45 * (1 - t)})`;
            ctx.fill();

            // Inner secondary ring
            const innerRadius = minRadius + (maxRadius - minRadius) * ((t + 0.5) % 1.0);
            ctx.beginPath();
            ctx.arc(size / 2, size / 2, innerRadius, 0, Math.PI * 2);
            ctx.strokeStyle = `rgba(14, 165, 233, ${0.25 * (1 - ((t + 0.5) % 1.0))})`;
            ctx.lineWidth = 1.5;
            ctx.stroke();
          }

          // Center airplane icon drawing
          ctx.shadowColor = color;
          ctx.shadowBlur = 4;
          ctx.fillStyle = color;
          ctx.strokeStyle = '#ffffff';
          ctx.lineWidth = 2.5;

          ctx.beginPath();
          ctx.moveTo(32, 14);
          ctx.lineTo(36, 28);
          ctx.lineTo(52, 34);
          ctx.lineTo(36, 37);
          ctx.lineTo(32, 50);
          ctx.lineTo(28, 37);
          ctx.lineTo(12, 34);
          ctx.lineTo(28, 28);
          ctx.closePath();
          ctx.fill();
          ctx.stroke();

          this.data = ctx.getImageData(0, 0, this.width, this.height).data as any;
          return true;
        },
      };

      if (!map.hasImage(`plane-${status}`)) {
        map.addImage(`plane-${status}`, pulsingIcon as any);
      }
    });

    // Default icon
    const size = 64;
    const defaultIcon = {
      width: size,
      height: size,
      data: new Uint8Array(size * size * 4),
      context: null as CanvasRenderingContext2D | null,

      onAdd: function () {
        const canvas = document.createElement('canvas');
        canvas.width = this.width;
        canvas.height = this.height;
        this.context = canvas.getContext('2d');
      },

      render: function () {
        const ctx = this.context;
        if (!ctx) return false;

        ctx.clearRect(0, 0, this.width, this.height);

        ctx.shadowColor = '#6366f1';
        ctx.shadowBlur = 4;
        ctx.fillStyle = '#6366f1';
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2.5;

        ctx.beginPath();
        ctx.moveTo(32, 14);
        ctx.lineTo(36, 28);
        ctx.lineTo(52, 34);
        ctx.lineTo(36, 37);
        ctx.lineTo(32, 50);
        ctx.lineTo(28, 37);
        ctx.lineTo(12, 34);
        ctx.lineTo(28, 28);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        this.data = ctx.getImageData(0, 0, this.width, this.height).data as any;
        return true;
      },
    };

    if (!map.hasImage('plane-default')) {
      map.addImage('plane-default', defaultIcon as any);
    }
  };

  // Sync routes and airport dots when shipments array updates
  useEffect(() => {
    if (!isMapReady || !mapRef.current) return;
    const map = mapRef.current;

    console.log('[ShipmentMap] Updating route geometries, count:', shipments.length);

    const routeFeatures: any[] = [];
    const airportFeaturesMap: Record<string, any> = {};

    shipments.forEach((shipment) => {
      // Get or compute Great Circle LineString
      let routeGeoJSON = routeCacheRef.current[shipment.id];
      if (!routeGeoJSON) {
        try {
          const start = [shipment.originLng, shipment.originLat];
          const end = [shipment.destLng, shipment.destLat];
          routeGeoJSON = turf.greatCircle(start, end, {
            properties: { id: shipment.id },
          });
          routeCacheRef.current[shipment.id] = routeGeoJSON;
        } catch (err) {
          console.error('[ShipmentMap] Turf curve error for AWB:', shipment.awbNumber, err);
          return;
        }
      }

      routeFeatures.push(routeGeoJSON);

      // Unique Airport dots
      airportFeaturesMap[`org-${shipment.originIata}`] = {
        type: 'Feature',
        geometry: { type: 'Point', coordinates: [shipment.originLng, shipment.originLat] },
        properties: {
          iata: shipment.originIata,
          name: shipment.originName,
          country: shipment.originCountry,
          color: '#10b981', // green
        },
      };

      airportFeaturesMap[`dst-${shipment.destIata}`] = {
        type: 'Feature',
        geometry: { type: 'Point', coordinates: [shipment.destLng, shipment.destLat] },
        properties: {
          iata: shipment.destIata,
          name: shipment.destName,
          country: shipment.destCountry,
          color: '#ef4444', // red
        },
      };
    });

    const routesSrc = map.getSource('routes-source') as maplibregl.GeoJSONSource;
    if (routesSrc) {
      routesSrc.setData({
        type: 'FeatureCollection',
        features: routeFeatures,
      });
    }

    const airportsSrc = map.getSource('airports-source') as maplibregl.GeoJSONSource;
    if (airportsSrc) {
      airportsSrc.setData({
        type: 'FeatureCollection',
        features: Object.values(airportFeaturesMap),
      });
    }

    // Zoom map to show all coordinates
    if (shipments.length > 0) {
      const bounds = new maplibregl.LngLatBounds();
      shipments.forEach((s) => {
        bounds.extend([s.originLng, s.originLat]);
        bounds.extend([s.destLng, s.destLat]);
      });
      map.fitBounds(bounds, { padding: 40, maxZoom: 3.5 });
    }
  }, [shipments, isMapReady]);

  // Telemetry Position Simulation Loop (60fps)
  useEffect(() => {
    if (!isMapReady || !mapRef.current || shipments.length === 0) return;
    const map = mapRef.current;

    let animFrameId: number;

    const animatePlanes = () => {
      const aircraftFeatures: any[] = [];

      shipments.forEach((shipment) => {
        const routeGeoJSON = routeCacheRef.current[shipment.id];
        if (!routeGeoJSON) return;

        // Progress = (now - dep) / (arr - dep)
        const depTimeParsed = shipment.departureTime ? new Date(shipment.departureTime).getTime() : NaN;
        const arrTimeParsed = shipment.arrivalTime ? new Date(shipment.arrivalTime).getTime() : NaN;

        let progress = 0.5; // fallback to midpoint if times are invalid
        if (!isNaN(depTimeParsed) && !isNaN(arrTimeParsed)) {
          const totalDuration = arrTimeParsed - depTimeParsed;
          if (totalDuration > 0) {
            progress = (Date.now() - depTimeParsed) / totalDuration;
            progress = Math.max(0, Math.min(1, progress));
          }
        }

        if (isNaN(progress)) {
          progress = 0.5;
        }

        // Flatten MultiLineString to LineString for Turf geometry calculations (e.g. crossings at the 180th meridian)
        let calculationLine = routeGeoJSON;
        if (routeGeoJSON.geometry.type === 'MultiLineString') {
          try {
            calculationLine = turf.lineString(routeGeoJSON.geometry.coordinates.flat(1));
          } catch (err) {
            console.error('[ShipmentMap] Error flattening line for trajectory calculation:', shipment.awbNumber, err);
          }
        }

        try {
          const lineDistance = turf.length(calculationLine);
          const targetDistance = lineDistance * progress;

          // Get exact point coordinate along Turf line
          const point = turf.along(calculationLine, targetDistance);
          const [lng, lat] = point.geometry.coordinates;

          // Calculate precise rotation tangent heading using raw coordinate arrays
          const lookaheadDistance = Math.min(targetDistance + 0.05, lineDistance);
          const lookaheadPoint = turf.along(calculationLine, lookaheadDistance);

          let bearing = 0;
          if (progress < 1) {
            bearing = turf.bearing(point.geometry.coordinates, lookaheadPoint.geometry.coordinates);
          } else {
            const prevDistance = Math.max(0, lineDistance - 0.05);
            const prevPoint = turf.along(calculationLine, prevDistance);
            bearing = turf.bearing(prevPoint.geometry.coordinates, point.geometry.coordinates);
          }

          aircraftFeatures.push({
            type: 'Feature',
            geometry: {
              type: 'Point',
              coordinates: [lng, lat],
            },
            properties: {
              ...shipment,
              progress: Math.round(progress * 100),
              bearing,
            },
          });
        } catch (err) {
          console.error('[ShipmentMap] Animation frame calculation failed for:', shipment.awbNumber, err);
        }
      });

      const aircraftSrc = map.getSource('aircraft-source') as maplibregl.GeoJSONSource;
      if (aircraftSrc) {
        aircraftSrc.setData({
          type: 'FeatureCollection',
          features: aircraftFeatures,
        });
      }

      animFrameId = requestAnimationFrame(animatePlanes);
    };

    animFrameId = requestAnimationFrame(animatePlanes);

    return () => {
      cancelAnimationFrame(animFrameId);
    };
  }, [shipments, isMapReady]);

  // Click handler and custom styled popups with NextJS client-side soft routing
  useEffect(() => {
    if (!isMapReady || !mapRef.current) return;
    const map = mapRef.current;

    const handleAircraftClick = (e: any) => {
      const features = map.queryRenderedFeatures(e.point, { layers: ['aircraft-layer'] });
      if (!features.length) return;

      const f = features[0];
      const p = f.properties;

      const depTimeStr = new Date(p.departureTime).toLocaleString();
      const arrTimeStr = new Date(p.arrivalTime).toLocaleString();

      const htmlContent = `
        <div class="sl-map-popup" style="width: 250px; font-family: inherit;">
          <div style="border-bottom: 1px solid rgba(255, 255, 255, 0.1); padding-bottom: 6px; margin-bottom: 8px;">
            <div style="font-size: 9px; text-transform: uppercase; color: #94a3b8; font-weight: 700; letter-spacing: 0.5px;">Airway Bill</div>
            <div style="font-size: 14px; font-weight: 800; color: #ffffff; display: flex; align-items: center; justify-content: space-between;">
              <span>${p.awbNumber}</span>
              <span style="font-size: 9px; padding: 2px 6px; border-radius: 4px; background: #1a2d5a; color: #38bdf8; font-weight: 700;">
                ${p.deliveryStatus.replace(/_/g, ' ').toUpperCase()}
              </span>
            </div>
          </div>
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px; font-size: 11px; color: #cbd5e1; margin-bottom: 8px;">
            <div>
              <span style="color: #94a3b8; display: block; font-size: 9px; text-transform: uppercase; margin-bottom: 2px;">Origin</span>
              <strong>${p.originIata}</strong>
              <span style="display: block; font-size: 9.5px; opacity: 0.85; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${p.originName}</span>
            </div>
            <div>
              <span style="color: #94a3b8; display: block; font-size: 9px; text-transform: uppercase; margin-bottom: 2px;">Destination</span>
              <strong>${p.destIata}</strong>
              <span style="display: block; font-size: 9.5px; opacity: 0.85; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${p.destName}</span>
            </div>
          </div>
          <div style="border-top: 1px solid rgba(255, 255, 255, 0.06); padding-top: 6px; font-size: 11px; color: #cbd5e1; display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-bottom: 8px;">
            <div>
              <span style="color: #94a3b8; display: block; font-size: 9px; text-transform: uppercase; margin-bottom: 2px;">Aircraft ID</span>
              <strong>${p.flightNumber}</strong>
            </div>
            <div>
              <span style="color: #94a3b8; display: block; font-size: 9px; text-transform: uppercase; margin-bottom: 2px;">Cargo Weight</span>
              <strong>${p.weightKg.toLocaleString()} kg</strong>
            </div>
          </div>
          <div style="border-top: 1px solid rgba(255, 255, 255, 0.06); padding-top: 6px; font-size: 10.5px; color: #cbd5e1; margin-bottom: 8px;">
            <div style="margin-bottom: 3px;">
              <span style="color: #94a3b8; display: inline-block; width: 60px;">Departure:</span>
              <strong>${depTimeStr}</strong>
            </div>
            <div>
              <span style="color: #94a3b8; display: inline-block; width: 60px;">Arrival:</span>
              <strong>${arrTimeStr}</strong>
            </div>
          </div>
          <div style="border-top: 1px solid rgba(255, 255, 255, 0.06); padding-top: 6px; margin-bottom: 10px;">
            <div style="display: flex; justify-content: space-between; font-size: 10px; color: #94a3b8; font-weight: 700; margin-bottom: 4px;">
              <span>FLIGHT PROGRESS</span>
              <span>${p.progress}%</span>
            </div>
            <div style="width: 100%; height: 5px; background: rgba(255, 255, 255, 0.1); border-radius: 3px; overflow: hidden;">
              <div style="width: ${p.progress}%; height: 100%; background: #38bdf8; border-radius: 3px;"></div>
            </div>
          </div>
          <div style="text-align: right;">
            <button id="btn-popup-inspect-${p.id}" class="sl-popup-btn" style="background: #0ea5e9; color: #ffffff; border: none; padding: 5px 10px; border-radius: 4px; font-size: 10px; font-weight: 800; cursor: pointer; text-transform: uppercase; letter-spacing: 0.5px; transition: background 0.2s;">
              Inspect Manifest
            </button>
          </div>
        </div>
      `;

      new maplibregl.Popup({ closeButton: true, closeOnClick: true })
        .setLngLat(e.lngLat)
        .setHTML(htmlContent)
        .addTo(map);
    };

    const handleMouseEnter = () => { map.getCanvas().style.cursor = 'pointer'; };
    const handleMouseLeave = () => { map.getCanvas().style.cursor = ''; };

    map.on('click', 'aircraft-layer', handleAircraftClick);
    map.on('mouseenter', 'aircraft-layer', handleMouseEnter);
    map.on('mouseleave', 'aircraft-layer', handleMouseLeave);

    // Global document click event delegation for soft router routing
    const onInspectClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (target && target.id && target.id.startsWith('btn-popup-inspect-')) {
        const shipmentId = target.id.replace('btn-popup-inspect-', '');
        router.push(`/shipments/${shipmentId}`);
      }
    };

    document.addEventListener('click', onInspectClick);

    return () => {
      if (mapRef.current) {
        map.off('click', 'aircraft-layer', handleAircraftClick);
        map.off('mouseenter', 'aircraft-layer', handleMouseEnter);
        map.off('mouseleave', 'aircraft-layer', handleMouseLeave);
      }
      document.removeEventListener('click', onInspectClick);
    };
  }, [isMapReady]);

  if (!isClient) {
    return (
      <div className="sl-chart-card" style={{ height: 420 }}>
        <div className="sl-chart-header">
          <div>
            <p className="sl-chart-title">Global Fleet Telemetry Map</p>
            <p className="sl-chart-subtitle">Real-time time-progress 3D Globe tracking</p>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 340 }}>
          <p style={{ color: '#94a3b8', fontSize: 13 }}>Initializing 3D flight canvas...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="sl-chart-card" style={{ height: 420, marginBottom: 20 }}>
      <div className="sl-chart-header" style={{ marginBottom: 12 }}>
        <div>
          <p className="sl-chart-title">Global Fleet Telemetry Map</p>
          <p className="sl-chart-subtitle">Real-time time-progress 3D Globe tracking</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#10b981', display: 'inline-block' }}></span>
            <span style={{ fontSize: 10.5, color: '#94a3b8', fontWeight: 600 }}>Origin Hub</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#ef4444', display: 'inline-block' }}></span>
            <span style={{ fontSize: 10.5, color: '#94a3b8', fontWeight: 600 }}>Destination Hub</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, borderLeft: '1px solid rgba(255,255,255,0.1)', paddingLeft: 12 }}>
            <span style={{ fontSize: 11, color: '#38bdf8', fontWeight: 700 }}>
              {shipments.length} Active Flight{shipments.length !== 1 ? 's' : ''}
            </span>
          </div>
        </div>
      </div>
      <div
        ref={mapContainerRef}
        style={{
          height: 340,
          borderRadius: 8,
          overflow: 'hidden',
          background: '#090d16',
        }}
      />
      <style jsx global>{`
        .maplibregl-popup-content {
          background: #0b1329 !important;
          border: 1px solid rgba(56, 189, 248, 0.2);
          box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.5), 0 8px 10px -6px rgba(0, 0, 0, 0.5);
          border-radius: 8px !important;
          padding: 12px 14px 10px 14px !important;
          color: #ffffff;
        }
        .maplibregl-popup-anchor-top .maplibregl-popup-tip {
          border-bottom-color: #0b1329 !important;
        }
        .maplibregl-popup-anchor-bottom .maplibregl-popup-tip {
          border-top-color: #0b1329 !important;
        }
        .maplibregl-popup-anchor-left .maplibregl-popup-tip {
          border-right-color: #0b1329 !important;
        }
        .maplibregl-popup-anchor-right .maplibregl-popup-tip {
          border-left-color: #0b1329 !important;
        }
        .maplibregl-popup-close-button {
          color: #94a3b8 !important;
          padding: 4px 6px !important;
          font-size: 14px !important;
          font-weight: 700;
          outline: none;
        }
        .maplibregl-popup-close-button:hover {
          color: #ffffff !important;
          background: transparent !important;
        }
        .sl-popup-btn:hover {
          background: #0284c7 !important;
        }
      `}</style>
    </div>
  );
}

// Export with ssr disabled
export const ShipmentMap = dynamic(() => Promise.resolve(ShipmentMapComponent), {
  ssr: false,
  loading: () => (
    <div className="sl-chart-card" style={{ height: 420 }}>
      <div className="sl-chart-header">
        <div>
          <p className="sl-chart-title">Global Fleet Telemetry Map</p>
          <p className="sl-chart-subtitle">Real-time time-progress 3D Globe tracking</p>
        </div>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 340 }}>
        <p style={{ color: '#94a3b8', fontSize: 13 }}>Loading 3D flight canvas...</p>
      </div>
    </div>
  ),
});
