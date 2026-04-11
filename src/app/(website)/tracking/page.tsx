'use client';
import React, { useState } from 'react';
import Image from 'next/image';
import AnimatedButton from '@/components/ui/animbutton';
import Footer from '@/components/footer';

export default function TrackingPage() {
  const [awbNumber, setAwbNumber] = useState('');

  return (
    <main className="min-h-screen bg-white">
      {/* Hero Header matching screenshot */}
      <section className="relative h-[55vh] w-full flex flex-col justify-end overflow-hidden">
        <Image 
          src="/USERaWb1.png" 
          alt="SkyLedger Air Freight"
          fill
          className="object-cover brightness-75"
          priority
        />
        
        <div className="relative z-10 px-10 pb-12 max-w-7xl mx-auto w-full">
          <h2 className="text-white text-4xl md:text-5xl font-medium tracking-tight mb-2">
            Fast & Precise Air Freight
          </h2>
          <h1 className="text-white text-5xl md:text-7xl font-black tracking-tighter mb-8 italic">
            #SKYLEDGER CARGO
          </h1>
          
          <ul className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 text-white/90 font-bold text-xs uppercase tracking-widest">
            <li className="flex items-center gap-3"><span className="w-5 h-5 rounded-full border border-white flex items-center justify-center text-[8px]">1</span> Simple Order Process</li>
            <li className="flex items-center gap-3"><span className="w-5 h-5 rounded-full border border-white flex items-center justify-center text-[8px]">2</span> On-Time Delivery</li>
            <li className="flex items-center gap-3"><span className="w-5 h-5 rounded-full border border-white flex items-center justify-center text-[8px]">3</span> Professional Handling</li>
            <li className="flex items-center gap-3"><span className="w-5 h-5 rounded-full border border-white flex items-center justify-center text-[8px]">4</span> Track & Trace System</li>
            <li className="flex items-center gap-3"><span className="w-5 h-5 rounded-full border border-white flex items-center justify-center text-[8px]">5</span> Maximum Capacity</li>
          </ul>
        </div>
      </section>

      {/* Tracking Input Section */}
      <section className="py-24 px-10 bg-[#f8fafc]">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-5xl font-black text-[#1a2d5a] tracking-tighter mb-4">
            Precision Cargo Tracking
          </h2>
          <p className="text-slate-500 font-semibold mb-12">
            Access real-time telemetry and ledger-verified status updates.
          </p>

          <div className="bg-white p-3 rounded-2xl shadow-2xl border-2 border-slate-100 flex flex-col md:flex-row items-center gap-4 transition-all hover:border-[#60a5fa]">
            <div className="flex-grow flex items-center px-4 w-full">
              <input 
                type="text" 
                placeholder="Enter AWB Number"
                value={awbNumber}
                onChange={(e) => setAwbNumber(e.target.value)}
                className="w-full py-4 text-xl font-bold text-[#1a2d5a] placeholder-slate-300 focus:outline-none"
              />
            </div>
            
            {/* Button Container matching SkyLedger theme */}
            <div className="bg-[#1a2d5a] rounded-xl overflow-hidden min-w-[220px]">
              <AnimatedButton 
                text="Track Shipment"
                primaryColor="#ffffff"
                hoverColor="#60a5fa"
                showArrow={true}
              />
            </div>
          </div>
          
          <div className="mt-6 flex justify-center gap-8 text-[10px] font-black text-slate-400 uppercase tracking-widest">
            <span>Example: AWB-772-90123</span>
            <span className="text-[#60a5fa]">Direct API Access Available</span>
          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
}