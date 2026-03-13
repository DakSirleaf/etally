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
