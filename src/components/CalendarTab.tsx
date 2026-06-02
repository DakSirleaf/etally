import { useState, useMemo, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useTheme } from '../lib/useTheme'
import { useStore } from '../store/useStore'
import { getPayPeriodForDate, periodId } from '../lib/payPeriod'
import { getHolidaysForYear, getEcatsDeadline } from '../lib/ecatsAlerts'
import type { LogEntry, ScheduleDay } from '../types'
import DayDetailSheet from './DayDetailSheet'
import SchedulePhotoParser from './SchedulePhotoParser'
import EditEntrySheet from './EditEntrySheet'

const TYPE_PILL_BG: Record<string, string> = {
  scheduled:    '#2563EB',
  ot:           '#EC0677',
  callout:      '#F59E0B',
  vacation:     '#10B981',
  aspirational: '#8B5CF6',
  off:          '#94A3B8',
  holiday:      '#EF4444',
}

const TYPE_ABBREV: Record<string, string> = {
  scheduled:    'SCH',
  ot:           'OT',
  callout:      'CALL',
  vacation:     'VAC',
  aspirational: 'REQ',
  off:          'OFF',
  holiday:      'HOL',
}

const BAND_ANCHOR_MS = new Date('2026-03-07T00:00:00').getTime()
const MS_PER_PERIOD = 14 * 24 * 60 * 60 * 1000

function getPeriodBand(dateStr: string): 0 | 1 {
  const period = getPayPeriodForDate(dateStr)
  const startMs = new Date(period.start + 'T00:00:00').getTime()
  const idx = Math.round((startMs - BAND_ANCHOR_MS) / MS_PER_PERIOD)
  return (Math.abs(idx) % 2) as 0 | 1
}

