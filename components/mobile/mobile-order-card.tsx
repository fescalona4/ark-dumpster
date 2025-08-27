'use client';

import * as React from 'react';
import { IconChevronRight, IconPhone, IconCalendar, IconTruck } from '@tabler/icons-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { LongPressContextMenu, useOrderContextMenu } from './long-press-context-menu';
import { cn } from '@/lib/utils';

interface OrderData {
  id: number;
  header: string; // Customer name
  type: string; // Dumpster size
  status: string;
  target: string; // Delivery date
  limit: string; // Final price
  reviewer: string; // Email
}

interface MobileOrderCardProps {
  order: OrderData;
  onTap?: (order: OrderData) => void;
  className?: string;
}

function getStatusColor(status: string) {
  switch (status.toLowerCase()) {
    case 'completed':
    case 'done':
    case 'delivered':
      return 'bg-green-100 text-green-800 border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800';
    case 'in_progress':
    case 'in_transit':
    case 'delivering':
      return 'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-800';
    case 'pending':
    case 'scheduled':
      return 'bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900/20 dark:text-yellow-400 dark:border-yellow-800';
    case 'cancelled':
    case 'failed':
      return 'bg-red-100 text-red-800 border-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800';
    default:
      return 'bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-900/20 dark:text-gray-400 dark:border-gray-800';
  }
}

