/**
 * Payment Service
 * Handles all payment and invoice operations using the new Payment table structure
 */

import { 
  Order, 
  Payment, 
  PaymentLineItem, 
  PaymentStatus,
  PaymentMethod,
  PaymentType,
  OrderService,
  FullOrder
} from '@/types/database';
import { createServerSupabaseClient } from '@/lib/supabase-server';
import { supabase } from '@/lib/supabase';

// =============================================================================
// INTERFACES
// =============================================================================

export interface CreatePaymentRequest {
  order_id: string;
  type: PaymentType;
  method: PaymentMethod;
  subtotal_amount: number;
  tax_amount?: number;
  description?: string;
  due_date?: string;
  delivery_method?: 'EMAIL' | 'SMS' | 'MANUAL';
  customer_email?: string;
  customer_phone?: string;
  metadata?: Record<string, any>;
  line_items?: CreateLineItemRequest[];
}

export interface CreateLineItemRequest {
  name: string;
  description?: string;
  quantity: number;
  unit_price: number; // In dollars (will be converted to cents)
  tax_rate?: number;
  category?: string;
  sku?: string;
  metadata?: Record<string, any>;
}

export interface PaymentResponse {
  success: boolean;
  data?: Payment;
  error?: string;
}

export interface PaymentWithLineItems extends Payment {
  line_items: PaymentLineItem[];
  order: Order;
}

export interface PaymentFilters {
  status?: PaymentStatus[];
  method?: PaymentMethod[];
  type?: PaymentType[];
  order_id?: string;
  date_from?: string;
  date_to?: string;
  amount_min?: number;
  amount_max?: number;
  search?: string;
}

export interface UpdatePaymentRequest {
  status?: PaymentStatus;
  paid_amount?: number;
  notes?: string;
  due_date?: string;
  square_invoice_id?: string;
  square_payment_id?: string;
  invoice_url?: string;
  public_payment_url?: string;
  metadata?: Record<string, any>;
}

export interface PaymentListResponse {
  success: boolean;
  payments: Payment[];
  total: number;
  page: number;
  limit: number;
  has_more: boolean;
  error?: string;
}

export interface PaymentTransaction {
  id: string;
  payment_id: string;
  type: 'CHARGE' | 'REFUND' | 'ADJUSTMENT' | 'FEE';
  amount: number;
  currency: string;
  status: string;
  external_transaction_id?: string;
  processed_at: string;
  metadata?: Record<string, any>;
}

// =============================================================================
// PAYMENT CREATION
// =============================================================================

/**
 * Creates a payment automatically from order services
 */
export async function createPaymentFromOrderServices(
  orderId: string,
  paymentMethod: PaymentMethod = 'SQUARE_INVOICE',
  paymentType: PaymentType = 'INVOICE'
): Promise<PaymentResponse> {
  try {
    // Use server-side Supabase client for proper authentication
    const supabase = createServerSupabaseClient();
    
    // Get the order with all its services (using same pattern as UI)
    const { data: orderServices, error: servicesError } = await supabase
      .from('order_services')
      .select(`
        *,
        services!inner (
          *,
          category:service_categories (*)
        )
      `)
      .eq('order_id', orderId);

    if (servicesError) {
      console.error('Error fetching order services:', servicesError);
      return { success: false, error: `Failed to fetch order services: ${servicesError.message}` };
    }

    console.log(`Found ${orderServices?.length || 0} services for order ${orderId}:`, orderServices);

    if (!orderServices || orderServices.length === 0) {
      return { 
        success: false, 
        error: 'No services found in order_services table. Orders must have services configured to create invoices.' 
      };
    }

    // Get order details (using same supabase instance)
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select('*')
      .eq('id', orderId)
      .single();

    if (orderError || !order) {
      return { success: false, error: 'Order not found' };
    }

    // Calculate totals
    let subtotalCents = 0;
    let taxCents = 0;

    const lineItems: CreateLineItemRequest[] = orderServices.map((orderService: any) => {
      const itemSubtotal = orderService.total_price;
      const itemTax = orderService.services.is_taxable 
        ? Math.round(itemSubtotal * (orderService.services.tax_rate || 0))
        : 0;

      subtotalCents += Math.round(itemSubtotal * 100);
      taxCents += itemTax;

      return {
        name: orderService.services.display_name,
        description: `${orderService.services.display_name} - Order ${order.order_number}`,
        quantity: orderService.quantity,
        unit_price: orderService.unit_price,
        tax_rate: orderService.services.tax_rate,
        category: orderService.services.category?.name,
        sku: orderService.services.sku,
        metadata: {
          order_service_id: orderService.id,
          service_id: orderService.service_id,
          service_date: orderService.service_date
        }
      };
    });

    const paymentRequest: CreatePaymentRequest = {
      order_id: orderId,
      type: paymentType,
      method: paymentMethod,
      subtotal_amount: subtotalCents / 100,
      tax_amount: taxCents / 100,
      description: `Invoice for Order ${order.order_number}`,
      customer_email: order.email,
      customer_phone: order.phone,
      delivery_method: 'EMAIL',
      line_items: lineItems,
      metadata: {
        order_number: order.order_number,
        service_count: orderServices.length,
        created_from: 'order_services'
      }
    };

    return await createPayment(paymentRequest);
  } catch (error) {
    console.error('Error creating payment from order services:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to create payment' 
    };
  }
}

