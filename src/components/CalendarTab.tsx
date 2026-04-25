import { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useTheme } from '../lib/useTheme'
import { useStore } from '../store/useStore'
import { getPayPeriodForDate, periodId } from '../lib/payPeriod'
import { getHolidaysForYear, getEcatsDeadline } from '../lib/ecatsAlerts'
import type { LogEntry, ScheduleDay } from '../types'
import DayDetailSheet from './DayDetailSheet'
import SchedulePhotoParser from './SchedulePhotoParser'

const TYPE_COLORS: Record<string, string> = {
  scheduled: '#0155C1',
  ot: '#EC0677',
  callout: '#D97706',
  vacation: '#7C3AED',
  aspirational: '#7C3AED',
  off: '#475569',
}

// Anchor Saturday (start of the March 7-20 period) for band alternation
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
  const { isDark, textPrimary, textSecondary, labelColor, surface, surfaceBorder } = useTheme()
  const entries = useStore((s: any) => s.entries) as LogEntry[]
  const schedule = useStore((s: any) => s.schedule) as ScheduleDay[]

  const today = new Date()
  const todayStr = toDateStr(today)

  const [viewYear, setViewYear] = useState(today.getFullYear())
  const [viewMonth, setViewMonth] = useState(today.getMonth())
  const [selectedDate, setSelectedDate] = useState<string | null>(null)
  const [photoParserOpen, setPhotoParserOpen] = useState(false)

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
      return {
        dateStr: toDateStr(d),
        inMonth: d.getMonth() === viewMonth,
      }
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

  const monthName = new Date(viewYear, viewMonth, 1).toLocaleDateString('en-US', { month: 'long' })

  return (
    <div className="flex flex-col pb-6">
      <div className="px-4 pt-3 flex flex-col gap-3">

        {/* Month nav header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <motion.button
              whileTap={{ scale: 0.88 }}
              onClick={prevMonth}
              className="w-8 h-8 rounded-xl flex items-center justify-center"
              style={{ background: surface, border: surfaceBorder }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                <path d="M15 18l-6-6 6-6" stroke={textSecondary} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </motion.button>
            <span className="text-base font-display font-bold min-w-[130px] text-center" style={{ color: textPrimary }}>
              {monthName} {viewYear}
            </span>
            <motion.button
              whileTap={{ scale: 0.88 }}
              onClick={nextMonth}
              className="w-8 h-8 rounded-xl flex items-center justify-center"
              style={{ background: surface, border: surfaceBorder }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                <path d="M9 18l6-6-6-6" stroke={textSecondary} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </motion.button>
          </div>

          <motion.button
            whileTap={{ scale: 0.92 }}
            onClick={() => setPhotoParserOpen(true)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl"
            style={{ background: surface, border: surfaceBorder }}
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none">
              <path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z" stroke="#7C3AED" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
              <circle cx="12" cy="13" r="4" stroke="#7C3AED" strokeWidth="1.8" />
            </svg>
            <span className="text-[9px] font-display font-bold tracking-widest" style={{ color: '#7C3AED' }}>IMPORT</span>
          </motion.button>
        </div>

        {/* Weekday headers */}
        <div className="grid grid-cols-7">
          {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => (
            <div key={i} className="text-center text-[9px] font-display font-bold py-0.5" style={{ color: labelColor }}>
              {d}
            </div>
          ))}
        </div>

        {/* Calendar grid */}
        <div className="grid grid-cols-7 gap-0.5">
          {cells.map(({ dateStr, inMonth }, idx) => {
            if (!inMonth) return <div key={idx} className="aspect-square" />

            const dayNum = parseInt(dateStr.split('-')[2])
            const isToday = dateStr === todayStr
            const isDeadline = deadlineDates.has(dateStr)
            const holiday = holidayMap[dateStr]
            const entry = entriesMap[dateStr]
            const schedDay = scheduleMap[dateStr]
            const band = getPeriodBand(dateStr)

            const bandBg = band === 0
              ? isDark ? 'rgba(255,255,255,0.03)' : 'rgba(15,23,42,0.03)'
              : isDark ? 'rgba(255,255,255,0.065)' : 'rgba(15,23,42,0.06)'

            const typeColor = schedDay ? TYPE_COLORS[schedDay.type] : undefined

            const loggedHrs =
              entry && entry.type !== 'CALLOUT' && entry.reason !== 'OFF'
                ? parseFloat(entry.reg)
                : 0

            return (
              <motion.button
                key={dateStr}
                whileTap={{ scale: 0.88 }}
                onClick={() => setSelectedDate(dateStr)}
                className="aspect-square rounded-xl flex flex-col items-center justify-center gap-px relative overflow-hidden"
                style={{ background: bandBg }}
              >
                {/* Today ring */}
                {isToday && (
                  <div
                    className="absolute inset-0.5 rounded-[9px] border-2 pointer-events-none"
                    style={{ borderColor: 'rgba(255,255,255,0.55)' }}
                  />
                )}
                {/* ECATS deadline ring */}
                {isDeadline && (
                  <div
                    className="absolute inset-0 rounded-xl border-2 border-red-500 pointer-events-none"
                    style={{ opacity: isToday ? 0.7 : 1 }}
                  />
                )}

                {/* Date number */}
                <span
                  className="text-[11px] font-display font-bold z-10 leading-none"
                  style={{ color: isToday ? 'white' : textPrimary }}
                >
                  {dayNum}
                </span>

                {/* Indicator row */}
                <div className="flex items-center gap-px z-10">
                  {schedDay && (
                    <div
                      className="w-1 h-1 rounded-full"
                      style={{
                        background: schedDay.type === 'aspirational' ? 'transparent' : typeColor,
                        outline: schedDay.type === 'aspirational' ? `1.5px dashed ${typeColor}` : 'none',
                        outlineOffset: '1px',
                      }}
                    />
                  )}
                  {holiday && (
                    <span className="text-[6px] leading-none" style={{ color: '#F59E0B' }}>★</span>
                  )}
                  {entry && (
                    <svg width="5" height="5" viewBox="0 0 10 8" fill="none">
                      <path d="M1 4l3 3 5-5" stroke="#10B981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  )}
                </div>

                {/* Logged hours */}
                {loggedHrs > 0 && (
                  <span className="text-[6px] font-display font-bold z-10 leading-none" style={{ color: '#10B981' }}>
                    {loggedHrs}h
                  </span>
                )}
              </motion.button>
            )
          })}
        </div>

        {/* Legend */}
        <div className="flex flex-wrap gap-x-3 gap-y-1.5 px-0.5 pt-1">
          {[
            { color: '#0155C1', label: 'Scheduled' },
            { color: '#EC0677', label: 'OT Pickup' },
            { color: '#D97706', label: 'Callout' },
            { color: '#7C3AED', label: 'Vacation' },
            { color: '#475569', label: 'Day Off' },
          ].map(({ color, label }) => (
            <div key={label} className="flex items-center gap-1">
              <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: color }} />
              <span className="text-[9px] font-body" style={{ color: textSecondary }}>{label}</span>
            </div>
          ))}
          <div className="flex items-center gap-1">
            <span style={{ color: '#F59E0B', fontSize: '9px' }}>★</span>
            <span className="text-[9px] font-body" style={{ color: textSecondary }}>Holiday</span>
          </div>
          <div className="flex items-center gap-1">
            <svg width="8" height="7" viewBox="0 0 10 8" fill="none">
              <path d="M1 4l3 3 5-5" stroke="#10B981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <span className="text-[9px] font-body" style={{ color: textSecondary }}>Logged</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3.5 h-3.5 rounded flex items-center justify-center" style={{ border: '1.5px solid #EF4444' }}>
              <span className="text-[6px] font-display font-bold" style={{ color: textPrimary }}>D</span>
            </div>
            <span className="text-[9px] font-body" style={{ color: textSecondary }}>ECATS Deadline</span>
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

      {/* Schedule photo parser */}
      <SchedulePhotoParser
        isOpen={photoParserOpen}
        onClose={() => setPhotoParserOpen(false)}
      />
    </div>
  )
}
