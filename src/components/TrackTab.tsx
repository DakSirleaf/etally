import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { calculateHours } from '../lib/calculations'
import { useStore } from '../store/useStore'
import type { ShiftType } from '../types'
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

const REASONS = [
  'Standard Shift',
  'Late Relief',
  'Patient Care',
  'Incident Report',
  'CPR Training',
  'Nursing Ed',
]

const containerVariants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.06 } },
}

const tileVariants = {
  hidden: { opacity: 0, y: 12, scale: 0.97 },
  show: { opacity: 1, y: 0, scale: 1, transition: { type: 'spring', stiffness: 320, damping: 28 } },
}

export default function TrackTab() {
  const addEntry = useStore((s) => s.addEntry)
  const [shiftType, setShiftType] = useState<ShiftType>('REG')
  const [date, setDate] = useState(todayStr())
  const [start, setStart] = useState('22:45')
  const [end, setEnd]     = useState('07:15')
  const [reason, setReason] = useState('Standard Shift')
  const [calc, setCalc] = useState({ reg: '8.00', ot: '0.00', normalEnd: '--' })
  const [saved, setSaved] = useState(false)
  const [activePicker, setActivePicker] = useState<'start' | 'end' | null>(null)
  const [datePickerOpen, setDatePickerOpen] = useState(false)

  const recompute = useCallback(() => {
    setCalc(calculateHours(start, end, shiftType))
  }, [start, end, shiftType])

  useEffect(() => { recompute() }, [recompute])

  const handleSave = () => {
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

  const isReg = shiftType === 'REG'
  const accentColor = isReg ? '#2563EB' : '#DB2777'
  const dateDisplay = formatDateDisplay(date)
  const hasOT = parseFloat(calc.ot) > 0

  return (
    <>
      <motion.div
        className="h-full overflow-y-auto px-4 pt-3 pb-6 flex flex-col gap-2.5"
        variants={containerVariants}
        initial="hidden"
        animate="show"
      >
        {/* Shift Type Toggle */}
        <motion.div variants={tileVariants} className="relative flex bg-slate-100 rounded-2xl p-1 flex-shrink-0">
          <motion.div
            className="absolute top-1 bottom-1 rounded-xl shadow-sm"
            animate={{
              left: isReg ? '4px' : 'calc(50%)',
              width: 'calc(50% - 4px)',
              background: accentColor,
            }}
            transition={{ type: 'spring', stiffness: 420, damping: 38 }}
          />
          {(['REG', 'OT'] as ShiftType[]).map((t) => (
            <motion.button
              key={t}
              onClick={() => setShiftType(t)}
              whileTap={{ scale: 0.97 }}
              className="relative flex-1 py-3 z-10 text-[11px] font-display font-bold tracking-widest"
              style={{ color: shiftType === t ? 'white' : '#94A3B8' }}
            >
              {t === 'REG' ? 'REGULAR' : 'OVERTIME PICKUP'}
            </motion.button>
          ))}
        </motion.div>

        {/* Date + Time row */}
        <motion.div variants={tileVariants} className="grid grid-cols-3 gap-2 flex-shrink-0">

          {/* Date tile — tap opens wheel date picker */}
          <motion.button
            whileTap={{ scale: 0.96 }}
            onClick={() => setDatePickerOpen(true)}
            className="bento-tile px-3 py-3 text-left flex flex-col justify-between col-span-1"
          >
            <span className="text-[8px] font-display font-bold tracking-widest text-slate-400">DATE</span>
            <span className="font-display font-bold text-sm text-slate-800 leading-tight mt-1">{dateDisplay.date}</span>
            <span className="text-[8px] font-display font-semibold text-slate-400 tracking-widest mt-0.5">{dateDisplay.weekday}</span>
          </motion.button>

          {/* Start tile */}
          <motion.button
            whileTap={{ scale: 0.96 }}
            onClick={() => setActivePicker('start')}
            className="bento-tile px-3 py-3 text-left flex flex-col justify-between"
          >
            <span className="text-[8px] font-display font-bold tracking-widest text-slate-400">START</span>
            <span className="font-display font-bold text-base tabular-nums mt-1 leading-tight" style={{ color: '#2563EB' }}>{to12hr(start)}</span>
            <span className="text-[8px] text-slate-400 font-display font-semibold tracking-widest mt-0.5">TAP</span>
          </motion.button>

          {/* End tile */}
          <motion.button
            whileTap={{ scale: 0.96 }}
            onClick={() => setActivePicker('end')}
            className="bento-tile px-3 py-3 text-left flex flex-col justify-between"
          >
            <span className="text-[8px] font-display font-bold tracking-widest text-slate-400">END</span>
            <span
              className="font-display font-bold text-base tabular-nums mt-1 leading-tight"
              style={{ color: shiftType === 'OT' ? '#DB2777' : '#2563EB' }}
            >
              {to12hr(end)}
            </span>
            <span className="text-[8px] text-slate-400 font-display font-semibold tracking-widest mt-0.5">TAP</span>
          </motion.button>
        </motion.div>

        {/* REG / OT result tiles */}
        <motion.div variants={tileVariants} className="grid grid-cols-2 gap-2 flex-shrink-0">
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
                : 'linear-gradient(135deg, #F1F5F9 0%, #E2E8F0 100%)',
            }}
          >
            <div className="absolute -right-3 -top-3 w-14 h-14 rounded-full opacity-10 bg-white" />
            <span className="text-[8px] font-display font-bold tracking-widest z-10" style={{ color: hasOT ? '#FBCFE8' : '#94A3B8' }}>
              OVERTIME
            </span>
            <span
              className="text-4xl font-display font-bold tabular-nums z-10 leading-none mt-1"
              style={{ color: hasOT ? 'white' : '#CBD5E1' }}
            >
              {calc.ot}
            </span>
            <span className="text-[9px] mt-1 z-10 font-display font-semibold" style={{ color: hasOT ? '#FBCFE8' : '#94A3B8' }}>
              HRS
            </span>
          </div>
        </motion.div>

        {/* Reason */}
        <motion.div variants={tileVariants} className="flex-shrink-0">
          <select
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            className="w-full bento-tile px-4 py-3 text-sm font-body font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-300 transition"
          >
            {REASONS.map((r) => (
              <option key={r} value={r}>{r}</option>
            ))}
          </select>
        </motion.div>

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
            className="w-full py-3 rounded-2xl font-display font-semibold text-xs tracking-widest text-slate-400 border border-slate-200 bg-white"
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
        onConfirm={(d) => setDate(d)}
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
