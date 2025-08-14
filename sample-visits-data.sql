-- Sample data for website visits table
-- This will create realistic visit data for the past 30 days

INSERT INTO website_visits (
  id,
  page_path,
  referrer,
  user_agent,
  ip_address,
  country,
  city,
  device_type,
  browser,
  session_id,
  created_at
) VALUES 
-- Home page visits
('550e8400-e29b-41d4-a716-446655440001', '/', 'https://google.com', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36', '192.168.1.100', 'United States', 'New York', 'desktop', 'Chrome', 'sess_001', '2025-08-14 10:30:00'),
('550e8400-e29b-41d4-a716-446655440002', '/', 'direct', 'Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X) AppleWebKit/605.1.15', '192.168.1.101', 'United States', 'Los Angeles', 'mobile', 'Safari', 'sess_002', '2025-08-14 09:15:00'),
('550e8400-e29b-41d4-a716-446655440003', '/', 'https://facebook.com', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36', '192.168.1.102', 'Canada', 'Toronto', 'desktop', 'Chrome', 'sess_003', '2025-08-14 08:45:00'),
('550e8400-e29b-41d4-a716-446655440004', '/', 'https://google.com', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36', '192.168.1.103', 'United Kingdom', 'London', 'desktop', 'Safari', 'sess_004', '2025-08-14 07:20:00'),

-- Services page visits
('550e8400-e29b-41d4-a716-446655440005', '/services', 'https://google.com', 'Mozilla/5.0 (iPad; CPU OS 15_0 like Mac OS X) AppleWebKit/605.1.15', '192.168.1.104', 'Australia', 'Sydney', 'tablet', 'Safari', 'sess_005', '2025-08-14 06:30:00'),
('550e8400-e29b-41d4-a716-446655440006', '/services', '/', 'Mozilla/5.0 (Android 11; Mobile; rv:68.0) Gecko/68.0 Firefox/88.0', '192.168.1.105', 'Germany', 'Berlin', 'mobile', 'Firefox', 'sess_006', '2025-08-14 05:15:00'),

-- Contact page visits
('550e8400-e29b-41d4-a716-446655440007', '/contact', '/services', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:91.0) Gecko/20100101 Firefox/91.0', '192.168.1.106', 'France', 'Paris', 'desktop', 'Firefox', 'sess_007', '2025-08-14 04:45:00'),
('550e8400-e29b-41d4-a716-446655440008', '/contact', 'https://google.com', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36', '192.168.1.107', 'Japan', 'Tokyo', 'desktop', 'Chrome', 'sess_008', '2025-08-14 03:20:00'),

-- Yesterday's data (August 13, 2025)
('550e8400-e29b-41d4-a716-446655440009', '/', 'https://google.com', 'Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X) AppleWebKit/605.1.15', '192.168.1.108', 'United States', 'Chicago', 'mobile', 'Safari', 'sess_009', '2025-08-13 22:30:00'),
('550e8400-e29b-41d4-a716-446655440010', '/', 'direct', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36', '192.168.1.109', 'United States', 'Miami', 'desktop', 'Chrome', 'sess_010', '2025-08-13 21:15:00'),
('550e8400-e29b-41d4-a716-446655440011', '/services', 'https://bing.com', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36', '192.168.1.110', 'Canada', 'Vancouver', 'desktop', 'Safari', 'sess_011', '2025-08-13 20:45:00'),
('550e8400-e29b-41d4-a716-446655440012', '/contact', '/services', 'Mozilla/5.0 (iPad; CPU OS 15_0 like Mac OS X) AppleWebKit/605.1.15', '192.168.1.111', 'United Kingdom', 'Manchester', 'tablet', 'Safari', 'sess_012', '2025-08-13 19:20:00'),
('550e8400-e29b-41d4-a716-446655440013', '/', 'https://google.com', 'Mozilla/5.0 (Android 11; Mobile; rv:68.0) Gecko/68.0 Firefox/88.0', '192.168.1.112', 'Australia', 'Melbourne', 'mobile', 'Firefox', 'sess_013', '2025-08-13 18:30:00'),
('550e8400-e29b-41d4-a716-446655440014', '/about', '/', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:91.0) Gecko/20100101 Firefox/91.0', '192.168.1.113', 'Germany', 'Munich', 'desktop', 'Firefox', 'sess_014', '2025-08-13 17:15:00'),

-- August 12, 2025
('550e8400-e29b-41d4-a716-446655440015', '/', 'https://google.com', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36', '192.168.1.114', 'Spain', 'Madrid', 'desktop', 'Chrome', 'sess_015', '2025-08-12 16:30:00'),
('550e8400-e29b-41d4-a716-446655440016', '/', 'direct', 'Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X) AppleWebKit/605.1.15', '192.168.1.115', 'Italy', 'Rome', 'mobile', 'Safari', 'sess_016', '2025-08-12 15:15:00'),
('550e8400-e29b-41d4-a716-446655440017', '/services', 'https://google.com', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36', '192.168.1.116', 'Netherlands', 'Amsterdam', 'desktop', 'Chrome', 'sess_017', '2025-08-12 14:45:00'),
('550e8400-e29b-41d4-a716-446655440018', '/pricing', '/services', 'Mozilla/5.0 (iPad; CPU OS 15_0 like Mac OS X) AppleWebKit/605.1.15', '192.168.1.117', 'Sweden', 'Stockholm', 'tablet', 'Safari', 'sess_018', '2025-08-12 13:20:00'),

-- August 11, 2025
('550e8400-e29b-41d4-a716-446655440019', '/', 'https://google.com', 'Mozilla/5.0 (Android 11; Mobile; rv:68.0) Gecko/68.0 Firefox/88.0', '192.168.1.118', 'Brazil', 'São Paulo', 'mobile', 'Firefox', 'sess_019', '2025-08-11 12:30:00'),
('550e8400-e29b-41d4-a716-446655440020', '/', 'direct', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:91.0) Gecko/20100101 Firefox/91.0', '192.168.1.119', 'Mexico', 'Mexico City', 'desktop', 'Firefox', 'sess_020', '2025-08-11 11:15:00'),
('550e8400-e29b-41d4-a716-446655440021', '/services', 'https://bing.com', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36', '192.168.1.120', 'India', 'Mumbai', 'desktop', 'Safari', 'sess_021', '2025-08-11 10:45:00'),
('550e8400-e29b-41d4-a716-446655440022', '/contact', '/services', 'Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X) AppleWebKit/605.1.15', '192.168.1.121', 'South Korea', 'Seoul', 'mobile', 'Safari', 'sess_022', '2025-08-11 09:20:00'),

-- August 10, 2025 (Weekend - lower traffic)
('550e8400-e29b-41d4-a716-446655440023', '/', 'https://google.com', 'Mozilla/5.0 (iPad; CPU OS 15_0 like Mac OS X) AppleWebKit/605.1.15', '192.168.1.122', 'United States', 'Seattle', 'tablet', 'Safari', 'sess_023', '2025-08-10 20:30:00'),
('550e8400-e29b-41d4-a716-446655440024', '/', 'direct', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36', '192.168.1.123', 'United States', 'Denver', 'desktop', 'Chrome', 'sess_024', '2025-08-10 19:15:00'),
('550e8400-e29b-41d4-a716-446655440025', '/about', '/', 'Mozilla/5.0 (Android 11; Mobile; rv:68.0) Gecko/68.0 Firefox/88.0', '192.168.1.124', 'Canada', 'Montreal', 'mobile', 'Firefox', 'sess_025', '2025-08-10 18:45:00'),

-- August 9, 2025
('550e8400-e29b-41d4-a716-446655440026', '/', 'https://google.com', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36', '192.168.1.125', 'Norway', 'Oslo', 'desktop', 'Chrome', 'sess_026', '2025-08-09 17:30:00'),
('550e8400-e29b-41d4-a716-446655440027', '/', 'direct', 'Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X) AppleWebKit/605.1.15', '192.168.1.126', 'Denmark', 'Copenhagen', 'mobile', 'Safari', 'sess_027', '2025-08-09 16:15:00'),

-- August 8, 2025
('550e8400-e29b-41d4-a716-446655440028', '/', 'https://google.com', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:91.0) Gecko/20100101 Firefox/91.0', '192.168.1.127', 'Finland', 'Helsinki', 'desktop', 'Firefox', 'sess_028', '2025-08-08 15:30:00'),
('550e8400-e29b-41d4-a716-446655440029', '/services', 'https://google.com', 'Mozilla/5.0 (iPad; CPU OS 15_0 like Mac OS X) AppleWebKit/605.1.15', '192.168.1.128', 'Poland', 'Warsaw', 'tablet', 'Safari', 'sess_029', '2025-08-08 14:15:00'),
('550e8400-e29b-41d4-a716-446655440030', '/contact', '/services', 'Mozilla/5.0 (Android 11; Mobile; rv:68.0) Gecko/68.0 Firefox/88.0', '192.168.1.129', 'Russia', 'Moscow', 'mobile', 'Firefox', 'sess_030', '2025-08-08 13:45:00'),

-- August 7, 2025
('550e8400-e29b-41d4-a716-446655440031', '/', 'https://google.com', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36', '192.168.1.130', 'China', 'Beijing', 'desktop', 'Chrome', 'sess_031', '2025-08-07 12:30:00'),
('550e8400-e29b-41d4-a716-446655440032', '/', 'direct', 'Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X) AppleWebKit/605.1.15', '192.168.1.131', 'Thailand', 'Bangkok', 'mobile', 'Safari', 'sess_032', '2025-08-07 11:15:00'),
('550e8400-e29b-41d4-a716-446655440033', '/services', 'https://bing.com', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36', '192.168.1.132', 'Singapore', 'Singapore', 'desktop', 'Chrome', 'sess_033', '2025-08-07 10:45:00'),
('550e8400-e29b-41d4-a716-446655440034', '/pricing', '/services', 'Mozilla/5.0 (iPad; CPU OS 15_0 like Mac OS X) AppleWebKit/605.1.15', '192.168.1.133', 'Malaysia', 'Kuala Lumpur', 'tablet', 'Safari', 'sess_034', '2025-08-07 09:20:00'),

-- August 6, 2025
('550e8400-e29b-41d4-a716-446655440035', '/', 'https://google.com', 'Mozilla/5.0 (Android 11; Mobile; rv:68.0) Gecko/68.0 Firefox/88.0', '192.168.1.134', 'Indonesia', 'Jakarta', 'mobile', 'Firefox', 'sess_035', '2025-08-06 08:30:00'),
('550e8400-e29b-41d4-a716-446655440036', '/', 'direct', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:91.0) Gecko/20100101 Firefox/91.0', '192.168.1.135', 'Philippines', 'Manila', 'desktop', 'Firefox', 'sess_036', '2025-08-06 07:15:00'),
('550e8400-e29b-41d4-a716-446655440037', '/contact', '/', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36', '192.168.1.136', 'Vietnam', 'Ho Chi Minh City', 'desktop', 'Safari', 'sess_037', '2025-08-06 06:45:00'),

-- August 5, 2025
('550e8400-e29b-41d4-a716-446655440038', '/', 'https://google.com', 'Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X) AppleWebKit/605.1.15', '192.168.1.137', 'New Zealand', 'Auckland', 'mobile', 'Safari', 'sess_038', '2025-08-05 05:30:00'),
('550e8400-e29b-41d4-a716-446655440039', '/services', 'https://google.com', 'Mozilla/5.0 (iPad; CPU OS 15_0 like Mac OS X) AppleWebKit/605.1.15', '192.168.1.138', 'South Africa', 'Cape Town', 'tablet', 'Safari', 'sess_039', '2025-08-05 04:15:00'),
('550e8400-e29b-41d4-a716-446655440040', '/about', '/services', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36', '192.168.1.139', 'Egypt', 'Cairo', 'desktop', 'Chrome', 'sess_040', '2025-08-05 03:45:00');
