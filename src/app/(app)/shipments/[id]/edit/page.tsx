"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faBarcode,
  faInfoCircle,
  faPlaneDeparture,
  faGlobe,
  faBoxesStacked,
  faChevronDown,
  faShieldHalved,
  faUser,
  faPhone,
  faMapMarkerAlt,
} from "@fortawesome/free-solid-svg-icons";
import { useNotifications } from "@/components/ui/notification-provider";

type Airline = {
  airlineId: number;
  airlineName: string;
  airlineCode: string;
};

type Airplane = {
  airplaneId: number;
  flightNumber: string;
  model: string;
  capacity: number;
  airlineCode: string;
};

type Airport = {
  id: number;
  iataCode: string;
  name: string;
  city: string;
  country: string;
};

type Shipment = {
  id: string;
  awbNumber: string;
  originAirport: { iataCode: string } | null;
  destAirport: { iataCode: string } | null;
  flight: {
    airline: { airlineId: number } | null;
    airplane: { airplaneId: number } | null;
  } | null;
  priority: string;
  status: string;
  deliveryStatus: string | null;
  productType: string | null;
  weightKg: string;
  notes: string | null;
  createdAt: string;
};

const PRODUCT_TYPES = [
  "General Cargo: Garments & Textiles",
  "General Cargo: Electronics",
  "General Cargo: Spare Parts",
  "General Cargo: Consumer Goods & Furniture",
  "Special Cargo: Dangerous Goods",
  "Special Cargo: Perishable Cargo",
  "Special Cargo: Live Animals",
  "Special Cargo: Valuable Cargo",
  "Special Cargo: Oversized & Heavy Cargo",
  "Special Cargo: Human Remains",
];

const DELIVERY_STATUSES = [
  "Booked",
  "Received at Warehouse",
  "Security Cleared",
  "Manifested",
  "Departed",
  "Transshipment",
  "Arrived at Destination Airports",
  "Out for Delivery",
  "Ready for Pickup",
  "Delivered",
];

