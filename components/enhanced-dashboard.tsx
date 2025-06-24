"use client"

import { useState, useEffect, useRef, useMemo, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Clock, BookOpen, Settings, Flame, Target, LogIn } from "lucide-react"
import { ThemeToggle } from "@/components/theme-toggle"
import type { Subject, Task, TimeLog, QuestionGoal, ExamSettings, StreakData } from "@/lib/types"
import SettingsDialog from "./settings-dialog"
import StudyTimer from "./enhanced-study-timer"
import FullscreenTimer from "./fullscreen-timer"
import TaskManager from "./task-manager"
import InsightsView from "./insights-view"
import TestTracker from "./test-tracker"
import LoginDialog from "./login-dialog"
import UserMenu from "./user-menu"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { getStudyDayStart, getStudyDayEnd, formatStudyDay } from "@/lib/date-utils"
import { useAuth } from "./auth-provider"
import { SyncService, type SyncData } from "@/lib/sync-service"
import { useToast } from "@/hooks/use-toast"
import { supabase } from "@/lib/supabase"

interface SubjectTimerState {
  isRunning: boolean
  startTime: string
  elapsedTime: number
  questionCount: number
  goalId?: string
  goalTitle?: string
}

type TimerStates = Record<Subject, SubjectTimerState>

const DEFAULT_JEE_SETTINGS: ExamSettings = {
  examType: "JEE",
  streakSettings: {
    minStudyHours: 10,
    minQuestions: 80,
  },
  subjectNames: {
    physics: "Physics",
    chemistry: "Chemistry",
    mathematics: "Mathematics",
    classes: "Classes",
  },
}

const DEFAULT_NEET_SETTINGS: ExamSettings = {
  examType: "NEET",
  streakSettings: {
    minStudyHours: 10,
    minQuestions: 80,
  },
  subjectNames: {
    physics: "Physics",
    chemistry: "Chemistry",
    botany: "Botany",
    zoology: "Zoology",
    classes: "Classes",
  },
}

const createDefaultTimerState = (): SubjectTimerState => ({
  isRunning: false,
  startTime: "",
  elapsedTime: 0,
  questionCount: 0,
  goalId: undefined,
  goalTitle: undefined,
})

const createDefaultTimerStates = (examType: "JEE" | "NEET"): TimerStates => {
  const subjects =
    examType === "JEE"
      ? ["physics", "chemistry", "mathematics", "classes"]
      : ["physics", "chemistry", "botany", "zoology", "classes"]

  const states: Partial<TimerStates> = {}
  subjects.forEach((subject) => {
    states[subject as Subject] = createDefaultTimerState()
  })

  return states as TimerStates
}

