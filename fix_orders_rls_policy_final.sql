-- Drop the existing policy
DROP POLICY "Enable all operations for authenticated users and service role" ON orders;

-- Create a temporarily permissive policy for testing
CREATE POLICY "Enable all operations for all users" 
ON orders FOR ALL 
TO public 
USING (true)
WITH CHECK (true);