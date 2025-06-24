"use client"
import { Button } from "@/components/ui/button"
import { Pause, Minimize2 } from "lucide-react"
import type { Subject, ExamSettings } from "@/lib/types"

interface FullscreenTimerProps {
  activeSubject: Subject
  time: number
  questionCount: number
  goalTitle?: string
  examSettings: ExamSettings
  onPause: () => void
  onExitFullscreen: () => void
}

export default function FullscreenTimer({
  activeSubject,
  time,
  questionCount,
  goalTitle,
  examSettings,
  onPause,
  onExitFullscreen,
}: FullscreenTimerProps) {
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

  const getSubjectDisplayName = (subject: Subject) => {
    return examSettings.subjectNames[subject] || subject.charAt(0).toUpperCase() + subject.slice(1)
  }

  return (
    <div className="fixed inset-0 bg-background z-50 flex flex-col items-center justify-center">
      {/* Exit button */}
      <Button variant="ghost" size="icon" className="absolute top-4 right-4" onClick={onExitFullscreen}>
        <Minimize2 size={20} />
      </Button>

      {/* Subject name */}
      <div className="text-2xl font-semibold mb-4 text-muted-foreground">{getSubjectDisplayName(activeSubject)}</div>

      {/* Timer display */}
      <div className="text-8xl md:text-9xl font-mono font-bold mb-8 text-center">{formatTime(time)}</div>

      {/* Current goal */}
      {goalTitle && (
        <div className="text-center mb-8">
          <div className="text-lg text-muted-foreground mb-2">Working on:</div>
          <div className="text-2xl font-medium max-w-2xl text-center">{goalTitle}</div>
        </div>
      )}

      {/* Question counter for non-classes subjects */}
      {activeSubject !== "classes" && (
        <div className="mb-8">
          <div className="text-center mb-4">
            <div className="text-4xl font-bold">{questionCount}</div>
            <div className="text-lg text-muted-foreground">questions solved</div>
          </div>
        </div>
      )}

      {/* Pause button */}
      <Button size="lg" onClick={onPause} className="text-lg px-8 py-4">
        <Pause size={24} className="mr-2" />
        Pause & Save
      </Button>
    </div>
  )
}
