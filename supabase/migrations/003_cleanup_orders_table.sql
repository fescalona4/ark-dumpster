-- ============================================
-- MIGRATION: Clean Up Orders Table Structure
-- ============================================
-- This migration removes the old single-dumpster columns from the orders
-- table since we now use the new multi-service structure
-- ============================================

-- ============================================
-- 1. VERIFY MIGRATION COMPLETED SUCCESSFULLY
-- ============================================

DO $$
DECLARE
    total_orders INTEGER;
    orders_with_services INTEGER;
    unmigrated_orders INTEGER;
BEGIN
    SELECT COUNT(*) INTO total_orders FROM orders;
    SELECT COUNT(DISTINCT order_id) INTO orders_with_services FROM order_services;
    
    unmigrated_orders := total_orders - orders_with_services;
    
    RAISE NOTICE 'Pre-cleanup verification:';
    RAISE NOTICE '- Total orders: %', total_orders;
    RAISE NOTICE '- Orders with services: %', orders_with_services;
    RAISE NOTICE '- Unmigrated orders: %', unmigrated_orders;
    
    IF unmigrated_orders > 0 THEN
        RAISE EXCEPTION 'Cannot proceed with cleanup: % orders have not been migrated to services', unmigrated_orders;
    ELSE
        RAISE NOTICE '✅ All orders have been migrated. Safe to proceed with cleanup.';
    END IF;
END;
$$;

-- ============================================
-- 2. CREATE BACKUP COLUMNS (OPTIONAL - FOR SAFETY)
-- ============================================

-- Add backup columns to preserve old data temporarily
ALTER TABLE orders ADD COLUMN IF NOT EXISTS backup_dumpster_size TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS backup_dumpster_id UUID;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS backup_dropoff_date DATE;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS backup_dropoff_time TIME;

-- Copy current data to backup columns
UPDATE orders SET 
    backup_dumpster_size = dumpster_size,
    backup_dumpster_id = dumpster_id,
    backup_dropoff_date = dropoff_date,
    backup_dropoff_time = dropoff_time,
    updated_at = NOW()
WHERE backup_dumpster_size IS NULL;

-- ============================================
-- 3. REMOVE OLD SINGLE-SERVICE COLUMNS
-- ============================================

-- Drop foreign key constraints first
ALTER TABLE orders DROP CONSTRAINT IF EXISTS orders_dumpster_id_fkey;
ALTER TABLE orders DROP CONSTRAINT IF EXISTS fk_completed_dumpster;

-- Drop indexes on columns we're removing
DROP INDEX IF EXISTS idx_orders_dumpster_id;

-- Remove the old single-service columns
ALTER TABLE orders DROP COLUMN IF EXISTS dumpster_size CASCADE;
ALTER TABLE orders DROP COLUMN IF EXISTS dumpster_id CASCADE;
ALTER TABLE orders DROP COLUMN IF EXISTS completed_with_dumpster_id CASCADE;
ALTER TABLE orders DROP COLUMN IF EXISTS completed_with_dumpster_name CASCADE;
ALTER TABLE orders DROP COLUMN IF EXISTS dropoff_date CASCADE;
ALTER TABLE orders DROP COLUMN IF EXISTS dropoff_time CASCADE;
ALTER TABLE orders DROP COLUMN IF EXISTS time_needed CASCADE;

-- ============================================
-- 4. ADD NEW MULTI-SERVICE SUMMARY COLUMNS
-- ============================================

-- Add computed columns for quick access to service information
ALTER TABLE orders ADD COLUMN IF NOT EXISTS service_count INTEGER DEFAULT 0;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS total_service_amount DECIMAL(10,2) DEFAULT 0;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS has_multiple_services BOOLEAN DEFAULT FALSE;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS primary_service_type VARCHAR(100);

-- ============================================
-- 5. CREATE FUNCTION TO UPDATE SERVICE SUMMARY
-- ============================================

CREATE OR REPLACE FUNCTION update_order_service_summary()
RETURNS TRIGGER AS $$
DECLARE
    order_rec RECORD;
BEGIN
    -- Handle both INSERT/UPDATE/DELETE by getting the order_id
    IF TG_OP = 'DELETE' THEN
        order_rec.order_id := OLD.order_id;
    ELSE
        order_rec.order_id := NEW.order_id;
    END IF;
    
    -- Update the order summary
    UPDATE orders SET
        service_count = (
            SELECT COUNT(*) 
            FROM order_services os 
            WHERE os.order_id = order_rec.order_id
        ),
        total_service_amount = (
            SELECT COALESCE(SUM(os.total_price), 0) 
            FROM order_services os 
            WHERE os.order_id = order_rec.order_id
        ),
        has_multiple_services = (
            SELECT COUNT(*) > 1 
            FROM order_services os 
            WHERE os.order_id = order_rec.order_id
        ),
        primary_service_type = (
            SELECT sc.name
            FROM order_services os
            INNER JOIN services s ON s.id = os.service_id
            INNER JOIN service_categories sc ON sc.id = s.category_id
            WHERE os.order_id = order_rec.order_id
            ORDER BY os.created_at
            LIMIT 1
        ),
        updated_at = NOW()
    WHERE id = order_rec.order_id;
    
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Create trigger to maintain service summary
DROP TRIGGER IF EXISTS update_order_service_summary_trigger ON order_services;
CREATE TRIGGER update_order_service_summary_trigger
    AFTER INSERT OR UPDATE OR DELETE ON order_services
    FOR EACH ROW EXECUTE FUNCTION update_order_service_summary();