/**
 * Create a new payment record with line items
 */
export async function createPayment(request: CreatePaymentRequest): Promise<PaymentResponse> {
  try {
    // Use server-side Supabase client
    const supabase = createServerSupabaseClient();
    
    // Convert amounts to cents for storage
    const subtotalCents = Math.round(request.subtotal_amount * 100);
    const taxCents = Math.round((request.tax_amount || 0) * 100);
    const totalCents = subtotalCents + taxCents;
    
    const paymentData = {
      order_id: request.order_id,
      type: request.type,
      method: request.method,
      subtotal_amount: subtotalCents,
      tax_amount: taxCents,
      total_amount: totalCents,
      description: request.description,
      due_date: request.due_date,
      delivery_method: request.delivery_method,
      customer_email: request.customer_email,
      customer_phone: request.customer_phone,
      metadata: request.metadata,
      status: 'DRAFT' as PaymentStatus,
    };
    
    // Create the payment record
    const { data: payment, error: paymentError } = await supabase
      .from('payments')
      .insert(paymentData)
      .select()
      .single();

    if (paymentError) {
      return { success: false, error: `Failed to create payment: ${paymentError.message}` };
    }

    // Create line items if provided
    if (request.line_items && request.line_items.length > 0) {
      const lineItemsData = request.line_items.map(item => ({
        payment_id: payment.id,
        name: item.name,
        description: item.description,
        quantity: item.quantity,
        unit_price: Math.round(item.unit_price * 100), // Convert to cents
        total_price: Math.round(item.quantity * item.unit_price * 100),
        tax_rate: item.tax_rate,
        tax_amount: item.tax_rate ? Math.round(item.quantity * item.unit_price * item.tax_rate * 100) : null,
        category: item.category,
        sku: item.sku,
        metadata: item.metadata
      }));

      const { error: lineItemsError } = await supabase
        .from('payment_line_items')
        .insert(lineItemsData);

      if (lineItemsError) {
        // Payment was created but line items failed - should we rollback?
        console.error('Failed to create line items:', lineItemsError);
        return { success: false, error: `Payment created but line items failed: ${lineItemsError.message}` };
      }
    }

    return { success: true, data: payment };
  } catch (error) {
    console.error('Error creating payment:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to create payment' 
    };
  }
}

/**
 * Get payment by ID with related data
 */
export async function getPayment(paymentId: string): Promise<PaymentResponse> {
  try {
    const supabase = createServerSupabaseClient();
    
    const { data: payment, error } = await supabase
      .from('payments')
      .select(`
        *,
        payment_line_items (*),
        payment_transactions (*),
        payment_reminders (*)
      `)
      .eq('id', paymentId)
      .single();
    
    if (error) {
      console.error('Error fetching payment:', error);
      return { success: false, error: error.message };
    }
    
    return { success: true, data: payment };
  } catch (error) {
    console.error('Error in getPayment:', error);
    return { success: false, error: 'Failed to fetch payment' };
  }
}

