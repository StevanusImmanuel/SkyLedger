'use client';
import React from 'react';
import Link from 'next/link';
import AnimatedButton from './ui/animbutton'; 

export default function About() {
  return (
    <section className="py-24 bg-[#f8f9fa]">
      <div className="container mx-auto px-10 grid lg:grid-cols-2 gap-20 items-center">
        
        {/* Left Side: Text Content */}
        <div className="space-y-8">
          <div className="space-y-4">
            <p className="text-blue-600 font-black text-sm uppercase tracking-[0.5em] mb-2">
              About SkyLedger
            </p>            
            <h2 className="text-5xl font-black text-[#1a2d5a] leading-tight tracking-tight">
              Defining the Architecture <br /> of Movement.
            </h2>
          </div>
          <p className="text-slate-600 text-base font-medium leading-relaxed max-w-xl">
            SkyLedger integrates real-time tracking and predictive efficiency into a singular architectural source of truth.
          </p>
          
          <div className="grid sm:grid-cols-2 gap-6">
            {/* Global Network Card */}
            <div className="p-8 bg-white border-2 border-slate-100 rounded-xl hover:border-[#60a5fa] transition-all group">
              <div className="text-[#60a5fa] mb-5 group-hover:scale-110 transition-transform">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                   <path strokeLinejoin="round" d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9-9c1.657 0 3 4.03 3 9s-1.343 9-3 9m0-18c-1.657 0-3 4.03-3 9s1.343 9 3 9" />
                </svg>
              </div>
              <h4 className="font-black text-[#1a2d5a] text-sm uppercase tracking-widest mb-2">Global Network</h4>
              <p className="text-slate-500 text-xs font-medium">Connecting 140+ countries.</p>
            </div>

            {/* Real-time Tracking Card */}
            <div className="p-8 bg-white border-2 border-slate-100 rounded-xl hover:border-[#60a5fa] transition-all group">
              <div className="text-[#60a5fa] mb-5 group-hover:scale-110 transition-transform">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                  <path d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5" />
                </svg>
              </div>
              <h4 className="font-black text-[#1a2d5a] text-sm uppercase tracking-widest mb-2">Real-time Tracking</h4>
              <p className="text-slate-500 text-xs font-medium">Granular visibility per pallet.</p>
            </div>
          </div>

          <div className="pt-4">
            {/* Link correctly imported and wrapping the button */}
            <Link href="/pricing" className="block">
              <AnimatedButton 
                text="View Enterprise Pricing" 
                primaryColor="#1a2d5a" 
                hoverColor="#60a5fa" 
                showArrow={true} 
              />
            </Link>
          </div>
        </div>

        {/* Right Side: Visual Grid */}
        <div className="grid grid-cols-5 grid-rows-5 gap-4 h-[600px] w-full">
          <div className="row-span-4 col-span-2 rounded-2xl overflow-hidden relative border-2 border-slate-100">
            <div className="absolute inset-0 bg-[url('/Warehouse.png')] bg-cover bg-center" />
          </div>

          <div className="col-start-1 row-start-5 col-span-2 bg-[#1a2d5a] text-white p-6 rounded-2xl flex items-center justify-between">
            <p className="text-3xl font-black text-blue-400">99.9%</p>
            <span className="text-blue-400/20 text-4xl font-black">✓</span>
          </div>

          <div className="col-start-3 row-start-1 col-span-3 bg-blue-600 text-white p-6 rounded-2xl flex items-center justify-between">
            <p className="text-3xl font-black text-white">24/7</p>
            <span className="text-white/30 text-4xl font-black">◈</span>
          </div>

          <div className="row-span-4 col-start-3 row-start-2 col-span-3 rounded-2xl overflow-hidden relative bg-slate-900 border-2 border-[#1a2d5a]">
            <div className="absolute inset-0 bg-[url('/MapLanding.png')] bg-cover bg-center opacity-60" />
          </div>
        </div>

      </div>
    </section>
  );
}