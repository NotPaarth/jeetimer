"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer } from "recharts"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
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
      setTests(JSON.parse(savedTests))
    }
  }, [])

  // Save tests to localStorage
  useEffect(() => {
    localStorage.setItem("test-results", JSON.stringify(tests))
  }, [tests])

  // Initialize subject scores when exam type changes
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
        totalMarks: examSettings.examType === "JEE" ? 100 : 180,
      }
    })
    setSubjectScores(initialScores)
  }, [examSettings.examType])

  const handleAddTest = () => {
    const totalMarks = Object.values(subjectScores).reduce((sum, score) => sum + score.marks, 0)
    const maxMarks = Object.values(subjectScores).reduce((sum, score) => sum + score.totalMarks, 0)
    const percentage = maxMarks > 0 ? (totalMarks / maxMarks) * 100 : 0

    const newTest: TestResult = {
      id: Date.now().toString(),
      examType: examSettings.examType,
      testName,
      date: testDate,
      duration,
      subjects: subjectScores,
      totalMarks,
      maxMarks,
      percentage,
      rank,
      notes: notes || undefined,
    }

    setTests([...tests, newTest])
    resetForm()
    setShowAddDialog(false)
  }

  const handleEditTest = () => {
    if (!editingTest) return

    const totalMarks = Object.values(subjectScores).reduce((sum, score) => sum + score.marks, 0)
    const maxMarks = Object.values(subjectScores).reduce((sum, score) => sum + score.totalMarks, 0)
    const percentage = maxMarks > 0 ? (totalMarks / maxMarks) * 100 : 0

    const updatedTest: TestResult = {
      ...editingTest,
      testName,
      date: testDate,
      duration,
      subjects: subjectScores,
      totalMarks,
      maxMarks,
      percentage,
      rank,
      notes: notes || undefined,
    }

    setTests(tests.map((test) => (test.id === editingTest.id ? updatedTest : test)))
    resetForm()
    setEditingTest(null)
  }

  const handleDeleteTest = (testId: string) => {
    setTests(tests.filter((test) => test.id !== testId))
  }

  const resetForm = () => {
    setTestName("")
    setTestDate("")
    setDuration(180)
    setRank(undefined)
    setNotes("")

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

  // Calculate analytics data
  const getSubjectAnalytics = (subject: string) => {
    const subjectTests = filteredTests.filter((test) => test.subjects[subject])
    const totalTests = subjectTests.length

    if (totalTests === 0) {
      return {
        averageScore: 0,
        averageAccuracy: 0,
        totalTests: 0,
        chartData: [],
      }
    }

    const totalScore = subjectTests.reduce((sum, test) => sum + test.subjects[subject].marks, 0)
    const totalMaxScore = subjectTests.reduce((sum, test) => sum + test.subjects[subject].totalMarks, 0)
    const averageScore = totalScore / totalTests
    const averageMaxScore = totalMaxScore / totalTests
    const averageScorePercentage = averageMaxScore > 0 ? (averageScore / averageMaxScore) * 100 : 0

    const totalCorrect = subjectTests.reduce((sum, test) => sum + test.subjects[subject].correct, 0)
    const totalAttempted = subjectTests.reduce((sum, test) => sum + test.subjects[subject].attempted, 0)
    const averageAccuracy = totalAttempted > 0 ? (totalCorrect / totalAttempted) * 100 : 0

    const chartData = subjectTests
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .map((test) => ({
        date: format(new Date(test.date), "MMM dd"),
        score: test.subjects[subject].marks,
        accuracy:
          test.subjects[subject].attempted > 0
            ? (test.subjects[subject].correct / test.subjects[subject].attempted) * 100
            : 0,
      }))

    return {
      averageScore: averageScore.toFixed(1),
      averageAccuracy: averageAccuracy.toFixed(1),
      totalTests,
      chartData,
    }
  }

  const subjects =
    examSettings.examType === "JEE"
      ? ["physics", "chemistry", "mathematics"]
      : ["physics", "chemistry", "botany", "zoology"]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Test Tracker ({examSettings.examType})</h2>
        <Button onClick={() => setShowAddDialog(true)}>Add Test</Button>
      </div>

      {/* Test List and Analytics Tabs */}
      <Tabs defaultValue="test-list" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="test-list">Test List</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="test-list" className="space-y-4">
          {sortedTests.length === 0 ? (
            <Card>
              <CardContent className="text-center py-8">
                <p className="text-muted-foreground">No test results yet.</p>
                <p className="text-sm text-muted-foreground mt-2">
                  Add your first {examSettings.examType} test result to start tracking your progress!
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {sortedTests.map((test) => (
                <Card key={test.id}>
                  <CardContent className="p-6">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="text-lg font-semibold">{test.testName}</h3>
                        <p className="text-sm text-muted-foreground">{format(new Date(test.date), "MMMM do, yyyy")}</p>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <div className="text-lg font-bold">
                            {test.totalMarks}/{test.maxMarks} marks
                          </div>
                          <div className="text-sm text-muted-foreground">{test.duration} minutes</div>
                        </div>
                        <div className="flex gap-2">
                          <Button variant="outline" size="sm" onClick={() => startEdit(test)}>
                            Edit
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDeleteTest(test.id)}
                            className="text-red-600"
                          >
                            Delete
                          </Button>
                        </div>
                      </div>
                    </div>

                    {/* Subject breakdown */}
                    <div className="space-y-4">
                      {Object.entries(test.subjects).map(([subject, scores]) => (
                        <div key={subject}>
                          <h4 className="font-medium mb-2">{getSubjectDisplayName(subject)}</h4>
                          <div className="grid grid-cols-4 gap-4 text-sm">
                            <div>
                              <span className="text-muted-foreground">Score</span>
                              <div className="font-medium">
                                {scores.marks}/{scores.totalMarks}
                              </div>
                            </div>
                            <div>
                              <span className="text-muted-foreground">Attempted</span>
                              <div className="font-medium">{scores.attempted}</div>
                            </div>
                            <div>
                              <span className="text-muted-foreground">Correct</span>
                              <div className="font-medium">{scores.correct}</div>
                            </div>
                            <div>
                              <span className="text-muted-foreground">Incorrect</span>
                              <div className="font-medium">{scores.incorrect}</div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>

                    {test.notes && (
                      <div className="mt-4 p-3 bg-muted/30 rounded-md">
                        <div className="text-sm">
                          <span className="font-medium">Notes: </span>
                          {test.notes}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          {filteredTests.length === 0 ? (
            <Card>
              <CardContent className="text-center py-8">
                <p className="text-muted-foreground">No test data available for analytics.</p>
                <p className="text-sm text-muted-foreground mt-2">
                  Add some test results to see your performance analytics!
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-8">
              {subjects.map((subject) => {
                const analytics = getSubjectAnalytics(subject)
                return (
                  <Card key={subject}>
                    <CardHeader>
                      <CardTitle>{getSubjectDisplayName(subject)}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-3 gap-6 mb-6">
                        <div>
                          <div className="text-sm text-muted-foreground">Average Score</div>
                          <div className="text-2xl font-bold">{analytics.averageScore}/100</div>
                        </div>
                        <div>
                          <div className="text-sm text-muted-foreground">Average Accuracy</div>
                          <div className="text-2xl font-bold">{analytics.averageAccuracy}%</div>
                        </div>
                        <div>
                          <div className="text-sm text-muted-foreground">Total Tests</div>
                          <div className="text-2xl font-bold">{analytics.totalTests}</div>
                        </div>
                      </div>

                      {analytics.chartData.length > 0 && (
                        <div className="h-64">
                          <ChartContainer
                            config={{
                              score: {
                                label: "Score",
                                color: "hsl(var(--chart-1))",
                              },
                              accuracy: {
                                label: "Accuracy %",
                                color: "hsl(var(--chart-2))",
                              },
                            }}
                          >
                            <ResponsiveContainer width="100%" height="100%">
                              <LineChart data={analytics.chartData}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="date" />
                                <YAxis />
                                <ChartTooltip content={<ChartTooltipContent />} />
                                <Line
                                  type="monotone"
                                  dataKey="score"
                                  stroke="var(--color-score)"
                                  strokeWidth={2}
                                  dot={{ fill: "var(--color-score)" }}
                                />
                              </LineChart>
                            </ResponsiveContainer>
                          </ChartContainer>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Add Test Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add {examSettings.examType} Test Result</DialogTitle>
          </DialogHeader>

          <div className="space-y-6 py-4">
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="testName">Test Name</Label>
                <Input
                  id="testName"
                  value={testName}
                  onChange={(e) => setTestName(e.target.value)}
                  placeholder="e.g., JEE Main Mock Test 1"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="testDate">Date</Label>
                <Input id="testDate" type="date" value={testDate} onChange={(e) => setTestDate(e.target.value)} />
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
            </div>

            {/* Subject Scores */}
            <div className="space-y-4">
              <Label className="text-base font-medium">Subject Scores</Label>
              {Object.entries(subjectScores).map(([subject, scores]) => (
                <Card key={subject} className="p-4">
                  <h4 className="font-medium mb-3">{getSubjectDisplayName(subject)}</h4>
                  <div className="grid grid-cols-5 gap-4">
                    <div className="space-y-2">
                      <Label className="text-sm">Attempted</Label>
                      <Input
                        type="number"
                        min="0"
                        value={scores.attempted}
                        onChange={(e) => {
                          const attempted = Number.parseInt(e.target.value) || 0
                          setSubjectScores({
                            ...subjectScores,
                            [subject]: {
                              ...scores,
                              attempted,
                              incorrect: Math.max(0, attempted - scores.correct),
                            },
                          })
                        }}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm">Correct</Label>
                      <Input
                        type="number"
                        min="0"
                        max={scores.attempted}
                        value={scores.correct}
                        onChange={(e) => {
                          const correct = Number.parseInt(e.target.value) || 0
                          setSubjectScores({
                            ...subjectScores,
                            [subject]: {
                              ...scores,
                              correct,
                              incorrect: Math.max(0, scores.attempted - correct),
                            },
                          })
                        }}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm">Incorrect</Label>
                      <Input type="number" value={scores.incorrect} disabled />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm">Marks</Label>
                      <Input
                        type="number"
                        min="0"
                        value={scores.marks}
                        onChange={(e) =>
                          setSubjectScores({
                            ...subjectScores,
                            [subject]: {
                              ...scores,
                              marks: Number.parseInt(e.target.value) || 0,
                            },
                          })
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm">Total Marks</Label>
                      <Input
                        type="number"
                        min="0"
                        value={scores.totalMarks}
                        onChange={(e) =>
                          setSubjectScores({
                            ...subjectScores,
                            [subject]: {
                              ...scores,
                              totalMarks: Number.parseInt(e.target.value) || 0,
                            },
                          })
                        }
                      />
                    </div>
                  </div>
                </Card>
              ))}
            </div>

            <div className="grid grid-cols-2 gap-4">
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
            <Button onClick={handleAddTest} disabled={!testName || !testDate}>
              Add Test Result
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={!!editingTest} onOpenChange={(open) => !open && setEditingTest(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Test Result</DialogTitle>
          </DialogHeader>

          <div className="space-y-6 py-4">
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="editTestName">Test Name</Label>
                <Input id="editTestName" value={testName} onChange={(e) => setTestName(e.target.value)} />
              </div>

              <div className="space-y-2">
                <Label htmlFor="editTestDate">Date</Label>
                <Input id="editTestDate" type="date" value={testDate} onChange={(e) => setTestDate(e.target.value)} />
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
            </div>

            {/* Subject Scores - Same as Add dialog */}
            <div className="space-y-4">
              <Label className="text-base font-medium">Subject Scores</Label>
              {Object.entries(subjectScores).map(([subject, scores]) => (
                <Card key={subject} className="p-4">
                  <h4 className="font-medium mb-3">{getSubjectDisplayName(subject)}</h4>
                  <div className="grid grid-cols-5 gap-4">
                    <div className="space-y-2">
                      <Label className="text-sm">Attempted</Label>
                      <Input
                        type="number"
                        min="0"
                        value={scores.attempted}
                        onChange={(e) => {
                          const attempted = Number.parseInt(e.target.value) || 0
                          setSubjectScores({
                            ...subjectScores,
                            [subject]: {
                              ...scores,
                              attempted,
                              incorrect: Math.max(0, attempted - scores.correct),
                            },
                          })
                        }}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm">Correct</Label>
                      <Input
                        type="number"
                        min="0"
                        max={scores.attempted}
                        value={scores.correct}
                        onChange={(e) => {
                          const correct = Number.parseInt(e.target.value) || 0
                          setSubjectScores({
                            ...subjectScores,
                            [subject]: {
                              ...scores,
                              correct,
                              incorrect: Math.max(0, scores.attempted - correct),
                            },
                          })
                        }}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm">Incorrect</Label>
                      <Input type="number" value={scores.incorrect} disabled />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm">Marks</Label>
                      <Input
                        type="number"
                        min="0"
                        value={scores.marks}
                        onChange={(e) =>
                          setSubjectScores({
                            ...subjectScores,
                            [subject]: {
                              ...scores,
                              marks: Number.parseInt(e.target.value) || 0,
                            },
                          })
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm">Total Marks</Label>
                      <Input
                        type="number"
                        min="0"
                        value={scores.totalMarks}
                        onChange={(e) =>
                          setSubjectScores({
                            ...subjectScores,
                            [subject]: {
                              ...scores,
                              totalMarks: Number.parseInt(e.target.value) || 0,
                            },
                          })
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
