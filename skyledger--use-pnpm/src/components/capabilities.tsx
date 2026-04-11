export default function Capabilities() {
  const capabilities = [
    {
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
          <line x1="8" y1="21" x2="16" y2="21" />
          <line x1="12" y1="17" x2="12" y2="21" />
        </svg>
      ),
      title: "Immutable Ledger",
      desc: "Blockchain-backed transaction history ensures every cargo movement is logged with cryptographic permanence and transparency.",
    },
    {
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
        </svg>
      ),
      title: "Dynamic Routing",
      desc: "AI-driven logistics engine that recalculates flight paths and transit methods in real-time based on weather and port congestion.",
    },
    {
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
        </svg>
      ),
      title: "Architectural Safety",
      desc: "Enterprise-grade security protocols ensuring that your cargo manifests and trade secrets remain protected within our vault.",
    },
  ];

  return (
    <section className="bg-[#F8FAFC] py-32 px-10">
      <div className="container mx-auto">
        <div className="text-center mb-20 space-y-4">
          <span className="text-blue-600 font-black text-xs uppercase tracking-[0.4em]">
            Core Capabilities
          </span>
          <h2 className="text-5xl font-black text-[#1a2d5a] tracking-tight">
            Precision-Engineered Components
          </h2>
        </div>
        
        <div className="grid md:grid-cols-3 gap-10">
          {capabilities.map((cap, i) => (
            <div 
              key={i} 
              className="group relative p-10 rounded-3xl bg-white border border-slate-100 transition-all duration-500 ease-out
                         shadow-[0_10px_30px_-15px_rgba(0,0,0,0.05)] 
                         hover:shadow-[0_40px_60px_-20px_rgba(26,45,90,0.15)] 
                         hover:-translate-y-2"
            >
              {/* Icon Container */}
              <div className="w-14 h-14 rounded-2xl bg-slate-50 text-[#1a2d5a] flex items-center justify-center mb-8 
                              group-hover:bg-[#1a2d5a] group-hover:text-white group-hover:rotate-3 transition-all duration-500">
                {cap.icon}
              </div>

              <h3 className="font-black text-[#1a2d5a] text-2xl mb-4 tracking-tight">
                {cap.title}
              </h3>
              
              <p className="text-slate-500 text-base leading-relaxed mb-6">
                {cap.desc}
              </p>

              {/* Decorative Accent Line */}
              <div className="w-8 h-1 bg-slate-100 group-hover:w-16 group-hover:bg-blue-500 transition-all duration-500" />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}