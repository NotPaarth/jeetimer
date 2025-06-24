"use client"

import type React from "react"

import { useState } from "react"
import { Plus, Trash2, Calendar, Clock, Flag } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Checkbox } from "@/components/ui/checkbox"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import type { Subject, Task } from "@/lib/types"
import { getStudyDayStart, getStudyDayEnd } from "@/lib/date-utils"

interface TaskManagerProps {
  tasks: Task[]
  onAddTask: (task: Task) => void
  onToggleComplete: (taskId: string) => void
  onDeleteTask: (taskId: string) => void
}

export default function TaskManager({ tasks, onAddTask, onToggleComplete, onDeleteTask }: TaskManagerProps) {
  const [activeSubject, setActiveSubject] = useState<Subject>("physics")
  const [activeView, setActiveView] = useState<"today" | "tomorrow">("today")
  const [newTaskTitle, setNewTaskTitle] = useState("")
  const [newTaskPriority, setNewTaskPriority] = useState<"low" | "medium" | "high">("medium")
  const [newTaskTime, setNewTaskTime] = useState<string>("")

  const handleAddTask = (e: React.FormEvent) => {
    e.preventDefault()

    if (newTaskTitle.trim()) {
      const now = new Date()
      let targetDate: string

      if (activeView === "tomorrow") {
        // If it's before 4:30 AM, tomorrow is later today
        // If it's after 4:30 AM, tomorrow is the next calendar day
        const tomorrow = new Date(now)
        if (now.getHours() < 4 || (now.getHours() === 4 && now.getMinutes() < 30)) {
          // We're in the early morning, so "tomorrow" is later today
          tomorrow.setHours(12, 0, 0, 0) // Set to noon of the same day
        } else {
          // We're in the normal day, so "tomorrow" is the next day
          tomorrow.setDate(tomorrow.getDate() + 1)
          tomorrow.setHours(12, 0, 0, 0) // Set to noon of next day
        }
        targetDate = tomorrow.toISOString()
      } else {
        targetDate = now.toISOString()
      }

      const newTask: Task = {
        id: Date.now().toString(),
        title: newTaskTitle,
        subject: activeSubject,
        completed: false,
        createdAt: now.toISOString(),
        targetDate,
        priority: newTaskPriority,
        estimatedTime: newTaskTime ? Number.parseInt(newTaskTime) : undefined,
      }

      onAddTask(newTask)
      setNewTaskTitle("")
      setNewTaskTime("")
      setNewTaskPriority("medium")
    }
  }

  // Filter tasks based on current view
  const getFilteredTasks = () => {
    const now = new Date()
    const currentStudyDayStart = getStudyDayStart(now)
    const currentStudyDayEnd = getStudyDayEnd(now)

    if (activeView === "today") {
      // Show tasks for current study day
      return tasks.filter((task) => {
        const taskTargetDate = new Date(task.targetDate || task.createdAt)
        return (
          task.subject === activeSubject &&
          taskTargetDate >= currentStudyDayStart &&
          taskTargetDate <= currentStudyDayEnd
        )
      })
    } else {
      // Show tasks for next study day
      const nextStudyDayStart = new Date(currentStudyDayStart)
      nextStudyDayStart.setDate(nextStudyDayStart.getDate() + 1)
      const nextStudyDayEnd = new Date(currentStudyDayEnd)
      nextStudyDayEnd.setDate(nextStudyDayEnd.getDate() + 1)

      return tasks.filter((task) => {
        const taskTargetDate = new Date(task.targetDate || task.createdAt)
        return (
          task.subject === activeSubject && taskTargetDate >= nextStudyDayStart && taskTargetDate <= nextStudyDayEnd
        )
      })
    }
  }

  const filteredTasks = getFilteredTasks()

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300"
      case "medium":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300"
      case "low":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300"
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300"
    }
  }

  const getTotalEstimatedTime = () => {
    return filteredTasks
      .filter((task) => !task.completed && task.estimatedTime)
      .reduce((total, task) => total + (task.estimatedTime || 0), 0)
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="text-center">Task Planner</CardTitle>
      </CardHeader>
      <CardContent>
        {/* Today/Tomorrow Toggle */}
        <Tabs
          value={activeView}
          onValueChange={(value) => setActiveView(value as "today" | "tomorrow")}
          className="mb-6"
        >
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="today" className="flex items-center gap-2">
              <Calendar size={16} />
              Today's Tasks
            </TabsTrigger>
            <TabsTrigger value="tomorrow" className="flex items-center gap-2">
              <Calendar size={16} />
              Plan Tomorrow
            </TabsTrigger>
          </TabsList>
        </Tabs>

        {/* Subject Tabs */}
        <Tabs
          defaultValue="physics"
          value={activeSubject}
          onValueChange={(value) => setActiveSubject(value as Subject)}
          className="mb-6"
        >
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="physics">Physics</TabsTrigger>
            <TabsTrigger value="chemistry">Chemistry</TabsTrigger>
            <TabsTrigger value="mathematics">Mathematics</TabsTrigger>
            <TabsTrigger value="classes">Classes</TabsTrigger>
          </TabsList>
        </Tabs>

        {/* Task Summary */}
        {filteredTasks.length > 0 && (
          <div className="mb-4 p-3 bg-muted/30 rounded-lg">
            <div className="flex items-center justify-between text-sm">
              <span>
                {filteredTasks.filter((t) => t.completed).length}/{filteredTasks.length} completed
              </span>
              {getTotalEstimatedTime() > 0 && (
                <span className="flex items-center gap-1">
                  <Clock size={14} />
                  {getTotalEstimatedTime()} min remaining
                </span>
              )}
            </div>
          </div>
        )}

        {/* Add Task Form */}
        <form onSubmit={handleAddTask} className="space-y-4 mb-6">
          <div>
            <Input
              placeholder={`Add a new ${activeSubject} task for ${activeView === "today" ? "today" : "tomorrow"}...`}
              value={newTaskTitle}
              onChange={(e) => setNewTaskTitle(e.target.value)}
              className="w-full"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
            <Select
              value={newTaskPriority}
              onValueChange={(value: "low" | "medium" | "high") => setNewTaskPriority(value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Priority" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="low">Low Priority</SelectItem>
                <SelectItem value="medium">Medium Priority</SelectItem>
                <SelectItem value="high">High Priority</SelectItem>
              </SelectContent>
            </Select>

            <Input
              type="number"
              placeholder="Est. time (min)"
              value={newTaskTime}
              onChange={(e) => setNewTaskTime(e.target.value)}
              min="1"
              max="480"
            />

            <Button type="submit" className="w-full">
              <Plus size={16} className="mr-2" />
              Add Task
            </Button>
          </div>
        </form>

        {/* Tasks List */}
        <div className="space-y-2">
          {filteredTasks.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              {activeView === "today"
                ? `No tasks for ${activeSubject} today. Add some tasks to get started!`
                : `No tasks planned for ${activeSubject} tomorrow. Plan ahead for a productive day!`}
            </p>
          ) : (
            filteredTasks
              .sort((a, b) => {
                // Sort by completion status, then priority, then creation time
                if (a.completed !== b.completed) return a.completed ? 1 : -1

                const priorityOrder = { high: 0, medium: 1, low: 2 }
                const aPriority = priorityOrder[a.priority || "medium"]
                const bPriority = priorityOrder[b.priority || "medium"]

                if (aPriority !== bPriority) return aPriority - bPriority

                return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
              })
              .map((task) => (
                <div key={task.id} className="flex items-center justify-between p-3 border rounded-md">
                  <div className="flex items-center gap-3 flex-1">
                    <Checkbox id={task.id} checked={task.completed} onCheckedChange={() => onToggleComplete(task.id)} />

                    <div className="flex-1">
                      <Label
                        htmlFor={task.id}
                        className={`cursor-pointer ${task.completed ? "line-through text-muted-foreground" : ""}`}
                      >
                        {task.title}
                      </Label>

                      <div className="flex items-center gap-2 mt-1">
                        {task.priority && (
                          <Badge variant="outline" className={getPriorityColor(task.priority)}>
                            <Flag size={12} className="mr-1" />
                            {task.priority}
                          </Badge>
                        )}

                        {task.estimatedTime && (
                          <Badge variant="outline" className="text-xs">
                            <Clock size={12} className="mr-1" />
                            {task.estimatedTime}m
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>

                  <Button variant="ghost" size="sm" onClick={() => onDeleteTask(task.id)}>
                    <Trash2 size={16} className="text-red-500" />
                  </Button>
                </div>
              ))
          )}
        </div>

        {/* Planning Tip */}
        {activeView === "tomorrow" && (
          <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
            <div className="flex items-start gap-2">
              <Calendar className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5" />
              <div>
                <h4 className="font-medium text-blue-900 dark:text-blue-100">Planning Tomorrow</h4>
                <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
                  Tasks planned here will appear in "Today's Tasks" after 4:30 AM. Add priorities and time estimates to
                  better organize your study day!
                </p>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
