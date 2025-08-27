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
  getPayment,
  getPaymentBySquareInvoiceId,
  logPaymentWebhookEvent,
  centsToDollars,
} from '@/lib/payment-service';
import { SquareClient, SquareEnvironment, SquareError } from 'square';

// Initialize Square client
const squareClient = new SquareClient({
  environment: process.env.SQUARE_ENVIRONMENT === 'production' ? SquareEnvironment.Production : SquareEnvironment.Sandbox,
  token: process.env.SQUARE_ACCESS_TOKEN,
});

const customersApi = squareClient.customers;
const invoicesApi = squareClient.invoices;
const locationsApi = squareClient.locations;

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

    // Step 2: Create Square customer if needed
    let customerId: string;
    
    try {
      const customerResponse = await customersApi.create({
        givenName: order.first_name,
        familyName: order.last_name || undefined,
        emailAddress: order.email,
        phoneNumber: order.phone?.toString(),
        note: `ARK Dumpster Order ${order.order_number}`,
      });
      
      customerId = (customerResponse as any).customer?.id || '';
    } catch (error) {
      console.error('Error creating Square customer:', error);
      // Try to continue without customer
      customerId = '';
    }

    // Step 3: Create Square Order first
    let squareOrderId: string;
    
    try {
      console.log('Creating Square Order...');
      const orderRequest = {
        locationId: process.env.SQUARE_LOCATION_ID,
        lineItems: [{
          name: `Dumpster Rental Service`,
          note: order.internal_notes || 'Dumpster rental service',
          quantity: '1',
          itemType: 'ITEM',
          basePriceMoney: {
            amount: BigInt(Math.round(centsToDollars(payment.total_amount) * 100)),
            currency: 'USD',
          },
        }],
      };

      console.log('Order request:', JSON.stringify(orderRequest, (key, value) =>
        typeof value === 'bigint' ? value.toString() : value, 2));

      const orderResponse = await squareClient.orders.create({ order: orderRequest as any });
      console.log('Order response:', orderResponse);
      
      const createdOrder = (orderResponse as any).order;
      if (!createdOrder?.id) {
        throw new Error(`Failed to create Square order: ${JSON.stringify(orderResponse)}`);
      }
      
      squareOrderId = createdOrder.id;
      console.log('Created Square Order ID:', squareOrderId);
      
    } catch (error) {
      console.error('Error creating Square order:', error);
      throw error;
    }

    // Step 4: Create Square invoice with the order ID
    try {
      console.log('Creating Square Invoice with order ID:', squareOrderId);
      
      const invoiceRequest = {
        locationId: process.env.SQUARE_LOCATION_ID,
        orderId: squareOrderId,
        primaryRecipient: {
          customerId: customerId || undefined,
        },
        paymentRequests: [{
          requestType: 'BALANCE' as any,
          dueDate: dueDate?.toISOString().split('T')[0],
        }],
        deliveryMethod: request.paymentRequestMethod || 'EMAIL',
        invoiceNumber: `ARK-${order.order_number}-${Date.now()}`,
        title: `ARK Dumpster Service - Order ${order.order_number}`,
        description: order.internal_notes || `Dumpster rental service for ${order.first_name} ${order.last_name || ''}`.trim(),
        customFields: request.customFields,
        acceptedPaymentMethods: {
          card: true,
          bankAccount: false,
          buyNowPayLater: false,
          squareGiftCard: false,
        },
      };

      const invoiceResponse = await invoicesApi.create({ invoice: invoiceRequest as any });
      
      if ((invoiceResponse as any).invoice) {
        const invoice = (invoiceResponse as any).invoice;
        
        // Update payment with Square data
        await updateSquarePaymentData(payment.id, {
          square_invoice_id: invoice.id,
          square_customer_id: customerId,
          square_location_id: process.env.SQUARE_LOCATION_ID || '',
          public_payment_url: invoice.publicUrl,
          invoice_url: invoice.publicUrl,
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
            id: invoice.id || '',
            status: invoice.status || 'DRAFT',
            publicUrl: invoice.publicUrl,
            primaryRecipient: {
              customerId: customerId,
            },
          },
          payment: {
            ...payment,
            square_invoice_id: invoice.id,
            square_customer_id: customerId,
            public_payment_url: invoice.publicUrl,
          },
        };
      }
    } catch (error) {
      console.error('Error creating Square invoice:', error);
      
      if (error instanceof SquareError) {
        return {
          success: false,
          error: `Square API Error: ${error.message}`,
          payment,
        };
      }
      
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      return {
        success: false,
        error: `Failed to create Square invoice: ${errorMessage}`,
        payment,
      };
    }

    return {
      success: false,
      error: 'Unknown error creating Square invoice',
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

    // Get payment record using the payment ID
    const paymentResult = await getPayment(paymentId);
    
    if (!paymentResult.success || !paymentResult.data?.square_invoice_id) {
      return {
        success: false,
        error: 'No Square invoice ID found for this payment',
      };
    }

    const payment = paymentResult.data;
    
    try {
      // First get current invoice to get version
      const currentInvoice = await invoicesApi.get({ invoiceId: payment.square_invoice_id });
      
      // Handle BigInt values in JSON serialization
      const invoiceForLogging = JSON.stringify(currentInvoice, (key, value) =>
        typeof value === 'bigint' ? value.toString() : value, 2);
      console.log('Current invoice response:', invoiceForLogging);
      
      const invoice = (currentInvoice as any).invoice || (currentInvoice as any).result?.invoice;
      
      if (invoice?.version === undefined || invoice?.version === null) {
        console.error('Invoice version not found. Available keys:', Object.keys(currentInvoice as any));
        if (invoice) {
          console.error('Invoice object keys:', Object.keys(invoice));
        }
        return {
          success: false,
          error: 'Could not retrieve invoice version from Square',
        };
      }

      console.log('Using invoice version:', invoice.version);

      // Send the invoice via Square API with version
      const sendResponse = await invoicesApi.publish({
        invoiceId: payment.square_invoice_id,
        version: invoice.version,
        requestMethod: 'EMAIL' as any,
      } as any);

      if ((sendResponse as any).invoice) {
        // Mark payment as sent in our system
        const result = await markPaymentAsSent(paymentId, (sendResponse as any).invoice.publicUrl);

        return {
          success: true,
          invoice: {
            id: (sendResponse as any).invoice.id || '',
            status: (sendResponse as any).invoice.status || 'SENT',
            publicUrl: (sendResponse as any).invoice.publicUrl,
          },
          payment: result.data,
        };
      }
    } catch (error) {
      console.error('Error sending Square invoice:', error);
      
      if (error instanceof SquareError) {
        return {
          success: false,
          error: `Square API Error: ${error.message}`,
        };
      }
      
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      return {
        success: false,
        error: `Failed to send Square invoice: ${errorMessage}`,
      };
    }

    return {
      success: false,
      error: 'Failed to send Square invoice',
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

    try {
      // Get invoice from Square API
      const invoiceResponse = await invoicesApi.get({ invoiceId: squareInvoiceId });
      
      if ((invoiceResponse as any).invoice) {
        const invoice = (invoiceResponse as any).invoice;
        
        // Update our payment status to match Square's
        let paymentStatus = payment.status;
        
        switch (invoice.status) {
          case 'DRAFT':
            paymentStatus = 'DRAFT';
            break;
          case 'UNPAID':
            paymentStatus = 'SENT';
            break;
          case 'SCHEDULED':
            paymentStatus = 'SENT';
            break;
          case 'PARTIALLY_PAID':
            paymentStatus = 'PARTIALLY_PAID';
            break;
          case 'PAID':
            paymentStatus = 'PAID';
            break;
          case 'PARTIALLY_REFUNDED':
            paymentStatus = 'PARTIALLY_PAID';
            break;
          case 'REFUNDED':
            paymentStatus = 'REFUNDED';
            break;
          case 'CANCELED':
            paymentStatus = 'CANCELED';
            break;
        }

        // Update payment status if it changed
        if (paymentStatus !== payment.status) {
          await updatePayment(payment.id, { status: paymentStatus as PaymentStatus });
        }

        return {
          success: true,
          invoice: {
            id: invoice.id || squareInvoiceId,
            status: invoice.status || 'UNKNOWN',
            publicUrl: invoice.publicUrl,
          },
          payment: {
            ...payment,
            status: paymentStatus as PaymentStatus,
          },
        };
      }
    } catch (error) {
      console.error('Error getting Square invoice status:', error);
      
      if (error instanceof SquareError) {
        return {
          success: false,
          error: `Square API Error: ${error.message}`,
          payment,
        };
      }
      
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      return {
        success: false,
        error: `Failed to get Square invoice status: ${errorMessage}`,
        payment,
      };
    }

    return {
      success: false,
      error: 'Failed to get Square invoice status',
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

    if (result.data?.square_invoice_id) {
      try {
        // Cancel the invoice in Square
        const cancelResponse = await invoicesApi.cancel({
          invoiceId: result.data.square_invoice_id,
          version: result.data.metadata?.square_version as number || 0,
        } as any);

        return {
          success: true,
          invoice: {
            id: result.data.square_invoice_id,
            status: 'CANCELED',
          },
          payment: result.data,
        };
      } catch (error) {
        console.error('Error canceling Square invoice:', error);
        
        if (error instanceof SquareError) {
          return {
            success: false,
            error: `Square API Error: ${error.message}`,
            payment: result.data,
          };
        }
        
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        console.warn(`Failed to cancel Square invoice: ${errorMessage}`);
      }
    }

    return {
      success: true, // Still successful locally even if Square fails
      invoice: {
        id: result.data?.square_invoice_id || '',
        status: 'CANCELED',
      },
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
