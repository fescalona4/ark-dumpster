-- ============================================
-- CREATE ALL TABLES FOR ARK DUMPSTER
-- ============================================
-- This script creates all 4 main tables:
-- 1. Quotes
-- 2. Orders
-- 3. Dumpsters
-- 4. Website Visits
-- ============================================

-- ============================================
-- 1. QUOTES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS quotes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    
    -- Customer Information
    first_name VARCHAR(255) NOT NULL,
    last_name VARCHAR(255),
    email VARCHAR(255) NOT NULL,
    phone VARCHAR(50),
    
    -- Service Location
    address VARCHAR(500),
    city VARCHAR(255),
    state VARCHAR(100),
    zip_code VARCHAR(20),
    
    -- Service Details
    dumpster_size VARCHAR(100),
    dropoff_date DATE,
    dropoff_time TIME,
    time_needed VARCHAR(100),
    
    -- Additional Information
    message TEXT,
    
    -- Quote Status and Pricing
    status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'quoted', 'accepted', 'declined', 'completed')),
    quoted_price DECIMAL(10,2),
    quote_notes TEXT,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    quoted_at TIMESTAMP WITH TIME ZONE,
    
    -- Internal tracking
    assigned_to VARCHAR(255),
    priority VARCHAR(20) DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent'))
);

