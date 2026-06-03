import type { PayPeriod } from './payPeriod'
import type { ScheduleDay } from '../types'

export interface Holiday {
  date: string
  name: string
}

function toYMD(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function getNthWeekday(year: number, month: number, weekday: number, n: number): Date {
  const d = new Date(year, month - 1, 1)
  let count = 0
  while (true) {
    if (d.getDay() === weekday) { count++; if (count === n) return new Date(d) }
    d.setDate(d.getDate() + 1)
  }
}

function getLastWeekday(year: number, month: number, weekday: number): Date {
  const d = new Date(year, month, 0)
  while (d.getDay() !== weekday) d.setDate(d.getDate() - 1)
  return d
}

function getObserved(d: Date): Date {
  const result = new Date(d)
  if (d.getDay() === 6) result.setDate(d.getDate() - 1)
  else if (d.getDay() === 0) result.setDate(d.getDate() + 1)
  return result
}

function getEaster(year: number): Date {
  const a = year % 19
  const b = Math.floor(year / 100)
  const c = year % 100
  const d = Math.floor(b / 4)
  const e = b % 4
  const f = Math.floor((b + 8) / 25)
  const g = Math.floor((b - f + 1) / 3)
  const h = (19 * a + b - d - g + 15) % 30
  const i = Math.floor(c / 4)
  const k = c % 4
  const l = (32 + 2 * e + 2 * i - h - k) % 7
  const m = Math.floor((a + 11 * h + 22 * l) / 451)
  const month = Math.floor((h + l - 7 * m + 114) / 31)
  const day = ((h + l - 7 * m + 114) % 31) + 1
  return new Date(year, month - 1, day)
}

export function getHolidaysForYear(year: number): Holiday[] {
  const holidays: Holiday[] = []
  const add = (date: Date, name: string) =>
    holidays.push({ date: toYMD(getObserved(date)), name })

  add(new Date(year, 0, 1), "New Year's Day")
  holidays.push({ date: toYMD(getNthWeekday(year, 1, 1, 3)), name: 'MLK Day' })
  holidays.push({ date: toYMD(getNthWeekday(year, 2, 1, 3)), name: 'Presidents Day' })

  const easter = getEaster(year)
  const goodFriday = new Date(easter)
  goodFriday.setDate(easter.getDate() - 2)
  holidays.push({ date: toYMD(goodFriday), name: 'Good Friday' })

  holidays.push({ date: toYMD(getLastWeekday(year, 5, 1)), name: 'Memorial Day' })
  add(new Date(year, 5, 19), 'Juneteenth')
  add(new Date(year, 6, 4), 'Independence Day')
  holidays.push({ date: toYMD(getNthWeekday(year, 9, 1, 1)), name: 'Labor Day' })
  holidays.push({ date: toYMD(getNthWeekday(year, 10, 1, 2)), name: 'Columbus Day' })

  const firstMondayNov = getNthWeekday(year, 11, 1, 1)
  const electionDay = new Date(firstMondayNov)
  electionDay.setDate(firstMondayNov.getDate() + 1)
  holidays.push({ date: toYMD(electionDay), name: 'Election Day' })

  add(new Date(year, 10, 11), 'Veterans Day')
  holidays.push({ date: toYMD(getNthWeekday(year, 11, 4, 4)), name: 'Thanksgiving' })
  add(new Date(year, 11, 25), 'Christmas')

  return holidays.sort((a, b) => a.date.localeCompare(b.date))
}

export function getHolidaysInPeriod(period: PayPeriod): Holiday[] {
  const startYear = parseInt(period.start.substring(0, 4))
  const endYear = parseInt(period.end.substring(0, 4))
  const holidays: Holiday[] = []
  for (let y = startYear - 1; y <= endYear + 1; y++) {
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

  // eCats agencies submit by NOON (12:00 PM) on the deadline day
  // Normal deadline: Friday of the last week of pay period at noon
  // Holiday week: shifts to Tuesday of same week at noon
  const endFriday = new Date(period.end + 'T00:00:00')

  let deadline: Date
  if (isHolidayWeek) {
    deadline = new Date(endFriday)
    deadline.setDate(endFriday.getDate() - 3) // Tuesday
  } else {
    deadline = new Date(endFriday)
  }
  deadline.setHours(12, 0, 0, 0) // NOON — eCats agencies submit by 12:00 PM

  // Supplemental deadline: Tuesday of pay week at noon
  const supplementalDeadline = new Date(endFriday)
  supplementalDeadline.setDate(endFriday.getDate() + 4) // Tuesday after pay Friday
  supplementalDeadline.setHours(12, 0, 0, 0) // Noon

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
  const deadlineDateStr = toYMD(deadline)
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
