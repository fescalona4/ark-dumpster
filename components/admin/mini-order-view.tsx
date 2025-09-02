'use client';

import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Status, StatusIndicator, StatusLabel } from '@/components/ui/status';
import { Button } from '@/components/ui/button';
import {
  RiPhoneLine,
  RiMapPinLine,
  RiBox1Line,
  RiMoneyDollarCircleLine,
  RiCalendarLine,
  RiTruckLine,
  RiUserLine,
} from '@remixicon/react';
import { format } from 'date-fns';
import { Order } from '@/types/order';
import { getStatusIcon } from '@/components/order-management/order-status-manager';

// Helper function to map order status to Status component status
const mapOrderStatusToStatusType = (
  orderStatus: string
): 'online' | 'offline' | 'maintenance' | 'degraded' => {
  switch (orderStatus) {
    case 'delivered':
    case 'completed':
      return 'online';
    case 'cancelled':
      return 'offline';
    case 'pending':
    case 'scheduled':
      return 'degraded';
    case 'on_way':
    case 'on_way_pickup':
    default:
      return 'maintenance';
  }
};

interface MiniOrderViewProps {
  order: Order;
  onClick?: (order: Order) => void;
  onStatusChange?: (orderId: string, newStatus: Order['status']) => void;
  showActions?: boolean;
  className?: string;
}

