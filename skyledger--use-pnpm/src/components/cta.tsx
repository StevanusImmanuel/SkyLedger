export default function CTA() {
  return (
    <section className="py-20 px-10 bg-white">
      <div className="bg-[#1a2d5a] rounded-3xl p-20 text-center text-white relative overflow-hidden shadow-2xl">
        <div className="absolute inset-0 opacity-50 bg-[url('/CTAback.png')]" />
        <div className="relative z-10 space-y-8">
          <h2 className="text-5xl font-black tracking-tighter leading-tight">Ready to synchronize your <br /> logistics?</h2>
          <p className="text-blue-200 text-lg max-w-xl mx-auto">Join global leaders who trust SkyLedger for architectural logistics management.</p>
          <div className="flex justify-center gap-6">
            <button className="bg-white text-[#1a2d5a] px-12 py-4 rounded font-black text-xs uppercase tracking-widest hover:bg-slate-100 transition shadow-xl">Get Started Now</button>
            <button className="border-2 border-white/20 px-12 py-4 rounded font-black text-xs uppercase tracking-widest hover:bg-white/10 transition">Speak to Sales</button>
          </div>
        </div>
      </div>
    </section>
  );
}