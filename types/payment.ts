/**
 * Payment and Invoice Management Types
 * Centralized schema for handling all payment-related data
 */

// Payment status enum for type safety
export enum PaymentStatus {
  DRAFT = 'DRAFT',
  PENDING = 'PENDING',
  SENT = 'SENT',
  VIEWED = 'VIEWED',
  PARTIALLY_PAID = 'PARTIALLY_PAID',
  PAID = 'PAID',
  OVERDUE = 'OVERDUE',
  CANCELED = 'CANCELED',
  REFUNDED = 'REFUNDED',
  FAILED = 'FAILED',
}

// Payment method enum
export enum PaymentMethod {
  SQUARE_INVOICE = 'SQUARE_INVOICE',
  SQUARE_POS = 'SQUARE_POS',
  CASH = 'CASH',
  CHECK = 'CHECK',
  BANK_TRANSFER = 'BANK_TRANSFER',
  CREDIT_CARD = 'CREDIT_CARD',
  OTHER = 'OTHER',
}

// Payment type enum
export enum PaymentType {
  INVOICE = 'INVOICE',
  DEPOSIT = 'DEPOSIT',
  FULL_PAYMENT = 'FULL_PAYMENT',
  PARTIAL_PAYMENT = 'PARTIAL_PAYMENT',
  REFUND = 'REFUND',
  ADJUSTMENT = 'ADJUSTMENT',
}

// Main Payment table interface
export interface Payment {
  // Primary identifiers
  id: string;
  order_id: string;
  payment_number: string; // Human-readable payment identifier (e.g., PAY-001)
  
  // Payment details
  type: PaymentType;
  method: PaymentMethod;
  status: PaymentStatus;
  
  // Amount details (all in cents for precision)
  subtotal_amount: number;
  tax_amount: number;
  total_amount: number;
  paid_amount: number;
  refunded_amount: number;
  
  // Square-specific fields
  square_invoice_id?: string | null;
  square_payment_id?: string | null;
  square_customer_id?: string | null;
  square_location_id?: string | null;
  
  // Invoice details
  invoice_number?: string | null;
  invoice_url?: string | null;
  public_payment_url?: string | null;
  
  // Dates and timing
  created_at: string;
  updated_at: string;
  due_date?: string | null;
  sent_at?: string | null;
  viewed_at?: string | null;
  paid_at?: string | null;
  failed_at?: string | null;
  canceled_at?: string | null;
  
  // Customer communication
  customer_email?: string | null;
  customer_phone?: string | null;
  delivery_method?: 'EMAIL' | 'SMS' | 'MANUAL' | null;
  
  // Additional metadata
  description?: string | null;
  notes?: string | null;
  metadata?: Record<string, any> | null;
  
  // Webhook tracking
  last_webhook_event_id?: string | null;
  last_webhook_at?: string | null;
  
  // Failure tracking
  failure_reason?: string | null;
  failure_code?: string | null;
  retry_count?: number | null;
  
  // Audit fields
  created_by?: string | null;
  updated_by?: string | null;
}

// Payment transaction history
export interface PaymentTransaction {
  id: string;
  payment_id: string;
  
  // Transaction details
  type: 'CHARGE' | 'REFUND' | 'ADJUSTMENT' | 'FEE';
  amount: number; // In cents
  currency: string;
  
  // External references
  external_transaction_id?: string | null;
  external_reference?: string | null;
  
  // Status and timing
  status: 'PENDING' | 'COMPLETED' | 'FAILED' | 'CANCELED';
  processed_at?: string | null;
  failed_at?: string | null;
  
  // Metadata
  description?: string | null;
  metadata?: Record<string, any> | null;
  
  // Audit
  created_at: string;
  created_by?: string | null;
}

// Payment reminder tracking
export interface PaymentReminder {
  id: string;
  payment_id: string;
  
  // Reminder details
  type: 'INITIAL' | 'FOLLOW_UP' | 'FINAL_NOTICE' | 'OVERDUE';
  method: 'EMAIL' | 'SMS' | 'PHONE' | 'MAIL';
  
  // Scheduling
  scheduled_at: string;
  sent_at?: string | null;
  
  // Content
  subject?: string | null;
  message?: string | null;
  template_id?: string | null;
  
  // Status
  status: 'SCHEDULED' | 'SENT' | 'FAILED' | 'CANCELED';
  failure_reason?: string | null;
  
  // Tracking
  opened_at?: string | null;
  clicked_at?: string | null;
  
  // Audit
  created_at: string;
  updated_at: string;
}

// Payment line items for detailed invoicing
export interface PaymentLineItem {
  id: string;
  payment_id: string;
  
  // Item details
  name: string;
  description?: string | null;
  quantity: number;
  unit_price: number; // In cents
  total_price: number; // In cents
  
  // Tax information
  tax_rate?: number | null;
  tax_amount?: number | null;
  
  // Categorization
  category?: string | null;
  sku?: string | null;
  
  // Metadata
  metadata?: Record<string, any> | null;
  
  // Audit
  created_at: string;
  updated_at: string;
}

// Webhook event logging for payments
export interface PaymentWebhookEvent {
  id: string;
  payment_id?: string | null;
  
  // Event details
  event_type: string;
  event_id: string;
  source: 'SQUARE' | 'STRIPE' | 'PAYPAL' | 'OTHER';
  
  // Payload
  raw_payload: Record<string, any>;
  processed_payload?: Record<string, any> | null;
  
  // Processing status
  status: 'PENDING' | 'PROCESSED' | 'FAILED' | 'IGNORED';
  processed_at?: string | null;
  failure_reason?: string | null;
  retry_count?: number | null;
  
  // Audit
  created_at: string;
  updated_at: string;
}

// API response types
export interface CreatePaymentRequest {
  order_id: string;
  type: PaymentType;
  method: PaymentMethod;
  subtotal_amount: number;
  tax_amount?: number;
  description?: string;
  due_date?: string;
  delivery_method?: 'EMAIL' | 'SMS' | 'MANUAL';
  line_items?: Omit<PaymentLineItem, 'id' | 'payment_id' | 'created_at' | 'updated_at'>[];
  metadata?: Record<string, any>;
}

export interface UpdatePaymentRequest {
  status?: PaymentStatus;
  paid_amount?: number;
  due_date?: string;
  notes?: string;
  metadata?: Record<string, any>;
}

export interface PaymentResponse {
  success: boolean;
  payment?: Payment;
  error?: string;
  message?: string;
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

// Payment filters for queries
export interface PaymentFilters {
  order_id?: string;
  status?: PaymentStatus[];
  method?: PaymentMethod[];
  type?: PaymentType[];
  date_from?: string;
  date_to?: string;
  amount_min?: number;
  amount_max?: number;
  search?: string; // Search in payment_number, description, customer_email
}

// Payment summary/analytics
export interface PaymentSummary {
  total_payments: number;
  total_amount: number;
  paid_amount: number;
  pending_amount: number;
  overdue_amount: number;
  refunded_amount: number;
  
  by_status: Record<PaymentStatus, { count: number; amount: number }>;
  by_method: Record<PaymentMethod, { count: number; amount: number }>;
  by_type: Record<PaymentType, { count: number; amount: number }>;
  
  recent_payments: Payment[];
  overdue_payments: Payment[];
}

// Extended Order type with payment relationship
export interface OrderWithPayments {
  id: string;
  order_number: string;
  payments: Payment[];
  total_payment_amount: number;
  paid_amount: number;
  balance_due: number;
  payment_status: 'UNPAID' | 'PARTIALLY_PAID' | 'PAID' | 'OVERPAID';
}