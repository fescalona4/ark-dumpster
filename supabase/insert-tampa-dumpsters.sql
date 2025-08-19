-- Insert dumpsters with Tampa Bay area addresses for map testing
-- Run this script in your Supabase SQL editor

INSERT INTO dumpsters (name, address, size, status, condition, notes, gps_coordinates) VALUES
  ('ARK-HOME', '3024 29th St N, St. Petersburg, FL 33713', 'N/A', 'available', 'excellent', 'ARK Dumpster Business Home Office - St. Petersburg', '27.7987,-82.7074'),
  ('D001', '2850 34th St N, St. Petersburg, FL 33713', '20-yard', 'available', 'good', 'Near business home - residential area', '27.7945,-82.7129'),
  ('D002', '3150 22nd Ave N, St. Petersburg, FL 33713', '15-yard', 'assigned', 'excellent', 'Close to home office - construction project', '27.8021,-82.7035'),
  ('D003', '2675 30th St N, St. Petersburg, FL 33713', '25-yard', 'available', 'good', 'Neighborhood near business location', '27.7910,-82.7089'),
  ('D004', '3401 38th Ave N, St. Petersburg, FL 33714', '10-yard', 'in_transit', 'excellent', 'En route to nearby customer', '27.8156,-82.7156'),
  ('D005', '2401 18th Ave N, St. Petersburg, FL 33713', '30-yard', 'available', 'fair', 'Commercial district near home', '27.7889,-82.6945'),
  ('D006', '3678 31st St N, St. Petersburg, FL 33714', '20-yard', 'assigned', 'good', 'Residential project nearby', '27.8089,-82.7125'),
  ('D007', '7825 49th St N, Pinellas Park, FL 33781', '15-yard', 'maintenance', 'needs_repair', 'Pinellas Park industrial area', '27.8245,-82.6934'),
  ('D008', '401 N Tampa St, Tampa, FL 33602', '40-yard', 'available', 'excellent', 'Downtown Tampa location near Amalie Arena', '27.9506,-82.4572'),
  ('D009', '1002 N Florida Ave, Tampa, FL 33602', '20-yard', 'assigned', 'good', 'Seminole Heights residential area', '27.9644,-82.4579'),
  ('D010', '2506 W Kennedy Blvd, Tampa, FL 33609', '30-yard', 'available', 'good', 'West Tampa commercial district', '27.9467,-82.4832');

-- Update the updated_at timestamp for all new records
UPDATE dumpsters SET updated_at = NOW() WHERE name LIKE 'D0%' OR name = 'ARK-HOME';

-- Display summary of inserted records by status
SELECT 
  status,
  COUNT(*) as count,
  STRING_AGG(name, ', ' ORDER BY name) as dumpster_names
FROM dumpsters 
WHERE name LIKE 'D0%' OR name = 'ARK-HOME'
GROUP BY status
ORDER BY status;

-- Display all dumpsters with their locations
SELECT 
  name,
  address,
  size,
  status,
  condition,
  notes
FROM dumpsters 
WHERE name LIKE 'D0%' OR name = 'ARK-HOME'
ORDER BY CASE WHEN name = 'ARK-HOME' THEN 0 ELSE 1 END, name;
