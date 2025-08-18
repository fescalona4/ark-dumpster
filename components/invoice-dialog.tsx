'use client';

import { useState } from 'react';
import { Order } from '@/types/order';
import Invoice from './invoice';
import { Button } from './ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from './ui/dialog';
import { RiFileTextLine, RiPrinterLine, RiExternalLinkLine } from '@remixicon/react';
import Link from 'next/link';

interface InvoiceDialogProps {
  order: Order;
  children?: React.ReactNode;
}

export function InvoiceDialog({ order, children }: InvoiceDialogProps) {
  const [open, setOpen] = useState(false);

  const handlePrint = () => {
    const printContent = document.getElementById(`invoice-content-${order.id}`);
    if (printContent) {
      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.write(`
          <!DOCTYPE html>
          <html>
            <head>
              <title>Invoice - ${order.order_number}</title>
              <style>
                body { font-family: Arial, sans-serif; margin: 0; padding: 20px; font-size: 12px; }
                @media print { body { margin: 0; font-size: 10px; } }
                .bg-white { background-color: white; }
                .bg-gray-50 { background-color: #f9fafb; }
                .bg-gray-100 { background-color: #f3f4f6; }
                .text-gray-900 { color: #111827; }
                .text-gray-600 { color: #4b5563; }
                .text-gray-500 { color: #6b7280; }
                .text-gray-700 { color: #374151; }
                .text-blue-600 { color: #2563eb; }
                .font-bold { font-weight: bold; }
                .font-semibold { font-weight: 600; }
                .font-medium { font-weight: 500; }
                .text-3xl { font-size: 1.5rem; }
                .text-2xl { font-size: 1.25rem; }
                .text-lg { font-size: 1rem; }
                .text-sm { font-size: 0.8rem; }
                .mb-2 { margin-bottom: 0.5rem; }
                .mb-4 { margin-bottom: 1rem; }
                .mb-8 { margin-bottom: 1.5rem; }
                .mt-2 { margin-top: 0.5rem; }
                .p-4 { padding: 0.75rem; }
                .p-8 { padding: 1.5rem; }
                .px-4 { padding-left: 0.75rem; padding-right: 0.75rem; }
                .py-2 { padding-top: 0.5rem; padding-bottom: 0.5rem; }
                .py-3 { padding-top: 0.75rem; padding-bottom: 0.75rem; }
                .pt-4 { padding-top: 0.75rem; }
                .rounded-lg { border-radius: 0.5rem; }
                .border { border: 1px solid #d1d5db; }
                .border-b { border-bottom: 1px solid #d1d5db; }
                .border-t { border-top: 1px solid #d1d5db; }
                .border-t-2 { border-top: 2px solid #9ca3af; }
                .border-gray-200 { border-color: #e5e7eb; }
                .border-gray-300 { border-color: #d1d5db; }
                .border-gray-400 { border-color: #9ca3af; }
                .border-collapse { border-collapse: collapse; }
                .w-full { width: 100%; }
                .w-64 { width: 12rem; }
                .max-w-4xl { max-width: 100%; }
                .mx-auto { margin-left: auto; margin-right: auto; }
                .flex { display: flex; }
                .justify-between { justify-content: space-between; }
                .justify-end { justify-content: flex-end; }
                .items-start { align-items: flex-start; }
                .text-left { text-align: left; }
                .text-right { text-align: right; }
                .text-center { text-align: center; }
                table { width: 100%; }
                th, td { padding: 0.5rem 0.75rem; }
              </style>
            </head>
            <body>
              ${printContent.innerHTML}
            </body>
          </html>
        `);
        printWindow.document.close();
        printWindow.print();
      }
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children || (
          <Button
            variant="outline"
            size="sm"
            className="bg-blue-50 hover:bg-blue-100 border-blue-200"
          >
            <RiFileTextLine className="h-4 w-4 mr-1" />
            View Invoice
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="!max-w-[90vw] !w-[90vw] max-h-[95vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between pr-12">
            <span>Invoice for Order {order.order_number}</span>
            <div className="flex items-center space-x-2">
              <Button onClick={handlePrint} size="sm" variant="outline">
                <RiPrinterLine className="h-4 w-4 mr-1" />
                Print
              </Button>
              <Link href={`/admin/orders/${order.id}/invoice`} target="_blank">
                <Button size="sm" variant="outline">
                  <RiExternalLinkLine className="h-4 w-4 mr-1" />
                  Full Page
                </Button>
              </Link>
            </div>
          </DialogTitle>
        </DialogHeader>
        <div id={`invoice-content-${order.id}`} className="mt-4">
          <Invoice order={order} className="" />
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default InvoiceDialog;
