-- ============================================
-- MIGRATION: Migrate Existing Orders to Service Model (FIXED)
-- ============================================
-- This migration converts existing orders from the single-dumpster
-- model to the new multi-service model while preserving all data
-- ============================================

-- ============================================
-- 1. FIRST, LET'S SEE WHAT WE'RE WORKING WITH
-- ============================================

-- Check what dumpster sizes exist in current orders
DO $$
DECLARE
    rec RECORD;
BEGIN
    RAISE NOTICE 'Current dumpster sizes in orders:';
    FOR rec IN 
        SELECT dumpster_size, COUNT(*) as count 
        FROM orders 
        WHERE dumpster_size IS NOT NULL 
        GROUP BY dumpster_size 
        ORDER BY count DESC
    LOOP
        RAISE NOTICE '- %: % orders', rec.dumpster_size, rec.count;
    END LOOP;
    
    RAISE NOTICE 'Orders without dumpster_size: %', (
        SELECT COUNT(*) FROM orders WHERE dumpster_size IS NULL
    );
END;
$$;

-- ============================================
-- 2. CREATE MISSING SERVICES FOR EXISTING DUMPSTER SIZES
-- ============================================

-- Insert any missing dumpster services based on existing order data
INSERT INTO services (
    category_id,
    sku,
    name,
    display_name,
    description,
    base_price,
    price_type,
    dumpster_size,
    included_days,
    extra_day_price,
    included_weight_tons,
    extra_weight_price_per_ton,
    requires_scheduling,
    sort_order,
    is_active
)
SELECT 
    sc.id as category_id,
    'DUMP-' || UPPER(REPLACE(REPLACE(o.dumpster_size, '-yard', ''), ' yard', '')) as sku,
    LOWER(REPLACE(o.dumpster_size, ' ', '-')) || '-dumpster' as name,
    o.dumpster_size || ' Dumpster' as display_name,
    'Dumpster rental service for ' || o.dumpster_size || ' containers' as description,
    CASE 
        WHEN o.dumpster_size LIKE '%10%' THEN 350.00
        WHEN o.dumpster_size LIKE '%15%' THEN 425.00
        WHEN o.dumpster_size LIKE '%20%' THEN 500.00
        WHEN o.dumpster_size LIKE '%30%' THEN 625.00
        ELSE 500.00
    END as base_price,
    'weekly' as price_type,
    o.dumpster_size,
    7 as included_days,
    CASE 
        WHEN o.dumpster_size LIKE '%10%' THEN 15.00
        WHEN o.dumpster_size LIKE '%15%' THEN 20.00
        WHEN o.dumpster_size LIKE '%20%' THEN 25.00
        WHEN o.dumpster_size LIKE '%30%' THEN 30.00
        ELSE 25.00
    END as extra_day_price,
    CASE 
        WHEN o.dumpster_size LIKE '%10%' THEN 2.0
        WHEN o.dumpster_size LIKE '%15%' THEN 3.0
        WHEN o.dumpster_size LIKE '%20%' THEN 4.0
        WHEN o.dumpster_size LIKE '%30%' THEN 5.0
        ELSE 4.0
    END as included_weight_tons,
    75.00 as extra_weight_price_per_ton,
    true as requires_scheduling,
    CASE 
        WHEN o.dumpster_size LIKE '%10%' THEN 1
        WHEN o.dumpster_size LIKE '%15%' THEN 2
        WHEN o.dumpster_size LIKE '%20%' THEN 3
        WHEN o.dumpster_size LIKE '%30%' THEN 4
        ELSE 5
    END as sort_order,
    true as is_active
FROM (
    SELECT DISTINCT dumpster_size 
    FROM orders 
    WHERE dumpster_size IS NOT NULL
    AND dumpster_size NOT IN (
        SELECT DISTINCT dumpster_size 
        FROM services 
        WHERE dumpster_size IS NOT NULL
    )
) o
CROSS JOIN service_categories sc
WHERE sc.name = 'dumpster_rental'
ON CONFLICT (sku) DO NOTHING;

-- Create a default "General Service" for orders without specific dumpster sizes
INSERT INTO services (
    category_id,
    sku,
    name,
    display_name,
    description,
    base_price,
    price_type,
    requires_scheduling,
    sort_order,
    is_active
)
SELECT 
    sc.id,
    'GENERAL-SERVICE',
    'general-service',
    'General Dumpster Service',
    'General dumpster rental service (legacy orders)',
    500.00,
    'fixed',
    true,
    99,
    true
FROM service_categories sc
WHERE sc.name = 'dumpster_rental'
ON CONFLICT (sku) DO NOTHING;

-- ============================================
-- 3. MIGRATE EXISTING ORDERS TO ORDER_SERVICES
-- ============================================

