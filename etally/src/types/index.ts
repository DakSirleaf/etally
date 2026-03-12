export type ShiftType = 'REG' | 'OT'

export interface LogEntry {
  id: number
  date: string
  startTime: string
  endTime: string
  reg: string
  ot: string
  reason: string
  type: ShiftType
  normalEnd: string
}
