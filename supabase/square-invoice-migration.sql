-- Square Invoice Integration Migration
-- This migration adds Square-related fields to the orders table

-- Add Square invoice fields to orders table
ALTER TABLE orders ADD COLUMN IF NOT EXISTS square_invoice_id VARCHAR(255);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS square_customer_id VARCHAR(255);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS square_payment_status VARCHAR(50);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_link TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS invoice_sent_at TIMESTAMP;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS invoice_viewed_at TIMESTAMP;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS invoice_paid_at TIMESTAMP;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS square_invoice_amount DECIMAL(10, 2);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS square_paid_amount DECIMAL(10, 2);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_orders_square_invoice_id ON orders(square_invoice_id);
CREATE INDEX IF NOT EXISTS idx_orders_square_payment_status ON orders(square_payment_status);
CREATE INDEX IF NOT EXISTS idx_orders_square_customer_id ON orders(square_customer_id);

-- Create webhook events table for logging Square webhooks
CREATE TABLE IF NOT EXISTS webhook_events (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    type VARCHAR(100) NOT NULL,
    payload JSONB NOT NULL,
    processed BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    processed_at TIMESTAMP
);

-- Create index for webhook events
CREATE INDEX IF NOT EXISTS idx_webhook_events_type ON webhook_events(type);
CREATE INDEX IF NOT EXISTS idx_webhook_events_processed ON webhook_events(processed);
CREATE INDEX IF NOT EXISTS idx_webhook_events_created_at ON webhook_events(created_at DESC);

-- Create payment events table for tracking payment history
CREATE TABLE IF NOT EXISTS payment_events (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    invoice_id VARCHAR(255) NOT NULL,
    payment_id VARCHAR(255),
    amount DECIMAL(10, 2),
    status VARCHAR(50),
    error_message TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for payment events
CREATE INDEX IF NOT EXISTS idx_payment_events_invoice_id ON payment_events(invoice_id);
CREATE INDEX IF NOT EXISTS idx_payment_events_created_at ON payment_events(created_at DESC);

-- Add comments for documentation
COMMENT ON COLUMN orders.square_invoice_id IS 'Square invoice ID for this order';
COMMENT ON COLUMN orders.square_customer_id IS 'Square customer ID associated with this order';
COMMENT ON COLUMN orders.square_payment_status IS 'Current payment status from Square (DRAFT, SENT, VIEWED, PARTIALLY_PAID, PAID, CANCELED)';
COMMENT ON COLUMN orders.payment_link IS 'Public URL for customer to view and pay the invoice';
COMMENT ON COLUMN orders.invoice_sent_at IS 'Timestamp when invoice was sent to customer';
COMMENT ON COLUMN orders.invoice_viewed_at IS 'Timestamp when customer first viewed the invoice';
COMMENT ON COLUMN orders.invoice_paid_at IS 'Timestamp when invoice was fully paid';
COMMENT ON COLUMN orders.square_invoice_amount IS 'Total invoice amount in Square';
COMMENT ON COLUMN orders.square_paid_amount IS 'Amount paid so far for partial payments';

-- Create a function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to automatically update updated_at on orders table if not exists
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_orders_updated_at') THEN
        CREATE TRIGGER update_orders_updated_at 
        BEFORE UPDATE ON orders 
        FOR EACH ROW 
        EXECUTE FUNCTION update_updated_at_column();
    END IF;
END $$;