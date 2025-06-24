import { supabase } from "./supabase"

export interface SyncData {
  tasks: any[]
  timeLogs: any[]
  questionGoal: any
  examSettings: any
  streakData: any
  timerStates: any
  testResults: any[] // Add this line
}

export class SyncService {
  static async uploadUserData(userId: string, data: SyncData): Promise<void> {
    try {
      console.log("🔄 Uploading data for user:", userId)
      console.log("📦 Data to upload:", data)

      // Add detailed breakdown of what we're syncing
      console.log("📊 Sync breakdown:", {
        tasksCount: data.tasks?.length || 0,
        timeLogsCount: data.timeLogs?.length || 0,
        questionGoal: data.questionGoal,
        examType: data.examSettings?.examType,
        currentStreak: data.streakData?.currentStreak,
        timerStatesKeys: Object.keys(data.timerStates || {}),
      })

      // Use UPSERT instead of INSERT to avoid conflicts
      const { error } = await supabase.from("user_data").upsert(
        {
          user_id: userId,
          tasks: data.tasks,
          time_logs: data.timeLogs,
          question_goal: data.questionGoal,
          exam_settings: data.examSettings,
          streak_data: data.streakData,
          timer_states: data.timerStates,
          test_results: data.testResults, // Add this line
          updated_at: new Date().toISOString(),
        },
        {
          onConflict: "user_id",
        },
      )

      if (error) {
        console.error("❌ Upload error:", error)
        throw error
      }

      console.log("✅ Data uploaded successfully")
    } catch (error) {
      console.error("💥 Error uploading user data:", error)
      throw error
    }
  }

  static async downloadUserData(userId: string): Promise<SyncData | null> {
    try {
      console.log("📥 Downloading data for user:", userId)

      const { data, error } = await supabase.from("user_data").select("*").eq("user_id", userId).single()

      if (error) {
        if (error.code === "PGRST116") {
          // No data found - this is OK for new users
          console.log("ℹ️ No existing data found for user")
          return null
        }
        console.error("❌ Download error:", error)
        throw error
      }

      if (!data) {
        console.log("ℹ️ No data returned")
        return null
      }

      console.log("✅ Downloaded data:", data)

      return {
        tasks: data.tasks || [],
        timeLogs: data.time_logs || [],
        questionGoal: data.question_goal || { daily: 80 },
        examSettings: data.exam_settings || null,
        streakData: data.streak_data || { currentStreak: 0, longestStreak: 0, lastStudyDate: null },
        timerStates: data.timer_states || {},
        testResults: data.test_results || [], // Add this line
      }
    } catch (error) {
      console.error("💥 Error downloading user data:", error)
      throw error
    }
  }

  static async migrateLocalData(userId: string): Promise<void> {
    try {
      console.log("🔄 Migrating local data for user:", userId)

      // Check if user already has cloud data
      const existingData = await this.downloadUserData(userId)
      if (existingData) {
        console.log("ℹ️ User already has cloud data, skipping migration")
        return
      }

      // Get local data
      const localTasks = localStorage.getItem("study-tasks")
      const localTimeLogs = localStorage.getItem("study-time-logs")
      const localQuestionGoal = localStorage.getItem("study-question-goal")
      const localExamSettings = localStorage.getItem("exam-settings")
      const localStreakData = localStorage.getItem("streak-data")
      const localTimerStates = localStorage.getItem("timer-states")
      const localTestResults = localStorage.getItem("test-results")

      // If no local data, nothing to migrate
      if (
        !localTasks &&
        !localTimeLogs &&
        !localQuestionGoal &&
        !localExamSettings &&
        !localStreakData &&
        !localTimerStates
      ) {
        console.log("ℹ️ No local data to migrate")
        return
      }

      // Prepare migration data
      const migrationData: SyncData = {
        tasks: localTasks ? JSON.parse(localTasks) : [],
        timeLogs: localTimeLogs ? JSON.parse(localTimeLogs) : [],
        questionGoal: localQuestionGoal ? JSON.parse(localQuestionGoal) : { daily: 80 },
        examSettings: localExamSettings ? JSON.parse(localExamSettings) : null,
        streakData: localStreakData
          ? JSON.parse(localStreakData)
          : { currentStreak: 0, longestStreak: 0, lastStudyDate: null },
        timerStates: localTimerStates ? JSON.parse(localTimerStates) : {},
        testResults: localTestResults ? JSON.parse(localTestResults) : [], // Add this line
      }

      // Upload to cloud
      await this.uploadUserData(userId, migrationData)

      console.log("✅ Local data migrated successfully")
    } catch (error) {
      console.error("💥 Failed to migrate local data:", error)
      throw error
    }
  }
}
