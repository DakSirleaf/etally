export type ShiftType = 'REG' | 'OT' | 'CALLOUT'
export type StaffRole = 'RN' | 'HST' | 'HSA' | 'LPN'
export type CalloutPayType = 'Sick Time' | 'Vacation Time' | 'AL Day'
export type Theme = 'dark' | 'light'

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
  id: string // "YYYY-MM-DD_YYYY-MM-DD"
  start: string
  end: string
  closedAt: string // ISO
  entries: LogEntry[]
  totals: { reg: number; ot: number; shifts: number; callouts: number }
  edited?: boolean
  label?: string
}
