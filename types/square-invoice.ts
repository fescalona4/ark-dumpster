/**
 * Square Invoice type definitions
 * These types extend the Square API response types for our application
 */

export interface SquareInvoice {
  id: string;
  version?: number;
  locationId?: string;
  orderId?: string;
  primaryRecipient?: {
    customerId?: string;
    givenName?: string;
    familyName?: string;
    emailAddress?: string;
    phoneNumber?: string;
  };
  paymentRequests?: SquarePaymentRequest[];
  deliveryMethod?: 'EMAIL' | 'SMS' | 'SHARE_MANUALLY';
  invoiceNumber?: string;
  title?: string;
  description?: string;
  scheduledAt?: string;
  publicUrl?: string;
  nextPaymentAmountMoney?: {
    amount?: bigint;
    currency?: string;
  };
  status?: 'DRAFT' | 'SENT' | 'VIEWED' | 'PARTIALLY_PAID' | 'PAID' | 'PARTIALLY_REFUNDED' | 'REFUNDED' | 'CANCELED' | 'FAILED' | 'SCHEDULED';
  timezone?: string;
  createdAt?: string;
  updatedAt?: string;
  acceptedPaymentMethods?: {
    card?: boolean;
    squareGiftCard?: boolean;
    bankAccount?: boolean;
    buyNowPayLater?: boolean;
  };
  customFields?: SquareCustomField[];
  subscription?: {
    id?: string;
  };
  saleOrServiceDate?: string;
  paymentConditions?: string;
  storePaymentMethodEnabled?: boolean;
}

export interface SquarePaymentRequest {
  uid?: string;
  requestMethod?: 'EMAIL' | 'SMS' | 'AUTOMATIC' | 'SHARE_MANUALLY';
  requestType?: 'BALANCE' | 'DEPOSIT' | 'INSTALLMENT';
  dueDate?: string;
  fixedAmountRequestedMoney?: {
    amount?: bigint;
    currency?: string;
  };
  percentageRequested?: string;
  tippingEnabled?: boolean;
  automaticPaymentSource?: 'NONE' | 'CARD_ON_FILE' | 'BANK_ON_FILE';
  cardId?: string;
  reminders?: SquareInvoiceReminder[];
  computedAmountMoney?: {
    amount?: bigint;
    currency?: string;
  };
  totalCompletedAmountMoney?: {
    amount?: bigint;
    currency?: string;
  };
  roundingAdjustmentIncludedMoney?: {
    amount?: bigint;
    currency?: string;
  };
}

export interface SquareInvoiceReminder {
  uid?: string;
  relativeScheduledDays?: number;
  message?: string;
  status?: 'PENDING' | 'NOT_APPLICABLE' | 'SENT';
  sentAt?: string;
}

export interface SquareCustomField {
  label: string;
  value: string;
  placement?: 'ABOVE_LINE_ITEMS' | 'BELOW_LINE_ITEMS';
}

export interface SquareInvoiceRecipient {
  customerId?: string;
  givenName?: string;
  familyName?: string;
  emailAddress?: string;
  phoneNumber?: string;
  address?: {
    addressLine1?: string;
    addressLine2?: string;
    locality?: string;
    administrativeDistrictLevel1?: string;
    postalCode?: string;
    country?: string;
  };
}

export interface SquareInvoicePayment {
  id?: string;
  invoiceId?: string;
  paymentId?: string;
  note?: string;
  type?: 'PAYMENT' | 'REFUND';
  paymentDate?: string;
  paymentAmount?: {
    amount?: bigint;
    currency?: string;
  };
}

export interface SquareInvoiceEvent {
  id?: string;
  type?: 'INVOICE_CREATED' | 'INVOICE_SENT' | 'INVOICE_VIEWED' | 'INVOICE_PAYMENT_MADE' | 'INVOICE_CANCELED' | 'INVOICE_UPDATED' | 'INVOICE_DELETED';
  timestamp?: string;
  invoiceId?: string;
  eventData?: any;
}

// Extended Order type with Square fields
export interface OrderWithSquareInvoice {
  id: string;
  square_invoice_id?: string | null;
  square_customer_id?: string | null;
  square_payment_status?: 'DRAFT' | 'SENT' | 'VIEWED' | 'PARTIALLY_PAID' | 'PAID' | 'CANCELED' | null;
  payment_link?: string | null;
  invoice_sent_at?: string | null;
  invoice_viewed_at?: string | null;
  invoice_paid_at?: string | null;
  square_invoice_amount?: number | null;
  square_paid_amount?: number | null;
}

// API Response types
export interface CreateSquareInvoiceResponse {
  success: boolean;
  invoice?: SquareInvoice;
  error?: any;
  message?: string;
}

export interface SendSquareInvoiceResponse {
  success: boolean;
  invoice?: SquareInvoice;
  error?: any;
  message?: string;
}

export interface GetSquareInvoiceResponse {
  success: boolean;
  invoice?: SquareInvoice;
  error?: any;
  message?: string;
}

export interface ListSquareInvoicesResponse {
  success: boolean;
  invoices: SquareInvoice[];
  cursor?: string;
  error?: any;
  message?: string;
}

export interface CancelSquareInvoiceResponse {
  success: boolean;
  invoice?: SquareInvoice;
  error?: any;
  message?: string;
}

// Webhook payload types
export interface SquareWebhookPayload {
  merchant_id: string;
  type: string;
  event_id: string;
  created_at: string;
  data: {
    type: string;
    id: string;
    object?: {
      invoice?: SquareInvoice;
      payment?: SquareInvoicePayment;
    };
  };
}

// Square Invoice Status Enum for better type safety
export enum SquareInvoiceStatus {
  DRAFT = 'DRAFT',
  SENT = 'SENT',
  VIEWED = 'VIEWED',
  PARTIALLY_PAID = 'PARTIALLY_PAID',
  PAID = 'PAID',
  PARTIALLY_REFUNDED = 'PARTIALLY_REFUNDED',
  REFUNDED = 'REFUNDED',
  CANCELED = 'CANCELED',
  FAILED = 'FAILED',
  SCHEDULED = 'SCHEDULED',
}

// Helper type for converting between Order and Square Invoice
export interface OrderToSquareInvoiceMapping {
  orderId: string;
  customerId: string;
  invoiceNumber: string;
  lineItems: Array<{
    name: string;
    quantity: string;
    basePriceMoney: {
      amount: bigint;
      currency: string;
    };
    note?: string;
  }>;
  taxes?: Array<{
    name: string;
    percentage: string;
  }>;
  customFields?: SquareCustomField[];
}