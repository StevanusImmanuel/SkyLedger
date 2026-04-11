'use client';
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation"; 
import AnimatedButton from "./ui/animbutton";
import LoginButton from "./ui/loginbutton"; 

export default function Nav() {
  const pathname = usePathname();

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-10 py-4 bg-white/90 backdrop-blur-md border-b border-gray-100">
      <div className="flex items-center gap-2">
        <Link href="/" className="flex items-center gap-2">
          <div className="relative w-12 h-12"> 
            <Image 
              src="/SkyLedger no text logo-Photoroom.png" 
              alt="SkyLedger Logo"
              fill
              className="object-contain"
              priority 
            />
          </div>
          <span className="text-[#1a2d5a] font-black text-xl tracking-tighter uppercase">
            SkyLedger
          </span>
        </Link>
      </div>
      
      <div className="hidden md:flex items-center gap-10">
        <Link href="/"> 
          <AnimatedButton 
            text="About Us" 
            primaryColor="#1a2d5a" 
            hoverColor="#60a5fa" 
            showArrow={false}
            // Logic: Active if home or #
            isActive={pathname === "/" || pathname === "#"} 
          />
        </Link>

        <Link href="/tracking">
          <AnimatedButton
            text="Tracking"
            primaryColor="#1a2d5a"
            hoverColor="#60a5fa"
            showArrow={false}
            isActive={pathname === "/tracking"}
          />
        </Link>

        <Link href="/pricing">
          <AnimatedButton
            text="Pricing"
            primaryColor="#1a2d5a"
            hoverColor="#60a5fa"
            showArrow={false}
            isActive={pathname === "/pricing"}
          />
        </Link>
      </div>

      <Link href="/dashboard">
        <LoginButton />
      </Link>
    </nav>
  );
}