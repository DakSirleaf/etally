import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useTheme } from '../lib/useTheme'
import { useStore } from '../store/useStore'
import { getPayPeriodForDate } from '../lib/payPeriod'
import { getEcatsDeadline } from '../lib/ecatsAlerts'
import { to12hr } from '../lib/timeFormat'
import type { LogEntry, ScheduleDay, DayType } from '../types'

const TYPE_COLORS: Record<string, string> = {
  scheduled: '#0155C1',
  ot: '#EC0677',
  callout: '#D97706',
  vacation: '#7C3AED',
  aspirational: '#7C3AED',
  off: '#475569',
  holiday: '#F59E0B',
}

function localDateStr(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

interface DayDetailSheetProps {
  isOpen: boolean
  date: string
  entry?: LogEntry
  scheduleDay?: ScheduleDay
  holidayName?: string
  onClose: () => void
  onNavigateToTrack?: () => void
}

const QUICK_TYPES: { type: DayType; label: string }[] = [
  { type: 'scheduled', label: 'REG' },
  { type: 'ot', label: 'OT' },
  { type: 'callout', label: 'CALLOUT' },
  { type: 'vacation', label: 'VACATION' },
  { type: 'aspirational', label: 'REQ OFF' },
  { type: 'off', label: 'DAY OFF' },
]

export default function DayDetailSheet({
  isOpen,
  date,
  entry,
  scheduleDay,
  holidayName,
  onClose,
  onNavigateToTrack,
}: DayDetailSheetProps) {
  const { isDark, surface, surfaceBorder, textPrimary, textSecondary, labelColor } = useTheme()
  const setScheduleDay = useStore((s: any) => s.setScheduleDay)
  const setPendingTrackDate = useStore((s: any) => s.setPendingTrackDate)

  const [note, setNote] = useState(scheduleDay?.note ?? '')
  const [startTime, setStartTime] = useState(scheduleDay?.startTime ?? '')
  const [endTime, setEndTime] = useState(scheduleDay?.endTime ?? '')

  const d = new Date(date + 'T00:00:00')
  const dayOfWeek = d.toLocaleDateString('en-US', { weekday: 'long' })
  const dateDisplay = d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })

  const period = getPayPeriodForDate(date)
  const { isHolidayWeek, deadline } = getEcatsDeadline(period)
  const deadlineDateStr = localDateStr(deadline)
  const isSupplementalDay =
    isHolidayWeek &&
    date > deadlineDateStr &&
    scheduleDay?.type === 'ot' &&
    scheduleDay?.isPreApprovedOT === true

  const handleSetType = (type: DayType) => {
    const updated: ScheduleDay = {
      date,
      type,
      note,
      startTime: startTime || undefined,
      endTime: endTime || undefined,
      isPreApprovedOT: type === 'ot' ? (scheduleDay?.isPreApprovedOT ?? false) : undefined,
    }
    setScheduleDay(updated)
  }

  const handleSaveTimes = () => {
    const base: ScheduleDay = scheduleDay ?? { date, type: 'scheduled' as DayType }
    setScheduleDay({ ...base, startTime: startTime || undefined, endTime: endTime || undefined, note })
  }

  const handleSaveNote = () => {
    const base: ScheduleDay = scheduleDay ?? { date, type: 'off' as DayType }
    setScheduleDay({ ...base, note, startTime: startTime || undefined, endTime: endTime || undefined })
  }

  const handleLogThisShift = () => {
    setPendingTrackDate(date)
    onClose()
    onNavigateToTrack?.()
  }

  const activeType = scheduleDay?.type
  const showTimeSection = activeType && activeType !== 'off' && activeType !== 'holiday'

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-40"
            style={{ background: 'rgba(5,9,18,0.78)', backdropFilter: 'blur(8px)' }}
            onClick={onClose}
          />

          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', stiffness: 440, damping: 44 }}
            className="fixed bottom-0 left-0 right-0 z-50 rounded-t-3xl overflow-hidden"
            style={{
              background: isDark ? '#080D1E' : '#FFFFFF',
              paddingBottom: 'max(2rem, env(safe-area-inset-bottom, 2rem))',
              maxHeight: '90dvh',
            }}
          >
            {/* Holiday gold banner */}
            {holidayName && (
              <div
                className="w-full px-5 py-3 flex items-center gap-2.5"
                style={{
                  background: isDark ? 'rgba(245,158,11,0.1)' : '#FFFBEB',
                  borderBottom: isDark ? '1px solid rgba(245,158,11,0.2)' : '1px solid #FDE68A',
                }}
              >
                <span style={{ fontSize: '16px', color: '#F59E0B' }}>★</span>
                <div>
                  <span className="font-display font-bold text-sm" style={{ color: '#F59E0B' }}>{holidayName}</span>
                  <span className="text-[10px] font-body ml-2" style={{ color: '#D97706' }}>PAID HOLIDAY</span>
                </div>
              </div>
            )}

            {/* Drag handle */}
            <div className="flex justify-center pt-3 pb-1">
              <div className="w-10 h-1 rounded-full" style={{ background: isDark ? '#1E293B' : '#E2E8F0' }} />
            </div>

            <div className="overflow-y-auto px-4" style={{ maxHeight: 'calc(90dvh - 3rem)' }}>

              {/* Date header */}
              <div className="mt-1 mb-4 flex items-start justify-between gap-3">
                <div>
                  <h2 className="font-display font-bold text-xl leading-tight" style={{ color: textPrimary }}>
                    {dayOfWeek}
                  </h2>
                  <p className="font-body text-sm mt-0.5" style={{ color: textSecondary }}>{dateDisplay}</p>
                </div>
                {activeType && (
                  <div
                    className="px-3 py-1.5 rounded-2xl flex-shrink-0 mt-1"
                    style={{
                      background: `${TYPE_COLORS[activeType]}18`,
                      border: `1px solid ${TYPE_COLORS[activeType]}40`,
                    }}
                  >
                    <span
                      className="text-[10px] font-display font-bold tracking-widest"
                      style={{ color: TYPE_COLORS[activeType] }}
                    >
                      {QUICK_TYPES.find((q) => q.type === activeType)?.label ?? activeType.toUpperCase()}
                    </span>
                  </div>
                )}
              </div>

              {/* Supplemental warning */}
              {isSupplementalDay && (
                <div
                  className="rounded-2xl px-4 py-3 mb-3"
                  style={{
                    background: isDark ? 'rgba(180,83,9,0.12)' : '#FFFBEB',
                    border: isDark ? '1px solid rgba(217,119,6,0.28)' : '1px solid #FDE68A',
                  }}
                >
                  <div className="text-[9px] font-display font-bold tracking-widest mb-1" style={{ color: '#D97706' }}>
                    SUPPLEMENTAL PAY REQUIRED
                  </div>
                  <p className="text-[11px] font-body leading-relaxed" style={{ color: textSecondary }}>
                    This pre-approved OT falls after the ECATS Tuesday deadline. File a supplemental pay request.
                  </p>
                </div>
              )}

              {/* Logged entry card */}
              {entry && (
                <div className="rounded-2xl px-4 py-3 mb-3" style={{ background: surface, border: surfaceBorder }}>
                  <div className="text-[9px] font-display font-bold tracking-widest mb-2" style={{ color: labelColor }}>
                    LOGGED ENTRY
                  </div>
                  {entry.reason === 'OFF' ? (
                    <span className="text-sm font-display font-bold" style={{ color: textSecondary }}>Day Off</span>
                  ) : entry.type === 'CALLOUT' ? (
                    <div>
                      <span className="text-sm font-display font-bold" style={{ color: '#D97706' }}>Callout</span>
                      <p className="text-[11px] font-body mt-0.5" style={{ color: textSecondary }}>{entry.calloutPayType}</p>
                    </div>
                  ) : (
                    <div className="flex items-end gap-4">
                      <div>
                        <div className="text-[8px] font-display font-bold tracking-widest mb-0.5" style={{ color: labelColor }}>REG</div>
                        <div className="text-xl font-display font-bold leading-none" style={{ color: '#2563EB' }}>{entry.reg}</div>
                      </div>
                      {parseFloat(entry.ot) > 0 && (
                        <div>
                          <div className="text-[8px] font-display font-bold tracking-widest mb-0.5" style={{ color: labelColor }}>OT</div>
                          <div className="text-xl font-display font-bold leading-none" style={{ color: '#DB2777' }}>{entry.ot}</div>
                        </div>
                      )}
                      <div className="ml-auto text-right">
                        <div className="text-[8px] font-display font-bold tracking-widest mb-0.5" style={{ color: labelColor }}>TIME</div>
                        <div className="text-xs font-body" style={{ color: textSecondary }}>
                          {to12hr(entry.startTime)} – {to12hr(entry.endTime)}
                        </div>
                        <div className="text-[9px] font-body mt-0.5" style={{ color: labelColor }}>{entry.reason}</div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Schedule type buttons */}
              <div className="mb-3">
                <div className="text-[9px] font-display font-bold tracking-widest mb-2" style={{ color: labelColor }}>
                  MARK AS
                </div>
                <div className="grid grid-cols-3 gap-1.5">
                  {QUICK_TYPES.map(({ type, label }) => {
                    const isActive = activeType === type
                    const color = TYPE_COLORS[type]
                    return (
                      <motion.button
                        key={type}
                        whileTap={{ scale: 0.92 }}
                        onClick={() => handleSetType(type)}
                        className="py-2.5 rounded-2xl font-display font-bold text-[9px] tracking-widest"
                        style={{
                          background: isActive ? `${color}18` : isDark ? 'rgba(255,255,255,0.04)' : '#F8FAFC',
                          border: isActive ? `1.5px solid ${color}55` : isDark ? '1px solid rgba(255,255,255,0.07)' : '1px solid #E2E8F0',
                          color: isActive ? color : isDark ? '#475569' : '#94A3B8',
                        }}
                      >
                        {label}
                      </motion.button>
                    )
                  })}
                </div>
              </div>

              {/* Time section */}
              {showTimeSection && (
                <div className="mb-3">
                  <div className="text-[9px] font-display font-bold tracking-widest mb-2" style={{ color: labelColor }}>
                    SHIFT TIMES
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <div className="text-[8px] font-display font-bold tracking-widest mb-1" style={{ color: labelColor }}>
                        START
                      </div>
                      <input
                        type="time"
                        value={startTime}
                        onChange={(e) => setStartTime(e.target.value)}
                        onBlur={handleSaveTimes}
                        className="w-full rounded-xl px-3 py-2.5 text-xs font-body focus:outline-none"
                        style={{
                          background: isDark ? 'rgba(255,255,255,0.06)' : '#F8FAFC',
                          border: isDark ? '1px solid rgba(255,255,255,0.1)' : '1px solid #E2E8F0',
                          color: textPrimary,
                          colorScheme: isDark ? 'dark' : 'light',
                        }}
                      />
                    </div>
                    <div>
                      <div className="text-[8px] font-display font-bold tracking-widest mb-1" style={{ color: labelColor }}>
                        END
                      </div>
                      <input
                        type="time"
                        value={endTime}
                        onChange={(e) => setEndTime(e.target.value)}
                        onBlur={handleSaveTimes}
                        className="w-full rounded-xl px-3 py-2.5 text-xs font-body focus:outline-none"
                        style={{
                          background: isDark ? 'rgba(255,255,255,0.06)' : '#F8FAFC',
                          border: isDark ? '1px solid rgba(255,255,255,0.1)' : '1px solid #E2E8F0',
                          color: textPrimary,
                          colorScheme: isDark ? 'dark' : 'light',
                        }}
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Notes */}
              <div className="mb-3">
                <div className="text-[9px] font-display font-bold tracking-widest mb-2" style={{ color: labelColor }}>
                  NOTES
                </div>
                <textarea
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  onBlur={handleSaveNote}
                  placeholder="Add a note for this day…"
                  rows={2}
                  className="w-full rounded-2xl px-4 py-3 text-sm font-body resize-none focus:outline-none"
                  style={{
                    background: isDark ? 'rgba(255,255,255,0.05)' : '#F8FAFC',
                    border: isDark ? '1px solid rgba(255,255,255,0.09)' : '1px solid #E2E8F0',
                    color: textPrimary,
                  }}
                />
              </div>

              {/* LOG THIS SHIFT */}
              <motion.button
                whileTap={{ scale: 0.97 }}
                onClick={handleLogThisShift}
                className="w-full py-3.5 rounded-2xl font-display font-bold text-xs tracking-widest text-white mb-2"
                style={{ background: 'linear-gradient(135deg, #1D4ED8, #3B82F6)' }}
              >
                LOG THIS SHIFT →
              </motion.button>

              {/* Close */}
              <motion.button
                whileTap={{ scale: 0.97 }}
                onClick={onClose}
                className="w-full py-3.5 rounded-2xl font-display font-bold text-xs tracking-widest mb-1"
                style={{
                  background: isDark ? 'rgba(255,255,255,0.06)' : '#F1F5F9',
                  color: textSecondary,
                }}
              >
                CLOSE
              </motion.button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
