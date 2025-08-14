-- Add dropoff_time field to orders table
ALTER TABLE orders ADD COLUMN IF NOT EXISTS dropoff_time TIME;