-- Create indexes for quotes
CREATE INDEX IF NOT EXISTS idx_quotes_created_at ON quotes(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_quotes_email ON quotes(email);
CREATE INDEX IF NOT EXISTS idx_quotes_status ON quotes(status);
CREATE INDEX IF NOT EXISTS idx_quotes_dropoff_date ON quotes(dropoff_date);
CREATE INDEX IF NOT EXISTS idx_quotes_location ON quotes(city, state);

-- ============================================
-- 2. ORDERS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS orders (
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
  order_number text UNIQUE NOT NULL,
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

-- Create indexes for orders
CREATE INDEX IF NOT EXISTS idx_orders_quote_id ON orders(quote_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_assigned_to ON orders(assigned_to);
CREATE INDEX IF NOT EXISTS idx_orders_delivery_date ON orders(scheduled_delivery_date);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at);

-- ============================================
-- 3. DUMPSTERS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS dumpsters (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  
  -- Dumpster basic information
  name text NOT NULL UNIQUE,
  address text,
  order_number text,
  
  -- Status tracking
  status text NOT NULL DEFAULT 'available' CHECK (status IN ('available', 'assigned', 'in_transit', 'maintenance', 'out_of_service')),
  
  -- Assignment tracking
  current_order_id uuid REFERENCES orders(id) ON DELETE SET NULL,
  assigned_to text,
  
  -- Additional details
  size text,
  condition text DEFAULT 'good' CHECK (condition IN ('excellent', 'good', 'fair', 'needs_repair')),
  notes text,
  
  -- Location tracking
  last_known_location text,
  gps_coordinates point,
  
  -- Timestamps
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  last_assigned_at timestamp with time zone,
  last_maintenance_at timestamp with time zone
);

-- Create indexes for dumpsters
CREATE INDEX IF NOT EXISTS idx_dumpsters_status ON dumpsters(status);
CREATE INDEX IF NOT EXISTS idx_dumpsters_current_order_id ON dumpsters(current_order_id);
CREATE INDEX IF NOT EXISTS idx_dumpsters_name ON dumpsters(name);

-- ============================================
-- 4. WEBSITE VISITS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS website_visits (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  page_path text NOT NULL,
  user_agent text,
  ip_address inet,
  referrer text,
  session_id text,
  device_type text,
  browser text,
  country text,
  city text,
  created_at timestamp with time zone DEFAULT now()
);

-- Create indexes for website visits
CREATE INDEX IF NOT EXISTS idx_website_visits_page_path ON website_visits(page_path);
CREATE INDEX IF NOT EXISTS idx_website_visits_created_at ON website_visits(created_at);
CREATE INDEX IF NOT EXISTS idx_website_visits_session_id ON website_visits(session_id);

-- ============================================
-- HELPER FUNCTIONS
-- ============================================

-- Function to generate order numbers
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

-- Generic function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Specific function for quotes with quoted_at logic
CREATE OR REPLACE FUNCTION update_quotes_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    -- Set quoted_at when status changes to 'quoted'
    IF NEW.status = 'quoted' AND OLD.status != 'quoted' THEN
        NEW.quoted_at = NOW();
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Specific function for orders
CREATE OR REPLACE FUNCTION update_orders_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- TRIGGERS
-- ============================================

-- Trigger for quotes table
DROP TRIGGER IF EXISTS update_quotes_updated_at ON quotes;
CREATE TRIGGER update_quotes_updated_at 
    BEFORE UPDATE ON quotes 
    FOR EACH ROW 
    EXECUTE FUNCTION update_quotes_updated_at_column();

-- Trigger for orders table
DROP TRIGGER IF EXISTS trigger_orders_updated_at ON orders;
CREATE TRIGGER trigger_orders_updated_at
  BEFORE UPDATE ON orders
  FOR EACH ROW
  EXECUTE FUNCTION update_orders_updated_at();

-- Trigger for dumpsters table
DROP TRIGGER IF EXISTS update_dumpsters_updated_at ON dumpsters;
CREATE TRIGGER update_dumpsters_updated_at
  BEFORE UPDATE ON dumpsters
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================

-- Enable RLS on all tables
ALTER TABLE quotes ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE dumpsters ENABLE ROW LEVEL SECURITY;
ALTER TABLE website_visits ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (to avoid conflicts)
DROP POLICY IF EXISTS "Allow anonymous quote submissions" ON quotes;
DROP POLICY IF EXISTS "Allow authenticated reads" ON quotes;
DROP POLICY IF EXISTS "Allow authenticated updates" ON quotes;
DROP POLICY IF EXISTS "Allow authenticated deletes" ON quotes;
DROP POLICY IF EXISTS "Enable all operations for authenticated users" ON orders;
DROP POLICY IF EXISTS "Admins can manage dumpsters" ON dumpsters;
DROP POLICY IF EXISTS "Allow public insert on website_visits" ON website_visits;
DROP POLICY IF EXISTS "Allow authenticated read on website_visits" ON website_visits;

-- Quotes policies
CREATE POLICY "Allow anonymous quote submissions" ON quotes
    FOR INSERT 
    TO anon 
    WITH CHECK (true);

CREATE POLICY "Allow authenticated reads" ON quotes
    FOR SELECT 
    TO authenticated 
    USING (true);

CREATE POLICY "Allow authenticated updates" ON quotes
    FOR UPDATE 
    TO authenticated 
    USING (true);

CREATE POLICY "Allow authenticated deletes" ON quotes
    FOR DELETE 
    TO authenticated 
    USING (true);

-- Orders policies
CREATE POLICY "Enable all operations for authenticated users" ON orders
  FOR ALL USING (auth.role() = 'authenticated');

-- Dumpsters policies
CREATE POLICY "Admins can manage dumpsters" ON dumpsters
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Website visits policies
CREATE POLICY "Allow public insert on website_visits" ON website_visits
  FOR INSERT TO anon
  WITH CHECK (true);

CREATE POLICY "Allow authenticated read on website_visits" ON website_visits
  FOR SELECT TO authenticated
  USING (true);

-- ============================================
-- TABLE COMMENTS
-- ============================================

-- Comments for quotes table
COMMENT ON TABLE quotes IS 'Dumpster rental quote requests with structured data';
COMMENT ON COLUMN quotes.status IS 'Quote status: pending, quoted, accepted, declined, completed';
COMMENT ON COLUMN quotes.priority IS 'Quote priority: low, normal, high, urgent';
COMMENT ON COLUMN quotes.quoted_price IS 'Final quoted price in dollars';
COMMENT ON COLUMN quotes.dropoff_date IS 'Requested or scheduled dropoff date';
COMMENT ON COLUMN quotes.quoted_at IS 'Timestamp when quote was provided to customer';

-- Comments for orders table
COMMENT ON TABLE orders IS 'Orders table for tracking dumpster rental orders converted from quotes';

-- ============================================
-- END OF SCRIPT
-- ============================================