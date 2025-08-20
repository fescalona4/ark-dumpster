-- Migration to add dumpster tracking fields for completed orders
-- This allows us to keep a record of which dumpster was used for each completed order
-- even after the dumpster has been freed for new assignments

-- Add columns to store completed order dumpster information
ALTER TABLE orders ADD COLUMN completed_with_dumpster_id uuid;
ALTER TABLE orders ADD COLUMN completed_with_dumpster_name text;

-- Add foreign key constraint to reference dumpsters table
ALTER TABLE orders ADD CONSTRAINT fk_completed_dumpster 
  FOREIGN KEY (completed_with_dumpster_id) REFERENCES dumpsters(id) ON DELETE SET NULL;

-- Add index for better query performance
CREATE INDEX idx_orders_completed_dumpster_id ON orders(completed_with_dumpster_id);

-- Add comments to document the new columns
COMMENT ON COLUMN orders.completed_with_dumpster_id IS 'ID of the dumpster that was used when this order was completed (preserved for historical tracking)';
COMMENT ON COLUMN orders.completed_with_dumpster_name IS 'Name of the dumpster that was used when this order was completed (for easy display without joins)';

-- Note: These fields will only be populated when an order status changes to 'completed'
-- The dumpster itself will be freed (status='available', current_order_id=null) for new assignments