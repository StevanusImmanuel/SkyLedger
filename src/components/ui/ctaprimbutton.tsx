'use client';
import React from 'react';

interface Props {
  text: string;
}

export default function CtaPrimaryButton({ text }: Props) {
  return (
    <button className="group relative z-10 flex items-center justify-center gap-4 overflow-hidden rounded-full border-2 border-white bg-white px-8 py-4 text-xs font-black uppercase tracking-widest text-[#1a2d5a] transition-colors duration-300 shadow-xl isolation-auto hover:text-white">
      
      {/* 1. THE ANIMATED BACKGROUND LAYER (Now using #60a5fa) */}
      <div className="absolute inset-0 -z-10 flex items-center justify-center">
        <div className="aspect-square w-0 rounded-full bg-[#60a5fa] transition-all duration-700 ease-in-out group-hover:w-[300%] group-hover:duration-700" />
      </div>

      {/* 2. THE TEXT (Stay on top) */}
      <span className="relative z-20">
        {text}
      </span>

      {/* 3. THE ICON */}
      <svg 
        className="relative z-20 w-6 h-6 transition-all duration-500 ease-linear group-hover:rotate-90 group-hover:bg-white text-[#1a2d5a] rounded-full p-1.5 bg-slate-100 border border-slate-200 group-hover:border-none rotate-45" 
        viewBox="0 0 16 19" 
        xmlns="http://www.w3.org/2000/svg"
      >
        <path 
          d="M7 18C7 18.5523 7.44772 19 8 19C8.55228 19 9 18.5523 9 18H7ZM8.70711 0.292893C8.31658 -0.0976311 7.68342 -0.0976311 7.29289 0.292893L0.928932 6.65685C0.538408 7.04738 0.538408 7.68054 0.928932 8.07107C1.31946 8.46159 1.95262 8.46159 2.34315 8.07107L8 2.41421L13.6569 8.07107C14.0474 8.46159 14.6805 8.46159 15.0711 8.07107C15.4616 7.68054 15.4616 7.04738 15.0711 6.65685L8.70711 0.292893ZM9 18L9 1H7L7 18H9Z" 
          fill="currentColor" 
        />
      </svg>
    </button>
  );
}