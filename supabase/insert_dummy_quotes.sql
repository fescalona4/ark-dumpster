-- Dummy data for quotes table
-- Insert sample dumpster rental quotes for testing and demo purposes

INSERT INTO quotes (
  first_name,
  last_name,
  email,
  phone,
  address,
  city,
  state,
  zip_code,
  dumpster_size,
  dropoff_date,
  time_needed,
  message,
  status,
  quoted_price,
  quote_notes,
  priority,
  assigned_to,
  quoted_at
) VALUES 
-- Completed jobs
(
  'John',
  'Smith',
  'john.smith@email.com',
  '(727) 555-0101',
  '123 Oak Street',
  'Tampa',
  'FL',
  '33601',
  '20 yard',
  '2025-01-15',
  '3 days',
  'Home renovation project, mostly construction debris',
  'completed',
  450.00,
  'Standard rate for 20-yard, 3-day rental. Customer was very satisfied.',
  'normal',
  'Mike Johnson',
  '2025-01-10 14:30:00'
),
(
  'Sarah',
  'Johnson',
  'sarah.johnson@gmail.com',
  '(813) 555-0202',
  '456 Pine Avenue',
  'St. Petersburg',
  'FL',
  '33701',
  '30 yard',
  '2025-01-20',
  '5 days',
  'Office cleanout and furniture disposal',
  'completed',
  675.00,
  'Large commercial cleanout, extended rental period.',
  'normal',
  'Mike Johnson',
  '2025-01-12 09:15:00'
),

-- Accepted jobs (scheduled)
(
  'Michael',
  'Brown',
  'mike.brown@company.com',
  '(727) 555-0303',
  '789 Maple Drive',
  'Clearwater',
  'FL',
  '33755',
  '15 yard',
  '2025-02-10',
  '2 days',
  'Kitchen remodel - cabinets, countertops, and flooring',
  'accepted',
  380.00,
  'Customer confirmed pickup for Feb 10th. Residential area, easy access.',
  'normal',
  'Mike Johnson',
  '2025-01-25 11:20:00'
),
(
  'Lisa',
  'Davis',
  'lisa.davis@email.com',
  '(813) 555-0404',
  '321 Cedar Lane',
  'Largo',
  'FL',
  '33770',
  '20 yard',
  '2025-02-15',
  '4 days',
  'Garage cleanout and yard debris removal',
  'accepted',
  425.00,
  'Standard pricing. Customer requested early morning delivery.',
  'high',
  'Mike Johnson',
  '2025-01-28 16:45:00'
),

-- Quoted (waiting for customer response)
(
  'Robert',
  'Wilson',
  'robert.wilson@email.com',
  '(727) 555-0505',
  '654 Birch Street',
  'Safety Harbor',
  'FL',
  '34695',
  '10 yard',
  '2025-02-20',
  '1 day',
  'Small bathroom renovation',
  'quoted',
  275.00,
  'Minimum rental period quoted. Compact driveway access.',
  'normal',
  'Mike Johnson',
  '2025-02-01 10:30:00'
),
(
  'Jennifer',
  'Martinez',
  'jennifer.martinez@gmail.com',
  '(813) 555-0606',
  '987 Elm Court',
  'Dunedin',
  'FL',
  '34698',
  '30 yard',
  '2025-02-25',
  '7 days',
  'Commercial office renovation - multiple floors',
  'quoted',
  850.00,
  'Large project, extended rental. Permit may be required for street placement.',
  'high',
  'Mike Johnson',
  '2025-02-02 14:15:00'
),

-- Pending (new requests, not yet quoted)
(
  'David',
  'Anderson',
  'david.anderson@email.com',
  '(727) 555-0707',
  '147 Walnut Street',
  'Pinellas Park',
  'FL',
  '33781',
  '20 yard',
  '2025-02-28',
  '3 days',
  'Roof replacement project, shingles and underlayment',
  'pending',
  NULL,
  NULL,
  'urgent',
  NULL,
  NULL
),
(
  'Karen',
  'Thomas',
  'karen.thomas@email.com',
  '(813) 555-0808',
  '258 Cherry Boulevard',
  'Indian Rocks Beach',
  'FL',
  '33785',
  '15 yard',
  '2025-03-05',
  '2 days',
  'Landscaping project and tree removal debris',
  'pending',
  NULL,
  NULL,
  'normal',
  NULL,
  NULL
),
(
  'James',
  'White',
  'james.white@company.com',
  '(727) 555-0909',
  '369 Spruce Lane',
  'Belleair',
  'FL',
  '33756',
  '10 yard',
  '2025-03-10',
  '1 day',
  'Small deck demolition',
  'pending',
  NULL,
  NULL,
  'low',
  NULL,
  NULL
),

