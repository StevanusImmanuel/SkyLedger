import Image from "next/image";

export default function Nav() {
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-10 py-4 bg-white/90 backdrop-blur-md border-b border-gray-100">
      <div className="flex items-center gap-2">
        {/* LOGO IMAGE */}
        <div className="relative w-8 h-8"> 
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
      </div>
      
      <div className="hidden md:flex items-center gap-10 text-[11px] font-black uppercase tracking-widest text-slate-400">
        <a href="#" className="text-[#1a2d5a] border-b-2 border-[#1a2d5a] pb-1">About Us</a>
        <a href="#" className="hover:text-[#1a2d5a] transition-colors">Tracking</a>
        <a href="#" className="hover:text-[#1a2d5a] transition-colors">Pricing</a>
      </div>

      <button className="bg-[#1a2d5a] text-white px-10 py-4 rounded-sm font-black text-xs uppercase tracking-widest hover:bg-blue-800 transition shadow-2xl active:scale-95">
        Login
      </button>
    </nav>
  );
}