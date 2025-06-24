/**
 * Get the start of the current "study day" which resets at 4:30 AM
 * If current time is before 4:30 AM, returns 4:30 AM of the previous day
 * If current time is after 4:30 AM, returns 4:30 AM of the current day
 */
export function getStudyDayStart(date: Date = new Date()): Date {
  const studyDayStart = new Date(date)
  studyDayStart.setHours(4, 30, 0, 0) // Set to 4:30 AM

  // If current time is before 4:30 AM, use previous day's 4:30 AM
  if (date.getHours() < 4 || (date.getHours() === 4 && date.getMinutes() < 30)) {
    studyDayStart.setDate(studyDayStart.getDate() - 1)
  }

  return studyDayStart
}

/**
 * Get the end of the current "study day" (4:29:59 AM of the next day)
 */
export function getStudyDayEnd(date: Date = new Date()): Date {
  const studyDayStart = getStudyDayStart(date)
  const studyDayEnd = new Date(studyDayStart)
  studyDayEnd.setDate(studyDayEnd.getDate() + 1)
  studyDayEnd.setHours(4, 29, 59, 999) // 4:29:59.999 AM next day

  return studyDayEnd
}

/**
 * Check if a date falls within the current study day
 */
export function isWithinCurrentStudyDay(date: Date, referenceDate: Date = new Date()): boolean {
  const studyDayStart = getStudyDayStart(referenceDate)
  const studyDayEnd = getStudyDayEnd(referenceDate)

  return date >= studyDayStart && date <= studyDayEnd
}

/**
 * Get the study day start for a specific date (for historical data)
 */
export function getStudyDayStartForDate(date: Date): Date {
  const studyDayStart = new Date(date)
  studyDayStart.setHours(4, 30, 0, 0)

  return studyDayStart
}

/**
 * Format study day for display (shows the date the study day "belongs to")
 */
export function formatStudyDay(date: Date = new Date()): string {
  const studyDayStart = getStudyDayStart(date)

  // The study day "belongs to" the date it started
  // So if it's 2 AM on March 15th, we're still in March 14th's study day
  return studyDayStart.toDateString()
}
