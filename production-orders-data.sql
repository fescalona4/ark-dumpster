-- ================================================
-- ARK DUMPSTER ORDERS DATA MIGRATION
-- Copy orders to production
-- ================================================
-- This script inserts all orders data to production
-- Run this AFTER the schema migration script
-- ================================================

-- ================================================
-- ORDERS DATA
-- ================================================

INSERT INTO orders (
    id,
    quote_id,
    first_name,
    last_name,
    email,
    phone,
    address,
    address2,
    city,
    state,
    zip_code,
    dumpster_size,
    dropoff_date,
    dropoff_time,
    time_needed,
    message,
    order_number,
    status,
    priority,
    quoted_price,
    final_price,
    assigned_to,
    driver_notes,
    internal_notes,
    scheduled_delivery_date,
    scheduled_pickup_date,
    actual_delivery_date,
    actual_pickup_date,
    created_at,
    updated_at,
    completed_at,
    dumpster_id,
    completed_with_dumpster_id,
    completed_with_dumpster_name
) VALUES 
-- Order ORD000003
(
    '129dafc8-5857-4713-a232-695665084306',
    null,
    'John',
    'Doe',
    'john.doe@example.com',
    5551234567,
    '123 Test Street, Orlando, FL 32801',
    null,
    null,
    null,
    null,
    null,
    '2025-09-03',
    '10:00:00',
    '1-day',
    null,
    'ORD000003',
    'scheduled',
    'normal',
    null,
    null,
    'Ariel',
    null,
    'Test order to verify dropoff time is correctly saved - service time selected: 10:00 AM',
    null,
    null,
    null,
    null,
    '2025-09-02 18:55:02.712119+00',
    '2025-09-02 18:55:02.712119+00',
    null,
    null,
    null,
    null
),
-- Order ORD000004
(
    '61e5704f-3976-4a25-9fbb-3e3613b3d652',
    null,
    'Jane',
    'Smith',
    'jane.smith@test.com',
    5559998888,
    '456 Production Test St, Orlando, FL 32801',
    null,
    null,
    null,
    null,
    null,
    '2025-09-03',
    '17:00:00',
    '1-day',
    null,
    'ORD000004',
    'on_way',
    'normal',
    null,
    null,
    'Ariel',
    null,
    'Production test - verifying dropoff time fix works correctly with 2:00 PM selection',
    null,
    null,
    '2025-09-02',
    null,
    '2025-09-02 18:58:26.118295+00',
    '2025-09-02 20:40:00.363225+00',
    null,
    null,
    null,
    null
)
ON CONFLICT (id) DO UPDATE SET
    quote_id = EXCLUDED.quote_id,
    first_name = EXCLUDED.first_name,
    last_name = EXCLUDED.last_name,
    email = EXCLUDED.email,
    phone = EXCLUDED.phone,
    address = EXCLUDED.address,
    address2 = EXCLUDED.address2,
    city = EXCLUDED.city,
    state = EXCLUDED.state,
    zip_code = EXCLUDED.zip_code,
    dumpster_size = EXCLUDED.dumpster_size,
    dropoff_date = EXCLUDED.dropoff_date,
    dropoff_time = EXCLUDED.dropoff_time,
    time_needed = EXCLUDED.time_needed,
    message = EXCLUDED.message,
    order_number = EXCLUDED.order_number,
    status = EXCLUDED.status,
    priority = EXCLUDED.priority,
    quoted_price = EXCLUDED.quoted_price,
    final_price = EXCLUDED.final_price,
    assigned_to = EXCLUDED.assigned_to,
    driver_notes = EXCLUDED.driver_notes,
    internal_notes = EXCLUDED.internal_notes,
    scheduled_delivery_date = EXCLUDED.scheduled_delivery_date,
    scheduled_pickup_date = EXCLUDED.scheduled_pickup_date,
    actual_delivery_date = EXCLUDED.actual_delivery_date,
    actual_pickup_date = EXCLUDED.actual_pickup_date,
    completed_at = EXCLUDED.completed_at,
    dumpster_id = EXCLUDED.dumpster_id,
    completed_with_dumpster_id = EXCLUDED.completed_with_dumpster_id,
    completed_with_dumpster_name = EXCLUDED.completed_with_dumpster_name,
    updated_at = NOW();

-- ================================================
-- VERIFICATION QUERIES
-- ================================================

-- Check all orders
SELECT 
    order_number,
    first_name,
    last_name,
    email,
    status,
    dropoff_date,
    dropoff_time,
    assigned_to
FROM orders
ORDER BY order_number;

-- Check for duplicate order numbers
SELECT 
    order_number,
    COUNT(*) as count
FROM orders
GROUP BY order_number
HAVING COUNT(*) > 1;

-- ================================================
-- SCRIPT COMPLETION
-- ================================================

DO $$
BEGIN
    RAISE NOTICE 'Orders data migration completed successfully!';
    RAISE NOTICE 'Total orders: %', (SELECT COUNT(*) FROM orders);
    RAISE NOTICE 'Orders by status:';
END
$$;

-- Show orders by status
SELECT 
    status,
    COUNT(*) as count
FROM orders
GROUP BY status
ORDER BY status;