-- Migration to add "on_way" and "on_way_pickup" statuses to orders table
-- Run this if you already have the orders table created

-- Drop the existing check constraint
ALTER TABLE orders DROP CONSTRAINT IF EXISTS orders_status_check;

-- Add the new check constraint with "on_way" and "on_way_pickup" statuses
ALTER TABLE orders ADD CONSTRAINT orders_status_check 
  CHECK (status IN ('pending', 'scheduled', 'on_way', 'in_progress', 'delivered', 'on_way_pickup', 'picked_up', 'completed', 'cancelled'));

-- Update any existing orders if needed (optional)
-- UPDATE orders SET status = 'scheduled' WHERE status = 'pending' AND scheduled_delivery_date IS NOT NULL;
