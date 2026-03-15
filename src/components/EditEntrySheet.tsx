import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useStore } from '../store/useStore'
import { useTheme } from '../lib/useTheme'
import { calculateHours } from '../lib/calculations'
import { to12hr } from '../lib/timeFormat'
import TimePickerSheet from './TimePickerSheet'
import DatePickerSheet from './DatePickerSheet'
import type { LogEntry, ShiftType, CalloutPayType, StaffRole } from '../types'

interface Props {
  entry: LogEntry
  onClose: () => void
}

const SHIFT_REASONS = [
  'Standard Shift','Late Relief','Patient Care','Incident Report',
  'CPR Training','Nursing Ed','Mandatory - State of Emergency',
]
const CALLOUT_PAY_TYPES: Record<StaffRole, CalloutPayType[]> = {
  RN:  ['Sick Time', 'AL Day'],
  HST: ['Sick Time', 'Vacation Time', 'AL Day'],
  HSA: ['Sick Time', 'Vacation Time', 'AL Day'],
  LPN: ['Sick Time', 'Vacation Time', 'AL Day'],
}

function formatDateDisplay(dateStr: string) {
  const d = new Date(dateStr + 'T00:00:00')
  return {
    weekday: d.toLocaleDateString('en-US', { weekday: 'short' }).toUpperCase(),
    date: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
  }
}