-- ============================================
-- 6. POPULATE INITIAL SERVICE SUMMARY DATA
-- ============================================

UPDATE orders SET
    service_count = subq.service_count,
    total_service_amount = subq.total_amount,
    has_multiple_services = subq.has_multiple_services,
    primary_service_type = subq.primary_service_type,
    updated_at = NOW()
FROM (
    SELECT 
        o.id,
        COUNT(os.id) as service_count,
        COALESCE(SUM(os.total_price), 0) as total_amount,
        COUNT(os.id) > 1 as has_multiple_services,
        (
            SELECT sc.name
            FROM order_services os2
            INNER JOIN services s2 ON s2.id = os2.service_id
            INNER JOIN service_categories sc ON sc.id = s2.category_id
            WHERE os2.order_id = o.id
            ORDER BY os2.created_at
            LIMIT 1
        ) as primary_service_type
    FROM orders o
    LEFT JOIN order_services os ON os.order_id = o.id
    GROUP BY o.id
) subq
WHERE orders.id = subq.id;

-- ============================================
-- 7. UPDATE EXISTING VIEWS AND FUNCTIONS
-- ============================================

-- Update the order summary view to remove old columns
CREATE OR REPLACE VIEW order_summary_with_services AS
SELECT 
    o.id,
    o.order_number,
    o.first_name,
    o.last_name,
    o.email,
    o.phone,
    o.address,
    o.address2,
    o.city,
    o.state,
    o.zip_code,
    o.status as order_status,
    o.priority,
    o.assigned_to,
    o.quoted_price,
    o.final_price,
    
    -- New service summary columns
    o.service_count,
    o.total_service_amount,
    o.has_multiple_services,
    o.primary_service_type,
    
    -- Scheduling info (from services)
    MIN(os.service_date) as earliest_service_date,
    MAX(os.end_date) as latest_service_end_date,
    
    -- Service details
    STRING_AGG(DISTINCT s.display_name, ', ' ORDER BY s.display_name) as services_summary,
    STRING_AGG(DISTINCT d.name, ', ' ORDER BY d.name) as assigned_dumpsters,
    
    -- Status aggregation
    CASE 
        WHEN COUNT(os.id) = 0 THEN 'no_services'
        WHEN COUNT(os.id) = COUNT(CASE WHEN os.status = 'completed' THEN 1 END) THEN 'all_completed'
        WHEN COUNT(CASE WHEN os.status = 'in_progress' THEN 1 END) > 0 THEN 'in_progress'
        WHEN COUNT(CASE WHEN os.status = 'confirmed' THEN 1 END) > 0 THEN 'confirmed'
        ELSE 'pending'
    END as services_status,
    
    -- Timestamps
    o.created_at,
    o.updated_at,
    o.completed_at
    
FROM orders o
LEFT JOIN order_services os ON os.order_id = o.id
LEFT JOIN services s ON s.id = os.service_id
LEFT JOIN order_dumpsters od ON od.order_service_id = os.id
LEFT JOIN dumpsters d ON d.id = od.dumpster_id
GROUP BY o.id, o.order_number, o.first_name, o.last_name, o.email, o.phone, 
         o.address, o.address2, o.city, o.state, o.zip_code, o.status, o.priority, 
         o.assigned_to, o.quoted_price, o.final_price, o.service_count, 
         o.total_service_amount, o.has_multiple_services, o.primary_service_type,
         o.created_at, o.updated_at, o.completed_at;

-- ============================================
-- 8. CREATE NEW HELPER FUNCTIONS
-- ============================================

