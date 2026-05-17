import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import { useCallback } from 'react';

export function usePagination(itemsPerPage: number = 10) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const currentPage = Number(searchParams.get('page')) || 1;
  const searchQuery = searchParams.get('search') || '';

  const setPage = useCallback((page: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('page', page.toString());
    router.push(`${pathname}?${params.toString()}`);
  }, [searchParams, router, pathname]);

  const setSearch = useCallback((search: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (search) {
      params.set('search', search);
    } else {
      params.delete('search');
    }
    params.set('page', '1'); // Reset to page 1 on search
    router.push(`${pathname}?${params.toString()}`);
  }, [searchParams, router, pathname]);

  const getPaginatedData = <T,>(data: T[]) => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return data.slice(startIndex, endIndex);
  };

  const getTotalPages = (totalItems: number) => {
    return Math.ceil(totalItems / itemsPerPage);
  };

  return {
    currentPage,
    searchQuery,
    setPage,
    setSearch,
    getPaginatedData,
    getTotalPages,
    itemsPerPage,
  };
}
