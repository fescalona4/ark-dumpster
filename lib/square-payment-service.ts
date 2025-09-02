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
import { getOrderWithServices } from '@/lib/order-service';
import { supabase } from '@/lib/supabase';
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
  payment?: Payment | null;
}

export interface SquareInvoiceRequest {
  order: Order;
  dueDate?: Date;
  paymentRequestMethod?: 'EMAIL' | 'SMS' | 'SHARE_MANUALLY';
  message?: string;
  serviceDescriptions?: Record<string, string>; // Custom descriptions for services
  customFields?: Array<{
    label: string;
    value: string;
  }>;
  supabaseClient?: any; // Optional authenticated supabase client
}

/**
 * Create Square invoice and Payment record
 */
export async function createSquareInvoiceWithPayment(
  request: SquareInvoiceRequest
): Promise<SquareInvoiceResponse> {
  let payment: any = null;
  
  try {
    const { order, dueDate, supabaseClient } = request;
    
    // Use provided client or fall back to default
    const client = supabaseClient || supabase;

    console.log('Creating Square invoice with payment for order:', order.order_number);

    // Step 1: Create payment record
    const paymentResult = await createPaymentFromOrder(order, 'SQUARE_INVOICE', dueDate);

    if (!paymentResult.success || !paymentResult.data) {
      return {
        success: false,
        error: paymentResult.error || 'Failed to create payment record',
      };
    }

    payment = paymentResult.data;

    // Step 2: Create Square customer (required for invoice)
    let customerId: string;
    
    try {
      console.log('Creating Square customer for:', { 
        firstName: order.first_name, 
        lastName: order.last_name, 
        email: order.email,
        phone: order.phone,
        formattedPhone: 'will be formatted below'
      });

      // Format phone number for Square API - Square expects format: +1-555-123-4567
      let formattedPhone: string | undefined;
      if (order.phone) {
        const phoneStr = order.phone.toString().replace(/\D/g, ''); // Remove non-digits
        if (phoneStr.length === 10) {
          // Format as +1-XXX-XXX-XXXX
          formattedPhone = `+1-${phoneStr.slice(0, 3)}-${phoneStr.slice(3, 6)}-${phoneStr.slice(6)}`;
        } else if (phoneStr.length === 11 && phoneStr.startsWith('1')) {
          // Format as +1-XXX-XXX-XXXX  
          const cleaned = phoneStr.slice(1); // Remove leading 1
          formattedPhone = `+1-${cleaned.slice(0, 3)}-${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
        }
        // If phone doesn't match expected format, leave undefined
      }

      console.log('Formatted phone number:', { original: order.phone, formatted: formattedPhone });

      // Try different phone formats until one works
      const customerData: any = {
        givenName: order.first_name,
        familyName: order.last_name || undefined,
        emailAddress: order.email,
        note: `ARK Dumpster Order ${order.order_number}`,
      };

      // Try to add phone number, but continue without it if it fails validation
      let customerResponse;
      let phoneIncluded = false;
      
      if (formattedPhone && formattedPhone.replace(/\D/g, '').length >= 10) {
        // Convert to E.164 format: +1XXXXXXXXXX (no spaces, no hyphens)
        const digits = formattedPhone.replace(/\D/g, '');
        const e164Phone = digits.length === 10 ? `+1${digits}` : 
                         digits.length === 11 && digits.startsWith('1') ? `+${digits}` : 
                         formattedPhone;
        
        console.log('Attempting to create customer with phone:', e164Phone);
        
        try {
          // Try creating customer with phone number
          customerResponse = await customersApi.create({
            ...customerData,
            phoneNumber: e164Phone,
          });
          phoneIncluded = true;
          console.log('Customer created successfully with phone number');
        } catch (error) {
          console.warn('Failed to create customer with phone number, trying without:', error);
          // If phone number fails, try without it
          customerResponse = await customersApi.create(customerData);
          console.log('Customer created successfully without phone number');
        }
      } else {
        // No valid phone number, create customer without it
        console.log('Creating customer without phone number');
        customerResponse = await customersApi.create(customerData);
      }
      
      console.log('Customer creation response:', customerResponse);
      
      const customer = (customerResponse as any).result?.customer || (customerResponse as any).customer;
      customerId = customer?.id || '';
      
      if (!customerId) {
        throw new Error('No customer ID returned from Square customer creation');
      }
      
      console.log('Successfully created Square customer ID:', customerId);
    } catch (error) {
      console.error('Error creating Square customer:', error);
      
      // Clean up the payment record since we can't proceed without a customer
      try {
        await cancelPayment(payment.id, 'Customer creation failed');
      } catch (cleanupError) {
        console.error('Error cleaning up payment after customer creation failure:', cleanupError);
      }
      
      if (error instanceof SquareError) {
        return {
          success: false,
          error: `Square Customer API Error: Status code: ${error.statusCode}\nBody: ${JSON.stringify(error.body)}`,
        };
      }
      
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      return {
        success: false,
        error: `Failed to create Square customer: ${errorMessage}`,
      };
    }

    // Step 3: Fetch order with services to create itemized invoice
    console.log('Fetching order with services for order ID:', order.id);
    
    // Fetch services directly from order_services with join to services table
    const { data: orderServices, error: servicesError } = await client
      .from('order_services')
      .select(`
        *,
        service:services (
          id,
          name,
          display_name,
          description,
          base_price,
          tax_rate,
          is_taxable
        )
      `)
      .eq('order_id', order.id);
      
    console.log('Order services query result:', {
      data: orderServices,
      error: servicesError,
      orderServices: orderServices?.length || 0
    });
      
    if (servicesError) {
      console.error('Error fetching order services:', servicesError);
      throw new Error(`Failed to fetch order services: ${servicesError.message}`);
    }
    
    if (!orderServices || orderServices.length === 0) {
      console.error('No services found for order:', order.id);
      
      // Add additional debugging - check if services exist at all
      const { data: allOrderServices, error: debugError } = await client
        .from('order_services')
        .select('*')
        .eq('order_id', order.id);
      
      console.log('Debug - Raw order services:', {
        data: allOrderServices,
        error: debugError,
        count: allOrderServices?.length || 0
      });
      
      throw new Error('No services found for this order');
    }
    
    console.log(`Found ${orderServices.length} services for order ${order.order_number}:`, orderServices.map((s: any) => s.service?.display_name || s.service?.name));

    // Step 4: Create Square Order with itemized line items
    let squareOrderId: string;
    
    try {
      console.log('Creating Square Order with itemized services...');
      
      // Separate positive and negative services
      const positiveServices = orderServices.filter((service: any) => service.unit_price >= 0);
      const negativeServices = orderServices.filter((service: any) => service.unit_price < 0);
      
      console.log(`Found ${positiveServices.length} regular services and ${negativeServices.length} discount services`);
      
      // Create line items only for positive services
      const lineItems = positiveServices.map((orderService: any, index: number) => {
        const serviceName = orderService.service?.display_name || orderService.service?.name || `Service ${index + 1}`;
        // Use custom description from request, then saved invoice_description, then service description or notes
        const serviceDescription = request.serviceDescriptions?.[orderService.id] || 
                                 orderService.invoice_description ||
                                 orderService.service?.description || 
                                 orderService.notes || '';
        
        const lineItem = {
          name: serviceName,
          note: serviceDescription,
          quantity: orderService.quantity.toString(),
          itemType: 'ITEM',
          basePriceMoney: {
            amount: BigInt(Math.round(orderService.unit_price * 100)),
            currency: 'USD',
          },
        };
        
        console.log(`Line item ${index + 1}:`, JSON.stringify(lineItem, (key, value) =>
          typeof value === 'bigint' ? value.toString() : value, 2));
        
        return lineItem;
      });
      
      // Create discounts from negative services
      const discounts = negativeServices.map((orderService: any, index: number) => {
        const discountName = orderService.service?.display_name || orderService.service?.name || `Discount ${index + 1}`;
        const discountDescription = request.serviceDescriptions?.[orderService.id] || 
                                   orderService.invoice_description ||
                                   orderService.service?.description || 
                                   orderService.notes || '';
        
        const discount = {
          name: discountName,
          type: 'FIXED_AMOUNT',
          amountMoney: {
            amount: BigInt(Math.abs(Math.round(orderService.unit_price * 100))), // Use absolute value
            currency: 'USD',
          },
          scope: 'ORDER',
        };
        
        console.log(`Discount ${index + 1}:`, JSON.stringify(discount, (key, value) =>
          typeof value === 'bigint' ? value.toString() : value, 2));
        
        return discount;
      });
      
      console.log(`Created ${lineItems.length} line items and ${discounts.length} discounts for Square order`);

      const orderData: any = {
        locationId: process.env.SQUARE_LOCATION_ID,
        lineItems,
      };
      
      // Add discounts if any exist
      if (discounts.length > 0) {
        orderData.discounts = discounts;
      }

      const orderRequest = {
        idempotencyKey: `order_${order.id}_${Date.now()}`,
        order: orderData,
      };

      console.log('Order request:', JSON.stringify(orderRequest, (key, value) =>
        typeof value === 'bigint' ? value.toString() : value, 2));

      const orderResponse = await squareClient.orders.create(orderRequest as any);
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

    // Step 5: Create Square invoice with the order ID
    try {
      console.log('Creating Square Invoice with order ID:', squareOrderId);
      
      const invoiceRequest = {
        idempotencyKey: `invoice_${order.id}_${Date.now()}`,
        invoice: {
          locationId: process.env.SQUARE_LOCATION_ID,
          orderId: squareOrderId,
          primaryRecipient: {
            customerId: customerId,
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
            cashAppPay: true,
          },
        },
      };

      const invoiceResponse = await invoicesApi.create(invoiceRequest as any);
      
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

        // Update order with Square invoice information for legacy compatibility
        const { createServerSupabaseClient } = await import('@/lib/supabase-server');
        const supabase = createServerSupabaseClient();
        await supabase
          .from('orders')
          .update({
            square_invoice_id: invoice.id,
            square_customer_id: customerId,
            square_payment_status: 'DRAFT',
            payment_link: invoice.publicUrl,
            square_invoice_amount: centsToDollars(payment.total_amount),
          })
          .eq('id', order.id);

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
      
      // Clean up the payment record since Square invoice creation failed
      try {
        await cancelPayment(payment.id, 'Square invoice creation failed');
      } catch (cleanupError) {
        console.error('Error cleaning up payment after Square invoice failure:', cleanupError);
      }
      
      if (error instanceof SquareError) {
        return {
          success: false,
          error: `Square API Error: ${error.message}`,
        };
      }
      
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      return {
        success: false,
        error: `Failed to create Square invoice: ${errorMessage}`,
      };
    }

    // Clean up the payment record since we reached here without success
    try {
      await cancelPayment(payment.id, 'Square invoice creation failed');
    } catch (cleanupError) {
      console.error('Error cleaning up payment after Square invoice failure:', cleanupError);
    }

    return {
      success: false,
      error: 'Unknown error creating Square invoice',
    };
  } catch (error) {
    console.error('Error creating Square invoice with payment:', error);
    
    // If we have a payment record, clean it up
    if (payment) {
      try {
        await cancelPayment(payment.id, 'Square invoice creation failed');
      } catch (cleanupError) {
        console.error('Error cleaning up payment after Square invoice failure:', cleanupError);
      }
    }
    
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
  paymentId: string,
  deliveryMethod: 'EMAIL' | 'SMS' | 'SHARE_MANUALLY' = 'EMAIL'
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
      const currentInvoice = await invoicesApi.get({ invoiceId: payment.square_invoice_id! });
      
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
      console.log(`Sending invoice via ${deliveryMethod} (invoice deliveryMethod: ${invoice.deliveryMethod})`);

      // Send the invoice via Square API with version and delivery method
      // Note: The invoice's deliveryMethod stays as created, but requestMethod overrides it for sending
      console.log('Publishing invoice with params:', {
        invoiceId: payment.square_invoice_id,
        version: invoice.version,
        requestMethod: deliveryMethod
      });
      
      const sendResponse = await invoicesApi.publish({
        invoiceId: payment.square_invoice_id,
        version: invoice.version,
        requestMethod: deliveryMethod as any,
      } as any);

      // Log the response to see what Square returned
      const responseForLogging = JSON.stringify(sendResponse, (key, value) =>
        typeof value === 'bigint' ? value.toString() : value, 2);
      console.log('Square publish response:', responseForLogging);

      if ((sendResponse as any).invoice) {
        // Mark payment as sent in our system
        const result = await markPaymentAsSent(paymentId, (sendResponse as any).invoice.publicUrl);

        // Update order record for legacy compatibility
        if (result.data?.order_id) {
          const { createServerSupabaseClient } = await import('@/lib/supabase-server');
          const supabase = createServerSupabaseClient();
          await supabase
            .from('orders')
            .update({
              square_payment_status: 'SENT',
              payment_link: (sendResponse as any).invoice.publicUrl,
              invoice_sent_at: new Date().toISOString(),
            })
            .eq('id', result.data.order_id);
        }

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

        // Update order record for legacy compatibility
        const { createServerSupabaseClient } = await import('@/lib/supabase-server');
        const supabase = createServerSupabaseClient();
        const orderUpdateData: any = {
          square_payment_status: paymentStatus,
          payment_link: invoice.publicUrl,
        };

        // Add timestamp fields based on status changes
        if (paymentStatus === 'SENT' && payment.status !== 'SENT') {
          orderUpdateData.invoice_sent_at = new Date().toISOString();
        }
        if (paymentStatus === 'VIEWED' && payment.status !== 'VIEWED') {
          orderUpdateData.invoice_viewed_at = new Date().toISOString();
        }
        if (paymentStatus === 'PAID' && payment.status !== 'PAID') {
          orderUpdateData.invoice_paid_at = new Date().toISOString();
        }

        await supabase
          .from('orders')
          .update(orderUpdateData)
          .eq('id', payment.order_id);

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

    // First, get the payment to access the Square invoice ID
    const paymentResult = await getPayment(paymentId);
    
    if (!paymentResult.success || !paymentResult.data) {
      return {
        success: false,
        error: 'Payment not found',
      };
    }

    const payment = paymentResult.data;
    let invoiceStatus: string | undefined;

    // If there's a Square invoice ID, try to cancel it first
    if (payment.square_invoice_id) {
      try {
        // First, get the current invoice to get the latest version and status
        const getInvoiceResponse = await invoicesApi.get({ invoiceId: payment.square_invoice_id });
        
        console.log('Full getInvoiceResponse:', JSON.stringify(getInvoiceResponse, (key, value) =>
          typeof value === 'bigint' ? value.toString() : value, 2));
        
        // Try different response structures
        const invoice = (getInvoiceResponse as any)?.result?.invoice || (getInvoiceResponse as any)?.invoice;
        const currentVersion = invoice?.version || 0;
        invoiceStatus = invoice?.status;
        
        console.log('Parsed invoice object:', JSON.stringify(invoice, (key, value) =>
          typeof value === 'bigint' ? value.toString() : value, 2));
        console.log('Using invoice version:', currentVersion);
        console.log('Invoice status:', invoiceStatus);
        
        // Use appropriate Square API method based on invoice status
        console.log('Invoice status check:', {
          invoiceStatus,
          isDraft: invoiceStatus === 'DRAFT',
          paymentId: payment.id,
          squareInvoiceId: payment.square_invoice_id
        });
        
        if (invoiceStatus === 'DRAFT') {
          // Draft invoices must be deleted
          console.log('Deleting draft invoice...');
          
          // Use the delete method that exists in the Square SDK
          const deleteResponse = await invoicesApi.delete({ 
            invoiceId: payment.square_invoice_id,
            version: currentVersion
          });
          
          console.log('Square draft invoice deleted successfully');
        } else {
          // Published invoices can be cancelled
          console.log('Cancelling published invoice with status:', invoiceStatus);
          console.log('Cancel request params:', {
            invoiceId: payment.square_invoice_id,
            version: currentVersion,
          });
          
          const cancelResponse = await invoicesApi.cancel({
            invoiceId: payment.square_invoice_id,
            version: currentVersion,
          } as any);
          
          console.log('Square invoice cancelled successfully');
        }
      } catch (error) {
        console.error('Error canceling Square invoice:', error);
        
        if (error instanceof SquareError) {
          // If invoice not found (404), treat as if it was already deleted
          if (error.statusCode === 404) {
            console.log('Square invoice not found (404), treating as already deleted');
            
            // Delete the payment record since the Square invoice doesn't exist
            const { deletePayment } = await import('@/lib/payment-service');
            const cancelResult = await cancelPayment(paymentId, reason);
            const deleteResult = await deletePayment(paymentId);
            
            return {
              success: true,
              invoice: {
                id: payment.square_invoice_id,
                status: 'DELETED',
              },
              payment: null, // Payment record was deleted
              message: 'Square invoice not found - payment record deleted',
            };
          }
          
          return {
            success: false,
            error: `Square API Error: ${error.message}`,
            payment,
          };
        }
        
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        return {
          success: false,
          error: `Failed to process Square invoice: ${errorMessage}`,
          payment,
        };
      }
    }

    // Handle payment record based on what we did with Square invoice
    if (payment.square_invoice_id && invoiceStatus === 'DRAFT') {
      // For DRAFT invoices that were deleted, remove the payment record entirely
      const { deletePayment } = await import('@/lib/payment-service');
      
      // First cancel it so it can be deleted
      const cancelResult = await cancelPayment(paymentId, reason);
      if (!cancelResult.success) {
        return {
          success: false,
          error: cancelResult.error || 'Failed to cancel payment before deletion',
        };
      }
      
      // Then delete the payment record since the invoice no longer exists
      const deleteResult = await deletePayment(paymentId);
      if (!deleteResult.success) {
        return {
          success: false,
          error: deleteResult.error || 'Failed to delete payment record',
        };
      }

      return {
        success: true,
        invoice: {
          id: payment.square_invoice_id,
          status: 'DELETED',
        },
        payment: null, // Payment record was deleted
        message: 'Draft invoice deleted successfully',
      };
    } else {
      // For published invoices or invoices without Square ID, just cancel the payment
      const result = await cancelPayment(paymentId, reason);

      if (!result.success) {
        return {
          success: false,
          error: result.error || 'Failed to cancel payment',
        };
      }

      return {
        success: true,
        invoice: {
          id: payment.square_invoice_id || '',
          status: 'CANCELED',
        },
        payment: result.data,
        message: 'Invoice cancelled successfully',
      };
    }
  } catch (error) {
    console.error('Error processing Square invoice:', error);
    return {
      success: false,
      error: 'Failed to process Square invoice',
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
