"use client";

import { useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { 
  ArrowLeft, 
  Package, 
  Plane, 
  Route, 
  AlertCircle,
  Calendar,
  Clock,
  MapPin,
  ChevronRight
} from "lucide-react";
import {
  calculateShippingFeeFromInput,
  formatShippingFee,
} from "@/lib/shipments/shipping-fee";
import { PageTitle } from "@/components/ui/page-title";

const ShipmentRouteMap = dynamic(
  () => import("@/components/shipments/ShipmentRouteMap"),
  {
    ssr: false,
    loading: () => (
      <section className="rounded-xl border border-[#e8edf4] bg-[#f8fafc] p-5">
        <div className="rounded-lg border border-[#e8edf4] bg-white p-6 text-sm font-semibold text-[#64748b] animate-pulse">
          Loading shipment route map...
        </div>
      </section>
    ),
  }
);

type Airport = {
  iataCode: string;
  name: string;
  city: string;
  country: string;
  latitude: string | null;
  longitude: string | null;
};

type ShipmentEvent = {
  id: string;
  shipmentId: string;
  status: string;
  location: string | null;
  notes: string | null;
  occurredAt: string;
};

type Shipment = {
  id: string;
  awbNumber: string;
  priority: "standard" | "express" | "critical";
  status: string;
  deliveryStatus: string | null;
  productType: string | null;
  weightKg: string | null;
  notes: string | null;
  estimatedDelivery: string | null;
  createdAt: string;
  originAirport: Airport | null;
  destAirport: Airport | null;
  flight: {
    airline: {
      airlineId: number;
      airlineName: string;
      airlineCode: string;
    } | null;
    airplane: {
      airplaneId: number;
      flightNumber: string;
      model: string;
      capacity: number;
    } | null;
  } | null;
  events?: ShipmentEvent[];
};

const NOTE_LABELS = [
  "Shipping Date",
  "Sender",
  "Receiver",
  "Tel",
  "Origin",
  "Dest",
  "Delivery",
  "Fee",
  "Weight Unit",
  "Notes",
];

const DELIVERY_STATUS_LABELS: Record<string, string> = {
  booked: "Booked",
  received_at_warehouse: "Received at Warehouse",
  security_cleared: "Security Cleared",
  manifested: "Manifested",
  departed: "Departed",
  transshipment: "Transshipment",
  arrived_at_destination: "Arrived at Destination Airport",
  out_for_delivery: "Out for Delivery",
  ready_for_pickup: "Ready for Pickup",
  delivered: "Delivered",
};

const STATUS_COLOR_CLASSES: Record<string, string> = {
  pending: "bg-slate-100 text-slate-700 border-slate-200",
  processing: "bg-amber-100 text-amber-700 border-amber-200",
  in_transit: "bg-blue-100 text-blue-700 border-blue-200",
  delivered: "bg-emerald-100 text-emerald-700 border-emerald-200",
  delayed: "bg-rose-100 text-rose-700 border-rose-200",
  cancelled: "bg-red-100 text-red-700 border-red-200",
};

function getNoteValue(notes: string | null, label: string) {
  if (!notes) return "";

  const stopLabels = NOTE_LABELS.filter((item) => item !== label).join("|");
  const match = notes.match(
    new RegExp(`(?:^|,\\s*)${label}:\\s*([\\s\\S]*?)(?=,\\s*(?:${stopLabels}):|$)`, "i")
  );

  return match?.[1]?.trim() || "";
}

function formatDate(value?: string | null) {
  if (!value) return "N/A";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "N/A";

  return date.toLocaleString(undefined, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function formatPriority(value: Shipment["priority"]) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function formatDeliveryStatus(shipment: Shipment) {
  if (shipment.deliveryStatus) {
    return DELIVERY_STATUS_LABELS[shipment.deliveryStatus] || shipment.deliveryStatus;
  }

  return shipment.status.replace(/_/g, " ").toUpperCase();
}

function inferShippingDate(shipment: Shipment, shippingDateFromNotes: string) {
  if (shippingDateFromNotes) return formatDate(shippingDateFromNotes);
  if (!shipment.estimatedDelivery) return "N/A";

  const estimatedDelivery = new Date(shipment.estimatedDelivery);
  if (Number.isNaN(estimatedDelivery.getTime())) return "N/A";

  const originalShippingDate = new Date(estimatedDelivery.getTime() - 3 * 24 * 60 * 60 * 1000);
  return formatDate(originalShippingDate.toISOString());
}

function DetailCard({
  label,
  value,
  subValue,
}: {
  label: string;
  value: string;
  subValue?: string;
}) {
  return (
    <div className="rounded-lg border border-[#e8edf4] bg-white p-4 transition-all hover:shadow-sm">
      <div className="mb-1 text-[10px] font-bold uppercase tracking-[0.5px] text-[#94a3b8]">
        {label}
      </div>
      <div className="break-words text-sm font-bold text-[#0f172a]">{value || "N/A"}</div>
      {subValue && <div className="mt-1 break-words text-xs font-medium text-[#64748b]">{subValue}</div>}
    </div>
  );
}

function Section({
  icon,
  title,
  children,
}: {
  icon: ReactNode;
  title: string;
  children: ReactNode;
}) {
  return (
    <section className="rounded-xl border border-[#e8edf4] bg-[#f8fafc] p-5 shadow-sm">
      <div className="mb-4 flex items-center gap-2 text-[#1a2d5a]">
        {icon}
        <h2 className="text-sm font-black uppercase tracking-[0.4px]">{title}</h2>
      </div>
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">{children}</div>
    </section>
  );
}

// Custom Search Component used in success header or error screens
function inlineSearchForm(
  awb: string, 
  setAwb: (val: string) => void, 
  onSubmit: (e: React.FormEvent) => void,
  searchError: string
) {
  return (
    <div className="w-full max-w-md">
      <form onSubmit={onSubmit} className="flex gap-2 w-full">
        <input
          type="text"
          placeholder="Enter tracking number"
          value={awb}
          onChange={(e) => setAwb(e.target.value)}
          className="flex-grow rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-[#1a2d5a] placeholder-slate-300 focus:outline-none focus:border-[#60a5fa]"
        />
        <button
          type="submit"
          className="rounded-lg bg-[#1a2d5a] hover:bg-[#2e4a8f] text-white px-4 py-2 text-xs font-bold uppercase tracking-wider transition-colors"
        >
          Track
        </button>
      </form>
      {searchError && (
        <p className="mt-1 text-left text-xs font-semibold text-red-500">{searchError}</p>
      )}
    </div>
  );
}

export default function PublicTrackingDetailPage() {
  const params = useParams();
  const router = useRouter();
  const idParam = params.id as string;
  const decodedId = decodeURIComponent(idParam);

  const [shipment, setShipment] = useState<Shipment | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [statusCode, setStatusCode] = useState(200);

  // Search input for searching new AWBs directly from this page
  const [searchAwb, setSearchAwb] = useState("");
  const [searchError, setSearchError] = useState("");

  useEffect(() => {
    let isMounted = true;

    async function fetchTrackingData() {
      setIsLoading(true);
      setError("");
      setStatusCode(200);

      try {
        const res = await fetch(`/api/tracking/${encodeURIComponent(decodedId)}`);
        const data = await res.json();

        if (!isMounted) return;

        setStatusCode(res.status);
        if (!res.ok || !data.success) {
          setShipment(null);
          setError(data.error || "Unable to load shipment details.");
          return;
        }

        setShipment(data.data);
      } catch (err: any) {
        console.error("Failed to fetch public tracking detail:", err);
        if (isMounted) {
          setShipment(null);
          setError(err.message || "An unexpected network error occurred.");
        }
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    if (decodedId) fetchTrackingData();

    return () => {
      isMounted = false;
    };
  }, [decodedId]);

  const details = useMemo(() => {
    if (!shipment) return null;

    const shippingDate = getNoteValue(shipment.notes, "Shipping Date");
    const senderName = getNoteValue(shipment.notes, "Sender");
    const receiverName = getNoteValue(shipment.notes, "Receiver");
    const telephoneNumber = getNoteValue(shipment.notes, "Tel");
    const originAddress = getNoteValue(shipment.notes, "Origin");
    const destinationAddress = getNoteValue(shipment.notes, "Dest");
    const deliveryType = getNoteValue(shipment.notes, "Delivery");
    const weightUnit = getNoteValue(shipment.notes, "Weight Unit");
    const shippingFee = calculateShippingFeeFromInput(shipment.weightKg, shipment.priority);

    return {
      shippingDate: inferShippingDate(shipment, shippingDate),
      senderName,
      receiverName,
      telephoneNumber,
      originAddress,
      destinationAddress,
      deliveryType,
      shippingFee: shippingFee === null ? "" : formatShippingFee(shippingFee),
      weightUnit,
    };
  }, [shipment]);

  const handleInlineSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSearchError("");

    const trimmed = searchAwb.trim();
    if (!trimmed) {
      setSearchError("Please enter a tracking number.");
      return;
    }

    const SAFE_TRACKING_PATTERN = /^[a-zA-Z0-9-]+$/;
    if (!SAFE_TRACKING_PATTERN.test(trimmed)) {
      setSearchError("Use only letters, digits, and hyphens.");
      return;
    }

    router.push(`/tracking/${encodeURIComponent(trimmed)}`);
  };

  if (isLoading) {
    return (
      <div className="min-h-[calc(100vh-4rem)] bg-[#f8fafc] py-10 px-4 sm:px-6 lg:px-8 flex items-center justify-center">
        <div className="rounded-xl border border-[#e8edf4] bg-white p-10 text-center shadow-lg max-w-md w-full animate-pulse">
          <div className="flex justify-center mb-4">
            <Clock size={48} className="text-[#1a2d5a] animate-spin" />
          </div>
          <h2 className="text-lg font-black text-[#1a2d5a] mb-2 uppercase tracking-wider">Locating Shipment</h2>
          <p className="text-slate-400 text-xs font-semibold">Retrieving ledger-verified telemetry data...</p>
        </div>
      </div>
    );
  }

  if (error || !shipment || !details) {
    let errorTitle = "Tracking Unavailable";
    let errorDesc = error || "Shipment details could not be retrieved.";
    let iconClass = "bg-amber-100 text-amber-600 border-amber-300";

    if (statusCode === 404) {
      errorTitle = "Shipment Not Found";
      errorDesc = "The requested tracking number does not exist. Please check for typos and try again.";
      iconClass = "bg-rose-100 text-rose-600 border-rose-300";
    } else if (statusCode === 429) {
      errorTitle = "Rate Limit Exceeded";
      errorDesc = "You have made too many tracking searches recently. Please wait a minute and search again.";
      iconClass = "bg-rose-100 text-rose-600 border-rose-300";
    }

    return (
      <div className="min-h-[calc(100vh-4rem)] bg-[#f8fafc] py-10 px-4 sm:px-6 lg:px-8 flex flex-col items-center justify-center">
        <PageTitle title={errorTitle} />
        <div className="rounded-xl border border-[#e8edf4] bg-white p-8 w-full shadow-lg text-center flex flex-col items-center max-w-3xl">
          <div className="flex justify-center mb-6">
            <div className={`p-4 rounded-xl border ${iconClass}`}>
              <AlertCircle size={36} />
            </div>
          </div>

          <span className="bg-slate-100 text-slate-700 text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest mb-4 inline-block">
            Status Code: {statusCode}
          </span>

          <h1 className="text-2xl font-black text-[#1a2d5a] mb-2">{errorTitle}</h1>
          <p className="text-slate-500 text-xs font-semibold leading-relaxed mb-8 max-w-md">
            {errorDesc}
          </p>

          <div className="w-full flex flex-col items-center gap-4 bg-slate-50 p-6 rounded-xl border border-slate-100 mb-6">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Search Another Airway Bill</p>
            {inlineSearchForm(searchAwb, setSearchAwb, handleInlineSearch, searchError)}
          </div>

          <Link href="/tracking" className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-wider text-[#1a2d5a] hover:text-[#60a5fa] transition-colors">
            <ArrowLeft size={14} strokeWidth={2.5} />
            Back to Tracking Page
          </Link>
        </div>
      </div>
    );
  }

  const airline = shipment.flight?.airline;
  const airplane = shipment.flight?.airplane;
  const originAirport = shipment.originAirport;
  const destAirport = shipment.destAirport;
  const weightUnit = details.weightUnit || "kg";
  const events = shipment.events || [];

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-[#f8fafc] py-10 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto w-full max-w-6xl">
        <PageTitle title={`Public Tracking ${shipment.awbNumber}`} />

        {/* Header Panel */}
        <div className="mb-8 flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between border-b border-[#e8edf4] pb-6">
          <div>
            <Link href="/tracking" className="mb-4 inline-flex items-center gap-2 text-xs font-black uppercase tracking-[0.4px] text-[#64748b] hover:text-[#1a2d5a] transition-colors">
              <ArrowLeft size={14} strokeWidth={2.5} />
              Back to Search
            </Link>
            <div className="flex items-center gap-3 mt-2">
              <span className="text-[10px] font-black uppercase tracking-widest text-[#1a2d5a] bg-blue-50 px-2.5 py-1 rounded-full">
                Ledger-Verified Tracking
              </span>
              <span className={`text-[10px] font-bold uppercase tracking-wide border px-2 py-0.5 rounded-md ${STATUS_COLOR_CLASSES[shipment.status] || STATUS_COLOR_CLASSES.pending}`}>
                {shipment.status.replace(/_/g, " ")}
              </span>
            </div>
            <h1 className="mt-2 text-3xl font-black tracking-tight text-[#0f172a]">
              {shipment.awbNumber}
            </h1>
            <p className="mt-1 text-xs font-medium text-[#64748b]">
              Secure public tracking report. Personal address and contact details have been redacted for confidentiality.
            </p>
          </div>

          {/* Quick search tool right in the header for premium UX */}
          <div className="flex flex-col gap-2">
            <p className="text-[10px] font-black text-[#64748b] uppercase tracking-wider">Quick Track Another AWB</p>
            {inlineSearchForm(searchAwb, setSearchAwb, handleInlineSearch, searchError)}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          {/* Main Details and Map: 2 cols on lg screens */}
          <div className="lg:col-span-2 space-y-6">
            <Section icon={<Plane size={18} strokeWidth={2.4} />} title="Primary Identification">
              <DetailCard
                label="Airline"
                value={airline ? airline.airlineName : "N/A"}
                subValue={airline ? airline.airlineCode : undefined}
              />
              <DetailCard
                label="Plane ID"
                value={airplane ? airplane.flightNumber : "N/A"}
                subValue={airplane ? `${airplane.model} (Capacity: ${airplane.capacity})` : undefined}
              />
              <DetailCard label="AWB Number" value={shipment.awbNumber} />
              <DetailCard label="Shipping Date" value={details.shippingDate} />
            </Section>

            <Section icon={<Route size={18} strokeWidth={2.4} />} title="Route And Address">
              <DetailCard
                label="Origin Airport"
                value={originAirport ? `${originAirport.iataCode} - ${originAirport.city}, ${originAirport.country}` : "N/A"}
                subValue={originAirport?.name || undefined}
              />
              <DetailCard label="Origin Address" value={details.originAddress || "N/A"} />
              <DetailCard
                label="Destination Airport"
                value={destAirport ? `${destAirport.iataCode} - ${destAirport.city}, ${destAirport.country}` : "N/A"}
                subValue={destAirport?.name || undefined}
              />
              <DetailCard label="Destination Address" value={details.destinationAddress || "N/A"} />
            </Section>

            <ShipmentRouteMap
              originAirport={originAirport}
              destAirport={destAirport}
              status={shipment.status}
              deliveryStatus={shipment.deliveryStatus}
            />

            <Section icon={<Package size={18} strokeWidth={2.4} />} title="Cargo And Delivery">
              <DetailCard label="Priority Level" value={formatPriority(shipment.priority)} />
              <DetailCard label="Product Type" value={shipment.productType || "N/A"} />
              <DetailCard
                label="Product Weight"
                value={shipment.weightKg ? `${Number(shipment.weightKg).toLocaleString()} ${weightUnit}` : "N/A"}
              />
              <DetailCard label="Delivery Type" value={details.deliveryType || "N/A"} />
              <DetailCard label="Shipping Fee" value={details.shippingFee || "N/A"} />
              <DetailCard label="Delivery Status" value={formatDeliveryStatus(shipment)} />
            </Section>
          </div>

          {/* Sidebar: shipment events / timeline (1 col on lg screens) */}
          <div className="space-y-6">
            <section className="rounded-xl border border-[#e8edf4] bg-white p-5 shadow-sm">
              <div className="mb-6 flex items-center gap-2 text-[#1a2d5a]">
                <Calendar size={18} strokeWidth={2.4} />
                <h2 className="text-sm font-black uppercase tracking-[0.4px]">Shipment Timeline</h2>
              </div>

              {events.length === 0 ? (
                <div className="rounded-lg border border-[#e8edf4] bg-[#f8fafc] p-6 text-center">
                  <p className="text-xs font-semibold text-[#64748b]">No tracking updates posted yet.</p>
                </div>
              ) : (
                <div className="relative border-l border-slate-200 pl-6 space-y-8 ml-2">
                  {events.map((event, index) => {
                    const isLatest = index === 0;
                    return (
                      <div key={event.id} className="relative">
                        {/* Timeline dot */}
                        <span className={`absolute -left-[34px] top-1.5 flex h-5 w-5 items-center justify-center rounded-full border bg-white shadow-sm ${
                          isLatest 
                            ? "border-emerald-500 ring-4 ring-emerald-100" 
                            : "border-slate-300"
                        }`}>
                          {isLatest ? (
                            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                          ) : (
                            <span className="h-1.5 w-1.5 rounded-full bg-slate-300" />
                          )}
                        </span>

                        {/* Event description */}
                        <div className="bg-white p-3 rounded-lg border border-[#e8edf4] shadow-sm transition-all hover:border-[#60a5fa]">
                          <div className="flex items-center justify-between gap-2 mb-1">
                            <span className={`text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded ${
                              STATUS_COLOR_CLASSES[event.status] || STATUS_COLOR_CLASSES.pending
                            }`}>
                              {event.status.replace(/_/g, " ")}
                            </span>
                            <span className="text-[9px] font-medium text-slate-400">
                              {formatDate(event.occurredAt)}
                            </span>
                          </div>
                          {event.location && (
                            <div className="flex items-center gap-1 text-[10px] font-bold text-[#1a2d5a] mb-1">
                              <MapPin size={10} />
                              <span>{event.location}</span>
                            </div>
                          )}
                          {event.notes && (
                            <p className="text-xs font-semibold text-slate-500 mt-1 leading-snug">
                              {event.notes}
                            </p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
