'use client';
import React, { useState } from 'react';
import { BlurText } from '../ui/dynamicanimationfonts';


const MailIcon = () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/></svg>;
const PhoneIcon = () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"/></svg>;
const MapPinIcon = () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/></svg>;
const ClockIcon = () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>;

const contactInfo = [
  { Icon: MailIcon, text: "SkyLedger@gmail.com", isLink: true },
  { Icon: PhoneIcon, text: "082179389270", isLink: true },
  { Icon: MapPinIcon, text: "Yogyakarta, Indonesia" },
  { Icon: ClockIcon, text: "08.00 - 22.00 UTC+7" }
];

export default function Contact() {
  const [formData, setFormData] = useState({ name: '', email: '', message: '' });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Submitting form:", formData);
    // Add your API submission logic here
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const inputClass = "w-full px-6 py-4 bg-white/10 border-2 border-white/10 text-white placeholder-blue-100/50 rounded-xl focus:outline-none focus:border-[#60a5fa]/60 transition-colors font-medium text-lg";

  return (
    <section className="py-24 bg-white px-10">
      <div className="container mx-auto max-w-7xl grid lg:grid-cols-12 rounded-[40px] overflow-hidden shadow-2xl relative border-2 border-slate-100">
        
        {/* Left Side: Dark Form Area */}
        <div className="lg:col-span-8 bg-[#1a2d5a] p-16 relative overflow-hidden">
          {/* Background Image Layer (Opacity-40 and mix-blend for consistency) */}
          <div className="absolute inset-0 opacity-40 bg-[url('/img8.png')] bg-cover bg-center mix-blend-overlay" />
          
          {/* Form Content Layer */}
          <form onSubmit={handleSubmit} className="relative z-10 space-y-10 flex flex-col items-center text-center">
            
            <div className="space-y-4">
              <div className="text-white text-6xl font-black tracking-tighter leading-[1.1] mb-2 flex justify-center w-full">
                <BlurText
                  text="Contact Us"
                  animateBy="letters"
                  delay={35}
                  className="text-center"
                />
              </div>
              <div className="text-blue-100 text-lg md:text-xl font-medium leading-relaxed flex justify-center max-w-xl">
                 <BlurText 
                    text="Please don’t hesitate to reach out to us whenever you need assistance. We’ll make sure to respond to you promptly."
                    animateBy="words"
                    delay={50}
                    className="text-center"
                 />
              </div>
            </div>

            <div className="space-y-6 w-full max-w-2xl">
              <input type="text" name="name" placeholder="Name" value={formData.name} onChange={handleChange} required className={inputClass}/>
              <input type="email" name="email" placeholder="Email" value={formData.email} onChange={handleChange} required className={inputClass}/>
              <textarea name="message" placeholder="Message" value={formData.message} onChange={handleChange} required rows={5} className={inputClass}/>
              
              {/* Button: Fixed style to match other SkyLedger primary buttons */}
              <div className="pt-4 flex justify-center">
                 <button type="submit" className="px-10 py-4 bg-blue-600 hover:bg-[#60a5fa] text-white font-black text-sm uppercase tracking-widest rounded-xl transition-all shadow-md active:scale-95 group flex items-center gap-3">
                   Submit Request
                   <span className="group-hover:translate-x-1 transition-transform">↗</span>
                 </button>
              </div>
            </div>
          </form>
        </div>

        {/* Right Side: Clean Info Area */}
        <div className="lg:col-span-4 bg-[#f8fafc] p-16 flex flex-col justify-center border-l border-slate-100">
          <div className="space-y-12">
            <div className="mb-4">
               <div className="font-black text-[#1a2d5a] text-sm uppercase tracking-widest flex justify-center">
                  <BlurText text="Core Logistics Info" animateBy="letters" delay={40} className="text-center" />
               </div>
               <div className="text-5xl font-black text-[#1a2d5a] tracking-tighter leading-none flex justify-center">
                  <BlurText text="Get in Touch." animateBy="letters" delay={30} className="text-center" />
               </div>
            </div>

            <div className="space-y-6">
              {contactInfo.map((info, i) => (
                <div key={i} className="p-6 bg-white border-2 border-slate-100 rounded-xl flex items-center gap-6 group hover:border-[#60a5fa] transition-colors shadow-sm">
                  <div className="text-[#60a5fa] group-hover:scale-110 transition-transform">
                    <info.Icon />
                  </div>
                  <div className="text-slate-600 text-sm md:text-base font-semibold">
                    {info.isLink ? (
                      <a href={info.text.includes('@') ? `mailto:${info.text}` : `tel:${info.text}`} className="hover:text-blue-600 transition-colors">
                        {info.text}
                      </a>
                    ) : (
                      <span>{info.text}</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}