function toDateStr(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

interface CalendarTabProps {
  onNavigateToTrack?: () => void
}

export default function CalendarTab({ onNavigateToTrack }: CalendarTabProps) {
  const { isDark, textPrimary, textSecondary, labelColor } = useTheme()
  const entries = (useStore((s: any) => s.entries) as LogEntry[]) ?? []
  const schedule = (useStore((s: any) => s.schedule) as ScheduleDay[]) ?? []
  const clearSchedule = useStore((s: any) => s.clearSchedule)

  const today = new Date()
  const todayStr = toDateStr(today)

  const [viewYear, setViewYear] = useState(today.getFullYear())
  const [viewMonth, setViewMonth] = useState(today.getMonth())
  const [selectedDate, setSelectedDate] = useState<string | null>(null)
  const [photoParserOpen, setPhotoParserOpen] = useState(false)
  const [editingEntry, setEditingEntry] = useState<LogEntry | null>(null)
  const [confirmClear, setConfirmClear] = useState(false)

  const goToToday = useCallback(() => {
    setViewYear(today.getFullYear())
    setViewMonth(today.getMonth())
  }, [today.getFullYear(), today.getMonth()])

  const prevMonth = () => {
    if (viewMonth === 0) { setViewMonth(11); setViewYear((y) => y - 1) }
    else setViewMonth((m) => m - 1)
  }
  const nextMonth = () => {
    if (viewMonth === 11) { setViewMonth(0); setViewYear((y) => y + 1) }
    else setViewMonth((m) => m + 1)
  }

  const cells = useMemo(() => {
    const first = new Date(viewYear, viewMonth, 1).getDay()
    const last = new Date(viewYear, viewMonth + 1, 0).getDate()
    const total = Math.ceil((first + last) / 7) * 7
    return Array.from({ length: total }, (_, i) => {
      const d = new Date(viewYear, viewMonth, i - first + 1)
      return { dateStr: toDateStr(d), inMonth: d.getMonth() === viewMonth }
    })
  }, [viewYear, viewMonth])

  const holidayMap = useMemo(() => {
    const map: Record<string, string> = {}
    ;[viewYear - 1, viewYear, viewYear + 1].forEach((y) =>
      getHolidaysForYear(y).forEach((h) => { map[h.date] = h.name })
    )
    return map
  }, [viewYear])

  const deadlineDates = useMemo(() => {
    const dates = new Set<string>()
    const seen = new Set<string>()
    cells.forEach(({ dateStr }) => {
      const period = getPayPeriodForDate(dateStr)
      const pid = periodId(period)
      if (seen.has(pid)) return
      seen.add(pid)
      const { deadline } = getEcatsDeadline(period)
      dates.add(toDateStr(deadline))
    })
    return dates
  }, [cells])

  const entriesMap = useMemo(() => {
    const map: Record<string, LogEntry> = {}
    entries.forEach((e) => { if (!map[e.date]) map[e.date] = e })
    return map
  }, [entries])

  const scheduleMap = useMemo(() => {
    const map: Record<string, ScheduleDay> = {}
    schedule.forEach((s) => { map[s.date] = s })
    return map
  }, [schedule])

  const isViewingThisMonth = viewYear === today.getFullYear() && viewMonth === today.getMonth()
  const monthName = new Date(viewYear, viewMonth, 1).toLocaleDateString('en-US', { month: 'long' })
  const hasSchedule = schedule.length > 0

  return (
    <div className="flex flex-col pb-6">
      <div className="px-4 pt-3">

        {/* Header */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <motion.button whileTap={{ scale: 0.88 }} onClick={prevMonth}
              className="w-8 h-8 rounded-xl flex items-center justify-center"
              style={{ background: isDark ? 'rgba(255,255,255,0.06)' : '#F1F5F9' }}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none">
                <path d="M15 18l-6-6 6-6" stroke={textSecondary} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </motion.button>
            <span className="text-base font-display font-bold min-w-[130px] text-center" style={{ color: textPrimary }}>
              {monthName} {viewYear}
            </span>
            <motion.button whileTap={{ scale: 0.88 }} onClick={nextMonth}
              className="w-8 h-8 rounded-xl flex items-center justify-center"
              style={{ background: isDark ? 'rgba(255,255,255,0.06)' : '#F1F5F9' }}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none">
                <path d="M9 18l6-6-6-6" stroke={textSecondary} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </motion.button>
          </div>

          <div className="flex items-center gap-1.5">
            {!isViewingThisMonth && (
              <motion.button whileTap={{ scale: 0.92 }} onClick={goToToday}
                className="px-3 h-8 rounded-xl font-display font-bold text-[9px] tracking-widest"
                style={{ background: 'rgba(37,99,235,0.12)', color: '#3B82F6' }}>
                TODAY
              </motion.button>
            )}
            <motion.button whileTap={{ scale: 0.92 }} onClick={() => setPhotoParserOpen(true)}
              className="flex items-center gap-1 px-3 h-8 rounded-xl"
              style={{ background: 'rgba(124,58,237,0.1)' }}>
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none">
                <path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z" stroke="#7C3AED" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                <circle cx="12" cy="13" r="4" stroke="#7C3AED" strokeWidth="1.8" />
              </svg>
              <span className="text-[9px] font-display font-bold tracking-widest" style={{ color: '#7C3AED' }}>IMPORT</span>
            </motion.button>
            {hasSchedule && (
              <motion.button whileTap={{ scale: 0.92 }} onClick={() => setConfirmClear(true)}
                className="flex items-center gap-1 px-3 h-8 rounded-xl"
                style={{ background: isDark ? 'rgba(239,68,68,0.1)' : '#FFF1F2' }}>
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none">
                  <path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6" stroke="#EF4444" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                <span className="text-[9px] font-display font-bold tracking-widest" style={{ color: '#EF4444' }}>CLEAR</span>
              </motion.button>
            )}
          </div>
        </div>

        {/* Clear confirmation */}
        <AnimatePresence>
          {confirmClear && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden mb-3">
              <div className="rounded-2xl px-4 py-3" style={{ background: isDark ? 'rgba(239,68,68,0.08)' : '#FFF1F2', border: '1px solid #FECDD3' }}>
                <p className="text-[10px] font-display font-bold tracking-widest mb-1" style={{ color: '#EF4444' }}>CLEAR ALL SCHEDULE DAYS?</p>
                <p className="text-[11px] font-body mb-3" style={{ color: textSecondary }}>This removes all imported schedule dates. You can re-import anytime.</p>
                <div className="flex gap-2">
                  <motion.button whileTap={{ scale: 0.97 }} onClick={() => { clearSchedule(); setConfirmClear(false) }}
                    className="flex-1 py-2 rounded-xl font-display font-bold text-[10px] tracking-widest text-white" style={{ background: '#EF4444' }}>
                    YES, CLEAR
                  </motion.button>
                  <motion.button whileTap={{ scale: 0.97 }} onClick={() => setConfirmClear(false)}
                    className="flex-1 py-2 rounded-xl font-display font-bold text-[10px] tracking-widest"
                    style={{ background: isDark ? 'rgba(255,255,255,0.06)' : '#F1F5F9', color: textSecondary }}>
                    CANCEL
                  </motion.button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Day headers */}
        <div className="grid grid-cols-7 mb-1">
          {['SUN','MON','TUE','WED','THU','FRI','SAT'].map((d, i) => (
            <div key={i} className="text-center text-[8px] font-display font-bold py-1" style={{ color: labelColor }}>{d}</div>
          ))}
        </div>

        {/* Calendar grid */}
        <div className="grid grid-cols-7 gap-0.5">
          {cells.map(({ dateStr, inMonth }, idx) => {
            if (!inMonth) {
              return <div key={idx} className="rounded-xl" style={{ height: '56px' }} />
            }

            const dayNum = parseInt(dateStr.split('-')[2])
            const isToday = dateStr === todayStr
            const isDeadline = deadlineDates.has(dateStr)
            const holiday = holidayMap[dateStr]
            const entry = entriesMap[dateStr]
            const schedDay = scheduleMap[dateStr]
            const band = getPeriodBand(dateStr)
            const hasNote = !!(schedDay?.note)

            const bandBg = band === 0
              ? isDark ? 'rgba(255,255,255,0.025)' : 'rgba(15,23,42,0.025)'
              : isDark ? 'rgba(37,99,235,0.06)' : 'rgba(37,99,235,0.04)'

            const cellBg = isToday
              ? isDark ? 'rgba(37,99,235,0.14)' : 'rgba(37,99,235,0.1)'
              : holiday ? 'rgba(239,68,68,0.08)' : bandBg

            const loggedReg = entry && entry.type !== 'CALLOUT' && entry.reason !== 'OFF' ? parseFloat(entry.reg) : 0
            const hasLoggedEntry = !!entry

            return (
              <motion.button
                key={dateStr}
                whileTap={{ scale: 0.86 }}
                onClick={() => setSelectedDate(dateStr)}
                className="relative rounded-xl flex flex-col justify-between overflow-hidden"
                style={{ height: '56px', background: cellBg, padding: '5px 5px 4px' }}
              >
                {isDeadline && (
                  <div className="absolute bottom-0 inset-x-0 h-[2.5px]" style={{ background: '#DC2626' }} />
                )}
                {hasNote && (
                  <div className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full" style={{ background: '#8B5CF6' }} />
                )}

                <div className="flex items-start justify-between">
                  {isToday ? (
                    <div className="w-[22px] h-[22px] rounded-full flex items-center justify-center flex-shrink-0" style={{ background: '#2563EB' }}>
                      <span className="text-[10px] font-display font-bold text-white leading-none">{dayNum}</span>
                    </div>
                  ) : (
                    <span className="text-[12px] font-display font-bold leading-none" style={{ color: textPrimary }}>{dayNum}</span>
                  )}
                  {holiday && <span className="text-[8px] leading-tight flex-shrink-0" style={{ color: '#EF4444' }}>★</span>}
                  {isDeadline && !holiday && (
                    <span className="font-display font-bold leading-none flex-shrink-0"
                      style={{ fontSize: '6px', background: '#DC2626', color: '#FFFFFF', borderRadius: '2px', padding: '1px 2px' }}>
                      DUE
                    </span>
                  )}
                </div>

                <div className="flex items-end gap-0.5 w-full" style={{ minWidth: 0 }}>
                  {schedDay && (
                    <div className="flex items-center min-w-0"
                      style={{
                        background: TYPE_PILL_BG[schedDay.type] ?? '#94A3B8',
                        borderRadius: '4px', padding: '2px 4px', minHeight: '16px',
                        flex: hasLoggedEntry ? '1 1 0' : '1 1 100%',
                        overflow: 'hidden', flexShrink: 1,
                      }}>
                      <span className="font-display font-bold truncate block w-full"
                        style={{ fontSize: '10px', color: '#FFFFFF', lineHeight: 1.2 }}>
                        {TYPE_ABBREV[schedDay.type] ?? schedDay.type}
                      </span>
                    </div>
                  )}
                  {hasLoggedEntry && (
                    <div className="flex items-center flex-shrink-0"
                      style={{
                        background: '#059669', borderRadius: '4px', padding: '2px 4px', minHeight: '16px',
                        flex: schedDay ? '0 0 auto' : '1 1 100%',
                      }}
                      onClick={(e) => { e.stopPropagation(); setEditingEntry(entry!) }}>
                      <span className="font-display font-bold whitespace-nowrap"
                        style={{ fontSize: '10px', color: '#FFFFFF', lineHeight: 1.2 }}>
                        {loggedReg > 0 ? `✓ ${loggedReg}h` : entry!.type === 'CALLOUT' ? '✓ CO' : '✓ OFF'}
                      </span>
                    </div>
                  )}
                </div>
              </motion.button>
            )
          })}
        </div>

        {/* Legend */}
        <div className="mt-3 overflow-x-auto">
          <div className="flex items-center gap-3 pb-0.5" style={{ minWidth: 'max-content', paddingLeft: '2px' }}>
            {([
              { color: '#2563EB', label: 'Scheduled', type: 'sq' },
              { color: '#EC0677', label: 'OT', type: 'sq' },
              { color: '#F59E0B', label: 'Callout', type: 'sq' },
              { color: '#10B981', label: 'Vacation', type: 'sq' },
              { color: '#8B5CF6', label: 'Req Off', type: 'sq' },
              { color: '#94A3B8', label: 'Day Off', type: 'sq' },
              { color: '#EF4444', label: 'Holiday', type: 'star' },
              { color: '#059669', label: 'Logged', type: 'check' },
              { color: '#DC2626', label: 'ECATS Due', type: 'bar' },
              { color: '#8B5CF6', label: 'Has Note', type: 'dot' },
            ] as { color: string; label: string; type: string }[]).map(({ color, label, type }) => (
              <div key={label} className="flex items-center gap-1 flex-shrink-0">
                {type === 'star' ? (
                  <span style={{ color, fontSize: '9px' }}>★</span>
                ) : type === 'check' ? (
                  <svg width="9" height="8" viewBox="0 0 10 8" fill="none">
                    <path d="M1 4l3 3 5-5" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                ) : type === 'bar' ? (
                  <div style={{ width: '12px', height: '2.5px', background: color, borderRadius: '2px' }} />
                ) : type === 'dot' ? (
                  <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: color }} />
                ) : (
                  <div style={{ width: '7px', height: '7px', borderRadius: '2px', background: color }} />
                )}
                <span className="text-[9px] font-body" style={{ color: textSecondary }}>{label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <AnimatePresence>
        {selectedDate && (
          <DayDetailSheet
            key={selectedDate}
            isOpen={true}
            date={selectedDate}
            entry={entriesMap[selectedDate]}
            scheduleDay={scheduleMap[selectedDate]}
            holidayName={holidayMap[selectedDate]}
            onClose={() => setSelectedDate(null)}
            onNavigateToTrack={onNavigateToTrack}
          />
        )}
      </AnimatePresence>

      <SchedulePhotoParser isOpen={photoParserOpen} onClose={() => setPhotoParserOpen(false)} />
      {editingEntry && <EditEntrySheet entry={editingEntry} onClose={() => setEditingEntry(null)} />}
    </div>
  )
}
