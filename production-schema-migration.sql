-- ================================================
-- ARK DUMPSTER PRODUCTION SCHEMA MIGRATION
-- Complete database structure migration script
-- ================================================
-- This script recreates the entire database schema structure
-- including tables, views, functions, triggers, types, and RLS policies
-- 
-- Run this script on production to sync the complete database structure
-- ================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_stat_statements";

-- ================================================
-- CUSTOM TYPES (ENUMS)
-- ================================================

-- Payment status enum
DO $$ BEGIN
    CREATE TYPE payment_status AS ENUM (
        'DRAFT',
        'PENDING', 
        'SENT',
        'VIEWED',
        'PARTIALLY_PAID',
        'PAID',
        'OVERDUE',
        'CANCELED',
        'REFUNDED',
        'FAILED'
    );
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

-- Payment method enum
DO $$ BEGIN
    CREATE TYPE payment_method AS ENUM (
        'SQUARE_INVOICE',
        'SQUARE_POS',
        'CASH',
        'CHECK',
        'BANK_TRANSFER',
        'CREDIT_CARD',
        'OTHER'
    );
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

-- Payment type enum
DO $$ BEGIN
    CREATE TYPE payment_type AS ENUM (
        'INVOICE',
        'DEPOSIT',
        'FULL_PAYMENT',
        'PARTIAL_PAYMENT',
        'REFUND',
        'ADJUSTMENT'
    );
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

-- Delivery method enum
DO $$ BEGIN
    CREATE TYPE delivery_method AS ENUM ('EMAIL', 'SMS', 'MANUAL');
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

-- ================================================
-- CORE TABLES
-- ================================================

-- Quotes table
CREATE TABLE IF NOT EXISTS quotes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    first_name VARCHAR NOT NULL,
    last_name VARCHAR,
    email VARCHAR NOT NULL,
    phone NUMERIC,
    address VARCHAR,
    city VARCHAR,
    state VARCHAR,
    zip_code VARCHAR,
    dumpster_size VARCHAR,
    dropoff_date DATE,
    dropoff_time TIME WITHOUT TIME ZONE,
    time_needed VARCHAR,
    message TEXT,
    status VARCHAR DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'cancelled')),
    quoted_price NUMERIC,
    quote_notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    quoted_at TIMESTAMPTZ,
    assigned_to VARCHAR,
    priority VARCHAR DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
    address2 VARCHAR
);

COMMENT ON TABLE quotes IS 'Dumpster rental quote requests with structured data';
COMMENT ON COLUMN quotes.dropoff_date IS 'Requested or scheduled dropoff date';
COMMENT ON COLUMN quotes.status IS 'Quote status: pending, completed, cancelled';
COMMENT ON COLUMN quotes.quoted_price IS 'Final quoted price in dollars';
COMMENT ON COLUMN quotes.quoted_at IS 'Timestamp when quote was provided to customer';
COMMENT ON COLUMN quotes.priority IS 'Quote priority: low, normal, high, urgent';

-- Service categories table
CREATE TABLE IF NOT EXISTS service_categories (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR NOT NULL UNIQUE,
    display_name VARCHAR NOT NULL,
    description TEXT,
    sort_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    icon_name VARCHAR,
    metadata JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE service_categories IS 'Categories for organizing different types of services';

-- Services table
CREATE TABLE IF NOT EXISTS services (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    category_id UUID NOT NULL REFERENCES service_categories(id),
    sku VARCHAR UNIQUE,
    name VARCHAR NOT NULL,
    display_name VARCHAR NOT NULL,
    description TEXT,
    base_price NUMERIC DEFAULT 0 NOT NULL,
    price_type VARCHAR DEFAULT 'fixed' CHECK (price_type IN ('fixed', 'hourly', 'daily', 'weekly', 'custom')),
    dumpster_size VARCHAR,
    included_days INTEGER,
    extra_day_price NUMERIC,
    included_weight_tons NUMERIC,
    extra_weight_price_per_ton NUMERIC,
    is_active BOOLEAN DEFAULT true,
    requires_scheduling BOOLEAN DEFAULT false,
    max_quantity INTEGER,
    is_taxable BOOLEAN DEFAULT true,
    tax_rate NUMERIC DEFAULT 0.0825,
    sort_order INTEGER DEFAULT 0,
    metadata JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE services IS 'Master catalog of all available services with pricing';
COMMENT ON COLUMN services.dumpster_size IS 'Size of dumpster for rental services (10-yard, 15-yard, 20-yard, 30-yard)';
COMMENT ON COLUMN services.included_days IS 'Number of rental days included in base price';
COMMENT ON COLUMN services.included_weight_tons IS 'Weight limit in tons included in base price';

-- Dumpsters table
CREATE TABLE IF NOT EXISTS dumpsters (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    address TEXT,
    order_number TEXT,
    status TEXT DEFAULT 'available' CHECK (status IN ('available', 'in_use')),
    current_order_id UUID,
    assigned_to TEXT,
    size TEXT,
    condition TEXT DEFAULT 'good' CHECK (condition IN ('excellent', 'good', 'fair', 'needs_repair')),
    notes TEXT,
    last_known_location TEXT,
    gps_coordinates POINT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    last_assigned_at TIMESTAMPTZ,
    last_maintenance_at TIMESTAMPTZ
);

-- Orders table
CREATE TABLE IF NOT EXISTS orders (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    quote_id UUID REFERENCES quotes(id),
    first_name TEXT NOT NULL,
    last_name TEXT,
    email TEXT NOT NULL,
    phone BIGINT,
    address TEXT,
    address2 TEXT,
    city TEXT,
    state TEXT,
    zip_code TEXT,
    dumpster_size TEXT,
    dropoff_date DATE,
    dropoff_time TIME WITHOUT TIME ZONE,
    time_needed TEXT,
    message TEXT,
    order_number TEXT NOT NULL UNIQUE,
    status TEXT DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'on_way', 'in_progress', 'delivered', 'on_way_pickup', 'picked_up', 'completed', 'cancelled')),
    priority TEXT DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
    quoted_price NUMERIC,
    final_price NUMERIC,
    assigned_to TEXT DEFAULT 'Ariel',
    driver_notes TEXT,
    internal_notes TEXT,
    scheduled_delivery_date DATE,
    scheduled_pickup_date DATE,
    actual_delivery_date DATE,
    actual_pickup_date DATE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ,
    dumpster_id UUID REFERENCES dumpsters(id),
    completed_with_dumpster_id UUID REFERENCES dumpsters(id),
    completed_with_dumpster_name TEXT
);

