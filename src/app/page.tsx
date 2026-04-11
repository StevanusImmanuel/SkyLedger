"use client";

import { useState, useEffect } from "react";
import Loader from "@/components/loader";
import Nav from "@/components/nav";
import Hero from "@/components/hero";
import About from "@/components/about";
// ... other imports

export default function LandingPage() {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 3000);
    return () => clearTimeout(timer);
  }, []);

  // While true, the code below this block is never reached
  if (isLoading) {
    return <Loader />;
  }

  return (
    <main className="min-h-screen bg-white">
      <Nav /> {/* Nav only mounts once isLoading is false */}
      <div className="pt-16">
        <Hero />
        <About />
        {/* ... */}
      </div>
    </main>
  );
}