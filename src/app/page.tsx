"use client";

import { useState, useEffect } from "react";
import Loader from "@/components/ui/loader";
import Nav from "@/components/landingpages/nav";
import Hero from "@/components/landingpages/hero";
import About from "@/components/landingpages/about";
import Capabilities from "@/components/capabilities";
import CTA from "@/components/landingpages/cta";
import Footer from "@/components/landingpages/footer";

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
    <main className="min-h-screen bg-white font-sans selection:bg-blue-100">
      <Nav />
      {/* pt-16 accounts for the fixed navbar height */}
      <div className="pt-16 animate-in fade-in slide-in-from-bottom-4 duration-1000">
        <Hero />
        <About />
        <Capabilities />
        <CTA />
        <Footer />
      </div>
    </main>
  );
}