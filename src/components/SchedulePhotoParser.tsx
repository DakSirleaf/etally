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
  'You are a schedule parser. The user will upload a photo of a hospital shift schedule. Extract the schedule for the employee shown. Return ONLY a JSON array of objects with this exact format: [{"date": "YYYY-MM-DD", "type": "scheduled"|"ot"|"vacation"|"off", "startTime": "HH:MM", "endTime": "HH:MM", "note": "any notes"}]. Use the current year 2026. Return nothing but the JSON array.'

const SUPPORTED_TYPES: Record<string, string> = {
  'image/jpeg': 'image/jpeg',
  'image/jpg': 'image/jpeg',
  'image/png': 'image/png',
  'image/gif': 'image/gif',
  'image/webp': 'image/webp',
}

interface SchedulePhotoParserProps {
  isOpen: boolean
  onClose: () => void
}

export default function SchedulePhotoParser({ isOpen, onClose }: SchedulePhotoParserProps) {
  const { isDark, surface, surfaceBorder, textPrimary, textSecondary, labelColor } = useTheme()
  const setScheduleDay = useStore((s: any) => s.setScheduleDay)

  const fileInputRef = useRef<HTMLInputElement>(null)
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [isParsing, setIsParsing] = useState(false)
  const [parsedDays, setParsedDays] = useState<ParsedDay[] | null>(null)
  const [error, setError] = useState<string | null>(null)

  const reset = () => {
    setFile(null)
    setPreview(null)
    setParsedDays(null)
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
    setError(null)
    const url = URL.createObjectURL(f)
    setPreview(url)
  }

  const handleParse = async () => {
    if (!file) return
    const mediaType = SUPPORTED_TYPES[file.type]
    if (!mediaType) {
      setError('Unsupported image format. Please use JPEG, PNG, GIF, or WebP.')
      return
    }

    setIsParsing(true)
    setError(null)
    setParsedDays(null)

    try {
      const reader = new FileReader()
      const base64: string = await new Promise((resolve, reject) => {
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
          model: 'claude-sonnet-4-20250514',
          max_tokens: 1000,
          system: SYSTEM_PROMPT,
          messages: [
            {
              role: 'user',
              content: [
                {
                  type: 'image',
                  source: { type: 'base64', media_type: mediaType, data: base64 },
                },
                { type: 'text', text: 'Parse the schedule from this image.' },
              ],
            },
          ],
        }),
      })

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}))
        throw new Error((errData as any)?.error?.message ?? `API error ${response.status}`)
      }

      const data = await response.json()
      const text: string = (data.content?.[0]?.text ?? '') as string
      const match = text.match(/\[[\s\S]*\]/)
      if (!match) throw new Error('No schedule data found')

      const parsed = JSON.parse(match[0]) as ParsedDay[]
      if (!Array.isArray(parsed) || parsed.length === 0) throw new Error('Empty schedule returned')

      // Validate and sanitise each day
      const validTypes = new Set<string>(['scheduled', 'ot', 'vacation', 'off', 'callout', 'aspirational', 'holiday'])
      const sanitised: ParsedDay[] = parsed
        .filter((d) => typeof d.date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(d.date))
        .map((d) => ({
          date: d.date,
          type: validTypes.has(d.type) ? d.type : 'scheduled',
          startTime: d.startTime,
          endTime: d.endTime,
          note: d.note,
        }))

      if (sanitised.length === 0) throw new Error('Could not extract valid dates')
      setParsedDays(sanitised)
    } catch {
      setError('Could not read schedule clearly — please try a clearer photo or add days manually')
    } finally {
      setIsParsing(false)
    }
  }

  const handleConfirm = () => {
    if (!parsedDays) return
    parsedDays.forEach((d) => {
      const day: ScheduleDay = {
        date: d.date,
        type: d.type as DayType,
        startTime: d.startTime,
        endTime: d.endTime,
        note: d.note,
      }
      setScheduleDay(day)
    })
    handleClose()
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
            onClick={handleClose}
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
              maxHeight: '90dvh',
              borderTop: isDark ? '1px solid rgba(255,255,255,0.08)' : 'none',
            }}
          >
            <div className="flex justify-center pt-3 pb-1">
              <div className="w-10 h-1 rounded-full" style={{ background: isDark ? '#1E293B' : '#E2E8F0' }} />
            </div>

            <div className="overflow-y-auto px-4" style={{ maxHeight: 'calc(90dvh - 3rem)' }}>
              {/* Header */}
              <div className="mt-2 mb-4 flex items-center gap-3">
                <div
                  className="w-10 h-10 rounded-2xl flex items-center justify-center flex-shrink-0"
                  style={{ background: 'rgba(124,58,237,0.12)', border: '1px solid rgba(124,58,237,0.25)' }}
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                    <path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z" stroke="#7C3AED" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                    <circle cx="12" cy="13" r="4" stroke="#7C3AED" strokeWidth="1.8" />
                  </svg>
                </div>
                <div>
                  <h2 className="font-display font-bold text-lg" style={{ color: textPrimary }}>Import Schedule</h2>
                  <p className="text-[11px] font-body mt-0.5" style={{ color: textSecondary }}>Upload a photo of your shift schedule</p>
                </div>
              </div>

              {/* Upload area */}
              {!preview ? (
                <motion.button
                  whileTap={{ scale: 0.97 }}
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full rounded-2xl flex flex-col items-center justify-center gap-3 py-10 mb-4"
                  style={{
                    background: isDark ? 'rgba(124,58,237,0.06)' : '#F5F3FF',
                    border: `2px dashed ${isDark ? 'rgba(124,58,237,0.3)' : '#C4B5FD'}`,
                  }}
                >
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none">
                    <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M17 8l-5-5-5 5M12 3v12" stroke="#7C3AED" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  <div className="text-center">
                    <p className="font-display font-bold text-sm" style={{ color: '#7C3AED' }}>TAP TO SELECT PHOTO</p>
                    <p className="text-[10px] font-body mt-1" style={{ color: textSecondary }}>JPEG, PNG, WebP supported</p>
                  </div>
                </motion.button>
              ) : (
                <div className="mb-4">
                  <img
                    src={preview}
                    alt="Schedule preview"
                    className="w-full rounded-2xl object-cover"
                    style={{ maxHeight: '220px' }}
                  />
                  <motion.button
                    whileTap={{ scale: 0.97 }}
                    onClick={() => { reset(); fileInputRef.current?.click() }}
                    className="mt-2 w-full py-2 rounded-xl font-display font-bold text-[10px] tracking-widest"
                    style={{
                      background: isDark ? 'rgba(255,255,255,0.05)' : '#F1F5F9',
                      color: textSecondary,
                    }}
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
                  style={{
                    background: isDark ? 'rgba(239,68,68,0.08)' : '#FFF1F2',
                    border: isDark ? '1px solid rgba(239,68,68,0.2)' : '1px solid #FECDD3',
                  }}
                >
                  <p className="text-[11px] font-body" style={{ color: '#EF4444' }}>{error}</p>
                </div>
              )}

              {/* Parsed preview */}
              {parsedDays && parsedDays.length > 0 && (
                <div className="mb-4">
                  <p className="text-[9px] font-display font-bold tracking-widest mb-2" style={{ color: labelColor }}>
                    EXTRACTED — {parsedDays.length} DAYS
                  </p>
                  <div className="flex flex-col gap-1.5 max-h-40 overflow-y-auto">
                    {parsedDays.map((d, i) => (
                      <div
                        key={i}
                        className="flex items-center gap-3 rounded-xl px-3 py-2"
                        style={{ background: surface, border: surfaceBorder }}
                      >
                        <div
                          className="w-2 h-2 rounded-full flex-shrink-0"
                          style={{ background: TYPE_COLORS[d.type] ?? '#94A3B8' }}
                        />
                        <span className="font-display font-bold text-xs" style={{ color: textPrimary }}>{d.date}</span>
                        <span className="text-[10px] font-body capitalize" style={{ color: textSecondary }}>{d.type}</span>
                        {d.startTime && (
                          <span className="text-[9px] font-body ml-auto" style={{ color: labelColor }}>
                            {d.startTime} – {d.endTime}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Action buttons */}
              <div className="flex flex-col gap-2 mb-2">
                {!parsedDays ? (
                  <motion.button
                    whileTap={{ scale: 0.97 }}
                    onClick={handleParse}
                    disabled={!file || isParsing}
                    className="w-full py-4 rounded-2xl font-display font-bold text-sm tracking-widest text-white"
                    style={{
                      background: file && !isParsing
                        ? 'linear-gradient(135deg, #5B21B6, #7C3AED)'
                        : isDark ? 'rgba(255,255,255,0.08)' : '#E2E8F0',
                      color: file && !isParsing ? 'white' : textSecondary,
                    }}
                  >
                    {isParsing ? 'PARSING SCHEDULE…' : 'PARSE SCHEDULE'}
                  </motion.button>
                ) : (
                  <motion.button
                    whileTap={{ scale: 0.97 }}
                    onClick={handleConfirm}
                    className="w-full py-4 rounded-2xl font-display font-bold text-sm tracking-widest text-white"
                    style={{ background: 'linear-gradient(135deg, #065F46, #10B981)' }}
                  >
                    SAVE {parsedDays.length} DAYS TO CALENDAR
                  </motion.button>
                )}

                <motion.button
                  whileTap={{ scale: 0.97 }}
                  onClick={handleClose}
                  className="w-full py-3 rounded-2xl font-display font-bold text-xs tracking-widest"
                  style={{
                    background: isDark ? 'rgba(255,255,255,0.05)' : '#F1F5F9',
                    color: textSecondary,
                  }}
                >
                  CANCEL
                </motion.button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
