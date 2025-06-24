"use client"

import { useState, useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Trash2, Plus, Clock, BookOpen } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import type { Subject, TimeLog, Task } from "@/lib/types"
import { format } from "date-fns"

interface StudyLogsProps {
  logs: TimeLog[]
  onDeleteLog: (logId: string) => void
  onEditLogEndTime: (logId: string, newEndTime: string) => void
  onEditLogQuestionCount: (logId: string, newQuestionCount: number) => void
  onEditLogNotes: (logId: string, newNotes: string) => void
  onAddManualLog: (
    subject: Subject,
    startTime: string,
    endTime: string,
    questionCount?: number,
    goalId?: string,
    goalTitle?: string,
    notes?: string,
  ) => void
  tasks: Task[]
}

// Subject color mapping
const SUBJECT_COLORS: Record<Subject, string> = {
  physics: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300",
  chemistry: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
  mathematics: "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-300",
  botany: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-300",
  zoology: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300",
  classes: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300",
}

export default function StudyLogs({
  logs,
  onDeleteLog,
  onEditLogEndTime,
  onEditLogQuestionCount,
  onEditLogNotes,
  onAddManualLog,
  tasks,
}: StudyLogsProps) {
  // For adding manual log
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [newSubject, setNewSubject] = useState<Subject>("physics")
  const [newStartTime, setNewStartTime] = useState<string>("")
  const [newEndTime, setNewEndTime] = useState<string>("")
  const [newQuestionCount, setNewQuestionCount] = useState<number>(0)
  const [newGoalId, setNewGoalId] = useState<string>("none")
  const [newNotes, setNewNotes] = useState<string>("")
  const [error, setError] = useState<string>("")

  // Add this function after the state declarations
  const setDefaultTimes = () => {
    const now = new Date()
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000)

    // Format for datetime-local input (YYYY-MM-DDTHH:MM)
    const formatForInput = (date: Date) => {
      const year = date.getFullYear()
      const month = String(date.getMonth() + 1).padStart(2, "0")
      const day = String(date.getDate()).padStart(2, "0")
      const hours = String(date.getHours()).padStart(2, "0")
      const minutes = String(date.getMinutes()).padStart(2, "0")
      return `${year}-${month}-${day}T${hours}:${minutes}`
    }

    if (!newStartTime) setNewStartTime(formatForInput(oneHourAgo))
    if (!newEndTime) setNewEndTime(formatForInput(now))
  }

  // Handle adding manual log
  const handleAddManualLog = () => {
    console.log("Adding manual log with data:", {
      newSubject,
      newStartTime,
      newEndTime,
      newQuestionCount,
      newGoalId,
      newNotes,
    })

    setError("")

    if (!newSubject || !newStartTime || !newEndTime) {
      setError("Subject, start time, and end time are required")
      return
    }

    try {
      const startDate = new Date(newStartTime)
      const endDate = new Date(newEndTime)

      if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
        setError("Invalid date format")
        return
      }

      if (endDate <= startDate) {
        setError("End time must be after start time")
        return
      }

      if (newQuestionCount < 0) {
        setError("Question count cannot be negative")
        return
      }

      // Find the selected goal title if a goal ID is selected
      let goalTitle
      if (newGoalId && newGoalId !== "none") {
        const selectedTask = tasks.find((task) => task.id === newGoalId)
        goalTitle = selectedTask?.title
      }

      console.log("Calling onAddManualLog with:", {
        subject: newSubject,
        startTime: newStartTime,
        endTime: newEndTime,
        questionCount: newQuestionCount,
        goalId: newGoalId !== "none" ? newGoalId : undefined,
        goalTitle,
        notes: newNotes || undefined,
      })

      onAddManualLog(
        newSubject,
        newStartTime,
        newEndTime,
        newQuestionCount,
        newGoalId !== "none" ? newGoalId : undefined,
        goalTitle,
        newNotes || undefined,
      )

      // Reset form and close dialog
      setNewSubject("physics")
      setNewStartTime("")
      setNewEndTime("")
      setNewQuestionCount(0)
      setNewGoalId("none")
      setNewNotes("")
      setError("")
      setIsAddDialogOpen(false)

      console.log("Manual log added successfully")
    } catch (e) {
      console.error("Error adding manual log:", e)
      setError("Failed to add log: " + (e instanceof Error ? e.message : "Unknown error"))
    }
  }

  // Format date for display
  const formatDateTime = (dateString: string) => {
    try {
      return format(new Date(dateString), "MMM d, yyyy h:mm a")
    } catch (e) {
      return "Invalid date"
    }
  }

  // Format duration for display
  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    if (hours > 0) {
      return `${hours}h ${minutes}m`
    }
    return `${minutes}m`
  }

  // Get available tasks for the selected subject
  const availableTasks = useMemo(() => {
    return tasks.filter((task) => task.subject === newSubject)
  }, [tasks, newSubject])

  // Sort logs by start time (newest first)
  const sortedLogs = [...logs].sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime())

  return (
    <Card className="w-full">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Study Session Logs</CardTitle>

        <Dialog
          open={isAddDialogOpen}
          onOpenChange={(open) => {
            setIsAddDialogOpen(open)
            if (open) {
              setDefaultTimes()
              setError("")
            }
          }}
        >
          <DialogTrigger asChild>
            <Button size="sm" className="flex items-center gap-1">
              <Plus size={16} />
              Add Manual Log
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Add Manual Study Log</DialogTitle>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Subject</Label>
                <Select
                  value={newSubject}
                  onValueChange={(value) => {
                    setNewSubject(value as Subject)
                    setNewGoalId("none")
                  }}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="physics">Physics</SelectItem>
                    <SelectItem value="chemistry">Chemistry</SelectItem>
                    <SelectItem value="mathematics">Mathematics</SelectItem>
                    <SelectItem value="botany">Botany</SelectItem>
                    <SelectItem value="zoology">Zoology</SelectItem>
                    <SelectItem value="classes">Classes</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Start Time</Label>
                <Input type="datetime-local" value={newStartTime} onChange={(e) => setNewStartTime(e.target.value)} />
              </div>

              <div className="space-y-2">
                <Label>End Time</Label>
                <Input type="datetime-local" value={newEndTime} onChange={(e) => setNewEndTime(e.target.value)} />
              </div>

              <div className="space-y-2">
                <Label>Questions Practiced</Label>
                <Input
                  type="number"
                  min="0"
                  value={newQuestionCount}
                  onChange={(e) => setNewQuestionCount(Number(e.target.value) || 0)}
                />
              </div>

              <div className="space-y-2">
                <Label>Study Goal (Optional)</Label>
                <Select value={newGoalId} onValueChange={setNewGoalId}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No specific goal</SelectItem>
                    {availableTasks.map((task) => (
                      <SelectItem key={task.id} value={task.id}>
                        {task.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Session Notes (Optional)</Label>
                <Textarea
                  placeholder="Add notes about your progress"
                  value={newNotes}
                  onChange={(e) => setNewNotes(e.target.value)}
                  className="min-h-[80px]"
                />
              </div>

              {error && <div className="text-sm text-red-500 bg-red-50 dark:bg-red-900/20 p-2 rounded">{error}</div>}
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleAddManualLog}>Add Log</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardHeader>

      <CardContent>
        {sortedLogs.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-muted-foreground">No study logs yet.</p>
            <p className="text-sm mt-2">Start the timer or add a manual log to begin tracking!</p>
          </div>
        ) : (
          <div className="space-y-4">
            {sortedLogs.map((log) => (
              <div key={log.id} className="border rounded-lg p-4">
                <div className="flex justify-between items-start mb-2">
                  <div className="flex items-center gap-2">
                    <Badge className={SUBJECT_COLORS[log.subject]}>
                      {log.subject.charAt(0).toUpperCase() + log.subject.slice(1)}
                    </Badge>
                    <span className="text-sm text-muted-foreground">{formatDateTime(log.startTime)}</span>
                  </div>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon" onClick={() => onDeleteLog(log.id)} className="h-8 w-8">
                      <Trash2 size={14} className="text-red-500" />
                    </Button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-2 text-sm">
                  <div>
                    <span className="text-muted-foreground">Started: </span>
                    <span>{formatDateTime(log.startTime)}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Ended: </span>
                    <span>{formatDateTime(log.endTime)}</span>
                  </div>
                  <div className="flex items-center">
                    <Clock size={14} className="mr-1 text-muted-foreground" />
                    <span className="font-medium">{formatDuration(log.duration)}</span>
                  </div>
                  <div className="flex items-center">
                    <BookOpen size={14} className="mr-1 text-muted-foreground" />
                    <span className="font-medium">{log.questionCount || 0} questions</span>
                  </div>

                  {log.goalTitle && (
                    <div className="md:col-span-4 mt-2 text-sm">
                      <span className="text-muted-foreground">Goal: </span>
                      <span className="font-medium">{log.goalTitle}</span>
                    </div>
                  )}

                  {log.notes && (
                    <div className="md:col-span-4 mt-2 text-sm bg-muted/30 p-3 rounded-md">
                      <span className="text-muted-foreground font-medium">Notes: </span>
                      <p className="mt-1 whitespace-pre-line">{log.notes}</p>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
