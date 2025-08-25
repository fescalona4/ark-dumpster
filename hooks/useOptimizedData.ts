'use client';

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useIsMobile } from '@/hooks/use-mobile';
import { useOfflineCache } from '@/hooks/useOfflineSync';

interface DataLoadingOptions {
  pageSize?: number;
  enablePagination?: boolean;
  enableInfiniteScroll?: boolean;
  preloadNext?: boolean;
  cacheKey?: string;
  cacheTTL?: number;
  refreshInterval?: number;
}

interface PaginatedData<T> {
  items: T[];
  totalCount: number;
  hasMore: boolean;
  loading: boolean;
  error: string | null;
  currentPage: number;
  totalPages: number;
}

// Hook for optimized data loading with pagination and caching
export function useOptimizedData<T>(
  fetcher: (page: number, pageSize: number) => Promise<{ items: T[]; total: number }>,
  options: DataLoadingOptions = {}
) {
  const isMobile = useIsMobile();
  const {
    pageSize = isMobile ? 10 : 25, // Smaller pages on mobile
    enablePagination = true,
    enableInfiniteScroll = isMobile, // Enable infinite scroll on mobile
    preloadNext = true,
    cacheKey,
    cacheTTL = 5 * 60 * 1000, // 5 minutes
    refreshInterval,
  } = options;

  const [state, setState] = useState<PaginatedData<T>>({
    items: [],
    totalCount: 0,
    hasMore: false,
    loading: false,
    error: null,
    currentPage: 1,
    totalPages: 0,
  });

  const abortControllerRef = useRef<AbortController | null>(null);
  const refreshTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Use offline cache if cache key is provided
  const { data: cachedData, fetchData: fetchCachedData } = useOfflineCache(
    cacheKey || '',
    () => fetcher(1, pageSize),
    cacheTTL
  );

  const loadData = useCallback(async (page: number, append = false) => {
    // Cancel previous request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    abortControllerRef.current = new AbortController();

    setState(prev => ({
      ...prev,
      loading: true,
      error: null,
    }));

    try {
      const result = await fetcher(page, pageSize);
      const totalPages = Math.ceil(result.total / pageSize);

      setState(prev => ({
        ...prev,
        items: append ? [...prev.items, ...result.items] : result.items,
        totalCount: result.total,
        hasMore: page < totalPages,
        loading: false,
        currentPage: page,
        totalPages,
      }));

      // Preload next page on mobile
      if (preloadNext && isMobile && page < totalPages) {
        setTimeout(() => {
          fetcher(page + 1, pageSize).catch(() => {
            // Silently fail preloading
          });
        }, 1000);
      }

    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        return; // Request was cancelled
      }

      setState(prev => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : 'Failed to load data',
      }));
    }
  }, [fetcher, pageSize, preloadNext, isMobile]);

  const loadMore = useCallback(() => {
    if (state.loading || !state.hasMore) return;
    loadData(state.currentPage + 1, true);
  }, [loadData, state.loading, state.hasMore, state.currentPage]);

  const refresh = useCallback(() => {
    loadData(1, false);
  }, [loadData]);

  const goToPage = useCallback((page: number) => {
    if (page < 1 || page > state.totalPages || state.loading) return;
    loadData(page, false);
  }, [loadData, state.totalPages, state.loading]);

  // Initial load
  useEffect(() => {
    if (cacheKey && cachedData) {
      setState(prev => ({
        ...prev,
        items: Array.isArray(cachedData) ? cachedData : cachedData.items || [],
        totalCount: Array.isArray(cachedData) ? cachedData.length : cachedData.total || 0,
        hasMore: false,
        loading: false,
        currentPage: 1,
        totalPages: 1,
      }));
    } else {
      loadData(1, false);
    }
  }, [loadData, cacheKey, cachedData]);

  // Auto-refresh
  useEffect(() => {
    if (refreshInterval) {
      refreshTimerRef.current = setInterval(refresh, refreshInterval);
      
      return () => {
        if (refreshTimerRef.current) {
          clearInterval(refreshTimerRef.current);
        }
      };
    }
  }, [refresh, refreshInterval]);

  // Cleanup
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      if (refreshTimerRef.current) {
        clearInterval(refreshTimerRef.current);
      }
    };
  }, []);

  return {
    ...state,
    loadMore,
    refresh,
    goToPage,
    isMobile,
    pageSize,
  };
}

// Hook for virtual scrolling (performance optimization for large lists)
export function useVirtualScrolling<T>(
  items: T[],
  itemHeight: number,
  containerHeight: number
) {
  const [scrollTop, setScrollTop] = useState(0);
  
  const visibleRange = useMemo(() => {
    const start = Math.floor(scrollTop / itemHeight);
    const visibleCount = Math.ceil(containerHeight / itemHeight);
    const end = Math.min(start + visibleCount + 5, items.length); // Add buffer
    
    return { start: Math.max(0, start - 2), end }; // Add buffer above
  }, [scrollTop, itemHeight, containerHeight, items.length]);

  const visibleItems = useMemo(() => {
    return items.slice(visibleRange.start, visibleRange.end).map((item, index) => ({
      item,
      index: visibleRange.start + index,
      top: (visibleRange.start + index) * itemHeight,
    }));
  }, [items, visibleRange, itemHeight]);

  const totalHeight = items.length * itemHeight;

  return {
    visibleItems,
    totalHeight,
    visibleRange,
    onScroll: (e: React.UIEvent<HTMLDivElement>) => {
      setScrollTop(e.currentTarget.scrollTop);
    },
  };
}

