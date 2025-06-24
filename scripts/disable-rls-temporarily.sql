-- TEMPORARY: Disable RLS to test if that's the issue
ALTER TABLE user_data DISABLE ROW LEVEL SECURITY;

-- Grant full access
GRANT ALL ON user_data TO authenticated;
GRANT ALL ON user_data TO anon;
GRANT ALL ON user_data TO public;

-- Note: This is NOT secure for production, only for testing
-- After confirming it works, we'll re-enable RLS with proper policies