-- Function to add a service to an existing order
CREATE OR REPLACE FUNCTION add_service_to_order(
    p_order_id UUID,
    p_service_id UUID,
    p_quantity DECIMAL(10,2) DEFAULT 1,
    p_custom_price DECIMAL(10,2) DEFAULT NULL,
    p_service_date DATE DEFAULT NULL,
    p_notes TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
    new_order_service_id UUID;
    service_price DECIMAL(10,2);
BEGIN
    -- Get service price if not provided
    IF p_custom_price IS NULL THEN
        SELECT base_price INTO service_price
        FROM services
        WHERE id = p_service_id;
    ELSE
        service_price := p_custom_price;
    END IF;
    
    -- Insert the new order service
    INSERT INTO order_services (
        order_id,
        service_id,
        quantity,
        unit_price,
        total_price,
        service_date,
        notes,
        status
    ) VALUES (
        p_order_id,
        p_service_id,
        p_quantity,
        service_price,
        p_quantity * service_price,
        p_service_date,
        p_notes,
        'pending'
    ) RETURNING id INTO new_order_service_id;
    
    RETURN new_order_service_id;
END;
$$ LANGUAGE plpgsql;

-- Function to get order details with all services
CREATE OR REPLACE FUNCTION get_order_with_services(p_order_id UUID)
RETURNS TABLE (
    order_id UUID,
    order_number TEXT,
    customer_name TEXT,
    order_status TEXT,
    service_id UUID,
    service_name TEXT,
    service_category TEXT,
    quantity DECIMAL(10,2),
    unit_price DECIMAL(10,2),
    total_price DECIMAL(10,2),
    service_status TEXT,
    service_date DATE,
    dumpster_name TEXT,
    dumpster_status TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        o.id,
        o.order_number,
        o.first_name || ' ' || COALESCE(o.last_name, ''),
        o.status,
        s.id,
        s.display_name,
        sc.display_name,
        os.quantity,
        os.unit_price,
        os.total_price,
        os.status,
        os.service_date,
        d.name,
        od.status
    FROM orders o
    LEFT JOIN order_services os ON os.order_id = o.id
    LEFT JOIN services s ON s.id = os.service_id
    LEFT JOIN service_categories sc ON sc.id = s.category_id
    LEFT JOIN order_dumpsters od ON od.order_service_id = os.id
    LEFT JOIN dumpsters d ON d.id = od.dumpster_id
    WHERE o.id = p_order_id
    ORDER BY os.created_at;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- 9. CREATE INDEXES FOR PERFORMANCE
-- ============================================

-- Indexes on new summary columns
CREATE INDEX IF NOT EXISTS idx_orders_service_count ON orders(service_count);
CREATE INDEX IF NOT EXISTS idx_orders_has_multiple_services ON orders(has_multiple_services);
CREATE INDEX IF NOT EXISTS idx_orders_primary_service_type ON orders(primary_service_type);
CREATE INDEX IF NOT EXISTS idx_orders_total_service_amount ON orders(total_service_amount);

-- ============================================
-- 10. FINAL VALIDATION
-- ============================================

DO $$
DECLARE
    orders_with_services INTEGER;
    orders_with_summary INTEGER;
    total_orders INTEGER;
    avg_services_per_order DECIMAL(5,2);
    orders_with_multiple_services INTEGER;
BEGIN
    SELECT COUNT(*) INTO total_orders FROM orders;
    
    SELECT COUNT(DISTINCT order_id) INTO orders_with_services 
    FROM order_services;
    
    SELECT COUNT(*) INTO orders_with_summary 
    FROM orders 
    WHERE service_count > 0;
    
    SELECT ROUND(AVG(service_count), 2) INTO avg_services_per_order 
    FROM orders 
    WHERE service_count > 0;
    
    SELECT COUNT(*) INTO orders_with_multiple_services 
    FROM orders 
    WHERE has_multiple_services = true;
    
    RAISE NOTICE '';
    RAISE NOTICE '======================================';
    RAISE NOTICE 'CLEANUP AND SETUP COMPLETE';
    RAISE NOTICE '======================================';
    RAISE NOTICE 'Total orders: %', total_orders;
    RAISE NOTICE 'Orders with services: %', orders_with_services;
    RAISE NOTICE 'Orders with summary data: %', orders_with_summary;
    RAISE NOTICE 'Average services per order: %', avg_services_per_order;
    RAISE NOTICE 'Orders with multiple services: %', orders_with_multiple_services;
    RAISE NOTICE '';
    
    IF orders_with_services = total_orders AND orders_with_summary = total_orders THEN
        RAISE NOTICE '✅ SUCCESS: All orders properly configured for multi-service model!';
    ELSE
        RAISE WARNING '⚠️ Some orders may need attention';
    END IF;
    
    RAISE NOTICE '';
    RAISE NOTICE 'Your database is now ready for multi-service orders!';
    RAISE NOTICE 'You can now:';
    RAISE NOTICE '- Add multiple services to any order';
    RAISE NOTICE '- Track dumpsters, tree services, and extra charges';
    RAISE NOTICE '- Generate detailed invoices with line items';
    RAISE NOTICE '======================================';
END;
$$;

-- ============================================
-- 11. COMMENTS AND DOCUMENTATION
-- ============================================

COMMENT ON COLUMN orders.service_count IS 'Cached count of services for this order';
COMMENT ON COLUMN orders.total_service_amount IS 'Cached total amount of all services';
COMMENT ON COLUMN orders.has_multiple_services IS 'True if order has more than one service';
COMMENT ON COLUMN orders.primary_service_type IS 'Category of the first/primary service';

COMMENT ON FUNCTION add_service_to_order(UUID, UUID, DECIMAL, DECIMAL, DATE, TEXT) IS 'Add a new service to an existing order';
COMMENT ON FUNCTION get_order_with_services(UUID) IS 'Get complete order details including all services and dumpsters';
COMMENT ON FUNCTION update_order_service_summary() IS 'Trigger function to maintain order service summary columns';

-- Show final structure
\d orders;

-- ============================================
-- END OF CLEANUP MIGRATION
-- ============================================