// Hook for image loading optimization
export function useImagePreloader(imageUrls: string[], priority: boolean = false) {
  const [loadedImages, setLoadedImages] = useState<Set<string>>(new Set());
  const [loadingImages, setLoadingImages] = useState<Set<string>>(new Set());

  const preloadImage = useCallback((url: string) => {
    if (loadedImages.has(url) || loadingImages.has(url)) {
      return Promise.resolve();
    }

    setLoadingImages(prev => new Set(prev).add(url));

    return new Promise<void>((resolve, reject) => {
      const img = new Image();
      
      img.onload = () => {
        setLoadedImages(prev => new Set(prev).add(url));
        setLoadingImages(prev => {
          const newSet = new Set(prev);
          newSet.delete(url);
          return newSet;
        });
        resolve();
      };

      img.onerror = () => {
        setLoadingImages(prev => {
          const newSet = new Set(prev);
          newSet.delete(url);
          return newSet;
        });
        reject(new Error(`Failed to load image: ${url}`));
      };

      img.src = url;
    });
  }, [loadedImages, loadingImages]);

  useEffect(() => {
    if (priority) {
      // Load high priority images immediately
      imageUrls.slice(0, 3).forEach(url => {
        preloadImage(url);
      });
      
      // Load remaining images with delay
      setTimeout(() => {
        imageUrls.slice(3).forEach(url => {
          preloadImage(url);
        });
      }, 1000);
    }
  }, [imageUrls, priority, preloadImage]);

  return {
    preloadImage,
    isLoaded: (url: string) => loadedImages.has(url),
    isLoading: (url: string) => loadingImages.has(url),
    loadedCount: loadedImages.size,
    totalCount: imageUrls.length,
  };
}

// Hook for connection-aware data loading
export function useConnectionAware() {
  const [connectionInfo, setConnectionInfo] = useState({
    effectiveType: '4g',
    downlink: 10,
    saveData: false,
  });

  useEffect(() => {
    if ('connection' in navigator) {
      const connection = (navigator as any).connection;
      
      const updateConnection = () => {
        setConnectionInfo({
          effectiveType: connection.effectiveType || '4g',
          downlink: connection.downlink || 10,
          saveData: connection.saveData || false,
        });
      };

      updateConnection();
      connection.addEventListener('change', updateConnection);

      return () => {
        connection.removeEventListener('change', updateConnection);
      };
    }
  }, []);

  const isSlowConnection = useMemo(() => {
    return connectionInfo.effectiveType === 'slow-2g' || 
           connectionInfo.effectiveType === '2g' ||
           connectionInfo.saveData;
  }, [connectionInfo]);

  const shouldReduceData = useMemo(() => {
    return isSlowConnection || connectionInfo.downlink < 1.5;
  }, [isSlowConnection, connectionInfo.downlink]);

  return {
    ...connectionInfo,
    isSlowConnection,
    shouldReduceData,
  };
}

// Hook for optimized component rendering
export function useOptimizedRendering<T>(
  items: T[],
  keyExtractor: (item: T, index: number) => string,
  maxRenderBatch: number = 10
) {
  const [renderedItems, setRenderedItems] = useState<T[]>([]);
  const [isRendering, setIsRendering] = useState(false);
  const renderTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const renderBatch = useCallback(() => {
    if (renderedItems.length >= items.length) {
      setIsRendering(false);
      return;
    }

    const nextBatch = items.slice(
      renderedItems.length,
      renderedItems.length + maxRenderBatch
    );

    setRenderedItems(prev => [...prev, ...nextBatch]);

    // Schedule next batch
    renderTimeoutRef.current = setTimeout(renderBatch, 16); // ~60fps
  }, [items, renderedItems, maxRenderBatch]);

  useEffect(() => {
    if (items.length === 0) {
      setRenderedItems([]);
      setIsRendering(false);
      return;
    }

    if (renderedItems.length === 0) {
      setIsRendering(true);
      renderBatch();
    } else if (items.length !== renderedItems.length) {
      // Items changed, re-render
      setRenderedItems([]);
      setIsRendering(true);
      setTimeout(renderBatch, 0);
    }

    return () => {
      if (renderTimeoutRef.current) {
        clearTimeout(renderTimeoutRef.current);
      }
    };
  }, [items, renderedItems, renderBatch]);

  return {
    renderedItems,
    isRendering,
    progress: items.length > 0 ? (renderedItems.length / items.length) * 100 : 0,
  };
}