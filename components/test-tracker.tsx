"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Plus, Edit, Trash2 } from "lucide-react"
import type { TestResult, ExamSettings } from "@/lib/types"
import { format } from "date-fns"

interface TestTrackerProps {
  examSettings: ExamSettings
}

export default function TestTracker({ examSettings }: TestTrackerProps) {
  const [tests, setTests] = useState<TestResult[]>([])
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [editingTest, setEditingTest] = useState<TestResult | null>(null)

  // Form state
  const [testName, setTestName] = useState("")
  const [testDate, setTestDate] = useState("")
  const [duration, setDuration] = useState<number>(180) // Default 180 minutes
  const [subjectScores, setSubjectScores] = useState<
    Record<
      string,
      {
        attempted: number
        correct: number
        incorrect: number
        marks: number
        totalMarks: number
      }
    >
  >({})
  const [rank, setRank] = useState<number | undefined>()
  const [notes, setNotes] = useState("")

  // Load tests from localStorage
  useEffect(() => {
    const savedTests = localStorage.getItem("test-results")
    if (savedTests) {
      try {
        setTests(JSON.parse(savedTests))
      } catch (error) {
        console.error("Error loading tests:", error)
        setTests([])
      }
    }
  }, [])

  // Save tests to localStorage
  useEffect(() => {
    localStorage.setItem("test-results", JSON.stringify(tests))
  }, [tests])

  // Initialize subject scores when exam type changes or dialog opens
  useEffect(() => {
    const subjects =
      examSettings.examType === "JEE"
        ? ["physics", "chemistry", "mathematics"]
        : ["physics", "chemistry", "botany", "zoology"]

    const initialScores: typeof subjectScores = {}
    subjects.forEach((subject) => {
      initialScores[subject] = {
        attempted: 0,
        correct: 0,
        incorrect: 0,
        marks: 0,
        totalMarks: examSettings.examType === "JEE" ? 100 : 180, // JEE: 100 per subject, NEET: 180 per subject
      }
    })
    setSubjectScores(initialScores)
  }, [examSettings.examType, showAddDialog])

  const handleAddTest = () => {
    // Validation
    if (!testName.trim()) {
      alert("Please enter a test name")
      return
    }
    if (!testDate) {
      alert("Please select a test date")
      return
    }

    const totalMarks = Object.values(subjectScores).reduce((sum, score) => sum + score.marks, 0)
    const maxMarks = Object.values(subjectScores).reduce((sum, score) => sum + score.totalMarks, 0)
    const percentage = maxMarks > 0 ? (totalMarks / maxMarks) * 100 : 0

    const newTest: TestResult = {
      id: Date.now().toString(),
      examType: examSettings.examType,
      testName: testName.trim(),
      date: testDate,
      duration,
      subjects: subjectScores,
      totalMarks,
      maxMarks,
      percentage,
      rank,
      notes: notes.trim() || undefined,
    }

    setTests((prev) => [...prev, newTest])
    resetForm()
    setShowAddDialog(false)
  }

  const handleEditTest = () => {
    if (!editingTest) return

    // Validation
    if (!testName.trim()) {
      alert("Please enter a test name")
      return
    }
    if (!testDate) {
      alert("Please select a test date")
      return
    }

    const totalMarks = Object.values(subjectScores).reduce((sum, score) => sum + score.marks, 0)
    const maxMarks = Object.values(subjectScores).reduce((sum, score) => sum + score.totalMarks, 0)
    const percentage = maxMarks > 0 ? (totalMarks / maxMarks) * 100 : 0

    const updatedTest: TestResult = {
      ...editingTest,
      testName: testName.trim(),
      date: testDate,
      duration,
      subjects: subjectScores,
      totalMarks,
      maxMarks,
      percentage,
      rank,
      notes: notes.trim() || undefined,
    }

    setTests((prev) => prev.map((test) => (test.id === editingTest.id ? updatedTest : test)))
    resetForm()
    setEditingTest(null)
  }

  const handleDeleteTest = (testId: string) => {
    if (confirm("Are you sure you want to delete this test result?")) {
      setTests((prev) => prev.filter((test) => test.id !== testId))
    }
  }

  const resetForm = () => {
    setTestName("")
    setTestDate("")
    setDuration(180)
    setRank(undefined)
    setNotes("")

    // Reset subject scores
    const subjects =
      examSettings.examType === "JEE"
        ? ["physics", "chemistry", "mathematics"]
        : ["physics", "chemistry", "botany", "zoology"]

    const initialScores: typeof subjectScores = {}
    subjects.forEach((subject) => {
      initialScores[subject] = {
        attempted: 0,
        correct: 0,
        incorrect: 0,
        marks: 0,
        totalMarks: examSettings.examType === "JEE" ? 100 : 180,
      }
    })
    setSubjectScores(initialScores)
  }

  const startEdit = (test: TestResult) => {
    setEditingTest(test)
    setTestName(test.testName)
    setTestDate(test.date)
    setDuration(test.duration || 180)
    setSubjectScores(test.subjects)
    setRank(test.rank)
    setNotes(test.notes || "")
  }

  const getSubjectDisplayName = (subject: string) => {
    return examSettings.subjectNames[subject] || subject.charAt(0).toUpperCase() + subject.slice(1)
  }

  const filteredTests = tests.filter((test) => test.examType === examSettings.examType)
  const sortedTests = [...filteredTests].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

  // Calculate stats
  const averagePercentage =
    filteredTests.length > 0 ? filteredTests.reduce((sum, test) => sum + test.percentage, 0) / filteredTests.length : 0

  const bestScore = filteredTests.length > 0 ? Math.max(...filteredTests.map((test) => test.percentage)) : 0

  const subjects =
    examSettings.examType === "JEE"
      ? ["physics", "chemistry", "mathematics"]
      : ["physics", "chemistry", "botany", "zoology"]

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-2xl font-bold">{filteredTests.length}</div>
              <div className="text-sm text-muted-foreground">Tests Taken</div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-2xl font-bold">{averagePercentage.toFixed(1)}%</div>
              <div className="text-sm text-muted-foreground">Average Score</div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-2xl font-bold">{bestScore.toFixed(1)}%</div>
              <div className="text-sm text-muted-foreground">Best Score</div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Add Test Button */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>{examSettings.examType} Test Results</CardTitle>
          <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
            <DialogTrigger asChild>
              <Button
                onClick={() => {
                  resetForm()
                  setShowAddDialog(true)
                }}
              >
                <Plus className="mr-2 h-4 w-4" />
                Add Test Result
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Add {examSettings.examType} Test Result</DialogTitle>
              </DialogHeader>

              <div className="space-y-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="testName">Test Name *</Label>
                    <Input
                      id="testName"
                      value={testName}
                      onChange={(e) => setTestName(e.target.value)}
                      placeholder="e.g., JEE Main Mock Test 1"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="testDate">Date *</Label>
                    <Input
                      id="testDate"
                      type="date"
                      value={testDate}
                      onChange={(e) => setTestDate(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="duration">Duration (minutes)</Label>
                  <Input
                    id="duration"
                    type="number"
                    min="1"
                    value={duration}
                    onChange={(e) => setDuration(Number.parseInt(e.target.value) || 180)}
                  />
                </div>

                {/* Subject Scores */}
                <div className="space-y-4">
                  <Label className="text-base font-medium">Subject Scores</Label>
                  {Object.entries(subjectScores).map(([subject, scores]) => (
                    <Card key={subject} className="p-4">
                      <h4 className="font-medium mb-3 capitalize">{getSubjectDisplayName(subject)}</h4>
                      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                        <div className="space-y-1">
                          <Label className="text-xs">Attempted</Label>
                          <Input
                            type="number"
                            min="0"
                            value={scores.attempted}
                            onChange={(e) => {
                              const attempted = Number.parseInt(e.target.value) || 0
                              setSubjectScores((prev) => ({
                                ...prev,
                                [subject]: {
                                  ...scores,
                                  attempted,
                                  incorrect: Math.max(0, attempted - scores.correct),
                                },
                              }))
                            }}
                          />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs">Correct</Label>
                          <Input
                            type="number"
                            min="0"
                            max={scores.attempted}
                            value={scores.correct}
                            onChange={(e) => {
                              const correct = Number.parseInt(e.target.value) || 0
                              setSubjectScores((prev) => ({
                                ...prev,
                                [subject]: {
                                  ...scores,
                                  correct,
                                  incorrect: Math.max(0, scores.attempted - correct),
                                },
                              }))
                            }}
                          />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs">Incorrect</Label>
                          <Input type="number" min="0" value={scores.incorrect} disabled />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs">Marks</Label>
                          <Input
                            type="number"
                            min="0"
                            value={scores.marks}
                            onChange={(e) =>
                              setSubjectScores((prev) => ({
                                ...prev,
                                [subject]: {
                                  ...scores,
                                  marks: Number.parseInt(e.target.value) || 0,
                                },
                              }))
                            }
                          />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs">Total Marks</Label>
                          <Input
                            type="number"
                            min="0"
                            value={scores.totalMarks}
                            onChange={(e) =>
                              setSubjectScores((prev) => ({
                                ...prev,
                                [subject]: {
                                  ...scores,
                                  totalMarks: Number.parseInt(e.target.value) || 0,
                                },
                              }))
                            }
                          />
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="rank">Rank (Optional)</Label>
                  <Input
                    id="rank"
                    type="number"
                    min="1"
                    value={rank || ""}
                    onChange={(e) => setRank(Number.parseInt(e.target.value) || undefined)}
                    placeholder="Your rank"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="notes">Notes (Optional)</Label>
                  <Textarea
                    id="notes"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Any observations or notes about this test..."
                    className="min-h-[80px]"
                  />
                </div>
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={() => setShowAddDialog(false)}>
                  Cancel
                </Button>
                <Button onClick={handleAddTest}>Add Test Result</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </CardHeader>

        <CardContent>
          {sortedTests.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">No test results yet.</p>
              <p className="text-sm text-muted-foreground mt-2">
                Add your first {examSettings.examType} test result to start tracking your progress!
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {sortedTests.map((test) => (
                <Card key={test.id} className="p-4">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h3 className="font-semibold">{test.testName}</h3>
                      <p className="text-sm text-muted-foreground">
                        {format(new Date(test.date), "MMM d, yyyy")} • {test.duration || 180} minutes
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge
                        variant={
                          test.percentage >= 80 ? "default" : test.percentage >= 60 ? "secondary" : "destructive"
                        }
                      >
                        {test.percentage.toFixed(1)}%
                      </Badge>
                      <Button variant="ghost" size="icon" onClick={() => startEdit(test)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDeleteTest(test.id)}>
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm mb-3">
                    <div>
                      <span className="text-muted-foreground">Total Score: </span>
                      <span className="font-medium">
                        {test.totalMarks}/{test.maxMarks}
                      </span>
                    </div>
                    {test.rank && (
                      <div>
                        <span className="text-muted-foreground">Rank: </span>
                        <span className="font-medium">{test.rank}</span>
                      </div>
                    )}
                  </div>

                  {/* Subject breakdown */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {Object.entries(test.subjects).map(([subject, scores]) => (
                      <div key={subject} className="bg-muted/30 p-3 rounded-md">
                        <div className="font-medium capitalize mb-1">{getSubjectDisplayName(subject)}</div>
                        <div className="text-sm space-y-1">
                          <div>
                            Score: {scores.marks}/{scores.totalMarks}
                          </div>
                          <div>
                            Correct: {scores.correct}/{scores.attempted}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {test.notes && (
                    <div className="mt-3 p-3 bg-muted/30 rounded-md">
                      <div className="text-sm">
                        <span className="font-medium">Notes: </span>
                        {test.notes}
                      </div>
                    </div>
                  )}
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={!!editingTest} onOpenChange={(open) => !open && setEditingTest(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Test Result</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="editTestName">Test Name *</Label>
                <Input id="editTestName" value={testName} onChange={(e) => setTestName(e.target.value)} required />
              </div>

              <div className="space-y-2">
                <Label htmlFor="editTestDate">Date *</Label>
                <Input
                  id="editTestDate"
                  type="date"
                  value={testDate}
                  onChange={(e) => setTestDate(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="editDuration">Duration (minutes)</Label>
              <Input
                id="editDuration"
                type="number"
                min="1"
                value={duration}
                onChange={(e) => setDuration(Number.parseInt(e.target.value) || 180)}
              />
            </div>

            {/* Subject Scores - Same as Add dialog */}
            <div className="space-y-4">
              <Label className="text-base font-medium">Subject Scores</Label>
              {Object.entries(subjectScores).map(([subject, scores]) => (
                <Card key={subject} className="p-4">
                  <h4 className="font-medium mb-3 capitalize">{getSubjectDisplayName(subject)}</h4>
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                    <div className="space-y-1">
                      <Label className="text-xs">Attempted</Label>
                      <Input
                        type="number"
                        min="0"
                        value={scores.attempted}
                        onChange={(e) => {
                          const attempted = Number.parseInt(e.target.value) || 0
                          setSubjectScores((prev) => ({
                            ...prev,
                            [subject]: {
                              ...scores,
                              attempted,
                              incorrect: Math.max(0, attempted - scores.correct),
                            },
                          }))
                        }}
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Correct</Label>
                      <Input
                        type="number"
                        min="0"
                        max={scores.attempted}
                        value={scores.correct}
                        onChange={(e) => {
                          const correct = Number.parseInt(e.target.value) || 0
                          setSubjectScores((prev) => ({
                            ...prev,
                            [subject]: {
                              ...scores,
                              correct,
                              incorrect: Math.max(0, scores.attempted - correct),
                            },
                          }))
                        }}
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Incorrect</Label>
                      <Input type="number" min="0" value={scores.incorrect} disabled />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Marks</Label>
                      <Input
                        type="number"
                        min="0"
                        value={scores.marks}
                        onChange={(e) =>
                          setSubjectScores((prev) => ({
                            ...prev,
                            [subject]: {
                              ...scores,
                              marks: Number.parseInt(e.target.value) || 0,
                            },
                          }))
                        }
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Total Marks</Label>
                      <Input
                        type="number"
                        min="0"
                        value={scores.totalMarks}
                        onChange={(e) =>
                          setSubjectScores((prev) => ({
                            ...prev,
                            [subject]: {
                              ...scores,
                              totalMarks: Number.parseInt(e.target.value) || 0,
                            },
                          }))
                        }
                      />
                    </div>
                  </div>
                </Card>
              ))}
            </div>

            <div className="space-y-2">
              <Label htmlFor="editRank">Rank (Optional)</Label>
              <Input
                id="editRank"
                type="number"
                min="1"
                value={rank || ""}
                onChange={(e) => setRank(Number.parseInt(e.target.value) || undefined)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="editNotes">Notes (Optional)</Label>
              <Textarea
                id="editNotes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="min-h-[80px]"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingTest(null)}>
              Cancel
            </Button>
            <Button onClick={handleEditTest}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