export default function EnhancedDashboard() {
  const { user, loading } = useAuth()
  const { toast } = useToast()

  const [activeTab, setActiveTab] = useState<string>("timer")
  const [tasks, setTasks] = useState<Task[]>([])
  const [timeLogs, setTimeLogs] = useState<TimeLog[]>([])
  const [questionGoal, setQuestionGoal] = useState<QuestionGoal>({ daily: 80 })
  const [examSettings, setExamSettings] = useState<ExamSettings>(DEFAULT_JEE_SETTINGS)
  const [streakData, setStreakData] = useState<StreakData>({
    currentStreak: 0,
    longestStreak: 0,
    lastStudyDate: null,
  })
  const [showSettings, setShowSettings] = useState(false)
  const [showLogin, setShowLogin] = useState(false)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [lastSyncTime, setLastSyncTime] = useState<Date | undefined>()
  const [isDataLoaded, setIsDataLoaded] = useState(false)

  // Timer state - now per subject
  const [activeSubject, setActiveSubject] = useState<Subject>("physics")
  const [timerStates, setTimerStates] = useState<TimerStates>(() => createDefaultTimerStates("JEE"))
  const [currentTime, setCurrentTime] = useState(Date.now())
  const updateIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const syncIntervalRef = useRef<NodeJS.Timeout | null>(null)

  // Load data (localStorage or cloud)
  useEffect(() => {
    const loadData = async () => {
      if (loading) return

      if (user) {
        // User is signed in, load from cloud
        try {
          // First, migrate any local data
          await SyncService.migrateLocalData(user.id)

          // Then load from cloud
          const cloudData = await SyncService.downloadUserData(user.id)

          if (cloudData) {
            setTasks(cloudData.tasks)
            setTimeLogs(cloudData.timeLogs)
            setQuestionGoal(cloudData.questionGoal)
            if (cloudData.examSettings) setExamSettings(cloudData.examSettings)
            setStreakData(cloudData.streakData)
            setTimerStates(cloudData.timerStates)
            setLastSyncTime(new Date())
          }
        } catch (error) {
          console.error("Failed to load cloud data:", error)
          toast({
            title: "Sync Error",
            description: "Failed to load your data from cloud. Using local data.",
            variant: "destructive",
          })
          // Fall back to local data
          loadLocalData()
        }
      } else {
        // User not signed in, load from localStorage
        loadLocalData()
      }

      setIsDataLoaded(true)
    }

    loadData()
  }, [user, loading])

  const loadLocalData = () => {
    const savedTasks = localStorage.getItem("study-tasks")
    const savedTimeLogs = localStorage.getItem("study-time-logs")
    const savedQuestionGoal = localStorage.getItem("study-question-goal")
    const savedExamSettings = localStorage.getItem("exam-settings")
    const savedStreakData = localStorage.getItem("streak-data")
    const savedTimerStates = localStorage.getItem("timer-states")

    if (savedTasks) setTasks(JSON.parse(savedTasks))
    if (savedTimeLogs) {
      try {
        const parsedLogs = JSON.parse(savedTimeLogs)
        const migratedLogs = parsedLogs.map((log: any) => {
          if (!log.startTime || !log.endTime) {
            const endTime = new Date(log.timestamp).toISOString()
            const startDate = new Date(log.timestamp)
            startDate.setSeconds(startDate.getSeconds() - log.duration)
            const startTime = startDate.toISOString()
            return { ...log, startTime, endTime, questionCount: log.questionCount || 0 }
          }
          return { ...log, questionCount: log.questionCount || 0 }
        })
        setTimeLogs(migratedLogs)
      } catch (error) {
        console.error("Error parsing time logs:", error)
        setTimeLogs([])
      }
    }
    if (savedQuestionGoal) setQuestionGoal(JSON.parse(savedQuestionGoal))
    if (savedExamSettings) {
      const settings = JSON.parse(savedExamSettings)
      setExamSettings(settings)
    }
    if (savedStreakData) setStreakData(JSON.parse(savedStreakData))
    if (savedTimerStates) {
      setTimerStates(JSON.parse(savedTimerStates))
    }
  }

  // Auto-sync data when user is signed in
  useEffect(() => {
    if (!user || !isDataLoaded) return

    const syncData = async () => {
      try {
        const syncData: SyncData = {
          tasks,
          timeLogs,
          questionGoal,
          examSettings,
          streakData,
          timerStates,
        }

        await SyncService.uploadUserData(user.id, syncData)
        setLastSyncTime(new Date())
      } catch (error) {
        console.error("Auto-sync failed:", error)
      }
    }

    // Sync immediately when data changes
    const timeoutId = setTimeout(syncData, 2000) // Debounce for 2 seconds

    return () => clearTimeout(timeoutId)
  }, [user, tasks, timeLogs, questionGoal, examSettings, streakData, timerStates, isDataLoaded])

  // Periodic sync every 5 minutes
  useEffect(() => {
    if (!user || !isDataLoaded) return

    syncIntervalRef.current = setInterval(
      async () => {
        try {
          const syncData: SyncData = {
            tasks,
            timeLogs,
            questionGoal,
            examSettings,
            streakData,
            timerStates,
          }

          await SyncService.uploadUserData(user.id, syncData)
          setLastSyncTime(new Date())
        } catch (error) {
          console.error("Periodic sync failed:", error)
        }
      },
      5 * 60 * 1000,
    ) // 5 minutes

    return () => {
      if (syncIntervalRef.current) {
        clearInterval(syncIntervalRef.current)
      }
    }
  }, [user, tasks, timeLogs, questionGoal, examSettings, streakData, timerStates, isDataLoaded])

  // Save to localStorage when not signed in
  useEffect(() => {
    if (user || !isDataLoaded) return
    localStorage.setItem("study-tasks", JSON.stringify(tasks))
  }, [tasks, user, isDataLoaded])

  useEffect(() => {
    if (user || !isDataLoaded) return
    localStorage.setItem("study-time-logs", JSON.stringify(timeLogs))
  }, [timeLogs, user, isDataLoaded])

  useEffect(() => {
    if (user || !isDataLoaded) return
    localStorage.setItem("study-question-goal", JSON.stringify(questionGoal))
  }, [questionGoal, user, isDataLoaded])

  useEffect(() => {
    if (user || !isDataLoaded) return
    localStorage.setItem("exam-settings", JSON.stringify(examSettings))
  }, [examSettings, user, isDataLoaded])

  useEffect(() => {
    if (user || !isDataLoaded) return
    localStorage.setItem("streak-data", JSON.stringify(streakData))
  }, [streakData, user, isDataLoaded])

  useEffect(() => {
    if (user || !isDataLoaded) return
    localStorage.setItem("timer-states", JSON.stringify(timerStates))
  }, [timerStates, user, isDataLoaded])

  // Add database connection test
  useEffect(() => {
    const testDatabaseConnection = async () => {
      if (!user) return

      try {
        console.log("🧪 Testing database connection...")
        console.log("User ID:", user.id)
        console.log("User email:", user.email)

        // Test basic connection
        const { data: testData, error: testError } = await supabase
          .from("user_data")
          .select("id")
          .eq("user_id", user.id)
          .limit(1)

        if (testError) {
          console.error("❌ Database test failed:", testError)
          toast({
            title: "Database Error",
            description: `Connection failed: ${testError.message}`,
            variant: "destructive",
          })
        } else {
          console.log("✅ Database connection successful")
          console.log("Existing data:", testData)
        }
      } catch (error) {
        console.error("💥 Database test error:", error)
      }
    }

    testDatabaseConnection()
  }, [user])

  // Manual sync function
  const handleManualSync = async () => {
    if (!user) return

    const syncData: SyncData = {
      tasks,
      timeLogs,
      questionGoal,
      examSettings,
      streakData,
      timerStates,
    }

    await SyncService.uploadUserData(user.id, syncData)
    setLastSyncTime(new Date())
  }

  // Update exam type changes
  useEffect(() => {
    const newTimerStates = createDefaultTimerStates(examSettings.examType)
    // Preserve existing states for subjects that exist in both exam types
    Object.keys(timerStates).forEach((subject) => {
      if (newTimerStates[subject as Subject]) {
        newTimerStates[subject as Subject] = timerStates[subject as Subject]
      }
    })
    setTimerStates(newTimerStates)

    // Reset active subject if it doesn't exist in new exam type
    const availableSubjects =
      examSettings.examType === "JEE"
        ? ["physics", "chemistry", "mathematics", "classes"]
        : ["physics", "chemistry", "botany", "zoology", "classes"]

    if (!availableSubjects.includes(activeSubject)) {
      setActiveSubject("physics")
    }
  }, [examSettings.examType])

  // Timer update mechanism - separate from timer states
  useEffect(() => {
    const hasRunningTimer = Object.values(timerStates).some((state) => state.isRunning)

    if (hasRunningTimer) {
      updateIntervalRef.current = setInterval(() => {
        setCurrentTime(Date.now())
      }, 1000)
    } else {
      if (updateIntervalRef.current) {
        clearInterval(updateIntervalRef.current)
        updateIntervalRef.current = null
      }
    }

    return () => {
      if (updateIntervalRef.current) {
        clearInterval(updateIntervalRef.current)
      }
    }
  }, [timerStates])

  // Calculate current elapsed times based on currentTime
  const currentTimerStates = useMemo(() => {
    const now = currentTime
    const updatedStates = { ...timerStates }

    Object.keys(updatedStates).forEach((subject) => {
      const state = updatedStates[subject as Subject]
      if (state.isRunning && state.startTime) {
        const startTime = new Date(state.startTime).getTime()
        const currentElapsed = Math.floor((now - startTime) / 1000)
        updatedStates[subject as Subject] = {
          ...state,
          elapsedTime: currentElapsed,
        }
      }
    })

    return updatedStates
  }, [timerStates, currentTime])

  // Timer functions
  const handleStartTimer = useCallback(
    (goalId?: string, goalTitle?: string) => {
      const currentState = timerStates[activeSubject]
      if (!currentState.isRunning) {
        const startTime = new Date().toISOString()

        setTimerStates((prev) => ({
          ...prev,
          [activeSubject]: {
            ...prev[activeSubject],
            isRunning: true,
            startTime,
            elapsedTime: 0,
            goalId,
            goalTitle,
          },
        }))
      }
    },
    [activeSubject, timerStates],
  )

  const handlePauseTimer = useCallback(() => {
    const currentState = currentTimerStates[activeSubject]
    if (currentState.isRunning) {
      const endTime = new Date().toISOString()

      // Save the session
      const newLog: TimeLog = {
        id: Date.now().toString(),
        subject: activeSubject,
        startTime: currentState.startTime,
        endTime: endTime,
        duration: currentState.elapsedTime,
        questionCount: currentState.questionCount,
        goalId: currentState.goalId,
        goalTitle: currentState.goalTitle,
      }

      setTimeLogs((prev) => [...prev, newLog])

      // Reset timer for this subject
      setTimerStates((prev) => ({
        ...prev,
        [activeSubject]: createDefaultTimerState(),
      }))

      // Exit fullscreen if in fullscreen mode
      if (isFullscreen) {
        setIsFullscreen(false)
      }
    }
  }, [activeSubject, currentTimerStates, isFullscreen])

  const handleQuestionCountChange = useCallback(
    (count: number) => {
      setTimerStates((prev) => ({
        ...prev,
        [activeSubject]: {
          ...prev[activeSubject],
          questionCount: count,
        },
      }))
    },
    [activeSubject],
  )

  const handleEnterFullscreen = useCallback(() => {
    setIsFullscreen(true)
  }, [])

  const handleExitFullscreen = useCallback(() => {
    setIsFullscreen(false)
  }, [])

  // Manual log functions
  const handleAddManualLog = useCallback(
    (
      subject: Subject,
      startTime: string,
      endTime: string,
      questionCount?: number,
      goalId?: string,
      goalTitle?: string,
      notes?: string,
    ) => {
      const startDate = new Date(startTime)
      const endDate = new Date(endTime)
      const duration = Math.floor((endDate.getTime() - startDate.getTime()) / 1000)

      const newLog: TimeLog = {
        id: Date.now().toString(),
        subject,
        startTime,
        endTime,
        duration,
        questionCount: questionCount || 0,
        goalId,
        goalTitle,
        notes,
      }

      setTimeLogs((prev) => [...prev, newLog])
    },
    [],
  )

  const handleDeleteLog = useCallback((logId: string) => {
    setTimeLogs((prev) => prev.filter((log) => log.id !== logId))
  }, [])

  const handleEditLogEndTime = useCallback((logId: string, newEndTime: string) => {
    setTimeLogs((prev) =>
      prev.map((log) => {
        if (log.id === logId) {
          const startDate = new Date(log.startTime)
          const endDate = new Date(newEndTime)
          const duration = Math.floor((endDate.getTime() - startDate.getTime()) / 1000)
          return { ...log, endTime: newEndTime, duration }
        }
        return log
      }),
    )
  }, [])

  const handleEditLogQuestionCount = useCallback((logId: string, newQuestionCount: number) => {
    setTimeLogs((prev) => prev.map((log) => (log.id === logId ? { ...log, questionCount: newQuestionCount } : log)))
  }, [])

  const handleEditLogNotes = useCallback((logId: string, newNotes: string) => {
    setTimeLogs((prev) => prev.map((log) => (log.id === logId ? { ...log, notes: newNotes } : log)))
  }, [])

  // Task functions
  const handleAddTask = useCallback((task: Task) => {
    setTasks((prev) => [...prev, task])
  }, [])

  const handleToggleComplete = useCallback((taskId: string) => {
    setTasks((prev) => prev.map((task) => (task.id === taskId ? { ...task, completed: !task.completed } : task)))
  }, [])

  const handleDeleteTask = useCallback((taskId: string) => {
    setTasks((prev) => prev.filter((task) => task.id !== taskId))
  }, [])

  // Update question goal
  const updateQuestionGoal = useCallback((newGoal: number) => {
    setQuestionGoal({ daily: newGoal })
  }, [])

  // Calculate today's stats
  const todayStats = useMemo(() => {
    const studyDayStart = getStudyDayStart()
    const studyDayEnd = getStudyDayEnd()

    const todayLogs = timeLogs.filter((log) => {
      const logDate = new Date(log.startTime)
      return logDate >= studyDayStart && logDate <= studyDayEnd
    })

    const availableSubjects =
      examSettings.examType === "JEE"
        ? ["physics", "chemistry", "mathematics", "classes"]
        : ["physics", "chemistry", "botany", "zoology", "classes"]

    const timeBySubject: Record<string, number> = {}
    const questionsBySubject: Record<string, number> = {}

    availableSubjects.forEach((subject) => {
      timeBySubject[subject] = 0
      questionsBySubject[subject] = 0
    })

    // Add completed sessions
    todayLogs.forEach((log) => {
      if (availableSubjects.includes(log.subject)) {
        timeBySubject[log.subject] += log.duration
        questionsBySubject[log.subject] += log.questionCount
      }
    })

    // Add current running sessions
    Object.keys(currentTimerStates).forEach((subject) => {
      const state = currentTimerStates[subject as Subject]
      if (state.isRunning && availableSubjects.includes(subject)) {
        timeBySubject[subject] += state.elapsedTime
        questionsBySubject[subject] += state.questionCount
      }
    })

    const totalStudyTime = Object.values(timeBySubject).reduce((sum, time) => sum + time, 0)
    const totalQuestions = Object.entries(questionsBySubject)
      .filter(([subject]) => subject !== "classes")
      .reduce((sum, [, count]) => sum + count, 0)

    return {
      timeBySubject,
      questionsBySubject,
      totalStudyTime,
      totalQuestions,
      availableSubjects,
    }
  }, [timeLogs, currentTimerStates, examSettings.examType])

  // Check and update streak - using 4:30 AM reset
  useEffect(() => {
    const checkStreak = () => {
      const now = new Date()
      const todayStudyDay = formatStudyDay(now)
      const { minStudyHours, minQuestions } = examSettings.streakSettings

      const todayStudyHours = todayStats.totalStudyTime / 3600
      const todayQuestions = todayStats.totalQuestions

      const metRequirements = todayStudyHours >= minStudyHours && todayQuestions >= minQuestions

      // Check if we need to reset streak due to missed days
      if (streakData.lastStudyDate) {
        const lastStudyDate = new Date(streakData.lastStudyDate)
        const currentStudyDayStart = getStudyDayStart(now)
        const lastStudyDayStart = getStudyDayStart(lastStudyDate)

        const daysDifference = Math.floor(
          (currentStudyDayStart.getTime() - lastStudyDayStart.getTime()) / (1000 * 60 * 60 * 24),
        )

        // If more than 1 study day has passed, reset streak
        if (daysDifference > 1) {
          setStreakData((prev) => ({
            ...prev,
            currentStreak: 0,
            lastStudyDate: null,
          }))
          return
        }
      }

      // Update streak if requirements are met and it's a new study day
      if (metRequirements && streakData.lastStudyDate !== todayStudyDay) {
        const yesterday = new Date(now)
        yesterday.setDate(yesterday.getDate() - 1)
        const yesterdayStudyDay = formatStudyDay(yesterday)

        let newCurrentStreak = 1
        if (streakData.lastStudyDate === yesterdayStudyDay) {
          newCurrentStreak = streakData.currentStreak + 1
        }

        const newStreakData = {
          currentStreak: newCurrentStreak,
          longestStreak: Math.max(streakData.longestStreak, newCurrentStreak),
          lastStudyDate: todayStudyDay,
        }

        setStreakData(newStreakData)
      }
    }

    checkStreak()
  }, [todayStats, examSettings.streakSettings, streakData])

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    if (hours > 0) {
      return `${hours}h ${minutes}m`
    }
    return `${minutes}m`
  }

  const getSubjectDisplayName = (subject: string) => {
    return examSettings.subjectNames[subject] || subject.charAt(0).toUpperCase() + subject.slice(1)
  }

  // Get current subject timer state
  const currentSubjectState = currentTimerStates[activeSubject]

  // Show fullscreen timer if in fullscreen mode
  if (isFullscreen) {
    return (
      <FullscreenTimer
        activeSubject={activeSubject}
        time={currentSubjectState.elapsedTime}
        questionCount={currentSubjectState.questionCount}
        goalTitle={currentSubjectState.goalTitle}
        examSettings={examSettings}
        onPause={handlePauseTimer}
        onExitFullscreen={handleExitFullscreen}
      />
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-card">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <ThemeToggle />
            <h1 className="text-2xl font-bold">Study Tracker</h1>
            <div className="flex items-center gap-2">
              {user ? (
                <UserMenu onManualSync={handleManualSync} lastSyncTime={lastSyncTime} />
              ) : (
                <Button variant="ghost" size="sm" onClick={() => setShowLogin(true)}>
                  <LogIn className="h-4 w-4 mr-2" />
                  Sign In
                </Button>
              )}
              <Button variant="ghost" size="icon" onClick={() => setShowSettings(true)}>
                <Settings className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6">
        {/* Sync Status Banner */}
        {user && (
          <div className="mb-4 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-sm text-green-700 dark:text-green-300">Synced across devices</span>
              </div>
              {lastSyncTime && (
                <span className="text-xs text-green-600 dark:text-green-400">
                  Last sync: {lastSyncTime.toLocaleTimeString()}
                </span>
              )}
            </div>
          </div>
        )}

        {/* Dashboard Stats - Always Visible */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Total Study Time */}
          <div className="text-center">
            <div className="text-4xl font-bold mb-2">{formatTime(todayStats.totalStudyTime)}</div>
            <div className="flex items-center justify-center text-muted-foreground mb-4">
              <Clock className="mr-2 h-4 w-4" />
              <span>Total Study Time</span>
            </div>

            {/* Subject breakdown */}
            <div className="grid grid-cols-2 gap-2 text-sm">
              {todayStats.availableSubjects.map((subject) => (
                <div key={`time-${subject}`} className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div
                      className={`w-2 h-2 rounded-full mr-2 ${currentTimerStates[subject as Subject]?.isRunning ? "bg-green-500 animate-pulse" : "bg-blue-500"}`}
                    ></div>
                    <span>{getSubjectDisplayName(subject)}:</span>
                  </div>
                  <span className="font-medium">{formatTime(todayStats.timeBySubject[subject])}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Questions Solved */}
          <div className="text-center">
            <div className="flex items-center justify-center gap-2 mb-2">
              <span className="text-4xl font-bold">{todayStats.totalQuestions}</span>
              <span className="text-xl text-muted-foreground">/ {questionGoal.daily}</span>
            </div>
            <div className="flex items-center justify-center text-muted-foreground mb-4">
              <BookOpen className="mr-2 h-4 w-4" />
              <span>Questions Solved Today</span>
            </div>

            {/* Subject breakdown */}
            <div className="grid grid-cols-2 gap-2 text-sm">
              {todayStats.availableSubjects
                .filter((subject) => subject !== "classes")
                .map((subject) => (
                  <div key={`questions-${subject}`} className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div
                        className={`w-2 h-2 rounded-full mr-2 ${currentTimerStates[subject as Subject]?.isRunning ? "bg-green-500 animate-pulse" : "bg-green-500"}`}
                      ></div>
                      <span>{getSubjectDisplayName(subject)}:</span>
                    </div>
                    <span className="font-medium">{todayStats.questionsBySubject[subject]}</span>
                  </div>
                ))}
            </div>
          </div>

          {/* Streak & Goals */}
          <div className="text-center">
            <div className="text-4xl font-bold mb-2">{streakData.currentStreak}</div>
            <div className="flex items-center justify-center text-muted-foreground mb-1">
              <Flame className="mr-2 h-4 w-4" />
              <span>days</span>
            </div>
            <div className="text-sm text-muted-foreground mb-4">Current Streak</div>

            <div className="space-y-2 text-sm">
              <div>Longest Streak: {streakData.longestStreak} days</div>
              <div className="border-t pt-2">
                <div className="flex items-center justify-center mb-2">
                  <Target className="mr-2 h-3 w-3" />
                  <span className="font-medium">Daily Goals:</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Study time:</span>
                  <span
                    className={`font-medium ${(todayStats.totalStudyTime / 3600) >= examSettings.streakSettings.minStudyHours ? "text-green-600" : "text-orange-600"}`}
                  >
                    {Math.floor(todayStats.totalStudyTime / 3600)}h / {examSettings.streakSettings.minStudyHours}h
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Questions:</span>
                  <span
                    className={`font-medium ${todayStats.totalQuestions >= examSettings.streakSettings.minQuestions ? "text-green-600" : "text-orange-600"}`}
                  >
                    {todayStats.totalQuestions} / {examSettings.streakSettings.minQuestions}
                  </span>
                </div>
                {todayStats.totalStudyTime / 3600 >= examSettings.streakSettings.minStudyHours &&
                  todayStats.totalQuestions >= examSettings.streakSettings.minQuestions && (
                    <div className="text-green-600 font-medium mt-1">✅ Goals Met!</div>
                  )}
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-4 mb-6">
            <TabsTrigger value="timer">Study Timer</TabsTrigger>
            <TabsTrigger value="tasks">Tasks</TabsTrigger>
            <TabsTrigger value="tests">Tests</TabsTrigger>
            <TabsTrigger value="insights">Insights</TabsTrigger>
          </TabsList>

          <TabsContent value="timer">
            <StudyTimer
              activeSubject={activeSubject}
              isRunning={currentSubjectState.isRunning}
              time={currentSubjectState.elapsedTime}
              questionCount={currentSubjectState.questionCount}
              tasks={tasks}
              examSettings={examSettings}
              timerStates={currentTimerStates}
              onChangeSubject={setActiveSubject}
              onStart={handleStartTimer}
              onPause={handlePauseTimer}
              onQuestionCountChange={handleQuestionCountChange}
              onEnterFullscreen={handleEnterFullscreen}
            />
          </TabsContent>

          <TabsContent value="tasks">
            <TaskManager
              tasks={tasks}
              onAddTask={handleAddTask}
              onToggleComplete={handleToggleComplete}
              onDeleteTask={handleDeleteTask}
            />
          </TabsContent>

          <TabsContent value="tests">
            <TestTracker examSettings={examSettings} />
          </TabsContent>

          <TabsContent value="insights">
            <InsightsView
              timeLogs={timeLogs}
              tasks={tasks}
              questionGoal={questionGoal}
              onDeleteLog={handleDeleteLog}
              onEditLogEndTime={handleEditLogEndTime}
              onEditLogQuestionCount={handleEditLogQuestionCount}
              onEditLogNotes={handleEditLogNotes}
              onAddManualLog={handleAddManualLog}
              onUpdateQuestionGoal={updateQuestionGoal}
            />
          </TabsContent>
        </Tabs>
      </div>

      <SettingsDialog
        open={showSettings}
        onOpenChange={setShowSettings}
        examSettings={examSettings}
        onSave={setExamSettings}
      />

      <LoginDialog open={showLogin} onOpenChange={setShowLogin} />
    </div>
  )
}
