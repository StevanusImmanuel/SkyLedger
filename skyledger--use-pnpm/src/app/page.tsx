"use client"; 

import { useState, useEffect } from "react";
import Loader from "@/components/loader";

export default function LandingPage() {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Simulate the time it takes to load the cargo system (e.g., 2 seconds)
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 5000);

    return () => clearTimeout(timer);
  }, []);

  if (isLoading) {
    return <Loader />;
  }

  return (
    <main className="animate-in fade-in duration-1000">
      {/* This is where your Company Profile and Pricing parts go */}
      <nav className="p-6 border-b">Logo | Pricing | About</nav>
      <section className="py-20 text-center">
        <h1 className="text-5xl font-black">Global Cargo Solutions</h1>
        <p className="mt-4 text-gray-600">Secure, Fast, and Reliable Shipping.</p>
      </section>
    </main>
  );
}