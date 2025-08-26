/**
 * Payment Service
 * Handles all payment and invoice operations using the new Payment table structure
 */

import { Order } from '@/types/order';
import { 
  Payment, 
  PaymentTransaction, 
  PaymentLineItem,
  CreatePaymentRequest,
  UpdatePaymentRequest,
  PaymentResponse,
  PaymentListResponse,
  PaymentFilters,
  PaymentStatus,
  PaymentMethod,
  PaymentType 
} from '@/types/payment';
import { createServerSupabaseClient } from '@/lib/supabase-server';

/**
 * Create a new payment record
 */
export async function createPayment(request: CreatePaymentRequest): Promise<PaymentResponse> {
  try {
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
      metadata: request.metadata,
      status: 'DRAFT' as PaymentStatus,
    };
    
    const { data: payment, error } = await supabase
      .from('payments')
      .insert(paymentData)
      .select('*')
      .single();
    
    if (error) {
      console.error('Error creating payment:', error);
      return { success: false, error: error.message };
    }
    
    // Create line items if provided
    if (request.line_items && request.line_items.length > 0) {
      const lineItemsData = request.line_items.map(item => ({
        payment_id: payment.id,
        name: item.name,
        description: item.description,
        quantity: item.quantity,
        unit_price: Math.round(item.unit_price * 100), // Convert to cents
        total_price: Math.round(item.unit_price * item.quantity * 100),
        tax_rate: item.tax_rate,
        category: item.category,
        sku: item.sku,
        metadata: item.metadata,
      }));
      
      const { error: lineItemsError } = await supabase
        .from('payment_line_items')
        .insert(lineItemsData);
        
      if (lineItemsError) {
        console.error('Error creating line items:', lineItemsError);
      }
    }
    
    return { success: true, payment };
  } catch (error) {
    console.error('Error in createPayment:', error);
    return { success: false, error: 'Failed to create payment' };
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
    
    return { success: true, payment };
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
    
    return { success: true, payment };
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
    
    return { success: true, payment };
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
 * Create payment from order (for Square invoice integration)
 */
export async function createPaymentFromOrder(
  order: Order,
  method: PaymentMethod = PaymentMethod.SQUARE_INVOICE,
  dueDate?: Date
): Promise<PaymentResponse> {
  try {
    const subtotal = order.final_price || order.quoted_price || 0;
    const taxRate = 0.08; // 8% tax rate
    const taxAmount = subtotal * taxRate;
    
    const paymentRequest: CreatePaymentRequest = {
      order_id: order.id,
      type: PaymentType.INVOICE,
      method: method,
      subtotal_amount: subtotal,
      tax_amount: taxAmount,
      description: `Invoice for Order ${order.order_number} - ${order.dumpster_size || 'Standard'} Yard Dumpster`,
      due_date: dueDate?.toISOString(),
      delivery_method: 'EMAIL',
      line_items: [
        {
          name: `Dumpster Rental - ${order.dumpster_size || 'Standard'} Yard`,
          description: `Delivery to ${order.address}`,
          quantity: 1,
          unit_price: subtotal,
          total_price: subtotal,
          category: 'Dumpster Rental',
        }
      ],
      metadata: {
        order_number: order.order_number,
        customer_name: `${order.first_name} ${order.last_name || ''}`.trim(),
        delivery_address: order.address,
        scheduled_delivery: order.scheduled_delivery_date,
        scheduled_pickup: order.scheduled_pickup_date,
      }
    };
    
    const result = await createPayment(paymentRequest);
    
    if (result.success && result.payment) {
      // Update payment with customer information
      await updatePayment(result.payment.id, {
        status: PaymentStatus.DRAFT,
        metadata: {
          ...result.payment.metadata,
          customer_email: order.email,
          customer_phone: order.phone?.toString(),
        }
      });
    }
    
    return result;
  } catch (error) {
    console.error('Error creating payment from order:', error);
    return { success: false, error: 'Failed to create payment from order' };
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
      status: PaymentStatus.CANCELED,
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
 * Mark payment as sent
 */
export async function markPaymentAsSent(
  paymentId: string,
  publicUrl?: string
): Promise<PaymentResponse> {
  try {
    const updateData: any = {
      status: PaymentStatus.SENT,
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
      status: PaymentStatus.VIEWED,
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
    
    return { success: true, payment };
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