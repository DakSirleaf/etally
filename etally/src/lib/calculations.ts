import type { ShiftType } from '../types'

export interface CalcResult {
  reg: string
  ot: string
  normalEnd: string
}

export function calculateHours(
  start: string,
  end: string,
  shiftType: ShiftType
): CalcResult {
  const d1 = new Date(`2026-01-01T${start}`)
  let d2 = new Date(`2026-01-01T${end}`)
  if (d2 <= d1) d2.setDate(d2.getDate() + 1)

  const mins = (d2.getTime() - d1.getTime()) / 60000
  let reg = 0
  let ot = 0
  let normalEnd = '--'

  if (shiftType === 'REG') {
    reg = mins >= 510 ? 8.0 : Math.max(0, (mins - 60) / 60)
    ot = mins > 510 ? (mins - 510) / 60 : 0
    const normalEndObj = new Date(d1.getTime() + 9 * 60 * 60 * 1000)
    normalEnd = normalEndObj.toTimeString().slice(0, 5)
  } else {
    reg = 0
    ot = mins / 60
    normalEnd = start
  }

  return {
    reg: reg.toFixed(2),
    ot: ot.toFixed(2),
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
    return `Incidental OT start ${entry.normalEnd} ended ${entry.endTime} · ${entry.reason}`
  return `Standard shift ${entry.startTime}–${entry.endTime} · ${entry.reason}`
}
