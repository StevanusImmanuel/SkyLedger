export default function About() {
  return (
    <section className="py-24 bg-[#f8f9fa]">
      <div className="container mx-auto px-10 grid lg:grid-cols-2 gap-20 items-center">
        
        {/* LEFT SIDE: TEXT CONTENT */}
        <div className="space-y-8">
          <div className="space-y-4">
            <p className="text-blue-600 font-black text-sm uppercase tracking-[0.5em] mb-2">About SkyLedger</p>            
            <h2 className="text-5xl font-black text-[#1a2d5a] leading-tight tracking-tight">
              Defining the <br /> Architecture of <br /> Movement.
            </h2>
          </div>
          <p className="text-slate-600 text-base leading-relaxed max-w-xl">
            SkyLedger was founded on the principle that global logistics should be as reliable as structural engineering. We provide a source of truth that integrates real-time tracking and predictive efficiency.
          </p>
          
          <div className="grid sm:grid-cols-2 gap-4 pt-4">
            <div className="bg-white p-6 rounded-xl border border-slate-100 shadow-sm">
              <div className="text-blue-600 font-bold mb-3  text-lg">◈</div>
              <p className="font-bold text-[#1a2d5a] text-sm mb-1">Global Network</p>
              <p className="text-[11px] text-slate-500 leading-relaxed">A resilient grid connecting 140+ countries.</p>
            </div>
            <div className="bg-white p-6 rounded-xl border border-slate-100 shadow-sm">
              <div className="text-blue-600 font-bold mb-3  text-lg">✓</div>
              <p className="font-bold text-[#1a2d5a] text-sm mb-1">Real-time Tracking</p>
              <p className="text-[11px] text-slate-500 leading-relaxed">Granular visibility down to the pallet level.</p>
            </div>
          </div>

          <button className="bg-[#1a2d5a] text-white px-8 py-4 rounded-sm font-bold text-xs uppercase tracking-widest hover:bg-blue-900 transition-all flex items-center gap-2">
            View Enterprise Pricing <span>→</span>
          </button>
        </div>

        {/* RIGHT SIDE: YOUR COORDINATE-BASED GRID */}
        <div className="grid grid-cols-5 grid-rows-5 gap-4 h-[600px] w-full">
          
          {/* 1. WAREHOUSE IMAGE (row-span-3 col-span-2) */}
          <div className="row-span-4 col-span-2 col-start-1 row-start-1 rounded-2xl overflow-hidden relative shadow-lg">
            <div className="absolute inset-0 bg-[url('/Warehouse.png')] bg-cover bg-center" />
          </div>

          {/* 2. 99.9% ACCURACY (Updated to Horizontal Bar Style) */}
          <div className="col-start-1 row-start-5 col-span-2 row-span-1 bg-[#1a2d5a] text-white p-6 rounded-2xl flex items-center justify-between shadow-xl">
            <div>
              <p className="text-3xl font-black text-blue-400">99.9%</p>
              <p className="text-[10px] font-black uppercase tracking-widest opacity-70">Accuracy Rate</p>
            </div>
            <span className="text-blue-400/20 text-4xl">✓</span>
          </div>

          {/* 3. 24/7 NETWORK UPTIME (Top Right Bar) */}
          <div className="col-start-3 row-start-1 col-span-3 row-span-1 bg-blue-600 text-white p-6 rounded-2xl flex items-center justify-between shadow-lg">
            <div>
              <p className="text-3xl font-black text-white">24/7</p>
              <p className="text-[10px] font-black uppercase tracking-widest opacity-80">Network Uptime</p>
            </div>
            <span className="text-white/30 text-4xl">◈</span>
          </div>

          {/* 4. MAP IMAGE (The Foundation) */}
          <div className="row-span-4 col-start-3 row-start-2 col-span-3 rounded-2xl overflow-hidden relative shadow-2xl bg-slate-900">
            <div className="absolute inset-0 bg-[url('/MapLanding.png')] bg-cover bg-center opacity-60" />
            <div className="absolute inset-0 bg-gradient-to-t from-blue-900/40 to-transparent" />
          </div>
        </div>

      </div>
    </section>
  );
}