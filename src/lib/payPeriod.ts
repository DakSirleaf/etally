// Pay periods run Saturday → Friday, bi-weekly
// Current period: March 7, 2026 (Sat) → March 20, 2026 (Fri)
// Next period:    March 21, 2026 (Sat) → April 3, 2026 (Fri)

const ANCHOR_END = new Date('2026-03-20T00:00:00') // Friday end of current period

export interface PayPeriod {
  label: string
  start: string // YYYY-MM-DD
  end: string   // YYYY-MM-DD
}

function toYMD(d: Date): string {
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function getPeriodStart(endFriday: Date): Date {
  const start = new Date(endFriday)
  start.setDate(start.getDate() - 13) // 14-day period: end is day 14, start is 13 days back
  return start
}

export function getCurrentPayPeriod(): PayPeriod {
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  // Calculate how many full 14-day cycles today is from the anchor
  const msPerPeriod = 14 * 24 * 60 * 60 * 1000
  const diff = Math.round((today.getTime() - ANCHOR_END.getTime()) / msPerPeriod)

  // Find the nearest period-end Friday relative to today
  const endFriday = new Date(ANCHOR_END)
  endFriday.setDate(endFriday.getDate() + diff * 14)

  // If today is past this end, move to next period
  if (today > endFriday) {
    endFriday.setDate(endFriday.getDate() + 14)
  }

  const start = getPeriodStart(endFriday)
  return {
    label: 'Current Period',
    start: toYMD(start),
    end: toYMD(endFriday),
  }
}

export function getPreviousPayPeriod(): PayPeriod {
  const current = getCurrentPayPeriod()
  // Previous period ends the day before current period starts
  const endFriday = new Date(current.start + 'T00:00:00')
  endFriday.setDate(endFriday.getDate() - 1)
  const start = getPeriodStart(endFriday)
  return {
    label: 'Previous Period',
    start: toYMD(start),
    end: toYMD(endFriday),
  }
}

export function getPayPeriodForDate(dateStr: string): PayPeriod {
  const date = new Date(dateStr + 'T00:00:00')
  date.setHours(0, 0, 0, 0)
  const msPerPeriod = 14 * 24 * 60 * 60 * 1000
  const diff = Math.round((date.getTime() - ANCHOR_END.getTime()) / msPerPeriod)
  const endFriday = new Date(ANCHOR_END)
  endFriday.setDate(endFriday.getDate() + diff * 14)
  if (date > endFriday) endFriday.setDate(endFriday.getDate() + 14)
  const start = getPeriodStart(endFriday)
  return {
    label: 'Pay Period',
    start: toYMD(start),
    end: toYMD(endFriday),
  }
}

export function isDateInPeriod(dateStr: string, period: PayPeriod): boolean {
  return dateStr >= period.start && dateStr <= period.end
}

export function periodId(period: PayPeriod): string {
  return `${period.start}_${period.end}`
}

export function formatPeriodRange(period: PayPeriod): string {
  const s = new Date(period.start + 'T00:00:00')
  const e = new Date(period.end + 'T00:00:00')
  const sameMonth = s.getMonth() === e.getMonth() && s.getFullYear() === e.getFullYear()
  const startStr = s.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  const endStr = sameMonth
    ? e.toLocaleDateString('en-US', { day: 'numeric', year: 'numeric' })
    : e.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  return `${startStr} – ${endStr}`
}
