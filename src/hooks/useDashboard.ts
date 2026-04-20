'use client';

import useSWR from 'swr';
import type { Flight } from '@/types';

interface KpiData {
    totalShipments: number;
    activeFlights: number;
    delayedShipments: number;
    arrivedToday: number;
}

const fetcher = (url: string) =>
    fetch(url, { credentials: 'include' }).then((r) => r.json()).then((j) => j.data);

const SWR_OPTIONS = {
    refreshInterval: 30_000,
    dedupingInterval: 5_000,
};

export function useDashboard() {
    const {
        data: kpi,
        error: kpiError,
        isLoading: kpiLoading,
    } = useSWR<KpiData>('/api/kpi', fetcher, SWR_OPTIONS);

    const {
        data: flights,
        error: flightsError,
        isLoading: flightsLoading,
    } = useSWR<Flight[]>('/api/flights', fetcher, SWR_OPTIONS);

    return {
        kpi,
        flights: flights ?? [],
        loading: kpiLoading || flightsLoading,
        error: kpiError || flightsError,
    };
}
