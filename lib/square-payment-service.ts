/**
 * Square Payment Service
 * Integrates Square invoice functionality with the Payment table system
 */

import { Order, Payment, PaymentMethod, PaymentStatus } from '@/types/database';
import {
  createPaymentFromOrder,
  updatePayment,
  updateSquarePaymentData,
  markPaymentAsSent,
  markPaymentAsViewed,
  recordPaymentTransaction,
  cancelPayment,
  getPaymentBySquareInvoiceId,
  logPaymentWebhookEvent,
  centsToDollars,
} from '@/lib/payment-service';

// Mock response types for development (replace with actual Square SDK)
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
  error?: string;
  message?: string;
  payment?: Payment;
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

/**
 * Create Square invoice and Payment record
 */
export async function createSquareInvoiceWithPayment(
  request: SquareInvoiceRequest
): Promise<SquareInvoiceResponse> {
  try {
    const { order, dueDate } = request;

    console.log('Creating Square invoice with payment for order:', order.order_number);

    // Step 1: Create payment record
    const paymentResult = await createPaymentFromOrder(order, 'SQUARE_INVOICE', dueDate);

    if (!paymentResult.success || !paymentResult.data) {
      return {
        success: false,
        error: paymentResult.error || 'Failed to create payment record',
      };
    }

    const payment = paymentResult.data;

    // Step 2: Create Square invoice (mock for development)
    if (process.env.NODE_ENV === 'development' || !process.env.SQUARE_ACCESS_TOKEN) {
      const mockSquareInvoiceId = `sq_invoice_${Date.now()}`;
      const mockCustomerId = `sq_customer_${order.id}`;
      const mockPublicUrl = `http://localhost:3000/dev/mock-square-invoice/${mockSquareInvoiceId}`;

      // Update payment with Square data
      await updateSquarePaymentData(payment.id, {
        square_invoice_id: mockSquareInvoiceId,
        square_customer_id: mockCustomerId,
        square_location_id: process.env.SQUARE_LOCATION_ID || 'mock_location',
        public_payment_url: mockPublicUrl,
        invoice_url: mockPublicUrl,
      });

      // Update payment with customer info
      await updatePayment(payment.id, {
        status: 'DRAFT',
        metadata: {
          ...payment.metadata,
          customer_email: order.email,
          customer_phone: order.phone?.toString(),
        },
      });

      return {
        success: true,
        invoice: {
          id: mockSquareInvoiceId,
          status: 'DRAFT',
          publicUrl: mockPublicUrl,
          primaryRecipient: {
            customerId: mockCustomerId,
          },
        },
        payment: {
          ...payment,
          square_invoice_id: mockSquareInvoiceId,
          square_customer_id: mockCustomerId,
          public_payment_url: mockPublicUrl,
        },
      };
    }

    // TODO: Implement actual Square API integration here
    // This would use the actual Square SDK to create the invoice

    return {
      success: false,
      error: 'Square API not configured for production',
      message: 'Please configure Square API credentials for production use',
      payment,
    };
  } catch (error) {
    console.error('Error creating Square invoice with payment:', error);
    return {
      success: false,
      error: 'Failed to create Square invoice',
    };
  }
}

/**
 * Send Square invoice
 */
export async function sendSquareInvoiceWithPayment(
  paymentId: string
): Promise<SquareInvoiceResponse> {
  try {
    console.log('Sending Square invoice for payment:', paymentId);

    // Mock sending for development
    if (process.env.NODE_ENV === 'development' || !process.env.SQUARE_ACCESS_TOKEN) {
      const result = await markPaymentAsSent(paymentId);

      if (!result.success) {
        return {
          success: false,
          error: result.error || 'Failed to mark payment as sent',
        };
      }

      return {
        success: true,
        invoice: {
          id: result.data?.square_invoice_id || 'mock_invoice',
          status: 'SENT',
          publicUrl: result.data?.public_payment_url || undefined,
        },
        payment: result.data,
      };
    }

    // TODO: Implement actual Square API sending

    return {
      success: false,
      error: 'Square API not configured for production',
    };
  } catch (error) {
    console.error('Error sending Square invoice:', error);
    return {
      success: false,
      error: 'Failed to send Square invoice',
    };
  }
}

/**
 * Get Square invoice status and update payment
 */
export async function getSquareInvoiceStatus(
  squareInvoiceId: string
): Promise<SquareInvoiceResponse> {
  try {
    console.log('Getting Square invoice status:', squareInvoiceId);

    // Get payment record
    const paymentResult = await getPaymentBySquareInvoiceId(squareInvoiceId);

    if (!paymentResult.success || !paymentResult.data) {
      return {
        success: false,
        error: 'Payment not found for Square invoice ID',
      };
    }

    const payment = paymentResult.data;

    // Mock status check for development
    if (process.env.NODE_ENV === 'development' || !process.env.SQUARE_ACCESS_TOKEN) {
      return {
        success: true,
        invoice: {
          id: squareInvoiceId,
          status: payment.status,
          publicUrl: payment.public_payment_url || undefined,
        },
        payment,
      };
    }

    // TODO: Implement actual Square API status check

    return {
      success: false,
      error: 'Square API not configured for production',
      payment,
    };
  } catch (error) {
    console.error('Error getting Square invoice status:', error);
    return {
      success: false,
      error: 'Failed to get Square invoice status',
    };
  }
}

/**
 * Cancel Square invoice and update payment
 */
