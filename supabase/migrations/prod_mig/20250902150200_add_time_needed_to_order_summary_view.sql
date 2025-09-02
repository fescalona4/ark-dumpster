-- Update order_summary_with_services view to include time_needed field
DROP VIEW IF EXISTS order_summary_with_services;

CREATE VIEW order_summary_with_services AS
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
    o.status AS order_status,
    o.priority,
    o.assigned_to,
    o.dropoff_date,
    o.dropoff_time,
    o.time_needed,  -- Added this field
    o.created_at,
    o.updated_at,
    COUNT(os.id) AS service_count,
    COALESCE(SUM(os.total_price), 0) AS total_service_amount,
    COUNT(od.id) AS dumpster_count,
    STRING_AGG(DISTINCT s.display_name, ', ' ORDER BY s.display_name) AS services_summary,
    STRING_AGG(DISTINCT d.name, ', ' ORDER BY d.name) AS assigned_dumpsters,
    CASE 
        WHEN COUNT(os.id) = 0 THEN 'no_services'
        WHEN COUNT(os.id) = COUNT(CASE WHEN os.status = 'completed' THEN 1 END) THEN 'all_completed'
        WHEN COUNT(CASE WHEN os.status = 'in_progress' THEN 1 END) > 0 THEN 'in_progress'
        WHEN COUNT(CASE WHEN os.status = 'confirmed' THEN 1 END) > 0 THEN 'confirmed'
        ELSE 'pending'
    END AS services_status,
    CASE 
        WHEN COUNT(os.id) > 1 THEN true 
        ELSE false 
    END AS has_multiple_services
FROM orders o
LEFT JOIN order_services os ON os.order_id = o.id
LEFT JOIN services s ON s.id = os.service_id
LEFT JOIN order_dumpsters od ON od.order_service_id = os.id
LEFT JOIN dumpsters d ON d.id = od.dumpster_id
GROUP BY 
    o.id, o.order_number, o.first_name, o.last_name, o.email, o.phone, 
    o.address, o.city, o.state, o.zip_code, o.status, o.priority, 
    o.assigned_to, o.dropoff_date, o.dropoff_time, o.time_needed, 
    o.created_at, o.updated_at;