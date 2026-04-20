"use client";

import React, { useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { 
  faBarcode, 
  faInfoCircle, 
  faPlaneDeparture, 
  faGlobe, 
  faBoxesStacked, 
  faChevronDown, 
  faShieldHalved 
} from "@fortawesome/free-solid-svg-icons";

export default function NewShipmentPage() {
  const [priority, setPriority] = useState("Standard");

  // Shared classes for unformity and readability
  const heavyInput = "w-full bg-[#e9ecef] border-2 border-transparent py-5 px-5 rounded-lg font-mono text-2xl text-slate-900 font-bold focus:ring-0 focus:border-[#00236f] transition-all placeholder:text-slate-400 outline-none";
  const standardInput = "w-full bg-white border border-slate-300 rounded-lg p-4 font-bold text-lg text-slate-900 uppercase focus:border-[#00236f] focus:ring-1 focus:ring-[#00236f] outline-none transition-all placeholder:text-slate-400";
  const selectStyle = "w-full bg-white border border-slate-300 rounded-lg p-4 text-base font-bold text-slate-900 focus:border-[#00236f] focus:ring-1 focus:ring-[#00236f] outline-none appearance-none cursor-pointer";

  return (
    <div className="p-10 max-w-6xl mx-auto w-full animate-in fade-in duration-500">
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

      <form className="space-y-8" onSubmit={(e) => e.preventDefault()}>
        
        {/* Section 1: Identification */}
        <div className="bg-[#f2f4f6] rounded-xl p-8 border-l-[6px] border-[#00236f]">
          <div className="flex items-center gap-3 mb-8 text-[#00236f]">
            <FontAwesomeIcon icon={faBarcode} className="text-2xl" />
            <h3 className="font-bold text-xl tracking-tight">Primary Identification</h3>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
            <div className="space-y-2">
              <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider">AWB Number</label>
              <div className="relative">
                <input 
                  type="text" 
                  placeholder="000-00000000"
                  className={heavyInput}
                />
                <FontAwesomeIcon icon={faInfoCircle} className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-500 text-lg" />
              </div>
              <p className="text-[10px] text-slate-500 font-bold">Format: 3-digit prefix + 8-digit serial</p>
            </div>

            <div className="space-y-2">
              <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider">Flight ID</label>
              <div className="relative">
                <input 
                  type="text" 
                  placeholder="SL-402"
                  className={heavyInput.replace('font-mono', 'font-sans')}
                />
                <FontAwesomeIcon icon={faPlaneDeparture} className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-500 text-lg" />
              </div>
              <p className="text-[10px] text-slate-500 font-bold">Scheduled commercial or freighter code</p>
            </div>
          </div>
        </div>

        {/* Section 2: Route & Logistics */}
        <div className="bg-[#f2f4f6] rounded-xl p-8 border-l-[6px] border-slate-400">
          <div className="flex items-center gap-3 mb-8 text-[#00236f]">
            <FontAwesomeIcon icon={faGlobe} className="text-2xl" />
            <h3 className="font-bold text-xl tracking-tight text-slate-900">Route & Logistics</h3>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-2">
              <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider">Origin (IATA)</label>
              <input type="text" placeholder="LHR" className={standardInput} />
            </div>
            <div className="space-y-2">
              <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider">Destination (IATA)</label>
              <input type="text" placeholder="DXB" className={standardInput} />
            </div>
            <div className="space-y-2">
              <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider">Priority Level</label>
              <div className="flex bg-white border border-slate-300 rounded-lg p-1.5 h-[60px]">
                {["Standard", "High", "Urgent"].map((level) => (
                  <button
                    key={level}
                    type="button"
                    onClick={() => setPriority(level)}
                    className={`flex-1 rounded-md text-[11px] font-black uppercase transition-all tracking-tighter ${
                      priority === level 
                        ? "bg-[#00236f] text-white shadow-lg" 
                        : "text-slate-500 hover:text-slate-900 hover:bg-slate-50"
                    }`}
                  >
                    {level}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Section 3: Cargo & Guidance */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-[#f2f4f6] rounded-xl p-8 border-l-[6px] border-amber-900">
            <div className="flex items-center gap-3 mb-8 text-amber-900">
              <FontAwesomeIcon icon={faBoxesStacked} className="text-2xl" />
              <h3 className="font-bold text-xl tracking-tight">Product Specifications</h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-2">
                <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider">Product Type</label>
                <div className="relative">
                  <select className={selectStyle}>
                    <option>General Cargo</option>
                    <option>Electronics (DG)</option>
                    <option>Pharmaceuticals</option>
                  </select>
                  <FontAwesomeIcon icon={faChevronDown} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-600 pointer-events-none text-xs" />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider">Quantity (PCS)</label>
                <input type="number" placeholder="1" className={standardInput.replace('uppercase', '')} />
              </div>
              <div className="space-y-2">
                <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider">Weight (KG)</label>
                <input type="number" placeholder="0.00" className={standardInput.replace('uppercase', '')} />
              </div>
            </div>
          </div>

          {/* Guidance Card */}
          <div className="bg-white rounded-2xl shadow-xl shadow-slate-200 border border-slate-200 overflow-hidden flex flex-col group transition-transform hover:scale-[1.01]">
            <div className="h-32 relative">
              <img 
                src="https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?q=80&w=2070&auto=format&fit=crop" 
                alt="Warehouse" 
                className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-500 opacity-80"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-900 to-transparent" />
              <span className="absolute bottom-3 left-4 text-[10px] font-black text-white uppercase tracking-[0.2em]">Guidance</span>
            </div>
            <div className="p-6 flex-1 flex flex-col justify-center bg-slate-50">
              <p className="text-[13px] text-slate-700 italic leading-relaxed font-bold">
                "Ensure all dangerous goods are declared at the Product Type level to trigger automatic safety manifest protocols."
              </p>
              <div className="mt-6 flex items-center gap-2 text-[#00236f]">
                <FontAwesomeIcon icon={faShieldHalved} className="text-sm" />
                <span className="text-[10px] font-black uppercase tracking-tighter">Standard Operating Procedure</span>
              </div>
            </div>
          </div>
        </div>

        {/* Action Bar */}
        <div className="pt-10 flex items-center justify-between border-t border-slate-300">
          <button type="button" className="text-slate-600 font-black text-sm hover:text-slate-900 transition-colors tracking-tight uppercase">
            Cancel Entry
          </button>
          <button 
            type="submit"
            className="bg-[#00236f] text-white px-12 py-5 rounded-xl font-black shadow-2xl shadow-blue-900/40 hover:bg-[#001a42] hover:-translate-y-1 active:translate-y-0 transition-all text-sm uppercase tracking-widest"
          >
            Create Shipment
          </button>
        </div>
      </form>
    </div>
  );
}