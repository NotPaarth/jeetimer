"use client"
import { Play, Pause, Plus, Minus, Maximize2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import type { Subject, Task, ExamSettings } from "@/lib/types"

interface SubjectTimerState {
  isRunning: boolean
  startTime: string
  elapsedTime: number
  questionCount: number
  goalId?: string
  goalTitle?: string
}

type TimerStates = Record<Subject, SubjectTimerState>

interface EnhancedStudyTimerProps {
  activeSubject: Subject
  isRunning: boolean
  time: number
  questionCount: number
  tasks: Task[]
  examSettings: ExamSettings
  timerStates: TimerStates
  onChangeSubject: (subject: Subject) => void
  onStart: (goalId?: string, goalTitle?: string) => void
  onPause: () => void
  onQuestionCountChange: (count: number) => void
  onEnterFullscreen?: () => void
}

export default function EnhancedStudyTimer({
  activeSubject,
  isRunning,
  time,
  questionCount,
  tasks,
  examSettings,
  timerStates,
  onChangeSubject,
  onStart,
  onPause,
  onQuestionCountChange,
  onEnterFullscreen,
}: EnhancedStudyTimerProps) {
  // Get available subjects based on exam type
  const getAvailableSubjects = () => {
    const baseSubjects =
      examSettings.examType === "JEE"
        ? ["physics", "chemistry", "mathematics"]
        : ["physics", "chemistry", "botany", "zoology"]

    return [...baseSubjects, "classes"] as Subject[]
  }

  const availableSubjects = getAvailableSubjects()

  // Format time as HH:MM:SS
  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const secs = seconds % 60

    return [
      hours.toString().padStart(2, "0"),
      minutes.toString().padStart(2, "0"),
      secs.toString().padStart(2, "0"),
    ].join(":")
  }

  const incrementQuestionCount = () => {
    onQuestionCountChange(questionCount + 1)
  }

  const decrementQuestionCount = () => {
    if (questionCount > 0) {
      onQuestionCountChange(questionCount - 1)
    }
  }

  const getSubjectDisplayName = (subject: Subject) => {
    return examSettings.subjectNames[subject] || subject.charAt(0).toUpperCase() + subject.slice(1)
  }

  // Filter tasks by active subject
  const subjectTasks = tasks.filter((task) => task.subject === activeSubject && !task.completed)

  const handleStartWithoutGoal = () => {
    onStart()
  }

  const handleStartWithGoal = (taskId: string, taskTitle: string) => {
    onStart(taskId, taskTitle)
  }

  // Check if any subject has a running timer
  const hasAnyRunningTimer = Object.values(timerStates).some((state) => state.isRunning)
  const runningSubjects = Object.entries(timerStates)
    .filter(([, state]) => state.isRunning)
    .map(([subject]) => subject)

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="text-center">
          Study Timer - {examSettings.examType}
          {hasAnyRunningTimer && (
            <div className="text-sm font-normal text-muted-foreground mt-1">
              Running: {runningSubjects.map((subject) => getSubjectDisplayName(subject as Subject)).join(", ")}
            </div>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs value={activeSubject} onValueChange={(value) => onChangeSubject(value as Subject)} className="mb-6">
          <TabsList className={`grid w-full ${availableSubjects.length === 4 ? "grid-cols-4" : "grid-cols-5"}`}>
            {availableSubjects.map((subject) => (
              <TabsTrigger key={subject} value={subject} className="relative">
                {getSubjectDisplayName(subject)}
                {timerStates[subject]?.isRunning && (
                  <div className="absolute -top-1 -right-1 w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                )}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>

        <div className="flex flex-col items-center">
          <div className="text-6xl font-mono font-bold mb-8">{formatTime(time)}</div>

          {/* Show current goal if running */}
          {isRunning && timerStates[activeSubject]?.goalTitle && (
            <div className="mb-4 text-center">
              <div className="text-sm text-muted-foreground">Working on:</div>
              <div className="font-medium">{timerStates[activeSubject].goalTitle}</div>
            </div>
          )}

          <div className="flex flex-col gap-6 items-center">
            <div className="flex gap-4">
              {!isRunning ? (
                subjectTasks.length > 0 ? (
                  <div className="flex flex-col gap-2 items-center">
                    <Button onClick={handleStartWithoutGoal} className="flex items-center gap-2">
                      <Play size={16} />
                      Start Without Goal
                    </Button>
                    <div className="text-center">
                      <p className="text-sm text-muted-foreground mb-2">Or select a goal to work on:</p>
                      <div className="space-y-2 max-h-40 overflow-y-auto">
                        {subjectTasks.map((task) => (
                          <Button
                            key={task.id}
                            variant="outline"
                            className="w-full justify-start text-left"
                            onClick={() => handleStartWithGoal(task.id, task.title)}
                          >
                            {task.title}
                          </Button>
                        ))}
                      </div>
                    </div>
                  </div>
                ) : (
                  <Button onClick={handleStartWithoutGoal} className="flex items-center gap-2">
                    <Play size={16} />
                    Start
                  </Button>
                )
              ) : (
                <div className="flex gap-2">
                  <Button onClick={onPause} className="flex items-center gap-2">
                    <Pause size={16} />
                    Pause & Save
                  </Button>
                  {onEnterFullscreen && (
                    <Button variant="outline" onClick={onEnterFullscreen} className="flex items-center gap-2">
                      <Maximize2 size={16} />
                      Fullscreen
                    </Button>
                  )}
                </div>
              )}
            </div>

            {/* Only show question counter for non-classes subjects */}
            {activeSubject !== "classes" && (
              <div className="flex items-center gap-2 bg-muted p-1 rounded-lg">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={decrementQuestionCount}
                  disabled={questionCount === 0}
                  className="h-10 w-10 rounded-full"
                >
                  <Minus size={18} />
                </Button>
                <div className="flex items-center justify-center min-w-[80px]">
                  <span className="text-xl font-medium">{questionCount}</span>
                  <span className="text-xs text-muted-foreground ml-1">questions</span>
                </div>
                <Button variant="ghost" size="icon" onClick={incrementQuestionCount} className="h-10 w-10 rounded-full">
                  <Plus size={18} />
                </Button>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
