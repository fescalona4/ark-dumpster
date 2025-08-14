/**
 * Order interface for converted quotes
 * Represents a dumpster rental order with scheduling and tracking information
 */
export interface Order {
  id: string;
  quote_id: string | null;

  // Customer information
  first_name: string;
  last_name: string | null;
  email: string;
  phone: number | null;
  address: string | null;
  address2: string | null;
  city: string | null;
  state: string | null;
  zip_code: string | null;

  // Service details
  dumpster_size: string | null;
  dropoff_date: string | null;
  dropoff_time: string | null;
  time_needed: string | null;
  message: string | null;

  // Order-specific fields
  order_number: string;
  status: 'pending' | 'scheduled' | 'on_way' | 'in_progress' | 'delivered' | 'on_way_pickup' | 'picked_up' | 'completed' | 'cancelled';
  priority: 'low' | 'normal' | 'high' | 'urgent';

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

  // Timestamps
  created_at: string;
  updated_at: string;
  completed_at: string | null;
}
