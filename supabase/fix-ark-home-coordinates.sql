-- Fix ARK-HOME GPS coordinates
-- The correct coordinates for 3024 29th St N, St. Petersburg, FL 33713 are:
-- Latitude: 27.7987, Longitude: -82.7074

-- Update ARK-HOME with correct GPS coordinates
UPDATE dumpsters 
SET 
  gps_coordinates = POINT(-82.7074, 27.7987),
  updated_at = NOW()
WHERE name = 'ARK-HOME';

-- Verify the update
SELECT 
  name,
  address,
  gps_coordinates,
  gps_coordinates[0] as longitude,
  gps_coordinates[1] as latitude
FROM dumpsters 
WHERE name = 'ARK-HOME';