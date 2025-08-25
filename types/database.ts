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
  | 'pending' 
  | 'confirmed' 
  | 'scheduled' 
  | 'on_way' 
  | 'delivered' 
  | 'picked_up' 
  | 'completed' 
  | 'cancelled';

export type DumpsterStatus = 
  | 'available' 
  | 'in_use';

export type DumpsterCondition = 'excellent' | 'good' | 'fair' | 'needs_repair';

export type DumpsterSize = '10-yard' | '15-yard' | '20-yard' | '30-yard';

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
 * Orders table - Confirmed orders from quotes
 */
export interface Order {
  id: string;
  quote_id: string | null;
  
  // Customer information
  customer_name: string;
  phone: string | null;
  email: string;
  
  // Address information
  address: string | null;
  city: string | null;
  state: string | null;
  zip_code: string | null;
  
  // Service details
  dumpster_size: DumpsterSize | null;
  
  // Order management
  order_number?: string;
  status: OrderStatus;
  priority?: QuotePriority;
  
  // Scheduling
  dropoff_date: string | null;
  pickup_date: string | null;
  scheduled_delivery_date?: string | null;
  scheduled_pickup_date?: string | null;
  actual_delivery_date?: string | null;
  actual_pickup_date?: string | null;
  
  // Pricing
  total_amount: number | null;
  quoted_price?: number | null;
  final_price?: number | null;
  
  // Assignment and tracking
  assigned_to?: string | null;
  dumpster_id: string | null;
  driver_notes?: string | null;
  internal_notes?: string | null;
  
  // Completed order tracking (for historical purposes)
  completed_with_dumpster_id?: string | null;
  completed_with_dumpster_name?: string | null;
  
  // Timestamps
  created_at: string;
  updated_at: string;
  completed_at?: string | null;
}

/**
 * Dumpsters table - Inventory management
 */
export interface Dumpster {
  id: string;
  
  // Basic information
  name: string;
  size: DumpsterSize | null;
  
  // Status and condition
  status: DumpsterStatus;
  condition?: DumpsterCondition;
  
  // Location tracking
  current_location: string | null;
  latitude: number | null;
  longitude: number | null;
  last_known_location?: string | null;
  gps_coordinates?: string | null;
  
  // Assignment tracking
  current_order_id?: string | null;
  assigned_to?: string | null;
  
  // Maintenance
  notes?: string | null;
  last_maintenance_at?: string | null;
  
  // Timestamps
  created_at: string;
  updated_at: string;
  last_assigned_at?: string | null;
  
  // Relations
  orders?: Order | Order[];
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
        Insert: Omit<Order, 'id' | 'created_at' | 'updated_at'> & {
          id?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Omit<Order, 'id' | 'created_at'>> & {
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
    };
    
    Views: {
      // Add any database views here
    };
    
    Functions: {
      // Add any database functions here
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
  quoteId?: string;
  customerName: string;
  phone?: string;
  email: string;
  address?: string;
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