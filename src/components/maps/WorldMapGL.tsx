'use client';

// ============================================================
// 3D Globe Flight Map (MapLibre GL) — SkyLedger dashboard
// Adapted from extracted-3d-map/WorldMapGL.tsx.
// Renders active shipments as planes flying along bezier arcs
// on a satellite globe. Falls back to mock planes when no
// shipment data is available.
// ============================================================

import { useEffect, useMemo, useRef, useState } from 'react';
import maplibregl from 'maplibre-gl';
import { Plus, Minus, Map, Globe } from 'lucide-react';
import 'maplibre-gl/dist/maplibre-gl.css';
import type { DashboardShipmentMapDatum } from '@/lib/map/skyLedgerMapAdapter';

const ACCENT = '#0ea5e9'; // sky blue — matches SkyLedger route/origin marker
const ACTIVE_ACCENT = '#1a2d5a'; // deep navy — system primary
const DURATION = 60000; // full route traversal cycle (ms)

const TILE_URL =
  'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}';

// Major airports used to spawn mock planes when there is no live data.
const CITIES = [
  { c: 'JFK', lat: 40.64, lng: -73.78 }, { c: 'LAX', lat: 33.94, lng: -118.4 },
  { c: 'LHR', lat: 51.47, lng: -0.46 }, { c: 'CDG', lat: 49.0, lng: 2.55 },
  { c: 'DXB', lat: 25.25, lng: 55.36 }, { c: 'SIN', lat: 1.36, lng: 103.99 },
  { c: 'HND', lat: 35.55, lng: 139.78 }, { c: 'SYD', lat: -33.94, lng: 151.18 },
  { c: 'GRU', lat: -23.43, lng: -46.47 }, { c: 'JNB', lat: -26.13, lng: 28.24 },
  { c: 'HKG', lat: 22.31, lng: 113.91 }, { c: 'FRA', lat: 50.03, lng: 8.56 },
  { c: 'DEL', lat: 28.56, lng: 77.1 }, { c: 'ICN', lat: 37.46, lng: 126.44 },
  { c: 'CGK', lat: -6.13, lng: 106.65 }, { c: 'IST', lat: 41.27, lng: 28.75 },
  { c: 'YYZ', lat: 43.68, lng: -79.61 }, { c: 'MEX', lat: 19.44, lng: -99.07 },
];

type Plane = {
  callsign: string; origin: string; destination: string;
  altitude: number; speed: number; status: string;
  shipmentId?: string;
  route: { lat: number; lng: number }[];
};

