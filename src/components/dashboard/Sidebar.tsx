'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { signOut } from "next-auth/react";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faChartPie, 
  faBox, 
  faFileLines, 
  faGear, 
  faRightFromBracket,
  faChevronLeft,
  faChevronRight 
} from '@fortawesome/free-solid-svg-icons';

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: faChartPie },
  { href: '/shipments', label: 'Shipments', icon: faBox },
  { href: '/reports', label: 'Reports', icon: faFileLines },
  { href: '/settings', label: 'Settings', icon: faGear },
];

export default function Sidebar() {
  const pathname = usePathname();
  
  // State for manual toggle (Locking the sidebar)
  const [isLocked, setIsLocked] = useState(false);
  // State for hover detection
  const [isHovered, setIsHovered] = useState(false);

  // The sidebar is effectively "Open" if it's either locked OR being hovered
  const isOpen = isLocked || isHovered;

  const handleSignOut = async () => {
    await signOut({ callbackUrl: "/login/auth", redirect: true });
  };

  return (
    <aside 
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={`
        relative h-screen sticky top-0 border-r border-slate-200 bg-white flex flex-col
        transition-[width] duration-300 ease-in-out z-40 shadow-sm
        ${isOpen ? 'w-64' : 'w-20'}
      `}
    >
      {/* Manual Toggle Button (Lock Sidebar) */}
      <button 
        onClick={(e) => {
          e.stopPropagation(); // Prevent trigger hover logic
          setIsLocked(!isLocked);
        }}
        className={`
          absolute -right-3 top-10 bg-[#1a2d5a] text-white rounded-full w-6 h-6 
          flex items-center justify-center border border-white z-50 
          hover:scale-110 transition-all shadow-md
          ${isLocked ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}
        `}
      >
        <FontAwesomeIcon icon={isLocked ? faChevronLeft : faChevronRight} size="xs" />
      </button>

      {/* Logo Section */}
      <div className={`flex items-center p-4 mb-6 overflow-hidden ${!isOpen ? 'justify-center' : 'gap-3'}`}>
        <div className="flex-shrink-0">
          <Image 
            src="/SkyLedger no text logo-Photoroom.png" 
            width={28} 
            height={28} 
            alt="SkyLedger Logo" 
          />
        </div>
        <div className={`transition-all duration-300 ${!isOpen ? 'opacity-0 w-0' : 'opacity-100 w-auto'}`}>
          {isOpen && (
            <div className="whitespace-nowrap">
              <span className="block font-bold text-[#1a2d5a]">SkyLedger</span>
              <span className="block text-[10px] text-slate-400 font-bold uppercase tracking-widest">CARGO OPERATIONS</span>
            </div>
          )}
        </div>
      </div>

      {/* Navigation Links */}
      <nav className="flex flex-col gap-1 px-3">
        {navItems.map((item) => {
          const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href));
          
          return (
            <Link 
              key={item.href} 
              href={item.href} 
              className={`
                flex items-center p-3 rounded-lg transition-all duration-200 group
                ${isActive ? 'bg-blue-50 text-blue-700 font-bold' : 'text-slate-500 hover:bg-slate-50'}
                ${!isOpen ? 'justify-center' : 'gap-4'}
              `}
              title={!isOpen ? item.label : ""}
            >
              <div className="flex-shrink-0 w-5 flex justify-center items-center">
                <FontAwesomeIcon icon={item.icon} className="text-lg" fixedWidth />
              </div>
              
              <span className={`
                text-sm transition-all duration-300 overflow-hidden whitespace-nowrap
                ${!isOpen ? 'w-0 opacity-0' : 'w-auto opacity-100'}
              `}>
                {item.label}
              </span>

              {isActive && isOpen && (
                <div className="ml-auto w-1 h-4 bg-blue-700 rounded-full" />
              )}
            </Link>
          );
        })}
      </nav>

      {/* Bottom Actions */}
      <div className="mt-auto p-3 border-t border-slate-100">
        <button 
          onClick={handleSignOut} 
          className={`
            flex items-center p-3 text-red-500 hover:bg-red-50 rounded-lg transition-all w-full
            ${!isOpen ? 'justify-center' : 'gap-4'}
          `}
        >
          <div className="flex-shrink-0 w-5 flex justify-center items-center">
            <FontAwesomeIcon icon={faRightFromBracket} className="text-lg" fixedWidth />
          </div>
          <span className={`
            text-sm font-bold transition-all duration-300 overflow-hidden whitespace-nowrap
            ${!isOpen ? 'w-0 opacity-0' : 'w-auto opacity-100'}
          `}>
            Log Out
          </span>
        </button>
      </div>
    </aside>
  );
}