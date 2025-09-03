-- ================================================
-- ARK DUMPSTER SERVICES DATA MIGRATION
-- Copy service categories and services to production
-- ================================================
-- This script inserts all service categories and services data
-- Run this AFTER the schema migration script
-- ================================================

-- Clear existing data (optional - remove these lines if you want to preserve existing data)
-- DELETE FROM services;
-- DELETE FROM service_categories;

-- ================================================
-- SERVICE CATEGORIES DATA
-- ================================================

INSERT INTO service_categories (
    id, 
    name, 
    display_name, 
    description, 
    sort_order, 
    is_active, 
    icon_name, 
    metadata, 
    created_at, 
    updated_at
) VALUES 
(
    '3565e14a-08e0-4d30-bde0-9795d6b32242',
    'dumpster_rental',
    'Dumpster Rentals',
    'Roll-off dumpster rental services',
    1,
    true,
    null,
    null,
    '2025-08-26 21:30:51.327203+00',
    '2025-08-26 21:30:51.327203+00'
),
(
    '8cc050f1-223a-40bb-b4c2-f862449bf617',
    'additional_charges',
    'Additional Charges',
    'Extra weight, extended rental, and other charges',
    2,
    true,
    null,
    null,
    '2025-08-26 21:30:51.327203+00',
    '2025-08-26 21:30:51.327203+00'
),
(
    '39679ed7-79d2-47ad-ba25-d0e165cae55c',
    'tree_service',
    'Tree Services',
    'Tree removal and trimming services',
    3,
    true,
    null,
    null,
    '2025-08-26 21:30:51.327203+00',
    '2025-08-26 21:30:51.327203+00'
),
(
    'a9688e8d-202a-447b-8efc-4d90edf15fb0',
    'labor_service',
    'Labor Services',
    'Additional labor and hauling services',
    4,
    true,
    null,
    null,
    '2025-08-26 21:30:51.327203+00',
    '2025-08-26 21:30:51.327203+00'
)
ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    display_name = EXCLUDED.display_name,
    description = EXCLUDED.description,
    sort_order = EXCLUDED.sort_order,
    is_active = EXCLUDED.is_active,
    icon_name = EXCLUDED.icon_name,
    metadata = EXCLUDED.metadata,
    updated_at = NOW();

-- ================================================
-- SERVICES DATA
-- ================================================

