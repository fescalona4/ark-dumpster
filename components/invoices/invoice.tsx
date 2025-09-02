'use client';

import { Order } from '@/types/order';
import { format } from 'date-fns';

interface InvoiceProps {
  order: Order;
  invoiceNumber?: string;
  className?: string;
}

// Helper function to format phone numbers
const formatPhoneNumber = (phone: number | null) => {
  if (!phone) return '';
  const phoneStr = phone.toString();
  if (phoneStr.length === 10) {
    return `(${phoneStr.slice(0, 3)}) ${phoneStr.slice(3, 6)}-${phoneStr.slice(6)}`;
  }
  return phoneStr;
};

export function Invoice({ order, invoiceNumber, className = '' }: InvoiceProps) {
  const generateInvoiceNumber = (orderId: string) => {
    return `INV-${orderId.slice(-8).toUpperCase()}`;
  };

  const invoice_number = invoiceNumber || generateInvoiceNumber(order.id);
  const invoice_date = format(new Date(), 'MMMM dd, yyyy');
  const due_date = format(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), 'MMMM dd, yyyy'); // 30 days from now

  const subtotal = order.final_price || order.quoted_price || 0;
  const tax_rate = 0.08; // 8% tax rate - you can make this configurable
  const tax_amount = subtotal * tax_rate;
  const total = subtotal + tax_amount;

  return (
    <div className={`bg-white p-8 max-w-4xl mx-auto ${className}`}>
      {/* Header */}
      <div className="flex justify-between items-start mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">INVOICE</h1>
          <div className="text-gray-800">
            <p>Invoice #: {invoice_number}</p>
            <p>Date: {invoice_date}</p>
            <p>Due Date: {due_date}</p>
          </div>
        </div>
        <div className="text-right">
          <h2 className="text-2xl font-bold text-blue-600 mb-2">ARK Dumpster</h2>
          <div className="text-gray-800">
            <p>123 Business Street</p>
            <p>City, State 12345</p>
            <p>Phone: (555) 123-4567</p>
            <p>Email: info@arkdumpster.com</p>
          </div>
        </div>
      </div>

      {/* Bill To */}
      <div className="mb-8">
        <h3 className="text-lg font-semibold mb-4 text-gray-900">Bill To:</h3>
        <div className="bg-gray-50 p-4 rounded-lg">
          <p className="font-semibold text-gray-900">
            {order.first_name} {order.last_name}
          </p>
          <p className="text-gray-800">{order.email}</p>
          {order.phone && <p className="text-gray-800">{formatPhoneNumber(order.phone)}</p>}
          {order.address && (
            <div className="mt-2">
              <p className="text-gray-800">{order.address}</p>
              {order.address2 && <p className="text-gray-800">{order.address2}</p>}
              {order.city && order.state && order.zip_code && (
                <p className="text-gray-800">
                  {order.city}, {order.state} {order.zip_code}
                </p>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Order Details */}
      <div className="mb-8">
        <h3 className="text-lg font-semibold mb-4 text-gray-900">Order Details:</h3>
        <div className="bg-gray-50 p-4 rounded-lg">
          <p className="text-gray-800">
            <span className="font-medium">Order Number:</span> {order.order_number}
          </p>
          {order.dumpster_size && (
            <p className="text-gray-800">
              <span className="font-medium">Dumpster Size:</span> {order.dumpster_size} Yard
            </p>
          )}
          {order.scheduled_delivery_date && (
            <p className="text-gray-800">
              <span className="font-medium">Delivery Date:</span>{' '}
              {format(new Date(order.scheduled_delivery_date), 'MMMM dd, yyyy')}
            </p>
          )}
          {order.scheduled_pickup_date && (
            <p className="text-gray-800">
              <span className="font-medium">Pickup Date:</span>{' '}
              {format(new Date(order.scheduled_pickup_date), 'MMMM dd, yyyy')}
            </p>
          )}
          {order.message && (
            <p className="text-gray-800">
              <span className="font-medium">Special Instructions:</span> {order.message}
            </p>
          )}
        </div>
      </div>

      {/* Services Table */}
      <div className="mb-8">
        <table className="w-full border-collapse border border-gray-300">
          <thead>
            <tr className="bg-gray-100">
              <th className="border border-gray-300 px-4 py-3 text-left text-gray-900">
                Description
              </th>
              <th className="border border-gray-300 px-4 py-3 text-right text-gray-900">
                Quantity
              </th>
              <th className="border border-gray-300 px-4 py-3 text-right text-gray-900">Rate</th>
              <th className="border border-gray-300 px-4 py-3 text-right text-gray-900">Amount</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="border border-gray-300 px-4 py-3 text-gray-800">
                Dumpster Rental Service
                {order.dumpster_size && (
                  <div className="text-sm text-gray-700">{order.dumpster_size} Yard Dumpster</div>
                )}
                {order.address && (
                  <div className="text-sm text-gray-700">Delivery to: {order.address}</div>
                )}
              </td>
              <td className="border border-gray-300 px-4 py-3 text-right text-gray-800">1</td>
              <td className="border border-gray-300 px-4 py-3 text-right text-gray-800">
                ${subtotal.toFixed(2)}
              </td>
              <td className="border border-gray-300 px-4 py-3 text-right text-gray-800">
                ${subtotal.toFixed(2)}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Totals */}
      <div className="flex justify-end mb-8">
        <div className="w-64">
          <div className="flex justify-between py-2 border-b border-gray-200 text-gray-800">
            <span>Subtotal:</span>
            <span>${subtotal.toFixed(2)}</span>
          </div>
          <div className="flex justify-between py-2 border-b border-gray-200 text-gray-800">
            <span>Tax (8%):</span>
            <span>${tax_amount.toFixed(2)}</span>
          </div>
          <div className="flex justify-between py-3 font-bold text-lg border-t-2 border-gray-400 text-gray-900">
            <span>Total:</span>
            <span>${total.toFixed(2)}</span>
          </div>
        </div>
      </div>

      {/* Payment Terms */}
      <div className="mb-8">
        <h3 className="text-lg font-semibold mb-4 text-gray-900">Payment Terms:</h3>
        <div className="bg-gray-50 p-4 rounded-lg text-sm text-gray-800">
          <p>• Payment is due within 30 days of invoice date</p>
          <p>• Late payments may incur additional charges</p>
          <p>• Please include invoice number with payment</p>
          <p>• For questions about this invoice, contact us at (555) 123-4567</p>
        </div>
      </div>

      {/* Footer */}
      <div className="text-center text-gray-700 text-sm border-t pt-4">
        <p>Thank you for your business!</p>
        <p>ARK Dumpster - Professional Dumpster Rental Services</p>
      </div>
    </div>
  );
}

export default Invoice;
