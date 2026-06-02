import { useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useTheme } from '../lib/useTheme'
import { useStore } from '../store/useStore'
import { getPayPeriodForDate } from '../lib/payPeriod'
import { getEcatsDeadline } from '../lib/ecatsAlerts'
import { to12hr } from '../lib/timeFormat'
import type { LogEntry, ScheduleDay, DayType } from '../types'
import EditEntrySheet from './EditEntrySheet'

const TYPE_COLORS: Record<string, string> = {
  scheduled:    '#2563EB',
  ot:           '#EC0677',
  callout:      '#F59E0B',
  vacation:     '#10B981',
  aspirational: '#8B5CF6',
  off:          '#94A3B8',
  holiday:      '#EF4444',
}

const NOTE_LIMIT = 50

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
  { type: 'scheduled',    label: 'REG' },
  { type: 'ot',           label: 'OT' },
  { type: 'callout',      label: 'CALLOUT' },
  { type: 'vacation',     label: 'VACATION' },
  { type: 'aspirational', label: 'REQ OFF' },
  { type: 'off',          label: 'DAY OFF' },
]

export default function DayDetailSheet({
  isOpen, date, entry, scheduleDay, holidayName, onClose, onNavigateToTrack,
}: DayDetailSheetProps) {
  const { isDark, surface, surfaceBorder, textPrimary, textSecondary, labelColor } = useTheme()
  const setScheduleDay = useStore((s: any) => s.setScheduleDay)
  const setPendingTrackDate = useStore((s: any) => s.setPendingTrackDate)

  const [editOpen, setEditOpen] = useState(false)
  const [note, setNote] = useState(scheduleDay?.note ?? '')
  const [startTime, setStartTime] = useState(scheduleDay?.startTime ?? '')
  const [endTime, setEndTime] = useState(scheduleDay?.endTime ?? '')
  const [isListening, setIsListening] = useState(false)
  const recognitionRef = useRef<any>(null)

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
      date, type, note,
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

  const handleNoteChange = (val: string) => {
    if (val.length <= NOTE_LIMIT) setNote(val)
  }

  const startVoice = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    if (!SpeechRecognition) return
    const recognition = new SpeechRecognition()
    recognitionRef.current = recognition
    recognition.continuous = false
    recognition.interimResults = false
    recognition.onstart = () => setIsListening(true)
    recognition.onend = () => setIsListening(false)
    recognition.onerror = () => setIsListening(false)
    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript
      setNote(prev => {
        const updated = (prev + (prev ? ' ' : '') + transcript).slice(0, NOTE_LIMIT)
        const base: ScheduleDay = scheduleDay ?? { date, type: 'off' as DayType }
        setScheduleDay({ ...base, note: updated, startTime: startTime || undefined, endTime: endTime || undefined })
        return updated
      })
    }
    recognition.start()
  }

  const stopVoice = () => {
    recognitionRef.current?.stop()
    setIsListening(false)
  }

  const handleLogThisShift = () => {
    setPendingTrackDate(date)
    onClose()
    onNavigateToTrack?.()
  }

  const activeType = scheduleDay?.type
  const showTimeSection = activeType && activeType !== 'off' && activeType !== 'holiday'
  const charsLeft = NOTE_LIMIT - note.length

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 z-40"
            style={{ background: 'rgba(5,9,18,0.78)', backdropFilter: 'blur(8px)' }}
            onClick={onClose}
          />

          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', stiffness: 300, damping: 32 }}
            className="fixed bottom-0 left-0 right-0 z-50 rounded-t-3xl overflow-hidden"
            style={{
              background: isDark ? '#080D1E' : '#ffffff',
              paddingBottom: 'max(2rem, env(safe-area-inset-bottom, 2rem))',
              maxHeight: '90dvh',
              borderTop: `3px solid ${activeType ? TYPE_COLORS[activeType] : '#E2E8F0'}`,
            }}
          >
            {/* Holiday banner */}
            {holidayName && (
              <div className="w-full px-5 py-3 flex items-center gap-2.5"
                style={{ background: isDark ? 'rgba(239,68,68,0.1)' : '#FEF2F2', borderBottom: '1px solid #FECACA' }}>
                <span style={{ fontSize: '16px' }}>🎉</span>
                <div>
                  <span className="font-display font-bold text-sm" style={{ color: '#EF4444' }}>{holidayName}</span>
                  <span className="text-[10px] font-body ml-2" style={{ color: '#DC2626' }}>PAID HOLIDAY</span>
                </div>
              </div>
            )}

            <div className="flex justify-center pt-3 pb-1">
              <div className="w-10 h-1 rounded-full" style={{ background: isDark ? '#1E293B' : '#E2E8F0' }} />
            </div>

            <div className="overflow-y-auto px-4" style={{ maxHeight: 'calc(90dvh - 3rem)' }}>

              {/* Date header */}
              <div className="mt-2 mb-5 flex items-start justify-between gap-3">
                <div>
                  <h2 className="font-display font-bold text-2xl leading-tight" style={{ color: textPrimary }}>{dayOfWeek}</h2>
                  <p className="font-body text-base mt-0.5" style={{ color: textSecondary }}>{dateDisplay}</p>
                </div>
                {activeType && (
                  <div className="px-4 py-2 rounded-2xl flex-shrink-0 mt-1" style={{ background: TYPE_COLORS[activeType] }}>
                    <span className="text-[11px] font-display font-bold tracking-widest text-white">
                      {QUICK_TYPES.find((q) => q.type === activeType)?.label ?? activeType.toUpperCase()}
                    </span>
                  </div>
                )}
              </div>

              {/* Supplemental warning */}
              {isSupplementalDay && (
                <div className="rounded-2xl px-4 py-3 mb-3"
                  style={{ background: isDark ? 'rgba(245,158,11,0.12)' : '#FFFBEB', border: '1px solid #FDE68A' }}>
                  <div className="text-[9px] font-display font-bold tracking-widest mb-1" style={{ color: '#D97706' }}>SUPPLEMENTAL PAY REQUIRED</div>
                  <p className="text-[11px] font-body leading-relaxed" style={{ color: textSecondary }}>
                    This pre-approved OT falls after the ECATS Tuesday deadline. File a supplemental pay request.
                  </p>
                </div>
              )}

              {/* Logged entry */}
              {entry && (
                <div className="rounded-2xl px-4 py-3 mb-3" style={{ background: surface, border: surfaceBorder }}>
                  <div className="flex items-center justify-between mb-2">
                    <div className="text-[9px] font-display font-bold tracking-widest" style={{ color: labelColor }}>LOGGED ENTRY</div>
                    <motion.button whileTap={{ scale: 0.93 }} onClick={() => setEditOpen(true)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl"
                      style={{ background: 'rgba(37,99,235,0.12)', border: '1px solid rgba(37,99,235,0.2)' }}>
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
                        <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" stroke="#3B82F6" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                        <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" stroke="#3B82F6" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                      <span className="text-[9px] font-display font-bold tracking-widest" style={{ color: '#3B82F6' }}>EDIT</span>
                    </motion.button>
                  </div>
                  {entry.reason === 'OFF' ? (
                    <span className="text-sm font-display font-bold" style={{ color: textSecondary }}>Day Off</span>
                  ) : entry.type === 'CALLOUT' ? (
                    <div>
                      <span className="text-sm font-display font-bold" style={{ color: '#F59E0B' }}>Callout</span>
                      <p className="text-[11px] font-body mt-0.5" style={{ color: textSecondary }}>{entry.calloutPayType}</p>
                    </div>
                  ) : (
                    <div className="flex items-end gap-4">
                      <div>
                        <div className="text-[8px] font-display font-bold tracking-widest mb-0.5" style={{ color: labelColor }}>REG</div>
                        <div className="text-2xl font-display font-bold leading-none" style={{ color: '#2563EB' }}>{entry.reg}</div>
                      </div>
                      {parseFloat(entry.ot) > 0 && (
                        <div>
                          <div className="text-[8px] font-display font-bold tracking-widest mb-0.5" style={{ color: labelColor }}>OT</div>
                          <div className="text-2xl font-display font-bold leading-none" style={{ color: '#EC0677' }}>{entry.ot}</div>
                        </div>
                      )}
                      <div className="ml-auto text-right">
                        <div className="text-[8px] font-display font-bold tracking-widest mb-0.5" style={{ color: labelColor }}>TIME</div>
                        <div className="text-sm font-body" style={{ color: textSecondary }}>{to12hr(entry.startTime)} – {to12hr(entry.endTime)}</div>
                        <div className="text-[10px] font-body mt-0.5" style={{ color: labelColor }}>{entry.reason}</div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Mark as */}
              <div className="mb-4">
                <div className="text-[9px] font-display font-bold tracking-widest mb-2" style={{ color: labelColor }}>MARK AS</div>
                <div className="grid grid-cols-3 gap-2">
                  {QUICK_TYPES.map(({ type, label }) => {
                    const isActive = activeType === type
                    const color = TYPE_COLORS[type]
                    return (
                      <motion.button key={type} whileTap={{ scale: 0.92 }} onClick={() => handleSetType(type)}
                        className="py-3 rounded-2xl font-display font-bold text-[10px] tracking-widest"
                        style={{
                          background: isActive ? color : isDark ? 'rgba(255,255,255,0.04)' : '#F8FAFC',
                          border: isActive ? `1.5px solid ${color}` : isDark ? '1px solid rgba(255,255,255,0.07)' : '1px solid #E2E8F0',
                          color: isActive ? '#FFFFFF' : isDark ? '#475569' : '#94A3B8',
                        }}>
                        {label}
                      </motion.button>
                    )
                  })}
                </div>
              </div>

              {/* Shift times */}
              {showTimeSection && (
                <div className="mb-4">
                  <div className="text-[9px] font-display font-bold tracking-widest mb-2" style={{ color: labelColor }}>SHIFT TIMES</div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <div className="text-[8px] font-display font-bold tracking-widest mb-1" style={{ color: labelColor }}>START</div>
                      <input type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} onBlur={handleSaveTimes}
                        className="w-full rounded-xl px-3 py-2.5 text-sm font-body focus:outline-none"
                        style={{ background: isDark ? 'rgba(255,255,255,0.06)' : '#F8FAFC', border: isDark ? '1px solid rgba(255,255,255,0.1)' : '1px solid #E2E8F0', color: textPrimary, colorScheme: isDark ? 'dark' : 'light' }} />
                    </div>
                    <div>
                      <div className="text-[8px] font-display font-bold tracking-widest mb-1" style={{ color: labelColor }}>END</div>
                      <input type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} onBlur={handleSaveTimes}
                        className="w-full rounded-xl px-3 py-2.5 text-sm font-body focus:outline-none"
                        style={{ background: isDark ? 'rgba(255,255,255,0.06)' : '#F8FAFC', border: isDark ? '1px solid rgba(255,255,255,0.1)' : '1px solid #E2E8F0', color: textPrimary, colorScheme: isDark ? 'dark' : 'light' }} />
                    </div>
                  </div>
                </div>
              )}

              {/* Notes with voice */}
              <div className="mb-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="text-[9px] font-display font-bold tracking-widest" style={{ color: labelColor }}>NOTES & REMINDERS</div>
                  <span className="text-[9px] font-body" style={{ color: charsLeft <= 10 ? '#EF4444' : labelColor }}>{charsLeft} left</span>
                </div>
                <div className="relative">
                  <textarea
                    value={note}
                    onChange={(e) => handleNoteChange(e.target.value)}
                    onBlur={handleSaveNote}
                    placeholder="Add a note, reminder, birthday, event… (50 chars)"
                    rows={3}
                    maxLength={NOTE_LIMIT}
                    className="w-full rounded-2xl px-4 py-3 pr-12 text-sm font-body resize-none focus:outline-none"
                    style={{
                      background: isDark ? 'rgba(255,255,255,0.05)' : '#F8FAFC',
                      border: isDark ? '1px solid rgba(255,255,255,0.09)' : '1px solid #E2E8F0',
                      color: textPrimary,
                      fontSize: '14px',
                      lineHeight: '1.5',
                    }}
                  />
                  <motion.button
                    whileTap={{ scale: 0.88 }}
                    onClick={isListening ? stopVoice : startVoice}
                    className="absolute right-3 bottom-3 w-8 h-8 rounded-xl flex items-center justify-center"
                    style={{
                      background: isListening ? 'rgba(239,68,68,0.15)' : isDark ? 'rgba(255,255,255,0.08)' : 'rgba(15,17,38,0.06)',
                      border: isListening ? '1px solid rgba(239,68,68,0.3)' : 'none',
                    }}
                  >
                    {isListening ? (
                      <motion.div animate={{ scale: [1, 1.2, 1] }} transition={{ duration: 0.8, repeat: Infinity }}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                          <circle cx="12" cy="12" r="5" fill="#EF4444" />
                          <circle cx="12" cy="12" r="9" stroke="#EF4444" strokeWidth="1.5" strokeOpacity="0.4" />
                        </svg>
                      </motion.div>
                    ) : (
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                        <rect x="9" y="3" width="6" height="11" rx="3" stroke={isDark ? '#94A3B8' : '#64748B'} strokeWidth="1.8" />
                        <path d="M5 11a7 7 0 0014 0" stroke={isDark ? '#94A3B8' : '#64748B'} strokeWidth="1.8" strokeLinecap="round" />
                        <path d="M12 18v3M9 21h6" stroke={isDark ? '#94A3B8' : '#64748B'} strokeWidth="1.8" strokeLinecap="round" />
                      </svg>
                    )}
                  </motion.button>
                </div>
                {isListening && (
                  <p className="text-[10px] font-body mt-1.5" style={{ color: '#EF4444' }}>Listening… tap mic to stop</p>
                )}
              </div>

              {/* Log shift */}
              <motion.button whileTap={{ scale: 0.97 }} onClick={handleLogThisShift}
                className="w-full py-4 rounded-2xl font-display font-bold text-sm tracking-widest text-white mb-2"
                style={{ background: 'linear-gradient(135deg, #1D4ED8, #3B82F6)' }}>
                LOG THIS SHIFT →
              </motion.button>

              <motion.button whileTap={{ scale: 0.97 }} onClick={onClose}
                className="w-full py-3.5 rounded-2xl font-display font-bold text-xs tracking-widest mb-1"
                style={{ background: isDark ? 'rgba(255,255,255,0.06)' : '#F1F5F9', color: textSecondary }}>
                CLOSE
              </motion.button>
            </div>
          </motion.div>
        </>
      )}

      {editOpen && entry && <EditEntrySheet entry={entry} onClose={() => setEditOpen(false)} />}
    </AnimatePresence>
  )
}
