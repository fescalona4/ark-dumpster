'use client';

import { useParams } from 'next/navigation';
import { CheckCircle, CreditCard, Building, Mail, Phone, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function MockSquareInvoicePage() {
  const params = useParams();
  const invoiceId = params.invoiceId as string;

  // Extract timestamp from invoice ID for demo data
  const timestamp = invoiceId?.replace('sq_invoice_', '');
  const amount = 108.00; // Mock amount
  
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-2xl mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Invoice Payment
          </h1>
          <p className="text-gray-600">
            This is a mock Square invoice for development purposes
          </p>
        </div>

        {/* Invoice Card */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building className="h-5 w-5" />
              ARK Dumpster Services
            </CardTitle>
            <p className="text-sm text-gray-600">Invoice #{invoiceId}</p>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Bill To */}
            <div>
              <h3 className="font-semibold mb-2">Bill To:</h3>
              <div className="space-y-1 text-sm">
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  fescalona4@gmail.com
                </div>
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4" />
                  (813) 842-1679
                </div>
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  Tampa, FL
                </div>
              </div>
            </div>

            {/* Service Details */}
            <div>
              <h3 className="font-semibold mb-2">Service:</h3>
              <div className="bg-gray-50 p-3 rounded">
                <div className="flex justify-between">
                  <span>20 Yard Dumpster Rental</span>
                  <span>$100.00</span>
                </div>
                <div className="flex justify-between text-sm text-gray-600">
                  <span>Tax (8%)</span>
                  <span>$8.00</span>
                </div>
                <hr className="my-2" />
                <div className="flex justify-between font-semibold">
                  <span>Total</span>
                  <span>${amount.toFixed(2)}</span>
                </div>
              </div>
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
            </div>

            {/* Mock Payment Button */}
            <div className="pt-4">
              <Button 
                className="w-full bg-blue-600 hover:bg-blue-700" 
                size="lg"
                onClick={() => alert('This is a mock payment page. In production, this would process the payment through Square.')}
              >
                <CreditCard className="h-5 w-5 mr-2" />
                Pay ${amount.toFixed(2)} (Mock)
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