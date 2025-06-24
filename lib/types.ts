export type ExamType = "weekly" | "monthly" | "quiz" | "mock"

export interface TestResult {
  id: string
  examType: ExamType
  testName: string
  date: string
  duration?: number
  subjects: Record<
    string,
    {
      attempted: number
      correct: number
      incorrect: number
      marks: number
      totalMarks: number
    }
  >
  totalMarks: number
  maxMarks: number
  percentage: number
  rank?: number
  notes?: string
}

export type Subject = "physics" | "chemistry" | "mathematics" | "botany" | "zoology" | "classes"

export interface Task {
  id: string
  title: string
  subject: Subject
  completed: boolean
  createdAt: string
  targetDate?: string // Add target date for planning tomorrow's tasks
  priority?: "low" | "medium" | "high"
  estimatedTime?: number // in minutes
}

export interface TimeLog {
  id: string
  subject: Subject
  duration: number
  timestamp: string
  startTime: string
  endTime: string
  questionCount: number
  goalId?: string
  goalTitle?: string
  notes?: string
}

export interface QuestionGoal {
  daily: number
}

export interface ExamSettings {
  examType: "JEE" | "NEET"
  streakSettings: {
    minStudyHours: number
    minQuestions: number
  }
  subjectNames: Record<string, string>
}

export interface StreakData {
  currentStreak: number
  longestStreak: number
  lastStudyDate: string | null
}
