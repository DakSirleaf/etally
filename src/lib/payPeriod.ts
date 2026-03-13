// Pay periods run Saturday → Friday, bi-weekly
// Anchor: period ending Friday March 13, 2026

const ANCHOR_END = new Date('2026-03-13T00:00:00') // Friday

export interface PayPeriod {
  label: string
  start: string // YYYY-MM-DD
  end: string   // YYYY-MM-DD
}

function toYMD(d: Date): string {
  return d.toISOString().split('T')[0]
}

function getPeriodStart(endFriday: Date): Date {
  const start = new Date(endFriday)
  start.setDate(start.getDate() - 13) // 14-day period, start is 13 days before end
  return start
}

export function getCurrentPayPeriod(): PayPeriod {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  
  // Find how many 14-day cycles from anchor
  const diff = Math.floor((today.getTime() - ANCHOR_END.getTime()) / (14 * 24 * 60 * 60 * 1000))
  const endFriday = new Date(ANCHOR_END)
  endFriday.setDate(endFriday.getDate() + diff * 14)
  
  // If today is past this end, advance one period
  if (today > endFriday) endFriday.setDate(endFriday.getDate() + 14)
  
  const start = getPeriodStart(endFriday)
  return {
    label: 'Current Period',
    start: toYMD(start),
    end: toYMD(endFriday),
  }
}

export function getPreviousPayPeriod(): PayPeriod {
  const current = getCurrentPayPeriod()
  const endFriday = new Date(current.start + 'T00:00:00')
  endFriday.setDate(endFriday.getDate() - 1)
  const start = getPeriodStart(endFriday)
  return {
    label: 'Previous Period',
    start: toYMD(start),
    end: toYMD(endFriday),
  }
}
