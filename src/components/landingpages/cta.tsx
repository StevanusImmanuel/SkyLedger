'use client';
import React from 'react';
import Link from 'next/link';
import CtaPrimaryButton from '../ui/ctaprimbutton';
import AnimatedButton from '../ui/animbutton';
import { BlurText } from '../ui/dynamicanimationfonts';

export default function CTA() {
  return (
    <section className="py-24 px-10 bg-white">
      {/* 1. Main container */}
      <div className="bg-[#1a2d5a] rounded-[40px] p-20 flex flex-col items-center justify-center text-center text-white relative overflow-hidden shadow-2xl">
        
        {/* BACKGROUND IMAGE LAYER */}
        <div className="absolute inset-0 opacity-40 bg-[url('/CTAback.png')] bg-cover bg-center mix-blend-overlay" />
        
        <div className="relative z-10 w-full max-w-4xl mx-auto flex flex-col items-center">
          
          {/* 2. Header: CHANGED FROM <h2> TO <div> TO PREVENT NESTED <P> */}
          <div className="text-6xl md:text-7xl font-black tracking-tighter leading-[1.1] mb-8 w-full flex justify-center">
            <BlurText
              text="Ready to synchronize your logistics?"
              animateBy="letters"
              delay={35}
              className="inline-block text-center"
              animationFrom={{ opacity: 0, filter: 'blur(8px)' }}
              animationTo={[{ opacity: 1, filter: 'blur(0px)' }]}
            />
          </div>

          {/* 3. Subtext: CHANGED FROM <p> TO <div> TO PREVENT NESTED <P> */}
          <div className="text-blue-100 text-xl md:text-2xl max-w-2xl font-medium leading-relaxed mb-12 flex justify-center">
            <BlurText 
              text="Join global leaders who trust SkyLedger for architectural logistics management."
              animateBy="words"
              delay={50}
              className="inline-block text-center"
            />
          </div>
          
          {/* 4. Buttons */}
          <div className="flex flex-wrap justify-center items-center gap-8 md:gap-12 w-full">
            <Link href="/pricing" className="transition-transform hover:scale-105 active:scale-95">
              <div className="px-4 py-2">
                <CtaPrimaryButton text="Get Started Now" />
              </div>
            </Link>

            <Link href="/pricing" className="transition-transform hover:scale-105 active:scale-95">
              <div className="px-4 py-2">
                <AnimatedButton 
                  text="Speak to Sales" 
                  primaryColor="#ffffff" 
                  hoverColor="#60a5fa" 
                  showArrow={false} 
                />
              </div>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}