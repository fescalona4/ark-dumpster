'use client';

import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Status, StatusIndicator, StatusLabel } from '@/components/ui/status';
import { Button } from '@/components/ui/button';
import {
  RiPhoneLine,
  RiMailLine,
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
const mapOrderStatusToStatusType = (orderStatus: string): 'online' | 'offline' | 'maintenance' | 'degraded' => {
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
  className = ""
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
              className="text-xs px-2 py-1 h-6"
              onClick={(e) => {
                e.stopPropagation();
                onStatusChange?.(order.id, 'cancelled');
              }}
            >
              Cancel
            </Button>
            <Button
              size="sm"
              className="text-xs px-2 py-1 h-6 bg-indigo-600 hover:bg-indigo-700"
              onClick={(e) => {
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
            className="text-xs px-2 py-1 h-6 bg-green-600 hover:bg-green-700"
            onClick={(e) => {
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
            className="text-xs px-2 py-1 h-6 bg-yellow-600 hover:bg-yellow-700"
            onClick={(e) => {
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
            className="text-xs px-2 py-1 h-6 bg-gray-600 hover:bg-gray-700"
            onClick={(e) => {
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
      className={`p-3 space-y-2 cursor-pointer hover:bg-accent/5 transition-colors rounded-md ${className}`}
      onClick={handleClick}
    >
      {/* Header Row - Order Number & Status */}
      <div className="flex items-center justify-between">
        <div className="text-xs font-medium text-muted-foreground">
          #{order.order_number}
        </div>
        <Status status={mapOrderStatusToStatusType(order.status)} className="text-xs px-2 py-0.5">
          <StatusIndicator />
          <StatusLabel className="ml-1 text-xs">
            <span className="mr-1">{getStatusIcon(order.status)}</span>
          </StatusLabel>
        </Status>
      </div>

      {/* Customer Name - Prominent */}
      <div className="flex items-center gap-1">
        <RiUserLine className="h-3 w-3 text-muted-foreground flex-shrink-0" />
        <h4 className="font-semibold text-sm truncate">
          {order.first_name} {order.last_name}
        </h4>
      </div>

      {/* Key Details Grid - 2 columns */}
      <div className="grid grid-cols-2 gap-1 text-xs">
        {/* Left Column */}
        <div className="space-y-1">
          {order.dumpster_size && (
            <div className="flex items-center gap-1">
              <RiBox1Line className="h-3 w-3 text-muted-foreground" />
              <span className="truncate">{order.dumpster_size}Y</span>
            </div>
          )}
          {order.phone && (
            <div className="flex items-center gap-1">
              <RiPhoneLine className="h-3 w-3 text-muted-foreground" />
              <span className="truncate">{formatPhoneNumber(order.phone)}</span>
            </div>
          )}
          {order.scheduled_delivery_date && (
            <div className="flex items-center gap-1">
              <RiCalendarLine className="h-3 w-3 text-muted-foreground" />
              <span className="truncate">{format(new Date(order.scheduled_delivery_date), 'MMM dd')}</span>
            </div>
          )}
        </div>

        {/* Right Column */}
        <div className="space-y-1">
          {order.quoted_price && (
            <div className="flex items-center gap-1 text-green-600 dark:text-green-400 font-medium">
              <RiMoneyDollarCircleLine className="h-3 w-3" />
              <span className="truncate">${order.quoted_price}</span>
            </div>
          )}
          {order.assigned_to && (
            <div className="flex items-center gap-1">
              <RiTruckLine className="h-3 w-3 text-muted-foreground" />
              <span className="truncate text-xs">{order.assigned_to}</span>
            </div>
          )}
          {order.address && (
            <div className="flex items-start gap-1">
              <RiMapPinLine className="h-3 w-3 text-muted-foreground mt-0.5 flex-shrink-0" />
              <div className="truncate">
                <div className="truncate text-xs">{order.address}</div>
                {order.city && order.state && (
                  <div className="truncate text-xs opacity-75">
                    {order.city}, {order.state}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Priority Badge */}
      {order.priority && order.priority !== 'normal' && (
        <div className="flex justify-start">
          <Badge 
            variant={
              order.priority === 'high' || order.priority === 'urgent' 
                ? 'destructive' 
                : 'secondary'
            }
            className="text-xs px-1.5 py-0.5"
          >
            {order.priority.toUpperCase()}
          </Badge>
        </div>
      )}

      {/* Action Buttons */}
      {getStatusActions() && (
        <div className="pt-2 border-t border-border/50">
          {getStatusActions()}
        </div>
      )}
    </div>
  );
};