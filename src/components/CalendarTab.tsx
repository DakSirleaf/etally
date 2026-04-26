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

const TYPE_COLORS: Record<string, string> = {
  scheduled: '#0155C1',
  ot: '#EC0677',
  callout: '#D97706',
  vacation: '#7C3AED',
  aspirational: '#7C3AED',
  off: '#475569',
  holiday: '#F59E0B',
}

const TYPE_ABBREV: Record<string, string> = {
  scheduled: 'SCH',
  ot: 'OT',
  callout: 'CALLOUT',
  vacation: 'VAC',
  aspirational: 'REQ OFF',
  off: 'OFF',
  holiday: 'HOL',
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
  const entries = useStore((s: any) => s.entries) as LogEntry[]
  const schedule = useStore((s: any) => s.schedule) as ScheduleDay[]

  const today = new Date()
  const todayStr = toDateStr(today)

  const [viewYear, setViewYear] = useState(today.getFullYear())
  const [viewMonth, setViewMonth] = useState(today.getMonth())
  const [selectedDate, setSelectedDate] = useState<string | null>(null)
  const [photoParserOpen, setPhotoParserOpen] = useState(false)
  const [editingEntry, setEditingEntry] = useState<LogEntry | null>(null)

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

  const isViewingThisMonth =
    viewYear === today.getFullYear() && viewMonth === today.getMonth()
  const monthName = new Date(viewYear, viewMonth, 1).toLocaleDateString('en-US', { month: 'long' })

  return (
    <div className="flex flex-col pb-6">
      <div className="px-4 pt-3">

        {/* Header */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <motion.button
              whileTap={{ scale: 0.88 }}
              onClick={prevMonth}
              className="w-8 h-8 rounded-xl flex items-center justify-center"
              style={{ background: isDark ? 'rgba(255,255,255,0.06)' : '#F1F5F9' }}
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none">
                <path d="M15 18l-6-6 6-6" stroke={textSecondary} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </motion.button>
            <span
              className="text-[15px] font-display font-bold min-w-[120px] text-center"
              style={{ color: textPrimary }}
            >
              {monthName} {viewYear}
            </span>
            <motion.button
              whileTap={{ scale: 0.88 }}
              onClick={nextMonth}
              className="w-8 h-8 rounded-xl flex items-center justify-center"
              style={{ background: isDark ? 'rgba(255,255,255,0.06)' : '#F1F5F9' }}
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none">
                <path d="M9 18l6-6-6-6" stroke={textSecondary} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </motion.button>
          </div>

          <div className="flex items-center gap-1.5">
            {!isViewingThisMonth && (
              <motion.button
                whileTap={{ scale: 0.92 }}
                onClick={goToToday}
                className="px-3 h-8 rounded-xl font-display font-bold text-[9px] tracking-widest"
                style={{ background: 'rgba(37,99,235,0.12)', color: '#3B82F6' }}
              >
                TODAY
              </motion.button>
            )}
            <motion.button
              whileTap={{ scale: 0.92 }}
              onClick={() => setPhotoParserOpen(true)}
              className="flex items-center gap-1 px-3 h-8 rounded-xl"
              style={{ background: 'rgba(124,58,237,0.1)' }}
            >
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none">
                <path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z" stroke="#7C3AED" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                <circle cx="12" cy="13" r="4" stroke="#7C3AED" strokeWidth="1.8" />
              </svg>
              <span className="text-[9px] font-display font-bold tracking-widest" style={{ color: '#7C3AED' }}>
                IMPORT
              </span>
            </motion.button>
          </div>
        </div>

        {/* Day headers */}
        <div className="grid grid-cols-7 mb-1">
          {['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'].map((d, i) => (
            <div key={i} className="text-center text-[8px] font-display font-bold py-1" style={{ color: labelColor }}>
              {d}
            </div>
          ))}
        </div>

        {/* Calendar grid — 52px cells */}
        <div className="grid grid-cols-7 gap-0.5">
          {cells.map(({ dateStr, inMonth }, idx) => {
            if (!inMonth) {
              return (
                <div
                  key={idx}
                  className="rounded-xl"
                  style={{ height: '52px', background: isDark ? 'rgba(255,255,255,0.01)' : 'transparent' }}
                />
              )
            }

            const dayNum = parseInt(dateStr.split('-')[2])
            const isToday = dateStr === todayStr
            const isDeadline = deadlineDates.has(dateStr)
            const holiday = holidayMap[dateStr]
            const entry = entriesMap[dateStr]
            const schedDay = scheduleMap[dateStr]
            const band = getPeriodBand(dateStr)

            const bandBg = band === 0
              ? isDark ? 'rgba(255,255,255,0.025)' : 'rgba(15,23,42,0.025)'
              : isDark ? 'rgba(37,99,235,0.06)' : 'rgba(37,99,235,0.04)'

            const cellBg = isToday
              ? isDark ? 'rgba(37,99,235,0.14)' : 'rgba(37,99,235,0.1)'
              : holiday
              ? isDark ? 'rgba(245,158,11,0.07)' : 'rgba(245,158,11,0.06)'
              : bandBg

            const loggedReg =
              entry && entry.type !== 'CALLOUT' && entry.reason !== 'OFF'
                ? parseFloat(entry.reg)
                : 0
            const hasLoggedEntry = !!entry

            return (
              <motion.button
                key={dateStr}
                whileTap={{ scale: 0.86 }}
                onClick={() => setSelectedDate(dateStr)}
                className="relative rounded-xl flex flex-col justify-between overflow-hidden"
                style={{ height: '52px', background: cellBg, padding: '5px 5px 4px' }}
              >
                {/* ECATS deadline: red bottom strip */}
                {isDeadline && (
                  <div
                    className="absolute bottom-0 inset-x-0 h-[2.5px]"
                    style={{ background: 'rgba(239,68,68,0.75)' }}
                  />
                )}

                {/* Top row: date number */}
                <div className="flex items-start justify-between">
                  {isToday ? (
                    <div
                      className="w-[22px] h-[22px] rounded-full flex items-center justify-center flex-shrink-0"
                      style={{ background: '#2563EB' }}
                    >
                      <span className="text-[10px] font-display font-bold text-white leading-none">
                        {dayNum}
                      </span>
                    </div>
                  ) : (
                    <span
                      className="text-[11px] font-display font-bold leading-none"
                      style={{ color: textPrimary }}
                    >
                      {dayNum}
                    </span>
                  )}
                  {holiday && (
                    <span className="text-[7px] leading-tight flex-shrink-0" style={{ color: '#F59E0B' }}>
                      ★
                    </span>
                  )}
                  {isDeadline && !holiday && (
                    <span className="text-[6px] font-display font-bold leading-tight flex-shrink-0" style={{ color: '#EF4444' }}>
                      DUE
                    </span>
                  )}
                </div>

                {/* Bottom row: type pill + logged indicator */}
                <div className="flex items-end gap-0.5 w-full">
                  {schedDay && schedDay.type !== 'off' && (
                    <div
                      className="rounded-[3px] flex items-center"
                      style={{
                        background: `${TYPE_COLORS[schedDay.type]}25`,
                        padding: '2px 3px',
                        maxWidth: hasLoggedEntry ? '58%' : '94%',
                        overflow: 'hidden',
                      }}
                    >
                      <span
                        className="font-display font-bold truncate"
                        style={{
                          fontSize: '6.5px',
                          color: TYPE_COLORS[schedDay.type],
                          letterSpacing: '0.2px',
                        }}
                      >
                        {TYPE_ABBREV[schedDay.type]}
                      </span>
                    </div>
                  )}
                  {hasLoggedEntry && (
                    <div
                      className="ml-auto flex items-center gap-0.5 flex-shrink-0 rounded-sm px-0.5"
                      style={{ background: 'rgba(16,185,129,0.15)', padding: '1px 3px' }}
                      onClick={(e) => {
                        e.stopPropagation()
                        setEditingEntry(entry!)
                      }}
                    >
                      {loggedReg > 0 && (
                        <span
                          className="font-display font-bold"
                          style={{ fontSize: '6.5px', color: '#10B981' }}
                        >
                          {loggedReg}h
                        </span>
                      )}
                      <svg width="5" height="5" viewBox="0 0 10 8" fill="none" style={{ flexShrink: 0 }}>
                        <path d="M1 4l3 3 5-5" stroke="#10B981" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </div>
                  )}
                </div>
              </motion.button>
            )
          })}
        </div>

        {/* Legend — horizontal scroll */}
        <div className="mt-3 -mx-0 overflow-x-auto">
          <div className="flex items-center gap-3 pb-0.5" style={{ minWidth: 'max-content', paddingLeft: '2px' }}>
            {([
              { color: '#0155C1', label: 'Scheduled', type: 'square' },
              { color: '#EC0677', label: 'OT', type: 'square' },
              { color: '#D97706', label: 'Callout', type: 'square' },
              { color: '#7C3AED', label: 'Vacation', type: 'square' },
              { color: '#7C3AED', label: 'Req Off', type: 'dashed' },
              { color: '#475569', label: 'Day Off', type: 'square' },
              { color: '#F59E0B', label: 'Holiday', type: 'star' },
              { color: '#10B981', label: 'Logged', type: 'check' },
              { color: '#EF4444', label: 'ECATS Due', type: 'bar' },
            ] as { color: string; label: string; type: string }[]).map(({ color, label, type }) => (
              <div key={label} className="flex items-center gap-1 flex-shrink-0">
                {type === 'star' ? (
                  <span style={{ color, fontSize: '9px', lineHeight: 1 }}>★</span>
                ) : type === 'check' ? (
                  <svg width="9" height="8" viewBox="0 0 10 8" fill="none">
                    <path d="M1 4l3 3 5-5" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                ) : type === 'bar' ? (
                  <div style={{ width: '12px', height: '2.5px', background: color, borderRadius: '2px' }} />
                ) : type === 'dashed' ? (
                  <div style={{ width: '7px', height: '7px', borderRadius: '50%', border: `1.5px dashed ${color}` }} />
                ) : (
                  <div style={{ width: '7px', height: '7px', borderRadius: '2px', background: color }} />
                )}
                <span className="text-[9px] font-body" style={{ color: textSecondary }}>{label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Day detail sheet */}
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

      <SchedulePhotoParser
        isOpen={photoParserOpen}
        onClose={() => setPhotoParserOpen(false)}
      />

      {editingEntry && (
        <EditEntrySheet entry={editingEntry} onClose={() => setEditingEntry(null)} />
      )}
    </div>
  )
}
