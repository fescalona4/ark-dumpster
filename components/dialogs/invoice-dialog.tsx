'use client';

import { useState, useEffect } from 'react';
import { Order } from '@/types/database';
import { Payment } from '@/types/payment';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { RiFileTextLine, RiExternalLinkLine, RiLoader4Line, RiReceiptLine } from '@remixicon/react';

interface InvoiceDialogProps {
  order: Order;
  children?: React.ReactNode;
}

export function InvoiceDialog({ order, children }: InvoiceDialogProps) {
  const [open, setOpen] = useState(false);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(false);

  // Fetch payments when dialog opens
  useEffect(() => {
    if (open) {
      fetchPayments();
    }
  }, [open, order.id]);

  const fetchPayments = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/orders/${order.id}/payments`);
      const data = await response.json();
      
      if (response.ok && data.success) {
        setPayments(data.payments || []);
      }
    } catch (error) {
      console.error('Error fetching payments:', error);
    } finally {
      setLoading(false);
    }
  };

  // Get the Square invoice payment (if any)
  const squarePayment = payments.find(p => p.method === 'SQUARE_INVOICE' && p.public_payment_url);

  const handleViewSquareInvoice = () => {
    if (squarePayment?.public_payment_url) {
      window.open(squarePayment.public_payment_url, '_blank');
    }
  };


  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
{children || (
          <Button
            variant="outline"
            size="sm"
            className="min-h-[44px] px-4 touch-manipulation bg-blue-50 hover:bg-blue-100 border-blue-200"
          >
            <RiReceiptLine className="h-4 w-4 mr-2" />
            View Square Invoice
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>Square Invoice for Order {order.order_number}</span>
            {loading && (
              <RiLoader4Line className="h-4 w-4 animate-spin" />
            )}
          </DialogTitle>
        </DialogHeader>
        
        <div className="mt-6">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <RiLoader4Line className="h-8 w-8 animate-spin text-gray-400" />
              <span className="ml-2 text-gray-600">Loading payment information...</span>
            </div>
          ) : squarePayment ? (
            /* Square Invoice Available */
            <div className="text-center space-y-6">
              <div className="bg-green-50 border border-green-200 rounded-lg p-6">
                <div className="flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mx-auto mb-4">
                  <RiReceiptLine className="h-8 w-8 text-green-600" />
                </div>
                <h3 className="text-lg font-semibold text-green-900 mb-2">Square Invoice Ready</h3>
                <div className="space-y-1 text-sm text-green-700 mb-4">
                  <p><strong>Payment ID:</strong> {squarePayment.payment_number}</p>
                  <p><strong>Status:</strong> {squarePayment.status.replace('_', ' ')}</p>
                  {squarePayment.total_amount && (
                    <p><strong>Amount:</strong> ${(squarePayment.total_amount / 100).toFixed(2)}</p>
                  )}
                  {squarePayment.due_date && (
                    <p><strong>Due Date:</strong> {new Date(squarePayment.due_date).toLocaleDateString()}</p>
                  )}
                </div>
                <Button 
                  onClick={handleViewSquareInvoice} 
                  size="lg" 
                  className="bg-blue-600 hover:bg-blue-700 px-8"
                >
                  <RiExternalLinkLine className="h-5 w-5 mr-2" />
                  Open Square Invoice
                </Button>
              </div>
              
              <p className="text-sm text-gray-500">
                This will open the professional Square invoice in a new tab where customers can view details and make payments.
              </p>
            </div>
          ) : (
            /* No Square Invoice Found */
            <div className="text-center py-12">
              <div className="flex items-center justify-center w-16 h-16 bg-gray-100 rounded-full mx-auto mb-4">
                <RiReceiptLine className="h-8 w-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Square Invoice Found</h3>
              <p className="text-gray-600 mb-6">
                Create a Square invoice for this order to enable professional invoicing and online payments.
              </p>
              <Button 
                onClick={() => setOpen(false)}
                variant="outline"
              >
                Close
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default InvoiceDialog;