COMMENT ON TABLE orders IS 'Orders table for tracking dumpster rental orders converted from quotes';
COMMENT ON COLUMN orders.dumpster_id IS 'Currently assigned dumpster for this order';
COMMENT ON COLUMN orders.completed_with_dumpster_id IS 'ID of the dumpster that was used when this order was completed (preserved for historical tracking)';
COMMENT ON COLUMN orders.completed_with_dumpster_name IS 'Name of the dumpster that was used when this order was completed (for easy display without joins)';

-- Add foreign key for dumpsters referencing orders (with proper error handling)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'dumpsters_current_order_id_fkey' 
        AND table_name = 'dumpsters'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE dumpsters ADD CONSTRAINT dumpsters_current_order_id_fkey 
            FOREIGN KEY (current_order_id) REFERENCES orders(id);
    END IF;
END $$;

-- Website visits table
CREATE TABLE IF NOT EXISTS website_visits (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    page_path TEXT NOT NULL,
    user_agent TEXT,
    ip_address INET,
    referrer TEXT,
    session_id TEXT,
    device_type TEXT,
    browser TEXT,
    country TEXT,
    city TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ================================================
-- PAYMENT SYSTEM TABLES
-- ================================================

-- Main payments table
CREATE TABLE IF NOT EXISTS payments (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    payment_number VARCHAR(50) UNIQUE NOT NULL,
    type payment_type NOT NULL DEFAULT 'INVOICE',
    method payment_method NOT NULL DEFAULT 'SQUARE_INVOICE',
    status payment_status NOT NULL DEFAULT 'DRAFT',
    subtotal_amount BIGINT NOT NULL DEFAULT 0,
    tax_amount BIGINT NOT NULL DEFAULT 0,
    total_amount BIGINT NOT NULL DEFAULT 0,
    paid_amount BIGINT NOT NULL DEFAULT 0,
    refunded_amount BIGINT NOT NULL DEFAULT 0,
    square_invoice_id VARCHAR(255),
    square_payment_id VARCHAR(255),
    square_customer_id VARCHAR(255),
    square_location_id VARCHAR(255),
    invoice_number VARCHAR(100),
    invoice_url TEXT,
    public_payment_url TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    due_date TIMESTAMP,
    sent_at TIMESTAMP,
    viewed_at TIMESTAMP,
    paid_at TIMESTAMP,
    failed_at TIMESTAMP,
    canceled_at TIMESTAMP,
    customer_email VARCHAR(255),
    customer_phone VARCHAR(20),
    delivery_method delivery_method,
    description TEXT,
    notes TEXT,
    metadata JSONB,
    last_webhook_event_id VARCHAR(255),
    last_webhook_at TIMESTAMP,
    failure_reason TEXT,
    failure_code VARCHAR(100),
    retry_count INTEGER DEFAULT 0,
    created_by UUID,
    updated_by UUID
);

COMMENT ON TABLE payments IS 'Main payment and invoice tracking table';
COMMENT ON COLUMN payments.subtotal_amount IS 'Subtotal amount in cents';
COMMENT ON COLUMN payments.tax_amount IS 'Tax amount in cents';
COMMENT ON COLUMN payments.total_amount IS 'Total amount in cents (subtotal + tax)';
COMMENT ON COLUMN payments.paid_amount IS 'Amount paid in cents';
COMMENT ON COLUMN payments.refunded_amount IS 'Amount refunded in cents';
COMMENT ON COLUMN payments.payment_number IS 'Human-readable payment identifier (e.g., PAY-000001)';
COMMENT ON COLUMN payments.square_invoice_id IS 'Square invoice ID for Square-generated invoices';
COMMENT ON COLUMN payments.metadata IS 'Additional metadata stored as JSON';

-- Payment transactions table
CREATE TABLE IF NOT EXISTS payment_transactions (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    payment_id UUID NOT NULL REFERENCES payments(id) ON DELETE CASCADE,
    type VARCHAR(20) NOT NULL CHECK (type IN ('CHARGE', 'REFUND', 'ADJUSTMENT', 'FEE')),
    amount BIGINT NOT NULL,
    currency VARCHAR(3) DEFAULT 'USD',
    external_transaction_id VARCHAR(255),
    external_reference VARCHAR(255),
    status VARCHAR(20) NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'COMPLETED', 'FAILED', 'CANCELED')),
    processed_at TIMESTAMP,
    failed_at TIMESTAMP,
    description TEXT,
    metadata JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by UUID
);

