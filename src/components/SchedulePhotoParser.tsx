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

const currentYear = new Date().getFullYear()

const SYSTEM_PROMPT =
  `You are a schedule parser for a New Jersey state psychiatric hospital employee schedule.

The image is a printed monthly schedule showing a calendar grid. Each day cell contains a date (MM/DD/YYYY format) and optionally a shift code below it.

SHIFT CODE MEANINGS — read these exactly:
- "N" = scheduled night shift. Type: "scheduled". Start time: "22:45" (previous calendar day), End time: "07:15" (the listed date).
- "HN" = this date is a state/federal holiday. The employee was scheduled to work nights on this date (holiday night shift). Type: "holiday". Start time: "22:45" (previous calendar day), End time: "07:15" (the listed date).
- "SCKN" = employee called out sick on a scheduled night shift. Type: "callout". No times needed.
- "VACD" or "VAC" = vacation day. Type: "vacation". No times needed.
- "OT" or "OTN" = overtime night shift. Type: "ot". Start time: "22:45", End time: "07:15".
- Blank / no code = regular day off. DO NOT include these dates in the output.

CRITICAL RULES:
1. Only include dates that have a shift code (N, HN, SCKN, VACD, OT etc). Skip all blank days completely.
2. The schedule may span two calendar years — use the year printed on each date exactly as shown.
3. Dates are in MM/DD/YYYY format in the image — convert to YYYY-MM-DD in output.
4. For night shifts (N, HN, OT): the startTime "22:45" refers to the PREVIOUS calendar day, but the date in the output should be the date SHOWN in the schedule cell (the end date of the shift).

Return ONLY a valid JSON array with no markdown, no explanation, no extra text:
[{"date": "YYYY-MM-DD", "type": "scheduled"|"holiday"|"callout"|"vacation"|"ot", "startTime": "22:45", "endTime": "07:15"}]

Return nothing but the JSON array.`

const SUPPORTED_TYPES: Record<string, string> = {
  'image/jpeg': 'image/jpeg',
  'image/jpg':  'image/jpeg',
  'image/png':  'image/png',
  'image/gif':  'image/gif',
  'image/webp': 'image/webp',
}

const TYPE_COLORS: Record<string, string> = {
  scheduled:    '#2563EB',
  ot:           '#EC0677',
  callout:      '#F59E0B',
  vacation:     '#10B981',
  aspirational: '#8B5CF6',
  off:          '#94A3B8',
  holiday:      '#EF4444',
}

const TYPE_OPTIONS: { value: DayType; label: string }[] = [
  { value: 'scheduled',    label: 'Scheduled' },
  { value: 'holiday',      label: 'Holiday' },
  { value: 'ot',           label: 'OT' },
  { value: 'vacation',     label: 'Vacation' },
  { value: 'off',          label: 'Day Off' },
  { value: 'callout',      label: 'Callout' },
]

interface SchedulePhotoParserProps {
  isOpen: boolean
  onClose: () => void
}

