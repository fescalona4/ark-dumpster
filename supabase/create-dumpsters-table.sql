-- Create dumpsters table for tracking dumpster inventory and assignments
CREATE TABLE dumpsters (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  
  -- Dumpster basic information
  name text NOT NULL UNIQUE, -- Friendly name/identifier for the dumpster
  address text, -- Current location/address where dumpster is stationed
  order_number text, -- Order number if currently assigned to an order
  
  -- Status tracking
  status text NOT NULL DEFAULT 'available' CHECK (status IN ('available', 'assigned', 'in_transit', 'maintenance', 'out_of_service')),
  
  -- Assignment tracking
  current_order_id uuid REFERENCES orders(id) ON DELETE SET NULL,
  assigned_to text, -- Driver or team member assigned
  
  -- Additional details
  size text, -- Size of dumpster (10-yard, 20-yard, etc.)
  condition text DEFAULT 'good' CHECK (condition IN ('excellent', 'good', 'fair', 'needs_repair')),
  notes text, -- Any additional notes about the dumpster
  
  -- Location tracking
  last_known_location text,
  gps_coordinates point, -- GPS coordinates if available
  
  -- Timestamps
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  last_assigned_at timestamp with time zone,
  last_maintenance_at timestamp with time zone
);

-- Create indexes for better query performance
CREATE INDEX idx_dumpsters_status ON dumpsters(status);
CREATE INDEX idx_dumpsters_current_order_id ON dumpsters(current_order_id);
CREATE INDEX idx_dumpsters_name ON dumpsters(name);

-- Enable Row Level Security
ALTER TABLE dumpsters ENABLE ROW LEVEL SECURITY;

-- Create policies for dumpsters table
-- Allow authenticated users (admins) to perform all operations
CREATE POLICY "Admins can manage dumpsters" ON dumpsters
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Insert some sample dumpsters for testing
INSERT INTO dumpsters (name, address, size, status, condition, notes) VALUES
  ('D001', 'ARK Dumpster Yard - Main Location', '10-yard', 'available', 'excellent', 'Recently cleaned and inspected'),
  ('D002', 'ARK Dumpster Yard - Main Location', '20-yard', 'available', 'good', 'Standard condition'),
  ('D003', 'ARK Dumpster Yard - Main Location', '30-yard', 'available', 'good', 'Large capacity dumpster'),
  ('D004', '123 Main St, Downtown', '20-yard', 'assigned', 'good', 'Currently at customer location'),
  ('D005', 'ARK Dumpster Yard - Storage Area', '10-yard', 'maintenance', 'needs_repair', 'Needs welding repair on side panel'),
  ('D006', 'In Transit to Customer', '15-yard', 'in_transit', 'excellent', 'On delivery truck'),
  ('D007', 'ARK Dumpster Yard - Main Location', '40-yard', 'available', 'excellent', 'Heavy-duty construction dumpster'),
  ('D008', '456 Oak Ave, Residential Area', '10-yard', 'assigned', 'good', 'Home renovation project');

-- Add trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_dumpsters_updated_at
  BEFORE UPDATE ON dumpsters
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
