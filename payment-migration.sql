-- Payment System Migration
-- Creates comprehensive payment and invoice tracking tables

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create payment status enum
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
    WHEN duplicate_object THEN null;
END $$;

-- Create payment method enum
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
    WHEN duplicate_object THEN null;
END $$;

-- Create payment type enum
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
    WHEN duplicate_object THEN null;
END $$;

-- Create delivery method enum
DO $$ BEGIN
    CREATE TYPE delivery_method AS ENUM ('EMAIL', 'SMS', 'MANUAL');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Main payments table
CREATE TABLE IF NOT EXISTS payments (
    -- Primary identifiers
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    payment_number VARCHAR(50) UNIQUE NOT NULL,
    
    -- Payment details
    type payment_type NOT NULL DEFAULT 'INVOICE',
    method payment_method NOT NULL DEFAULT 'SQUARE_INVOICE',
    status payment_status NOT NULL DEFAULT 'DRAFT',
    
    -- Amount details (stored in cents for precision)
    subtotal_amount BIGINT NOT NULL DEFAULT 0,
    tax_amount BIGINT NOT NULL DEFAULT 0,
    total_amount BIGINT NOT NULL DEFAULT 0,
    paid_amount BIGINT NOT NULL DEFAULT 0,
    refunded_amount BIGINT NOT NULL DEFAULT 0,
    
    -- Square-specific fields
    square_invoice_id VARCHAR(255),
    square_payment_id VARCHAR(255),
    square_customer_id VARCHAR(255),
    square_location_id VARCHAR(255),
    
    -- Invoice details
    invoice_number VARCHAR(100),
    invoice_url TEXT,
    public_payment_url TEXT,
    
    -- Dates and timing
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    due_date TIMESTAMP,
    sent_at TIMESTAMP,
    viewed_at TIMESTAMP,
    paid_at TIMESTAMP,
    failed_at TIMESTAMP,
    canceled_at TIMESTAMP,
    
    -- Customer communication
    customer_email VARCHAR(255),
    customer_phone VARCHAR(20),
    delivery_method delivery_method,
    
    -- Additional metadata
    description TEXT,
    notes TEXT,
    metadata JSONB,
    
    -- Webhook tracking
    last_webhook_event_id VARCHAR(255),
    last_webhook_at TIMESTAMP,
    
    -- Failure tracking
    failure_reason TEXT,
    failure_code VARCHAR(100),
    retry_count INTEGER DEFAULT 0,
    
    -- Audit fields
    created_by UUID,
    updated_by UUID
);

-- Payment transactions table for detailed transaction history
CREATE TABLE IF NOT EXISTS payment_transactions (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    payment_id UUID NOT NULL REFERENCES payments(id) ON DELETE CASCADE,
    
    -- Transaction details
    type VARCHAR(20) NOT NULL CHECK (type IN ('CHARGE', 'REFUND', 'ADJUSTMENT', 'FEE')),
    amount BIGINT NOT NULL,
    currency VARCHAR(3) DEFAULT 'USD',
    
    -- External references
    external_transaction_id VARCHAR(255),
    external_reference VARCHAR(255),
    
    -- Status and timing
    status VARCHAR(20) NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'COMPLETED', 'FAILED', 'CANCELED')),
    processed_at TIMESTAMP,
    failed_at TIMESTAMP,
    
    -- Metadata
    description TEXT,
    metadata JSONB,
    
    -- Audit
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by UUID
);

