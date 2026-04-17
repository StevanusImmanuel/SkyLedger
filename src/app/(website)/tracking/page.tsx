'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import Nav from "@/components/landingpages/nav"; 
import Loader from "@/components/ui/loader";
import AnimatedButton from '@/components/ui/animbutton';
import Footer from '@/components/landingpages/footer';
import { BlurText } from '@/components/ui/dynamicanimationfonts';

export default function LandingPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [awbNumber, setAwbNumber] = useState('');

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 3000);
    return () => clearTimeout(timer);
  }, []);

  const handleTrack = (e: React.FormEvent) => {
    e.preventDefault();
    if (!awbNumber) return;
    console.log("Tracking AWB:", awbNumber);
  };

  if (isLoading) {
    return <Loader />;
  }

  return (
    <main className="min-h-screen bg-white">
      <Nav />

      {/* Hero Header */}
      <section className="relative h-[55vh] w-full flex flex-col justify-end overflow-hidden pt-16">
        <Image
          src="/USERaWb1.png"
          alt="SkyLedger Air Freight"
          fill
          className="object-cover brightness-75"
          sizes="100vw"
          priority
        />

        <div className="relative z-10 px-10 pb-12 max-w-7xl mx-auto w-full text-center">
          {/* Centered with text-center and block BlurText */}
          <div className="text-white text-4xl md:text-5xl font-medium tracking-tight mb-2 flex justify-center">
            <BlurText 
              text="Fast & Precise Air Freight" 
              animateBy="words" 
              delay={40} 
              className="text-center"
            />
          </div>
          <div className="text-white text-5xl md:text-7xl font-black tracking-tighter mb-8 italic flex justify-center">
             <BlurText 
              text="#SKYLEDGER CARGO" 
              animateBy="letters" 
              delay={35} 
              className="text-center"
            />
          </div>

          <ul className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 text-white/90 font-bold text-xs uppercase tracking-widest max-w-3xl mx-auto">
            <li className="flex items-center justify-center gap-3"><span className="w-5 h-5 rounded-full border border-white flex items-center justify-center text-[8px]">1</span> Simple Order Process</li>
            <li className="flex items-center justify-center gap-3"><span className="w-5 h-5 rounded-full border border-white flex items-center justify-center text-[8px]">2</span> On-Time Delivery</li>
            <li className="flex items-center justify-center gap-3"><span className="w-5 h-5 rounded-full border border-white flex items-center justify-center text-[8px]">3</span> Professional Handling</li>
            <li className="flex items-center justify-center gap-3"><span className="w-5 h-5 rounded-full border border-white flex items-center justify-center text-[8px]">4</span> Track & Trace System</li>
            <li className="flex items-center justify-center gap-3"><span className="w-5 h-5 rounded-full border border-white flex items-center justify-center text-[8px]">5</span> Maximum Capacity</li>
          </ul>
        </div>
      </section>

      {/* Tracking Input Section */}
      <section className="py-24 px-10 bg-[#f8fafc]">
        <div className="max-w-4xl mx-auto text-center flex flex-col items-center">
          <div className="text-5xl font-black text-[#1a2d5a] tracking-tighter mb-4">
             <BlurText 
              text="Precision Cargo Tracking" 
              animateBy="letters" 
              delay={30} 
              className="text-center"
            />
          </div>
          <div className="text-slate-500 font-semibold mb-12">
             <BlurText 
              text="Access real-time telemetry and ledger-verified status updates." 
              animateBy="words" 
              delay={50} 
              className="text-center"
            />
          </div>

          <form 
            onSubmit={handleTrack}
            className="bg-white p-3 rounded-2xl shadow-2xl border-2 border-slate-100 flex flex-col md:flex-row items-center gap-4 transition-all hover:border-[#60a5fa] w-full"
          >
            <div className="flex-grow flex items-center px-4 w-full">
              <input
                type="text"
                id="awbNumber"
                name="awbNumber"
                placeholder="Enter AWB Number"
                value={awbNumber}
                onChange={(e) => setAwbNumber(e.target.value)}
                autoComplete="off"
                className="w-full py-4 text-xl font-bold text-[#1a2d5a] placeholder-slate-300 focus:outline-none"
              />
            </div>

            {/* FIXED: Removed outer <button> to avoid hydration error, used relative div for alignment */}
            <div 
              className="relative min-w-[220px] h-full cursor-pointer overflow-hidden rounded-xl"
              onClick={(e) => {
                const form = (e.currentTarget as HTMLElement).closest('form');
                if (form) form.requestSubmit();
              }}
            >
              <AnimatedButton
                text="Track Shipment"
                primaryColor="#1a2d5a"
                hoverColor="#60a5fa"
                showArrow={true}
              />
            </div>
          </form>

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