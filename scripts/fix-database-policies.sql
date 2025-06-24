-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can only access their own data" ON user_data;

-- Recreate the policy with proper permissions
CREATE POLICY "Users can access their own data" ON user_data
  FOR ALL 
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Make sure RLS is enabled
ALTER TABLE user_data ENABLE ROW LEVEL SECURITY;

-- Grant necessary permissions to authenticated users
GRANT ALL ON user_data TO authenticated;
GRANT USAGE ON SCHEMA public TO authenticated;

-- Test the policy by checking if current user can access data
SELECT 
  auth.uid() as current_user_id,
  COUNT(*) as accessible_rows
FROM user_data 
WHERE user_id = auth.uid();
