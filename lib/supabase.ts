import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Database types
export interface UserData {
  id: string
  user_id: string
  tasks: any[]
  time_logs: any[]
  question_goal: any
  exam_settings: any
  streak_data: any
  timer_states: any
  created_at: string
  updated_at: string
}
