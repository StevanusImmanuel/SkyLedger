"use client";

import dynamic from "next/dynamic";

const SkyLedgerMapLibre = dynamic(
  () => import("@/components/maps/SkyLedgerMapLibre"),
  {
    ssr: false,
    loading: () => (
      <div className="flex min-h-[560px] items-center justify-center rounded-lg bg-[#030712] text-sm font-bold text-cyan-100">
        Loading MapLibre sandbox...
      </div>
    ),
  }
);

export default function MapTestPage() {
  return (
    <main className="min-h-screen bg-[#0f172a] px-4 py-6 text-slate-100 sm:px-6 lg:px-8">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-4">
        <div>
          <p className="text-[11px] font-black uppercase tracking-[0.6px] text-cyan-200">
            SkyLedger Map Sandbox
          </p>
          <h1 className="mt-1 text-2xl font-black tracking-tight text-white">
            MapLibre Satellite Test
          </h1>
          <p className="mt-1 max-w-2xl text-sm font-medium text-slate-300">
            Isolated test page for Esri World Imagery, aircraft markers, popup telemetry, and curved GeoJSON routes.
          </p>
        </div>

        <SkyLedgerMapLibre height="min(72vh, 640px)" />
      </div>
    </main>
  );
}
