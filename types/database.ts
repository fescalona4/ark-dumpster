/**
 * Complete TypeScript definitions for the ARK Dumpster Rentals database schema
 * Generated based on Supabase tables and application requirements
 */

// =============================================================================
// ENUMS AND UNION TYPES
// =============================================================================

export type QuoteStatus = 'pending' | 'quoted' | 'accepted' | 'declined' | 'completed';
export type QuotePriority = 'low' | 'normal' | 'high' | 'urgent';

export type OrderStatus = 
  | 'confirmed' 
  | 'scheduled' 
  | 'on_way' 
  | 'in_progress'
  | 'delivered' 
  | 'on_way_pickup'
  | 'picked_up' 
  | 'completed' 
  | 'cancelled';

export type DumpsterStatus = 
  | 'available' 
  | 'in_use';

export type DumpsterCondition = 'excellent' | 'good' | 'fair' | 'needs_repair';

export type DumpsterSize = '10-yard' | '15-yard' | '20-yard' | '30-yard';

export type ServicePriceType = 'fixed' | 'hourly' | 'daily' | 'weekly' | 'custom';
export type ServiceStatus = 'pending' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled';
export type DumpsterAssignmentStatus = 'assigned' | 'delivered' | 'picked_up' | 'returned';
export type PaymentStatus = 'DRAFT' | 'PENDING' | 'SENT' | 'VIEWED' | 'PARTIALLY_PAID' | 'PAID' | 'OVERDUE' | 'CANCELED' | 'REFUNDED' | 'FAILED';
export type PaymentMethod = 'SQUARE_INVOICE' | 'SQUARE_POS' | 'CASH' | 'CHECK' | 'BANK_TRANSFER' | 'CREDIT_CARD' | 'OTHER';
export type PaymentType = 'INVOICE' | 'DEPOSIT' | 'FULL_PAYMENT' | 'PARTIAL_PAYMENT' | 'REFUND' | 'ADJUSTMENT';

export type TimeNeeded = '1-3 days' | '4-7 days' | '1-2 weeks' | '2+ weeks';

export type DeviceType = 'desktop' | 'mobile' | 'tablet' | 'unknown';

// =============================================================================
// CORE TABLE INTERFACES
// =============================================================================

/**
 * Quotes table - Customer quote requests
 */
export interface Quote {
  id: string;
  
  // Customer information
  first_name: string;
  last_name: string | null;
  email: string;
  phone: string | null;
  
  // Address information
  address: string | null;
  address2?: string | null;
  city: string | null;
  state: string | null;
  zip_code: string | null;
  
  // Service details
  dumpster_size: DumpsterSize | null;
  dropoff_date: string | null;
  time_needed: TimeNeeded | null;
  message: string | null;
  
  // Quote management
  status: QuoteStatus;
  priority: QuotePriority;
  quoted_price: number | null;
  quote_notes: string | null;
  assigned_to: string | null;
  
  // Timestamps
  created_at: string;
  updated_at: string;
  quoted_at: string | null;
}

/**
 * Service Categories table - Organizes different types of services
 */
export interface ServiceCategory {
  id: string;
  name: string;
  display_name: string;
  description: string | null;
  sort_order: number;
  is_active: boolean;
  icon_name: string | null;
  metadata: Record<string, any> | null;
  created_at: string;
  updated_at: string;
}

/**
 * Services table - Master catalog of all available services
 */
export interface Service {
  id: string;
  category_id: string;
  sku: string | null;
  name: string;
  display_name: string;
  description: string | null;
  
  // Pricing
  base_price: number;
  price_type: ServicePriceType;
  
  // Dumpster-specific fields
  dumpster_size: string | null;
  included_days: number | null;
  extra_day_price: number | null;
  included_weight_tons: number | null;
  extra_weight_price_per_ton: number | null;
  
  // Service settings
  is_active: boolean;
  requires_scheduling: boolean;
  max_quantity: number | null;
  is_taxable: boolean;
  tax_rate: number;
  sort_order: number;
  
  metadata: Record<string, any> | null;
  created_at: string;
  updated_at: string;
  
  // Relations
  category?: ServiceCategory;
}

/**
 * Order Services table - Links orders to multiple services
 */
export interface OrderService {
  id: string;
  order_id: string;
  service_id: string;
  
  // Service details
  quantity: number;
  unit_price: number;
  total_price: number;
  discount_amount: number;
  discount_reason: string | null;
  
