'use client';
import React from 'react';
import Image from 'next/image';

const ArchitecturalEdge = () => {
  return (
    <section className="py-24 px-10 bg-white">
      <div className="max-w-7xl mx-auto flex flex-col lg:flex-row gap-16 items-center">
        
        {/* Left Content: Text & Features */}
        <div className="lg:w-1/2">
          <h2 className="text-5xl font-black text-[#1a2d5a] tracking-tighter mb-8 leading-tight">
            The Architectural Edge
          </h2>
          <p className="text-slate-500 font-semibold mb-12 text-lg leading-relaxed max-w-xl">
            Every tier includes our proprietary Ledger architecture, ensuring data 
            immutability across every node in your logistics network. No hidden 
            fees, no opaque scaling.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Security Feature */}
            <div className="p-8 bg-slate-50 border-2 border-slate-100 rounded-xl hover:border-[#60a5fa] transition-colors group">
              <div className="text-[#60a5fa] mb-6 group-hover:scale-110 transition-transform">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <h4 className="font-black text-[#1a2d5a] text-sm uppercase tracking-widest mb-3">Security</h4>
              <p className="text-slate-500 text-sm font-medium leading-relaxed">End-to-end cargo encryption protocols.</p>
            </div>

            {/* Latency Feature */}
            <div className="p-8 bg-slate-50 border-2 border-slate-100 rounded-xl hover:border-[#60a5fa] transition-colors group">
              <div className="text-[#60a5fa] mb-6 group-hover:scale-110 transition-transform">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h4 className="font-black text-[#1a2d5a] text-sm uppercase tracking-widest mb-3">Latency</h4>
              <p className="text-slate-500 text-sm font-medium leading-relaxed">&lt;200ms global data propagation.</p>
            </div>
          </div>
        </div>

        {/* Right Visual: Image & Uptime Overlay */}
        <div className="lg:w-1/2 relative w-full h-full">
          <div className="relative w-full aspect-video rounded-3xl overflow-hidden border-[6px] border-[#1a2d5a] shadow-[12px_12px_0px_0px_rgba(26,45,90,1)]">
            
            {/* Background Image: Put your network/map image in /public folder */}
            <Image 
              src="/logisticsOperations.png" 
              alt="Global Logistics Infrastructure"
              fill
              className="object-cover brightness-[0.4] grayscale-[0.2]"
              priority
            />

            {/* The Floating Uptime Card */}
            <div className="absolute inset-0 flex items-center justify-center p-12">
              <div className="bg-white/95 backdrop-blur-sm p-10 rounded-2xl border-4 border-[#1a2d5a] shadow-2xl text-center transform -rotate-2 hover:rotate-0 transition-transform duration-300">
                <h3 className="text-5xl font-black text-[#1a2d5a] mb-3 tracking-tighter italic">
                  99.99% Uptime
                </h3>
                <p className="text-slate-600 text-sm font-black uppercase tracking-wider max-w-[220px] mx-auto">
                  Enterprise SLA guaranteed by Architectural Logistics.
                </p>
              </div>
            </div>
          </div>
        </div>

      </div>
    </section>
  );
};

export default ArchitecturalEdge;