/**
 * Get payment by Square invoice ID
 */
export async function getPaymentBySquareInvoiceId(squareInvoiceId: string): Promise<PaymentResponse> {
  try {
    const supabase = createServerSupabaseClient();
    
    const { data: payment, error } = await supabase
      .from('payments')
      .select(`
        *,
        payment_line_items (*),
        payment_transactions (*)
      `)
      .eq('square_invoice_id', squareInvoiceId)
      .single();
    
    if (error) {
      console.error('Error fetching payment by Square invoice ID:', error);
      return { success: false, error: error.message };
    }
    
    return { success: true, data: payment };
  } catch (error) {
    console.error('Error in getPaymentBySquareInvoiceId:', error);
    return { success: false, error: 'Failed to fetch payment' };
  }
}

/**
 * Update payment record
 */
export async function updatePayment(paymentId: string, updates: UpdatePaymentRequest): Promise<PaymentResponse> {
  try {
    const supabase = createServerSupabaseClient();
    
    // Convert paid_amount to cents if provided
    const updateData: any = { ...updates };
    if (updates.paid_amount !== undefined) {
      updateData.paid_amount = Math.round(updates.paid_amount * 100);
    }
    
    const { data: payment, error } = await supabase
      .from('payments')
      .update(updateData)
      .eq('id', paymentId)
      .select('*')
      .single();
    
    if (error) {
      console.error('Error updating payment:', error);
      return { success: false, error: error.message };
    }
    
    return { success: true, data: payment };
  } catch (error) {
    console.error('Error in updatePayment:', error);
    return { success: false, error: 'Failed to update payment' };
  }
}

/**
 * List payments with filtering and pagination
 */
export async function listPayments(
  filters: PaymentFilters = {},
  page = 1,
  limit = 20
): Promise<PaymentListResponse> {
  try {
    const supabase = createServerSupabaseClient();
    const offset = (page - 1) * limit;
    
    let query = supabase
      .from('payments') // Use the table directly to get all fields
      .select(`
        *,
        orders!inner(
          order_number,
          first_name,
          last_name,
          email
        )
      `, { count: 'exact' });
    
    // Apply filters
    if (filters.order_id) {
      query = query.eq('order_id', filters.order_id);
    }
    
    if (filters.status && filters.status.length > 0) {
      query = query.in('status', filters.status);
    }
    
    if (filters.method && filters.method.length > 0) {
      query = query.in('method', filters.method);
    }
    
    if (filters.type && filters.type.length > 0) {
      query = query.in('type', filters.type);
    }
    
    if (filters.date_from) {
      query = query.gte('created_at', filters.date_from);
    }
    
    if (filters.date_to) {
      query = query.lte('created_at', filters.date_to);
    }
    
    if (filters.amount_min !== undefined) {
      query = query.gte('total_amount', Math.round(filters.amount_min * 100));
    }
    
    if (filters.amount_max !== undefined) {
      query = query.lte('total_amount', Math.round(filters.amount_max * 100));
    }
    
    if (filters.search) {
      query = query.or(`payment_number.ilike.%${filters.search}%,orders.email.ilike.%${filters.search}%,orders.first_name.ilike.%${filters.search}%,orders.last_name.ilike.%${filters.search}%`);
    }
    
    const { data: payments, error, count } = await query
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);
    
    if (error) {
      console.error('Error listing payments:', error);
      return { 
        success: false, 
        error: error.message,
        payments: [],
        total: 0,
        page,
        limit,
        has_more: false
      };
    }
    
    const total = count || 0;
    const hasMore = offset + limit < total;
    
    // Transform the data to match the expected structure
    const transformedPayments = (payments || []).map(payment => ({
      ...payment,
      // Flatten order data
      order_number: payment.orders?.order_number,
      first_name: payment.orders?.first_name,
      last_name: payment.orders?.last_name,
      email: payment.orders?.email,
      // Add computed fields
      balance_due: payment.total_amount - payment.paid_amount,
      is_overdue: payment.due_date && new Date(payment.due_date) < new Date() && !['PAID', 'CANCELED'].includes(payment.status),
      // Remove the nested orders object
      orders: undefined
    }));
    
    return { 
      success: true, 
      payments: transformedPayments,
      total,
      page,
      limit,
      has_more: hasMore
    };
  } catch (error) {
    console.error('Error in listPayments:', error);
    return { 
      success: false, 
      error: 'Failed to list payments',
      payments: [],
      total: 0,
      page,
      limit,
      has_more: false
    };
  }
}

