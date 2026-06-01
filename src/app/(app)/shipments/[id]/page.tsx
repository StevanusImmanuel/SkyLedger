"use client";

import { useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, Edit, Package, Plane, Route, UserRound } from "lucide-react";
import {
  calculateShippingFeeFromInput,
  formatShippingFee,
} from "@/lib/shipments/shipping-fee";

const ShipmentRouteMap = dynamic(
  () => import("@/components/shipments/ShipmentRouteMap"),
  {
    ssr: false,
    loading: () => (
      <section className="rounded-xl border border-[#e8edf4] bg-[#f8fafc] p-5">
        <div className="rounded-lg border border-[#e8edf4] bg-white p-6 text-sm font-semibold text-[#64748b]">
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
  arrived_at_destination: "Arrived at Destination Airports",
  out_for_delivery: "Out for Delivery",
  ready_for_pickup: "Ready for Pickup",
  delivered: "Delivered",
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

  return date.toLocaleString();
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
    <div className="rounded-lg border border-[#e8edf4] bg-white p-4">
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
    <section className="rounded-xl border border-[#e8edf4] bg-[#f8fafc] p-5">
      <div className="mb-4 flex items-center gap-2 text-[#1a2d5a]">
        {icon}
        <h2 className="text-sm font-black uppercase tracking-[0.4px]">{title}</h2>
      </div>
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">{children}</div>
    </section>
  );
}

export default function ShipmentDetailPage() {
  const params = useParams();
  const shipmentId = params.id as string;
  const [shipment, setShipment] = useState<Shipment | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let isMounted = true;

    async function fetchShipment() {
      setIsLoading(true);
      setError("");

      try {
        const res = await fetch(`/api/shipments/${encodeURIComponent(shipmentId)}`);
        const data = await res.json();

        if (!isMounted) return;

        if (res.status === 404) {
          setShipment(null);
          setError("Shipment not found.");
          return;
        }

        if (!res.ok || !data.success) {
          setShipment(null);
          setError(data.error || "Unable to load shipment details.");
          return;
        }

        setShipment(data.data);
      } catch (err) {
        console.error("Failed to fetch shipment detail:", err);
        if (isMounted) {
          setShipment(null);
          setError("Unable to load shipment details.");
        }
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    if (shipmentId) fetchShipment();

    return () => {
      isMounted = false;
    };
  }, [shipmentId]);

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

  if (isLoading) {
    return (
      <div className="mx-auto w-full max-w-6xl p-6 md:p-10">
        <div className="rounded-xl border border-[#e8edf4] bg-white p-8 text-sm font-semibold text-[#64748b]">
          Loading shipment details...
        </div>
      </div>
    );
  }

  if (error || !shipment || !details) {
    return (
      <div className="mx-auto w-full max-w-6xl p-6 md:p-10">
        <div className="rounded-xl border border-[#e8edf4] bg-white p-8">
          <div className="mb-2 text-xl font-black text-[#1a2d5a]">Shipment unavailable</div>
          <p className="mb-5 text-sm font-medium text-[#64748b]">{error || "Shipment not found."}</p>
          <Link href="/shipments" className="inline-flex items-center gap-2 text-sm font-bold text-[#1a2d5a]">
            <ArrowLeft size={16} strokeWidth={2.4} />
            Back to shipments
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

  return (
    <div className="mx-auto w-full max-w-6xl p-6 md:p-10">
      <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div>
          <Link href="/shipments" className="mb-4 inline-flex items-center gap-2 text-xs font-black uppercase tracking-[0.4px] text-[#64748b] hover:text-[#1a2d5a]">
            <ArrowLeft size={15} strokeWidth={2.4} />
            Back to shipments
          </Link>
          <div className="text-[11px] font-black uppercase tracking-widest text-[#1a2d5a]">
            Shipment Detail
          </div>
          <h1 className="mt-2 text-3xl font-black tracking-tight text-[#0f172a]">
            {shipment.awbNumber}
          </h1>
          <p className="mt-1 text-sm font-medium text-[#64748b]">
            Full manifest information captured from shipment creation.
          </p>
        </div>
        <Link
          href={`/shipments/${shipment.id}/edit`}
          className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-[#1a2d5a] px-4 text-sm font-bold text-white"
        >
          <Edit size={16} strokeWidth={2.3} />
          Edit
        </Link>
      </div>

      <div className="space-y-5">
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

        <Section icon={<UserRound size={18} strokeWidth={2.4} />} title="Sender And Receiver">
          <DetailCard label="Sender Name" value={details.senderName || "N/A"} />
          <DetailCard label="Receiver Name" value={details.receiverName || "N/A"} />
          <DetailCard label="Telephone Number" value={details.telephoneNumber || "N/A"} />
        </Section>

        <Section icon={<Route size={18} strokeWidth={2.4} />} title="Route And Address">
          <DetailCard
            label="Origin Airport"
            value={originAirport ? `${originAirport.iataCode} - ${originAirport.city}, ${originAirport.country}` : "N/A"}
            subValue={originAirport?.name}
          />
          <DetailCard label="Origin Address" value={details.originAddress || "N/A"} />
          <DetailCard
            label="Destination Airport"
            value={destAirport ? `${destAirport.iataCode} - ${destAirport.city}, ${destAirport.country}` : "N/A"}
            subValue={destAirport?.name}
          />
          <DetailCard label="Destination Address" value={details.destinationAddress || "N/A"} />
        </Section>

        <ShipmentRouteMap originAirport={originAirport} destAirport={destAirport} />

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
    </div>
  );
}
