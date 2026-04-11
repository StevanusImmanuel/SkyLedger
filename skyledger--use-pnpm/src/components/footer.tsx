export default function Footer() {
  return (
    <footer className="py-12 px-10 border-t border-slate-100 text-slate-400 text-[10px] font-bold uppercase tracking-widest">
      <div className="container mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
        <p>© 2026 SkyLedger Architectural Logistics. Yogyakarta, ID.</p>
        <div className="flex gap-10">
          <a href="#" className="hover:text-[#1a2d5a]">Privacy Policy</a>
          <a href="#" className="hover:text-[#1a2d5a]">Terms of Service</a>
          <a href="#" className="hover:text-[#1a2d5a]">GSA Program</a>
        </div>
      </div>
    </footer>
  );
}