/**
 * Get payments for a specific order
 */
export async function getOrderPayments(orderId: string): Promise<PaymentListResponse> {
  return listPayments({ order_id: orderId });
}

/**
 * Create payment from order using multi-service approach
 */
export async function createPaymentFromOrder(
  order: Order,
  method: PaymentMethod = 'SQUARE_INVOICE',
  dueDate?: Date
): Promise<PaymentResponse> {
  try {
    // Only use the multi-service approach - no legacy fallback
    const serviceResult = await createPaymentFromOrderServices(order.id, method, 'INVOICE');
    
    if (serviceResult.success) {
      return serviceResult;
    }
    
    // If no services found, return a clear error
    return {
      success: false,
      error: `Order ${order.order_number} has no services configured. All orders must have services in the order_services table to create invoices.`
    };
  } catch (error) {
    console.error('Error creating payment from order:', error);
    return { 
      success: false, 
      error: `Failed to create payment for order ${order.order_number}. Please ensure the order has services configured.`
    };
  }
}

/**
 * Record a payment transaction
 */
export async function recordPaymentTransaction(
  paymentId: string,
  type: 'CHARGE' | 'REFUND' | 'ADJUSTMENT' | 'FEE',
  amount: number,
  externalTransactionId?: string,
  metadata?: Record<string, any>
): Promise<{ success: boolean; transaction?: PaymentTransaction; error?: string }> {
  try {
    const supabase = createServerSupabaseClient();
    
    const transactionData = {
      payment_id: paymentId,
      type,
      amount: Math.round(amount * 100), // Convert to cents
      currency: 'USD',
      external_transaction_id: externalTransactionId,
      status: 'COMPLETED' as const,
      processed_at: new Date().toISOString(),
      metadata,
    };
    
    const { data: transaction, error } = await supabase
      .from('payment_transactions')
      .insert(transactionData)
      .select('*')
      .single();
    
    if (error) {
      console.error('Error recording payment transaction:', error);
      return { success: false, error: error.message };
    }
    
    // Update payment paid_amount if this is a charge
    if (type === 'CHARGE') {
      const { data: payment } = await supabase
        .from('payments')
        .select('paid_amount')
        .eq('id', paymentId)
        .single();
      
      if (payment) {
        const newPaidAmount = payment.paid_amount + Math.round(amount * 100);
        await updatePayment(paymentId, {
          paid_amount: newPaidAmount / 100, // Convert back to dollars
        });
      }
    }
    
    return { success: true, transaction };
  } catch (error) {
    console.error('Error in recordPaymentTransaction:', error);
    return { success: false, error: 'Failed to record payment transaction' };
  }
}

/**
 * Cancel payment
 */
export async function cancelPayment(paymentId: string, reason?: string): Promise<PaymentResponse> {
  try {
    const result = await updatePayment(paymentId, {
      status: 'CANCELED',
      notes: reason ? `Canceled: ${reason}` : 'Payment canceled',
    });
    
    if (result.success) {
      const supabase = createServerSupabaseClient();
      await supabase
        .from('payments')
        .update({ canceled_at: new Date().toISOString() })
        .eq('id', paymentId);
    }
    
    return result;
  } catch (error) {
    console.error('Error in cancelPayment:', error);
    return { success: false, error: 'Failed to cancel payment' };
  }
}

/**
 * Delete a payment and its line items
 */
