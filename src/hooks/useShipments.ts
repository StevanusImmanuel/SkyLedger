'use client';

import useSWR from 'swr';
import type { Shipment, PaginatedResponse, ShipmentStatus } from '@/types';

interface ShipmentFilters {
    page?: number;
    pageSize?: number;
    status?: ShipmentStatus | '';
    awb?: string;
    flightId?: string;
}

const fetcher = (url: string) =>
    fetch(url, { credentials: 'include' }).then((r) => r.json()).then((j) => j.data);

export function useShipments(filters: ShipmentFilters = {}) {
    const { page = 1, pageSize = 20, status, awb, flightId } = filters;

    const params = new URLSearchParams();
    params.set('page', String(page));
    params.set('pageSize', String(pageSize));
    if (status) params.set('status', status);
    if (awb) params.set('awb', awb);
    if (flightId) params.set('flightId', flightId);

    const key = `/api/shipments?${params.toString()}`;

    const { data, error, isLoading, mutate } = useSWR<PaginatedResponse<Shipment>>(
        key,
        fetcher,
        { dedupingInterval: 5_000 }
    );

    return {
        shipments: data?.items ?? [],
        total: data?.total ?? 0,
        totalPages: data?.totalPages ?? 1,
        currentPage: data?.page ?? page,
        loading: isLoading,
        error,
        mutate,
    };
}