-- Declined quote
(
  'Amanda',
  'Garcia',
  'amanda.garcia@email.com',
  '(813) 555-1010',
  '741 Dogwood Avenue',
  'Redington Beach',
  'FL',
  '33708',
  '20 yard',
  '2025-02-18',
  '3 days',
  'Basement cleanout and old furniture removal',
  'declined',
  425.00,
  'Customer found cheaper alternative. Price was competitive.',
  'normal',
  'Mike Johnson',
  '2025-02-03 09:45:00'
),

-- Recent pending requests
(
  'Christopher',
  'Lee',
  'chris.lee@email.com',
  '(727) 555-1111',
  '852 Hickory Drive',
  'Seminole',
  'FL',
  '33772',
  '30 yard',
  '2025-03-15',
  '5 days',
  'Restaurant renovation - kitchen equipment and fixtures',
  'pending',
  NULL,
  NULL,
  'high',
  NULL,
  NULL
),
(
  'Michelle',
  'Rodriguez',
  'michelle.rodriguez@gmail.com',
  '(813) 555-1212',
  '963 Poplar Street',
  'Madeira Beach',
  'FL',
  '33708',
  '15 yard',
  '2025-03-20',
  '3 days',
  'Flooring replacement throughout house',
  'pending',
  NULL,
  NULL,
  'normal',
  NULL,
  NULL
);

-- Update timestamps to be more realistic (some older, some recent)
UPDATE quotes SET 
  created_at = '2025-01-08 10:15:00',
  updated_at = '2025-01-08 10:15:00'
WHERE email = 'john.smith@email.com';

UPDATE quotes SET 
  created_at = '2025-01-10 14:22:00',
  updated_at = '2025-01-10 14:22:00'
WHERE email = 'sarah.johnson@gmail.com';

UPDATE quotes SET 
  created_at = '2025-01-22 16:30:00',
  updated_at = '2025-01-25 11:20:00'
WHERE email = 'mike.brown@company.com';

UPDATE quotes SET 
  created_at = '2025-01-26 09:45:00',
  updated_at = '2025-01-28 16:45:00'
WHERE email = 'lisa.davis@email.com';

UPDATE quotes SET 
  created_at = '2025-01-30 13:15:00',
  updated_at = '2025-02-01 10:30:00'
WHERE email = 'robert.wilson@email.com';

UPDATE quotes SET 
  created_at = '2025-02-01 11:20:00',
  updated_at = '2025-02-02 14:15:00'
WHERE email = 'jennifer.martinez@gmail.com';

UPDATE quotes SET 
  created_at = '2025-02-05 08:30:00',
  updated_at = '2025-02-05 08:30:00'
WHERE email = 'david.anderson@email.com';

UPDATE quotes SET 
  created_at = '2025-02-06 15:45:00',
  updated_at = '2025-02-06 15:45:00'
WHERE email = 'karen.thomas@email.com';

UPDATE quotes SET 
  created_at = '2025-02-07 12:10:00',
  updated_at = '2025-02-07 12:10:00'
WHERE email = 'james.white@company.com';

UPDATE quotes SET 
  created_at = '2025-02-02 14:30:00',
  updated_at = '2025-02-04 09:20:00'
WHERE email = 'amanda.garcia@email.com';

UPDATE quotes SET 
  created_at = '2025-02-07 17:25:00',
  updated_at = '2025-02-07 17:25:00'
WHERE email = 'chris.lee@email.com';

UPDATE quotes SET 
  created_at = '2025-02-07 19:40:00',
  updated_at = '2025-02-07 19:40:00'
WHERE email = 'michelle.rodriguez@gmail.com';
