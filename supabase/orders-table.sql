-- Create orders table for converted quotes
CREATE TABLE orders (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  
  -- Reference to original quote
  quote_id uuid REFERENCES quotes(id) ON DELETE SET NULL,
  
  -- Customer information (copied from quote)
  first_name text NOT NULL,
  last_name text,
  email text NOT NULL,
  phone bigint,
  address text,
  address2 text,
  city text,
  state text,
  zip_code text,
  
  -- Service details (copied from quote)
  dumpster_size text,
  dropoff_date date,
  dropoff_time time,
  time_needed text,
  message text,
  
  -- Order-specific fields
  order_number text UNIQUE NOT NULL, -- Auto-generated order number
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'scheduled', 'on_way', 'in_progress', 'delivered', 'picked_up', 'completed', 'cancelled')),
  priority text NOT NULL DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
  
  -- Pricing information
  quoted_price decimal(10,2),
  final_price decimal(10,2),
  
  -- Assignment and tracking
  assigned_to text DEFAULT 'Ariel',
  driver_notes text,
  internal_notes text,
  
  -- Scheduling
  scheduled_delivery_date date,
  scheduled_pickup_date date,
  actual_delivery_date date,
  actual_pickup_date date,
  
  -- Timestamps
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  completed_at timestamp with time zone
);

-- Create indexes for better performance
CREATE INDEX idx_orders_quote_id ON orders(quote_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_assigned_to ON orders(assigned_to);
CREATE INDEX idx_orders_delivery_date ON orders(scheduled_delivery_date);
CREATE INDEX idx_orders_created_at ON orders(created_at);

-- Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_orders_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_orders_updated_at
  BEFORE UPDATE ON orders
  FOR EACH ROW
  EXECUTE FUNCTION update_orders_updated_at();

-- Function to generate order number
CREATE OR REPLACE FUNCTION generate_order_number()
RETURNS TEXT AS $$
DECLARE
  next_num INTEGER;
  order_num TEXT;
BEGIN
  -- Get the next sequence number
  SELECT COALESCE(MAX(CAST(SUBSTRING(order_number FROM 4) AS INTEGER)), 0) + 1
  INTO next_num
  FROM orders
  WHERE order_number ~ '^ORD[0-9]+$';
  
  -- Format as ORD followed by 6-digit number
  order_num := 'ORD' || LPAD(next_num::TEXT, 6, '0');
  
  RETURN order_num;
END;
$$ LANGUAGE plpgsql;

-- Set up RLS (Row Level Security) if needed
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

-- Create policy for authenticated users (adjust as needed for your auth setup)
CREATE POLICY "Enable all operations for authenticated users" ON orders
  FOR ALL USING (auth.role() = 'authenticated');

-- Add comment to table
COMMENT ON TABLE orders IS 'Orders table for tracking dumpster rental orders converted from quotes';
