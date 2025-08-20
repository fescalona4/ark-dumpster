'use client';

import { Order } from '@/types/order';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import {
  RiCheckboxCircleFill,
  RiCalendarLine,
  RiMapPinLine,
  RiBox1Line,
  RiMoneyDollarCircleLine,
  RiUserLine,
  RiTruckLine,
  RiFileTextLine,
} from '@remixicon/react';
import { format } from 'date-fns';
import Link from 'next/link';

interface OrderConfirmationDialogProps {
  order: Order | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onViewOrder?: () => void;
}

export function OrderConfirmationDialog({
  order,
  open,
  onOpenChange,
  onViewOrder,
}: OrderConfirmationDialogProps) {
  if (!order) return null;

  const formatDeliveryDate = () => {
    if (!order.scheduled_delivery_date) return 'Not scheduled';
    return format(new Date(order.scheduled_delivery_date), 'MMM dd, yyyy');
  };

  const formatDeliveryTime = () => {
    if (!order.dropoff_time) return '';
    return ` at ${order.dropoff_time}`;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
            <RiCheckboxCircleFill className="h-10 w-10 text-green-600" />
          </div>
          <DialogTitle className="text-xl">Order Created Successfully!</DialogTitle>
          <DialogDescription className="text-base">
            Your order has been created and scheduled for delivery.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Order Number */}
          <div className="rounded-2xl border border-gray-200 bg-gradient-to-b from-gray-50 to-white p-4 text-center shadow-sm">
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">Order Number</p>
            <p className="text-2xl font-semibold text-gray-900 font-mono">{order.order_number}</p>
          </div>

          {/* Order Details */}
          <div className="space-y-3">
            {/* Customer */}
            <div className="flex items-center gap-3">
              <RiUserLine className="h-5 w-5 text-gray-500" />
              <div>
                <p className="font-medium">{order.first_name} {order.last_name}</p>
                <p className="text-sm text-gray-600">{order.email}</p>
              </div>
            </div>

            {/* Dumpster Size */}
            {order.dumpster_size && (
              <div className="flex items-center gap-3">
                <RiBox1Line className="h-5 w-5 text-gray-500" />
                <div>
                  <p className="font-medium">{order.dumpster_size} Yard Dumpster</p>
                </div>
              </div>
            )}

            {/* Delivery Info */}
            <div className="flex items-start gap-3">
              <RiCalendarLine className="h-5 w-5 text-gray-500 mt-0.5" />
              <div>
                <p className="font-medium">Delivery Scheduled</p>
                <p className="text-sm text-gray-600">
                  {formatDeliveryDate()}{formatDeliveryTime()}
                </p>
              </div>
            </div>

            {/* Address */}
            {order.address && (
              <div className="flex items-start gap-3">
                <RiMapPinLine className="h-5 w-5 text-gray-500 mt-0.5" />
                <div>
                  <p className="font-medium">Delivery Address</p>
                  <p className="text-sm text-gray-600">
                    {order.address}
                    {order.city && order.state && (
                      <><br />{order.city}, {order.state}</>
                    )}
                  </p>
                </div>
              </div>
            )}

            {/* Price */}
            {order.quoted_price && (
              <div className="flex items-center gap-3">
                <RiMoneyDollarCircleLine className="h-5 w-5 text-gray-500" />
                <div>
                  <p className="font-medium">Total Price</p>
                  <p className="text-sm text-gray-600">${order.quoted_price}</p>
                </div>
              </div>
            )}

            {/* Status */}
            <div className="flex items-center gap-3">
              <RiTruckLine className="h-5 w-5 text-gray-500" />
              <div>
                <p className="font-medium">Status</p>
                <Badge className="bg-blue-100 text-blue-800 mt-1">
                  📅 {order.status.replace('_', ' ').toUpperCase()}
                </Badge>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter className="flex flex-col sm:flex-col gap-2">
          <div className="flex flex-col sm:flex-row gap-2 w-full">
            <Link href={`/admin/orders/${order.id}/invoice`} target="_blank" className="flex-1">
              <Button variant="outline" className="w-full">
                <RiFileTextLine className="h-4 w-4 mr-2" />
                View Invoice
              </Button>
            </Link>
            {onViewOrder && (
              <Button onClick={onViewOrder} className="flex-1">
                <RiTruckLine className="h-4 w-4 mr-2" />
                View Order
              </Button>
            )}
          </div>
          <Button
            onClick={() => onOpenChange(false)}
            variant="ghost"
            className="w-full"
          >
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default OrderConfirmationDialog;