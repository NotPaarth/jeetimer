-- Create user_data table for storing synced data
CREATE TABLE IF NOT EXISTS user_data (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  tasks JSONB DEFAULT '[]'::jsonb,
  time_logs JSONB DEFAULT '[]'::jsonb,
  question_goal JSONB DEFAULT '{"daily": 80}'::jsonb,
  exam_settings JSONB DEFAULT NULL,
  streak_data JSONB DEFAULT '{"currentStreak": 0, "longestStreak": 0, "lastStudyDate": null}'::jsonb,
  timer_states JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Enable Row Level Security
ALTER TABLE user_data ENABLE ROW LEVEL SECURITY;

-- Create policy to allow users to only access their own data
CREATE POLICY "Users can only access their own data" ON user_data
  FOR ALL USING (auth.uid() = user_id);

-- Create function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_user_data_updated_at 
  BEFORE UPDATE ON user_data 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();