export default function SchedulePhotoParser({ isOpen, onClose }: SchedulePhotoParserProps) {
  const { isDark, textPrimary, textSecondary, labelColor } = useTheme()
  const setScheduleDays = useStore((s: any) => s.setScheduleDays)

  const fileInputRef = useRef<HTMLInputElement>(null)
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [isParsing, setIsParsing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [parsedDays, setParsedDays] = useState<ParsedDay[] | null>(null)
  const [editedDays, setEditedDays] = useState<ParsedDay[] | null>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const reset = () => {
    setFile(null); setPreview(null); setParsedDays(null)
    setEditedDays(null); setIsEditing(false)
    setError(null); setIsParsing(false); setIsSaving(false)
  }

  const handleClose = () => { reset(); onClose() }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]
    if (!f) return
    setFile(f); setParsedDays(null); setEditedDays(null)
    setIsEditing(false); setError(null)
    setPreview(URL.createObjectURL(f))
  }

  const handleParse = async () => {
    if (!file) return
    const mediaType = SUPPORTED_TYPES[file.type]
    if (!mediaType) { setError('Unsupported format. Please use JPEG, PNG, or WebP.'); return }

    setIsParsing(true); setError(null); setParsedDays(null); setEditedDays(null)

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
          model: 'claude-opus-4-6',
          max_tokens: 2500,
          system: SYSTEM_PROMPT,
          messages: [{
            role: 'user',
            content: [
              { type: 'image', source: { type: 'base64', media_type: mediaType, data: base64 } },
              { type: 'text', text: 'Parse all shift dates from this schedule image. Remember: blank days mean day off — skip them. Only include days with shift codes.' },
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
      console.log('Claude raw response:', text)

      const match = text.match(/\[[\s\S]*\]/)
      if (!match) throw new Error('No schedule data found. Try a clearer, flatter photo.')

      const parsed = JSON.parse(match[0]) as ParsedDay[]
      if (!Array.isArray(parsed) || parsed.length === 0) throw new Error('No shift dates found in this image.')

      const validTypes = new Set<string>(['scheduled','ot','vacation','off','callout','aspirational','holiday'])
      const sanitised: ParsedDay[] = parsed
        .filter((d) => typeof d.date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(d.date))
        .map((d) => ({
          date: d.date,
          type: (validTypes.has(d.type) ? d.type : 'scheduled') as DayType,
          startTime: d.startTime,
          endTime: d.endTime,
          note: d.note,
        }))

      if (sanitised.length === 0) throw new Error('Could not read valid dates. Try a flatter, better-lit photo.')

      setParsedDays(sanitised)
      setEditedDays(sanitised.map((d) => ({ ...d })))
    } catch (err) {
      console.error('Parse error:', err)
      setError((err as Error).message ?? 'Could not read schedule — try a clearer photo.')
    } finally {
      setIsParsing(false)
    }
  }

  const handleConfirm = async () => {
    const days = isEditing ? editedDays : parsedDays
    if (!days || days.length === 0) return
    setIsSaving(true)
    try {
      const scheduleDays: ScheduleDay[] = days.map((d) => ({
        date: d.date, type: d.type,
        startTime: d.startTime, endTime: d.endTime, note: d.note,
      }))
      setScheduleDays(scheduleDays)
      handleClose()
    } catch (err) {
      console.error('Save error:', err)
      setError('Failed to save. Please try again.')
      setIsSaving(false)
    }
  }

  const updateEditedType = (idx: number, type: DayType) => {
    setEditedDays((prev) => prev ? prev.map((d, i) => i === idx ? { ...d, type } : d) : prev)
  }

  const displayDays = isEditing ? editedDays : parsedDays

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="fixed inset-0 z-[250] flex flex-col"
          style={{ background: '#050912' }}
        >
          <div className="flex items-center justify-between px-4 flex-shrink-0"
            style={{ paddingTop: 'max(1.1rem, env(safe-area-inset-top, 1.1rem))', paddingBottom: '12px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl flex items-center justify-center"
                style={{ background: 'rgba(124,58,237,0.15)', border: '1px solid rgba(124,58,237,0.3)' }}>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
                  <path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z" stroke="#7C3AED" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                  <circle cx="12" cy="13" r="4" stroke="#7C3AED" strokeWidth="1.8" />
                </svg>
              </div>
              <div>
                <h2 className="font-display font-bold text-base text-white leading-tight">Import Schedule</h2>
                <p className="text-[10px] font-body" style={{ color: '#475569' }}>Upload a photo of your printed schedule</p>
              </div>
            </div>
            <motion.button whileTap={{ scale: 0.88 }} onClick={handleClose}
              className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: 'rgba(255,255,255,0.06)' }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                <path d="M18 6L6 18M6 6l12 12" stroke="#94A3B8" strokeWidth="2" strokeLinecap="round" />
              </svg>
            </motion.button>
          </div>

          <div className="flex-1 overflow-y-auto px-4 pt-4">
            {!preview ? (
              <motion.button whileTap={{ scale: 0.97 }} onClick={() => fileInputRef.current?.click()}
                className="w-full flex flex-col items-center justify-center gap-4 rounded-3xl mb-4"
                style={{ height: '220px', background: 'rgba(124,58,237,0.05)', border: '2px dashed rgba(124,58,237,0.35)' }}>
                <div className="w-12 h-12 rounded-2xl flex items-center justify-center"
                  style={{ background: 'rgba(124,58,237,0.12)', border: '1px solid rgba(124,58,237,0.25)' }}>
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
                <div className="relative rounded-2xl overflow-hidden" style={{ maxHeight: '220px' }}>
                  <img src={preview} alt="Schedule" className="w-full object-cover" style={{ maxHeight: '220px' }} />
                  {isParsing && (
                    <>
                      <motion.div className="absolute inset-x-0 h-[2px] pointer-events-none"
                        style={{ background: 'linear-gradient(90deg, transparent 0%, #3B82F6 40%, #60A5FA 50%, #3B82F6 60%, transparent 100%)' }}
                        initial={{ top: '0%' }} animate={{ top: ['0%','100%','0%'] }}
                        transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }} />
                      <div className="absolute inset-0 pointer-events-none" style={{ background: 'rgba(37,99,235,0.06)' }} />
                    </>
                  )}
                </div>
                <motion.button whileTap={{ scale: 0.97 }}
                  onClick={() => { reset(); setTimeout(() => fileInputRef.current?.click(), 50) }}
                  className="mt-2 w-full py-2 rounded-xl font-display font-bold text-[10px] tracking-widest"
                  style={{ background: 'rgba(255,255,255,0.05)', color: '#475569' }}>
                  CHOOSE DIFFERENT PHOTO
                </motion.button>
              </div>
            )}

            <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/gif,image/webp"
              className="hidden" onChange={handleFileChange} />

            {error && (
              <div className="rounded-2xl px-4 py-3 mb-3"
                style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)' }}>
                <p className="text-[11px] font-body" style={{ color: '#EF4444' }}>{error}</p>
              </div>
            )}

            {!parsedDays && (
              <motion.button whileTap={{ scale: 0.97 }} onClick={handleParse}
                disabled={!file || isParsing}
                className="w-full py-4 rounded-2xl font-display font-bold text-sm tracking-widest mb-4"
                style={{
                  background: file && !isParsing ? 'linear-gradient(135deg, #5B21B6, #7C3AED)' : 'rgba(255,255,255,0.06)',
                  color: file && !isParsing ? '#FFFFFF' : '#475569',
                }}>
                {isParsing ? (
                  <motion.span animate={{ opacity: [1,0.5,1] }} transition={{ duration: 1.2, repeat: Infinity }}>
                    READING YOUR SCHEDULE…
                  </motion.span>
                ) : 'PARSE SCHEDULE'}
              </motion.button>
            )}
          </div>

          <AnimatePresence>
            {parsedDays && displayDays && (
              <motion.div initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
                transition={{ type: 'spring', stiffness: 280, damping: 32 }}
                className="flex-shrink-0"
                style={{ background: '#080D1E', borderTop: '1px solid rgba(255,255,255,0.08)', paddingBottom: 'max(1.5rem, env(safe-area-inset-bottom, 1.5rem))', maxHeight: '55dvh' }}>
                <div className="flex items-center justify-between px-4 pt-3 pb-2">
                  <span className="text-[9px] font-display font-bold tracking-widest" style={{ color: labelColor }}>
                    EXTRACTED — {displayDays.length} DAYS
                  </span>
                  <motion.button whileTap={{ scale: 0.92 }} onClick={() => setIsEditing((v) => !v)}
                    className="px-2.5 py-1 rounded-lg font-display font-bold text-[9px] tracking-widest"
                    style={{ background: isEditing ? 'rgba(245,158,11,0.12)' : 'rgba(255,255,255,0.06)', color: isEditing ? '#F59E0B' : '#64748B' }}>
                    {isEditing ? 'EDITING' : 'EDIT BEFORE SAVING'}
                  </motion.button>
                </div>

                <div className="overflow-y-auto px-4" style={{ maxHeight: 'calc(55dvh - 130px)' }}>
                  <div className="flex flex-col gap-1.5 pb-2">
                    {displayDays.map((d, i) => (
                      <div key={i} className="flex items-center gap-3 rounded-xl px-3 py-2"
                        style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}>
                        <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: TYPE_COLORS[d.type] ?? '#94A3B8' }} />
                        <span className="font-display font-bold text-xs" style={{ color: textPrimary }}>{d.date}</span>
                        {isEditing ? (
                          <select value={d.type} onChange={(e) => updateEditedType(i, e.target.value as DayType)}
                            className="ml-auto text-[10px] font-body rounded-lg px-2 py-1 focus:outline-none"
                            style={{ background: 'rgba(255,255,255,0.08)', color: textPrimary, border: '1px solid rgba(255,255,255,0.1)' }}>
                            {TYPE_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                          </select>
                        ) : (
                          <>
                            <span className="text-[10px] font-body capitalize" style={{ color: textSecondary }}>{d.type}</span>
                            {d.startTime && (
                              <span className="text-[9px] font-body ml-auto" style={{ color: '#475569' }}>{d.startTime}–{d.endTime}</span>
                            )}
                          </>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex flex-col gap-2 px-4 pt-2">
                  <motion.button whileTap={{ scale: 0.97 }} onClick={handleConfirm} disabled={isSaving}
                    className="w-full py-3.5 rounded-2xl font-display font-bold text-sm tracking-widest text-white"
                    style={{ background: isSaving ? 'rgba(16,185,129,0.4)' : 'linear-gradient(135deg, #065F46, #10B981)' }}>
                    {isSaving ? 'SAVING…' : 'LOOKS GOOD — SAVE ALL'}
                  </motion.button>
                  <motion.button whileTap={{ scale: 0.97 }} onClick={handleClose}
                    className="w-full py-3 rounded-2xl font-display font-bold text-xs tracking-widest"
                    style={{ background: 'rgba(255,255,255,0.05)', color: '#475569' }}>
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