-- First, migrate orders with specific dumpster sizes
INSERT INTO order_services (
    order_id,
    service_id,
    quantity,
    unit_price,
    total_price,
    service_date,
    start_date,
    end_date,
    status,
    notes,
    driver_notes,
    metadata,
    created_at,
    updated_at
)
SELECT 
    o.id AS order_id,
    s.id AS service_id,
    1 AS quantity,
    COALESCE(o.quoted_price, o.final_price, s.base_price) AS unit_price,
    COALESCE(o.quoted_price, o.final_price, s.base_price) AS total_price,
    COALESCE(o.scheduled_delivery_date, o.dropoff_date) AS service_date,
    COALESCE(o.scheduled_delivery_date, o.dropoff_date) AS start_date,
    o.scheduled_pickup_date AS end_date,
    CASE 
        WHEN o.status = 'pending' THEN 'pending'
        WHEN o.status = 'scheduled' THEN 'confirmed'
        WHEN o.status = 'on_way' THEN 'in_progress'
        WHEN o.status IN ('delivered', 'on_way_pickup', 'picked_up') THEN 'in_progress'
        WHEN o.status = 'completed' THEN 'completed'
        WHEN o.status = 'cancelled' THEN 'cancelled'
        ELSE 'pending'
    END AS status,
    o.internal_notes AS notes,
    o.driver_notes,
    jsonb_build_object(
        'legacy_order', true,
        'original_dumpster_size', o.dumpster_size,
        'delivery_address', CONCAT_WS(', ', 
            NULLIF(o.address, ''), 
            NULLIF(o.address2, ''), 
            NULLIF(o.city, ''), 
            NULLIF(o.state, ''), 
            NULLIF(o.zip_code, '')
        ),
        'dropoff_time', o.dropoff_time,
        'time_needed', o.time_needed,
        'customer_message', o.message
    ) AS metadata,
    o.created_at,
    o.updated_at
FROM orders o
INNER JOIN services s ON s.dumpster_size = o.dumpster_size
INNER JOIN service_categories sc ON sc.id = s.category_id AND sc.name = 'dumpster_rental'
WHERE o.dumpster_size IS NOT NULL
AND NOT EXISTS (
    SELECT 1 FROM order_services os WHERE os.order_id = o.id
);

-- Then, migrate orders without specific dumpster sizes to general service
INSERT INTO order_services (
    order_id,
    service_id,
    quantity,
    unit_price,
    total_price,
    service_date,
    start_date,
    end_date,
    status,
    notes,
    driver_notes,
    metadata,
    created_at,
    updated_at
)
SELECT 
    o.id AS order_id,
    s.id AS service_id,
    1 AS quantity,
    COALESCE(o.quoted_price, o.final_price, s.base_price) AS unit_price,
    COALESCE(o.quoted_price, o.final_price, s.base_price) AS total_price,
    COALESCE(o.scheduled_delivery_date, o.dropoff_date) AS service_date,
    COALESCE(o.scheduled_delivery_date, o.dropoff_date) AS start_date,
    o.scheduled_pickup_date AS end_date,
    CASE 
        WHEN o.status = 'pending' THEN 'pending'
        WHEN o.status = 'scheduled' THEN 'confirmed'
        WHEN o.status = 'on_way' THEN 'in_progress'
        WHEN o.status IN ('delivered', 'on_way_pickup', 'picked_up') THEN 'in_progress'
        WHEN o.status = 'completed' THEN 'completed'
        WHEN o.status = 'cancelled' THEN 'cancelled'
        ELSE 'pending'
    END AS status,
    o.internal_notes AS notes,
    o.driver_notes,
    jsonb_build_object(
        'legacy_order', true,
        'no_original_size', true,
        'estimated_size', '20-yard',
        'delivery_address', CONCAT_WS(', ', 
            NULLIF(o.address, ''), 
            NULLIF(o.address2, ''), 
            NULLIF(o.city, ''), 
            NULLIF(o.state, ''), 
            NULLIF(o.zip_code, '')
        ),
        'dropoff_time', o.dropoff_time,
        'time_needed', o.time_needed,
        'customer_message', o.message
    ) AS metadata,
    o.created_at,
    o.updated_at
FROM orders o
INNER JOIN services s ON s.sku = 'GENERAL-SERVICE'
WHERE (o.dumpster_size IS NULL OR o.dumpster_size = '')
AND NOT EXISTS (
    SELECT 1 FROM order_services os WHERE os.order_id = o.id
);

-- ============================================
-- 4. MIGRATE DUMPSTER ASSIGNMENTS
-- ============================================

