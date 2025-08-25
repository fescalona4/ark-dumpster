-- ============================================
-- CREATE UPDATE_DUMPSTER_GPS FUNCTION
-- ============================================
-- This function updates the GPS coordinates for a dumpster
-- It takes dumpster_id, lat, and lng parameters and updates
-- the gps_coordinates point column in the dumpsters table
-- ============================================

CREATE OR REPLACE FUNCTION update_dumpster_gps(
  dumpster_id uuid,
  lat double precision,
  lng double precision
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE dumpsters 
  SET 
    gps_coordinates = point(lng, lat),
    updated_at = now()
  WHERE id = dumpster_id;
  
  -- Check if the update affected any rows
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Dumpster with ID % not found', dumpster_id;
  END IF;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION update_dumpster_gps(uuid, double precision, double precision) TO authenticated;

-- Add a comment to document the function
COMMENT ON FUNCTION update_dumpster_gps(uuid, double precision, double precision) IS 'Updates GPS coordinates for a dumpster using latitude and longitude values';