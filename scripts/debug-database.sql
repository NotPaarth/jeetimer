-- Check if user_data table exists and has data
SELECT * FROM user_data;

-- Check current user authentication
SELECT auth.uid() as current_user_id;

-- Check if RLS policies are working
SELECT * FROM user_data WHERE user_id = auth.uid();

-- Check table permissions
SELECT schemaname, tablename, hasinserts, hasselects, hasupdates, hasdeletes 
FROM pg_tables 
LEFT JOIN information_schema.table_privileges ON table_name = tablename 
WHERE tablename = 'user_data';
