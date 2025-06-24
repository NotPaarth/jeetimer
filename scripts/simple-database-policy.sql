-- Drop all existing policies
DROP POLICY IF EXISTS "Users can only access their own data" ON user_data;
DROP POLICY IF EXISTS "Users can access their own data" ON user_data;

-- Create a simple, permissive policy
CREATE POLICY "Enable all access for authenticated users" ON user_data
  FOR ALL 
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Ensure RLS is enabled
ALTER TABLE user_data ENABLE ROW LEVEL SECURITY;

-- Grant permissions
GRANT ALL ON user_data TO authenticated;
GRANT ALL ON user_data TO anon;
