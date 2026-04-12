'use client';
import React from 'react';
import Link from 'next/link';
import CtaPrimaryButton from '../ui/ctaprimbutton';
import AnimatedButton from '../ui/animbutton';

export default function CTA() {
  return (
    <section className="py-20 px-10 bg-white">
      <div className="bg-[#1a2d5a] rounded-3xl p-20 text-center text-white relative overflow-hidden shadow-2xl">
        {/* BACKGROUND IMAGE LAYER */}
        <div className="absolute inset-0 opacity-50 bg-[url('/CTAback.png')] bg-cover bg-center" />
        
        <div className="relative z-10 space-y-10">
          <h2 className="text-5xl font-black tracking-tighter leading-tight">
            Ready to synchronize your <br /> logistics?
          </h2>
          <p className="text-blue-200 text-lg max-w-xl mx-auto font-medium">
            Join global leaders who trust SkyLedger for architectural logistics management.
          </p>
          
          <div className="flex flex-col md:flex-row justify-center items-center gap-10">
            {/* Link wrapper for Get Started */}
            <Link href="/pricing" className="block">
              <CtaPrimaryButton text="Get Started Now" />
            </Link>

            {/* Link wrapper for Speak to Sales */}
            <Link href="/pricing" className="block">
              <AnimatedButton 
                text="Speak to Sales" 
                primaryColor="#ffffff" 
                hoverColor="#60a5fa" 
                showArrow={false} 
              />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}