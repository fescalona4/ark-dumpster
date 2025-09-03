-- ================================================
-- FIX FOREIGN KEY CASCADE CONSTRAINTS
-- Add ON DELETE CASCADE to order-related foreign keys
-- ================================================

-- Drop and recreate the order_services foreign key with CASCADE
ALTER TABLE order_services 
DROP CONSTRAINT IF EXISTS order_services_order_id_fkey;

ALTER TABLE order_services 
ADD CONSTRAINT order_services_order_id_fkey 
FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE;

-- Drop and recreate the order_dumpsters foreign key with CASCADE
ALTER TABLE order_dumpsters 
DROP CONSTRAINT IF EXISTS order_dumpsters_order_id_fkey;

ALTER TABLE order_dumpsters 
ADD CONSTRAINT order_dumpsters_order_id_fkey 
FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE;

-- Drop and recreate the payments foreign key with CASCADE
ALTER TABLE payments 
DROP CONSTRAINT IF EXISTS payments_order_id_fkey;

ALTER TABLE payments 
ADD CONSTRAINT payments_order_id_fkey 
FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE;

-- Verification - check the constraints
SELECT 
    tc.table_name,
    tc.constraint_name,
    tc.constraint_type,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name,
    rc.delete_rule
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
    AND ccu.table_schema = tc.table_schema
LEFT JOIN information_schema.referential_constraints AS rc
    ON tc.constraint_name = rc.constraint_name
    AND tc.table_schema = rc.constraint_schema
WHERE tc.constraint_type = 'FOREIGN KEY' 
    AND tc.table_schema = 'public'
    AND (tc.table_name IN ('order_services', 'order_dumpsters', 'payments')
         AND ccu.table_name = 'orders')
ORDER BY tc.table_name, tc.constraint_name;

-- Show completion message
DO $$
BEGIN
    RAISE NOTICE 'Foreign key constraints updated successfully!';
    RAISE NOTICE 'Orders can now be deleted and will cascade to related tables.';
END
$$;