-- Add dropoff_time field to quotes table
ALTER TABLE quotes ADD COLUMN IF NOT EXISTS dropoff_time TIME;
