-- ============================================
-- MIGRATION: Update Quote Status Constraint
-- ============================================
-- This migration updates the quote status constraint to only allow:
-- pending, completed, cancelled
-- 
-- IMPORTANT: This migration will:
-- 1. Update existing 'quoted' and 'accepted' statuses to 'completed' 
-- 2. Update existing 'declined' status to 'cancelled'
-- 3. Drop and recreate the CHECK constraint
-- ============================================

-- First, update existing data to match new status values
UPDATE quotes 
SET status = 'completed' 
WHERE status IN ('quoted', 'accepted');

UPDATE quotes 
SET status = 'cancelled' 
WHERE status = 'declined';

-- Drop the existing CHECK constraint
-- Note: PostgreSQL names constraints automatically, we need to find the constraint name first
-- The constraint is likely named something like "quotes_status_check"

-- Drop the constraint (we'll handle the case where it might not exist)
DO $$
BEGIN
    -- Try to drop the constraint if it exists
    BEGIN
        ALTER TABLE quotes DROP CONSTRAINT IF EXISTS quotes_status_check;
    EXCEPTION
        WHEN undefined_object THEN
            -- Constraint doesn't exist, that's fine
            NULL;
    END;
    
    -- Also try common variations of the constraint name
    BEGIN
        ALTER TABLE quotes DROP CONSTRAINT IF EXISTS quotes_check;
    EXCEPTION
        WHEN undefined_object THEN
            NULL;
    END;
    
    -- Query to find and drop any check constraint on the status column
    FOR constraint_name IN 
        SELECT conname 
        FROM pg_constraint 
        WHERE conrelid = 'quotes'::regclass 
        AND contype = 'c'
        AND pg_get_constraintdef(oid) LIKE '%status%'
    LOOP
        EXECUTE 'ALTER TABLE quotes DROP CONSTRAINT ' || quote_ident(constraint_name);
    END LOOP;
END $$;

-- Add the new CHECK constraint with updated values
ALTER TABLE quotes 
ADD CONSTRAINT quotes_status_check 
CHECK (status IN ('pending', 'completed', 'cancelled'));

-- Update the table comment to reflect new status values
COMMENT ON COLUMN quotes.status IS 'Quote status: pending, completed, cancelled';

-- Verify the migration worked
DO $$
BEGIN
    -- Check if there are any quotes with invalid statuses
    IF EXISTS (
        SELECT 1 FROM quotes 
        WHERE status NOT IN ('pending', 'completed', 'cancelled')
    ) THEN
        RAISE EXCEPTION 'Migration failed: Found quotes with invalid status values';
    END IF;
    
    RAISE NOTICE 'Quote status constraint migration completed successfully';
END $$;