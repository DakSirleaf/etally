import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { calculateHours } from '../lib/calculations'
import { useStore } from '../store/useStore'
import { useTheme } from '../lib/useTheme'
import type { ShiftType, CalloutPayType, StaffRole } from '../types'
import TimePickerSheet from './TimePickerSheet'
import DatePickerSheet from './DatePickerSheet'
import { to12hr } from '../lib/timeFormat'

function todayStr() {
  return new Date().toISOString().split('T')[0]
}

function formatDateDisplay(dateStr: string): { weekday: string; date: string } {
  const d = new Date(dateStr + 'T00:00:00')
  return {
    weekday: d.toLocaleDateString('en-US', { weekday: 'short' }).toUpperCase(),
    date: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
  }
}

const SHIFT_REASONS = [
  'Standard Shift',
  'Late Relief',
  'Patient Care',
  'Incident Report',
  'CPR Training',
  'Nursing Ed',
  'Mandatory - State of Emergency',
]

const CALLOUT_PAY_TYPES: Record<StaffRole, CalloutPayType[]> = {
  RN:  ['Sick Time', 'AL Day'],
  HST: ['Sick Time', 'Vacation Time', 'AL Day'],
  HSA: ['Sick Time', 'Vacation Time', 'AL Day'],
}

const SHIFT_TYPES: ShiftType[] = ['REG', 'OT', 'CALLOUT']
const SHIFT_LABELS: Record<ShiftType, string> = {
  REG: 'REGULAR',
  OT: 'OVERTIME',
  CALLOUT: 'CALLOUT',
}
const SHIFT_COLORS: Record<ShiftType, string> = {
  REG: '#2563EB',
  OT: '#DB2777',
  CALLOUT: '#D97706',
}

const containerVariants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.06 } },
}

const tileVariants = {
  hidden: { opacity: 0, y: 12, scale: 0.97 },
  show: { opacity: 1, y: 0, scale: 1, transition: { type: 'spring', stiffness: 320, damping: 28 } },
}

