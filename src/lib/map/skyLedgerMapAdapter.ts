export type MapCoordinate = {
  lat: number;
  lng: number;
};

export type MapLngLat = [number, number];

export type MapAircraft = {
  id: string;
  code: string;
  shipmentId?: string;
  aircraftLabel?: string;
  flightLabel?: string;
  originName: string;
  destinationName: string;
  originCoords: MapCoordinate;
  destinationCoords: MapCoordinate;
  position: MapCoordinate;
  heading: number;
  status: string;
  progress?: number;
};

export type MapRoute = {
  id: string;
  code: string;
  originName: string;
  destinationName: string;
  originCoords: MapCoordinate;
  destinationCoords: MapCoordinate;
  coordinates: MapLngLat[];
  status: string;
  progress?: number;
};

export type DashboardShipmentMapDatum = {
  id: string;
  awbNumber: string;
  originLat: number | string | null;
  originLng: number | string | null;
  originIata: string;
  destLat: number | string | null;
  destLng: number | string | null;
  destIata: string;
  status: string;
  progress?: number | string | null;
};

export type SkyLedgerAdaptedMapData = {
  aircraft: MapAircraft[];
  routes: MapRoute[];
  skipped: number;
};

type AdapterOptions = {
  maxItems?: number;
};

const DEFAULT_MAX_ITEMS = 5;

function toFiniteNumber(value: number | string | null | undefined) {
  if (typeof value === "number") return Number.isFinite(value) ? value : null;
  if (typeof value === "string" && value.trim().length > 0) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

export function isValidMapCoordinate(coordinate: MapCoordinate) {
  return (
    Number.isFinite(coordinate.lat) &&
    Number.isFinite(coordinate.lng) &&
    coordinate.lat >= -90 &&
    coordinate.lat <= 90 &&
    coordinate.lng >= -180 &&
    coordinate.lng <= 180
  );
}

function clampProgress(progress: number) {
  return Math.min(Math.max(progress, 0), 100);
}

function inferProgress(status: string) {
  const normalizedStatus = status.toLowerCase();

  if (normalizedStatus.includes("delivered") || normalizedStatus.includes("complete")) {
    return 100;
  }

  if (normalizedStatus.includes("transit") || normalizedStatus.includes("route")) {
    return 56;
  }

  if (normalizedStatus.includes("processing") || normalizedStatus.includes("pending")) {
    return 18;
  }

  if (normalizedStatus.includes("customs")) {
    return 74;
  }

  return 42;
}

function normalizeProgress(value: number | string | null | undefined, status: string) {
  const parsedProgress = toFiniteNumber(value);
  return clampProgress(parsedProgress ?? inferProgress(status));
}

function formatStatus(status: string) {
  return status
    .split(/[_\s-]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(" ");
}

function interpolatePosition(
  originCoords: MapCoordinate,
  destinationCoords: MapCoordinate,
  progress: number
): MapCoordinate {
  const t = clampProgress(progress) / 100;
  return {
    lat: originCoords.lat + (destinationCoords.lat - originCoords.lat) * t,
    lng: originCoords.lng + (destinationCoords.lng - originCoords.lng) * t,
  };
}

function getBearing(originCoords: MapCoordinate, destinationCoords: MapCoordinate) {
  const toRadians = (value: number) => (value * Math.PI) / 180;
  const toDegrees = (value: number) => (value * 180) / Math.PI;
  const originLat = toRadians(originCoords.lat);
  const destinationLat = toRadians(destinationCoords.lat);
  const lngDelta = toRadians(destinationCoords.lng - originCoords.lng);
  const y = Math.sin(lngDelta) * Math.cos(destinationLat);
  const x =
    Math.cos(originLat) * Math.sin(destinationLat) -
    Math.sin(originLat) * Math.cos(destinationLat) * Math.cos(lngDelta);

  return (toDegrees(Math.atan2(y, x)) + 360) % 360;
}

export function adaptDashboardShipmentsToMap(
  shipments: DashboardShipmentMapDatum[],
  options: AdapterOptions = {}
): SkyLedgerAdaptedMapData {
  const maxItems = Math.min(Math.max(options.maxItems ?? DEFAULT_MAX_ITEMS, 1), DEFAULT_MAX_ITEMS);
  const aircraft: MapAircraft[] = [];
  const routes: MapRoute[] = [];
  let skipped = 0;

  for (const shipment of shipments) {
    if (aircraft.length >= maxItems) break;

    const originCoords = {
      lat: toFiniteNumber(shipment.originLat) ?? Number.NaN,
      lng: toFiniteNumber(shipment.originLng) ?? Number.NaN,
    };
    const destinationCoords = {
      lat: toFiniteNumber(shipment.destLat) ?? Number.NaN,
      lng: toFiniteNumber(shipment.destLng) ?? Number.NaN,
    };

    if (!isValidMapCoordinate(originCoords) || !isValidMapCoordinate(destinationCoords)) {
      skipped += 1;
      continue;
    }

    const status = formatStatus(shipment.status || "In Transit");
    const progress = normalizeProgress(shipment.progress, status);
    const code = shipment.awbNumber || shipment.id;
    const originName = shipment.originIata || "Origin";
    const destinationName = shipment.destIata || "Destination";

    aircraft.push({
      id: shipment.id,
      code,
      shipmentId: shipment.id,
      aircraftLabel: `Shipment ${code}`,
      flightLabel: code,
      originName,
      destinationName,
      originCoords,
      destinationCoords,
      position: interpolatePosition(originCoords, destinationCoords, progress),
      heading: getBearing(originCoords, destinationCoords),
      status,
      progress,
    });

    routes.push({
      id: `${shipment.id}-route`,
      code,
      originName,
      destinationName,
      originCoords,
      destinationCoords,
      coordinates: [
        [originCoords.lng, originCoords.lat],
        [destinationCoords.lng, destinationCoords.lat],
      ],
      status,
      progress,
    });
  }

  return { aircraft, routes, skipped };
}