-- Payment reminders table
CREATE TABLE IF NOT EXISTS payment_reminders (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    payment_id UUID NOT NULL REFERENCES payments(id) ON DELETE CASCADE,
    
    -- Reminder details
    type VARCHAR(20) NOT NULL CHECK (type IN ('INITIAL', 'FOLLOW_UP', 'FINAL_NOTICE', 'OVERDUE')),
    method VARCHAR(10) NOT NULL CHECK (method IN ('EMAIL', 'SMS', 'PHONE', 'MAIL')),
    
    -- Scheduling
    scheduled_at TIMESTAMP NOT NULL,
    sent_at TIMESTAMP,
    
    -- Content
    subject TEXT,
    message TEXT,
    template_id VARCHAR(100),
    
    -- Status
    status VARCHAR(20) NOT NULL DEFAULT 'SCHEDULED' CHECK (status IN ('SCHEDULED', 'SENT', 'FAILED', 'CANCELED')),
    failure_reason TEXT,
    
    -- Tracking
    opened_at TIMESTAMP,
    clicked_at TIMESTAMP,
    
    -- Audit
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Payment line items table
CREATE TABLE IF NOT EXISTS payment_line_items (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    payment_id UUID NOT NULL REFERENCES payments(id) ON DELETE CASCADE,
    
    -- Item details
    name VARCHAR(255) NOT NULL,
    description TEXT,
    quantity DECIMAL(10, 3) NOT NULL DEFAULT 1,
    unit_price BIGINT NOT NULL,
    total_price BIGINT NOT NULL,
    
    -- Tax information
    tax_rate DECIMAL(5, 4),
    tax_amount BIGINT,
    
    -- Categorization
    category VARCHAR(100),
    sku VARCHAR(100),
    
    -- Metadata
    metadata JSONB,
    
    -- Audit
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Payment webhook events table
CREATE TABLE IF NOT EXISTS payment_webhook_events (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    payment_id UUID REFERENCES payments(id) ON DELETE SET NULL,
    
    -- Event details
    event_type VARCHAR(100) NOT NULL,
    event_id VARCHAR(255) NOT NULL,
    source VARCHAR(20) NOT NULL CHECK (source IN ('SQUARE', 'STRIPE', 'PAYPAL', 'OTHER')),
    
    -- Payload
    raw_payload JSONB NOT NULL,
    processed_payload JSONB,
    
    -- Processing status
    status VARCHAR(20) NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'PROCESSED', 'FAILED', 'IGNORED')),
    processed_at TIMESTAMP,
    failure_reason TEXT,
    retry_count INTEGER DEFAULT 0,
    
    -- Audit
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better query performance
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

-- Indexes for payment_transactions
CREATE INDEX IF NOT EXISTS idx_payment_transactions_payment_id ON payment_transactions(payment_id);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_type ON payment_transactions(type);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_status ON payment_transactions(status);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_external_transaction_id ON payment_transactions(external_transaction_id);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_created_at ON payment_transactions(created_at DESC);

-- Indexes for payment_reminders
CREATE INDEX IF NOT EXISTS idx_payment_reminders_payment_id ON payment_reminders(payment_id);
CREATE INDEX IF NOT EXISTS idx_payment_reminders_status ON payment_reminders(status);
CREATE INDEX IF NOT EXISTS idx_payment_reminders_scheduled_at ON payment_reminders(scheduled_at);
CREATE INDEX IF NOT EXISTS idx_payment_reminders_type ON payment_reminders(type);

-- Indexes for payment_line_items
CREATE INDEX IF NOT EXISTS idx_payment_line_items_payment_id ON payment_line_items(payment_id);
CREATE INDEX IF NOT EXISTS idx_payment_line_items_category ON payment_line_items(category);

-- Indexes for payment_webhook_events
CREATE INDEX IF NOT EXISTS idx_payment_webhook_events_payment_id ON payment_webhook_events(payment_id);
CREATE INDEX IF NOT EXISTS idx_payment_webhook_events_event_type ON payment_webhook_events(event_type);
CREATE INDEX IF NOT EXISTS idx_payment_webhook_events_source ON payment_webhook_events(source);
CREATE INDEX IF NOT EXISTS idx_payment_webhook_events_status ON payment_webhook_events(status);
CREATE INDEX IF NOT EXISTS idx_payment_webhook_events_event_id ON payment_webhook_events(event_id);
CREATE INDEX IF NOT EXISTS idx_payment_webhook_events_created_at ON payment_webhook_events(created_at DESC);

-- Function to generate payment numbers
CREATE OR REPLACE FUNCTION generate_payment_number()
RETURNS TEXT AS $$
DECLARE
    new_number TEXT;
    counter INTEGER;
BEGIN
    SELECT COALESCE(MAX(CAST(SUBSTRING(payment_number FROM 'PAY-(\d+)') AS INTEGER)), 0) + 1
    INTO counter
    FROM payments 
    WHERE payment_number LIKE 'PAY-%';
    
    new_number := 'PAY-' || LPAD(counter::TEXT, 6, '0');
    
    RETURN new_number;
END;
$$ LANGUAGE plpgsql;

-- Function to automatically set payment_number on insert
CREATE OR REPLACE FUNCTION set_payment_number()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.payment_number IS NULL OR NEW.payment_number = '' THEN
        NEW.payment_number := generate_payment_number();
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for payment_number generation
DROP TRIGGER IF EXISTS trigger_set_payment_number ON payments;
CREATE TRIGGER trigger_set_payment_number
    BEFORE INSERT ON payments
    FOR EACH ROW
    EXECUTE FUNCTION set_payment_number();

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers to automatically update updated_at
DROP TRIGGER IF EXISTS trigger_payments_updated_at ON payments;
CREATE TRIGGER trigger_payments_updated_at
    BEFORE UPDATE ON payments
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trigger_payment_reminders_updated_at ON payment_reminders;
CREATE TRIGGER trigger_payment_reminders_updated_at
    BEFORE UPDATE ON payment_reminders
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trigger_payment_line_items_updated_at ON payment_line_items;
CREATE TRIGGER trigger_payment_line_items_updated_at
    BEFORE UPDATE ON payment_line_items
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trigger_payment_webhook_events_updated_at ON payment_webhook_events;
CREATE TRIGGER trigger_payment_webhook_events_updated_at
    BEFORE UPDATE ON payment_webhook_events
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

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

-- Create trigger for payment calculations
DROP TRIGGER IF EXISTS trigger_calculate_payment_totals ON payments;
CREATE TRIGGER trigger_calculate_payment_totals
    BEFORE INSERT OR UPDATE ON payments
    FOR EACH ROW
    EXECUTE FUNCTION calculate_payment_totals();

-- Function to automatically calculate line item totals
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

-- Create trigger for line item calculations
DROP TRIGGER IF EXISTS trigger_calculate_line_item_totals ON payment_line_items;
CREATE TRIGGER trigger_calculate_line_item_totals
    BEFORE INSERT OR UPDATE ON payment_line_items
    FOR EACH ROW
    EXECUTE FUNCTION calculate_line_item_totals();

-- Views for common queries
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

-- View for order payment status
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

-- Add table comments for documentation
COMMENT ON TABLE payments IS 'Main payment and invoice tracking table';
COMMENT ON TABLE payment_transactions IS 'Detailed transaction history for payments';
COMMENT ON TABLE payment_reminders IS 'Payment reminder scheduling and tracking';
COMMENT ON TABLE payment_line_items IS 'Line items for detailed invoicing';
COMMENT ON TABLE payment_webhook_events IS 'Webhook event logging for payment systems';

-- Add column comments
COMMENT ON COLUMN payments.subtotal_amount IS 'Subtotal amount in cents';
COMMENT ON COLUMN payments.tax_amount IS 'Tax amount in cents';
COMMENT ON COLUMN payments.total_amount IS 'Total amount in cents (subtotal + tax)';
COMMENT ON COLUMN payments.paid_amount IS 'Amount paid in cents';
COMMENT ON COLUMN payments.refunded_amount IS 'Amount refunded in cents';
COMMENT ON COLUMN payments.payment_number IS 'Human-readable payment identifier (e.g., PAY-000001)';
COMMENT ON COLUMN payments.square_invoice_id IS 'Square invoice ID for Square-generated invoices';
COMMENT ON COLUMN payments.metadata IS 'Additional metadata stored as JSON';