  // Scheduling
  service_date: string | null;
  start_date: string | null;
  end_date: string | null;
  
  // Status and notes
  status: ServiceStatus;
  notes: string | null;
  driver_notes: string | null;
  metadata: Record<string, any> | null;
  
  // Timestamps
  created_at: string;
  updated_at: string;
  completed_at: string | null;
  
  // Relations
  service?: Service;
  order?: Order;
  dumpster_assignments?: OrderDumpster[];
}

/**
 * Order Dumpsters table - Tracks dumpster assignments to order services
 */
export interface OrderDumpster {
  id: string;
  order_service_id: string;
  dumpster_id: string;
  order_id: string;
  
  // Status and timing
  status: DumpsterAssignmentStatus;
  assigned_at: string;
  delivered_at: string | null;
  scheduled_pickup_date: string | null;
  actual_pickup_date: string | null;
  returned_at: string | null;
  
  // Location tracking
  delivery_address: string | null;
  delivery_gps_coordinates: string | null;
  pickup_address: string | null;
  pickup_gps_coordinates: string | null;
  
  // Weight and condition tracking
  empty_weight_tons: number | null;
  full_weight_tons: number | null;
  net_weight_tons: number | null;
  weight_ticket_number: string | null;
  delivery_condition: string | null;
  return_condition: string | null;
  damage_notes: string | null;
  
  // Photos and documentation
  delivery_photos: string[] | null;
  pickup_photos: string[] | null;
  delivery_notes: string | null;
  pickup_notes: string | null;
  
  // Timestamps
  created_at: string;
  updated_at: string;
  
  // Relations
  order_service?: OrderService;
  dumpster?: Dumpster;
  order?: Order;
}

/**
 * Orders table - Updated for multi-service support
 */
export interface Order {
  id: string;
  quote_id: string | null;
  
  // Customer information
  first_name: string;
  last_name: string | null;
  phone: string | null;
  email: string;
  
  // Address information
  address: string | null;
  address2: string | null;
  city: string | null;
  state: string | null;
  zip_code: string | null;
  
  // Order management
  order_number: string;
  status: OrderStatus;
  priority: QuotePriority;
  
  // Pricing
  quoted_price: number | null;
  final_price: number | null;
  
  // Assignment and tracking
  assigned_to: string | null;
  driver_notes: string | null;
  internal_notes: string | null;
  
  // Scheduling
  scheduled_delivery_date: string | null;
  scheduled_pickup_date: string | null;
  actual_delivery_date: string | null;
  actual_pickup_date: string | null;
  
  // Service summary (computed fields)
  service_count: number;
  total_service_amount: number;
  has_multiple_services: boolean;
  primary_service_type: string | null;
  services_summary: string | null;
  assigned_dumpsters: number;
  
  // Timestamps
  created_at: string;
  updated_at: string;
  completed_at: string | null;
  
  // Relations
  quote?: Quote;
  services?: OrderService[];
  dumpster_assignments?: OrderDumpster[];
  payments?: Payment[];
}

/**
 * Dumpsters table - Inventory management (updated)
 */
export interface Dumpster {
  id: string;
  
  // Basic information
  name: string;
  size: string | null;
  
  // Status and condition
  status: DumpsterStatus;
  condition: DumpsterCondition;
  
  // Location tracking
  address: string | null;
  last_known_location: string | null;
  gps_coordinates: string | null; // Point type stored as string
  
  // Assignment tracking (removed current_order_id - now tracked via order_dumpsters)
  assigned_to: string | null;
  order_number: string | null; // Legacy field
  
  // Maintenance
  notes: string | null;
  last_maintenance_at: string | null;
  
  // Timestamps
  created_at: string;
  updated_at: string;
  last_assigned_at: string | null;
  
  // Relations
  current_assignments?: OrderDumpster[];
  assignment_history?: OrderDumpster[];
}

/**
 * Payments table - Invoice and payment tracking
 */
export interface Payment {
  id: string;
  order_id: string;
  payment_number: string;
  
  // Payment details
  type: PaymentType;
  method: PaymentMethod;
  status: PaymentStatus;
  
  // Amounts (stored in cents)
  subtotal_amount: number;
  tax_amount: number;
  total_amount: number;
  paid_amount: number;
  refunded_amount: number;
  
  // Square integration
  square_invoice_id: string | null;
  square_payment_id: string | null;
  square_customer_id: string | null;
  square_location_id: string | null;
  
  // Invoice details
  invoice_number: string | null;
  invoice_url: string | null;
  public_payment_url: string | null;
  
