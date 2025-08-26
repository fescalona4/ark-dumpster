/**
 * Simplified Square Invoice Service
 * This is a placeholder implementation that provides the interface
 * for Square invoice functionality. Replace with actual Square SDK calls
 * once the SDK is properly configured.
 */

import { Order } from '@/types/order';

// Mock response types for development
export interface SquareInvoiceResponse {
  success: boolean;
  invoice?: {
    id: string;
    status: string;
    publicUrl?: string;
    primaryRecipient?: {
      customerId?: string;
    };
  };
  error?: any;
  message?: string;
}

export interface SquareInvoiceRequest {
  order: Order;
  dueDate?: Date;
  paymentRequestMethod?: 'EMAIL' | 'SMS' | 'SHARE_MANUALLY';
  message?: string;
  customFields?: Array<{
    label: string;
    value: string;
  }>;
}

// Mock customer creation
export async function createOrGetSquareCustomer(order: Order): Promise<string> {
  // In production, this would create/find a Square customer
  console.log('Creating Square customer for:', order.email);
  return `customer_${order.id}`;
}

// Mock invoice creation
export async function createSquareInvoice(request: SquareInvoiceRequest): Promise<SquareInvoiceResponse> {
  const { order } = request;
  
  console.log('Creating Square invoice for order:', order.order_number);
  
  // In development/testing, return a mock response
  if (process.env.NODE_ENV === 'development' || !process.env.SQUARE_ACCESS_TOKEN) {
    return {
      success: true,
      invoice: {
        id: `invoice_${Date.now()}`,
        status: 'DRAFT',
        publicUrl: `https://squareup.com/pay-invoice/mock_${order.id}`,
        primaryRecipient: {
          customerId: `customer_${order.id}`,
        },
      },
    };
  }
  
  // TODO: Implement actual Square API call here
  return {
    success: false,
    error: 'Square API not configured',
    message: 'Please configure Square API credentials',
  };
}

// Mock invoice sending
export async function sendSquareInvoice(invoiceId: string): Promise<SquareInvoiceResponse> {
  console.log('Sending Square invoice:', invoiceId);
  
  if (process.env.NODE_ENV === 'development' || !process.env.SQUARE_ACCESS_TOKEN) {
    return {
      success: true,
      invoice: {
        id: invoiceId,
        status: 'SENT',
        publicUrl: `https://squareup.com/pay-invoice/${invoiceId}`,
      },
    };
  }
  
  return {
    success: false,
    error: 'Square API not configured',
    message: 'Please configure Square API credentials',
  };
}

// Mock invoice status check
export async function getSquareInvoice(invoiceId: string): Promise<SquareInvoiceResponse> {
  console.log('Getting Square invoice:', invoiceId);
  
  if (process.env.NODE_ENV === 'development' || !process.env.SQUARE_ACCESS_TOKEN) {
    return {
      success: true,
      invoice: {
        id: invoiceId,
        status: 'SENT',
        publicUrl: `https://squareup.com/pay-invoice/${invoiceId}`,
      },
    };
  }
  
  return {
    success: false,
    error: 'Square API not configured',
    message: 'Please configure Square API credentials',
  };
}

// Mock invoice update
export async function updateSquareInvoice(invoiceId: string, updates: any): Promise<SquareInvoiceResponse> {
  console.log('Updating Square invoice:', invoiceId, updates);
  
  if (process.env.NODE_ENV === 'development' || !process.env.SQUARE_ACCESS_TOKEN) {
    return {
      success: true,
      invoice: {
        id: invoiceId,
        status: 'DRAFT',
        publicUrl: `https://squareup.com/pay-invoice/${invoiceId}`,
      },
    };
  }
  
  return {
    success: false,
    error: 'Square API not configured',
  };
}

// Mock invoice cancellation
export async function cancelSquareInvoice(invoiceId: string): Promise<SquareInvoiceResponse> {
  console.log('Canceling Square invoice:', invoiceId);
  
  if (process.env.NODE_ENV === 'development' || !process.env.SQUARE_ACCESS_TOKEN) {
    return {
      success: true,
      invoice: {
        id: invoiceId,
        status: 'CANCELED',
      },
    };
  }
  
  return {
    success: false,
    error: 'Square API not configured',
  };
}

// Mock invoice deletion
export async function deleteSquareInvoice(invoiceId: string): Promise<SquareInvoiceResponse> {
  console.log('Deleting Square invoice:', invoiceId);
  
  if (process.env.NODE_ENV === 'development' || !process.env.SQUARE_ACCESS_TOKEN) {
    return {
      success: true,
    };
  }
  
  return {
    success: false,
    error: 'Square API not configured',
  };
}

// Mock invoice listing
export async function listSquareInvoices(locationId?: string, limit = 50, cursor?: string) {
  console.log('Listing Square invoices');
  
  if (process.env.NODE_ENV === 'development' || !process.env.SQUARE_ACCESS_TOKEN) {
    return {
      success: true,
      invoices: [],
      cursor: undefined,
    };
  }
  
  return {
    success: false,
    error: 'Square API not configured',
    invoices: [],
  };
}

// Mock invoice search
export async function searchSquareInvoices(query: {
  customerIds?: string[];
  invoiceNumbers?: string[];
  statuses?: string[];
}) {
  console.log('Searching Square invoices:', query);
  
  if (process.env.NODE_ENV === 'development' || !process.env.SQUARE_ACCESS_TOKEN) {
    return {
      success: true,
      invoices: [],
      cursor: undefined,
    };
  }
  
  return {
    success: false,
    error: 'Square API not configured',
    invoices: [],
  };
}

// Helper function to calculate invoice line items
export function calculateInvoiceLineItems(order: Order) {
  const subtotal = order.final_price || order.quoted_price || 0;
  const taxRate = 0.08; // 8% tax rate
  const taxAmount = subtotal * taxRate;
  const total = subtotal + taxAmount;

  return {
    subtotal,
    taxAmount,
    total,
    lineItems: [
      {
        name: `Dumpster Rental - ${order.dumpster_size || 'Standard'} Yard`,
        quantity: 1,
        unitPrice: subtotal,
        total: subtotal,
      },
    ],
  };
}

// Mock webhook signature verification
export function verifyWebhookSignature(
  signature: string,
  body: string,
  webhookSecret: string
): boolean {
  console.log('Verifying webhook signature (mock)');
  // In development, always return true
  if (process.env.NODE_ENV === 'development') {
    return true;
  }
  
  // TODO: Implement actual signature verification
  return false;
}