'use client';

// ============================================================
// EXTRACTED: 3D Globe Flight Map (MapLibre GL)
// Source: components/WorldMapLeaflet.tsx (Altus project)
// NOTE: Uses MapLibre GL, NOT Leaflet. Renamed for clarity.
//
// Install:  npm install maplibre-gl lucide-react
// Usage (Next.js):
//   const WorldMapGL = dynamic(() => import('./WorldMapGL'), { ssr: false });
// Container MUST have explicit width/height.
// ============================================================

import { useEffect, useRef } from 'react';
import maplibregl from 'maplibre-gl';
import { mockAircraft } from './data/mockAircraft';
import { Plus, Minus } from 'lucide-react';
import 'maplibre-gl/dist/maplibre-gl.css';

const ACCENT = '#22d3ee';
const DURATION = 60000; // full route traversal cycle (ms)

// Tile source — swap this URL to change basemap provider.
// Free alternatives: OSM, MapTiler (key), Stadia (key).
const TILE_URL =
  'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}';

// Major airports used to spawn extra random planes
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
  altitude: number; speed: number; route: { lat: number; lng: number }[];
};

function genPlanes(n: number): Plane[] {
  const out: Plane[] = [];
  for (let i = 0; i < n; i++) {
    let a = Math.floor(Math.random() * CITIES.length);
    let b = Math.floor(Math.random() * CITIES.length);
    while (b === a) b = Math.floor(Math.random() * CITIES.length);
    out.push({
      callsign: `ALTUS${300 + i}`,
      origin: CITIES[a].c,
      destination: CITIES[b].c,
      altitude: 9000 + Math.floor(Math.random() * 4000),
      speed: 440 + Math.floor(Math.random() * 120),
      route: [{ lat: CITIES[a].lat, lng: CITIES[a].lng }, { lat: CITIES[b].lat, lng: CITIES[b].lng }],
    });
  }
  return out;
}

