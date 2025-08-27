'use client';

import * as React from 'react';
import { useIsMobile } from '@/hooks/use-mobile';
import { MobileOrderList } from './mobile-order-card';

interface OrderData {
  id: number;
  header: string; // Customer name
  type: string; // Dumpster size
  status: string;
  target: string; // Delivery date
  limit: string; // Final price
  reviewer: string; // Email
}

interface ResponsiveDataDisplayProps {
  data: OrderData[];
  statuses?: readonly string[];
  onOrderUpdate?: (orderId: number, updates: Partial<OrderData>) => void;
  onOrderSelect?: (order: OrderData) => void;
  renderTable?: (data: OrderData[]) => React.ReactNode; // Fallback to existing table
  className?: string;
}

export function ResponsiveDataDisplay({
  data,
  onOrderUpdate,
  onOrderSelect,
  renderTable,
  className,
}: ResponsiveDataDisplayProps) {
  const isMobile = useIsMobile();

  const handleSwipeLeft = React.useCallback(
    (orderId: number) => {
      // Swipe left = Mark as completed/done
      const order = data.find(o => o.id === orderId);
      if (order && onOrderUpdate) {
        const newStatus = order.status === 'completed' ? 'in_progress' : 'completed';
        onOrderUpdate(orderId, { status: newStatus });
      }
    },
    [data, onOrderUpdate]
  );

  const handleSwipeRight = React.useCallback(
    (orderId: number) => {
      // Swipe right = Reschedule (change status to pending)
      const order = data.find(o => o.id === orderId);
      if (order && onOrderUpdate) {
        onOrderUpdate(orderId, { status: 'pending' });
      }
    },
    [data, onOrderUpdate]
  );

  const handleOrderTap = React.useCallback(
    (order: OrderData) => {
      onOrderSelect?.(order);
    },
    [onOrderSelect]
  );

  if (isMobile) {
    return (
      <div className={className}>
        <MobileOrderList
          orders={data}
          onOrderTap={handleOrderTap}
          onSwipeLeft={handleSwipeLeft}
          onSwipeRight={handleSwipeRight}
        />
      </div>
    );
  }

  // Desktop - render the provided table or fallback
  return (
    <div className={className}>
      {renderTable ? (
        renderTable(data)
      ) : (
        <div className="text-center py-8 text-muted-foreground">
          No table renderer provided for desktop view
        </div>
      )}
    </div>
  );
}

// Mobile-first status filter tabs
interface MobileStatusFiltersProps {
  statuses?: readonly string[];
  currentStatus: string;
  onStatusChange: (status: string) => void;
  orderCounts?: Record<string, number>;
}

export function MobileStatusFilters({
  statuses,
  currentStatus,
  onStatusChange,
  orderCounts = {},
}: MobileStatusFiltersProps) {
  const isMobile = useIsMobile();

  if (!isMobile) return null; // Only show on mobile

  const allStatuses = ['all', ...(statuses || [])];

  return (
    <div className="flex overflow-x-auto pb-2 px-4 gap-2 scrollbar-hide">
      {allStatuses.map(status => (
        <button
          key={status}
          onClick={() => onStatusChange(status)}
          className={`
            flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium
            touch-manipulation transition-colors duration-200
            ${
              currentStatus === status
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted text-muted-foreground hover:bg-muted/80'
            }
          `}
        >
          <span>
            {status === 'all'
              ? 'All'
              : status.replace(/_/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase())}
          </span>
          {orderCounts[status] && (
            <span className="ml-1 px-1.5 py-0.5 bg-background/20 rounded-full text-xs">
              {orderCounts[status]}
            </span>
          )}
        </button>
      ))}
    </div>
  );
}

// Pull-to-refresh component for mobile
interface PullToRefreshProps {
  onRefresh: () => Promise<void>;
  children: React.ReactNode;
  threshold?: number;
}

export function PullToRefresh({ onRefresh, children, threshold = 100 }: PullToRefreshProps) {
  const [isRefreshing, setIsRefreshing] = React.useState(false);
  const [pullDistance, setPullDistance] = React.useState(0);
  const [startY, setStartY] = React.useState<number | null>(null);
  const containerRef = React.useRef<HTMLDivElement>(null);

  const handleTouchStart = (e: React.TouchEvent) => {
    if (containerRef.current?.scrollTop === 0) {
      setStartY(e.touches[0].clientY);
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (startY === null || isRefreshing) return;

    const currentY = e.touches[0].clientY;
    const distance = Math.max(0, currentY - startY);

    if (distance > 0 && containerRef.current?.scrollTop === 0) {
      e.preventDefault();
      setPullDistance(Math.min(distance, threshold * 1.5));
    }
  };

  const handleTouchEnd = async () => {
    if (pullDistance >= threshold && !isRefreshing) {
      setIsRefreshing(true);
      try {
        await onRefresh();
      } finally {
        setIsRefreshing(false);
      }
    }

    setStartY(null);
    setPullDistance(0);
  };

  return (
    <div
      ref={containerRef}
      className="relative overflow-auto"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Pull indicator */}
      {pullDistance > 0 && (
        <div
          className="absolute top-0 left-0 right-0 flex items-center justify-center bg-muted/50 z-10"
          style={{ height: pullDistance }}
        >
          <div
            className={`
            transition-opacity duration-200 
            ${pullDistance >= threshold ? 'opacity-100' : 'opacity-50'}
          `}
          >
            {isRefreshing ? (
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
            ) : (
              <span className="text-sm font-medium">
                {pullDistance >= threshold ? 'Release to refresh' : 'Pull to refresh'}
              </span>
            )}
          </div>
        </div>
      )}

      <div style={{ paddingTop: pullDistance }}>{children}</div>
    </div>
  );
}

// Mobile-optimized search bar
interface MobileSearchBarProps {
  placeholder?: string;
  value: string;
  onChange: (value: string) => void;
  onFocus?: () => void;
  onBlur?: () => void;
}

export function MobileSearchBar({
  placeholder = 'Search orders...',
  value,
  onChange,
  onFocus,
  onBlur,
}: MobileSearchBarProps) {
  const isMobile = useIsMobile();

  if (!isMobile) return null;

  return (
    <div className="px-4 pb-3">
      <input
        type="search"
        placeholder={placeholder}
        value={value}
        onChange={e => onChange(e.target.value)}
        onFocus={onFocus}
        onBlur={onBlur}
        className={`
          w-full px-4 py-3 rounded-xl border border-input 
          bg-background text-foreground placeholder:text-muted-foreground
          focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent
          touch-manipulation text-base
        `}
      />
    </div>
  );
}