INSERT INTO order_dumpsters (
    order_service_id,
    dumpster_id,
    order_id,
    status,
    assigned_at,
    delivered_at,
    scheduled_pickup_date,
    actual_pickup_date,
    delivery_address,
    delivery_notes,
    pickup_notes,
    created_at,
    updated_at
)
SELECT 
    os.id AS order_service_id,
    o.dumpster_id,
    o.id AS order_id,
    CASE 
        WHEN o.status IN ('pending', 'scheduled') THEN 'assigned'
        WHEN o.status IN ('on_way', 'delivered', 'on_way_pickup') THEN 'delivered'
        WHEN o.status = 'picked_up' THEN 'picked_up'
        WHEN o.status = 'completed' THEN 'returned'
        ELSE 'assigned'
    END AS status,
    COALESCE(o.created_at, NOW()) AS assigned_at,
    o.actual_delivery_date AS delivered_at,
    o.scheduled_pickup_date,
    o.actual_pickup_date,
    CONCAT_WS(', ', 
        NULLIF(o.address, ''), 
        NULLIF(o.address2, ''), 
        NULLIF(o.city, ''), 
        NULLIF(o.state, ''), 
        NULLIF(o.zip_code, '')
    ) AS delivery_address,
    o.internal_notes AS delivery_notes,
    o.driver_notes AS pickup_notes,
    o.created_at,
    o.updated_at
FROM orders o
INNER JOIN order_services os ON os.order_id = o.id
WHERE o.dumpster_id IS NOT NULL
AND NOT EXISTS (
    SELECT 1 FROM order_dumpsters od 
    WHERE od.order_id = o.id AND od.dumpster_id = o.dumpster_id
);

-- ============================================
-- 5. UPDATE PAYMENT LINE ITEMS
-- ============================================

-- Create payment line items for migrated order services
INSERT INTO payment_line_items (
    payment_id,
    name,
    description,
    quantity,
    unit_price,
    total_price,
    category,
    metadata,
    created_at,
    updated_at
)
SELECT 
    p.id AS payment_id,
    s.display_name AS name,
    CONCAT(s.display_name, ' - Order ', o.order_number) AS description,
    os.quantity,
    (os.unit_price * 100)::BIGINT AS unit_price, -- Convert to cents
    (os.total_price * 100)::BIGINT AS total_price, -- Convert to cents
    'dumpster_rental' AS category,
    jsonb_build_object(
        'order_service_id', os.id,
        'service_id', os.service_id,
        'migrated_from_legacy', true,
        'original_order_id', o.id
    ) AS metadata,
    COALESCE(os.created_at, p.created_at, NOW()) AS created_at,
    COALESCE(os.updated_at, p.updated_at, NOW()) AS updated_at
FROM payments p
INNER JOIN orders o ON p.order_id = o.id
INNER JOIN order_services os ON os.order_id = o.id
INNER JOIN services s ON s.id = os.service_id
WHERE NOT EXISTS (
    SELECT 1 FROM payment_line_items pli 
    WHERE pli.payment_id = p.id 
    AND pli.metadata->>'order_service_id' = os.id::text
);

-- ============================================
-- 6. CLEAN UP DUMPSTER REFERENCES
-- ============================================

-- Clear current_order_id from dumpsters (now tracked via order_dumpsters)
UPDATE dumpsters 
SET current_order_id = NULL,
    updated_at = NOW()
WHERE current_order_id IS NOT NULL;

-- ============================================
-- 7. CREATE HELPER FUNCTIONS
-- ============================================

