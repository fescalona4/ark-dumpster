'use client';

import { Order } from '@/types/order';
import { format } from 'date-fns';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { RiFileTextLine, RiMoneyDollarCircleLine, RiCalendarLine } from '@remixicon/react';

interface InvoiceSummaryProps {
  order: Order;
  className?: string;
}

export function InvoiceSummary({ order, className = '' }: InvoiceSummaryProps) {
  const generateInvoiceNumber = (orderId: string) => {
    return `INV-${orderId.slice(-8).toUpperCase()}`;
  };

  const invoiceNumber = generateInvoiceNumber(order.id);
  const subtotal = order.final_price || order.quoted_price || 0;
  const taxRate = 0.08;
  const taxAmount = subtotal * taxRate;
  const total = subtotal + taxAmount;

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <RiFileTextLine className="h-5 w-5 text-blue-600" />
          Invoice Summary
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">Invoice Number:</span>
          <Badge variant="outline">{invoiceNumber}</Badge>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">Order Number:</span>
          <span className="text-sm">{order.order_number}</span>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">Date Issued:</span>
          <span className="text-sm flex items-center gap-1">
            <RiCalendarLine className="h-4 w-4" />
            {format(new Date(), 'MMM dd, yyyy')}
          </span>
        </div>

        <div className="border-t pt-3 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm">Subtotal:</span>
            <span className="text-sm">${subtotal.toFixed(2)}</span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-sm">Tax (8%):</span>
            <span className="text-sm">${taxAmount.toFixed(2)}</span>
          </div>

          <div className="flex items-center justify-between font-semibold border-t pt-2">
            <span className="flex items-center gap-1">
              <RiMoneyDollarCircleLine className="h-4 w-4" />
              Total:
            </span>
            <span>${total.toFixed(2)}</span>
          </div>
        </div>

        <div className="text-xs text-muted-foreground mt-3 pt-3 border-t">
          <p>Payment due within 30 days of invoice date</p>
        </div>
      </CardContent>
    </Card>
  );
}

export default InvoiceSummary;
