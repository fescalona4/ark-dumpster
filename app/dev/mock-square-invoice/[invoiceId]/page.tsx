'use client';

import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { CheckCircle, CreditCard, Building, Mail, Phone, MapPin, Loader2, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { centsToDollars } from '@/lib/utils';
import { format } from 'date-fns';

interface PaymentLineItem {
  id: string;
  name: string;
  description?: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  tax_amount?: number;
}

interface Payment {
  id: string;
  order_id: string;
  square_invoice_id: string;
  subtotal_amount: number;
  tax_amount: number;
  total_amount: number;
  status: string;
  customer_email?: string;
  customer_phone?: string;
  description?: string;
  due_date?: string;
  metadata?: any;
  line_items?: PaymentLineItem[];
  order?: {
    order_number: string;
    customer_name?: string;
    address?: string;
    city?: string;
    state?: string;
    zip?: string;
  };
}

export default function MockSquareInvoicePage() {
  const params = useParams();
  const invoiceId = params.invoiceId as string;
  const [payment, setPayment] = useState<Payment | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPaymentData = async () => {
      try {
        setLoading(true);
        
        // Fetch payment data by Square invoice ID
        const response = await fetch(`/api/payments/square-invoice/${invoiceId}`);
        
        if (!response.ok) {
          throw new Error('Failed to fetch payment data');
        }
        
        const data = await response.json();
        
        if (data.success && data.payment) {
          setPayment(data.payment);
        } else {
          throw new Error(data.error || 'Payment not found');
        }
      } catch (err) {
        console.error('Error fetching payment:', err);
        setError(err instanceof Error ? err.message : 'Failed to load invoice');
      } finally {
        setLoading(false);
      }
    };

    if (invoiceId) {
      fetchPaymentData();
    }
  }, [invoiceId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading invoice...</p>
        </div>
      </div>
    );
  }

  if (error || !payment) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error || 'Invoice not found'}</p>
          <Button onClick={() => window.history.back()}>Go Back</Button>
        </div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-2xl mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Invoice Payment
          </h1>
          <p className="text-gray-600">
            {payment.order?.order_number ? `Order ${payment.order.order_number}` : `Invoice ${invoiceId}`}
          </p>
        </div>

        {/* Invoice Card */}
        <Card className="mb-6">
          <CardHeader className="border-b">
            <div className="flex justify-between items-start">
              <div>
                <CardTitle className="flex items-center gap-2 text-xl">
                  <Building className="h-5 w-5" />
                  ARK Dumpster Services
                </CardTitle>
                <p className="text-sm text-gray-500 mt-1">Professional Waste Management Solutions</p>
              </div>
              <div className="text-right">
                <p className="text-xs text-gray-500 uppercase tracking-wide">Invoice</p>
                <p className="font-mono text-sm font-semibold">{invoiceId}</p>
                <p className="text-xs text-gray-500 mt-1">{format(new Date(), 'MMM dd, yyyy')}</p>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6 pt-6">
            {/* Bill To */}
            <div>
              <h3 className="font-semibold mb-2">Bill To:</h3>
              <div className="space-y-1 text-sm">
                {payment.order?.customer_name && (
                  <div>{payment.order.customer_name}</div>
                )}
                {payment.customer_email && (
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4" />
                    {payment.customer_email}
                  </div>
                )}
                {payment.customer_phone && (
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4" />
                    {payment.customer_phone}
                  </div>
                )}
                {(payment.order?.address || payment.order?.city) && (
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    {[
                      payment.order.address,
                      payment.order.city,
                      payment.order.state,
                      payment.order.zip
                    ].filter(Boolean).join(', ')}
                  </div>
                )}
              </div>
            </div>

            {/* Service Details */}
            <div>
              <h3 className="font-semibold mb-3">Service Details</h3>
              
              {/* Line Items Table */}
              {payment.line_items && payment.line_items.length > 0 ? (
                <div className="border border-gray-200 rounded-lg overflow-hidden">
                  <table className="w-full">
                    <thead className="bg-gray-50 border-b border-gray-200">
                      <tr>
                        <th className="text-left px-4 py-3 text-sm font-semibold text-gray-900">Service</th>
                        <th className="text-center px-3 py-3 text-sm font-semibold text-gray-900">Qty</th>
                        <th className="text-right px-3 py-3 text-sm font-semibold text-gray-900">Rate</th>
                        <th className="text-right px-4 py-3 text-sm font-semibold text-gray-900">Amount</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 bg-white">
                      {payment.line_items.map((item, index) => (
                        <tr key={item.id} className="hover:bg-gray-50">
                          <td className="px-4 py-3">
                            <div className="font-medium text-gray-900">{item.name}</div>
                            {item.description && (
                              <div className="text-sm text-gray-500 mt-0.5">{item.description}</div>
                            )}
                          </td>
                          <td className="text-center px-3 py-3 text-gray-900">
                            {item.quantity}
                          </td>
                          <td className="text-right px-3 py-3 text-gray-900">
                            ${centsToDollars(item.unit_price)}
                          </td>
                          <td className="text-right px-4 py-3 font-medium text-gray-900">
                            ${centsToDollars(item.total_price)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  
                  {/* Totals Section */}
                  <div className="bg-gray-50 px-4 py-3 border-t border-gray-200">
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Subtotal</span>
                        <span className="font-medium text-gray-900">
                          ${centsToDollars(payment.subtotal_amount)}
                        </span>
                      </div>
                      {payment.tax_amount > 0 && (
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Sales Tax</span>
                          <span className="font-medium text-gray-900">
                            ${centsToDollars(payment.tax_amount)}
                          </span>
                        </div>
                      )}
                      <div className="flex justify-between pt-2 border-t border-gray-200">
                        <span className="text-base font-semibold text-gray-900">Total Amount Due</span>
                        <span className="text-lg font-bold text-gray-900">
                          ${centsToDollars(payment.total_amount)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-8 text-center">
                  <div className="text-gray-500">No services found for this invoice</div>
                </div>
              )}
              
              {/* Payment Terms */}
              {payment.due_date && (
                <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                  <div className="flex items-center gap-2 text-sm text-amber-800">
                    <Clock className="h-4 w-4" />
                    <span className="font-medium">Payment Due:</span>
                    <span>{format(new Date(payment.due_date), 'MMMM dd, yyyy')}</span>
                  </div>
                </div>
              )}
            </div>

            {/* Status */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-center gap-2 text-blue-700">
                <CheckCircle className="h-5 w-5" />
                <span className="font-semibold">Development Mode</span>
              </div>
              <p className="text-sm text-blue-600 mt-1">
                This is a mock invoice for testing. In production, this would be a real Square payment page.
              </p>
              <p className="text-sm text-blue-600 mt-1">
                Status: <span className="font-medium">{payment.status}</span>
              </p>
            </div>

            {/* Mock Payment Button */}
            <div className="pt-4">
              <Button 
                className="w-full bg-blue-600 hover:bg-blue-700" 
                size="lg"
                onClick={() => alert('This is a mock payment page. In production, this would process the payment through Square.')}
                disabled={['PAID', 'CANCELED', 'FAILED'].includes(payment.status)}
              >
                <CreditCard className="h-5 w-5 mr-2" />
                Pay ${centsToDollars(payment.total_amount)} (Mock)
              </Button>
              <p className="text-xs text-center text-gray-500 mt-2">
                Powered by Square (Development Mode)
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Developer Info */}
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-center">
          <h3 className="font-semibold text-yellow-800 mb-2">Development Mode Active</h3>
          <p className="text-sm text-yellow-700">
            To use real Square invoices, configure your Square API credentials and set NODE_ENV to production.
          </p>
        </div>
      </div>
    </div>
  );
}