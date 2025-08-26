-- ============================================
-- MIGRATION: Create Services Tables
-- ============================================
-- This migration creates the service catalog system to support
-- multiple services per order (dumpsters, extra charges, tree services, etc.)
-- ============================================

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- 1. SERVICE CATEGORIES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS service_categories (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    
    -- Category details
    name VARCHAR(100) NOT NULL UNIQUE,
    display_name VARCHAR(255) NOT NULL,
    description TEXT,
    
    -- Display order and visibility
    sort_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    
    -- Icon or image for UI
    icon_name VARCHAR(100),
    
    -- Metadata
    metadata JSONB,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX idx_service_categories_name ON service_categories(name);
CREATE INDEX idx_service_categories_is_active ON service_categories(is_active);
CREATE INDEX idx_service_categories_sort_order ON service_categories(sort_order);

-- ============================================
-- 2. SERVICES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS services (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    
    -- Service identification
    category_id UUID NOT NULL REFERENCES service_categories(id) ON DELETE RESTRICT,
    sku VARCHAR(100) UNIQUE,
    name VARCHAR(255) NOT NULL,
    display_name VARCHAR(255) NOT NULL,
    description TEXT,
    
    -- Pricing
    base_price DECIMAL(10,2) NOT NULL DEFAULT 0,
    price_type VARCHAR(50) NOT NULL DEFAULT 'fixed' 
        CHECK (price_type IN ('fixed', 'hourly', 'daily', 'weekly', 'custom')),
    
    -- For dumpster rentals specifically
    dumpster_size VARCHAR(50), -- '10-yard', '15-yard', '20-yard', '30-yard'
    included_days INTEGER, -- Number of days included in base price
    extra_day_price DECIMAL(10,2), -- Price per additional day
    included_weight_tons DECIMAL(5,2), -- Included weight in tons
    extra_weight_price_per_ton DECIMAL(10,2), -- Price per extra ton
    
    -- Service availability
    is_active BOOLEAN DEFAULT true,
    requires_scheduling BOOLEAN DEFAULT false,
    max_quantity INTEGER, -- Maximum quantity that can be ordered
    
    -- Tax settings
    is_taxable BOOLEAN DEFAULT true,
    tax_rate DECIMAL(5,4) DEFAULT 0.0825, -- Default 8.25% tax rate
    
    -- Display settings
    sort_order INTEGER DEFAULT 0,
    
    -- Metadata for flexibility
    metadata JSONB,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX idx_services_category_id ON services(category_id);
CREATE INDEX idx_services_sku ON services(sku);
CREATE INDEX idx_services_name ON services(name);
CREATE INDEX idx_services_is_active ON services(is_active);
CREATE INDEX idx_services_dumpster_size ON services(dumpster_size);
CREATE INDEX idx_services_sort_order ON services(sort_order);

-- ============================================
-- 3. ORDER SERVICES TABLE (Junction Table)
-- ============================================
CREATE TABLE IF NOT EXISTS order_services (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    
    -- Relationships
    order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    service_id UUID NOT NULL REFERENCES services(id) ON DELETE RESTRICT,
    
    -- Service details
    quantity DECIMAL(10,2) NOT NULL DEFAULT 1,
    unit_price DECIMAL(10,2) NOT NULL, -- Price at time of order
    total_price DECIMAL(10,2) NOT NULL, -- quantity * unit_price
    
    -- Optional price adjustments
    discount_amount DECIMAL(10,2) DEFAULT 0,
    discount_reason TEXT,
    
    -- Service-specific dates
    service_date DATE, -- When service is scheduled
    start_date DATE, -- For rental periods
    end_date DATE, -- For rental periods
    
    -- Status tracking
    status VARCHAR(50) DEFAULT 'pending' 
        CHECK (status IN ('pending', 'confirmed', 'in_progress', 'completed', 'cancelled')),
    
    -- Notes
    notes TEXT,
    driver_notes TEXT,
    
    -- Service-specific metadata (JSON)
    -- For dumpsters: delivery_address, specific_placement_instructions
    -- For tree service: tree_count, tree_type, estimated_hours
    -- For extra weight: actual_weight_tons, weight_ticket_number
    metadata JSONB,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE
);

-- Create indexes
CREATE INDEX idx_order_services_order_id ON order_services(order_id);
CREATE INDEX idx_order_services_service_id ON order_services(service_id);
CREATE INDEX idx_order_services_status ON order_services(status);
CREATE INDEX idx_order_services_service_date ON order_services(service_date);
CREATE UNIQUE INDEX idx_order_services_unique_order_service 
    ON order_services(order_id, service_id, COALESCE(metadata->>'instance_id', ''));

-- ============================================
-- 4. ORDER DUMPSTERS TABLE
-- ============================================
-- Specific table for tracking dumpster assignments to order services
CREATE TABLE IF NOT EXISTS order_dumpsters (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    
    -- Relationships
    order_service_id UUID NOT NULL REFERENCES order_services(id) ON DELETE CASCADE,
    dumpster_id UUID NOT NULL REFERENCES dumpsters(id) ON DELETE RESTRICT,
    order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    
    -- Status tracking
    status VARCHAR(50) DEFAULT 'assigned' 
        CHECK (status IN ('assigned', 'delivered', 'picked_up', 'returned')),
    
    -- Dates
    assigned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    delivered_at TIMESTAMP WITH TIME ZONE,
    scheduled_pickup_date DATE,
    actual_pickup_date DATE,
    returned_at TIMESTAMP WITH TIME ZONE,
    
    -- Location tracking
    delivery_address TEXT,
    delivery_gps_coordinates POINT,
    pickup_address TEXT,
    pickup_gps_coordinates POINT,
    
    -- Weight tracking
    empty_weight_tons DECIMAL(5,2),
    full_weight_tons DECIMAL(5,2),
    net_weight_tons DECIMAL(5,2),
    weight_ticket_number VARCHAR(100),
    
    -- Condition tracking
    delivery_condition VARCHAR(50),
    return_condition VARCHAR(50),
    damage_notes TEXT,
    
    -- Photos
    delivery_photos JSONB, -- Array of photo URLs
    pickup_photos JSONB, -- Array of photo URLs
    
    -- Notes
    delivery_notes TEXT,
    pickup_notes TEXT,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX idx_order_dumpsters_order_service_id ON order_dumpsters(order_service_id);
CREATE INDEX idx_order_dumpsters_dumpster_id ON order_dumpsters(dumpster_id);
CREATE INDEX idx_order_dumpsters_order_id ON order_dumpsters(order_id);
CREATE INDEX idx_order_dumpsters_status ON order_dumpsters(status);
CREATE INDEX idx_order_dumpsters_scheduled_pickup_date ON order_dumpsters(scheduled_pickup_date);
CREATE UNIQUE INDEX idx_order_dumpsters_unique_assignment 
    ON order_dumpsters(order_service_id, dumpster_id);

-- ============================================
-- 5. SERVICE PRICING RULES TABLE (Optional)
-- ============================================
-- For complex pricing rules and bulk discounts
CREATE TABLE IF NOT EXISTS service_pricing_rules (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    
    service_id UUID REFERENCES services(id) ON DELETE CASCADE,
    
    -- Rule type
    rule_type VARCHAR(50) NOT NULL 
        CHECK (rule_type IN ('quantity_discount', 'bundle_discount', 'seasonal', 'customer_type')),
    
    -- Conditions
    min_quantity INTEGER,
    max_quantity INTEGER,
    valid_from DATE,
    valid_to DATE,
    customer_type VARCHAR(50),
    
    -- Discount/Price adjustment
    discount_percentage DECIMAL(5,2),
    discount_amount DECIMAL(10,2),
    fixed_price DECIMAL(10,2),
    
    -- Priority for rule application
    priority INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    
    -- Metadata
    metadata JSONB,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX idx_service_pricing_rules_service_id ON service_pricing_rules(service_id);
CREATE INDEX idx_service_pricing_rules_rule_type ON service_pricing_rules(rule_type);
CREATE INDEX idx_service_pricing_rules_is_active ON service_pricing_rules(is_active);

-- ============================================
-- 6. POPULATE INITIAL DATA
-- ============================================

-- Insert service categories
INSERT INTO service_categories (name, display_name, description, sort_order) VALUES
    ('dumpster_rental', 'Dumpster Rentals', 'Roll-off dumpster rental services', 1),
    ('additional_charges', 'Additional Charges', 'Extra weight, extended rental, and other charges', 2),
    ('tree_service', 'Tree Services', 'Tree removal and trimming services', 3),
    ('labor_service', 'Labor Services', 'Additional labor and hauling services', 4)
ON CONFLICT (name) DO NOTHING;

-- Insert dumpster rental services
INSERT INTO services (
    category_id,
    sku,
    name,
    display_name,
    description,
    base_price,
    price_type,
    dumpster_size,
    included_days,
    extra_day_price,
    included_weight_tons,
    extra_weight_price_per_ton,
    requires_scheduling,
    sort_order
)
SELECT 
    sc.id,
    sku_val.sku,
    sku_val.name,
    sku_val.display_name,
    sku_val.description,
    sku_val.base_price,
    'weekly',
    sku_val.dumpster_size,
    7, -- 1 week included
    sku_val.extra_day_price,
    sku_val.included_weight_tons,
    75.00, -- $75 per extra ton
    true,
    sku_val.sort_order
FROM service_categories sc
CROSS JOIN (VALUES
    ('DUMP-10', '10-yard-dumpster', '10 Yard Dumpster', 'Perfect for small cleanouts and minor renovations', 350.00, '10-yard', 15.00, 2.0, 1),
    ('DUMP-15', '15-yard-dumpster', '15 Yard Dumpster', 'Ideal for medium-sized projects and home cleanouts', 425.00, '15-yard', 20.00, 3.0, 2),
    ('DUMP-20', '20-yard-dumpster', '20 Yard Dumpster', 'Great for large renovations and construction debris', 500.00, '20-yard', 25.00, 4.0, 3),
    ('DUMP-30', '30-yard-dumpster', '30 Yard Dumpster', 'Maximum capacity for major construction projects', 625.00, '30-yard', 30.00, 5.0, 4)
) AS sku_val(sku, name, display_name, description, base_price, dumpster_size, extra_day_price, included_weight_tons, sort_order)
WHERE sc.name = 'dumpster_rental'
ON CONFLICT (sku) DO NOTHING;

-- Insert additional charge services
INSERT INTO services (
    category_id,
    sku,
    name,
    display_name,
    description,
    base_price,
    price_type,
    requires_scheduling,
    sort_order
)
SELECT 
    sc.id,
    sku_val.sku,
    sku_val.name,
    sku_val.display_name,
    sku_val.description,
    sku_val.base_price,
    sku_val.price_type,
    false,
    sku_val.sort_order
FROM service_categories sc
CROSS JOIN (VALUES
    ('CHARGE-WEIGHT', 'extra-weight-charge', 'Extra Weight Charge', 'Additional charge for weight over included tonnage', 75.00, 'custom', 1),
    ('CHARGE-DAYS', 'extra-days-charge', 'Extended Rental', 'Additional days beyond included rental period', 25.00, 'daily', 2),
    ('CHARGE-TRIP', 'extra-trip-charge', 'Additional Trip Charge', 'Extra delivery or pickup trip', 125.00, 'fixed', 3),
    ('CHARGE-RELOC', 'relocation-charge', 'Dumpster Relocation', 'Move dumpster to different location on same property', 75.00, 'fixed', 4)
) AS sku_val(sku, name, display_name, description, base_price, price_type, sort_order)
WHERE sc.name = 'additional_charges'
ON CONFLICT (sku) DO NOTHING;

-- Insert tree services
INSERT INTO services (
    category_id,
    sku,
    name,
    display_name,
    description,
    base_price,
    price_type,
    requires_scheduling,
    sort_order
)
SELECT 
    sc.id,
    sku_val.sku,
    sku_val.name,
    sku_val.display_name,
    sku_val.description,
    sku_val.base_price,
    sku_val.price_type,
    true,
    sku_val.sort_order
FROM service_categories sc
CROSS JOIN (VALUES
    ('TREE-REMOVE', 'tree-removal', 'Tree Removal Service', 'Complete tree removal including stump grinding', 500.00, 'custom', 1),
    ('TREE-TRIM', 'tree-trimming', 'Tree Trimming Service', 'Professional tree trimming and pruning', 250.00, 'hourly', 2),
    ('TREE-EMERG', 'emergency-tree-removal', 'Emergency Tree Removal', '24/7 emergency tree removal service', 750.00, 'custom', 3)
) AS sku_val(sku, name, display_name, description, base_price, price_type, sort_order)
WHERE sc.name = 'tree_service'
ON CONFLICT (sku) DO NOTHING;

-- ============================================
-- 7. TRIGGERS
-- ============================================

-- Trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply update trigger to all new tables
CREATE TRIGGER update_service_categories_updated_at 
    BEFORE UPDATE ON service_categories 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_services_updated_at 
    BEFORE UPDATE ON services 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_order_services_updated_at 
    BEFORE UPDATE ON order_services 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_order_dumpsters_updated_at 
    BEFORE UPDATE ON order_dumpsters 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_service_pricing_rules_updated_at 
    BEFORE UPDATE ON service_pricing_rules 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Trigger to calculate order_services total_price
CREATE OR REPLACE FUNCTION calculate_order_service_total()
RETURNS TRIGGER AS $$
BEGIN
    NEW.total_price := (NEW.quantity * NEW.unit_price) - COALESCE(NEW.discount_amount, 0);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER calculate_order_service_total_trigger
    BEFORE INSERT OR UPDATE ON order_services
    FOR EACH ROW EXECUTE FUNCTION calculate_order_service_total();

-- ============================================
-- 8. ROW LEVEL SECURITY
-- ============================================

-- Enable RLS on new tables
ALTER TABLE service_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE services ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_services ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_dumpsters ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_pricing_rules ENABLE ROW LEVEL SECURITY;

-- Policies for service_categories (public read, authenticated write)
CREATE POLICY "Public can view active service categories" ON service_categories
    FOR SELECT USING (is_active = true);

CREATE POLICY "Authenticated users can manage service categories" ON service_categories
    FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Policies for services (public read, authenticated write)
CREATE POLICY "Public can view active services" ON services
    FOR SELECT USING (is_active = true);

CREATE POLICY "Authenticated users can manage services" ON services
    FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Policies for order_services (authenticated only)
CREATE POLICY "Authenticated users can manage order services" ON order_services
    FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Policies for order_dumpsters (authenticated only)
CREATE POLICY "Authenticated users can manage order dumpsters" ON order_dumpsters
    FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Policies for service_pricing_rules (authenticated only)
CREATE POLICY "Authenticated users can manage pricing rules" ON service_pricing_rules
    FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- ============================================
-- 9. COMMENTS
-- ============================================

COMMENT ON TABLE service_categories IS 'Categories for organizing different types of services';
COMMENT ON TABLE services IS 'Master catalog of all available services with pricing';
COMMENT ON TABLE order_services IS 'Junction table linking orders to multiple services with quantities and pricing';
COMMENT ON TABLE order_dumpsters IS 'Specific tracking for dumpster assignments to order services';
COMMENT ON TABLE service_pricing_rules IS 'Complex pricing rules for discounts and special pricing';

COMMENT ON COLUMN services.dumpster_size IS 'Size of dumpster for rental services (10-yard, 15-yard, 20-yard, 30-yard)';
COMMENT ON COLUMN services.included_days IS 'Number of rental days included in base price';
COMMENT ON COLUMN services.included_weight_tons IS 'Weight limit in tons included in base price';
COMMENT ON COLUMN order_services.metadata IS 'Service-specific data stored as JSON (delivery instructions, measurements, etc)';
COMMENT ON COLUMN order_dumpsters.net_weight_tons IS 'Calculated weight: full_weight_tons - empty_weight_tons';

-- ============================================
-- END OF MIGRATION
-- ============================================