export async function deletePayment(
  paymentId: string
): Promise<PaymentResponse> {
  try {
    const supabase = createServerSupabaseClient();
    
    // First check if payment exists and is in a deletable state
    const { data: payment, error: fetchError } = await supabase
      .from('payments')
      .select('*')
      .eq('id', paymentId)
      .single();

    if (fetchError || !payment) {
      return { success: false, error: 'Payment not found' };
    }

    // Only allow deletion of canceled or failed payments
    if (!['CANCELED', 'FAILED'].includes(payment.status)) {
      return { 
        success: false, 
        error: `Cannot delete payment with status ${payment.status}. Only canceled or failed payments can be deleted.` 
      };
    }

    // Delete payment line items first (due to foreign key constraint)
    const { error: lineItemsError } = await supabase
      .from('payment_line_items')
      .delete()
      .eq('payment_id', paymentId);

    if (lineItemsError) {
      console.error('Error deleting payment line items:', lineItemsError);
      // Continue with payment deletion even if line items fail
    }

    // Delete the payment
    const { error: deleteError } = await supabase
      .from('payments')
      .delete()
      .eq('id', paymentId);

    if (deleteError) {
      return { success: false, error: `Failed to delete payment: ${deleteError.message}` };
    }

    return { success: true, data: payment };
  } catch (error) {
    console.error('Error deleting payment:', error);
    return { success: false, error: 'Failed to delete payment' };
  }
}

/**
 * Mark payment as sent
 */
export async function markPaymentAsSent(
  paymentId: string,
  publicUrl?: string
): Promise<PaymentResponse> {
  try {
    const updateData: any = {
      status: 'SENT',
    };
    
    if (publicUrl) {
      updateData.public_payment_url = publicUrl;
    }
    
    const result = await updatePayment(paymentId, updateData);
    
    if (result.success) {
      const supabase = createServerSupabaseClient();
      await supabase
        .from('payments')
        .update({ sent_at: new Date().toISOString() })
        .eq('id', paymentId);
    }
    
    return result;
  } catch (error) {
    console.error('Error in markPaymentAsSent:', error);
    return { success: false, error: 'Failed to mark payment as sent' };
  }
}

/**
 * Mark payment as viewed
 */
export async function markPaymentAsViewed(paymentId: string): Promise<PaymentResponse> {
  try {
    const result = await updatePayment(paymentId, {
      status: 'VIEWED',
    });
    
    if (result.success) {
      const supabase = createServerSupabaseClient();
      await supabase
        .from('payments')
        .update({ viewed_at: new Date().toISOString() })
        .eq('id', paymentId);
    }
    
    return result;
  } catch (error) {
    console.error('Error in markPaymentAsViewed:', error);
    return { success: false, error: 'Failed to mark payment as viewed' };
  }
}

/**
 * Update Square-specific fields
 */
export async function updateSquarePaymentData(
  paymentId: string,
  squareData: {
    square_invoice_id?: string;
    square_payment_id?: string;
    square_customer_id?: string;
    square_location_id?: string;
    invoice_url?: string;
    public_payment_url?: string;
  }
): Promise<PaymentResponse> {
  try {
    const supabase = createServerSupabaseClient();
    
    const { data: payment, error } = await supabase
      .from('payments')
      .update(squareData)
      .eq('id', paymentId)
      .select('*')
      .single();
    
    if (error) {
      console.error('Error updating Square payment data:', error);
      return { success: false, error: error.message };
    }
    
    return { success: true, data: payment };
  } catch (error) {
    console.error('Error in updateSquarePaymentData:', error);
    return { success: false, error: 'Failed to update Square payment data' };
  }
}

/**
 * Log webhook event for payment
 */
