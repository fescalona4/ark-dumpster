-- Add dumpster_id column to orders table for tracking assigned dumpsters
ALTER TABLE orders 
ADD COLUMN IF NOT EXISTS dumpster_id uuid REFERENCES dumpsters(id) ON DELETE SET NULL;

-- Add index for better query performance
CREATE INDEX IF NOT EXISTS idx_orders_dumpster_id ON orders(dumpster_id);

-- Add comment to column
COMMENT ON COLUMN orders.dumpster_id IS 'Reference to the assigned dumpster for this order';