COMMENT ON TABLE payment_transactions IS 'Detailed transaction history for payments';

-- Payment reminders table
CREATE TABLE IF NOT EXISTS payment_reminders (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    payment_id UUID NOT NULL REFERENCES payments(id) ON DELETE CASCADE,
    type VARCHAR(20) NOT NULL CHECK (type IN ('INITIAL', 'FOLLOW_UP', 'FINAL_NOTICE', 'OVERDUE')),
    method VARCHAR(10) NOT NULL CHECK (method IN ('EMAIL', 'SMS', 'PHONE', 'MAIL')),
    scheduled_at TIMESTAMP NOT NULL,
    sent_at TIMESTAMP,
    subject TEXT,
    message TEXT,
    template_id VARCHAR(100),
    status VARCHAR(20) NOT NULL DEFAULT 'SCHEDULED' CHECK (status IN ('SCHEDULED', 'SENT', 'FAILED', 'CANCELED')),
    failure_reason TEXT,
    opened_at TIMESTAMP,
    clicked_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE payment_reminders IS 'Payment reminder scheduling and tracking';

-- Payment line items table
CREATE TABLE IF NOT EXISTS payment_line_items (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    payment_id UUID NOT NULL REFERENCES payments(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    quantity DECIMAL(10, 3) NOT NULL DEFAULT 1,
    unit_price BIGINT NOT NULL,
    total_price BIGINT NOT NULL,
    tax_rate DECIMAL(5, 4),
    tax_amount BIGINT,
    category VARCHAR(100),
    sku VARCHAR(100),
    metadata JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE payment_line_items IS 'Line items for detailed invoicing';

-- Payment webhook events table
CREATE TABLE IF NOT EXISTS payment_webhook_events (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    payment_id UUID REFERENCES payments(id) ON DELETE SET NULL,
    event_type VARCHAR(100) NOT NULL,
    event_id VARCHAR(255) NOT NULL,
    source VARCHAR(20) NOT NULL CHECK (source IN ('SQUARE', 'STRIPE', 'PAYPAL', 'OTHER')),
    raw_payload JSONB NOT NULL,
    processed_payload JSONB,
    status VARCHAR(20) NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'PROCESSED', 'FAILED', 'IGNORED')),
    processed_at TIMESTAMP,
    failure_reason TEXT,
    retry_count INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE payment_webhook_events IS 'Webhook event logging for payment systems';

-- ================================================
-- ORDER AND SERVICE TABLES
-- ================================================

-- Order services junction table
CREATE TABLE IF NOT EXISTS order_services (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    order_id UUID NOT NULL REFERENCES orders(id),
    service_id UUID NOT NULL REFERENCES services(id),
    quantity NUMERIC DEFAULT 1 NOT NULL,
    unit_price NUMERIC NOT NULL,
    total_price NUMERIC NOT NULL,
    discount_amount NUMERIC DEFAULT 0,
    discount_reason TEXT,
    service_date DATE,
    start_date DATE,
    end_date DATE,
    status VARCHAR DEFAULT 'confirmed' CHECK (status IN ('confirmed', 'in_progress', 'completed', 'cancelled')),
    notes TEXT,
    driver_notes TEXT,
    metadata JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ,
    invoice_description TEXT
);

COMMENT ON TABLE order_services IS 'Junction table linking orders to multiple services with quantities and pricing';
COMMENT ON COLUMN order_services.metadata IS 'Service-specific data stored as JSON (delivery instructions, measurements, etc)';
COMMENT ON COLUMN order_services.invoice_description IS 'Custom description for this service item that will appear on invoices for this specific order';

-- Order dumpsters table
CREATE TABLE IF NOT EXISTS order_dumpsters (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    order_service_id UUID NOT NULL REFERENCES order_services(id),
    dumpster_id UUID NOT NULL REFERENCES dumpsters(id),
    order_id UUID NOT NULL REFERENCES orders(id),
    status VARCHAR DEFAULT 'assigned' CHECK (status IN ('assigned', 'delivered', 'picked_up', 'returned')),
    assigned_at TIMESTAMPTZ DEFAULT NOW(),
    delivered_at TIMESTAMPTZ,
    scheduled_pickup_date DATE,
    actual_pickup_date DATE,
    returned_at TIMESTAMPTZ,
    delivery_address TEXT,
    delivery_gps_coordinates POINT,
    pickup_address TEXT,
    pickup_gps_coordinates POINT,
    empty_weight_tons NUMERIC,
    full_weight_tons NUMERIC,
    net_weight_tons NUMERIC,
    weight_ticket_number VARCHAR,
    delivery_condition VARCHAR,
    return_condition VARCHAR,
    damage_notes TEXT,
    delivery_photos JSONB,
    pickup_photos JSONB,
    delivery_notes TEXT,
    pickup_notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE order_dumpsters IS 'Specific tracking for dumpster assignments to order services';
COMMENT ON COLUMN order_dumpsters.net_weight_tons IS 'Calculated weight: full_weight_tons - empty_weight_tons';

-- Service pricing rules table
CREATE TABLE IF NOT EXISTS service_pricing_rules (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    service_id UUID REFERENCES services(id),
    rule_type VARCHAR NOT NULL CHECK (rule_type IN ('quantity_discount', 'bundle_discount', 'seasonal', 'customer_type')),
    min_quantity INTEGER,
    max_quantity INTEGER,
    valid_from DATE,
    valid_to DATE,
    customer_type VARCHAR,
    discount_percentage NUMERIC,
    discount_amount NUMERIC,
    fixed_price NUMERIC,
    priority INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    metadata JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE service_pricing_rules IS 'Complex pricing rules for discounts and special pricing';

-- Quote services junction table
CREATE TABLE IF NOT EXISTS quote_services (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    quote_id UUID NOT NULL REFERENCES quotes(id),
    service_id UUID NOT NULL REFERENCES services(id),
    quantity NUMERIC DEFAULT 1 NOT NULL,
    unit_price NUMERIC NOT NULL,
    total_price NUMERIC NOT NULL,
    discount_amount NUMERIC DEFAULT 0,
    discount_reason TEXT,
    service_date DATE,
    start_date DATE,
    end_date DATE,
    status VARCHAR DEFAULT 'pending',
    notes TEXT,
    driver_notes TEXT,
    metadata JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ
);

-- ================================================
-- FUNCTIONS
-- ================================================

-- Function to generate order numbers
CREATE OR REPLACE FUNCTION generate_order_number()
RETURNS TEXT AS $$
DECLARE
  next_num INTEGER;
  order_num TEXT;
BEGIN
  -- Lock the orders table to prevent concurrent access during number generation
  LOCK TABLE orders IN EXCLUSIVE MODE;
  
  -- Get the next sequence number more reliably
  SELECT COALESCE(
    MAX(
      CASE 
        WHEN order_number ~ '^ORD[0-9]{6}$' 
        THEN CAST(SUBSTRING(order_number FROM 4) AS INTEGER)
        ELSE 0
      END
    ), 0
  ) + 1
  INTO next_num
  FROM orders;
  
  -- Format as ORD followed by 6-digit number with leading zeros
  order_num := 'ORD' || LPAD(next_num::TEXT, 6, '0');
  
  -- Ensure uniqueness by checking if this number already exists
  WHILE EXISTS (SELECT 1 FROM orders WHERE order_number = order_num) LOOP
    next_num := next_num + 1;
    order_num := 'ORD' || LPAD(next_num::TEXT, 6, '0');
  END LOOP;
  
  RETURN order_num;
END;
$$ LANGUAGE plpgsql;

-- Function to generate payment numbers
CREATE OR REPLACE FUNCTION generate_payment_number()
RETURNS TEXT AS $$
DECLARE
    new_number TEXT;
    counter INTEGER;
BEGIN
    SELECT COALESCE(MAX(CAST(SUBSTRING(payment_number FROM 'PAY-(\\d+)') AS INTEGER)), 0) + 1
    INTO counter
    FROM payments 
    WHERE payment_number LIKE 'PAY-%';
    
    new_number := 'PAY-' || LPAD(counter::TEXT, 6, '0');
    
    RETURN new_number;
END;
$$ LANGUAGE plpgsql;

-- Function to set payment number
CREATE OR REPLACE FUNCTION set_payment_number()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.payment_number IS NULL OR NEW.payment_number = '' THEN
        NEW.payment_number := generate_payment_number();
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to update updated_at column
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to update orders updated_at
CREATE OR REPLACE FUNCTION update_orders_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to update quotes updated_at
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

-- Function to calculate payment totals
CREATE OR REPLACE FUNCTION calculate_payment_totals()
RETURNS TRIGGER AS $$
BEGIN
    -- Auto-calculate total_amount if not provided
    IF NEW.total_amount = 0 AND (NEW.subtotal_amount > 0 OR NEW.tax_amount > 0) THEN
        NEW.total_amount := COALESCE(NEW.subtotal_amount, 0) + COALESCE(NEW.tax_amount, 0);
    END IF;
    
    -- Update payment status based on amounts
    IF NEW.paid_amount >= NEW.total_amount AND NEW.total_amount > 0 THEN
        NEW.status := 'PAID';
        IF NEW.paid_at IS NULL THEN
            NEW.paid_at := CURRENT_TIMESTAMP;
        END IF;
    ELSIF NEW.paid_amount > 0 AND NEW.paid_amount < NEW.total_amount THEN
        NEW.status := 'PARTIALLY_PAID';
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to calculate line item totals
CREATE OR REPLACE FUNCTION calculate_line_item_totals()
RETURNS TRIGGER AS $$
BEGIN
    -- Calculate total_price from quantity * unit_price
    NEW.total_price := NEW.quantity * NEW.unit_price;
    
    -- Calculate tax amount if tax_rate is provided
    IF NEW.tax_rate IS NOT NULL AND NEW.tax_rate > 0 THEN
        NEW.tax_amount := ROUND(NEW.total_price * NEW.tax_rate);
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to calculate order service totals
CREATE OR REPLACE FUNCTION calculate_order_service_total()
RETURNS TRIGGER AS $$
BEGIN
    NEW.total_price := (NEW.quantity * NEW.unit_price) - COALESCE(NEW.discount_amount, 0);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function for order service summary
CREATE OR REPLACE FUNCTION get_order_service_summary(order_uuid uuid)
RETURNS TABLE(service_count integer, total_amount numeric, dumpster_count integer, has_additional_services boolean)
LANGUAGE plpgsql AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(os.id)::INTEGER as service_count,
        COALESCE(SUM(os.total_price), 0) as total_amount,
        COUNT(od.id)::INTEGER as dumpster_count,
        EXISTS(
            SELECT 1 FROM order_services os2 
            INNER JOIN services s2 ON s2.id = os2.service_id 
            INNER JOIN service_categories sc2 ON sc2.id = s2.category_id 
            WHERE os2.order_id = order_uuid 
            AND sc2.name != 'dumpster_rental'
        ) as has_additional_services
    FROM order_services os
    LEFT JOIN order_dumpsters od ON od.order_service_id = os.id
    WHERE os.order_id = order_uuid;
END;
$$;

-- ================================================
-- TRIGGERS
-- ================================================

-- Payment number generation trigger
DROP TRIGGER IF EXISTS trigger_set_payment_number ON payments;
CREATE TRIGGER trigger_set_payment_number
    BEFORE INSERT ON payments
    FOR EACH ROW
    EXECUTE FUNCTION set_payment_number();

-- Payment calculations trigger
DROP TRIGGER IF EXISTS trigger_calculate_payment_totals ON payments;
CREATE TRIGGER trigger_calculate_payment_totals
    BEFORE INSERT OR UPDATE ON payments
    FOR EACH ROW
    EXECUTE FUNCTION calculate_payment_totals();

-- Payment updated_at trigger
DROP TRIGGER IF EXISTS trigger_payments_updated_at ON payments;
CREATE TRIGGER trigger_payments_updated_at
    BEFORE UPDATE ON payments
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Payment line items calculation trigger
DROP TRIGGER IF EXISTS trigger_calculate_line_item_totals ON payment_line_items;
CREATE TRIGGER trigger_calculate_line_item_totals
    BEFORE INSERT OR UPDATE ON payment_line_items
    FOR EACH ROW
    EXECUTE FUNCTION calculate_line_item_totals();

-- Payment line items updated_at trigger
DROP TRIGGER IF EXISTS trigger_payment_line_items_updated_at ON payment_line_items;
CREATE TRIGGER trigger_payment_line_items_updated_at
    BEFORE UPDATE ON payment_line_items
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Payment reminders updated_at trigger
DROP TRIGGER IF EXISTS trigger_payment_reminders_updated_at ON payment_reminders;
CREATE TRIGGER trigger_payment_reminders_updated_at
    BEFORE UPDATE ON payment_reminders
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Payment webhook events updated_at trigger
DROP TRIGGER IF EXISTS trigger_payment_webhook_events_updated_at ON payment_webhook_events;
CREATE TRIGGER trigger_payment_webhook_events_updated_at
    BEFORE UPDATE ON payment_webhook_events
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Orders updated_at trigger
DROP TRIGGER IF EXISTS trigger_orders_updated_at ON orders;
CREATE TRIGGER trigger_orders_updated_at
    BEFORE UPDATE ON orders
    FOR EACH ROW
    EXECUTE FUNCTION update_orders_updated_at();

-- Quotes updated_at trigger
DROP TRIGGER IF EXISTS update_quotes_updated_at ON quotes;
CREATE TRIGGER update_quotes_updated_at
    BEFORE UPDATE ON quotes
    FOR EACH ROW
    EXECUTE FUNCTION update_quotes_updated_at_column();

-- Service categories updated_at trigger
DROP TRIGGER IF EXISTS update_service_categories_updated_at ON service_categories;
CREATE TRIGGER update_service_categories_updated_at
    BEFORE UPDATE ON service_categories
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Services updated_at trigger
DROP TRIGGER IF EXISTS update_services_updated_at ON services;
CREATE TRIGGER update_services_updated_at
    BEFORE UPDATE ON services
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Order services calculation trigger
DROP TRIGGER IF EXISTS calculate_order_service_total_trigger ON order_services;
CREATE TRIGGER calculate_order_service_total_trigger
    BEFORE INSERT OR UPDATE ON order_services
    FOR EACH ROW
    EXECUTE FUNCTION calculate_order_service_total();

-- Order services updated_at trigger
DROP TRIGGER IF EXISTS update_order_services_updated_at ON order_services;
CREATE TRIGGER update_order_services_updated_at
    BEFORE UPDATE ON order_services
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Order dumpsters updated_at trigger
DROP TRIGGER IF EXISTS update_order_dumpsters_updated_at ON order_dumpsters;
CREATE TRIGGER update_order_dumpsters_updated_at
    BEFORE UPDATE ON order_dumpsters
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Dumpsters updated_at trigger
DROP TRIGGER IF EXISTS update_dumpsters_updated_at ON dumpsters;
CREATE TRIGGER update_dumpsters_updated_at
    BEFORE UPDATE ON dumpsters
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Service pricing rules updated_at trigger
DROP TRIGGER IF EXISTS update_service_pricing_rules_updated_at ON service_pricing_rules;
CREATE TRIGGER update_service_pricing_rules_updated_at
    BEFORE UPDATE ON service_pricing_rules
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Quote services updated_at trigger
DROP TRIGGER IF EXISTS update_quote_services_updated_at ON quote_services;
CREATE TRIGGER update_quote_services_updated_at
    BEFORE UPDATE ON quote_services
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ================================================
-- INDEXES FOR PERFORMANCE
-- ================================================

-- Payments indexes
CREATE INDEX IF NOT EXISTS idx_payments_order_id ON payments(order_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status);
CREATE INDEX IF NOT EXISTS idx_payments_method ON payments(method);
CREATE INDEX IF NOT EXISTS idx_payments_type ON payments(type);
CREATE INDEX IF NOT EXISTS idx_payments_payment_number ON payments(payment_number);
CREATE INDEX IF NOT EXISTS idx_payments_square_invoice_id ON payments(square_invoice_id);
CREATE INDEX IF NOT EXISTS idx_payments_square_payment_id ON payments(square_payment_id);
CREATE INDEX IF NOT EXISTS idx_payments_square_customer_id ON payments(square_customer_id);
CREATE INDEX IF NOT EXISTS idx_payments_created_at ON payments(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_payments_due_date ON payments(due_date);
CREATE INDEX IF NOT EXISTS idx_payments_customer_email ON payments(customer_email);

-- Payment transactions indexes
CREATE INDEX IF NOT EXISTS idx_payment_transactions_payment_id ON payment_transactions(payment_id);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_type ON payment_transactions(type);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_status ON payment_transactions(status);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_external_transaction_id ON payment_transactions(external_transaction_id);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_created_at ON payment_transactions(created_at DESC);

-- Payment reminders indexes
CREATE INDEX IF NOT EXISTS idx_payment_reminders_payment_id ON payment_reminders(payment_id);
CREATE INDEX IF NOT EXISTS idx_payment_reminders_status ON payment_reminders(status);
CREATE INDEX IF NOT EXISTS idx_payment_reminders_scheduled_at ON payment_reminders(scheduled_at);
CREATE INDEX IF NOT EXISTS idx_payment_reminders_type ON payment_reminders(type);

-- Payment line items indexes
CREATE INDEX IF NOT EXISTS idx_payment_line_items_payment_id ON payment_line_items(payment_id);
CREATE INDEX IF NOT EXISTS idx_payment_line_items_category ON payment_line_items(category);

-- Payment webhook events indexes
CREATE INDEX IF NOT EXISTS idx_payment_webhook_events_payment_id ON payment_webhook_events(payment_id);
CREATE INDEX IF NOT EXISTS idx_payment_webhook_events_event_type ON payment_webhook_events(event_type);
CREATE INDEX IF NOT EXISTS idx_payment_webhook_events_source ON payment_webhook_events(source);
CREATE INDEX IF NOT EXISTS idx_payment_webhook_events_status ON payment_webhook_events(status);
CREATE INDEX IF NOT EXISTS idx_payment_webhook_events_event_id ON payment_webhook_events(event_id);
CREATE INDEX IF NOT EXISTS idx_payment_webhook_events_created_at ON payment_webhook_events(created_at DESC);

-- Orders indexes
CREATE INDEX IF NOT EXISTS idx_orders_quote_id ON orders(quote_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_order_number ON orders(order_number);
CREATE INDEX IF NOT EXISTS idx_orders_email ON orders(email);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_orders_dumpster_id ON orders(dumpster_id);

-- Quotes indexes
CREATE INDEX IF NOT EXISTS idx_quotes_status ON quotes(status);
CREATE INDEX IF NOT EXISTS idx_quotes_email ON quotes(email);
CREATE INDEX IF NOT EXISTS idx_quotes_created_at ON quotes(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_quotes_dropoff_date ON quotes(dropoff_date);

-- Services indexes
CREATE INDEX IF NOT EXISTS idx_services_category_id ON services(category_id);
CREATE INDEX IF NOT EXISTS idx_services_is_active ON services(is_active);
CREATE INDEX IF NOT EXISTS idx_services_sku ON services(sku);

-- Order services indexes
CREATE INDEX IF NOT EXISTS idx_order_services_order_id ON order_services(order_id);
CREATE INDEX IF NOT EXISTS idx_order_services_service_id ON order_services(service_id);
CREATE INDEX IF NOT EXISTS idx_order_services_status ON order_services(status);

-- Website visits indexes
CREATE INDEX IF NOT EXISTS idx_website_visits_page_path ON website_visits(page_path);
CREATE INDEX IF NOT EXISTS idx_website_visits_created_at ON website_visits(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_website_visits_session_id ON website_visits(session_id);

-- ================================================
-- VIEWS
-- ================================================

-- Payment summary view
CREATE OR REPLACE VIEW payment_summary AS
SELECT 
    p.id,
    p.payment_number,
    p.order_id,
    o.order_number,
    o.first_name,
    o.last_name,
    o.email,
    p.type,
    p.method,
    p.status,
    p.total_amount,
    p.paid_amount,
    p.total_amount - p.paid_amount AS balance_due,
    p.due_date,
    p.created_at,
    p.updated_at,
    CASE 
        WHEN p.due_date < CURRENT_TIMESTAMP AND p.status NOT IN ('PAID', 'CANCELED') THEN true
        ELSE false
    END AS is_overdue
FROM payments p
JOIN orders o ON p.order_id = o.id;

-- Order payment status view
CREATE OR REPLACE VIEW order_payment_status AS
SELECT 
    o.id AS order_id,
    o.order_number,
    COALESCE(SUM(p.total_amount), 0) AS total_amount,
    COALESCE(SUM(p.paid_amount), 0) AS total_paid,
    COALESCE(SUM(p.total_amount - p.paid_amount), 0) AS balance_due,
    COUNT(p.id) AS payment_count,
    CASE 
        WHEN COALESCE(SUM(p.paid_amount), 0) = 0 THEN 'UNPAID'
        WHEN COALESCE(SUM(p.paid_amount), 0) >= COALESCE(SUM(p.total_amount), 0) THEN 'PAID'
        WHEN COALESCE(SUM(p.paid_amount), 0) > COALESCE(SUM(p.total_amount), 0) THEN 'OVERPAID'
        ELSE 'PARTIALLY_PAID'
    END AS payment_status
FROM orders o
LEFT JOIN payments p ON o.id = p.order_id
GROUP BY o.id, o.order_number;

-- Order summary with services view
CREATE OR REPLACE VIEW order_summary_with_services AS
SELECT 
    o.id,
    o.order_number,
    o.first_name,
    o.last_name,
    o.email,
    o.phone,
    o.address,
    o.address2,
    o.city,
    o.state,
    o.zip_code,
    o.status AS order_status,
    o.priority,
    o.assigned_to,
    o.dropoff_date,
    o.dropoff_time,
    o.time_needed,
    o.internal_notes,
    o.created_at,
    o.updated_at,
    COUNT(os.id) AS service_count,
    COALESCE(SUM(os.total_price), 0) AS total_service_amount,
    COUNT(od.id) AS dumpster_count,
    STRING_AGG(DISTINCT s.display_name, ', ' ORDER BY s.display_name) AS services_summary,
    STRING_AGG(DISTINCT d.name, ', ' ORDER BY d.name) AS assigned_dumpsters,
    CASE 
        WHEN COUNT(os.id) = 0 THEN 'no_services'
        WHEN COUNT(os.id) = COUNT(CASE WHEN os.status = 'completed' THEN 1 END) THEN 'all_completed'
        WHEN COUNT(CASE WHEN os.status = 'in_progress' THEN 1 END) > 0 THEN 'in_progress'
        WHEN COUNT(CASE WHEN os.status = 'confirmed' THEN 1 END) > 0 THEN 'confirmed'
        ELSE 'pending'
    END AS services_status,
    CASE WHEN COUNT(os.id) > 1 THEN true ELSE false END AS has_multiple_services
FROM orders o
LEFT JOIN order_services os ON os.order_id = o.id
LEFT JOIN services s ON s.id = os.service_id
LEFT JOIN order_dumpsters od ON od.order_service_id = os.id
LEFT JOIN dumpsters d ON d.id = od.dumpster_id
GROUP BY o.id, o.order_number, o.first_name, o.last_name, o.email, o.phone, o.address, o.address2, 
         o.city, o.state, o.zip_code, o.status, o.priority, o.assigned_to, o.dropoff_date, 
         o.dropoff_time, o.time_needed, o.internal_notes, o.created_at, o.updated_at;

-- ================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ================================================

-- Enable RLS on tables
ALTER TABLE quotes ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE dumpsters ENABLE ROW LEVEL SECURITY;
ALTER TABLE website_visits ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE services ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_services ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_dumpsters ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_pricing_rules ENABLE ROW LEVEL SECURITY;

-- Quotes policies
DROP POLICY IF EXISTS "Allow anonymous quote submissions" ON quotes;
CREATE POLICY "Allow anonymous quote submissions" ON quotes FOR INSERT TO public WITH CHECK (true);

DROP POLICY IF EXISTS "Allow authenticated reads" ON quotes;
CREATE POLICY "Allow authenticated reads" ON quotes FOR SELECT TO public USING (true);

DROP POLICY IF EXISTS "Allow authenticated updates" ON quotes;
CREATE POLICY "Allow authenticated updates" ON quotes FOR UPDATE TO public USING (true);

DROP POLICY IF EXISTS "Allow authenticated deletes" ON quotes;
CREATE POLICY "Allow authenticated deletes" ON quotes FOR DELETE TO authenticated USING (true);

-- Orders policies
DROP POLICY IF EXISTS "Enable all operations for authenticated users and service role" ON orders;
CREATE POLICY "Enable all operations for authenticated users and service role" ON orders 
FOR ALL TO public USING (auth.role() = 'authenticated' OR auth.role() IS NULL) 
WITH CHECK (auth.role() = 'authenticated' OR auth.role() IS NULL);

-- Dumpsters policies
DROP POLICY IF EXISTS "Admins can manage dumpsters" ON dumpsters;
CREATE POLICY "Admins can manage dumpsters" ON dumpsters FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Website visits policies
DROP POLICY IF EXISTS "Allow public insert on website_visits" ON website_visits;
CREATE POLICY "Allow public insert on website_visits" ON website_visits FOR INSERT TO public WITH CHECK (true);

DROP POLICY IF EXISTS "Allow authenticated read on website_visits" ON website_visits;
CREATE POLICY "Allow authenticated read on website_visits" ON website_visits FOR SELECT TO public USING (true);

-- Service categories policies
DROP POLICY IF EXISTS "Public can view active service categories" ON service_categories;
CREATE POLICY "Public can view active service categories" ON service_categories FOR SELECT TO public USING (is_active = true);

DROP POLICY IF EXISTS "Authenticated users can manage service categories" ON service_categories;
CREATE POLICY "Authenticated users can manage service categories" ON service_categories FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Services policies
DROP POLICY IF EXISTS "Public can view active services" ON services;
CREATE POLICY "Public can view active services" ON services FOR SELECT TO public USING (is_active = true);

DROP POLICY IF EXISTS "Authenticated users can manage services" ON services;
CREATE POLICY "Authenticated users can manage services" ON services FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Order services policies
DROP POLICY IF EXISTS "Authenticated users can manage order services" ON order_services;
CREATE POLICY "Authenticated users can manage order services" ON order_services FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Order dumpsters policies
DROP POLICY IF EXISTS "Authenticated users can manage order dumpsters" ON order_dumpsters;
CREATE POLICY "Authenticated users can manage order dumpsters" ON order_dumpsters FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Service pricing rules policies
DROP POLICY IF EXISTS "Authenticated users can manage pricing rules" ON service_pricing_rules;
CREATE POLICY "Authenticated users can manage pricing rules" ON service_pricing_rules FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- ================================================
-- SCRIPT COMPLETION
-- ================================================

-- Update sequences to avoid conflicts (if needed)
-- This ensures auto-generated values don't conflict with existing data
SELECT setval(pg_get_serial_sequence('quotes', 'id'), COALESCE((SELECT MAX(id::text)::bigint FROM quotes), 1), false) WHERE false; -- Only for integer PKs

COMMENT ON SCHEMA public IS 'ARK Dumpster database schema - Complete production migration applied';

-- Print completion message
DO $$
BEGIN
    RAISE NOTICE 'ARK Dumpster Production Schema Migration completed successfully!';
    RAISE NOTICE 'Schema includes: Tables, Views, Functions, Triggers, Types, Indexes, and RLS Policies';
    RAISE NOTICE 'All database structure has been synchronized to production standards.';
END
$$;