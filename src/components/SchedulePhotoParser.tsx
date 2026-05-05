import { useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useTheme } from '../lib/useTheme'
import { useStore } from '../store/useStore'
import type { ScheduleDay, DayType } from '../types'

interface ParsedDay {
  date: string
  type: DayType
  startTime?: string
  endTime?: string
  note?: string
}

const SYSTEM_PROMPT =
  'You are a schedule parser. The image is a photo of a printed monthly hospital shift schedule for a single employee. The schedule shows a calendar grid with days of the week as column headers (Sunday through Saturday) and dates listed under each day with a shift code below each date. Extract every date that has a code. Code meanings: "N" means a night shift that STARTS the previous calendar day at 22:45 and ENDS on the listed date at 07:15, type is "scheduled". "VACD" means approved vacation day, type is "vacation", no times needed. Return ONLY a valid JSON array with no extra text: [{"date": "YYYY-MM-DD", "type": "scheduled"|"vacation", "startTime": "22:45", "endTime": "07:15"}]. For N shifts, set date to the listed date. Use year 2026.'  

const SUPPORTED_TYPES: Record<string, string> = {
  'image/jpeg': 'image/jpeg',
  'image/jpg': 'image/jpeg',
  'image/png': 'image/png',
  'image/gif': 'image/gif',
  'image/webp': 'image/webp',
}

const TYPE_COLORS: Record<string, string> = {
  scheduled: '#0155C1',
  ot: '#EC0677',
  callout: '#D97706',
  vacation: '#7C3AED',
  aspirational: '#7C3AED',
  off: '#475569',
  holiday: '#F59E0B',
}

const TYPE_OPTIONS: { value: DayType; label: string }[] = [
  { value: 'scheduled', label: 'Scheduled' },
  { value: 'ot', label: 'OT' },
  { value: 'vacation', label: 'Vacation' },
  { value: 'off', label: 'Day Off' },
  { value: 'callout', label: 'Callout' },
]

interface SchedulePhotoParserProps {
  isOpen: boolean
  onClose: () => void
}