  // Customer communication
  customer_email: string | null;
  customer_phone: string | null;
  delivery_method: 'EMAIL' | 'SMS' | 'MANUAL' | null;
  
  // Content
  description: string | null;
  notes: string | null;
  metadata: Record<string, any> | null;
  
  // Dates
  due_date: string | null;
  sent_at: string | null;
  viewed_at: string | null;
  paid_at: string | null;
  failed_at: string | null;
  canceled_at: string | null;
  
  // Webhook tracking
  last_webhook_event_id: string | null;
  last_webhook_at: string | null;
  
  // Failure tracking
  failure_reason: string | null;
  failure_code: string | null;
  retry_count: number;
  
  // Audit
  created_by: string | null;
  updated_by: string | null;
  created_at: string;
  updated_at: string;
  
  // Relations
  order?: Order;
  line_items?: PaymentLineItem[];
}

/**
 * Payment Line Items table - Detailed invoice line items
 */
export interface PaymentLineItem {
  id: string;
  payment_id: string;
  
  // Item details
  name: string;
  description: string | null;
  quantity: number;
  unit_price: number; // In cents
  total_price: number; // In cents
  
  // Tax information
  tax_rate: number | null;
  tax_amount: number | null;
  
  // Categorization
  category: string | null;
  sku: string | null;
  metadata: Record<string, any> | null;
  
  // Timestamps
  created_at: string;
  updated_at: string;
  
  // Relations
  payment?: Payment;
}

/**
 * Website visits table - Analytics tracking
 */
export interface WebsiteVisit {
  id: string;
  
  // Page information
  page_path: string;
  referrer: string | null;
  
  // Session tracking
  session_id: string | null;
  user_agent: string | null;
  ip_address: string | null;
  
  // Device information
  device_type: DeviceType | null;
  browser: string | null;
  
  // Location information
  country: string | null;
  city: string | null;
  
  // Timestamp
  created_at: string;
}

/**
 * Users table (Supabase Auth)
 */
export interface User {
  id: string;
  email: string;
  email_confirmed_at?: string | null;
  last_sign_in_at?: string | null;
  created_at: string;
  updated_at: string;
  
  // Metadata
  user_metadata?: {
    role?: string;
    full_name?: string;
    avatar_url?: string;
    [key: string]: any;
  };
  
  app_metadata?: {
    provider?: string;
    providers?: string[];
    [key: string]: any;
  };
}

// =============================================================================
// DATABASE TYPES FOR SUPABASE
// =============================================================================

/**
 * Complete database schema type for Supabase client
 */