INSERT INTO services (
    id,
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
    is_active,
    requires_scheduling,
    max_quantity,
    is_taxable,
    tax_rate,
    sort_order,
    metadata,
    created_at,
    updated_at
) VALUES 
-- Dumpster Rentals
(
    'eee6b2e3-007c-4404-b316-b838d7044d5c',
    '3565e14a-08e0-4d30-bde0-9795d6b32242',
    'DUMP-15',
    '15-yard-dumpster',
    '15 Yard Dumpster',
    'Up to 7 day rental.',
    350.00,
    'weekly',
    '15-yard',
    7,
    20.00,
    1.00,
    55.00,
    true,
    true,
    null,
    true,
    0.0825,
    1,
    null,
    '2025-08-26 21:30:51.327203+00',
    '2025-08-27 22:20:36.664642+00'
),
(
    'fb413a50-3512-4f79-b387-4c17fd683b44',
    '3565e14a-08e0-4d30-bde0-9795d6b32242',
    'DUMP-20',
    '20-yard-dumpster',
    '20 Yard Dumpster',
    'Up to 1 week rental. Tons over 1 charged at $55/ton',
    400.00,
    'weekly',
    '20-yard',
    7,
    25.00,
    1.00,
    55.00,
    true,
    true,
    null,
    true,
    0.0825,
    1,
    null,
    '2025-08-26 21:30:51.327203+00',
    '2025-08-27 22:22:40.705147+00'
),
-- Tree Services
(
    'f21b1327-3201-4647-bd30-0aef72bbfd21',
    '39679ed7-79d2-47ad-ba25-d0e165cae55c',
    'TREE-TRIM',
    'tree-trimming',
    'Tree Trimming Service',
    'Professional tree trimming and pruning',
    250.00,
    'fixed',
    null,
    null,
    null,
    null,
    null,
    true,
    true,
    null,
    true,
    0.0825,
    2,
    null,
    '2025-08-26 21:30:51.327203+00',
    '2025-08-27 23:12:58.806413+00'
),
(
    'c96d1eaa-ebae-48d9-99ea-76f0b47c8f89',
    '39679ed7-79d2-47ad-ba25-d0e165cae55c',
    'TREE-EMERG',
    'emergency-tree-removal',
    'Emergency Tree Removal',
    '24/7 emergency tree removal service',
    750.00,
    'custom',
    null,
    null,
    null,
    null,
    null,
    true,
    true,
    null,
    true,
    0.0825,
    3,
    null,
    '2025-08-26 21:30:51.327203+00',
    '2025-08-26 21:30:51.327203+00'
),
(
    '8d2ed722-4847-4063-8068-ae88ec7f8e28',
    '39679ed7-79d2-47ad-ba25-d0e165cae55c',
    'TREE-REMOVE',
    'tree-removal',
    'Tree Removal Service',
    'Complete tree removal including stump grinding',
    500.00,
    'fixed',
    null,
    null,
    null,
    null,
    null,
    true,
    true,
    null,
    true,
    0.0825,
    5,
    null,
    '2025-08-26 21:30:51.327203+00',
    '2025-08-27 23:13:14.746112+00'
),
-- Additional Charges
(
    'e7120fe3-4fc3-455a-8068-33201b594d37',
    '8cc050f1-223a-40bb-b4c2-f862449bf617',
    'CHARGE-DAYS',
    'extra-days-charge',
    'Extended Rental',
    'Additional days beyond included rental period',
    25.00,
    'daily',
    null,
    null,
    null,
    null,
    null,
    true,
    false,
    null,
    true,
    0.0825,
    2,
    null,
    '2025-08-26 21:30:51.327203+00',
    '2025-08-26 21:30:51.327203+00'
),
(
    '32edfdd8-184c-4485-bbc1-88ee7d3cb6ce',
    '8cc050f1-223a-40bb-b4c2-f862449bf617',
    'CHARGE-TRIP',
    'extra-trip-charge',
    'Additional Trip Charge',
    'Extra delivery or pickup trip',
    125.00,
    'fixed',
    null,
    null,
    null,
    null,
    null,
    true,
    false,
    null,
    true,
    0.0825,
    3,
    null,
    '2025-08-26 21:30:51.327203+00',
    '2025-08-26 21:30:51.327203+00'
),
(
    '4183b543-514b-4269-8ac9-4ba88b83b684',
    '8cc050f1-223a-40bb-b4c2-f862449bf617',
    'CHARGE-WEIGHT',
    'extra-weight-charge',
    'Extra Weight Charge',
    'Weight included in rental: 1 ton\nExtra weight: $55 per ton',
    55.00,
    'custom',
    null,
    null,
    null,
    null,
    null,
    true,
    false,
    null,
    true,
    0.0825,
    3,
    null,
    '2025-08-26 21:30:51.327203+00',
    '2025-08-27 22:23:41.194325+00'
),
(
    '4a4dc4b4-9482-4671-99ac-ba7963b5064a',
    '8cc050f1-223a-40bb-b4c2-f862449bf617',
    'CHARGE-RELOC',
    'relocation-charge',
    'Dumpster Relocation',
    'Move dumpster to different location on same property',
    75.00,
    'fixed',
    null,
    null,
    null,
    null,
    null,
    true,
    false,
    null,
    true,
    0.0825,
    4,
    null,
    '2025-08-26 21:30:51.327203+00',
    '2025-08-26 21:30:51.327203+00'
),
(
    '60b2cedc-9517-4ee5-84f1-07fe6919b625',
    '8cc050f1-223a-40bb-b4c2-f862449bf617',
    'DISCOUNT-RETURN',
    'returning-customer-discount',
    'Returning Cust Discount',
    'Special discount for returning customers',
    -50.00,
    'fixed',
    null,
    null,
    null,
    null,
    null,
    true,
    false,
    null,
    false,
    0.0000,
    19,
    null,
    '2025-08-27 22:46:38.898396+00',
    '2025-08-27 23:27:49.683079+00'
),
-- Labor Services
(
    '12c926b9-db0a-40a9-9cbb-499278153897',
    'a9688e8d-202a-447b-8efc-4d90edf15fb0',
    '',
    'FLAT-ROOF',
    'Flat Roof',
    'Includes the removal of the old flat roof, check and replace any rotten wood, re-nail if necessary, give the roof incline with insulation and install base and cap sheet rolls.',
    4800.00,
    'fixed',
    null,
    null,
    null,
    null,
    null,
    true,
    false,
    1,
    true,
    0.0000,
    20,
    null,
    '2025-08-27 22:26:37.350538+00',
    '2025-08-27 22:26:37.350538+00'
)
ON CONFLICT (id) DO UPDATE SET
    category_id = EXCLUDED.category_id,
    sku = EXCLUDED.sku,
    name = EXCLUDED.name,
    display_name = EXCLUDED.display_name,
    description = EXCLUDED.description,
    base_price = EXCLUDED.base_price,
    price_type = EXCLUDED.price_type,
    dumpster_size = EXCLUDED.dumpster_size,
    included_days = EXCLUDED.included_days,
    extra_day_price = EXCLUDED.extra_day_price,
    included_weight_tons = EXCLUDED.included_weight_tons,
    extra_weight_price_per_ton = EXCLUDED.extra_weight_price_per_ton,
    is_active = EXCLUDED.is_active,
    requires_scheduling = EXCLUDED.requires_scheduling,
    max_quantity = EXCLUDED.max_quantity,
    is_taxable = EXCLUDED.is_taxable,
    tax_rate = EXCLUDED.tax_rate,
    sort_order = EXCLUDED.sort_order,
    metadata = EXCLUDED.metadata,
    updated_at = NOW();

-- ================================================
-- VERIFICATION QUERIES
-- ================================================

-- Check service categories
SELECT 
    name,
    display_name,
    is_active,
    sort_order
FROM service_categories 
ORDER BY sort_order;

-- Check services by category
SELECT 
    sc.display_name as category,
    s.display_name,
    s.base_price,
    s.price_type,
    s.is_active
FROM services s
JOIN service_categories sc ON s.category_id = sc.id
ORDER BY sc.sort_order, s.sort_order, s.display_name;

-- Summary counts
SELECT 
    sc.display_name as category,
    COUNT(s.id) as service_count,
    COUNT(CASE WHEN s.is_active THEN 1 END) as active_count
FROM service_categories sc
LEFT JOIN services s ON sc.id = s.category_id
GROUP BY sc.id, sc.display_name
ORDER BY sc.sort_order;

-- ================================================
-- SCRIPT COMPLETION
-- ================================================

DO $$
BEGIN
    RAISE NOTICE 'Services data migration completed successfully!';
    RAISE NOTICE 'Inserted % service categories', (SELECT COUNT(*) FROM service_categories);
    RAISE NOTICE 'Inserted % services', (SELECT COUNT(*) FROM services);
    RAISE NOTICE 'Active services: %', (SELECT COUNT(*) FROM services WHERE is_active = true);
END
$$;