export default function EditShipmentPage() {
  const router = useRouter();
  const params = useParams();
  const shipmentId = params.id as string;
  const { addNotification } = useNotifications();

  const [airlines, setAirlines] = useState<Airline[]>([]);
  const [airplanes, setAirplanes] = useState<Airplane[]>([]);
  const [airports, setAirports] = useState<Airport[]>([]);
  const [selectedAirline, setSelectedAirline] = useState<number | null>(null);
  const [selectedAirplane, setSelectedAirplane] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Form fields (updatable fields from CRUDDB.md)
  const [formData, setFormData] = useState({
    deliveryStatus: "",
    productType: "",
    shippingDate: "",
    productWeight: "",
    originAddress: "",
    destinationAddress: "",
    originIata: "",
    destIata: "",
    notes: "",
    sender: "",
    receiver: "",
    telpNumber: "",
  });

  // Fetch shipment data
  useEffect(() => {
    async function fetchShipment() {
      try {
        const res = await fetch(`/api/shipments/${shipmentId}`);
        const data = await res.json();
        if (data.success) {
          const shipment: Shipment = data.data;

          // Map delivery status enum to display format
          const deliveryStatusMap: Record<string, string> = {
            'booked': 'Booked',
            'received_at_warehouse': 'Received at Warehouse',
            'security_cleared': 'Security Cleared',
            'manifested': 'Manifested',
            'departed': 'Departed',
            'transshipment': 'Transshipment',
            'arrived_at_destination': 'Arrived at Destination Airports',
            'out_for_delivery': 'Out for Delivery',
            'ready_for_pickup': 'Ready for Pickup',
            'delivered': 'Delivered',
          };

          const displayDeliveryStatus = shipment.deliveryStatus
            ? deliveryStatusMap[shipment.deliveryStatus] || 'Booked'
            : 'Booked';

          setFormData({
            deliveryStatus: displayDeliveryStatus,
            productType: shipment.productType || "",
            shippingDate: "",
            productWeight: shipment.weightKg,
            originAddress: "",
            destinationAddress: "",
            originIata: shipment.originAirport?.iataCode || "",
            destIata: shipment.destAirport?.iataCode || "",
            notes: shipment.notes || "",
            sender: "",
            receiver: "",
            telpNumber: "",
          });
          if (shipment.flight?.airline?.airlineId) {
            setSelectedAirline(shipment.flight.airline.airlineId);
          }
          if (shipment.flight?.airplane?.airplaneId) {
            setSelectedAirplane(shipment.flight.airplane.airplaneId);
          }
        }
      } catch (error) {
        console.error('Failed to fetch shipment:', error);
      } finally {
        setIsLoading(false);
      }
    }
    fetchShipment();
  }, [shipmentId]);

  // Fetch airlines on mount
  useEffect(() => {
    async function fetchAirlines() {
      try {
        const res = await fetch('/api/airlines');
        const data = await res.json();
        if (data.success) {
          setAirlines(data.data);
        }
      } catch (error) {
        console.error('Failed to fetch airlines:', error);
      }
    }
    fetchAirlines();
  }, []);

  // Fetch airports on mount
  useEffect(() => {
    async function fetchAirports() {
      try {
        const res = await fetch('/api/airports');
        const data = await res.json();
        if (data.success) {
          setAirports(data.data);
        }
      } catch (error) {
        console.error('Failed to fetch airports:', error);
      }
    }
    fetchAirports();
  }, []);

  // Fetch airplanes when airline is selected
  useEffect(() => {
    if (selectedAirline) {
      async function fetchAirplanes() {
        try {
          const res = await fetch(`/api/airplanes?airlineId=${selectedAirline}`);
          const data = await res.json();
          if (data.success) {
            setAirplanes(data.data);
          }
        } catch (error) {
          console.error('Failed to fetch airplanes:', error);
        }
      }
      fetchAirplanes();
    }
  }, [selectedAirline]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const res = await fetch(`/api/shipments/${shipmentId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          airlineId: selectedAirline,
          airplaneId: selectedAirplane,
          ...formData,
        }),
      });

      const data = await res.json();

      if (data.success) {
        addNotification({
          variant: 'success',
          title: 'Shipment updated successfully!',
          description: 'All changes have been saved to the system.',
          primaryAction: {
            label: 'View shipments',
            onClick: () => router.push('/shipments'),
          },
        });
        router.push('/shipments');
      } else {
        addNotification({
          variant: 'destructive',
          title: 'Failed to update shipment',
          description: data.error || 'An error occurred while updating the shipment.',
        });
      }
    } catch (error) {
      console.error('Failed to update shipment:', error);
      addNotification({
        variant: 'destructive',
        title: 'Failed to update shipment',
        description: 'An unexpected error occurred. Please try again.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  // Shared classes for uniformity and readability
  const standardInput = "w-full bg-white border border-slate-300 rounded-lg p-4 font-bold text-base text-slate-900 focus:border-[#00236f] focus:ring-1 focus:ring-[#00236f] outline-none transition-all placeholder:text-slate-400";
  const selectStyle = "w-full bg-white border border-slate-300 rounded-lg p-4 text-base font-bold text-slate-900 focus:border-[#00236f] focus:ring-1 focus:ring-[#00236f] outline-none appearance-none cursor-pointer";

  if (isLoading) {
    return (
      <div className="p-10 max-w-6xl mx-auto w-full">
        <div className="text-center py-20">
          <div className="text-slate-600">Loading shipment data...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-10 max-w-6xl mx-auto w-full animate-in fade-in duration-500">
      {/* Page Header */}
      <div className="mb-10">
        <span className="text-[11px] font-extrabold uppercase tracking-widest text-[#00236f] bg-blue-100 px-2 py-1 rounded">
          Logistics Update
        </span>
        <h2 className="text-4xl font-bold mt-4 tracking-tight text-slate-900">Edit Shipment</h2>
        <p className="text-slate-600 text-sm mt-1 font-medium">
          Update shipment details and manifest information.
        </p>
      </div>

      <form className="space-y-8" onSubmit={handleSubmit}>

        {/* Section 1: Flight Information */}
        <div className="bg-[#f2f4f6] rounded-xl p-8 border-l-[6px] border-[#00236f]">
          <div className="flex items-center gap-3 mb-8 text-[#00236f]">
            <FontAwesomeIcon icon={faPlaneDeparture} className="text-2xl" />
            <h3 className="font-bold text-xl tracking-tight">Flight Information</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider">Airline</label>
              <div className="relative">
                <select
                  className={selectStyle}
                  value={selectedAirline || ""}
                  onChange={(e) => setSelectedAirline(Number(e.target.value))}
                >
                  <option value="">Select Airline</option>
                  {airlines.map((airline) => (
                    <option key={airline.airlineId} value={airline.airlineId}>
                      {airline.airlineName} ({airline.airlineCode})
                    </option>
                  ))}
                </select>
                <FontAwesomeIcon icon={faChevronDown} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-600 pointer-events-none text-xs" />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider">Airplane ID</label>
              <div className="relative">
                <select
                  className={selectStyle}
                  value={selectedAirplane || ""}
                  onChange={(e) => setSelectedAirplane(Number(e.target.value))}
                  disabled={!selectedAirline}
                >
                  <option value="">Select Airplane</option>
                  {airplanes.map((airplane) => (
                    <option key={airplane.airplaneId} value={airplane.airplaneId}>
                      {airplane.flightNumber} - {airplane.model}
                    </option>
                  ))}
                </select>
                <FontAwesomeIcon icon={faChevronDown} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-600 pointer-events-none text-xs" />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider">Shipping Date</label>
              <input
                type="datetime-local"
                className={standardInput}
                value={formData.shippingDate}
                onChange={(e) => handleInputChange('shippingDate', e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider">Delivery Status</label>
              <div className="relative">
                <select
                  className={selectStyle}
                  value={formData.deliveryStatus}
                  onChange={(e) => handleInputChange('deliveryStatus', e.target.value)}
                >
                  {DELIVERY_STATUSES.map((status) => (
                    <option key={status} value={status}>
                      {status}
                    </option>
                  ))}
                </select>
                <FontAwesomeIcon icon={faChevronDown} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-600 pointer-events-none text-xs" />
              </div>
            </div>
          </div>
        </div>

        {/* Section 2: Sender & Receiver Information */}
        <div className="bg-[#f2f4f6] rounded-xl p-8 border-l-[6px] border-green-600">
          <div className="flex items-center gap-3 mb-8 text-green-600">
            <FontAwesomeIcon icon={faUser} className="text-2xl" />
            <h3 className="font-bold text-xl tracking-tight text-slate-900">Sender & Receiver Information</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-2">
              <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider">Sender Name</label>
              <input
                type="text"
                placeholder="John Doe"
                className={standardInput}
                value={formData.sender}
                onChange={(e) => handleInputChange('sender', e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider">Receiver Name</label>
              <input
                type="text"
                placeholder="Jane Smith"
                className={standardInput}
                value={formData.receiver}
                onChange={(e) => handleInputChange('receiver', e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider">Telephone Number</label>
              <div className="relative">
                <input
                  type="tel"
                  placeholder="+1234567890"
                  className={standardInput}
                  value={formData.telpNumber}
                  onChange={(e) => handleInputChange('telpNumber', e.target.value)}
                />
                <FontAwesomeIcon icon={faPhone} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 text-sm" />
              </div>
            </div>
          </div>
        </div>

        {/* Section 3: Route & Address */}
        <div className="bg-[#f2f4f6] rounded-xl p-8 border-l-[6px] border-slate-400">
          <div className="flex items-center gap-3 mb-8 text-[#00236f]">
            <FontAwesomeIcon icon={faGlobe} className="text-2xl" />
            <h3 className="font-bold text-xl tracking-tight text-slate-900">Route & Address</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider">Origin Airport (IATA)</label>
              <div className="relative">
                <select
                  className={selectStyle}
                  value={formData.originIata}
                  onChange={(e) => handleInputChange('originIata', e.target.value)}
                >
                  <option value="">Select Origin</option>
                  {airports.map((airport) => (
                    <option key={airport.id} value={airport.iataCode}>
                      {airport.iataCode} - {airport.city}, {airport.country}
                    </option>
                  ))}
                </select>
                <FontAwesomeIcon icon={faChevronDown} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-600 pointer-events-none text-xs" />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider">Destination Airport (IATA)</label>
              <div className="relative">
                <select
                  className={selectStyle}
                  value={formData.destIata}
                  onChange={(e) => handleInputChange('destIata', e.target.value)}
                >
                  <option value="">Select Destination</option>
                  {airports.map((airport) => (
                    <option key={airport.id} value={airport.iataCode}>
                      {airport.iataCode} - {airport.city}, {airport.country}
                    </option>
                  ))}
                </select>
                <FontAwesomeIcon icon={faChevronDown} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-600 pointer-events-none text-xs" />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider">Origin Address</label>
              <div className="relative">
                <input
                  type="text"
                  placeholder="123 Main St, City, Country"
                  className={standardInput}
                  value={formData.originAddress}
                  onChange={(e) => handleInputChange('originAddress', e.target.value)}
                />
                <FontAwesomeIcon icon={faMapMarkerAlt} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 text-sm" />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider">Destination Address</label>
              <div className="relative">
                <input
                  type="text"
                  placeholder="456 Oak Ave, City, Country"
                  className={standardInput}
                  value={formData.destinationAddress}
                  onChange={(e) => handleInputChange('destinationAddress', e.target.value)}
                />
                <FontAwesomeIcon icon={faMapMarkerAlt} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 text-sm" />
              </div>
            </div>
          </div>
        </div>

        {/* Section 4: Product Details */}
        <div className="bg-[#f2f4f6] rounded-xl p-8 border-l-[6px] border-amber-900">
          <div className="flex items-center gap-3 mb-8 text-amber-900">
            <FontAwesomeIcon icon={faBoxesStacked} className="text-2xl" />
            <h3 className="font-bold text-xl tracking-tight">Product Specifications</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider">Product Type</label>
              <div className="relative">
                <select
                  className={selectStyle}
                  value={formData.productType}
                  onChange={(e) => handleInputChange('productType', e.target.value)}
                >
                  <option value="">Select Product Type</option>
                  {PRODUCT_TYPES.map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </select>
                <FontAwesomeIcon icon={faChevronDown} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-600 pointer-events-none text-xs" />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider">Product Weight (KG)</label>
              <input
                type="number"
                step="0.001"
                placeholder="0.000"
                className={standardInput}
                value={formData.productWeight}
                onChange={(e) => handleInputChange('productWeight', e.target.value)}
              />
            </div>
          </div>

          <div className="mt-6 space-y-2">
            <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider">Notes</label>
            <textarea
              placeholder="Cargo/Product notes, Sender Notes, etc."
              className={standardInput + " min-h-[100px]"}
              value={formData.notes}
              onChange={(e) => handleInputChange('notes', e.target.value)}
            />
          </div>
        </div>

        {/* Action Bar */}
        <div className="pt-10 flex items-center justify-between border-t border-slate-300">
          <button
            type="button"
            onClick={() => router.back()}
            className="text-slate-600 font-black text-sm hover:text-slate-900 transition-colors tracking-tight uppercase"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="bg-[#00236f] text-white px-12 py-5 rounded-xl font-black shadow-2xl shadow-blue-900/40 hover:bg-[#001a42] hover:-translate-y-1 active:translate-y-0 transition-all text-sm uppercase tracking-widest disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? 'Updating...' : 'Update Shipment'}
          </button>
        </div>
      </form>
    </div>
  );
}
