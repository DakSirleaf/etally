export type ShiftType = 'REG' | 'OT' | 'CALLOUT'
export type StaffRole = 'RN' | 'LPN' | 'HST' | 'HSA' | 'POOL_RN'
export type CalloutPayType = 'Sick Time' | 'Vacation Time' | 'AL Day'
export type Theme = 'dark' | 'light'

export type DayType = 'scheduled' | 'ot' | 'callout' | 'vacation' | 'aspirational' | 'off' | 'holiday'

export interface ScheduleDay {
  date: string
  type: DayType
  note?: string
  startTime?: string
  endTime?: string
  isPreApprovedOT?: boolean
}

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
  calloutPayType?: CalloutPayType
}

export interface VaultPeriod {
  id: string
  start: string
  end: string
  closedAt: string
  entries: LogEntry[]
  totals: { reg: number; ot: number; shifts: number; callouts: number }
  edited?: boolean
  label?: string
}
