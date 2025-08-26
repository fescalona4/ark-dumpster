-- ============================================
-- MIGRATION: Migrate Existing Orders to Service Model
-- ============================================
-- This migration converts existing orders from the single-dumpster
-- model to the new multi-service model while preserving all data
-- ============================================

-- ============================================
-- 1. MIGRATE EXISTING ORDERS TO ORDER_SERVICES
-- ============================================

-- Create order_services entries for existing orders with dumpster assignments
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
    1 AS quantity, -- Each order gets 1 dumpster
    COALESCE(o.quoted_price, s.base_price) AS unit_price,
    COALESCE(o.quoted_price, s.base_price) AS total_price,
    o.scheduled_delivery_date AS service_date,
    o.scheduled_delivery_date AS start_date,
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
        'delivery_address', CONCAT_WS(', ', o.address, o.address2, o.city, o.state, o.zip_code),
        'dropoff_time', o.dropoff_time,
        'time_needed', o.time_needed,
        'message', o.message
    ) AS metadata,
    o.created_at,
    o.updated_at
FROM orders o
LEFT JOIN services s ON (
    s.dumpster_size = o.dumpster_size 
    AND s.category_id = (SELECT id FROM service_categories WHERE name = 'dumpster_rental')
)
WHERE o.dumpster_size IS NOT NULL -- Only migrate orders that have a dumpster size
AND NOT EXISTS (
    -- Don't duplicate if already migrated
    SELECT 1 FROM order_services os WHERE os.order_id = o.id
);

-- For orders without a specific dumpster size, create a generic service entry
INSERT INTO order_services (
    order_id,
    service_id,
    quantity,
    unit_price,
    total_price,
    service_date,
    status,
    notes,
    driver_notes,
    metadata,
    created_at,
    updated_at
)
SELECT 
    o.id AS order_id,
    (SELECT id FROM services WHERE sku = 'DUMP-20' LIMIT 1) AS service_id, -- Default to 20-yard
    1 AS quantity,
    COALESCE(o.quoted_price, 500.00) AS unit_price, -- Default price
    COALESCE(o.quoted_price, 500.00) AS total_price,
    o.scheduled_delivery_date AS service_date,
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
        'delivery_address', CONCAT_WS(', ', o.address, o.address2, o.city, o.state, o.zip_code),
        'dropoff_time', o.dropoff_time,
        'time_needed', o.time_needed,
        'message', o.message
    ) AS metadata,
    o.created_at,
    o.updated_at
FROM orders o
WHERE o.dumpster_size IS NULL -- Orders without dumpster size
AND NOT EXISTS (
    -- Don't duplicate if already migrated
    SELECT 1 FROM order_services os WHERE os.order_id = o.id
);

-- ============================================
-- 2. MIGRATE DUMPSTER ASSIGNMENTS
-- ============================================

-- Create order_dumpsters entries for existing dumpster assignments
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
    o.created_at AS assigned_at,
    o.actual_delivery_date AS delivered_at,
    o.scheduled_pickup_date,
    o.actual_pickup_date,
    CONCAT_WS(', ', o.address, o.address2, o.city, o.state, o.zip_code) AS delivery_address,
    o.internal_notes AS delivery_notes,
    o.driver_notes AS pickup_notes,
    o.created_at,
    o.updated_at
FROM orders o
INNER JOIN order_services os ON os.order_id = o.id
WHERE o.dumpster_id IS NOT NULL -- Only for orders with assigned dumpsters
AND NOT EXISTS (
    -- Don't duplicate if already migrated
    SELECT 1 FROM order_dumpsters od WHERE od.order_id = o.id AND od.dumpster_id = o.dumpster_id
);

-- ============================================
-- 3. UPDATE PAYMENT LINE ITEMS
-- ============================================

