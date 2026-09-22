import { useState, useMemo, useEffect } from 'react';

export interface UsePaginationOptions {
  pageSize?: number;
  initialPage?: number;
}

export function usePagination<T>(
  items: T[],
  pageSize: number = 10,
  resetDeps: any[] = []
) {
  const [currentPage, setCurrentPage] = useState<number>(1);

  // Automatically reset to page 1 whenever search/filter dependencies change
  useEffect(() => {
    setCurrentPage(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, resetDeps);

  const totalItems = items.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));

  // Ensure current page does not exceed total pages (e.g. after item deletion)
  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = Math.min(startIndex + pageSize, totalItems);

  const paginatedItems = useMemo(() => {
    return items.slice(startIndex, endIndex);
  }, [items, startIndex, endIndex]);

  return {
    currentPage,
    setCurrentPage,
    pageSize,
    totalPages,
    totalItems,
    paginatedItems,
    startIndex,
    endIndex,
  };
}
