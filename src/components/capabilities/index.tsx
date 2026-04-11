import React from 'react';
import { SectionWrapper } from './capabilitiesstyle';

const capabilities = [
  { title: "Immutable Ledger", desc: "Blockchain-backed transaction history ensures every cargo movement is logged.", tag: "CORE", index: "01" },
  { title: "Dynamic Routing", desc: "AI-driven logistics engine that recalculates flight paths in real-time.", tag: "TECH", index: "02" },
  { title: "Architectural Safety", desc: "Enterprise-grade security protocols ensuring manifests remain protected.", tag: "SEC", index: "03" },
];

export default function Capabilities() {
  return (
    <SectionWrapper>
      <div className="container mx-auto px-10">
        <div className="text-center mb-16 space-y-4">
          <p className="text-blue-600 font-black text-sm uppercase tracking-[0.4em]">Core Capabilities</p>
          <h2 className="text-5xl font-black text-[#1a2d5a] tracking-tight">Precision-Engineered Components</h2>
        </div>

        <div className="grid md:grid-cols-3 gap-8 justify-items-center">
          {capabilities.map((cap, i) => (
            <div key={i} className="parent">
              <div className="card">
                <div className="content-box">
                  <span className="card-title">{cap.title}</span>
                  <p className="card-content">{cap.desc}</p>
                  <span className="see-more">View Specs</span>
                </div>
                <div className="date-box">
                  <span className="month">{cap.tag}</span>
                  <span className="date">{cap.index}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </SectionWrapper>
  );
}