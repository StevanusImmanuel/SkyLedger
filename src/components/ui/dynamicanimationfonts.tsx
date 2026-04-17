'use client';

import dynamic from 'next/dynamic';

export const BlurText = dynamic(() => import('../ui/blurtext'), { 
  ssr: false,
  loading: () => <span className="opacity-0">...</span> 
});

export const TextType = dynamic(() => import('../ui/texttype'), { 
  ssr: false,
  loading: () => <span className="opacity-0">...</span> 
});