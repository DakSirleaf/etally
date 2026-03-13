import type { ShiftType } from '../types'

export interface CalcResult {
  reg: string
  ot: string
  normalEnd: string
}

// ─── Shift Pay Policy ───────────────────────────────────────────────
// • 30-minute unpaid break is deducted from every REGULAR shift
// • Paid time  = total clock time − 30 min
// • Regular    = up to 8.0 paid hours (480 paid min = 510 clock min)
// • Overtime   = any paid time beyond 8.0 hours
// • OT pickup  = ALL clock time is OT, no break deducted
// ────────────────────────────────────────────────────────────────────
const BREAK_MINS    = 30   // unpaid break deducted
const REG_CAP_MINS  = 480  // 8.0 paid hours
const OT_THRESHOLD  = REG_CAP_MINS + BREAK_MINS  // 510 clock min = 8h30m

export function calculateHours(
  start: string,
  end: string,
  shiftType: ShiftType
): CalcResult {
  const d1 = new Date(`2026-01-01T${start}`)
  let d2   = new Date(`2026-01-01T${end}`)
  if (d2 <= d1) d2.setDate(d2.getDate() + 1)

  const clockMins = (d2.getTime() - d1.getTime()) / 60000
  let reg = 0
  let ot  = 0
  let normalEnd = '--'

  if (shiftType === 'CALLOUT') {
    return { reg: '0.00', ot: '0.00', normalEnd: '--' }
  }

  if (shiftType === 'REG') {
    const paidMins = Math.max(0, clockMins - BREAK_MINS)
    reg = paidMins >= REG_CAP_MINS ? 8.0 : paidMins / 60
    ot  = paidMins > REG_CAP_MINS  ? (paidMins - REG_CAP_MINS) / 60 : 0
    // Normal shift end = start + 8 paid hrs + 30 min break
    const normalEndObj = new Date(d1.getTime() + OT_THRESHOLD * 60 * 1000)
    normalEnd = normalEndObj.toTimeString().slice(0, 5)
  } else {
    // Overtime pickup — ALL clock time is OT, no break deducted
    reg = 0
    ot  = clockMins / 60
    normalEnd = start
  }

  return {
    reg: reg.toFixed(2),
    ot:  ot.toFixed(2),
    normalEnd,
  }
}

export function buildDetailSentence(entry: {
  reason: string
  type: ShiftType
  ot: string
  startTime: string
  endTime: string
  normalEnd: string
}): string {
  if (entry.reason === 'OFF') return 'Status: Scheduled Day Off'
  if (entry.type === 'OT')
    return `Overtime shift ${entry.startTime}–${entry.endTime} · ${entry.reason}`
  if (parseFloat(entry.ot) > 0)
    return `Incidental OT from ${entry.normalEnd} to ${entry.endTime} · ${entry.reason}`
  return `Standard shift ${entry.startTime}–${entry.endTime} · ${entry.reason}`
}