export default function SchedulePhotoParser({ isOpen, onClose }: SchedulePhotoParserProps) {
  const { isDark, textPrimary, textSecondary, labelColor } = useTheme()
  const setScheduleDay = useStore((s: any) => s.setScheduleDay)

  const fileInputRef = useRef<HTMLInputElement>(null)
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [isParsing, setIsParsing] = useState(false)
  const [parsedDays, setParsedDays] = useState<ParsedDay[] | null>(null)
  const [editedDays, setEditedDays] = useState<ParsedDay[] | null>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const reset = () => {
    setFile(null)
    setPreview(null)
    setParsedDays(null)
    setEditedDays(null)
    setIsEditing(false)
    setError(null)
    setIsParsing(false)
  }

  const handleClose = () => {
    reset()
    onClose()
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]
    if (!f) return
    setFile(f)
    setParsedDays(null)
    setEditedDays(null)
    setIsEditing(false)
    setError(null)
    setPreview(URL.createObjectURL(f))
  }

  const handleParse = async () => {
    if (!file) return
    const mediaType = SUPPORTED_TYPES[file.type]
    if (!mediaType) {
      setError('Unsupported format. Please use JPEG, PNG, GIF, or WebP.')
      return
    }

    setIsParsing(true)
    setError(null)
    setParsedDays(null)
    setEditedDays(null)

    try {
      const base64: string = await new Promise((resolve, reject) => {
        const reader = new FileReader()
        reader.onload = () => resolve((reader.result as string).split(',')[1])
        reader.onerror = reject
        reader.readAsDataURL(file)
      })

      const apiKey = (import.meta.env as Record<string, string | undefined>)['VITE_ANTHROPIC_API_KEY']

      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey ?? '',
          'anthropic-version': '2023-06-01',
          'anthropic-dangerous-direct-browser-access': 'true',
        },
        body: JSON.stringify({
          model: 'claude-sonnet-4-6',
          max_tokens: 1000,
          system: SYSTEM_PROMPT,
          messages: [{
            role: 'user',
            content: [
              { type: 'image', source: { type: 'base64', media_type: mediaType, data: base64 } },
              { type: 'text', text: 'Parse the schedule from this image.' },
            ],
          }],
        }),
      })

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}))
        throw new Error((errData as any)?.error?.message ?? `API error ${response.status}`)
      }

      const data = await response.json()
      const text: string = data.content?.[0]?.text ?? ''
      const match = text.match(/\[[\s\S]*\]/)
      if (!match) throw new Error('No schedule data found')

      const parsed = JSON.parse(match[0]) as ParsedDay[]
      if (!Array.isArray(parsed) || parsed.length === 0) throw new Error('Empty schedule')

      const validTypes = new Set<string>(['scheduled', 'ot', 'vacation', 'off', 'callout', 'aspirational', 'holiday'])
      const sanitised: ParsedDay[] = parsed
        .filter((d) => typeof d.date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(d.date))
        .map((d) => ({
          date: d.date,
          type: (validTypes.has(d.type) ? d.type : 'scheduled') as DayType,
          startTime: d.startTime,
          endTime: d.endTime,
          note: d.note,
        }))

      if (sanitised.length === 0) throw new Error('Could not extract valid dates')
      setParsedDays(sanitised)
      setEditedDays(sanitised.map((d) => ({ ...d })))
    } catch (err) {
  setError('Could not read schedule — try a clearer photo or add days manually.')
    console.error('Parse error:', err) 
    } finally {
      setIsParsing(false)
    }
  }

  const handleConfirm = () => {
    const days = isEditing ? editedDays : parsedDays
    if (!days) return
    days.forEach((d) => {
      const day: ScheduleDay = {
        date: d.date,
        type: d.type,
        startTime: d.startTime,
        endTime: d.endTime,
        note: d.note,
      }
      setScheduleDay(day)
    })
    handleClose()
  }

  const updateEditedType = (idx: number, type: DayType) => {
    setEditedDays((prev) => prev ? prev.map((d, i) => i === idx ? { ...d, type } : d) : prev)
  }

  const displayDays = isEditing ? editedDays : parsedDays

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="fixed inset-0 z-[250] flex flex-col"
          style={{ background: '#050912' }}
        >
          {/* Top bar */}
          <div
            className="flex items-center justify-between px-4 flex-shrink-0"
            style={{
              paddingTop: 'max(1.1rem, env(safe-area-inset-top, 1.1rem))',
              paddingBottom: '12px',
              borderBottom: '1px solid rgba(255,255,255,0.06)',
            }}
          >
            <div className="flex items-center gap-2.5">
              <div
                className="w-8 h-8 rounded-xl flex items-center justify-center"
                style={{ background: 'rgba(124,58,237,0.15)', border: '1px solid rgba(124,58,237,0.3)' }}
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
                  <path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z" stroke="#7C3AED" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                  <circle cx="12" cy="13" r="4" stroke="#7C3AED" strokeWidth="1.8" />
                </svg>
              </div>
              <div>
                <h2 className="font-display font-bold text-base text-white leading-tight">Import Schedule</h2>
                <p className="text-[10px] font-body" style={{ color: '#475569' }}>Upload a photo of your shift schedule</p>
              </div>
            </div>
            <motion.button
              whileTap={{ scale: 0.88 }}
              onClick={handleClose}
              className="w-8 h-8 rounded-xl flex items-center justify-center"
              style={{ background: 'rgba(255,255,255,0.06)' }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                <path d="M18 6L6 18M6 6l12 12" stroke="#94A3B8" strokeWidth="2" strokeLinecap="round" />
              </svg>
            </motion.button>
          </div>

          {/* Content area */}
          <div className="flex-1 overflow-y-auto px-4 pt-4">

            {/* Upload zone or preview */}
            {!preview ? (
              <motion.button
                whileTap={{ scale: 0.97 }}
                onClick={() => fileInputRef.current?.click()}
                className="w-full flex flex-col items-center justify-center gap-4 rounded-3xl mb-4"
                style={{
                  height: '220px',
                  background: 'rgba(124,58,237,0.05)',
                  border: '2px dashed rgba(124,58,237,0.35)',
                }}
              >
                <div
                  className="w-12 h-12 rounded-2xl flex items-center justify-center"
                  style={{ background: 'rgba(124,58,237,0.12)', border: '1px solid rgba(124,58,237,0.25)' }}
                >
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                    <path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z" stroke="#7C3AED" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                    <circle cx="12" cy="13" r="4" stroke="#7C3AED" strokeWidth="1.8" />
                  </svg>
                </div>
                <div className="text-center">
                  <p className="font-display font-bold text-sm" style={{ color: '#7C3AED' }}>TAP TO SELECT PHOTO</p>
                  <p className="text-[10px] font-body mt-1" style={{ color: '#475569' }}>JPEG · PNG · WebP</p>
                </div>
              </motion.button>
            ) : (
              <div className="relative mb-4">
                {/* Image with scan line */}
                <div className="relative rounded-2xl overflow-hidden" style={{ maxHeight: '220px' }}>
                  <img
                    src={preview}
                    alt="Schedule"
                    className="w-full object-cover"
                    style={{ maxHeight: '220px' }}
                  />
                  {isParsing && (
                    <motion.div
                      className="absolute inset-x-0 h-[2px] pointer-events-none"
                      style={{ background: 'linear-gradient(90deg, transparent 0%, #3B82F6 40%, #60A5FA 50%, #3B82F6 60%, transparent 100%)' }}
                      initial={{ top: '0%' }}
                      animate={{ top: ['0%', '100%', '0%'] }}
                      transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
                    />
                  )}
                  {isParsing && (
                    <div
                      className="absolute inset-0 pointer-events-none"
                      style={{ background: 'rgba(37,99,235,0.06)' }}
                    />
                  )}
                </div>
                <motion.button
                  whileTap={{ scale: 0.97 }}
                  onClick={() => { reset(); setTimeout(() => fileInputRef.current?.click(), 50) }}
                  className="mt-2 w-full py-2 rounded-xl font-display font-bold text-[10px] tracking-widest"
                  style={{ background: 'rgba(255,255,255,0.05)', color: '#475569' }}
                >
                  CHOOSE DIFFERENT PHOTO
                </motion.button>
              </div>
            )}

            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/gif,image/webp"
              className="hidden"
              onChange={handleFileChange}
            />

            {/* Error */}
            {error && (
              <div
                className="rounded-2xl px-4 py-3 mb-3"
                style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)' }}
              >
                <p className="text-[11px] font-body" style={{ color: '#EF4444' }}>{error}</p>
              </div>
            )}

            {/* Parse button — shown only before results */}
            {!parsedDays && (
              <motion.button
                whileTap={{ scale: 0.97 }}
                onClick={handleParse}
                disabled={!file || isParsing}
                className="w-full py-4 rounded-2xl font-display font-bold text-sm tracking-widest mb-4"
                style={{
                  background: file && !isParsing
                    ? 'linear-gradient(135deg, #5B21B6, #7C3AED)'
                    : 'rgba(255,255,255,0.06)',
                  color: file && !isParsing ? '#FFFFFF' : '#475569',
                }}
              >
                {isParsing ? (
                  <motion.span
                    animate={{ opacity: [1, 0.5, 1] }}
                    transition={{ duration: 1.2, repeat: Infinity }}
                  >
                    READING YOUR SCHEDULE…
                  </motion.span>
                ) : (
                  'PARSE SCHEDULE'
                )}
              </motion.button>
            )}
          </div>

          {/* Results panel — slides up from bottom */}
          <AnimatePresence>
            {parsedDays && displayDays && (
              <motion.div
                initial={{ y: '100%' }}
                animate={{ y: 0 }}
                exit={{ y: '100%' }}
                transition={{ type: 'spring', stiffness: 280, damping: 32 }}
                className="flex-shrink-0"
                style={{
                  background: '#080D1E',
                  borderTop: '1px solid rgba(255,255,255,0.08)',
                  paddingBottom: 'max(1.5rem, env(safe-area-inset-bottom, 1.5rem))',
                  maxHeight: '55dvh',
                }}
              >
                {/* Header row */}
                <div className="flex items-center justify-between px-4 pt-3 pb-2">
                  <span className="text-[9px] font-display font-bold tracking-widest" style={{ color: labelColor }}>
                    EXTRACTED — {displayDays.length} DAYS
                  </span>
                  <motion.button
                    whileTap={{ scale: 0.92 }}
                    onClick={() => setIsEditing((v) => !v)}
                    className="px-2.5 py-1 rounded-lg font-display font-bold text-[9px] tracking-widest"
                    style={{
                      background: isEditing ? 'rgba(245,158,11,0.12)' : 'rgba(255,255,255,0.06)',
                      color: isEditing ? '#F59E0B' : '#64748B',
                    }}
                  >
                    {isEditing ? 'EDITING' : 'EDIT BEFORE SAVING'}
                  </motion.button>
                </div>

                {/* Day list */}
                <div className="overflow-y-auto px-4" style={{ maxHeight: 'calc(55dvh - 130px)' }}>
                  <div className="flex flex-col gap-1.5 pb-2">
                    {displayDays.map((d, i) => (
                      <div
                        key={i}
                        className="flex items-center gap-3 rounded-xl px-3 py-2"
                        style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}
                      >
                        <div
                          className="w-2 h-2 rounded-full flex-shrink-0"
                          style={{ background: TYPE_COLORS[d.type] ?? '#94A3B8' }}
                        />
                        <span className="font-display font-bold text-xs" style={{ color: textPrimary }}>{d.date}</span>
                        {isEditing ? (
                          <select
                            value={d.type}
                            onChange={(e) => updateEditedType(i, e.target.value as DayType)}
                            className="ml-auto text-[10px] font-body rounded-lg px-2 py-1 focus:outline-none"
                            style={{
                              background: 'rgba(255,255,255,0.08)',
                              color: textPrimary,
                              border: '1px solid rgba(255,255,255,0.1)',
                            }}
                          >
                            {TYPE_OPTIONS.map((o) => (
                              <option key={o.value} value={o.value}>{o.label}</option>
                            ))}
                          </select>
                        ) : (
                          <>
                            <span className="text-[10px] font-body capitalize" style={{ color: textSecondary }}>{d.type}</span>
                            {d.startTime && (
                              <span className="text-[9px] font-body ml-auto" style={{ color: '#475569' }}>
                                {d.startTime}–{d.endTime}
                              </span>
                            )}
                          </>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Action buttons */}
                <div className="flex flex-col gap-2 px-4 pt-2">
                  <motion.button
                    whileTap={{ scale: 0.97 }}
                    onClick={handleConfirm}
                    className="w-full py-3.5 rounded-2xl font-display font-bold text-sm tracking-widest text-white"
                    style={{ background: 'linear-gradient(135deg, #065F46, #10B981)' }}
                  >
                    LOOKS GOOD — SAVE ALL
                  </motion.button>
                  <motion.button
                    whileTap={{ scale: 0.97 }}
                    onClick={handleClose}
                    className="w-full py-3 rounded-2xl font-display font-bold text-xs tracking-widest"
                    style={{ background: 'rgba(255,255,255,0.05)', color: '#475569' }}
                  >
                    CANCEL
                  </motion.button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