export const MiniOrderView = ({
  order,
  onClick,
  onStatusChange,
  showActions = true,
  className = '',
}: MiniOrderViewProps) => {
  const formatPhoneNumber = (phone: number | null) => {
    if (!phone) return '';
    const phoneStr = phone.toString();
    if (phoneStr.length === 10) {
      return `(${phoneStr.slice(0, 3)}) ${phoneStr.slice(3, 6)}-${phoneStr.slice(6)}`;
    }
    return phoneStr;
  };

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onClick?.(order);
  };

  const getStatusActions = () => {
    if (!showActions) return null;

    switch (order.status) {
      case 'scheduled':
        return (
          <div className="flex gap-1">
            <Button
              size="sm"
              variant="outline"
              className="text-xs px-3 py-2 min-h-[36px] touch-manipulation"
              onClick={e => {
                e.stopPropagation();
                onStatusChange?.(order.id, 'cancelled');
              }}
            >
              Cancel
            </Button>
            <Button
              size="sm"
              className="text-xs px-3 py-2 min-h-[36px] bg-indigo-600 hover:bg-indigo-700 touch-manipulation font-semibold"
              onClick={e => {
                e.stopPropagation();
                onStatusChange?.(order.id, 'on_way');
              }}
            >
              On My Way
            </Button>
          </div>
        );
      case 'on_way':
        return (
          <Button
            size="sm"
            className="text-xs px-3 py-2 min-h-[36px] bg-green-600 hover:bg-green-700 touch-manipulation font-semibold"
            onClick={e => {
              e.stopPropagation();
              onStatusChange?.(order.id, 'delivered');
            }}
          >
            Delivered
          </Button>
        );
      case 'delivered':
        return (
          <Button
            size="sm"
            className="text-xs px-3 py-2 min-h-[36px] bg-yellow-600 hover:bg-yellow-700 touch-manipulation font-semibold"
            onClick={e => {
              e.stopPropagation();
              onStatusChange?.(order.id, 'on_way_pickup');
            }}
          >
            Pickup
          </Button>
        );
      case 'on_way_pickup':
        return (
          <Button
            size="sm"
            className="text-xs px-3 py-2 min-h-[36px] bg-gray-600 hover:bg-gray-700 touch-manipulation font-semibold"
            onClick={e => {
              e.stopPropagation();
              onStatusChange?.(order.id, 'completed');
            }}
          >
            Complete
          </Button>
        );
      default:
        return null;
    }
  };

  return (
    <div
      className={`p-4 space-y-3 cursor-pointer hover:bg-accent/10 transition-colors rounded-lg touch-manipulation focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${className}`}
      onClick={handleClick}
      role="button"
      tabIndex={0}
      onKeyDown={e => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          const mockEvent = { stopPropagation: () => {} } as React.MouseEvent;
          handleClick(mockEvent);
        }
      }}
      aria-labelledby={`order-${order.id}-customer`}
      aria-describedby={`order-${order.id}-details`}
    >
      {/* Header Row - Order Number & Status */}
      <div className="flex items-center justify-between mb-2">
        <div className="text-sm font-bold text-foreground bg-primary/10 px-2 py-1 rounded">
          #{order.order_number}
        </div>
        <Status
          status={mapOrderStatusToStatusType(order.status)}
          className="text-xs px-3 py-1 min-h-[28px] flex items-center"
        >
          <StatusIndicator />
          <StatusLabel className="ml-1 text-xs font-semibold">
            <span className="mr-1">{getStatusIcon(order.status)}</span>
          </StatusLabel>
        </Status>
      </div>

      {/* Customer Name - Prominent */}
      <div className="flex items-center gap-2 mb-3">
        <RiUserLine className="h-4 w-4 text-primary flex-shrink-0" />
        <h4
          id={`order-${order.id}-customer`}
          className="font-bold text-base truncate text-foreground"
        >
          {order.first_name} {order.last_name}
        </h4>
      </div>

      {/* Quick Info - Mobile First Single Column */}
      <div id={`order-${order.id}-details`} className="space-y-2">
        {/* Top row - Price and Size */}
        <div className="flex items-center justify-between">
          {order.quoted_price && (
            <div className="flex items-center gap-2 text-green-600 font-bold text-base">
              <RiMoneyDollarCircleLine className="h-4 w-4" />
              <span>${order.quoted_price}</span>
            </div>
          )}
          {order.dumpster_size && (
            <div className="flex items-center gap-1 bg-secondary px-2 py-1 rounded">
              <RiBox1Line className="h-3 w-3" />
              <span className="text-sm font-semibold">{order.dumpster_size} Yard</span>
            </div>
          )}
        </div>

        {/* Contact info */}
        <div className="space-y-1.5">
          {order.phone && (
            <div className="flex items-center gap-2">
              <RiPhoneLine className="h-4 w-4 text-blue-600 flex-shrink-0" />
              <a
                href={`tel:${order.phone}`}
                className="text-sm font-medium text-blue-600 hover:underline touch-manipulation focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded"
                onClick={e => e.stopPropagation()}
                aria-label={`Call ${order.first_name} ${order.last_name} at ${formatPhoneNumber(order.phone)}`}
              >
                {formatPhoneNumber(order.phone)}
              </a>
            </div>
          )}

          {order.address && (
            <div className="flex items-start gap-2">
              <RiMapPinLine className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
              <button
                onClick={e => {
                  e.stopPropagation();
                  let fullAddress = order.address!;
                  if (order.city && order.state) {
                    fullAddress = `${order.address}, ${order.city}, ${order.state}`;
                  }
                  const encodedAddress = encodeURIComponent(fullAddress);
                  window.open(`https://maps.google.com/?q=${encodedAddress}`, '_blank');
                }}
                className="min-w-0 flex-1 text-left hover:underline touch-manipulation focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded"
                aria-label={`Navigate to ${order.address}${order.city && order.state ? `, ${order.city}, ${order.state}` : ''}`}
              >
                <div className="text-sm font-medium truncate text-blue-600">{order.address}</div>
                {order.city && order.state && (
                  <div className="text-xs text-muted-foreground">
                    {order.city}, {order.state}
                  </div>
                )}
              </button>
            </div>
          )}

          {/* Secondary info */}
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            {order.scheduled_delivery_date && (
              <div className="flex items-center gap-1">
                <RiCalendarLine className="h-3 w-3" />
                <span>{format(new Date(order.scheduled_delivery_date), 'MMM dd')}</span>
              </div>
            )}
            {order.assigned_to && (
              <div className="flex items-center gap-1">
                <RiTruckLine className="h-3 w-3" />
                <span className="truncate">{order.assigned_to}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Priority Badge */}
      {order.priority && order.priority !== 'normal' && (
        <div className="flex justify-start">
          <Badge
            variant={
              order.priority === 'high' || order.priority === 'urgent' ? 'destructive' : 'secondary'
            }
            className="text-xs px-1.5 py-0.5"
          >
            {order.priority.toUpperCase()}
          </Badge>
        </div>
      )}

      {/* Action Buttons */}
      {getStatusActions() && (
        <div className="pt-3 mt-3 border-t border-border/50">{getStatusActions()}</div>
      )}
    </div>
  );
};
