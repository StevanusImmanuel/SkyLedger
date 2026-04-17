'use client';
import Nav from "@/components/landingpages/nav";
import Footer from "@/components/landingpages/footer";

export default function WebsiteLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-white min-h-screen"> 
      <Nav />
      <main className="pt-16 animate-in fade-in duration-700">
        {children}
      </main>
    </div>
  );
}