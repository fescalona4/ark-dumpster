-- Drop the existing policy (force drop)
DROP POLICY "Enable all operations for authenticated users and service role" ON orders;

-- Create a new comprehensive policy that allows both reading and writing
CREATE POLICY "Enable all operations for authenticated users and service role" 
ON orders FOR ALL 
TO public 
USING (
  auth.role() = 'authenticated' OR auth.role() IS NULL
)
WITH CHECK (
  auth.role() = 'authenticated' OR auth.role() IS NULL
);