function getPriorityIndicator(status: string, target: string) {
  const today = new Date();
  const deliveryDate = new Date(target);
  const daysUntilDelivery = Math.ceil(
    (deliveryDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
  );

  if (daysUntilDelivery <= 0 && status !== 'completed' && status !== 'done') {
    return { color: 'border-l-red-500', urgency: 'overdue' };
  } else if (daysUntilDelivery <= 1) {
    return { color: 'border-l-orange-500', urgency: 'urgent' };
  } else if (daysUntilDelivery <= 3) {
    return { color: 'border-l-yellow-500', urgency: 'soon' };
  }
  return { color: 'border-l-blue-500', urgency: 'normal' };
}

export function MobileOrderCard({ order, onTap, className }: MobileOrderCardProps) {
  const priority = getPriorityIndicator(order.status, order.target);
  const statusColor = getStatusColor(order.status);
  const contextMenuItems = useOrderContextMenu(order);

  return (
    <LongPressContextMenu items={contextMenuItems}>
      <Card
        className={cn(
          'mb-3 border-l-4 transition-all duration-200 hover:shadow-md active:scale-[0.98]',
          'touch-manipulation select-none',
          priority.color,
          className
        )}
        onClick={() => onTap?.(order)}
      >
        <CardContent className="p-4">
          {/* Header with customer name and status */}
          <div className="flex items-start justify-between mb-3">
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-lg leading-tight text-foreground truncate">
                {order.header}
              </h3>
              <p className="text-sm text-muted-foreground mt-0.5 flex items-center">
                <IconTruck className="h-4 w-4 mr-1 flex-shrink-0" />
                {order.type}
              </p>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <Badge variant="outline" className={cn('text-xs font-medium', statusColor)}>
                {order.status.replace(/_/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase())}
              </Badge>
              <Button
                variant="ghost"
                size="touch-icon"
                className="h-8 w-8 text-muted-foreground hover:text-foreground"
              >
                <IconChevronRight className="h-5 w-5" />
              </Button>
            </div>
          </div>

          {/* Key information row */}
          <div className="grid grid-cols-2 gap-3 mb-3">
            {/* Delivery date */}
            <div className="flex items-center text-sm">
              <IconCalendar className="h-4 w-4 mr-2 text-muted-foreground flex-shrink-0" />
              <div className="min-w-0 flex-1">
                <span className="block text-xs text-muted-foreground">Delivery</span>
                <span className="font-medium text-foreground truncate block">
                  {order.target || 'TBD'}
                </span>
              </div>
            </div>

            {/* Price */}
            <div className="flex items-center text-sm justify-end">
              <div className="text-right">
                <span className="block text-xs text-muted-foreground">Price</span>
                <span className="font-semibold text-lg text-green-600 dark:text-green-400">
                  {order.limit || 'Pending'}
                </span>
              </div>
            </div>
          </div>

          {/* Contact information */}
          {order.reviewer && order.reviewer !== 'Assign reviewer' && (
            <div className="flex items-center text-sm text-muted-foreground pt-2 border-t border-muted">
              <IconPhone className="h-4 w-4 mr-2 flex-shrink-0" />
              <span className="truncate">{order.reviewer}</span>
            </div>
          )}

          {/* Priority indicator text for urgent items */}
          {priority.urgency === 'overdue' && (
            <div className="mt-2 text-xs font-medium text-red-600 dark:text-red-400">
              ⚠️ OVERDUE - Needs immediate attention
            </div>
          )}
          {priority.urgency === 'urgent' && (
            <div className="mt-2 text-xs font-medium text-orange-600 dark:text-orange-400">
              🔥 DUE TODAY - High priority
            </div>
          )}
        </CardContent>
      </Card>
    </LongPressContextMenu>
  );
}

// Swipeable wrapper for gesture actions
interface SwipeableOrderCardProps extends MobileOrderCardProps {
  onSwipeLeft?: (orderId: number) => void;
  onSwipeRight?: (orderId: number) => void;
}

export function SwipeableOrderCard(props: SwipeableOrderCardProps) {
  const [startX, setStartX] = React.useState<number | null>(null);
  const [currentX, setCurrentX] = React.useState<number | null>(null);
  const [isSwipingLeft, setIsSwipingLeft] = React.useState(false);
  const [isSwipingRight, setIsSwipingRight] = React.useState(false);
  const cardRef = React.useRef<HTMLDivElement>(null);

  const SWIPE_THRESHOLD = 100; // pixels

  const handleTouchStart = (e: React.TouchEvent) => {
    setStartX(e.touches[0].clientX);
    setCurrentX(e.touches[0].clientX);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (startX === null) return;

    const currentPosition = e.touches[0].clientX;
    setCurrentX(currentPosition);

    const diff = currentPosition - startX;

    if (Math.abs(diff) > 20) {
      e.preventDefault(); // Prevent scrolling when swiping

      if (diff > 0) {
        setIsSwipingRight(true);
        setIsSwipingLeft(false);
      } else {
        setIsSwipingLeft(true);
        setIsSwipingRight(false);
      }
    }
  };

  const handleTouchEnd = () => {
    if (startX === null || currentX === null) return;

    const diff = currentX - startX;

    if (Math.abs(diff) > SWIPE_THRESHOLD) {
      if (diff > 0 && props.onSwipeRight) {
        props.onSwipeRight(props.order.id);
      } else if (diff < 0 && props.onSwipeLeft) {
        props.onSwipeLeft(props.order.id);
      }
    }

    // Reset states
    setStartX(null);
    setCurrentX(null);
    setIsSwipingLeft(false);
    setIsSwipingRight(false);
  };

  return (
    <div className="relative">
      {/* Swipe action indicators */}
      {isSwipingLeft && (
        <div className="absolute right-4 top-1/2 -translate-y-1/2 z-10 bg-red-100 text-red-600 px-3 py-1 rounded-full text-sm font-medium dark:bg-red-900/20 dark:text-red-400">
          Complete
        </div>
      )}
      {isSwipingRight && (
        <div className="absolute left-4 top-1/2 -translate-y-1/2 z-10 bg-yellow-100 text-yellow-600 px-3 py-1 rounded-full text-sm font-medium dark:bg-yellow-900/20 dark:text-yellow-400">
          Reschedule
        </div>
      )}

      <div
        ref={cardRef}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        style={{
          transform:
            startX !== null && currentX !== null
              ? `translateX(${(currentX - startX) * 0.3}px)`
              : 'none',
          transition: startX === null ? 'transform 0.2s ease-out' : 'none',
        }}
      >
        <MobileOrderCard {...props} />
      </div>
    </div>
  );
}

// Container for mobile order cards with proper spacing
interface MobileOrderListProps {
  orders: OrderData[];
  onOrderTap?: (order: OrderData) => void;
  onSwipeLeft?: (orderId: number) => void;
  onSwipeRight?: (orderId: number) => void;
  className?: string;
}

export function MobileOrderList({
  orders,
  onOrderTap,
  onSwipeLeft,
  onSwipeRight,
  className,
}: MobileOrderListProps) {
  return (
    <div className={cn('space-y-2 pb-4', className)}>
      {orders.length > 0 ? (
        orders.map(order => (
          <SwipeableOrderCard
            key={order.id}
            order={order}
            onTap={onOrderTap}
            onSwipeLeft={onSwipeLeft}
            onSwipeRight={onSwipeRight}
          />
        ))
      ) : (
        <div className="text-center py-12">
          <div className="text-muted-foreground mb-2">No orders found</div>
          <div className="text-sm text-muted-foreground">
            Orders will appear here when available
          </div>
        </div>
      )}
    </div>
  );
}
