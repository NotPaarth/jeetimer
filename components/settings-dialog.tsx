"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import type { ExamSettings, ExamType } from "@/lib/types"

interface SettingsDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  examSettings: ExamSettings
  onSave: (settings: ExamSettings) => void
}

export default function SettingsDialog({ open, onOpenChange, examSettings, onSave }: SettingsDialogProps) {
  const [localSettings, setLocalSettings] = useState<ExamSettings>(examSettings)

  const handleExamTypeChange = (examType: ExamType) => {
    const defaultSubjectNames =
      examType === "JEE"
        ? {
            physics: "Physics",
            chemistry: "Chemistry",
            mathematics: "Mathematics",
            classes: "Classes",
          }
        : {
            physics: "Physics",
            chemistry: "Chemistry",
            botany: "Botany",
            zoology: "Zoology",
            classes: "Classes",
          }

    setLocalSettings({
      ...localSettings,
      examType,
      subjectNames: defaultSubjectNames,
    })
  }

  const handleSave = () => {
    onSave(localSettings)
    onOpenChange(false)
  }

  const handleCancel = () => {
    setLocalSettings(examSettings)
    onOpenChange(false)
  }

  const handleResetStreak = () => {
    const resetStreakData = {
      currentStreak: 0,
      longestStreak: 0,
      lastStudyDate: null,
    }
    localStorage.setItem("streak-data", JSON.stringify(resetStreakData))
    window.location.reload()
  }

  const handleTestStreak = () => {
    const today = new Date().toDateString()
    const testStreakData = {
      currentStreak: 1,
      longestStreak: 1,
      lastStudyDate: today,
    }
    localStorage.setItem("streak-data", JSON.stringify(testStreakData))
    window.location.reload()
  }

  const getSubjectsForExamType = (examType: ExamType) => {
    return examType === "JEE" ? ["physics", "chemistry", "mathematics"] : ["physics", "chemistry", "botany", "zoology"]
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] bg-card max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">Settings</DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Exam Type */}
          <div className="space-y-2">
            <Label className="text-base font-medium">Exam Type</Label>
            <Select value={localSettings.examType} onValueChange={(value: ExamType) => handleExamTypeChange(value)}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="JEE">JEE</SelectItem>
                <SelectItem value="NEET">NEET</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Streak Settings */}
          <div className="space-y-4">
            <Label className="text-base font-medium">Streak Settings</Label>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="minHours">Min. Study Hours</Label>
                <Input
                  id="minHours"
                  type="number"
                  min="0.5"
                  max="24"
                  step="0.5"
                  value={localSettings.streakSettings.minStudyHours}
                  onChange={(e) =>
                    setLocalSettings({
                      ...localSettings,
                      streakSettings: {
                        ...localSettings.streakSettings,
                        minStudyHours: Number.parseFloat(e.target.value) || 1,
                      },
                    })
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="minQuestions">Min. Questions</Label>
                <Input
                  id="minQuestions"
                  type="number"
                  min="1"
                  value={localSettings.streakSettings.minQuestions}
                  onChange={(e) =>
                    setLocalSettings({
                      ...localSettings,
                      streakSettings: {
                        ...localSettings.streakSettings,
                        minQuestions: Number.parseInt(e.target.value) || 1,
                      },
                    })
                  }
                />
              </div>
            </div>

            <p className="text-sm text-muted-foreground">Set minimum requirements for maintaining your daily streak.</p>
          </div>

          {/* Customize Subject Names */}
          <div className="space-y-4">
            <Label className="text-base font-medium">Customize Subject Names</Label>

            <div className="space-y-3">
              {getSubjectsForExamType(localSettings.examType).map((subject) => (
                <div key={subject} className="grid grid-cols-3 gap-3 items-center">
                  <Label className="capitalize font-medium">{subject}</Label>
                  <div className="col-span-2">
                    <Input
                      placeholder={`Custom name for ${subject}`}
                      value={localSettings.subjectNames[subject] || ""}
                      onChange={(e) =>
                        setLocalSettings({
                          ...localSettings,
                          subjectNames: {
                            ...localSettings.subjectNames,
                            [subject]: e.target.value,
                          },
                        })
                      }
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <Separator />

          {/* Streak Testing Tools */}
          <div className="space-y-4">
            <Label className="text-base font-medium">Streak Testing Tools</Label>
            <p className="text-sm text-muted-foreground">
              Use these buttons to test streak functionality during development.
            </p>

            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={handleResetStreak}>
                Reset Streak
              </Button>
              <Button variant="outline" size="sm" onClick={handleTestStreak}>
                Test Streak +1
              </Button>
            </div>
          </div>
        </div>

        {/* Footer Buttons */}
        <div className="flex justify-end gap-3 pt-4">
          <Button variant="outline" onClick={handleCancel}>
            Cancel
          </Button>
          <Button onClick={handleSave}>Save Changes</Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
