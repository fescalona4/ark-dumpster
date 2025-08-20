-- Create a function to update dumpster GPS coordinates
-- This function is needed because Supabase doesn't directly support 
-- PostgreSQL POINT type updates through the JS client

-- Drop the function if it exists (to handle parameter changes)
DROP FUNCTION IF EXISTS update_dumpster_gps(UUID, DOUBLE PRECISION, DOUBLE PRECISION);

CREATE OR REPLACE FUNCTION update_dumpster_gps(
  dumpster_id UUID,
  lng DOUBLE PRECISION,
  lat DOUBLE PRECISION
)
RETURNS void AS $$
BEGIN
  UPDATE dumpsters 
  SET 
    gps_coordinates = POINT(lng, lat),
    updated_at = NOW()
  WHERE id = dumpster_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION update_dumpster_gps TO authenticated;

-- Grant usage on schema if needed
GRANT USAGE ON SCHEMA public TO authenticated;