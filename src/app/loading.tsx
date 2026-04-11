"use client"; 

import React from 'react';
import Loader from '@/components/loader'; 

export default function Loading() {
  return (
    <div className="flex h-screen w-full items-center justify-center bg-[#E2E8F0]">
      <Loader />
    </div>
  );
}
