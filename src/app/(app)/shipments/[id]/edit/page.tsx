"use client";

import React, { useMemo, useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faPlaneDeparture,
  faGlobe,
  faBoxesStacked,
  faChevronDown,
  faUser,
  faPhone,
  faMapMarkerAlt,
} from "@fortawesome/free-solid-svg-icons";
import { useNotifications } from "@/components/ui/notification-provider";
import { ConfirmationModal } from "@/components/ui/confirmation-modal";
import {
  calculateShippingFeeFromInput,
  formatShippingFee,
} from "@/lib/shipments/shipping-fee";
import { PageTitle } from "@/components/ui/page-title";
import { FormError } from "@/components/ui/form-error";

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

  // Menggunakan tipe any agar aman dari eror TypeScript linting
  sender_name?: any;
  receiver_name?: any;
  telp_number?: any;
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
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  

  // Form fields (State internal form aplikasi)
  const [formData, setFormData] = useState({
    deliveryStatus: "",
    productType: "",
    priority: "standard",
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

  const shippingFeeAmount = useMemo(
    () => calculateShippingFeeFromInput(formData.productWeight, formData.priority),
    [formData.productWeight, formData.priority]
  );
  const shippingFeeDisplay = shippingFeeAmount === null ? "" : formatShippingFee(shippingFeeAmount);

  // Fetch shipment data
  useEffect(() => {
    async function fetchShipment() {
      try {
        const res = await fetch(`/api/shipments/${shipmentId}`);
        const data = await res.json();
        if (data.success) {
          const shipment: Shipment = data.data;

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

          // Extract data from notes field
          const getNoteValue = (label: string) => {
            if (!shipment.notes) return "";
            const match = shipment.notes.match(
              new RegExp(`(?:^|,\\s*)${label}:\\s*([\\s\\S]*?)(?=,\\s*(?:Shipping Date|Sender|Receiver|Tel|Origin|Dest|Delivery|Fee|Weight Unit|Notes):|$)`, 'i')
            );
            return match?.[1]?.trim() || "";
          };

          const shippingDateFromNotes = getNoteValue('Shipping Date');
          const senderFromNotes = getNoteValue('Sender');
          const receiverFromNotes = getNoteValue('Receiver');
          const telpFromNotes = getNoteValue('Tel');
          const originAddressFromNotes = getNoteValue('Origin');
          const destAddressFromNotes = getNoteValue('Dest');
          const shippingFeeFromNotes = getNoteValue('Fee');

          setFormData({
            deliveryStatus: displayDeliveryStatus,
            productType: shipment.productType || "",
            priority: shipment.priority || "standard",
            shippingDate: shippingDateFromNotes || "",
            productWeight: shipment.weightKg,
            originAddress: originAddressFromNotes || "",
            destinationAddress: destAddressFromNotes || "",
            originIata: shipment.originAirport?.iataCode || "",
            destIata: shipment.destAirport?.iataCode || "",
            notes: getNoteValue('Notes') || shipment.notes || "",
            sender: senderFromNotes || "",
            receiver: receiverFromNotes || "",
            telpNumber: telpFromNotes || "",
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

    // Clear previous errors
    setErrors({});

    // Validate form
    const newErrors: Record<string, string> = {};

    if (!selectedAirline) {
      newErrors.airline = "Please select an airline";
    }

    if (!selectedAirplane) {
      newErrors.airplane = "Please select an airplane";
    }

    if (!formData.shippingDate) {
      newErrors.shippingDate = "Shipping date is ";
    }

    if (!formData.sender.trim()) {
      newErrors.sender = "Sender name is ";
    }

    if (!formData.receiver.trim()) {
      newErrors.receiver = "Receiver name is ";
    }

    if (!formData.telpNumber.trim()) {
      newErrors.telpNumber = "Telephone number is ";
    } else if (!/^\d+$/.test(formData.telpNumber)) {
      newErrors.telpNumber = "Phone number must contain only digits";
    } else if (formData.telpNumber.length < 10 || formData.telpNumber.length > 13) {
      newErrors.telpNumber = "Phone number must be between 10 and 13 digits";
    }

    if (!formData.originIata) {
      newErrors.originIata = "Origin airport is ";
    }

    if (!formData.destIata) {
      newErrors.destIata = "Destination airport is ";
    }

    if (formData.originIata && formData.destIata && formData.originIata === formData.destIata) {
      newErrors.destIata = "Destination airport must be different from origin airport";
    }

    if (!formData.originAddress.trim()) {
      newErrors.originAddress = "Origin address is ";
    }

    if (!formData.destinationAddress.trim()) {
      newErrors.destinationAddress = "Destination address is ";
    }

    if (!formData.productType) {
      newErrors.productType = "Product type is ";
    }

    if (!formData.productWeight || Number(formData.productWeight) <= 0) {
      newErrors.productWeight = "Product weight must be greater than 0";
    } else if (isNaN(Number(formData.productWeight))) {
      newErrors.productWeight = "Product weight must be a valid number";
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      addNotification({
        variant: 'destructive',
        title: 'Validation Error',
        description: 'Please fill in all  fields correctly.',
      });
      return;
    }

    if (shippingFeeAmount === null) {
      addNotification({
        variant: 'destructive',
        title: 'Invalid shipment weight',
        description: 'Product weight must be a non-negative number and priority must be valid.',
      });
      return;
    }

    // Show confirmation modal instead of submitting directly
    setShowConfirmModal(true);
  };

  const handleConfirmUpdate = async () => {
    setIsSubmitting(true);

    try {
      const res = await fetch(`/api/shipments/${shipmentId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          airlineId: selectedAirline,
          airplaneId: selectedAirplane,
          ...formData,
          shippingFee: shippingFeeDisplay,
        }),
      });

      const data = await res.json();

      if (data.success) {
        setShowConfirmModal(false);
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

  // Perbaikan Poin 2: Menghapus huruf (Regex \D) & batasi maksimal 12 digit angka nomor telepon
  const handleInputChange = (field: string, value: string) => {
    if (field === 'telpNumber') {
      const onlyNumbers = value.replace(/\D/g, "");
      const truncatedValue = onlyNumbers.slice(0, 12);

      setFormData(prev => ({ ...prev, [field]: truncatedValue }));

      // Clear error when user types
      if (errors.telpNumber) {
        setErrors(prev => ({ ...prev, telpNumber: '' }));
      }
      return;
    }

    setFormData(prev => ({ ...prev, [field]: value }));

    // Clear error for this field when user types
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const standardInput = "w-full bg-white border border-slate-300 rounded-lg p-4 font-bold text-sm text-slate-900 focus:border-[#00236f] focus:ring-1 focus:ring-[#00236f] outline-none transition-all placeholder:text-slate-400";
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
      <PageTitle title="Edit Shipment" />
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
                  className={`${selectStyle} ${errors.airline ? 'border-red-500' : ''}`}
                  value={selectedAirline || ""}
                  onChange={(e) => {
                    setSelectedAirline(Number(e.target.value));
                    if (errors.airline) {
                      setErrors(prev => ({ ...prev, airline: '' }));
                    }
                  }}
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
              <FormError message={errors.airline || ""} />
            </div>

            <div className="space-y-2">
              <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider">Airplane ID</label>
              <div className="relative">
                <select
                  className={`${selectStyle} ${errors.airplane ? 'border-red-500' : ''}`}
                  value={selectedAirplane || ""}
                  onChange={(e) => {
                    setSelectedAirplane(Number(e.target.value));
                    if (errors.airplane) {
                      setErrors(prev => ({ ...prev, airplane: '' }));
                    }
                  }}
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
              <FormError message={errors.airplane || ""} />
            </div>

            <div className="space-y-2">
              <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider">Shipping Date</label>
              <input
                type="datetime-local"
                className={`${standardInput} ${errors.shippingDate ? 'border-red-500' : ''}`}
                value={formData.shippingDate}
                onChange={(e) => {
                  handleInputChange('shippingDate', e.target.value);
                  if (errors.shippingDate) {
                    setErrors(prev => ({ ...prev, shippingDate: '' }));
                  }
                }}
              />
              <FormError message={errors.shippingDate || ""} />
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
                placeholder="Type your name here"
                className={`${standardInput} ${errors.sender ? 'border-red-500' : ''}`}
                value={formData.sender}
                onChange={(e) => {
                  handleInputChange('sender', e.target.value);
                  if (errors.sender) {
                    setErrors(prev => ({ ...prev, sender: '' }));
                  }
                }}
              />
              <FormError message={errors.sender || ""} />
            </div>

            <div className="space-y-2">
              <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider">Receiver Name</label>
              <input
                type="text"
                placeholder="Type your name here"
                className={`${standardInput} ${errors.receiver ? 'border-red-500' : ''}`}
                value={formData.receiver}
                onChange={(e) => {
                  handleInputChange('receiver', e.target.value);
                  if (errors.receiver) {
                    setErrors(prev => ({ ...prev, receiver: '' }));
                  }
                }}
              />
              <FormError message={errors.receiver || ""} />
            </div>

            <div className="space-y-2">
              <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider">Telephone Number</label>
              <div className="relative">
                <input
                  type="tel"
                  placeholder="Enter your phone number"
                  className={`${standardInput} ${errors.telpNumber ? 'border-red-500' : ''}`}
                  value={formData.telpNumber}
                  onChange={(e) => {
                    handleInputChange('telpNumber', e.target.value);
                    if (errors.telpNumber) {
                      setErrors(prev => ({ ...prev, telpNumber: '' }));
                    }
                  }}
                />
                <FontAwesomeIcon icon={faPhone} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 text-sm" />
              </div>
              <FormError message={errors.telpNumber || ""} />
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
                  className={`${selectStyle} ${errors.originIata ? 'border-red-500' : ''}`}
                  value={formData.originIata}
                  onChange={(e) => {
                    handleInputChange('originIata', e.target.value);
                    if (errors.originIata) {
                      setErrors(prev => ({ ...prev, originIata: '' }));
                    }
                  }}
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
              <FormError message={errors.originIata || ""} />
            </div>

            <div className="space-y-2">
              <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider">Destination Airport (IATA)</label>
              <div className="relative">
                <select
                  className={`${selectStyle} ${errors.destIata ? 'border-red-500' : ''}`}
                  value={formData.destIata}
                  onChange={(e) => {
                    handleInputChange('destIata', e.target.value);
                    if (errors.destIata) {
                      setErrors(prev => ({ ...prev, destIata: '' }));
                    }
                  }}
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
              <FormError message={errors.destIata || ""} />
            </div>

            <div className="space-y-2">
              <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider">Origin Address</label>
              <div className="relative">
                <input
                  type="text"
                  placeholder="123 Main St, City, Country"
                  className={`${standardInput} ${errors.originAddress ? 'border-red-500' : ''}`}
                  value={formData.originAddress}
                  onChange={(e) => {
                    handleInputChange('originAddress', e.target.value);
                    if (errors.originAddress) {
                      setErrors(prev => ({ ...prev, originAddress: '' }));
                    }
                  }}
                />
                <FontAwesomeIcon icon={faMapMarkerAlt} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 text-sm" />
              </div>
              <FormError message={errors.originAddress || ""} />
            </div>

            <div className="space-y-2">
              <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider">Destination Address</label>
              <div className="relative">
                <input
                  type="text"
                  placeholder="456 Oak Ave, City, Country"
                  className={`${standardInput} ${errors.destinationAddress ? 'border-red-500' : ''}`}
                  value={formData.destinationAddress}
                  onChange={(e) => {
                    handleInputChange('destinationAddress', e.target.value);
                    if (errors.destinationAddress) {
                      setErrors(prev => ({ ...prev, destinationAddress: '' }));
                    }
                  }}
                />
                <FontAwesomeIcon icon={faMapMarkerAlt} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 text-sm" />
              </div>
              <FormError message={errors.destinationAddress || ""} />
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
              <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider">Priority Level</label>
              <div className="relative">
                <select
                  className={selectStyle}
                  value={formData.priority}
                  onChange={(e) => handleInputChange('priority', e.target.value)}
                >
                  <option value="standard">Standard</option>
                  <option value="express">Express</option>
                  <option value="critical">Critical</option>
                </select>
                <FontAwesomeIcon icon={faChevronDown} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-600 pointer-events-none text-xs" />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider">Product Type</label>
              <div className="relative">
                <select
                  className={`${selectStyle} ${errors.productType ? 'border-red-500' : ''}`}
                  value={formData.productType}
                  onChange={(e) => {
                    handleInputChange('productType', e.target.value);
                    if (errors.productType) {
                      setErrors(prev => ({ ...prev, productType: '' }));
                    }
                  }}
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
              <FormError message={errors.productType || ""} />
            </div>

            <div className="space-y-2">
              <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider">Product Weight (KG)</label>
              <input
                type="number"
                step="0.001"
                min="0"
                placeholder="0.000 (must be a number)"
                className={`${standardInput} ${errors.productWeight ? 'border-red-500' : ''}`}
                value={formData.productWeight}
                onChange={(e) => {
                  handleInputChange('productWeight', e.target.value);
                  if (errors.productWeight) {
                    setErrors(prev => ({ ...prev, productWeight: '' }));
                  }
                }}
              />
              <FormError message={errors.productWeight || ""} />
            </div>

            <div className="space-y-2">
              <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider">Shipping Fee (USD)</label>
              <input
                type="text"
                placeholder="$0.00"
                className={standardInput}
                value={shippingFeeDisplay}
                readOnly
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

      {/* Confirmation Modal */}
      <ConfirmationModal
        isOpen={showConfirmModal}
        onClose={() => setShowConfirmModal(false)}
        onConfirm={handleConfirmUpdate}
        title="Confirm Shipment Update"
        description="Are you sure you want to update this shipment? All changes will be saved."
        confirmText="Update Shipment"
        cancelText="Review Changes"
        variant="update"
        isLoading={isSubmitting}
      />
    </div>
  );
}