'use client';
import React from 'react';
import Link from 'next/link';
import AnimatedButton from '../ui/animbutton';
import { BlurText } from '../ui/dynamicanimationfonts';

export default function Hero() {
  return (
    <section className="relative h-[90vh] min-h-[700px] flex items-center bg-slate-900 overflow-hidden">
      {/* BACKGROUND IMAGE LAYER */}
      <div className="absolute inset-0 z-0">
        <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-900/60 to-transparent z-10" />
        <div 
          className="absolute inset-0 bg-[url('/LandingPagebg.png')] bg-cover bg-center opacity-70 scale-105"
          style={{ backgroundColor: '#1e293b' }} 
        />
      </div>

      <div className="container mx-auto px-10 relative z-20 grid lg:grid-cols-12 gap-12 items-center">
        {/* Text Content */}
        <div className="lg:col-span-7 space-y-10">
          <div className="min-h-[40px]">
            <BlurText
              text="The Architectural Ledger"
              delay={40}
              animateBy="letters"
              className="inline-block bg-[#1a2d5a] text-white text-[18px] font-black px-5 py-2 rounded-sm tracking-[0.3em] uppercase border border-white/20 shadow-xl"
            />
          </div>

          {/* Headline: Changed <h1> to <div> for hydration safety */}
          <div className="space-y-2">
            <div className="text-7xl md:text-8xl font-black text-white leading-[0.95] tracking-tighter">
              <BlurText
                text="Precision Cargo"
                animateBy="letters"
                delay={30}
                className="block"
                animationFrom={{ opacity: 0, filter: 'blur(10px)', transform: 'translate3d(0,20px,0)' }}
                animationTo={[{ opacity: 1, filter: 'blur(0px)', transform: 'translate3d(0,0,0)' }]}
              />
              <BlurText
                text="Orchestration."
                animateBy="letters"
                delay={40}
                className="block text-blue-400"
                animationFrom={{ opacity: 0, filter: 'blur(10px)', transform: 'translate3d(0,20px,0)' }}
                animationTo={[{ opacity: 1, filter: 'blur(0px)', transform: 'translate3d(0,0,0)' }]}
              />
            </div>
          </div>

          {/* Subtext: Changed <p> to <div> for hydration safety */}
          <div className="text-slate-200 text-xl md:text-2xl max-w-xl leading-relaxed font-medium">
            <BlurText
              text="Transform your global logistics with the industry's most advanced digital ledger. We bring architectural precision to every flight path."
              animateBy="words"
              delay={40}
            />
          </div>
          
          <div className="pt-6">
            <Link href="/tracking" className="inline-block scale-125 origin-left transition-transform hover:scale-[1.3]">
              <AnimatedButton 
                  text="Track Your Cargo" 
                  primaryColor="#ffffff" 
                  hoverColor="#60a5fa"
                  showArrow={true}
              />
            </Link>
          </div>
        </div>

        {/* FLOATING STATS CARD (STRICTLY UNCHANGED) */}
        <div className="hidden lg:block lg:col-span-5 bg-white/95 backdrop-blur-xl p-10 rounded-2xl shadow-[0_35px_60px_-15px_rgba(0,0,0,0.6)] border border-white w-full max-w-xl ml-auto">
          <div className="flex justify-between items-center mb-8">
            <h3 className="font-bold text-slate-400 text-[11px] uppercase tracking-[0.2em]">
              Global Active Manifests
            </h3>
            <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center text-blue-500 font-bold shadow-sm">
              ↗
            </div>
          </div>

          <div className="mb-10">
            <div className="flex items-baseline gap-2">
              <div className="text-6xl font-black text-[#1a2d5a] tracking-tighter">
                1,284.42
              </div>
              <span className="text-2xl font-bold text-slate-400">Tonnage</span>
            </div>

            <div className="relative mt-5 h-2 w-full bg-slate-100 rounded-full overflow-hidden">
              <div 
                className="absolute top-0 left-0 h-full bg-gradient-to-r from-[#1a2d5a] to-blue-500 rounded-full transition-all duration-1000 ease-out" 
                style={{ width: '72%' }} 
              />
            </div>
            
            <div className="flex justify-between mt-2.5">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">System Capacity Utilization</span>
              <span className="text-[10px] font-black text-[#1a2d5a] uppercase tracking-widest">72%</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-12 pt-8 border-t border-slate-100">
            <div className="space-y-4">
              <div>
                <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-1">In-Transit</p>
                <p className="text-4xl font-black text-[#1a2d5a]">842</p>
              </div>
              <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                <div className="h-full bg-[#1a2d5a] w-[65%]" />
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <p className="text-[11px] font-black text-blue-500 uppercase tracking-widest mb-1">Cleared</p>
                <p className="text-4xl font-black text-blue-500">412</p>
              </div>
              <div className="h-1.5 w-full bg-blue-50 rounded-full overflow-hidden">
                <div className="h-full bg-blue-500 w-[35%]" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}