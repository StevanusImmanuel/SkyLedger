"use client";

import { Component, type ErrorInfo, type ReactNode } from "react";
import dynamic from "next/dynamic";
import type { DashboardShipmentMapDatum } from "@/lib/map/skyLedgerMapAdapter";

const WorldMapGL = dynamic(
  () => import("@/components/maps/WorldMapGL"),
  {
    ssr: false,
    loading: () => <DashboardMapFallback message="Loading satellite map..." />,
  }
);

type DashboardMapErrorBoundaryProps = {
  children: ReactNode;
};

type DashboardMapErrorBoundaryState = {
  hasError: boolean;
};

function DashboardMapFallback({
  message = "Satellite map unavailable.",
}: {
  message?: string;
}) {
  return (
    <div
      style={{
        alignItems: "center",
        background: "#030712",
        borderRadius: 8,
        color: "#cffafe",
        display: "flex",
        fontSize: 13,
        fontWeight: 800,
        height: "100%",
        justifyContent: "center",
        minHeight: 360,
        width: "100%",
      }}
    >
      {message}
    </div>
  );
}

class DashboardMapErrorBoundary extends Component<
  DashboardMapErrorBoundaryProps,
  DashboardMapErrorBoundaryState
> {
  state: DashboardMapErrorBoundaryState = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.warn("[MapLibreDashboardWrapper] Dashboard map render failed.", {
      error,
      errorInfo,
    });
  }

  render() {
    if (this.state.hasError) {
      return <DashboardMapFallback message="Satellite map unavailable. Dashboard remains active." />;
    }

    return this.props.children;
  }
}

type MapLibreDashboardWrapperProps = {
  maxItems?: number;
  shipments?: DashboardShipmentMapDatum[];
};

export function MapLibreDashboardWrapper({
  shipments = [],
}: MapLibreDashboardWrapperProps) {
  return (
    <div className="sl-chart-card" style={{ height: 520 }}>
      <div className="sl-chart-header">
        <div>
          <p className="sl-chart-title">Active Shipments Map</p>
          <p className="sl-chart-subtitle">3D Globe  live flight operations</p>
        </div>
        <div style={{ fontSize: 11, color: "#64748b" }}>
          {shipments.length > 0 ? `${shipments.length} shipments` : "Mock fallback"}
        </div>
      </div>

      <div style={{ height: 430, minHeight: 430, width: "100%" }}>
        <DashboardMapErrorBoundary>
          <WorldMapGL shipments={shipments.length > 0 ? shipments : undefined} />
        </DashboardMapErrorBoundary>
      </div>
    </div>
  );
}

export default MapLibreDashboardWrapper;