function toFiniteNumber(value: number | string | null | undefined): number | null {
  if (typeof value === 'number') return Number.isFinite(value) ? value : null;
  if (typeof value === 'string' && value.trim().length > 0) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

function isValidLatLng(lat: number | null, lng: number | null): lat is number {
  return (
    lat !== null && lng !== null &&
    lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180
  );
}

// Convert dashboard shipments into planes flying along their route.
function shipmentsToPlanes(shipments: DashboardShipmentMapDatum[]): Plane[] {
  const out: Plane[] = [];
  for (const s of shipments) {
    const oLat = toFiniteNumber(s.originLat);
    const oLng = toFiniteNumber(s.originLng);
    const dLat = toFiniteNumber(s.destLat);
    const dLng = toFiniteNumber(s.destLng);
    if (!isValidLatLng(oLat, oLng) || !isValidLatLng(dLat, dLng)) continue;

    out.push({
      callsign: s.awbNumber || s.id,
      origin: s.originIata || 'ORG',
      destination: s.destIata || 'DST',
      altitude: 35000,
      speed: 480,
      status: s.status || 'In Transit',
      shipmentId: s.id,
      route: [
        { lat: oLat, lng: oLng as number },
        { lat: dLat, lng: dLng as number },
      ],
    });
  }
  return out;
}

function genPlanes(n: number): Plane[] {
  const out: Plane[] = [];
  for (let i = 0; i < n; i++) {
    const a = Math.floor(Math.random() * CITIES.length);
    let b = Math.floor(Math.random() * CITIES.length);
    while (b === a) b = Math.floor(Math.random() * CITIES.length);
    out.push({
      callsign: `SKY${300 + i}`,
      origin: CITIES[a].c,
      destination: CITIES[b].c,
      altitude: 9000 + Math.floor(Math.random() * 4000),
      speed: 440 + Math.floor(Math.random() * 120),
      status: 'In Transit',
      route: [
        { lat: CITIES[a].lat, lng: CITIES[a].lng },
        { lat: CITIES[b].lat, lng: CITIES[b].lng },
      ],
    });
  }
  return out;
}

// Build a curved (quadratic bezier) arc between two coords.
function buildArc(a: { lat: number; lng: number }, b: { lat: number; lng: number }, n = 80) {
  const dLat = b.lat - a.lat;
  const dLng = b.lng - a.lng;
  const dist = Math.hypot(dLat, dLng) || 1;
  const curve = dist * 0.18;
  const ctrl = {
    lat: (a.lat + b.lat) / 2 + (dLng / dist) * curve,
    lng: (a.lng + b.lng) / 2 - (dLat / dist) * curve,
  };
  const pts: [number, number][] = [];
  for (let i = 0; i <= n; i++) {
    const t = i / n;
    const lat = (1 - t) ** 2 * a.lat + 2 * (1 - t) * t * ctrl.lat + t * t * b.lat;
    const lng = (1 - t) ** 2 * a.lng + 2 * (1 - t) * t * ctrl.lng + t * t * b.lng;
    pts.push([lng, lat]);
  }
  return pts;
}

const PLANE_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 100 100">
  <path d="M50 8 L57 42 L92 60 L92 68 L57 56 L55 80 L66 88 L66 93 L50 88 L34 93 L34 88 L45 80 L43 56 L8 68 L8 60 L43 42 Z"
    fill="#ffffff" stroke="${ACTIVE_ACCENT}" stroke-width="3" stroke-linejoin="round"/>
  <circle cx="50" cy="34" r="4" fill="${ACCENT}"/></svg>`;

type WorldMapGLProps = {
  shipments?: DashboardShipmentMapDatum[];
};

export default function WorldMapGL({ shipments }: WorldMapGLProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const starRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const rafRef = useRef<number>(0);
  const selectedRef = useRef<number | null>(null);
  const followRef = useRef<boolean>(false);
  const zoomTargetRef = useRef<number>(4);
  const destroyedRef = useRef<boolean>(false);

  const allPlanes = useMemo<Plane[]>(() => {
    if (shipments && shipments.length > 0) {
      const live = shipmentsToPlanes(shipments);
      if (live.length > 0) return live;
    }
    return genPlanes(18);
  }, [shipments]);

  const [is3D, setIs3D] = useState(false);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    try {
      map.setProjection({ type: is3D ? 'globe' : 'mercator' } as never);
    } catch {}
  }, [is3D]);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = new maplibregl.Map({
      container: containerRef.current,
      style: {
        version: 8,
        sources: {
          satellite: {
            type: 'raster',
            tiles: [TILE_URL],
            tileSize: 256,
            maxzoom: 18,
            attribution: 'Esri World Imagery',
          },
        },
        layers: [{ id: 'satellite', type: 'raster', source: 'satellite' }],
      } as maplibregl.StyleSpecification,
      center: [10, 20],
      zoom: 1.6,
      attributionControl: false,
      canvasContextAttributes: { alpha: true, antialias: true },
    });
    mapRef.current = map;

    const onMove = () => {
      const c = map.getCenter();
      if (starRef.current)
        starRef.current.style.transform = `translate(${c.lng * 3}px, ${c.lat * 3}px) rotate(${map.getBearing() * 0.4}deg)`;
    };
    map.on('move', onMove);

    const curves = allPlanes.map((p) => buildArc(p.route[0], p.route[p.route.length - 1]));

    map.on('load', () => {
      if (is3D) { try { map.setProjection({ type: 'globe' } as never); } catch {} }
      // flat (mercator) is MapLibre's default — no call needed

      map.addSource('routes', {
        type: 'geojson',
        data: {
          type: 'FeatureCollection',
          features: curves.map((c, idx) => ({
            type: 'Feature', properties: { id: idx },
            geometry: { type: 'LineString', coordinates: c },
          })),
        } as never,
      });
      map.addLayer({ id: 'route-glow', type: 'line', source: 'routes', paint: { 'line-color': ACCENT, 'line-width': 6, 'line-opacity': 0.08, 'line-blur': 5 } });
      map.addLayer({ id: 'route-dash', type: 'line', source: 'routes', paint: { 'line-color': ACCENT, 'line-width': 1.4, 'line-opacity': 0.35, 'line-dasharray': [0, 4, 3] } });
      map.addLayer({ id: 'route-active', type: 'line', source: 'routes', filter: ['==', ['get', 'id'], -1], paint: { 'line-color': '#38bdf8', 'line-width': 2.5, 'line-opacity': 0.98 } });

      const img = new Image(48, 48);
      img.onload = () => {
        if (!map.hasImage('plane')) map.addImage('plane', img);

        map.addSource('planes', { type: 'geojson', data: { type: 'FeatureCollection', features: [] } as never });
        map.addLayer({ id: 'plane-glow', type: 'circle', source: 'planes', paint: { 'circle-radius': 12, 'circle-color': ACCENT, 'circle-opacity': 0.22, 'circle-blur': 1 } });
        map.addLayer({
          id: 'planes', type: 'symbol', source: 'planes',
          layout: { 'icon-image': 'plane', 'icon-size': 0.55, 'icon-rotate': ['get', 'bearing'], 'icon-rotation-alignment': 'map', 'icon-allow-overlap': true },
        });

        const popup = new maplibregl.Popup({ closeButton: true, closeOnClick: false, offset: 16, className: 'plane-popup' });
        popup.on('close', () => {
          selectedRef.current = null; followRef.current = false;
          if (!destroyedRef.current) { try { map.setFilter('route-active', ['==', ['get', 'id'], -1]); } catch {} }
        });

        map.on('mouseenter', 'planes', () => { map.getCanvas().style.cursor = 'pointer'; });
        map.on('mouseleave', 'planes', () => { map.getCanvas().style.cursor = ''; });
        map.on('click', 'planes', (e) => {
          const f = e.features?.[0];
          if (!f) return;
          const p = f.properties as Record<string, string | number>;
          const cc = (f.geometry as unknown as { coordinates: [number, number] }).coordinates;
          selectedRef.current = Number(p.id);
          followRef.current = false;
          zoomTargetRef.current = 4.5;
          map.setFilter('route-active', ['==', ['get', 'id'], Number(p.id)]);
          popup.setLngLat(cc).setHTML(
            `<div class="pp">
              <div class="pp-h">✈ ${p.callsign}</div>
              <div class="pp-r">${p.origin} <span>→</span> ${p.destination}</div>
              <div class="pp-stats"><div><span>ALT</span><b>${p.altitude} ft</b></div><div><span>SPD</span><b>${p.speed} kts</b></div></div>
              <div class="pp-status">${p.status}</div>
              ${p.shipmentId ? `<a href="/shipments/${p.shipmentId}" class="pp-link">View Shipment →</a>` : ''}
            </div>`
          ).addTo(map);
          map.easeTo({ center: cc, zoom: 4.5, duration: 1200 });
          map.once('moveend', () => { if (selectedRef.current !== null) followRef.current = true; });
        });

        const dashSeq = [[0,4,3],[1,4,2],[2,4,1],[3,4,0],[0,1,3,3],[0,2,3,2],[0,3,3,1]];
        let dashStep = 0;

        const animate = () => {
          const now = Date.now();
          const coords: [number, number][] = [];
          const features = curves.map((c, idx) => {
            const phase = ((now / DURATION) + idx / curves.length) % 1;
            const f = phase * (c.length - 1);
            const i = Math.floor(f);
            const t = f - i;
            const p0 = c[i];
            const p1 = c[Math.min(i + 1, c.length - 1)];
            const lng = p0[0] + (p1[0] - p0[0]) * t;
            const lat = p0[1] + (p1[1] - p0[1]) * t;
            coords[idx] = [lng, lat];
            const bearing = Math.atan2(p1[0] - p0[0], p1[1] - p0[1]) * (180 / Math.PI);
            const m = allPlanes[idx];
            return {
              type: 'Feature',
              properties: { id: idx, bearing, callsign: m.callsign, origin: m.origin, destination: m.destination, altitude: m.altitude, speed: Math.round(m.speed), status: m.status, shipmentId: m.shipmentId ?? '' },
              geometry: { type: 'Point', coordinates: [lng, lat] },
            };
          });

          (map.getSource('planes') as maplibregl.GeoJSONSource)?.setData({ type: 'FeatureCollection', features } as never);

          const sel = selectedRef.current;
          if (sel !== null && coords[sel]) {
            popup.setLngLat(coords[sel]);
            if (followRef.current) {
              const cur = map.getCenter();
              const k = 0.07;
              const nlng = cur.lng + (coords[sel][0] - cur.lng) * k;
              const nlat = cur.lat + (coords[sel][1] - cur.lat) * k;
              const nzoom = map.getZoom() + (zoomTargetRef.current - map.getZoom()) * k;
              map.jumpTo({ center: [nlng, nlat], zoom: nzoom });
            }
          }

          const ns = Math.floor((performance.now() / 220) % dashSeq.length);
          if (ns !== dashStep) {
            map.setPaintProperty('route-dash', 'line-dasharray', dashSeq[ns]);
            dashStep = ns;
          }
          rafRef.current = requestAnimationFrame(animate);
        };
        rafRef.current = requestAnimationFrame(animate);
      };
      img.src = 'data:image/svg+xml;base64,' + btoa(PLANE_SVG);
    });

    return () => {
      cancelAnimationFrame(rafRef.current);
      destroyedRef.current = true;
      map.remove();
      mapRef.current = null;
    };
  }, [allPlanes]);

  return (
    <div className="relative w-full h-full rounded-[12px] overflow-hidden border border-slate-200 bg-[#0f172a]">
      <div ref={starRef} className="pointer-events-none absolute -inset-full w-[300%] h-[300%] z-0 wm-starfield" />
      <div ref={containerRef} className="relative w-full h-full z-[1]" />
      <div className="pointer-events-none absolute inset-0 z-[386] wm-vignette" />

      {/* Zoom controls */}
      <div className="absolute bottom-4 left-4 flex flex-col gap-2 bg-white/90 backdrop-blur-md p-2 rounded-xl border border-slate-200 shadow-lg z-[400]">
        <button
          onClick={() => mapRef.current?.zoomIn()}
          className="p-2 bg-[#1a2d5a] hover:bg-[#243b6e] text-white rounded-lg transition active:scale-95"
          title="Zoom In"
        >
          <Plus size={16} />
        </button>
        <button
          onClick={() => mapRef.current?.zoomOut()}
          className="p-2 bg-[#1a2d5a] hover:bg-[#243b6e] text-white rounded-lg transition active:scale-95"
          title="Zoom Out"
        >
          <Minus size={16} />
        </button>
      </div>

      {/* Projection toggle */}
      <button
        onClick={() => setIs3D((v) => !v)}
        className="absolute bottom-4 right-4 flex items-center gap-1.5 bg-white/90 backdrop-blur-md px-3 py-2 rounded-xl border border-slate-200 shadow-lg z-[400] text-xs font-semibold text-[#1a2d5a] hover:bg-white transition active:scale-95"
        title={is3D ? 'Switch to flat map' : 'Switch to 3D globe'}
      >
        {is3D ? <Map size={14} /> : <Globe size={14} />}
        {is3D ? 'Flat map' : '3D globe'}
      </button>

      {/* Info panel */}
      <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-md text-slate-800 p-3 rounded-xl border border-slate-200 shadow-lg z-[400] max-w-xs">
        <h3 className="font-bold text-sm mb-2 flex items-center gap-2 text-[#1a2d5a]">
          <span className="w-2 h-2 rounded-full bg-[#0ea5e9] animate-ping" />
          SkyLedger Flight Radar
        </h3>
        <p className="text-[#0ea5e9] text-[11px] font-semibold">Active aircraft: {allPlanes.length}</p>
        <p className="text-slate-500 text-[10px] mt-1">Click a plane to follow &middot; drag to rotate</p>
      </div>

      {/* Live badge */}
      <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-md px-3 py-2 rounded-full shadow-lg border border-slate-200 z-[400] flex items-center gap-2">
        <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
        <span className="text-xs font-bold text-[#1a2d5a] tracking-wide">LIVE</span>
      </div>

      <style>{`
        .maplibregl-canvas { background: transparent !important; }
        .maplibregl-ctrl-attrib { display: none !important; }
        .wm-starfield {
          background-color: transparent;
          background-image:
            radial-gradient(1px 1px at 25px 35px, rgba(255,255,255,0.5), transparent),
            radial-gradient(1px 1px at 80px 120px, rgba(255,255,255,0.35), transparent),
            radial-gradient(1.5px 1.5px at 160px 60px, rgba(255,255,255,0.45), transparent),
            radial-gradient(1px 1px at 200px 180px, rgba(255,255,255,0.3), transparent),
            radial-gradient(1px 1px at 120px 220px, rgba(186,230,253,0.5), transparent),
            radial-gradient(1.5px 1.5px at 300px 280px, rgba(255,255,255,0.4), transparent),
            radial-gradient(1px 1px at 360px 90px, rgba(255,255,255,0.3), transparent),
            radial-gradient(1px 1px at 340px 200px, rgba(255,255,255,0.25), transparent);
          background-repeat: repeat;
          background-size: 400px 400px;
        }
        .wm-vignette { box-shadow: inset 0 0 120px 24px rgba(15,23,42,0.82); }
        .plane-popup .maplibregl-popup-content {
          background: rgba(255,255,255,0.97);
          backdrop-filter: blur(8px);
          border: 1px solid #e2e8f0;
          border-radius: 10px;
          color: #1e293b;
          padding: 10px 12px;
          box-shadow: 0 8px 28px rgba(15,23,42,0.15);
        }
        .plane-popup .maplibregl-popup-tip { border-top-color: rgba(255,255,255,0.97); }
        .plane-popup .maplibregl-popup-close-button { color: #64748b; font-size: 16px; }
        .pp-h { font-weight: 800; font-size: 13px; color: #1a2d5a; margin-bottom: 2px; }
        .pp-r { font-size: 11px; color: #475569; margin-bottom: 6px; }
        .pp-r span { color: #0ea5e9; }
        .pp-stats { display: flex; gap: 14px; }
        .pp-stats span { display: block; font-size: 9px; color: #94a3b8; letter-spacing: .5px; text-transform: uppercase; }
        .pp-stats b { font-size: 12px; color: #1e293b; }
        .pp-status { font-size: 10px; color: #0ea5e9; margin-top: 4px; text-transform: capitalize; font-weight: 600; }
        .pp-link { display: inline-block; margin-top: 8px; font-size: 11px; font-weight: 600; color: #fff; background: #1a2d5a; padding: 5px 12px; border-radius: 6px; text-decoration: none; transition: background 0.15s; }
        .pp-link:hover { background: #243b6e; }
      `}</style>
    </div>
  );
}
