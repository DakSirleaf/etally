export type ShiftType = 'REG' | 'OT' | 'CALLOUT'
export type StaffRole = 'RN' | 'HST' | 'HSA'
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
