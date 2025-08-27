-- Update Order Status from Pending to Scheduled
-- This script removes the 'pending' status and makes 'scheduled' the default

-- Step 1: Update check constraints first to allow the new status values

-- Drop existing check constraints
ALTER TABLE orders DROP CONSTRAINT IF EXISTS orders_status_check;
ALTER TABLE order_services DROP CONSTRAINT IF EXISTS order_services_status_check;

-- Add new check constraints without 'pending' for orders, and with 'confirmed' as default for order_services
ALTER TABLE orders ADD CONSTRAINT orders_status_check 
    CHECK (status = ANY (ARRAY['scheduled'::text, 'on_way'::text, 'in_progress'::text, 'delivered'::text, 'on_way_pickup'::text, 'picked_up'::text, 'completed'::text, 'cancelled'::text]));

ALTER TABLE order_services ADD CONSTRAINT order_services_status_check 
    CHECK (status = ANY (ARRAY['confirmed'::text, 'in_progress'::text, 'completed'::text, 'cancelled'::text]));

-- Step 2: Update all existing pending orders to scheduled
UPDATE orders SET status = 'scheduled' WHERE status = 'pending';

-- Step 3: Update all existing pending order services to confirmed (since 'scheduled' is not valid for order_services)
UPDATE order_services SET status = 'confirmed' WHERE status = 'pending';

-- Step 4: Update the default values
ALTER TABLE orders ALTER COLUMN status SET DEFAULT 'scheduled';
ALTER TABLE order_services ALTER COLUMN status SET DEFAULT 'confirmed';

-- Verify the changes
SELECT 'Orders by status:' as info;
SELECT status, COUNT(*) as count FROM orders GROUP BY status ORDER BY status;

SELECT 'Order services by status:' as info;
SELECT status, COUNT(*) as count FROM order_services GROUP BY status ORDER BY status;

-- Check the new default values
SELECT 'Current default values:' as info;
SELECT 
    table_name, 
    column_name, 
    column_default 
FROM information_schema.columns 
WHERE table_name IN ('orders', 'order_services') 
    AND column_name = 'status';