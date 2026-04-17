'use client';

import { useState, useEffect } from "react";
import Loader from "@/components/ui/loader";
import React from 'react';
import PricingCard from "@/components/ui/pricingcard";
import ArchitecturalEdge from "@/components/landingpages/architecturaledge";
import Footer from "@/components/landingpages/footer";
import { BlurText } from "@/components/ui/dynamicanimationfonts";

const pricingData = [
  {
    title: "Standard",
    tag: "Small Terminals",
    price: "2,400",
    period: "per month",
    description: "Ideal for growing operations needing reliable real-time tracking and ledger consistency.",
    features: ["Real-time tracking (50 concurrent)", "Basic Analytics Dashboard", "Cloud Manifest Ledger", "Standard API Access"],
    buttonText: "Get Started"
  },
  {
    title: "Enterprise",
    tag: "International Hubs",
    price: "8,900",
    period: "per month",
    description: "Advanced predictive analytics and full fleet management suite for high-volume nodes.",
    features: ["Unlimited Real-time tracking", "Advanced Predictive Analytics", "Full Fleet Management Suite", "Priority 24/7 Logistics Support", "Custom Integration Hooks"],
    buttonText: "Get Started",
    isPopular: true
  },
  {
    title: "Custom",
    tag: "Global Networks",
    price: "Contact",
    period: "bespoke pricing",
    description: "Tailored infrastructure for the world's most complex logistics and movement networks.",
    features: ["White-labeled Cargo Portals", "On-premise Ledger Deployment", "Dedicated Network Architect", "Global Multi-region Sync"],
    buttonText: "Talk to Sales"
  }
];

export default function LandingPage() {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 3000);
    return () => clearTimeout(timer);
  }, []);

  if (isLoading) {
    return <Loader />;
  }

  return (
    <main className="min-h-screen bg-slate-50">
      {/* Hero Section */}
      <section className="pt-40 pb-20 px-10">
        <div className="max-w-7xl mx-auto text-center mb-20 flex flex-col items-center">
          
          <div className="mb-6 flex justify-center">
            <BlurText 
              text="Architecture of Scale" 
              animateBy="letters"
              delay={50}
              className="bg-[#1a2d5a] text-white text-[10px] font-bold px-4 py-1.5 uppercase tracking-widest rounded-full inline-block"
            />
          </div>

          {/* Heading: Centered via flex and text-center */}
          <div className="text-6xl font-black text-[#1a2d5a] tracking-tighter mb-6 leading-none flex justify-center w-full">
            <BlurText 
              text="Precision Pricing for Global Cargo." 
              animateBy="letters" 
              delay={35} 
              className="text-center"
            />
          </div>

          {/* Subtext: Centered via mx-auto and text-center */}
          <div className="text-slate-500 max-w-2xl mx-auto font-semibold text-lg flex justify-center">
            <BlurText 
              text="The Architectural Ledger provides transparent, tiered access to the world's most advanced cargo logistics infrastructure." 
              animateBy="words" 
              delay={40} 
              className="text-center"
            />
          </div>
        </div>

        {/* Pricing Grid */}
        <div className="flex flex-wrap justify-center gap-12 max-w-7xl mx-auto">
          {pricingData.map((tier, index) => (
            <PricingCard key={index} {...tier} />
          ))}
        </div>
      </section>

      {/* Feature Section */}
      <ArchitecturalEdge />

      <Footer />
    </main>
  );
}