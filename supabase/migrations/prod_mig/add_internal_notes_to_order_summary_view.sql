-- Drop the existing view
DROP VIEW IF EXISTS order_summary_with_services;

-- Recreate the view with internal_notes included
CREATE VIEW order_summary_with_services AS
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
    o.status AS order_status,
    o.priority,
    o.assigned_to,
    o.dropoff_date,
    o.dropoff_time,
    o.time_needed,
    o.internal_notes,
    o.created_at,
    o.updated_at,
    count(os.id) AS service_count,
    COALESCE(sum(os.total_price), (0)::numeric) AS total_service_amount,
    count(od.id) AS dumpster_count,
    string_agg(DISTINCT (s.display_name)::text, ', '::text ORDER BY (s.display_name)::text) AS services_summary,
    string_agg(DISTINCT d.name, ', '::text ORDER BY d.name) AS assigned_dumpsters,
    CASE
        WHEN (count(os.id) = 0) THEN 'no_services'::text
        WHEN (count(os.id) = count(
        CASE
            WHEN ((os.status)::text = 'completed'::text) THEN 1
            ELSE NULL::integer
        END)) THEN 'all_completed'::text
        WHEN (count(
        CASE
            WHEN ((os.status)::text = 'in_progress'::text) THEN 1
            ELSE NULL::integer
        END) > 0) THEN 'in_progress'::text
        WHEN (count(
        CASE
            WHEN ((os.status)::text = 'confirmed'::text) THEN 1
            ELSE NULL::integer
        END) > 0) THEN 'confirmed'::text
        ELSE 'pending'::text
    END AS services_status,
    CASE
        WHEN (count(os.id) > 1) THEN true
        ELSE false
    END AS has_multiple_services
FROM ((((orders o
  LEFT JOIN order_services os ON ((os.order_id = o.id)))
  LEFT JOIN services s ON ((s.id = os.service_id)))
  LEFT JOIN order_dumpsters od ON ((od.order_service_id = os.id)))
  LEFT JOIN dumpsters d ON ((d.id = od.dumpster_id)))
GROUP BY o.id, o.order_number, o.first_name, o.last_name, o.email, o.phone, o.address, o.address2, o.city, o.state, o.zip_code, o.status, o.priority, o.assigned_to, o.dropoff_date, o.dropoff_time, o.time_needed, o.internal_notes, o.created_at, o.updated_at;