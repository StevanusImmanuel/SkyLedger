# Extracted 3D Globe Flight Map

Self-contained extraction of the MapLibre GL globe map from the Altus project.

## Files

```
extracted-3d-map/
├── WorldMapGL.tsx        ← main component (drop in anywhere)
├── data/
│   └── mockAircraft.ts   ← static flight + route data
└── README.md
```

## Install

```bash
npm install maplibre-gl lucide-react
# TypeScript types (optional)
npm install -D @types/leaflet
```

## Usage (Next.js)

```tsx
// page.tsx or any client component host
import dynamic from 'next/dynamic';

const WorldMapGL = dynamic(() => import('./WorldMapGL'), { ssr: false });

export default function Page() {
  return (
    <div style={{ width: '100%', height: '600px' }}>
      <WorldMapGL />
    </div>
  );
}
```

> Container MUST have explicit width + height. MapLibre needs `window` → ssr: false required.

## Usage (Vite / CRA / plain React)

```tsx
import WorldMapGL from './WorldMapGL';

export default function App() {
  return (
    <div style={{ width: '100vw', height: '100vh' }}>
      <WorldMapGL />
    </div>
  );
}
```

## Swap tile provider

In `WorldMapGL.tsx`, change `TILE_URL`:

```ts
// OpenStreetMap (free, no key)
const TILE_URL = 'https://tile.openstreetmap.org/{z}/{x}/{y}.png';

// MapTiler satellite (needs free key)
const TILE_URL = 'https://api.maptiler.com/tiles/satellite/{z}/{x}/{y}.jpg?key=YOUR_KEY';

// Stadia Alidade Smooth Dark (needs free key)
const TILE_URL = 'https://tiles.stadiamaps.com/tiles/alidade_smooth_dark/{z}/{x}/{y}.png?api_key=YOUR_KEY';
```

## Connect live data

Replace static `mockAircraft` with a fetch:

```tsx
// Inside useEffect, before map.on('load'):
const [planes, setPlanes] = useState<Plane[]>([]);

useEffect(() => {
  fetch('/api/aircraft')
    .then(r => r.json())
    .then(setPlanes);
  // poll every 10s
  const id = setInterval(() =>
    fetch('/api/aircraft').then(r => r.json()).then(setPlanes), 10000);
  return () => clearInterval(id);
}, []);
// Then replace allPlanes with planes in the animate() loop
```

## Customise accent color

```ts
const ACCENT = '#22d3ee'; // cyan — change to any hex
```

## Customise animation speed

```ts
const DURATION = 60000; // ms for one full route traversal — lower = faster
```

## Add more planes

Edit `data/mockAircraft.ts` or increase `genPlanes(22)` → `genPlanes(50)`.

## Requirements

- React 18+
- maplibre-gl ^5.0.0
- lucide-react (only for zoom buttons — swap if not using)
- Tailwind CSS (for layout classes — or replace with plain CSS)

## Tile provider licensing

| Provider | License | Key needed |
|---|---|---|
| Esri World Imagery (default) | Esri ToS — free dev, paid commercial | No |
| OpenStreetMap | ODbL — free | No |
| MapTiler | Free tier 100k req/mo | Yes (free) |
| Stadia Maps | Free tier | Yes (free) |
