-- Empty Orders Tables
-- This will remove all order data to avoid constraint conflicts

-- Delete all order-related data (in correct order due to foreign key constraints)
DELETE FROM order_dumpsters;
DELETE FROM order_services;
DELETE FROM orders;

-- Reset sequences to start fresh
SELECT setval('orders_id_seq', 1, false);
SELECT setval('order_services_id_seq', 1, false);
SELECT setval('order_dumpsters_id_seq', 1, false);

-- Verify tables are empty
SELECT 'Orders count:' as info, COUNT(*) as count FROM orders;
SELECT 'Order services count:' as info, COUNT(*) as count FROM order_services;
SELECT 'Order dumpsters count:' as info, COUNT(*) as count FROM order_dumpsters;