export async function cancelSquareInvoiceWithPayment(
  paymentId: string,
  reason?: string
): Promise<SquareInvoiceResponse> {
  try {
    console.log('Canceling Square invoice for payment:', paymentId);

    // Cancel payment record
    const result = await cancelPayment(paymentId, reason);

    if (!result.success) {
      return {
        success: false,
        error: result.error || 'Failed to cancel payment',
      };
    }

    // Mock Square cancellation for development
    if (process.env.NODE_ENV === 'development' || !process.env.SQUARE_ACCESS_TOKEN) {
      return {
        success: true,
        invoice: {
          id: result.data?.square_invoice_id || 'mock_invoice',
          status: 'CANCELED',
        },
        payment: result.data,
      };
    }

    // TODO: Implement actual Square API cancellation

    return {
      success: false,
      error: 'Square API not configured for production',
      payment: result.data,
    };
  } catch (error) {
    console.error('Error canceling Square invoice:', error);
    return {
      success: false,
      error: 'Failed to cancel Square invoice',
    };
  }
}

/**
 * Handle Square webhook events and update payment records
 */
// Define interface for Square webhook payload
interface SquareWebhookPayload {
  data?: {
    object?: {
      invoice?: {
        id?: string;
        status?: string;
        publicUrl?: string;
        paymentRequests?: Array<{
          totalCompletedAmountMoney?: {
            amount?: string;
          };
        }>;
      };
      payment?: {
        id?: string;
      };
    };
  };
}

export async function handleSquareWebhookEvent(
  eventType: string,
  eventId: string,
  payload: SquareWebhookPayload
): Promise<{ success: boolean; error?: string }> {
  try {
    console.log('Handling Square webhook event:', eventType);

    // Log the webhook event
    await logPaymentWebhookEvent(eventType, eventId, 'SQUARE', payload as Record<string, unknown>);

    const squareInvoiceId = payload.data?.object?.invoice?.id;

    if (!squareInvoiceId) {
      console.log('No Square invoice ID found in webhook payload');
      return { success: true };
    }

    // Get payment record
    const paymentResult = await getPaymentBySquareInvoiceId(squareInvoiceId);

    if (!paymentResult.success || !paymentResult.data) {
      console.log('No payment found for Square invoice ID:', squareInvoiceId);
      return { success: true };
    }

    const payment = paymentResult.data;
    const invoice = payload.data?.object?.invoice;

    // Handle different webhook events
    switch (eventType) {
      case 'invoice.sent':
        await markPaymentAsSent(payment.id, invoice?.publicUrl);
        break;

      case 'invoice.viewed':
        await markPaymentAsViewed(payment.id);
        break;

      case 'invoice.payment_made':
        const paidAmount = invoice?.paymentRequests?.[0]?.totalCompletedAmountMoney?.amount;
        if (paidAmount) {
          const dollarAmount = centsToDollars(parseInt(paidAmount));

          // Record the transaction
          await recordPaymentTransaction(
            payment.id,
            'CHARGE',
            dollarAmount,
            payload.data?.object?.payment?.id,
            { webhook_event_id: eventId }
          );

          // Update payment status based on amount paid
          const totalAmount = centsToDollars(payment.total_amount);
          let status = 'PARTIALLY_PAID';

          if (dollarAmount >= totalAmount) {
            status = 'PAID';
          }

          await updatePayment(payment.id, {
            status: status as PaymentStatus,
            paid_amount: dollarAmount,
          });
        }
        break;

      case 'invoice.canceled':
        await cancelPayment(payment.id, 'Canceled via Square');
        break;

      case 'invoice.updated':
        // Update payment status to match Square status
        const squareStatus = invoice?.status;
        let paymentStatus = payment.status;

        switch (squareStatus) {
          case 'SENT':
            paymentStatus = 'SENT';
            break;
          case 'VIEWED':
            paymentStatus = 'VIEWED';
            break;
          case 'PAID':
            paymentStatus = 'PAID';
            break;
          case 'CANCELED':
            paymentStatus = 'CANCELED';
            break;
        }

        if (paymentStatus !== payment.status) {
          await updatePayment(payment.id, { status: paymentStatus });
        }
        break;

      default:
        console.log('Unhandled webhook event type:', eventType);
    }

    return { success: true };
  } catch (error) {
    console.error('Error handling Square webhook event:', error);
    return { success: false, error: 'Failed to process webhook event' };
  }
}

/**
 * Helper function to format payment amount for display
 */
export function formatPaymentAmount(payment: Payment): string {
  const amount = centsToDollars(payment.total_amount);
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount);
}

/**
 * Helper function to get payment status display info
 */
export function getPaymentStatusInfo(status: PaymentStatus) {
  const statusMap = {
    DRAFT: { color: 'gray', label: 'Draft', icon: '📄' },
    PENDING: { color: 'yellow', label: 'Pending', icon: '⏳' },
    SENT: { color: 'blue', label: 'Sent', icon: '📧' },
    VIEWED: { color: 'purple', label: 'Viewed', icon: '👁️' },
    PARTIALLY_PAID: { color: 'orange', label: 'Partially Paid', icon: '💰' },
    PAID: { color: 'green', label: 'Paid', icon: '✅' },
    OVERDUE: { color: 'red', label: 'Overdue', icon: '⚠️' },
    CANCELED: { color: 'red', label: 'Canceled', icon: '❌' },
    REFUNDED: { color: 'gray', label: 'Refunded', icon: '↩️' },
    FAILED: { color: 'red', label: 'Failed', icon: '💥' },
  };

  return statusMap[status] || statusMap['DRAFT'];
}