const allPlanes: Plane[] = [...(mockAircraft as unknown as Plane[]), ...genPlanes(22)];

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
    fill="#f8fafc" stroke="${ACCENT}" stroke-width="3" stroke-linejoin="round"/>
  <circle cx="50" cy="34" r="4" fill="${ACCENT}"/></svg>`;

export default function WorldMapGL() {
  const containerRef = useRef<HTMLDivElement>(null);
  const starRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const rafRef = useRef<number>(0);
  const selectedRef = useRef<number | null>(null);
  const followRef = useRef<boolean>(false);
  const zoomTargetRef = useRef<number>(4);
  const destroyedRef = useRef<boolean>(false);

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

    // Starfield parallax on map move
    const onMove = () => {
      const c = map.getCenter();
      if (starRef.current)
        starRef.current.style.transform = `translate(${c.lng * 3}px, ${c.lat * 3}px) rotate(${map.getBearing() * 0.4}deg)`;
    };
    map.on('move', onMove);

    const curves = allPlanes.map((p) => buildArc(p.route[0], p.route[p.route.length - 1]));

    map.on('load', () => {
      // Enable globe projection (3D)
      try { map.setProjection({ type: 'globe' } as never); } catch {}

      // Route lines
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
      map.addLayer({ id: 'route-glow', type: 'line', source: 'routes', paint: { 'line-color': ACCENT, 'line-width': 5, 'line-opacity': 0.05, 'line-blur': 4 } });
      map.addLayer({ id: 'route-dash', type: 'line', source: 'routes', paint: { 'line-color': ACCENT, 'line-width': 1.2, 'line-opacity': 0.22, 'line-dasharray': [0, 4, 3] } });
      map.addLayer({ id: 'route-active', type: 'line', source: 'routes', filter: ['==', ['get', 'id'], -1], paint: { 'line-color': '#fbbf24', 'line-width': 2, 'line-opacity': 0.95 } });

      const img = new Image(48, 48);
      img.onload = () => {
        if (!map.hasImage('plane')) map.addImage('plane', img);

        map.addSource('planes', { type: 'geojson', data: { type: 'FeatureCollection', features: [] } as never });
        map.addLayer({ id: 'plane-glow', type: 'circle', source: 'planes', paint: { 'circle-radius': 12, 'circle-color': ACCENT, 'circle-opacity': 0.18, 'circle-blur': 1 } });
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
            </div>`
          ).addTo(map);
          map.easeTo({ center: cc, zoom: 4.5, duration: 1200 });
          map.once('moveend', () => { if (selectedRef.current !== null) followRef.current = true; });
        });

        // Animated dashed route march
        const dashSeq = [[0,4,3],[1,4,2],[2,4,1],[3,4,0],[0,1,3,3],[0,2,3,2],[0,3,3,1]];
        let dashStep = 0;

        const animate = (ts: number) => {
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
              properties: { id: idx, bearing, callsign: m.callsign, origin: m.origin, destination: m.destination, altitude: m.altitude, speed: Math.round(m.speed) },
              geometry: { type: 'Point', coordinates: [lng, lat] },
            };
          });

          (map.getSource('planes') as maplibregl.GeoJSONSource)?.setData({ type: 'FeatureCollection', features } as never);

          const sel = selectedRef.current;
          if (sel !== null && coords[sel]) {
            popup.setLngLat(coords[sel]);
            if (followRef.current) {
              const cur = map.getCenter();
              const k = 0.07; // smooth follow factor
              const nlng = cur.lng + (coords[sel][0] - cur.lng) * k;
              const nlat = cur.lat + (coords[sel][1] - cur.lat) * k;
              const nzoom = map.getZoom() + (zoomTargetRef.current - map.getZoom()) * k;
              map.jumpTo({ center: [nlng, nlat], zoom: nzoom });
            }
          }

          const ns = Math.floor((ts / 220) % dashSeq.length);
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
  }, []);

  return (
    <div className="relative w-full h-full rounded-[16px] overflow-hidden border border-cyan-500/20 bg-[#030712]">
      {/* Parallax starfield overlay */}
      <div ref={starRef} className="pointer-events-none absolute -inset-full w-[300%] h-[300%] z-0 wm-starfield" />

      {/* MapLibre container */}
      <div ref={containerRef} className="relative w-full h-full z-[1]" />

      {/* Edge vignette */}
      <div className="pointer-events-none absolute inset-0 z-[386] wm-vignette" />

      {/* Zoom controls */}
      <div className="absolute bottom-4 left-4 flex flex-col gap-2 bg-slate-900/70 backdrop-blur-md p-2 rounded-xl border border-cyan-500/20 shadow-lg z-[400]">
        <button
          onClick={() => mapRef.current?.zoomIn()}
          className="p-2 bg-cyan-500/90 hover:bg-cyan-400 text-slate-900 rounded-lg transition active:scale-95"
          title="Zoom In"
        >
          <Plus size={16} />
        </button>
        <button
          onClick={() => mapRef.current?.zoomOut()}
          className="p-2 bg-cyan-500/90 hover:bg-cyan-400 text-slate-900 rounded-lg transition active:scale-95"
          title="Zoom Out"
        >
          <Minus size={16} />
        </button>
      </div>

      {/* Info panel */}
      <div className="absolute top-4 left-4 bg-slate-900/70 backdrop-blur-md text-white p-3 rounded-xl border border-cyan-500/20 shadow-lg z-[400] max-w-xs">
        <h3 className="font-bold text-sm mb-2 flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
          Global Flight Radar
        </h3>
        <p className="text-cyan-300 text-[11px]">Active aircraft: {allPlanes.length}</p>
        <p className="text-slate-400 text-[10px] mt-1">Click a plane to follow · drag to rotate</p>
      </div>

      {/* Live badge */}
      <div className="absolute top-4 right-4 bg-slate-900/70 backdrop-blur-md px-3 py-2 rounded-full shadow-lg border border-cyan-500/20 z-[400] flex items-center gap-2">
        <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
        <span className="text-xs font-bold text-cyan-200 tracking-wide">LIVE</span>
      </div>

      <style>{`
        .maplibregl-canvas { background: transparent !important; }
        .maplibregl-ctrl-attrib { display: none !important; }

        .wm-starfield {
          background-color: transparent;
          background-image:
            radial-gradient(1px 1px at 25px 35px, #fff, transparent),
            radial-gradient(1px 1px at 80px 120px, rgba(255,255,255,.8), transparent),
            radial-gradient(1.5px 1.5px at 160px 60px, #fff, transparent),
            radial-gradient(1px 1px at 200px 180px, rgba(255,255,255,.7), transparent),
            radial-gradient(1px 1px at 120px 220px, rgba(200,230,255,.9), transparent),
            radial-gradient(1.5px 1.5px at 300px 280px, #fff, transparent),
            radial-gradient(1px 1px at 360px 90px, rgba(255,255,255,.7), transparent),
            radial-gradient(1px 1px at 340px 200px, rgba(255,255,255,.6), transparent);
          background-repeat: repeat;
          background-size: 400px 400px;
        }

        .wm-vignette { box-shadow: inset 0 0 130px 30px rgba(1,4,12,0.85); }

        .plane-popup .maplibregl-popup-content {
          background: rgba(8,18,32,0.92);
          backdrop-filter: blur(8px);
          border: 1px solid rgba(34,211,238,0.35);
          border-radius: 12px;
          color: #e2f5fb;
          padding: 10px 12px;
          box-shadow: 0 8px 28px rgba(0,0,0,0.5);
        }
        .plane-popup .maplibregl-popup-tip { border-top-color: rgba(8,18,32,0.92); }
        .plane-popup .maplibregl-popup-close-button { color: #67e8f9; font-size: 16px; }
        .pp-h { font-weight: 800; font-size: 13px; color: #67e8f9; margin-bottom: 2px; }
        .pp-r { font-size: 11px; color: #cbd5e1; margin-bottom: 6px; }
        .pp-r span { color: #22d3ee; }
        .pp-stats { display: flex; gap: 14px; }
        .pp-stats span { display: block; font-size: 9px; color: #64748b; letter-spacing: .5px; }
        .pp-stats b { font-size: 12px; color: #f1f5f9; }
      `}</style>
    </div>
  );
}
