"use client";

import React, { useMemo, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faBarcode,
  faInfoCircle,
  faGlobe,
  faBoxesStacked,
  faChevronDown,
  faUser,
  faPhone,
  faMapMarkerAlt,
} from "@fortawesome/free-solid-svg-icons";
import { useNotifications } from "@/components/ui/notification-provider";
import { ConfirmationModal } from "@/components/ui/confirmation-modal";
import { FormError } from "@/components/ui/form-error";
import {
  calculateShippingFeeFromInput,
  formatShippingFee,
} from "@/lib/shipments/shipping-fee";
import { PageTitle } from "@/components/ui/page-title";
import { apiFetch } from "@/lib/api-client";

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

const WEIGHT_UNITS = ["Kilogram", "Tonnes"];

const DELIVERY_TYPES = [
  "Airport-to-Airport (A2A)",
  "Door-to-Door (D2D)",
  "Door-to-Airport (D2A)",
  "Airport-to-Door (A2D)",
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

export default function NewShipmentPage() {
  const router = useRouter();
  const { addNotification } = useNotifications();
  const [airlines, setAirlines] = useState<Airline[]>([]);
  const [airplanes, setAirplanes] = useState<Airplane[]>([]);
  const [airports, setAirports] = useState<Airport[]>([]);
  const [selectedAirline, setSelectedAirline] = useState<number | null>(null);
  const [selectedAirplane, setSelectedAirplane] = useState<number | null>(null);
  const [awbNumber, setAwbNumber] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Form fields
  const [formData, setFormData] = useState({
    shippingDate: "",
    sender: "",
    receiver: "",
    telpNumber: "",
    originAddress: "",
    destinationAddress: "",
    originIata: "",
    destIata: "",
    productType: "",
    productWeight: "",
    weightUnit: "Kilogram",
    deliveryType: "",
    shippingFee: "",
    deliveryStatus: "Booked",
    priority: "standard",
    notes: "",
  });
  const shippingFeeAmount = useMemo(
    () => calculateShippingFeeFromInput(formData.productWeight, formData.priority, formData.weightUnit),
    [formData.productWeight, formData.priority, formData.weightUnit]
  );
  const shippingFeeDisplay = shippingFeeAmount === null ? "" : formatShippingFee(shippingFeeAmount);

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

      // Generate AWB number with airline code
      const airline = airlines.find(a => a.airlineId === selectedAirline);
      if (airline) {
        const randomNum = Math.floor(100000 + Math.random() * 900000);
        setAwbNumber(`${airline.airlineCode}-${randomNum}`);
      }
    }
  }, [selectedAirline, airlines]);

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
      newErrors.shippingDate = "Shipping date is required";
    }

    if (!formData.sender.trim()) {
      newErrors.sender = "Sender name is required";
    }

    if (!formData.receiver.trim()) {
      newErrors.receiver = "Receiver name is required";
    }

    if (!formData.telpNumber.trim()) {
      newErrors.telpNumber = "Telephone number is required";
    } else if (!/^\d+$/.test(formData.telpNumber)) {
      newErrors.telpNumber = "Phone number must contain only digits";
    } else if (formData.telpNumber.length < 10 || formData.telpNumber.length > 13) {
      newErrors.telpNumber = "Phone number must be between 10 and 13 digits";
    }

    if (!formData.originIata) {
      newErrors.originIata = "Origin airport is required";
    }

    if (!formData.destIata) {
      newErrors.destIata = "Destination airport is required";
    }

    if (formData.originIata && formData.destIata && formData.originIata === formData.destIata) {
      newErrors.destIata = "Destination airport must be different from origin airport";
    }

    if (!formData.originAddress.trim()) {
      newErrors.originAddress = "Origin address is required";
    }

    if (!formData.destinationAddress.trim()) {
      newErrors.destinationAddress = "Destination address is required";
    }

    if (!formData.productType) {
      newErrors.productType = "Product type is required";
    }

    if (!formData.productWeight || Number(formData.productWeight) <= 0) {
      newErrors.productWeight = "Product weight must be greater than 0";
    } else if (isNaN(Number(formData.productWeight))) {
      newErrors.productWeight = "Product weight must be a valid number";
    }

    if (!formData.deliveryType) {
      newErrors.deliveryType = "Delivery type is required";
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      addNotification({
        variant: 'destructive',
        title: 'Validation Error',
        description: 'Please fill in all required fields correctly.',
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

  const handleConfirmCreate = async () => {
    setIsSubmitting(true);

    try {
      const res = await apiFetch('/api/shipments', {
        method: 'POST',
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
          title: 'Shipment created successfully!',
          description: `AWB Number: ${data.data.awbNumber}`,
          primaryAction: {
            label: 'View shipments',
            onClick: () => router.push('/shipments'),
          },
        });
        router.push('/shipments');
      } else {
        addNotification({
          variant: 'destructive',
          title: 'Failed to create shipment',
          description: data.error || 'An error occurred while creating the shipment.',
        });
      }
    } catch (error: any) {
      console.error('Failed to create shipment:', error);
      addNotification({
        variant: 'destructive',
        title: 'Failed to create shipment',
        description: error.message || 'An unexpected error occurred. Please try again.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    // Clear error for this field when user starts typing
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }

    if (field === "telpNumber") {
      // Only accept digits and limit to 13 characters
      const onlyNumbers = value.replace(/\D/g, "").slice(0, 13);

      setFormData(prev => ({
        ...prev,
        [field]: onlyNumbers,
      }));

      return;
    }

    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  // Shared classes for uniformity and readability
  const heavyInput = "w-full bg-[#e9ecef] border-2 border-transparent py-5 px-5 rounded-lg font-mono text-2xl text-slate-900 font-bold focus:ring-0 focus:border-[#00236f] transition-all placeholder:text-slate-400 outline-none";
  const standardInput = "w-full bg-white border border-slate-300 rounded-lg p-4 font-bold text-sm text-slate-900 focus:border-[#00236f] focus:ring-1 focus:ring-[#00236f] outline-none transition-all placeholder:text-slate-400";
  const selectStyle = "w-full bg-white border border-slate-300 rounded-lg p-4 text-base font-bold text-slate-900 focus:border-[#00236f] focus:ring-1 focus:ring-[#00236f] outline-none appearance-none cursor-pointer";

  return (
    <div className="p-10 max-w-6xl mx-auto w-full animate-in fade-in duration-500">
      <PageTitle title="New Shipment" />
      {/* Page Header */}
      <div className="mb-10">
        <span className="text-[11px] font-extrabold uppercase tracking-widest text-[#00236f] bg-blue-100 px-2 py-1 rounded">
          Logistics Entry
        </span>
        <h2 className="text-4xl font-bold mt-4 tracking-tight text-slate-900">Create New Shipment</h2>
        <p className="text-slate-600 text-sm mt-1 font-medium">
          Assign a new Air Waybill and manifest details to the flight ledger.
        </p>
      </div>

      <form className="space-y-8" onSubmit={handleSubmit} noValidate>

        {/* Section 1: Identification */}
        <div className="bg-[#f2f4f6] rounded-xl p-8 border-l-[6px] border-[#00236f]">
          <div className="flex items-center gap-3 mb-8 text-[#00236f]">
            <FontAwesomeIcon icon={faBarcode} className="text-2xl" />
            <h3 className="font-bold text-xl tracking-tight">Primary Identification</h3>
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
                      setErrors(prev => {
                        const newErrors = { ...prev };
                        delete newErrors.airline;
                        return newErrors;
                      });
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
                      setErrors(prev => {
                        const newErrors = { ...prev };
                        delete newErrors.airplane;
                        return newErrors;
                      });
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
              <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider">AWB Number (Auto-Generated)</label>
              <div className="relative">
                <input
                  type="text"
                  value={awbNumber}
                  readOnly
                  placeholder="Select airline first"
                  className={heavyInput}
                />
                <FontAwesomeIcon icon={faInfoCircle} className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-500 text-lg" />
              </div>
              <p className="text-[10px] text-slate-500 font-bold">Format: Airline Code + 6-digit number</p>
            </div>

            <div className="space-y-2">
              <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider">Shipping Date</label>
              <input
                type="datetime-local"
                className={`${standardInput} ${errors.shippingDate ? 'border-red-500' : ''}`}
                value={formData.shippingDate}
                onChange={(e) => handleInputChange('shippingDate', e.target.value)}
              />
              <FormError message={errors.shippingDate || ""} />
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
                 placeholder="Enter sender name"
                 className={`${standardInput} ${errors.sender ? 'border-red-500' : ''}`}
                 value={formData.sender}
                 onChange={(e) => handleInputChange('sender', e.target.value)}
                 
              />
              <FormError message={errors.sender || ""} />
            </div>

            <div className="space-y-2">
              <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider">Receiver Name</label>
              <input
                 type="text"
                 placeholder="Enter receiver name"
                 className={`${standardInput} ${errors.receiver ? 'border-red-500' : ''}`}
                 value={formData.receiver}
                 onChange={(e) => handleInputChange('receiver', e.target.value)}
                 
               />
              <FormError message={errors.receiver || ""} />
            </div>

            <div className="space-y-2">
              <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider">Telephone Number</label>
              <div className="relative">
                <div className="relative">
  <input
    type="tel"
    placeholder="Enter your phone number"
    className={`${standardInput} ${
      errors.telpNumber ? "border-red-500" : ""
    }`}
    value={formData.telpNumber}
    onChange={(e) => handleInputChange("telpNumber", e.target.value)}
  />

  <FontAwesomeIcon
    icon={faPhone}
    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 text-sm"
  />
</div>

<FormError message={errors.telpNumber || ""} />
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
                  className={`${selectStyle} ${errors.originIata ? 'border-red-500' : ''}`}
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
              <FormError message={errors.originIata || ""} />
            </div>

            <div className="space-y-2">
              <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider">Destination Airport (IATA)</label>
              <div className="relative">
                <select
                  className={`${selectStyle} ${errors.destIata ? 'border-red-500' : ''}`}
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
              <FormError message={errors.destIata || ""} />
            </div>

            <div className="space-y-2">
              <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider">Origin Address</label>
              <div className="relative">
                <input
                  type="text"
                  placeholder="Enter Origin Address Details"
                  className={`${standardInput} ${errors.originAddress ? 'border-red-500' : ''}`}
                  value={formData.originAddress}
                  onChange={(e) => handleInputChange('originAddress', e.target.value)}
                  
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
                  placeholder="Enter Destination Address Details"
                  className={`${standardInput} ${errors.destinationAddress ? 'border-red-500' : ''}`}
                  value={formData.destinationAddress}
                  onChange={(e) => handleInputChange('destinationAddress', e.target.value)}
                  
                />
                <FontAwesomeIcon icon={faMapMarkerAlt} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 text-sm" />
              </div>
              <FormError message={errors.destinationAddress || ""} />
            </div>

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
          </div>
        </div>

        {/* Section 4: Cargo & Product Details */}
        <div className="bg-[#f2f4f6] rounded-xl p-8 border-l-[6px] border-amber-900">
          <div className="flex items-center gap-3 mb-8 text-amber-900">
            <FontAwesomeIcon icon={faBoxesStacked} className="text-2xl" />
            <h3 className="font-bold text-xl tracking-tight">Product Specifications</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-2">
              <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider">Product Type</label>
              <div className="relative">
                <select
                  className={`${selectStyle} ${errors.productType ? 'border-red-500' : ''}`}
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
              <FormError message={errors.productType || ""} />
            </div>

            <div className="space-y-2">
              <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider">Product Weight</label>
              <input
                type="number"
                step="0.001"
                min="0"
                placeholder="Enter Product Weight (must be a number)"
                className={`${standardInput} ${errors.productWeight ? 'border-red-500' : ''}`}
                value={formData.productWeight}
                onChange={(e) => handleInputChange('productWeight', e.target.value)}
              />
              <FormError message={errors.productWeight || ""} />
            </div>

            <div className="space-y-2">
              <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider">Weight Unit</label>
              <div className="relative">
                <select
                  className={selectStyle}
                  value={formData.weightUnit}
                  onChange={(e) => handleInputChange('weightUnit', e.target.value)}
                  
                >
                  {WEIGHT_UNITS.map((unit) => (
                    <option key={unit} value={unit}>
                      {unit}
                    </option>
                  ))}
                </select>
                <FontAwesomeIcon icon={faChevronDown} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-600 pointer-events-none text-xs" />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider">Delivery Type</label>
              <div className="relative">
                <select
                  className={`${selectStyle} ${errors.deliveryType ? 'border-red-500' : ''}`}
                  value={formData.deliveryType}
                  onChange={(e) => handleInputChange('deliveryType', e.target.value)}
                  
                >
                  <option value="">Select Delivery Type</option>
                  {DELIVERY_TYPES.map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </select>
                <FontAwesomeIcon icon={faChevronDown} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-600 pointer-events-none text-xs" />
              </div>
              <FormError message={errors.deliveryType || ""} />
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
            Cancel Entry
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="bg-[#00236f] text-white px-12 py-5 rounded-xl font-black shadow-2xl shadow-blue-900/40 hover:bg-[#001a42] hover:-translate-y-1 active:translate-y-0 transition-all text-sm uppercase tracking-widest disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? 'Creating...' : 'Create Shipment'}
          </button>
        </div>
      </form>

      {/* Confirmation Modal */}
      <ConfirmationModal
        isOpen={showConfirmModal}
        onClose={() => setShowConfirmModal(false)}
        onConfirm={handleConfirmCreate}
        title="Confirm Shipment Creation"
        description="Are you sure you want to create this shipment? Please verify all details are correct."
        confirmText="Create Shipment"
        cancelText="Review Details"
        variant="create"
        isLoading={isSubmitting}
      />
    </div>
  );
}
