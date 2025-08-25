-- ============================================
-- UPDATE DUMPSTER STATUS MIGRATION
-- ============================================
-- This migration updates the dumpster status system from:
-- 'available', 'assigned', 'in_transit', 'maintenance', 'out_of_service'
-- To simplified: 'available', 'in_use'
-- ============================================

-- Step 1: Drop ALL possible constraint variations that might exist FIRST
-- This allows us to update the status values without constraint conflicts
ALTER TABLE dumpsters DROP CONSTRAINT IF EXISTS dumpsters_status_check;
ALTER TABLE dumpsters DROP CONSTRAINT IF EXISTS check_status;
ALTER TABLE dumpsters DROP CONSTRAINT IF EXISTS dumpster_status_check;

-- Step 2: Update any existing 'assigned' status to 'in_use'
-- (This preserves the current meaning since 'assigned' means actively being used)
UPDATE dumpsters 
SET status = 'in_use' 
WHERE status = 'assigned';

-- Step 3: Update any other old statuses to 'available' as fallback
-- This handles cases where dumpsters might have been set to maintenance, etc.
UPDATE dumpsters 
SET status = 'available' 
WHERE status NOT IN ('available', 'in_use');

-- Step 4: Add new constraint with only the two allowed values
ALTER TABLE dumpsters 
ADD CONSTRAINT dumpsters_status_check 
CHECK (status IN ('available', 'in_use'));

-- Verification query (optional - comment out if running via script)
-- SELECT status, COUNT(*) 
-- FROM dumpsters 
-- GROUP BY status 
-- ORDER BY status;