export default function EditEntrySheet({ entry, onClose }: Props) {
  const updateEntry = useStore((s: any) => s.updateEntry)
  const role = useStore((s: any) => s.role) as StaffRole | null
  const { isDark, surface, surfaceBorder, textPrimary, textSecondary, labelColor, toggleBg, selectColor } = useTheme()

  const [shiftType, setShiftType] = useState<ShiftType>(entry.type ?? 'REG')
  const [date, setDate] = useState(entry.date ?? '')
  const [start, setStart] = useState(entry.startTime ?? '22:45')
  const [end, setEnd] = useState(entry.endTime ?? '07:15')
  const [reason, setReason] = useState(entry.reason ?? 'Standard Shift')
  const [calloutPayType, setCalloutPayType] = useState<CalloutPayType>(entry.calloutPayType ?? 'Sick Time')
  const [activePicker, setActivePicker] = useState<'start'|'end'|null>(null)
  const [datePickerOpen, setDatePickerOpen] = useState(false)

  const availablePayTypes = role ? CALLOUT_PAY_TYPES[role] : ['Sick Time', 'AL Day']
  const dateDisplay = formatDateDisplay(date)
  const SHIFT_TYPES: ShiftType[] = ['REG', 'OT', 'CALLOUT']
  const SHIFT_LABELS: Record<ShiftType, string> = { REG: 'REGULAR', OT: 'OVERTIME', CALLOUT: 'CALLOUT' }
  const SHIFT_COLORS: Record<ShiftType, string> = { REG: '#2563EB', OT: '#DB2777', CALLOUT: '#D97706' }
  const accentColor = SHIFT_COLORS[shiftType]
  const typeIndex = SHIFT_TYPES.indexOf(shiftType)
  const pillLeft = typeIndex === 0 ? '4px' : `calc(${typeIndex * 33.333}% + 2px)`
  const pillWidth = typeIndex === 0 || typeIndex === 2 ? 'calc(33.333% - 6px)' : 'calc(33.333% - 4px)'

  const handleSave = () => {
    let updated: LogEntry
    if (shiftType === 'CALLOUT') {
      updated = { ...entry, date, type: 'CALLOUT', startTime: '--', endTime: '--', reg: '0.00', ot: '0.00', reason: calloutPayType, normalEnd: '--', calloutPayType }
    } else if (reason === 'OFF') {
      updated = { ...entry, date, type: 'REG', startTime: '--', endTime: '--', reg: '0.00', ot: '0.00', reason: 'OFF', normalEnd: '--' }
    } else {
      const calc = calculateHours(start, end, shiftType)
      updated = { ...entry, date, type: shiftType, startTime: start, endTime: end, reg: calc.reg, ot: calc.ot, reason, normalEnd: calc.normalEnd, calloutPayType: undefined }
    }
    updateEntry(updated)
    onClose()
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-40"
        style={{ background: 'rgba(5,9,18,0.8)', backdropFilter: 'blur(6px)' }}
        onClick={onClose}
      />
      <motion.div
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={{ type: 'spring', stiffness: 420, damping: 42 }}
        className="fixed bottom-0 left-0 right-0 z-50 rounded-t-3xl overflow-hidden"
        style={{
          background: isDark ? '#0A0F1E' : '#FFFFFF',
          paddingBottom: 'max(2rem, env(safe-area-inset-bottom, 2rem))',
          maxHeight: '92dvh',
          borderTop: isDark ? '1px solid rgba(255,255,255,0.08)' : 'none',
        }}
      >
        <div className="flex justify-center pt-3 pb-2">
          <div className="w-10 h-1 rounded-full" style={{ background: isDark ? '#1E293B' : '#E2E8F0' }} />
        </div>
        <div className="overflow-y-auto px-5 pb-4 flex flex-col gap-3" style={{ maxHeight: 'calc(92dvh - 3rem)' }}>
          <h2 className="font-display font-extrabold text-lg" style={{ color: textPrimary }}>Edit Entry</h2>

          {/* Shift type toggle */}
          <div className="relative flex rounded-2xl p-1" style={{ background: toggleBg }}>
            <motion.div
              className="absolute top-1 bottom-1 rounded-xl shadow-sm"
              animate={{ left: pillLeft, width: pillWidth, background: accentColor }}
              transition={{ type: 'spring', stiffness: 420, damping: 38 }}
            />
            {SHIFT_TYPES.map((t) => (
              <motion.button key={t} onClick={() => setShiftType(t)} whileTap={{ scale: 0.97 }}
                className="relative flex-1 py-3 z-10 text-[10px] font-display font-bold tracking-widest"
                style={{ color: shiftType === t ? 'white' : isDark ? '#475569' : '#94A3B8' }}>
                {SHIFT_LABELS[t]}
              </motion.button>
            ))}
          </div>

          {/* Date */}
          <motion.button whileTap={{ scale: 0.96 }} onClick={() => setDatePickerOpen(true)}
            className="w-full rounded-2xl px-4 py-3 text-left flex items-center justify-between"
            style={{ background: surface, border: surfaceBorder }}>
            <div>
              <span className="text-[8px] font-display font-bold tracking-widest block mb-1" style={{ color: labelColor }}>DATE</span>
              <span className="font-display font-bold text-sm" style={{ color: textPrimary }}>{dateDisplay.date}</span>
              <span className="text-[8px] font-display font-semibold tracking-widest block mt-0.5" style={{ color: labelColor }}>{dateDisplay.weekday}</span>
            </div>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <rect x="3" y="4" width="18" height="18" rx="2" stroke={accentColor} strokeWidth="1.8"/>
              <path d="M16 2v4M8 2v4M3 10h18" stroke={accentColor} strokeWidth="1.8" strokeLinecap="round"/>
            </svg>
          </motion.button>

          {shiftType !== 'CALLOUT' && reason !== 'OFF' && (
            <div className="grid grid-cols-2 gap-2">
              <motion.button whileTap={{ scale: 0.96 }} onClick={() => setActivePicker('start')}
                className="rounded-2xl px-3 py-3 text-left" style={{ background: surface, border: surfaceBorder }}>
                <span className="text-[8px] font-display font-bold tracking-widest block" style={{ color: labelColor }}>START</span>
                <span className="font-display font-bold text-base tabular-nums mt-1 block" style={{ color: '#2563EB' }}>{to12hr(start)}</span>
                <span className="text-[8px] font-display font-semibold tracking-widest mt-0.5 block" style={{ color: labelColor }}>TAP</span>
              </motion.button>
              <motion.button whileTap={{ scale: 0.96 }} onClick={() => setActivePicker('end')}
                className="rounded-2xl px-3 py-3 text-left" style={{ background: surface, border: surfaceBorder }}>
                <span className="text-[8px] font-display font-bold tracking-widest block" style={{ color: labelColor }}>END</span>
                <span className="font-display font-bold text-base tabular-nums mt-1 block" style={{ color: shiftType === 'OT' ? '#DB2777' : '#2563EB' }}>{to12hr(end)}</span>
                <span className="text-[8px] font-display font-semibold tracking-widest mt-0.5 block" style={{ color: labelColor }}>TAP</span>
              </motion.button>
            </div>
          )}

          {shiftType === 'CALLOUT' ? (
            <select value={calloutPayType} onChange={(e) => setCalloutPayType(e.target.value as CalloutPayType)}
              className="w-full rounded-2xl px-4 py-3 text-sm font-body font-semibold focus:outline-none"
              style={{ background: surface, border: surfaceBorder, color: selectColor }}>
              {(availablePayTypes as string[]).map((pt) => <option key={pt} value={pt}>{pt}</option>)}
            </select>
          ) : (
            <select value={reason} onChange={(e) => setReason(e.target.value)}
              className="w-full rounded-2xl px-4 py-3 text-sm font-body font-semibold focus:outline-none"
              style={{ background: surface, border: surfaceBorder, color: selectColor }}>
              {SHIFT_REASONS.map((r) => <option key={r} value={r}>{r}</option>)}
            </select>
          )}

          <div className="flex gap-2 mt-2">
            <motion.button whileTap={{ scale: 0.97 }} onClick={handleSave}
              className="flex-1 py-4 rounded-2xl font-display font-bold text-sm tracking-widest text-white"
              style={{ background: accentColor }}>
              SAVE CHANGES
            </motion.button>
            <motion.button whileTap={{ scale: 0.97 }} onClick={onClose}
              className="py-4 px-5 rounded-2xl font-display font-bold text-sm tracking-widest"
              style={{ background: surface, border: surfaceBorder, color: textSecondary }}>
              CANCEL
            </motion.button>
          </div>
        </div>

        <DatePickerSheet isOpen={datePickerOpen} value={date} onClose={() => setDatePickerOpen(false)} onConfirm={(d: string) => setDate(d)} />
        <TimePickerSheet isOpen={activePicker === 'start'} title="Set Start Time" value={start} accentColor="#2563EB" onClose={() => setActivePicker(null)} onConfirm={(t: string) => setStart(t)} />
        <TimePickerSheet isOpen={activePicker === 'end'} title="Set End Time" value={end} accentColor={shiftType === 'OT' ? '#DB2777' : '#2563EB'} onClose={() => setActivePicker(null)} onConfirm={(t: string) => setEnd(t)} />
      </motion.div>
    </AnimatePresence>
  )
}
