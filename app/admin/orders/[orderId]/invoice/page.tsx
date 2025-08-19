'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Order } from '@/types/order';
import Invoice from '@/components/invoices/invoice';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import AuthGuard from '@/components/providers/auth-guard';
import { RiPrinterLine, RiDownloadLine, RiArrowLeftLine } from '@remixicon/react';
import Link from 'next/link';

export default function InvoicePage() {
  return (
    <AuthGuard>
      <InvoicePageContent />
    </AuthGuard>
  );
}

function InvoicePageContent() {
  const params = useParams();
  const orderId = params.orderId as string;

  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('orders')
          .select('*')
          .eq('id', orderId)
          .single();

        if (error) {
          throw error;
        }

        setOrder(data);
      } catch (err) {
        console.error('Error fetching order:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch order');
      } finally {
        setLoading(false);
      }
    };

    if (orderId) {
      fetchOrder();
    }
  }, [orderId]);

  const handlePrint = () => {
    window.print();
  };

  const handleDownload = () => {
    // Create a new window with just the invoice content
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      const invoiceElement = document.getElementById('invoice-content');
      if (invoiceElement) {
        printWindow.document.write(`
          <!DOCTYPE html>
          <html>
            <head>
              <title>Invoice - ${order?.order_number}</title>
              <style>
                body { font-family: Arial, sans-serif; margin: 0; padding: 20px; }
                @media print { body { margin: 0; } }
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
                .text-3xl { font-size: 1.875rem; }
                .text-2xl { font-size: 1.5rem; }
                .text-lg { font-size: 1.125rem; }
                .text-sm { font-size: 0.875rem; }
                .mb-2 { margin-bottom: 0.5rem; }
                .mb-4 { margin-bottom: 1rem; }
                .mb-8 { margin-bottom: 2rem; }
                .mt-2 { margin-top: 0.5rem; }
                .p-4 { padding: 1rem; }
                .p-8 { padding: 2rem; }
                .px-4 { padding-left: 1rem; padding-right: 1rem; }
                .py-2 { padding-top: 0.5rem; padding-bottom: 0.5rem; }
                .py-3 { padding-top: 0.75rem; padding-bottom: 0.75rem; }
                .pt-4 { padding-top: 1rem; }
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
                .w-64 { width: 16rem; }
                .max-w-4xl { max-width: 56rem; }
                .mx-auto { margin-left: auto; margin-right: auto; }
                .flex { display: flex; }
                .justify-between { justify-content: space-between; }
                .justify-end { justify-content: flex-end; }
                .items-start { align-items: flex-start; }
                .text-left { text-align: left; }
                .text-right { text-align: right; }
                .text-center { text-align: center; }
                table { width: 100%; }
                th, td { padding: 0.75rem 1rem; }
              </style>
            </head>
            <body>
              ${invoiceElement.innerHTML}
            </body>
          </html>
        `);
        printWindow.document.close();
        printWindow.print();
      }
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">Loading invoice...</div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-8">
              <h3 className="text-lg font-medium mb-2">Invoice not found</h3>
              <p className="text-muted-foreground mb-4">
                {error || 'The requested invoice could not be found.'}
              </p>
              <Link href="/admin/orders">
                <Button variant="outline">
                  <RiArrowLeftLine className="h-4 w-4 mr-2" />
                  Back to Orders
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header with actions - hidden when printing */}
      <div className="bg-card border-b print:hidden">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link href="/admin/orders">
                <Button variant="outline" size="sm">
                  <RiArrowLeftLine className="h-4 w-4 mr-2" />
                  Back to Orders
                </Button>
              </Link>
              <h1 className="text-xl font-semibold">
                Invoice for Order {order.order_number}
              </h1>
            </div>
            <div className="flex items-center space-x-2">
              <Button onClick={handleDownload} variant="outline" size="sm">
                <RiDownloadLine className="h-4 w-4 mr-2" />
                Download
              </Button>
              <Button onClick={handlePrint} size="sm">
                <RiPrinterLine className="h-4 w-4 mr-2" />
                Print
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Invoice content */}
      <div className="container mx-auto px-4 py-8">
        <div id="invoice-content">
          <Invoice order={order} className="shadow-lg" />
        </div>
      </div>
    </div>
  );
}