-- Function to get order service summary
CREATE OR REPLACE FUNCTION get_order_service_summary(order_uuid UUID)
RETURNS TABLE (
    service_count INTEGER,
    total_amount DECIMAL(10,2),
    dumpster_count INTEGER,
    has_additional_services BOOLEAN
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(os.id)::INTEGER as service_count,
        COALESCE(SUM(os.total_price), 0) as total_amount,
        COUNT(od.id)::INTEGER as dumpster_count,
        EXISTS(
            SELECT 1 FROM order_services os2 
            INNER JOIN services s2 ON s2.id = os2.service_id 
            INNER JOIN service_categories sc2 ON sc2.id = s2.category_id 
            WHERE os2.order_id = order_uuid 
            AND sc2.name != 'dumpster_rental'
        ) as has_additional_services
    FROM order_services os
    LEFT JOIN order_dumpsters od ON od.order_service_id = os.id
    WHERE os.order_id = order_uuid;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- 8. CREATE UPDATED VIEWS
-- ============================================

-- Enhanced order view with services
CREATE OR REPLACE VIEW order_summary_with_services AS
SELECT 
    o.id,
    o.order_number,
    o.first_name,
    o.last_name,
    o.email,
    o.phone,
    o.address,
    o.city,
    o.state,
    o.zip_code,
    o.status as order_status,
    o.priority,
    o.assigned_to,
    o.created_at,
    o.updated_at,
    
    -- Service aggregations
    COUNT(os.id) as service_count,
    COALESCE(SUM(os.total_price), 0) as total_service_amount,
    COUNT(od.id) as dumpster_count,
    
    -- Service details
    STRING_AGG(DISTINCT s.display_name, ', ' ORDER BY s.display_name) as services_summary,
    STRING_AGG(DISTINCT d.name, ', ' ORDER BY d.name) as assigned_dumpsters,
    
    -- Service status
    CASE 
        WHEN COUNT(os.id) = 0 THEN 'no_services'
        WHEN COUNT(os.id) = COUNT(CASE WHEN os.status = 'completed' THEN 1 END) THEN 'all_completed'
        WHEN COUNT(CASE WHEN os.status = 'in_progress' THEN 1 END) > 0 THEN 'in_progress'
        WHEN COUNT(CASE WHEN os.status = 'confirmed' THEN 1 END) > 0 THEN 'confirmed'
        ELSE 'pending'
    END as services_status,
    
    -- Flags
    CASE WHEN COUNT(os.id) > 1 THEN true ELSE false END as has_multiple_services
    
FROM orders o
LEFT JOIN order_services os ON os.order_id = o.id
LEFT JOIN services s ON s.id = os.service_id
LEFT JOIN order_dumpsters od ON od.order_service_id = os.id
LEFT JOIN dumpsters d ON d.id = od.dumpster_id
GROUP BY o.id, o.order_number, o.first_name, o.last_name, o.email, o.phone, 
         o.address, o.city, o.state, o.zip_code, o.status, o.priority, 
         o.assigned_to, o.created_at, o.updated_at;

-- ============================================
-- 9. VALIDATION AND REPORTING
-- ============================================

DO $$
DECLARE
    total_orders INTEGER;
    migrated_orders INTEGER;
    orders_without_services INTEGER;
    total_services INTEGER;
    total_dumpster_assignments INTEGER;
    payment_line_items_created INTEGER;
BEGIN
    -- Get counts
    SELECT COUNT(*) INTO total_orders FROM orders;
    SELECT COUNT(DISTINCT order_id) INTO migrated_orders FROM order_services;
    SELECT COUNT(*) INTO orders_without_services 
    FROM orders o 
    WHERE NOT EXISTS (SELECT 1 FROM order_services os WHERE os.order_id = o.id);
    SELECT COUNT(*) INTO total_services FROM order_services;
    SELECT COUNT(*) INTO total_dumpster_assignments FROM order_dumpsters;
    SELECT COUNT(*) INTO payment_line_items_created 
    FROM payment_line_items 
    WHERE metadata->>'migrated_from_legacy' = 'true';
    
    -- Report results
    RAISE NOTICE '';
    RAISE NOTICE '======================================';
    RAISE NOTICE 'MIGRATION SUMMARY';
    RAISE NOTICE '======================================';
    RAISE NOTICE 'Total orders in database: %', total_orders;
    RAISE NOTICE 'Orders migrated to services: %', migrated_orders;
    RAISE NOTICE 'Orders without services: %', orders_without_services;
    RAISE NOTICE 'Total order services created: %', total_services;
    RAISE NOTICE 'Dumpster assignments migrated: %', total_dumpster_assignments;
    RAISE NOTICE 'Payment line items created: %', payment_line_items_created;
    RAISE NOTICE '';
    
    IF orders_without_services = 0 THEN
        RAISE NOTICE '✅ SUCCESS: All orders successfully migrated!';
    ELSE
        RAISE WARNING '⚠️  WARNING: % orders were not migrated', orders_without_services;
    END IF;
    
    RAISE NOTICE '======================================';
END;
$$;

-- Show sample of migrated data
DO $$
DECLARE
    rec RECORD;
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE 'SAMPLE OF MIGRATED ORDERS:';
    RAISE NOTICE '======================================';
    
    FOR rec IN 
        SELECT 
            o.order_number,
            o.first_name || ' ' || COALESCE(o.last_name, '') as customer_name,
            s.display_name as service,
            os.quantity,
            os.unit_price,
            os.status as service_status,
            COALESCE(d.name, 'No dumpster') as dumpster
        FROM orders o
        INNER JOIN order_services os ON os.order_id = o.id
        INNER JOIN services s ON s.id = os.service_id
        LEFT JOIN order_dumpsters od ON od.order_service_id = os.id
        LEFT JOIN dumpsters d ON d.id = od.dumpster_id
        ORDER BY o.created_at DESC
        LIMIT 5
    LOOP
        RAISE NOTICE 'Order %: % - % (% @ $%) - Dumpster: %', 
            rec.order_number, 
            rec.customer_name, 
            rec.service, 
            rec.quantity, 
            rec.unit_price, 
            rec.dumpster;
    END LOOP;
    
    RAISE NOTICE '======================================';
END;
$$;

-- ============================================
-- END OF MIGRATION
-- ============================================