-- Add returning customer discount service
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
    'DISCOUNT-RETURN',
    'returning-customer-discount',
    'Returning Customer Discount',
    'Special discount for returning customers',
    -50.00,
    'fixed',
    false,
    0,
    true
FROM service_categories sc
WHERE sc.name = 'additional_charges'
ON CONFLICT (sku) DO UPDATE SET
    base_price = -50.00,
    display_name = 'Returning Customer Discount',
    description = 'Special discount for returning customers';