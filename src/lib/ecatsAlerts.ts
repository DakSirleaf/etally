import type { PayPeriod } from './payPeriod'
import type { ScheduleDay } from '../types'

export interface Holiday {
  date: string // YYYY-MM-DD
  name: string
}

const HOLIDAYS_2026: Holiday[] = [
  { date: '2026-01-01', name: "New Year's Day" },
  { date: '2026-01-19', name: 'MLK Day' },
  { date: '2026-02-16', name: 'Presidents Day' },
  { date: '2026-04-03', name: 'Good Friday' },
  { date: '2026-05-25', name: 'Memorial Day' },
  { date: '2026-06-19', name: 'Juneteenth' },
  { date: '2026-07-03', name: 'Independence Day Observed' },
  { date: '2026-09-07', name: 'Labor Day' },
  { date: '2026-10-12', name: 'Columbus Day' },
  { date: '2026-11-03', name: 'Election Day' },
  { date: '2026-11-11', name: 'Veterans Day' },
  { date: '2026-11-26', name: 'Thanksgiving' },
  { date: '2026-12-25', name: 'Christmas' },
]

export function getHolidaysForYear(year: number): Holiday[] {
  if (year === 2026) return HOLIDAYS_2026
  // Add future years here
  return []
}

export function getHolidaysInPeriod(period: PayPeriod): Holiday[] {
  const startYear = parseInt(period.start.substring(0, 4))
  const endYear = parseInt(period.end.substring(0, 4))
  const holidays: Holiday[] = []
  for (let y = startYear; y <= endYear; y++) {
    holidays.push(...getHolidaysForYear(y))
  }
  return holidays.filter((h) => h.date >= period.start && h.date <= period.end)
}

export interface EcatsDeadlineInfo {
  deadline: Date
  isHolidayWeek: boolean
  holidays: Holiday[]
  supplementalDeadline: Date
}

export function getEcatsDeadline(period: PayPeriod): EcatsDeadlineInfo {
  const holidays = getHolidaysInPeriod(period)
  const isHolidayWeek = holidays.length > 0

  // period.end is always a Friday
  const endFriday = new Date(period.end + 'T00:00:00')

  let deadline: Date
  if (isHolidayWeek) {
    // Tuesday of the same week as the period-end Friday (3 days before)
    deadline = new Date(endFriday)
    deadline.setDate(endFriday.getDate() - 3)
  } else {
    deadline = new Date(endFriday)
  }
  deadline.setHours(13, 0, 0, 0) // 1:00 PM

  // Supplemental deadline: Tuesday of the following (non-pay) week = Friday + 4 days
  const supplementalDeadline = new Date(endFriday)
  supplementalDeadline.setDate(endFriday.getDate() + 4)
  supplementalDeadline.setHours(13, 0, 0, 0)

  return { deadline, isHolidayWeek, holidays, supplementalDeadline }
}

export type DeadlineStatus = 'upcoming' | 'warning' | 'critical' | 'overdue'

export function getDeadlineStatus(deadline: Date): DeadlineStatus {
  const diffMs = deadline.getTime() - Date.now()
  const diffHrs = diffMs / (1000 * 60 * 60)
  if (diffMs < 0) return 'overdue'
  if (diffHrs <= 24) return 'critical'
  if (diffHrs <= 48) return 'warning'
  return 'upcoming'
}

export function getPreApprovedOTAfterDeadline(
  schedule: ScheduleDay[],
  period: PayPeriod
): ScheduleDay[] {
  const { isHolidayWeek, deadline } = getEcatsDeadline(period)
  if (!isHolidayWeek) return []
  const dl = deadline
  const deadlineDateStr = `${dl.getFullYear()}-${String(dl.getMonth() + 1).padStart(2, '0')}-${String(dl.getDate()).padStart(2, '0')}`
  return schedule.filter(
    (day) =>
      day.type === 'ot' &&
      day.isPreApprovedOT === true &&
      day.date > deadlineDateStr &&
      day.date >= period.start &&
      day.date <= period.end
  )
}

export function formatDeadlineDate(date: Date): string {
  const weekday = date.toLocaleDateString('en-US', { weekday: 'long' })
  const month = date.toLocaleDateString('en-US', { month: 'long' })
  const day = date.getDate()
  const h = date.getHours()
  const hours12 = h % 12 || 12
  const minutes = String(date.getMinutes()).padStart(2, '0')
  const ampm = h >= 12 ? 'PM' : 'AM'
  return `${weekday}, ${month} ${day} at ${hours12}:${minutes} ${ampm}`
}
