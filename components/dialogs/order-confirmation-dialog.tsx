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
} from '@remixicon/react';
import { format } from 'date-fns';

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
    if (!order.scheduled_delivery_date) return 'Not yet scheduled';
    return format(new Date(order.scheduled_delivery_date), 'MMM dd, yyyy');
  };

  const formatDeliveryTime = () => {
    if (!order.dropoff_time || order.dropoff_time === '09:00:00') return '';
    return ` at ${order.dropoff_time}`;
  };

  const getDeliveryStatus = () => {
    if (!order.scheduled_delivery_date) {
      return 'Pending schedule confirmation';
    }
    return `${formatDeliveryDate()}${formatDeliveryTime()}`;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md" aria-describedby="order-confirmation-description">
        <DialogHeader className="text-center pb-2">
          <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-green-100 dark:bg-green-900 shadow-sm">
            <RiCheckboxCircleFill className="h-12 w-12 text-green-600 dark:text-green-400" />
          </div>
          <DialogTitle className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">Order Created Successfully!</DialogTitle>
          <DialogDescription id="order-confirmation-description" className="text-base text-gray-600 dark:text-gray-300 leading-relaxed">
            Your order has been created and scheduled for delivery.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Order Number */}
          <div className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-gradient-to-b from-gray-50 to-white dark:from-gray-800 dark:to-gray-900 p-5 text-center shadow-sm">
            <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">Order Number</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-gray-100 font-mono tracking-wide">{order.order_number}</p>
          </div>

          {/* Order Details */}
          <div className="space-y-4">
            {/* Customer */}
            <div className="flex items-center gap-3">
              <RiUserLine className="h-5 w-5 text-gray-500 dark:text-gray-400" />
              <div>
                <p className="font-medium text-gray-900 dark:text-gray-100">{order.first_name} {order.last_name}</p>
                <p className="text-sm text-gray-600 dark:text-gray-300">{order.email}</p>
              </div>
            </div>

            {/* Dumpster Size */}
            {order.dumpster_size && (
              <div className="flex items-center gap-3">
                <RiBox1Line className="h-5 w-5 text-gray-500 dark:text-gray-400" />
                <div>
                  <p className="font-medium text-gray-900 dark:text-gray-100">{order.dumpster_size} Yard Dumpster</p>
                </div>
              </div>
            )}

            {/* Delivery Info */}
            <div className="flex items-start gap-3">
              <RiCalendarLine className="h-5 w-5 text-gray-500 dark:text-gray-400 mt-0.5" />
              <div>
                <p className="font-medium text-gray-900 dark:text-gray-100">Delivery Schedule</p>
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  {getDeliveryStatus()}
                </p>
              </div>
            </div>

            {/* Address */}
            {order.address && (
              <div className="flex items-start gap-3">
                <RiMapPinLine className="h-5 w-5 text-gray-500 dark:text-gray-400 mt-0.5" />
                <div>
                  <p className="font-medium text-gray-900 dark:text-gray-100">Delivery Address</p>
                  <p className="text-sm text-gray-600 dark:text-gray-300">
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
                <RiMoneyDollarCircleLine className="h-5 w-5 text-gray-500 dark:text-gray-400" />
                <div>
                  <p className="font-medium text-gray-900 dark:text-gray-100">Total Price</p>
                  <p className="text-sm text-gray-600 dark:text-gray-300">${order.quoted_price}</p>
                </div>
              </div>
            )}

            {/* Status */}
            <div className="flex items-center gap-3">
              <RiTruckLine className="h-5 w-5 text-gray-500 dark:text-gray-400" />
              <div>
                <p className="font-medium text-gray-900 dark:text-gray-100">Status</p>
                <Badge className="bg-blue-50 dark:bg-blue-900 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-700 mt-1 px-3 py-1 font-medium">
                  📅 {order.status.replace('_', ' ').toUpperCase()}
                </Badge>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter className="flex flex-col items-center gap-3 pt-4">
          <Button
            onClick={() => onOpenChange(false)}
            variant="outline"
            className="w-40 h-11 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700"
          >
            Close
          </Button>
          {onViewOrder && (
            <Button onClick={onViewOrder} className="w-40 h-11 font-medium">
              <RiTruckLine className="h-4 w-4 mr-2" />
              View Order
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default OrderConfirmationDialog;