-- Create payment line items for migrated order services (if they don't exist)
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
    CONCAT(s.display_name, ' - ', o.order_number) AS description,
    os.quantity,
    os.unit_price * 100 AS unit_price, -- Convert to cents for payment system
    os.total_price * 100 AS total_price, -- Convert to cents for payment system
    'dumpster_rental' AS category,
    jsonb_build_object(
        'order_service_id', os.id,
        'service_id', os.service_id,
        'migrated_from_legacy', true
    ) AS metadata,
    os.created_at,
    os.updated_at
FROM payments p
INNER JOIN orders o ON p.order_id = o.id
INNER JOIN order_services os ON os.order_id = o.id
INNER JOIN services s ON s.id = os.service_id
WHERE NOT EXISTS (
    -- Don't create duplicates
    SELECT 1 FROM payment_line_items pli 
    WHERE pli.payment_id = p.id 
    AND pli.metadata->>'order_service_id' = os.id::text
);

-- ============================================
-- 4. UPDATE DUMPSTER STATUS TRACKING
-- ============================================

-- Update dumpster current_order_id to NULL since we now track through order_dumpsters
UPDATE dumpsters 
SET current_order_id = NULL,
    updated_at = NOW()
WHERE current_order_id IS NOT NULL;

-- ============================================
-- 5. CREATE SUMMARY FUNCTIONS
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

-- Function to get available dumpsters for a service
CREATE OR REPLACE FUNCTION get_available_dumpsters_for_service(service_uuid UUID)
RETURNS TABLE (
    dumpster_id UUID,
    dumpster_name TEXT,
    size TEXT,
    condition TEXT,
    last_known_location TEXT
) AS $$
DECLARE
    required_size TEXT;
BEGIN
    -- Get the required size for this service
    SELECT s.dumpster_size INTO required_size
    FROM services s
    WHERE s.id = service_uuid;
    
    RETURN QUERY
    SELECT 
        d.id,
        d.name,
        d.size,
        d.condition,
        d.last_known_location
    FROM dumpsters d
    WHERE d.status = 'available'
    AND (required_size IS NULL OR d.size = required_size)
    AND NOT EXISTS (
        SELECT 1 FROM order_dumpsters od 
        WHERE od.dumpster_id = d.id 
        AND od.status IN ('assigned', 'delivered')
    )
    ORDER BY d.name;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- 6. CREATE UPDATED VIEWS
-- ============================================

-- Updated order summary view
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
    SUM(os.total_price) as total_service_amount,
    COUNT(od.id) as dumpster_count,
    
    -- Service breakdown
    STRING_AGG(DISTINCT s.display_name, ', ') as services_summary,
    STRING_AGG(DISTINCT d.name, ', ') as assigned_dumpsters,
    
    -- Status flags
    CASE 
        WHEN COUNT(os.id) = 0 THEN 'no_services'
        WHEN COUNT(os.id) = COUNT(CASE WHEN os.status = 'completed' THEN 1 END) THEN 'all_completed'
        WHEN COUNT(CASE WHEN os.status = 'in_progress' THEN 1 END) > 0 THEN 'in_progress'
        WHEN COUNT(CASE WHEN os.status = 'confirmed' THEN 1 END) > 0 THEN 'confirmed'
        ELSE 'pending'
    END as services_status
    
FROM orders o
LEFT JOIN order_services os ON os.order_id = o.id
LEFT JOIN services s ON s.id = os.service_id
LEFT JOIN order_dumpsters od ON od.order_service_id = os.id
LEFT JOIN dumpsters d ON d.id = od.dumpster_id
GROUP BY o.id, o.order_number, o.first_name, o.last_name, o.email, o.phone, 
         o.address, o.city, o.state, o.zip_code, o.status, o.priority, 
         o.assigned_to, o.created_at, o.updated_at;

-- Dumpster utilization view
CREATE OR REPLACE VIEW dumpster_utilization AS
SELECT 
    d.id,
    d.name,
    d.size,
    d.status,
    d.condition,
    d.last_known_location,
    
    -- Current assignment
    od.order_id as current_order_id,
    o.order_number as current_order_number,
    od.status as assignment_status,
    od.delivered_at,
    od.scheduled_pickup_date,
    
    -- Utilization stats
    COUNT(od_hist.id) as total_assignments,
    MAX(od_hist.returned_at) as last_return_date,
    
    -- Availability
    CASE 
        WHEN od.id IS NOT NULL AND od.status IN ('assigned', 'delivered') THEN false
        ELSE true
    END as is_available
    
FROM dumpsters d
LEFT JOIN order_dumpsters od ON (
    od.dumpster_id = d.id 
    AND od.status IN ('assigned', 'delivered', 'picked_up')
)
LEFT JOIN orders o ON o.id = od.order_id
LEFT JOIN order_dumpsters od_hist ON od_hist.dumpster_id = d.id
GROUP BY d.id, d.name, d.size, d.status, d.condition, d.last_known_location,
         od.order_id, o.order_number, od.status, od.delivered_at, od.scheduled_pickup_date, od.id;

-- ============================================
-- 7. DATA VALIDATION
-- ============================================

-- Check migration success
DO $$
DECLARE
    original_order_count INTEGER;
    migrated_service_count INTEGER;
    orders_without_services INTEGER;
BEGIN
    -- Count original orders
    SELECT COUNT(*) INTO original_order_count FROM orders;
    
    -- Count migrated services 
    SELECT COUNT(DISTINCT order_id) INTO migrated_service_count FROM order_services;
    
    -- Count orders without services (should be 0)
    SELECT COUNT(*) INTO orders_without_services 
    FROM orders o
    WHERE NOT EXISTS (SELECT 1 FROM order_services os WHERE os.order_id = o.id);
    
    RAISE NOTICE 'Migration Summary:';
    RAISE NOTICE '- Original orders: %', original_order_count;
    RAISE NOTICE '- Orders with migrated services: %', migrated_service_count;
    RAISE NOTICE '- Orders without services: %', orders_without_services;
    
    IF orders_without_services > 0 THEN
        RAISE WARNING 'Some orders were not migrated to services. Please review.';
    ELSE
        RAISE NOTICE 'Migration completed successfully!';
    END IF;
END;
$$;

-- Show sample of migrated data
SELECT 
    o.order_number,
    o.first_name || ' ' || COALESCE(o.last_name, '') as customer_name,
    s.display_name as service,
    os.quantity,
    os.unit_price,
    os.status as service_status,
    CASE WHEN od.id IS NOT NULL THEN d.name ELSE 'No dumpster assigned' END as dumpster
FROM orders o
INNER JOIN order_services os ON os.order_id = o.id
INNER JOIN services s ON s.id = os.service_id
LEFT JOIN order_dumpsters od ON od.order_service_id = os.id
LEFT JOIN dumpsters d ON d.id = od.dumpster_id
ORDER BY o.created_at DESC
LIMIT 10;

-- ============================================
-- 8. COMMENTS
-- ============================================

COMMENT ON FUNCTION get_order_service_summary(UUID) IS 'Returns summary statistics for services on an order';
COMMENT ON FUNCTION get_available_dumpsters_for_service(UUID) IS 'Returns available dumpsters that match service requirements';
COMMENT ON VIEW order_summary_with_services IS 'Enhanced order view including service and dumpster information';
COMMENT ON VIEW dumpster_utilization IS 'Comprehensive view of dumpster assignments and availability';

-- ============================================
-- END OF MIGRATION
-- ============================================