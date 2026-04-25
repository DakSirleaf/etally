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
}

const TYPE_LABELS: Record<string, string> = {
  scheduled: 'Scheduled',
  ot: 'OT Pickup',
  callout: 'Callout',
  vacation: 'Vacation',
  aspirational: 'Aspirational',
  off: 'Day Off',
  holiday: 'Holiday',
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

function localDateStr(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

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
      startTime: scheduleDay?.startTime,
      endTime: scheduleDay?.endTime,
      isPreApprovedOT: type === 'ot' ? (scheduleDay?.isPreApprovedOT ?? false) : undefined,
    }
    setScheduleDay(updated)
  }

  const handleSaveNote = () => {
    const base = scheduleDay ?? { date, type: 'off' as DayType }
    setScheduleDay({ ...base, note })
  }

  const handleLogThisShift = () => {
    setPendingTrackDate(date)
    onClose()
    onNavigateToTrack?.()
  }

  const quickActions: { type: DayType; label: string }[] = [
    { type: 'scheduled', label: 'SCHEDULED' },
    { type: 'ot', label: 'OT PICKUP' },
    { type: 'vacation', label: 'VACATION' },
    { type: 'aspirational', label: 'ASPIRATIONAL' },
    { type: 'off', label: 'DAY OFF' },
  ]

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
            style={{ background: 'rgba(5,9,18,0.75)', backdropFilter: 'blur(6px)' }}
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
              maxHeight: '88dvh',
              borderTop: isDark ? '1px solid rgba(255,255,255,0.08)' : 'none',
            }}
          >
            {/* Drag handle */}
            <div className="flex justify-center pt-3 pb-1">
              <div className="w-10 h-1 rounded-full" style={{ background: isDark ? '#1E293B' : '#E2E8F0' }} />
            </div>

            <div className="overflow-y-auto px-4" style={{ maxHeight: 'calc(88dvh - 3rem)' }}>

              {/* Date header */}
              <div className="mt-2 mb-4 flex items-start justify-between">
                <div>
                  <h2 className="font-display font-bold text-xl" style={{ color: textPrimary }}>{dayOfWeek}</h2>
                  <p className="font-body text-sm mt-0.5" style={{ color: textSecondary }}>{dateDisplay}</p>
                  {holidayName && (
                    <div className="flex items-center gap-1.5 mt-1.5">
                      <span style={{ color: '#F59E0B' }}>★</span>
                      <span className="text-xs font-display font-bold" style={{ color: '#F59E0B' }}>{holidayName}</span>
                    </div>
                  )}
                </div>
                {scheduleDay && (
                  <div
                    className="px-3 py-1.5 rounded-xl mt-1 flex-shrink-0"
                    style={{
                      background: `${TYPE_COLORS[scheduleDay.type]}18`,
                      border: `1px solid ${TYPE_COLORS[scheduleDay.type]}40`,
                    }}
                  >
                    <span className="text-[10px] font-display font-bold tracking-widest" style={{ color: TYPE_COLORS[scheduleDay.type] }}>
                      {TYPE_LABELS[scheduleDay.type]}
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
                    border: isDark ? '1px solid rgba(217,119,6,0.25)' : '1px solid #FDE68A',
                  }}
                >
                  <div className="text-[9px] font-display font-bold tracking-widest mb-1" style={{ color: '#D97706' }}>
                    SUPPLEMENTAL PAY REQUIRED
                  </div>
                  <div className="text-[10px] font-body leading-relaxed" style={{ color: textSecondary }}>
                    This pre-approved OT falls after the ECATS Tuesday deadline. File a supplemental pay request.
                  </div>
                </div>
              )}

              {/* Logged entry */}
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
                      <p className="text-[10px] font-body mt-0.5" style={{ color: textSecondary }}>{entry.calloutPayType}</p>
                    </div>
                  ) : (
                    <div className="flex items-end gap-4">
                      <div>
                        <div className="text-[8px] font-display font-bold tracking-widest" style={{ color: labelColor }}>REG</div>
                        <div className="text-xl font-display font-bold" style={{ color: '#2563EB' }}>{entry.reg}</div>
                      </div>
                      {parseFloat(entry.ot) > 0 && (
                        <div>
                          <div className="text-[8px] font-display font-bold tracking-widest" style={{ color: labelColor }}>OT</div>
                          <div className="text-xl font-display font-bold" style={{ color: '#DB2777' }}>{entry.ot}</div>
                        </div>
                      )}
                      <div className="ml-auto text-right">
                        <div className="text-[8px] font-display font-bold tracking-widest" style={{ color: labelColor }}>TIME</div>
                        <div className="text-xs font-body mt-0.5" style={{ color: textSecondary }}>
                          {to12hr(entry.startTime)} – {to12hr(entry.endTime)}
                        </div>
                        <div className="text-[9px] font-body mt-0.5" style={{ color: labelColor }}>{entry.reason}</div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Schedule section */}
              <div className="mb-3">
                <div className="text-[9px] font-display font-bold tracking-widest mb-2" style={{ color: labelColor }}>
                  SCHEDULE
                </div>

                {/* Log This Shift */}
                <motion.button
                  whileTap={{ scale: 0.97 }}
                  onClick={handleLogThisShift}
                  className="w-full py-3 rounded-2xl font-display font-bold text-xs tracking-widest text-white mb-2"
                  style={{ background: 'linear-gradient(135deg, #1D4ED8, #3B82F6)' }}
                >
                  LOG THIS SHIFT →
                </motion.button>

                {/* Quick-type grid */}
                <div className="grid grid-cols-2 gap-2">
                  {quickActions.map(({ type, label }) => {
                    const isActive = scheduleDay?.type === type
                    const color = TYPE_COLORS[type]
                    return (
                      <motion.button
                        key={type}
                        whileTap={{ scale: 0.94 }}
                        onClick={() => handleSetType(type)}
                        className="py-3 rounded-2xl font-display font-bold text-[10px] tracking-widest"
                        style={{
                          background: isActive ? `${color}18` : isDark ? 'rgba(255,255,255,0.04)' : '#F8FAFC',
                          border: isActive ? `1.5px solid ${color}55` : isDark ? '1px solid rgba(255,255,255,0.08)' : '1px solid #E2E8F0',
                          color: isActive ? color : isDark ? '#475569' : '#94A3B8',
                        }}
                      >
                        {label}
                      </motion.button>
                    )
                  })}
                </div>
              </div>

              {/* Notes */}
              <div className="mb-4">
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
                    background: isDark ? 'rgba(255,255,255,0.06)' : '#F8FAFC',
                    border: isDark ? '1px solid rgba(255,255,255,0.1)' : '1px solid #E2E8F0',
                    color: textPrimary,
                  }}
                />
              </div>

              {/* Close */}
              <motion.button
                whileTap={{ scale: 0.97 }}
                onClick={onClose}
                className="w-full py-4 rounded-2xl font-display font-bold text-xs tracking-widest mb-2"
                style={{
                  background: isDark ? 'rgba(255,255,255,0.07)' : '#F1F5F9',
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
