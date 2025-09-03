-- ================================================
-- ARK DUMPSTER ORDER SERVICES DATA MIGRATION
-- Copy order services to production
-- ================================================
-- This script inserts all order services data for existing orders
-- Run this AFTER the schema and services migration scripts
-- ================================================

-- ================================================
-- ORDER SERVICES DATA
-- ================================================

INSERT INTO order_services (
    id,
    order_id,
    service_id,
    quantity,
    unit_price,
    total_price,
    discount_amount,
    discount_reason,
    service_date,
    start_date,
    end_date,
    status,
    notes,
    driver_notes,
    metadata,
    created_at,
    updated_at,
    completed_at,
    invoice_description
) VALUES 
-- Order ORD000003 - 20 Yard Dumpster
(
    'dcdf18e8-e38e-40ed-8cbb-a5cc2127ba1e',
    '129dafc8-5857-4713-a232-695665084306',  -- ORD000003
    'fb413a50-3512-4f79-b387-4c17fd683b44',  -- 20 Yard Dumpster service
    1.00,
    400.00,
    400.00,
    0.00,
    null,
    '2025-09-03',
    null,
    null,
    'confirmed',
    null,
    null,
    null,
    '2025-09-02 18:55:03.056192+00',
    '2025-09-02 20:28:19.76555+00',
    null,
    'Up to 1 week rental. Tons over 1 charged at $55/ton'
),
-- Order ORD000004 - 15 Yard Dumpster
(
    'f622a6a7-4ebf-4143-a161-6e2d50291acb',
    '61e5704f-3976-4a25-9fbb-3e3613b3d652',  -- ORD000004
    'eee6b2e3-007c-4404-b316-b838d7044d5c',  -- 15 Yard Dumpster service
    1.00,
    350.00,
    350.00,
    0.00,
    null,
    '2025-09-03',
    null,
    null,
    'confirmed',
    null,
    null,
    null,
    '2025-09-02 18:58:26.420354+00',
    '2025-09-02 22:42:03.700019+00',
    null,
    'Up to 7 day rental.'
)
ON CONFLICT (id) DO UPDATE SET
    order_id = EXCLUDED.order_id,
    service_id = EXCLUDED.service_id,
    quantity = EXCLUDED.quantity,
    unit_price = EXCLUDED.unit_price,
    total_price = EXCLUDED.total_price,
    discount_amount = EXCLUDED.discount_amount,
    discount_reason = EXCLUDED.discount_reason,
    service_date = EXCLUDED.service_date,
    start_date = EXCLUDED.start_date,
    end_date = EXCLUDED.end_date,
    status = EXCLUDED.status,
    notes = EXCLUDED.notes,
    driver_notes = EXCLUDED.driver_notes,
    metadata = EXCLUDED.metadata,
    invoice_description = EXCLUDED.invoice_description,
    updated_at = NOW();

-- ================================================
-- HANDLE MISSING ORDER ORD000002
-- ================================================

-- Check if ORD000002 exists in production and add a default service if it does
DO $$
DECLARE
    order_record RECORD;
BEGIN
    -- Check if ORD000002 exists
    SELECT * INTO order_record FROM orders WHERE order_number = 'ORD000002';
    
    IF FOUND THEN
        -- Add a default 20-yard dumpster service to ORD000002 if it has no services
        INSERT INTO order_services (
            order_id,
            service_id,
            quantity,
            unit_price,
            total_price,
            discount_amount,
            service_date,
            status,
            invoice_description,
            created_at,
            updated_at
        ) 
        SELECT 
            order_record.id,
            'fb413a50-3512-4f79-b387-4c17fd683b44', -- 20 Yard Dumpster
            1.00,
            400.00,
            400.00,
            0.00,
            COALESCE(order_record.dropoff_date, CURRENT_DATE),
            'confirmed',
            'Up to 1 week rental. Tons over 1 charged at $55/ton',
            NOW(),
            NOW()
        WHERE NOT EXISTS (
            SELECT 1 FROM order_services WHERE order_id = order_record.id
        );
        
        RAISE NOTICE 'Added default service to order ORD000002';
    ELSE
        RAISE NOTICE 'Order ORD000002 not found in production';
    END IF;
END $$;

-- ================================================
-- VERIFICATION QUERIES
-- ================================================

-- Check all orders and their services
SELECT 
    o.order_number,
    o.id as order_id,
    COUNT(os.id) as service_count,
    STRING_AGG(s.display_name, ', ') as services,
    SUM(os.total_price) as total_amount
FROM orders o
LEFT JOIN order_services os ON o.id = os.order_id
LEFT JOIN services s ON os.service_id = s.id
GROUP BY o.id, o.order_number
ORDER BY o.order_number;

-- Check for orders without services (should be empty after this migration)
SELECT 
    o.order_number,
    o.first_name,
    o.last_name,
    o.email
FROM orders o
LEFT JOIN order_services os ON o.id = os.order_id
WHERE os.id IS NULL;

-- ================================================
-- SCRIPT COMPLETION
-- ================================================

DO $$
BEGIN
    RAISE NOTICE 'Order services data migration completed successfully!';
    RAISE NOTICE 'Orders with services: %', (
        SELECT COUNT(DISTINCT order_id) FROM order_services
    );
    RAISE NOTICE 'Total service items: %', (SELECT COUNT(*) FROM order_services);
END
$$;