export async function logPaymentWebhookEvent(
  eventType: string,
  eventId: string,
  source: 'SQUARE' | 'STRIPE' | 'PAYPAL' | 'OTHER',
  payload: Record<string, any>,
  paymentId?: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = createServerSupabaseClient();
    
    const webhookData = {
      payment_id: paymentId,
      event_type: eventType,
      event_id: eventId,
      source,
      raw_payload: payload,
      status: 'PENDING' as const,
    };
    
    const { error } = await supabase
      .from('payment_webhook_events')
      .insert(webhookData);
    
    if (error) {
      console.error('Error logging webhook event:', error);
      return { success: false, error: error.message };
    }
    
    return { success: true };
  } catch (error) {
    console.error('Error in logPaymentWebhookEvent:', error);
    return { success: false, error: 'Failed to log webhook event' };
  }
}

/**
 * Convert cents to dollars for display
 */
export function centsToDollars(cents: number): number {
  return cents / 100;
}

/**
 * Convert dollars to cents for storage
 */
export function dollarsToCents(dollars: number): number {
  return Math.round(dollars * 100);
}

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

/**
 * Format payment amount for display
 */
export function formatPaymentAmount(amountInCents: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD'
  }).format(amountInCents / 100);
}

/**
 * Get payment status information for UI display
 */
export function getPaymentStatusInfo(status: PaymentStatus): {
  label: string;
  color: string;
  description: string;
} {
  switch (status) {
    case 'DRAFT':
      return {
        label: 'Draft',
        color: 'gray',
        description: 'Payment is being prepared'
      };
    case 'SENT':
      return {
        label: 'Sent',
        color: 'blue',
        description: 'Payment sent to customer'
      };
    case 'VIEWED':
      return {
        label: 'Viewed',
        color: 'yellow',
        description: 'Customer has viewed the payment'
      };
    case 'PAID':
      return {
        label: 'Paid',
        color: 'green',
        description: 'Payment completed successfully'
      };
    case 'PARTIALLY_PAID':
      return {
        label: 'Partially Paid',
        color: 'orange',
        description: 'Payment partially completed'
      };
    case 'OVERDUE':
      return {
        label: 'Overdue',
        color: 'red',
        description: 'Payment is past due date'
      };
    case 'CANCELED':
      return {
        label: 'Canceled',
        color: 'red',
        description: 'Payment has been canceled'
      };
    case 'REFUNDED':
      return {
        label: 'Refunded',
        color: 'purple',
        description: 'Payment has been refunded'
      };
    case 'FAILED':
      return {
        label: 'Failed',
        color: 'red',
        description: 'Payment processing failed'
      };
    default:
      return {
        label: 'Unknown',
        color: 'gray',
        description: 'Unknown payment status'
      };
  }
}

/**
 * Calculate payment balance due
 */
export function calculateBalanceDue(totalAmount: number, paidAmount: number = 0): number {
  return Math.max(0, totalAmount - paidAmount);
}

/**
 * Check if payment is overdue
 */
export function isPaymentOverdue(dueDate: string | null, status: PaymentStatus): boolean {
  if (!dueDate || ['PAID', 'CANCELED', 'REFUNDED'].includes(status)) {
    return false;
  }
  return new Date(dueDate) < new Date();
}

/**
 * Get payment method display info
 */
export function getPaymentMethodInfo(method: PaymentMethod): {
  label: string;
  icon: string;
  description: string;
} {
  switch (method) {
    case 'SQUARE_INVOICE':
      return {
        label: 'Square Invoice',
        icon: 'credit-card',
        description: 'Square Invoice payment'
      };
    case 'SQUARE_POS':
      return {
        label: 'Square POS',
        icon: 'credit-card',
        description: 'Square POS payment'
      };
    case 'CASH':
      return {
        label: 'Cash',
        icon: 'dollar-sign',
        description: 'Cash payment'
      };
    case 'CHECK':
      return {
        label: 'Check',
        icon: 'file-text',
        description: 'Check payment'
      };
    case 'BANK_TRANSFER':
      return {
        label: 'Bank Transfer',
        icon: 'building',
        description: 'Bank transfer payment'
      };
    case 'OTHER':
      return {
        label: 'Other',
        icon: 'more-horizontal',
        description: 'Other payment method'
      };
    default:
      return {
        label: 'Unknown',
        icon: 'help-circle',
        description: 'Unknown payment method'
      };
  }
}