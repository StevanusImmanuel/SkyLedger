"use client";

import React from 'react';
import styles from '@/components/loader.module.css';

const Loader = () => {
  return (
    <div className="flex h-screen w-full flex-col items-center justify-center bg-[#E2E8F0] gap-4">
      
      <div className={styles.loader} />
      
    </div>
  );
};

export default Loader;