export interface Database {
  public: {
    Tables: {
      quotes: {
        Row: Quote;
        Insert: Omit<Quote, 'id' | 'created_at' | 'updated_at'> & {
          id?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Omit<Quote, 'id' | 'created_at'>> & {
          updated_at?: string;
        };
      };
      
      orders: {
        Row: Order;
        Insert: Omit<Order, 'id' | 'created_at' | 'updated_at' | 'service_count' | 'total_service_amount' | 'has_multiple_services' | 'primary_service_type'> & {
          id?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Omit<Order, 'id' | 'created_at' | 'service_count' | 'total_service_amount' | 'has_multiple_services' | 'primary_service_type'>> & {
          updated_at?: string;
        };
      };
      
      dumpsters: {
        Row: Dumpster;
        Insert: Omit<Dumpster, 'id' | 'created_at' | 'updated_at'> & {
          id?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Omit<Dumpster, 'id' | 'created_at'>> & {
          updated_at?: string;
        };
      };
      
      website_visits: {
        Row: WebsiteVisit;
        Insert: Omit<WebsiteVisit, 'id' | 'created_at'> & {
          id?: string;
          created_at?: string;
        };
        Update: Partial<Omit<WebsiteVisit, 'id' | 'created_at'>>;
      };
      
      service_categories: {
        Row: ServiceCategory;
        Insert: Omit<ServiceCategory, 'id' | 'created_at' | 'updated_at'> & {
          id?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Omit<ServiceCategory, 'id' | 'created_at'>> & {
          updated_at?: string;
        };
      };
      
      services: {
        Row: Service;
        Insert: Omit<Service, 'id' | 'created_at' | 'updated_at'> & {
          id?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Omit<Service, 'id' | 'created_at'>> & {
          updated_at?: string;
        };
      };
      
      order_services: {
        Row: OrderService;
        Insert: Omit<OrderService, 'id' | 'created_at' | 'updated_at' | 'total_price'> & {
          id?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Omit<OrderService, 'id' | 'created_at' | 'total_price'>> & {
          updated_at?: string;
        };
      };
      
      order_dumpsters: {
        Row: OrderDumpster;
        Insert: Omit<OrderDumpster, 'id' | 'created_at' | 'updated_at'> & {
          id?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Omit<OrderDumpster, 'id' | 'created_at'>> & {
          updated_at?: string;
        };
      };
      
      payments: {
        Row: Payment;
        Insert: Omit<Payment, 'id' | 'created_at' | 'updated_at' | 'payment_number'> & {
          id?: string;
          created_at?: string;
          updated_at?: string;
          payment_number?: string;
        };
        Update: Partial<Omit<Payment, 'id' | 'created_at' | 'payment_number'>> & {
          updated_at?: string;
        };
      };
      
      payment_line_items: {
        Row: PaymentLineItem;
        Insert: Omit<PaymentLineItem, 'id' | 'created_at' | 'updated_at'> & {
          id?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Omit<PaymentLineItem, 'id' | 'created_at'>> & {
          updated_at?: string;
        };
      };
    };
    
    Views: {
      order_summary_with_services: {
        Row: {
          id: string;
          order_number: string;
          first_name: string;
          last_name: string | null;
          email: string;
          phone: string | null;
          address: string | null;
          address2: string | null;
          city: string | null;
          state: string | null;
          zip_code: string | null;
          order_status: OrderStatus;
          priority: QuotePriority;
          assigned_to: string | null;
          quoted_price: number | null;
          final_price: number | null;
          service_count: number;
          total_service_amount: number;
          has_multiple_services: boolean;
          primary_service_type: string | null;
          earliest_service_date: string | null;
          latest_service_end_date: string | null;
          services_summary: string | null;
          assigned_dumpsters: string | null;
          services_status: string;
          created_at: string;
          updated_at: string;
          completed_at: string | null;
        };
      };
    };
    
    Functions: {
      add_service_to_order: {
        Args: {
          p_order_id: string;
          p_service_id: string;
          p_quantity?: number;
          p_custom_price?: number;
          p_service_date?: string;
          p_notes?: string;
        };
        Returns: string;
      };
      get_order_service_summary: {
        Args: {
          order_uuid: string;
        };
        Returns: {
          service_count: number;
          total_amount: number;
          dumpster_count: number;
          has_additional_services: boolean;
        }[];
      };
      get_order_with_services: {
        Args: {
          p_order_id: string;
        };
        Returns: {
          order_id: string;
          order_number: string;
          customer_name: string;
          order_status: string;
          service_id: string;
          service_name: string;
          service_category: string;
          quantity: number;
          unit_price: number;
          total_price: number;
          service_status: string;
          service_date: string | null;
          dumpster_name: string | null;
          dumpster_status: string | null;
        }[];
      };
    };
    
    Enums: {
      quote_status: QuoteStatus;
      quote_priority: QuotePriority;
      order_status: OrderStatus;
      dumpster_status: DumpsterStatus;
      dumpster_condition: DumpsterCondition;
      dumpster_size: DumpsterSize;
      time_needed: TimeNeeded;
      device_type: DeviceType;
      service_price_type: ServicePriceType;
      service_status: ServiceStatus;
      dumpster_assignment_status: DumpsterAssignmentStatus;
      payment_status: PaymentStatus;
      payment_method: PaymentMethod;
      payment_type: PaymentType;
    };
  };
}

// =============================================================================
// AGGREGATE AND ANALYTICS INTERFACES
// =============================================================================

/**
 * Statistics for dumpster inventory
 */
export interface DumpsterStats {
  total: number;
  available: number;
  in_use: number;
}

/**
 * Order statistics
 */
export interface OrderStats {
  total: number;
  pending: number;
  confirmed: number;
  delivered: number;
  completed: number;
  cancelled: number;
}

/**
 * Quote statistics
 */
export interface QuoteStats {
  total: number;
  pending: number;
  quoted: number;
  accepted: number;
  declined: number;
  completed: number;
}

/**
 * Analytics summary
 */
export interface AnalyticsSummary {
  totalVisits: number;
  totalQuotes: number;
  totalOrders: number;
  conversionRate: number;
  topPages: Array<{
    path: string;
    visits: number;
  }>;
  deviceBreakdown: Record<DeviceType, number>;
  locationBreakdown: Array<{
    country: string;
    city: string;
    visits: number;
  }>;
}

// =============================================================================
// FORM AND API INTERFACES
// =============================================================================

/**
 * Quote form submission data
 */
export interface QuoteFormData {
  firstName: string;
  lastName?: string;
  email: string;
  phone?: string;
  address?: string;
  address2?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  dumpsterSize?: DumpsterSize;
  dropoffDate?: string;
  timeNeeded?: TimeNeeded;
  message?: string;
}

/**
 * Order creation data
 */
export interface OrderCreateData {
  // Basic customer info
  firstName: string;
  lastName?: string;
  phone?: string;
  email: string;
  
  // Address
  address?: string;
  address2?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  
  // Order details
  priority?: QuotePriority;
  assignedTo?: string;
  scheduledDeliveryDate?: string;
  scheduledPickupDate?: string;
  internalNotes?: string;
  
  // Services
  services: ServiceSelection[];
  
  // Legacy fields for backward compatibility
  quoteId?: string;
  customerName?: string;
  dumpsterSize?: DumpsterSize;
  dropoffDate?: string;
  totalAmount?: number;
}

/**
 * Analytics tracking data
 */
export interface AnalyticsTrackingData {
  pagePath: string;
  userAgent?: string;
  ipAddress?: string;
  referrer?: string;
  sessionId?: string;
  deviceType?: DeviceType;
  browser?: string;
  country?: string;
  city?: string;
}

// =============================================================================
// TYPE UTILITIES
// =============================================================================

/**
 * Helper type for database queries
 */
export type DbQuery<T> = {
  data: T | null;
  error: Error | null;
};

/**
 * Helper type for paginated results
 */
export interface PaginatedResult<T> {
  data: T[];
  count: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

/**
 * Type for database table names
 */
export type TableName = keyof Database['public']['Tables'];

/**
 * Type for getting a table's row type
 */
export type TableRow<T extends TableName> = Database['public']['Tables'][T]['Row'];

/**
 * Type for getting a table's insert type
 */
export type TableInsert<T extends TableName> = Database['public']['Tables'][T]['Insert'];

/**
 * Type for getting a table's update type
 */
export type TableUpdate<T extends TableName> = Database['public']['Tables'][T]['Update'];

// =============================================================================
// ADDITIONAL UTILITY TYPES FOR MULTI-SERVICE SUPPORT
// =============================================================================

/**
 * Order service with full relations
 */
export type OrderServiceWithRelations = OrderService & {
  service: Service & {
    category: ServiceCategory;
  };
  dumpster_assignments: (OrderDumpster & {
    dumpster: Dumpster;
  })[];
};

/**
 * Order with full service details
 */
export type FullOrder = Order & {
  services: OrderServiceWithRelations[];
  payments: Payment[];
};

/**
 * Service selection for order creation
 */
export type ServiceSelection = {
  service_id: string;
  quantity: number;
  unit_price?: number;
  service_date?: string;
  notes?: string;
  metadata?: Record<string, any>;
  dumpster_requests?: DumpsterAssignmentData[];
};

/**
 * Dumpster assignment data
 */
export type DumpsterAssignmentData = {
  dumpster_id?: string;
  order_service_id?: string;
  size_preference?: string;
  delivery_date?: string;
  pickup_date?: string;
  delivery_address?: string;
  scheduled_pickup_date?: string;
  delivery_notes?: string;
  special_instructions?: string;
};

/**
 * Order with services for detailed operations (from view)
 */
export type OrderWithServices = Database['public']['Views']['order_summary_with_services']['Row'];

/**
 * Service catalog with pricing rules
 */
export type ServiceWithPricing = Service & {
  category: ServiceCategory;
  current_price: number;
  available_quantity: number;
  estimated_availability_date?: string;
};

/**
 * Dumpster with current assignment status
 */
export type DumpsterWithStatus = Dumpster & {
  is_available: boolean;
  current_assignment?: OrderDumpster & {
    order: Pick<Order, 'id' | 'order_number' | 'first_name' | 'last_name'>;
    order_service: Pick<OrderService, 'id' | 'service_date' | 'status'>;
  };
  utilization_stats: {
    total_assignments: number;
    days_since_last_return: number;
  };
};

/**
 * Payment with line items detail
 */
export type PaymentWithLineItems = Payment & {
  line_items: PaymentLineItem[];
  order: Pick<Order, 'id' | 'order_number' | 'first_name' | 'last_name' | 'email'>;
};