export default function TrackTab() {
  const addEntry = useStore((s: any) => s.addEntry)
  const role = useStore((s: any) => s.role) as StaffRole | null
  const entries = useStore((s: any) => s.entries)
  const { isDark, surface, surfaceBorder, textPrimary, textSecondary, labelColor, toggleBg, selectColor } = useTheme()

  const [shiftType, setShiftType] = useState<ShiftType>('REG')
  const [date, setDate] = useState(todayStr())
  const [start, setStart] = useState('22:45')
  const [end, setEnd] = useState('07:15')
  const [reason, setReason] = useState('Standard Shift')
  const [calloutPayType, setCalloutPayType] = useState<CalloutPayType>('Sick Time')
  const [calc, setCalc] = useState({ reg: '8.00', ot: '0.00', normalEnd: '--' })
  const [saved, setSaved] = useState(false)
  const [activePicker, setActivePicker] = useState<'start' | 'end' | null>(null)
  const [datePickerOpen, setDatePickerOpen] = useState(false)

  // AL Day tracking
  const currentYear = new Date().getFullYear()
  const alUsedThisYear = entries.filter(
    (e: any) => e.calloutPayType === 'AL Day' && e.date.startsWith(String(currentYear))
  ).length
  const alRemaining = Math.max(0, 3 - alUsedThisYear)

  // Available callout pay types for this role
  const availablePayTypes = role ? CALLOUT_PAY_TYPES[role] : ['Sick Time', 'AL Day']

  const recompute = useCallback(() => {
    if (shiftType !== 'CALLOUT') setCalc(calculateHours(start, end, shiftType))
  }, [start, end, shiftType])

  useEffect(() => { recompute() }, [recompute])

  // Reset callout pay type when AL Days run out
  useEffect(() => {
    if (calloutPayType === 'AL Day' && alRemaining === 0) {
      setCalloutPayType('Sick Time')
    }
  }, [calloutPayType, alRemaining])

  const handleSave = () => {
    if (shiftType === 'CALLOUT') {
      addEntry({
        id: Date.now(),
        date,
        startTime: '--',
        endTime: '--',
        reg: '0.00',
        ot: '0.00',
        reason: calloutPayType,
        type: 'CALLOUT',
        normalEnd: '--',
        calloutPayType,
      })
    } else {
      const result = calculateHours(start, end, shiftType)
      addEntry({
        id: Date.now(),
        date,
        startTime: start,
        endTime: end,
        reg: result.reg,
        ot: result.ot,
        reason,
        type: shiftType,
        normalEnd: result.normalEnd,
      })
    }
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  const handleDayOff = () => {
    addEntry({
      id: Date.now(),
      date,
      startTime: '--',
      endTime: '--',
      reg: '0.00',
      ot: '0.00',
      reason: 'OFF',
      type: 'REG',
      normalEnd: '--',
    })
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  const typeIndex = SHIFT_TYPES.indexOf(shiftType)
  const accentColor = SHIFT_COLORS[shiftType]
  const dateDisplay = formatDateDisplay(date)
  const hasOT = shiftType !== 'CALLOUT' && parseFloat(calc.ot) > 0

  // Pill position for 3-way toggle
  const pillLeft = typeIndex === 0 ? '4px' : `calc(${typeIndex * 33.333}% + 2px)`
  const pillWidth = typeIndex === 0 || typeIndex === 2 ? 'calc(33.333% - 6px)' : 'calc(33.333% - 4px)'

  const tileBg = surface
  const tileBorder = surfaceBorder

  return (
    <>
      <motion.div
        className="h-full overflow-y-auto px-4 pt-3 pb-6 flex flex-col gap-2.5"
        variants={containerVariants}
        initial="hidden"
        animate="show"
      >
        {/* 3-Way Shift Type Toggle */}
        <motion.div
          variants={tileVariants}
          className="relative flex rounded-2xl p-1 flex-shrink-0"
          style={{ background: toggleBg }}
        >
          <motion.div
            className="absolute top-1 bottom-1 rounded-xl shadow-sm"
            animate={{ left: pillLeft, width: pillWidth, background: accentColor }}
            transition={{ type: 'spring', stiffness: 420, damping: 38 }}
          />
          {SHIFT_TYPES.map((t) => (
            <motion.button
              key={t}
              onClick={() => setShiftType(t)}
              whileTap={{ scale: 0.97 }}
              className="relative flex-1 py-3 z-10 text-[10px] font-display font-bold tracking-widest"
              style={{ color: shiftType === t ? 'white' : isDark ? '#475569' : '#94A3B8' }}
            >
              {SHIFT_LABELS[t]}
            </motion.button>
          ))}
        </motion.div>

        {/* Date tile — always shown */}
        <motion.div variants={tileVariants} className="flex-shrink-0">
          <motion.button
            whileTap={{ scale: 0.96 }}
            onClick={() => setDatePickerOpen(true)}
            className="w-full rounded-2xl px-4 py-3 text-left flex items-center justify-between"
            style={{ background: tileBg, border: tileBorder }}
          >
            <div className="flex flex-col">
              <span className="text-[8px] font-display font-bold tracking-widest mb-1" style={{ color: labelColor }}>
                DATE
              </span>
              <span className="font-display font-bold text-sm leading-tight" style={{ color: textPrimary }}>
                {dateDisplay.date}
              </span>
              <span className="text-[8px] font-display font-semibold tracking-widest mt-0.5" style={{ color: labelColor }}>
                {dateDisplay.weekday}
              </span>
            </div>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <rect x="3" y="4" width="18" height="18" rx="2" stroke={accentColor} strokeWidth="1.8" />
              <path d="M16 2v4M8 2v4M3 10h18" stroke={accentColor} strokeWidth="1.8" strokeLinecap="round" />
            </svg>
          </motion.button>
        </motion.div>

        {/* CALLOUT mode */}
        <AnimatePresence mode="wait">
          {shiftType === 'CALLOUT' ? (
            <motion.div
              key="callout-form"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ type: 'spring', stiffness: 300, damping: 28 }}
              className="flex flex-col gap-2.5"
            >
              {/* Callout status card */}
              <div
                className="rounded-2xl px-4 py-4 flex flex-col overflow-hidden relative"
                style={{ background: 'linear-gradient(135deg, #92400E 0%, #D97706 100%)' }}
              >
                <div className="absolute -right-3 -top-3 w-16 h-16 rounded-full opacity-10 bg-white" />
                <span className="text-[8px] font-display font-bold tracking-widest text-amber-200 z-10">
                  CALLOUT
                </span>
                <span className="text-2xl font-display font-bold text-white z-10 leading-tight mt-1">
                  No Hours Recorded
                </span>
                <span className="text-[10px] text-amber-200 mt-1 z-10 font-body">
                  This day will be logged as a callout
                </span>
              </div>

              {/* AL Day tracker */}
              <div
                className="rounded-2xl px-4 py-3 flex items-center justify-between"
                style={{ background: tileBg, border: tileBorder }}
              >
                <div>
                  <span className="text-[8px] font-display font-bold tracking-widest" style={{ color: labelColor }}>
                    AL DAYS REMAINING
                  </span>
                  <div className="flex items-center gap-2 mt-1">
                    {[0, 1, 2].map((i) => (
                      <div
                        key={i}
                        className="w-6 h-6 rounded-lg flex items-center justify-center"
                        style={{
                          background: i < alRemaining
                            ? 'linear-gradient(135deg, #D97706, #F59E0B)'
                            : isDark ? 'rgba(255,255,255,0.06)' : '#F1F5F9',
                        }}
                      >
                        <span className="text-[10px] font-display font-bold" style={{ color: i < alRemaining ? 'white' : isDark ? '#334155' : '#CBD5E1' }}>
                          {i + 1}
                        </span>
                      </div>
                    ))}
                    <span className="text-xs font-display font-bold" style={{ color: alRemaining === 0 ? '#EF4444' : textSecondary }}>
                      {alRemaining === 0 ? 'NONE LEFT' : `${alRemaining} of 3`}
                    </span>
                  </div>
                </div>
                <span className="text-[9px] font-display font-bold tracking-widest" style={{ color: labelColor }}>
                  THIS YEAR
                </span>
              </div>

              {/* Callout pay type selector */}
              <select
                value={calloutPayType}
                onChange={(e) => setCalloutPayType(e.target.value as CalloutPayType)}
                className="w-full rounded-2xl px-4 py-3 text-sm font-body font-semibold focus:outline-none focus:ring-2 focus:ring-amber-400 transition"
                style={{
                  background: tileBg,
                  border: tileBorder,
                  color: selectColor,
                  boxShadow: isDark ? 'none' : '0 2px 12px rgba(15,23,42,0.06)',
                }}
              >
                {(availablePayTypes as string[]).map((pt) => {
                  const isAlDay = pt === 'AL Day'
                  const disabled = isAlDay && alRemaining === 0
                  return (
                    <option key={pt} value={pt} disabled={disabled}>
                      {pt}{disabled ? ' (limit reached)' : ''}
                    </option>
                  )
                })}
              </select>
            </motion.div>
          ) : (
            <motion.div
              key="shift-form"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ type: 'spring', stiffness: 300, damping: 28 }}
              className="flex flex-col gap-2.5"
            >
              {/* Start / End time tiles */}
              <div className="grid grid-cols-2 gap-2">
                <motion.button
                  whileTap={{ scale: 0.96 }}
                  onClick={() => setActivePicker('start')}
                  className="rounded-2xl px-3 py-3 text-left flex flex-col justify-between"
                  style={{ background: tileBg, border: tileBorder }}
                >
                  <span className="text-[8px] font-display font-bold tracking-widest" style={{ color: labelColor }}>START</span>
                  <span className="font-display font-bold text-base tabular-nums mt-1 leading-tight" style={{ color: '#2563EB' }}>
                    {to12hr(start)}
                  </span>
                  <span className="text-[8px] font-display font-semibold tracking-widest mt-0.5" style={{ color: labelColor }}>TAP</span>
                </motion.button>

                <motion.button
                  whileTap={{ scale: 0.96 }}
                  onClick={() => setActivePicker('end')}
                  className="rounded-2xl px-3 py-3 text-left flex flex-col justify-between"
                  style={{ background: tileBg, border: tileBorder }}
                >
                  <span className="text-[8px] font-display font-bold tracking-widest" style={{ color: labelColor }}>END</span>
                  <span
                    className="font-display font-bold text-base tabular-nums mt-1 leading-tight"
                    style={{ color: shiftType === 'OT' ? '#DB2777' : '#2563EB' }}
                  >
                    {to12hr(end)}
                  </span>
                  <span className="text-[8px] font-display font-semibold tracking-widest mt-0.5" style={{ color: labelColor }}>TAP</span>
                </motion.button>
              </div>

              {/* REG / OT result tiles */}
              <div className="grid grid-cols-2 gap-2">
                <div
                  className="rounded-2xl px-4 py-3 flex flex-col overflow-hidden relative"
                  style={{ background: 'linear-gradient(135deg, #1D4ED8 0%, #3B82F6 100%)' }}
                >
                  <div className="absolute -right-3 -top-3 w-14 h-14 rounded-full opacity-10 bg-white" />
                  <span className="text-[8px] font-display font-bold tracking-widest text-blue-200 z-10">REGULAR</span>
                  <span className="text-4xl font-display font-bold text-white tabular-nums z-10 leading-none mt-1">{calc.reg}</span>
                  <span className="text-[9px] text-blue-200 mt-1 z-10 font-display font-semibold">HRS</span>
                </div>

                <div
                  className="rounded-2xl px-4 py-3 flex flex-col overflow-hidden relative"
                  style={{
                    background: hasOT
                      ? 'linear-gradient(135deg, #9D174D 0%, #EC4899 100%)'
                      : isDark ? 'rgba(255,255,255,0.05)' : 'linear-gradient(135deg, #F1F5F9 0%, #E2E8F0 100%)',
                    border: !hasOT && isDark ? '1px solid rgba(255,255,255,0.08)' : 'none',
                  }}
                >
                  <div className="absolute -right-3 -top-3 w-14 h-14 rounded-full opacity-10 bg-white" />
                  <span className="text-[8px] font-display font-bold tracking-widest z-10" style={{ color: hasOT ? '#FBCFE8' : isDark ? '#334155' : '#94A3B8' }}>
                    OVERTIME
                  </span>
                  <span
                    className="text-4xl font-display font-bold tabular-nums z-10 leading-none mt-1"
                    style={{ color: hasOT ? 'white' : isDark ? '#1E293B' : '#CBD5E1' }}
                  >
                    {calc.ot}
                  </span>
                  <span className="text-[9px] mt-1 z-10 font-display font-semibold" style={{ color: hasOT ? '#FBCFE8' : isDark ? '#334155' : '#94A3B8' }}>
                    HRS
                  </span>
                </div>
              </div>

              {/* Reason */}
              <select
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="w-full rounded-2xl px-4 py-3 text-sm font-body font-semibold focus:outline-none transition"
                style={{
                  background: tileBg,
                  border: tileBorder,
                  color: selectColor,
                  boxShadow: isDark ? 'none' : '0 2px 12px rgba(15,23,42,0.06)',
                }}
              >
                {SHIFT_REASONS.map((r) => (
                  <option key={r} value={r}>{r}</option>
                ))}
              </select>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Action Buttons */}
        <motion.div variants={tileVariants} className="flex flex-col gap-2 flex-shrink-0 mt-auto">
          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={handleSave}
            className="w-full py-4 rounded-2xl font-display font-bold text-sm tracking-widest text-white relative overflow-hidden"
            style={{
              background: `linear-gradient(135deg, ${accentColor}dd, ${accentColor})`,
              boxShadow: `0 8px 24px ${accentColor}40`,
            }}
          >
            <AnimatePresence mode="wait">
              {saved ? (
                <motion.span
                  key="saved"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  className="flex items-center justify-center gap-2"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                    <path d="M5 12l5 5L20 7" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  SAVED TO LOG
                </motion.span>
              ) : (
                <motion.span
                  key="save"
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                >
                  SAVE TO LOG
                </motion.span>
              )}
            </AnimatePresence>
          </motion.button>

          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={handleDayOff}
            className="w-full py-3 rounded-2xl font-display font-semibold text-xs tracking-widest transition"
            style={{
              background: tileBg,
              border: tileBorder,
              color: isDark ? '#475569' : '#94A3B8',
            }}
          >
            MARK DAY OFF · NO WORK
          </motion.button>
        </motion.div>
      </motion.div>

      {/* Date Picker Sheet */}
      <DatePickerSheet
        isOpen={datePickerOpen}
        value={date}
        onClose={() => setDatePickerOpen(false)}
        onConfirm={(d: string) => setDate(d)}
      />

      {/* Time Picker Sheets */}
      <TimePickerSheet
        isOpen={activePicker === 'start'}
        title="Set Start Time"
        value={start}
        accentColor="#2563EB"
        onClose={() => setActivePicker(null)}
        onConfirm={(t: string) => setStart(t)}
      />
      <TimePickerSheet
        isOpen={activePicker === 'end'}
        title="Set End Time"
        value={end}
        accentColor={shiftType === 'OT' ? '#DB2777' : '#2563EB'}
        onClose={() => setActivePicker(null)}
        onConfirm={(t: string) => setEnd(t)}
      />
    </>
  )
}
