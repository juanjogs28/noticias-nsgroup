import { useState, useCallback } from 'react';

interface UsePaginationOptions {
  initialPageSize?: number;
  maxPageSize?: number;
}

export const usePagination = (options: UsePaginationOptions = {}) => {
  const { initialPageSize = 100, maxPageSize = 500 } = options;
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(initialPageSize);

  const nextPage = useCallback(() => {
    setCurrentPage(prev => prev + 1);
  }, []);

  const prevPage = useCallback(() => {
    setCurrentPage(prev => Math.max(1, prev - 1));
  }, []);

  const goToPage = useCallback((page: number) => {
    setCurrentPage(Math.max(1, page));
  }, []);

  const increasePageSize = useCallback(() => {
    setPageSize(prev => Math.min(prev + 10, maxPageSize));
  }, [maxPageSize]);

  const resetPagination = useCallback(() => {
    setCurrentPage(1);
    setPageSize(initialPageSize);
  }, [initialPageSize]);

  const getPaginatedItems = useCallback((items: any[]) => {
    // Mostrar TODAS las noticias disponibles sin paginación restrictiva
    return items;
  }, [currentPage, pageSize]);

  const hasMore = useCallback((items: any[]) => {
    return (currentPage * pageSize) < items.length;
  }, [currentPage, pageSize]);

  return {
    currentPage,
    pageSize,
    nextPage,
    prevPage,
    goToPage,
    increasePageSize,
    resetPagination,
    getPaginatedItems,
    hasMore
  };
};
