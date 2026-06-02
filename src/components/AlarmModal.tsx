import { useState, useEffect, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useTheme } from '../lib/useTheme'

type RepeatMode = 'once' | 'daily' | 'weekdays'

interface Alarm {
  id: number
  hour: number    // 0-23 internally
  minute: number
  label: string
  tone: ToneId
  enabled: boolean
  fired: boolean
  repeat: RepeatMode
}

type ToneId = 'pulse' | 'bell' | 'buzz' | 'chime' | 'alert'

const TONES: { id: ToneId; label: string; emoji: string }[] = [
  { id: 'pulse', label: 'Pulse', emoji: '💓' },
  { id: 'bell', label: 'Chapel Bell', emoji: '🔔' },
  { id: 'buzz', label: 'Buzzer', emoji: '📳' },
  { id: 'chime', label: 'Chime', emoji: '🎵' },
  { id: 'alert', label: 'Alert', emoji: '🚨' },
]

const REPEATS: { id: RepeatMode; label: string }[] = [
  { id: 'once', label: 'Once' },
  { id: 'daily', label: 'Daily' },
  { id: 'weekdays', label: 'Weekdays' },
]

function playTone(toneId: ToneId, ctx: AudioContext) {
  const now = ctx.currentTime
  switch (toneId) {
    case 'pulse': {
      for (let i = 0; i < 3; i++) {
        const o = ctx.createOscillator(); const g = ctx.createGain()
        o.connect(g); g.connect(ctx.destination)
        o.type = 'sine'; o.frequency.setValueAtTime(880, now + i * 0.4)
        g.gain.setValueAtTime(0, now + i * 0.4)
        g.gain.linearRampToValueAtTime(0.4, now + i * 0.4 + 0.05)
        g.gain.exponentialRampToValueAtTime(0.001, now + i * 0.4 + 0.35)
        o.start(now + i * 0.4); o.stop(now + i * 0.4 + 0.35)
      }
      break
    }
    case 'bell': {
      [523, 659, 784, 1047].forEach((f, i) => {
        const o = ctx.createOscillator(); const g = ctx.createGain()
        o.connect(g); g.connect(ctx.destination)
        o.type = 'sine'; o.frequency.setValueAtTime(f, now + i * 0.25)
        g.gain.setValueAtTime(0.3, now + i * 0.25)
        g.gain.exponentialRampToValueAtTime(0.001, now + i * 0.25 + 1.2)
        o.start(now + i * 0.25); o.stop(now + i * 0.25 + 1.2)
      })
      break
    }
    case 'buzz': {
      for (let i = 0; i < 4; i++) {
        const o = ctx.createOscillator(); const g = ctx.createGain()
        o.connect(g); g.connect(ctx.destination)
        o.type = 'square'; o.frequency.setValueAtTime(120, now + i * 0.2)
        g.gain.setValueAtTime(0.3, now + i * 0.2)
        g.gain.setValueAtTime(0.3, now + i * 0.2 + 0.12)
        g.gain.setValueAtTime(0, now + i * 0.2 + 0.13)
        o.start(now + i * 0.2); o.stop(now + i * 0.2 + 0.14)
      }
      break
    }
    case 'chime': {
      [523, 784, 659, 1047, 880].forEach((f, i) => {
        const o = ctx.createOscillator(); const g = ctx.createGain()
        o.connect(g); g.connect(ctx.destination)
        o.type = 'sine'; o.frequency.setValueAtTime(f, now + i * 0.18)
        g.gain.setValueAtTime(0.25, now + i * 0.18)
        g.gain.exponentialRampToValueAtTime(0.001, now + i * 0.18 + 0.8)
        o.start(now + i * 0.18); o.stop(now + i * 0.18 + 0.8)
      })
      break
    }
    case 'alert': {
      for (let i = 0; i < 6; i++) {
        const o = ctx.createOscillator(); const g = ctx.createGain()
        o.connect(g); g.connect(ctx.destination)
        o.type = 'sawtooth'
        o.frequency.setValueAtTime(i % 2 === 0 ? 1200 : 800, now + i * 0.15)
        g.gain.setValueAtTime(0.25, now + i * 0.15)
        g.gain.setValueAtTime(0, now + i * 0.15 + 0.12)
        o.start(now + i * 0.15); o.stop(now + i * 0.15 + 0.13)
      }
      break
    }
  }
}

function pad(n: number) { return String(n).padStart(2, '0') }

function fmt12(h: number, m: number) {
  const ampm = h < 12 ? 'AM' : 'PM'
  const h12 = h % 12 === 0 ? 12 : h % 12
  return `${h12}:${pad(m)} ${ampm}`
}

// Convert 12hr display + ampm to 24hr internal
function to24(h12: number, ampm: 'AM' | 'PM'): number {
  if (ampm === 'AM') return h12 === 12 ? 0 : h12
  return h12 === 12 ? 12 : h12 + 12
}

// Convert 24hr internal to 12hr display
function to12(h24: number): { h12: number; ampm: 'AM' | 'PM' } {
  const ampm: 'AM' | 'PM' = h24 < 12 ? 'AM' : 'PM'
  const h12 = h24 % 12 === 0 ? 12 : h24 % 12
  return { h12, ampm }
}

interface AlarmModalProps {
  isOpen: boolean
  onClose: () => void
}

export default function AlarmModal({ isOpen, onClose }: AlarmModalProps) {
  const { isDark, surface, surfaceBorder, textPrimary, textSecondary, labelColor } = useTheme()
  const [alarms, setAlarms] = useState<Alarm[]>([])
  const [editing, setEditing] = useState<number | null>(null)

  // Edit state in 12hr format
  const [editH12, setEditH12] = useState(7)
  const [editAmPm, setEditAmPm] = useState<'AM' | 'PM'>('AM')
  const [editMinute, setEditMinute] = useState(0)
  const [editLabel, setEditLabel] = useState('')
  const [editTone, setEditTone] = useState<ToneId>('pulse')
  const [editRepeat, setEditRepeat] = useState<RepeatMode>('once')

  const [firing, setFiring] = useState<Alarm | null>(null)
  const [snoozed, setSnoozed] = useState(false)
  const [now, setNow] = useState(new Date())
  const audioCtxRef = useRef<AudioContext | null>(null)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const fireIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const snoozeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Clock tick
  useEffect(() => {
    intervalRef.current = setInterval(() => setNow(new Date()), 1000)
    return () => { if (intervalRef.current) clearInterval(intervalRef.current) }
  }, [])

  // Alarm checker
  useEffect(() => {
    const check = setInterval(() => {
      const n = new Date()
      const dayOfWeek = n.getDay() // 0=Sun, 6=Sat
      const isWeekday = dayOfWeek >= 1 && dayOfWeek <= 5

      setAlarms(prev => prev.map(a => {
        if (!a.enabled || a.fired) return a
        if (a.repeat === 'weekdays' && !isWeekday) return a
        if (a.hour === n.getHours() && a.minute === n.getMinutes() && n.getSeconds() === 0) {
          setFiring(a)
          // For repeat alarms, reset fired after 1 min so they fire again tomorrow
          const shouldKeepFired = a.repeat === 'once'
          return { ...a, fired: shouldKeepFired }
        }
        return a
      }))
    }, 1000)
    return () => clearInterval(check)
  }, [])

  // Fire sound + vibration
  useEffect(() => {
    if (!firing) {
      if (fireIntervalRef.current) clearInterval(fireIntervalRef.current)
      return
    }
    const trigger = () => {
      if (!audioCtxRef.current || audioCtxRef.current.state === 'closed') {
        audioCtxRef.current = new AudioContext()
      }
      playTone(firing.tone, audioCtxRef.current)
      if (navigator.vibrate) navigator.vibrate([300, 100, 300, 100, 300])
    }
    trigger()
    fireIntervalRef.current = setInterval(trigger, 4000)
    return () => { if (fireIntervalRef.current) clearInterval(fireIntervalRef.current) }
  }, [firing])

  const previewTone = useCallback((toneId: ToneId) => {
    if (!audioCtxRef.current || audioCtxRef.current.state === 'closed') {
      audioCtxRef.current = new AudioContext()
    }
    playTone(toneId, audioCtxRef.current)
  }, [])

  const dismissFiring = () => {
    if (fireIntervalRef.current) clearInterval(fireIntervalRef.current)
    if (snoozeTimerRef.current) clearTimeout(snoozeTimerRef.current)
    setSnoozed(false)
    setFiring(null)
  }

  const snoozeFiring = () => {
    if (fireIntervalRef.current) clearInterval(fireIntervalRef.current)
    setSnoozed(true)
    setFiring(null)
    // Re-fire after 5 minutes
    snoozeTimerRef.current = setTimeout(() => {
      if (firing) {
        setSnoozed(false)
        setFiring(firing)
      }
    }, 5 * 60 * 1000)
  }

  const openNew = () => {
    if (alarms.length >= 3) return
    setEditing(-1)
    setEditH12(7)
    setEditAmPm('AM')
    setEditMinute(0)
    setEditLabel('')
    setEditTone('pulse')
    setEditRepeat('once')
  }

  const openEdit = (a: Alarm) => {
    const { h12, ampm } = to12(a.hour)
    setEditing(a.id)
    setEditH12(h12)
    setEditAmPm(ampm)
    setEditMinute(a.minute)
    setEditLabel(a.label)
    setEditTone(a.tone)
    setEditRepeat(a.repeat)
  }

  const saveAlarm = () => {
    const hour24 = to24(editH12, editAmPm)
    if (editing === -1) {
      setAlarms(prev => [...prev, {
        id: Date.now(), hour: hour24, minute: editMinute,
        label: editLabel || 'Alarm', tone: editTone,
        enabled: true, fired: false, repeat: editRepeat,
      }])
    } else {
      setAlarms(prev => prev.map(a => a.id === editing
        ? { ...a, hour: hour24, minute: editMinute, label: editLabel || 'Alarm', tone: editTone, fired: false, repeat: editRepeat }
        : a
      ))
    }
    setEditing(null)
  }

  const deleteAlarm = (id: number) => setAlarms(prev => prev.filter(a => a.id !== id))
  const toggleAlarm = (id: number) => setAlarms(prev => prev.map(a => a.id === id ? { ...a, enabled: !a.enabled, fired: false } : a))

  // Clock face
  const sec = now.getSeconds()
  const min = now.getMinutes()
  const hr = now.getHours() % 12
  const secDeg = sec * 6
  const minDeg = min * 6 + sec * 0.1
  const hrDeg = hr * 30 + min * 0.5

  const bg = isDark ? '#0A0F1E' : '#ffffff'
  const sheetBorder = isDark ? '1px solid rgba(255,255,255,0.08)' : '1px solid rgba(15,17,38,0.08)'

  const repeatLabel = (r: RepeatMode) => r === 'once' ? 'Once' : r === 'daily' ? 'Daily' : 'Weekdays'

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-40"
            style={{ background: 'rgba(5,9,18,0.6)', backdropFilter: 'blur(6px)' }}
            onClick={onClose}
          />
          <motion.div
            initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
            transition={{ type: 'spring', stiffness: 320, damping: 32 }}
            className="fixed bottom-0 left-0 right-0 z-50 rounded-t-3xl overflow-hidden"
            style={{ background: bg, paddingBottom: 'max(2rem, env(safe-area-inset-bottom, 2rem))', maxHeight: '94dvh', borderTop: sheetBorder }}
          >
            <div className="flex justify-center pt-3 pb-1">
              <div className="w-10 h-1 rounded-full" style={{ background: isDark ? '#1E293B' : '#E2E8F0' }} />
            </div>

            <div className="overflow-y-auto px-4" style={{ maxHeight: 'calc(94dvh - 2rem)' }}>

              {/* Header */}
              <div className="flex items-center justify-between mb-4 mt-2">
                <div>
                  <h2 className="font-display font-extrabold text-xl" style={{ color: textPrimary }}>Alarm Clock</h2>
                  <p className="text-[11px] font-body mt-0.5" style={{ color: textSecondary }}>Up to 3 alarms · Courtesy feature</p>
                </div>
                <motion.button whileTap={{ scale: 0.9 }} onClick={onClose}
                  className="w-9 h-9 rounded-2xl flex items-center justify-center"
                  style={{ background: isDark ? 'rgba(255,255,255,0.06)' : '#F1F5F9' }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                    <path d="M18 6L6 18M6 6l12 12" stroke={textSecondary} strokeWidth="2" strokeLinecap="round" />
                  </svg>
                </motion.button>
              </div>

              {/* Analog Clock */}
              <div className="flex justify-center mb-5">
                <div className="relative" style={{ width: 180, height: 180 }}>
                  <svg width="180" height="180" viewBox="0 0 180 180">
                    <circle cx="90" cy="90" r="88" fill={isDark ? '#0F172A' : '#F8FAFC'} stroke={isDark ? 'rgba(255,255,255,0.08)' : 'rgba(15,23,42,0.1)'} strokeWidth="1.5" />
                    {Array.from({ length: 12 }).map((_, i) => {
                      const a = (i * 30 - 90) * (Math.PI / 180)
                      return <line key={i} x1={90 + 74 * Math.cos(a)} y1={90 + 74 * Math.sin(a)} x2={90 + 82 * Math.cos(a)} y2={90 + 82 * Math.sin(a)} stroke={isDark ? 'rgba(255,255,255,0.3)' : 'rgba(15,23,42,0.25)'} strokeWidth="2.5" strokeLinecap="round" />
                    })}
                    {Array.from({ length: 60 }).map((_, i) => {
                      if (i % 5 === 0) return null
                      const a = (i * 6 - 90) * (Math.PI / 180)
                      return <line key={i} x1={90 + 78 * Math.cos(a)} y1={90 + 78 * Math.sin(a)} x2={90 + 82 * Math.cos(a)} y2={90 + 82 * Math.sin(a)} stroke={isDark ? 'rgba(255,255,255,0.1)' : 'rgba(15,23,42,0.1)'} strokeWidth="1" strokeLinecap="round" />
                    })}
                    <line x1="90" y1="90" x2={90 + 48 * Math.cos((hrDeg - 90) * Math.PI / 180)} y2={90 + 48 * Math.sin((hrDeg - 90) * Math.PI / 180)} stroke={isDark ? '#E2E8F0' : '#0F172A'} strokeWidth="4" strokeLinecap="round" />
                    <line x1="90" y1="90" x2={90 + 66 * Math.cos((minDeg - 90) * Math.PI / 180)} y2={90 + 66 * Math.sin((minDeg - 90) * Math.PI / 180)} stroke={isDark ? '#CBD5E1' : '#334155'} strokeWidth="2.5" strokeLinecap="round" />
                    <line x1="90" y1="90" x2={90 + 72 * Math.cos((secDeg - 90) * Math.PI / 180)} y2={90 + 72 * Math.sin((secDeg - 90) * Math.PI / 180)} stroke="#EF4444" strokeWidth="1.5" strokeLinecap="round" />
                    <circle cx="90" cy="90" r="4" fill="#EF4444" />
                    <circle cx="90" cy="90" r="2" fill={isDark ? '#0F172A' : '#F8FAFC'} />
                  </svg>
                  <div className="absolute bottom-3 left-0 right-0 flex justify-center">
                    <span className="font-display font-bold tabular-nums" style={{ fontSize: 13, color: textSecondary }}>
                      {fmt12(now.getHours(), now.getMinutes())}
                    </span>
                  </div>
                </div>
              </div>

              {/* Snooze banner */}
              <AnimatePresence>
                {snoozed && (
                  <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                    className="mb-3 overflow-hidden">
                    <div className="rounded-2xl px-4 py-3 flex items-center justify-between"
                      style={{ background: 'rgba(37,99,235,0.08)', border: '1px solid rgba(37,99,235,0.2)' }}>
                      <p className="text-[11px] font-display font-bold" style={{ color: '#3B82F6' }}>⏱ Snoozed · Re-fires in 5 min</p>
                      <motion.button whileTap={{ scale: 0.9 }} onClick={() => { setSnoozed(false); if (snoozeTimerRef.current) clearTimeout(snoozeTimerRef.current) }}
                        className="text-[9px] font-display font-bold tracking-widest px-2 py-1 rounded-lg"
                        style={{ background: 'rgba(37,99,235,0.15)', color: '#3B82F6' }}>
                        CANCEL
                      </motion.button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Alarms list */}
              <div className="mb-3">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-[9px] font-display font-bold tracking-widest" style={{ color: labelColor }}>YOUR ALARMS</p>
                  {alarms.length < 3 && (
                    <motion.button whileTap={{ scale: 0.92 }} onClick={openNew}
                      className="flex items-center gap-1.5 px-3 h-8 rounded-xl font-display font-bold text-[10px] tracking-widest"
                      style={{ background: 'rgba(37,99,235,0.1)', color: '#3B82F6' }}>
                      <svg width="10" height="10" viewBox="0 0 24 24" fill="none">
                        <path d="M12 5v14M5 12h14" stroke="#3B82F6" strokeWidth="2.5" strokeLinecap="round" />
                      </svg>
                      ADD ALARM
                    </motion.button>
                  )}
                </div>

                {alarms.length === 0 && (
                  <div className="rounded-2xl px-4 py-6 text-center" style={{ background: surface, border: surfaceBorder }}>
                    <p className="text-2xl mb-2">⏰</p>
                    <p className="text-[12px] font-display font-bold" style={{ color: textSecondary }}>No alarms set</p>
                    <p className="text-[10px] font-body mt-1" style={{ color: isDark ? '#334155' : '#CBD5E1' }}>Tap ADD ALARM to get started</p>
                  </div>
                )}

                <div className="flex flex-col gap-2">
                  {alarms.map(a => (
                    <motion.div key={a.id} layout
                      className="rounded-2xl px-4 py-3 flex items-center justify-between"
                      style={{ background: surface, border: a.enabled ? (isDark ? '1px solid rgba(37,99,235,0.2)' : '1px solid rgba(37,99,235,0.15)') : surfaceBorder }}>
                      <motion.button whileTap={{ scale: 0.97 }} onClick={() => openEdit(a)} className="flex-1 text-left">
                        <p className="font-display font-extrabold text-2xl tabular-nums leading-none" style={{ color: a.enabled ? textPrimary : isDark ? '#334155' : '#CBD5E1' }}>
                          {fmt12(a.hour, a.minute)}
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-[10px] font-body" style={{ color: textSecondary }}>{a.label}</span>
                          <span className="text-[9px]">{TONES.find(t => t.id === a.tone)?.emoji}</span>
                          <span className="text-[9px] font-display font-bold px-1.5 py-0.5 rounded-md"
                            style={{ background: isDark ? 'rgba(255,255,255,0.06)' : '#F1F5F9', color: textSecondary }}>
                            {repeatLabel(a.repeat)}
                          </span>
                        </div>
                      </motion.button>
                      <div className="flex items-center gap-3">
                        <motion.button whileTap={{ scale: 0.85 }} onClick={() => deleteAlarm(a.id)}
                          className="w-7 h-7 rounded-xl flex items-center justify-center"
                          style={{ background: isDark ? 'rgba(239,68,68,0.1)' : '#FFF1F2' }}>
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
                            <path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6" stroke="#EF4444" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                        </motion.button>
                        <motion.button whileTap={{ scale: 0.9 }} onClick={() => toggleAlarm(a.id)}
                          className="relative rounded-full transition-colors"
                          style={{ width: 44, height: 26, background: a.enabled ? '#2563EB' : (isDark ? 'rgba(255,255,255,0.1)' : '#E2E8F0') }}>
                          <motion.div
                            animate={{ x: a.enabled ? 20 : 2 }}
                            transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                            className="absolute top-1 w-5 h-5 rounded-full bg-white shadow-sm"
                          />
                        </motion.button>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>

              {/* Edit / New alarm */}
              <AnimatePresence>
                {editing !== null && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }}
                    className="rounded-3xl px-4 py-5 mb-4"
                    style={{ background: isDark ? '#0F172A' : '#F8FAFC', border: isDark ? '1px solid rgba(255,255,255,0.08)' : '1px solid rgba(15,23,42,0.08)' }}
                  >
                    <p className="text-[9px] font-display font-bold tracking-widest mb-4" style={{ color: labelColor }}>
                      {editing === -1 ? 'NEW ALARM' : 'EDIT ALARM'}
                    </p>

                    {/* 12-hour time picker */}
                    <div className="flex items-center justify-center gap-3 mb-4">
                      {/* Hour */}
                      <div className="flex flex-col items-center gap-1">
                        <motion.button whileTap={{ scale: 0.85 }} onClick={() => setEditH12(h => h === 12 ? 1 : h + 1)}
                          className="w-10 h-8 rounded-xl flex items-center justify-center"
                          style={{ background: isDark ? 'rgba(255,255,255,0.06)' : '#E2E8F0' }}>
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none"><path d="M18 15l-6-6-6 6" stroke={textSecondary} strokeWidth="2" strokeLinecap="round" /></svg>
                        </motion.button>
                        <span className="font-display font-extrabold text-4xl tabular-nums w-14 text-center" style={{ color: textPrimary }}>{pad(editH12)}</span>
                        <motion.button whileTap={{ scale: 0.85 }} onClick={() => setEditH12(h => h === 1 ? 12 : h - 1)}
                          className="w-10 h-8 rounded-xl flex items-center justify-center"
                          style={{ background: isDark ? 'rgba(255,255,255,0.06)' : '#E2E8F0' }}>
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none"><path d="M6 9l6 6 6-6" stroke={textSecondary} strokeWidth="2" strokeLinecap="round" /></svg>
                        </motion.button>
                      </div>

                      <span className="font-display font-extrabold text-4xl" style={{ color: textPrimary }}>:</span>

                      {/* Minute */}
                      <div className="flex flex-col items-center gap-1">
                        <motion.button whileTap={{ scale: 0.85 }} onClick={() => setEditMinute(m => (m + 5) % 60)}
                          className="w-10 h-8 rounded-xl flex items-center justify-center"
                          style={{ background: isDark ? 'rgba(255,255,255,0.06)' : '#E2E8F0' }}>
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none"><path d="M18 15l-6-6-6 6" stroke={textSecondary} strokeWidth="2" strokeLinecap="round" /></svg>
                        </motion.button>
                        <span className="font-display font-extrabold text-4xl tabular-nums w-14 text-center" style={{ color: textPrimary }}>{pad(editMinute)}</span>
                        <motion.button whileTap={{ scale: 0.85 }} onClick={() => setEditMinute(m => (m - 5 + 60) % 60)}
                          className="w-10 h-8 rounded-xl flex items-center justify-center"
                          style={{ background: isDark ? 'rgba(255,255,255,0.06)' : '#E2E8F0' }}>
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none"><path d="M6 9l6 6 6-6" stroke={textSecondary} strokeWidth="2" strokeLinecap="round" /></svg>
                        </motion.button>
                      </div>

                      {/* AM/PM toggle */}
                      <div className="flex flex-col gap-2 ml-1">
                        <motion.button whileTap={{ scale: 0.9 }} onClick={() => setEditAmPm('AM')}
                          className="font-display font-bold text-sm px-3 py-2 rounded-xl"
                          style={{ background: editAmPm === 'AM' ? '#2563EB' : (isDark ? 'rgba(255,255,255,0.06)' : '#E2E8F0'), color: editAmPm === 'AM' ? '#fff' : textSecondary }}>
                          AM
                        </motion.button>
                        <motion.button whileTap={{ scale: 0.9 }} onClick={() => setEditAmPm('PM')}
                          className="font-display font-bold text-sm px-3 py-2 rounded-xl"
                          style={{ background: editAmPm === 'PM' ? '#2563EB' : (isDark ? 'rgba(255,255,255,0.06)' : '#E2E8F0'), color: editAmPm === 'PM' ? '#fff' : textSecondary }}>
                          PM
                        </motion.button>
                      </div>
                    </div>

                    {/* Label */}
                    <input
                      type="text" placeholder="Label (e.g. Med Pass, Break End)"
                      value={editLabel} onChange={e => setEditLabel(e.target.value)}
                      className="w-full rounded-2xl px-4 py-3 text-sm font-body mb-3 focus:outline-none"
                      style={{ background: surface, border: surfaceBorder, color: textPrimary }}
                    />

                    {/* Repeat */}
                    <p className="text-[9px] font-display font-bold tracking-widest mb-2" style={{ color: labelColor }}>REPEAT</p>
                    <div className="flex gap-2 mb-3">
                      {REPEATS.map(r => (
                        <motion.button key={r.id} whileTap={{ scale: 0.9 }} onClick={() => setEditRepeat(r.id)}
                          className="flex-1 py-2 rounded-xl font-display font-bold text-[10px] tracking-wide"
                          style={{
                            background: editRepeat === r.id ? 'rgba(37,99,235,0.15)' : (isDark ? 'rgba(255,255,255,0.05)' : '#F1F5F9'),
                            border: editRepeat === r.id ? '1px solid rgba(37,99,235,0.3)' : '1px solid transparent',
                            color: editRepeat === r.id ? '#3B82F6' : textSecondary,
                          }}>
                          {r.label}
                        </motion.button>
                      ))}
                    </div>

                    {/* Tone */}
                    <p className="text-[9px] font-display font-bold tracking-widest mb-2" style={{ color: labelColor }}>TONE</p>
                    <div className="flex gap-2 flex-wrap mb-4">
                      {TONES.map(t => (
                        <motion.button key={t.id} whileTap={{ scale: 0.9 }}
                          onClick={() => { setEditTone(t.id); previewTone(t.id) }}
                          className="flex items-center gap-1.5 px-3 py-2 rounded-xl font-display font-bold text-[10px] tracking-wide"
                          style={{
                            background: editTone === t.id ? 'rgba(37,99,235,0.15)' : (isDark ? 'rgba(255,255,255,0.05)' : '#F1F5F9'),
                            border: editTone === t.id ? '1px solid rgba(37,99,235,0.3)' : '1px solid transparent',
                            color: editTone === t.id ? '#3B82F6' : textSecondary,
                          }}>
                          <span>{t.emoji}</span> {t.label}
                        </motion.button>
                      ))}
                    </div>

                    <div className="flex gap-2">
                      <motion.button whileTap={{ scale: 0.97 }} onClick={saveAlarm}
                        className="flex-1 py-3 rounded-2xl font-display font-bold text-xs tracking-widest text-white"
                        style={{ background: '#2563EB' }}>
                        {editing === -1 ? 'ADD ALARM' : 'SAVE ALARM'}
                      </motion.button>
                      <motion.button whileTap={{ scale: 0.97 }} onClick={() => setEditing(null)}
                        className="flex-1 py-3 rounded-2xl font-display font-bold text-xs tracking-widest"
                        style={{ background: surface, border: surfaceBorder, color: textSecondary }}>
                        CANCEL
                      </motion.button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <motion.button whileTap={{ scale: 0.97 }} onClick={onClose}
                className="w-full mb-2 py-4 rounded-2xl font-display font-bold text-xs tracking-widest text-white"
                style={{ background: '#0a0a14' }}>
                CLOSE
              </motion.button>
            </div>
          </motion.div>

          {/* Firing overlay */}
          <AnimatePresence>
            {firing && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }}
                className="fixed inset-0 z-[60] flex items-center justify-center px-6"
                style={{ background: 'rgba(5,9,18,0.85)', backdropFilter: 'blur(12px)' }}
              >
                <div className="rounded-3xl px-6 py-8 text-center w-full max-w-sm"
                  style={{ background: '#0F172A', border: '1px solid rgba(37,99,235,0.3)' }}>
                  <motion.div
                    animate={{ scale: [1, 1.15, 1] }}
                    transition={{ repeat: Infinity, duration: 1 }}
                    className="text-5xl mb-4"
                  >
                    ⏰
                  </motion.div>
                  <p className="font-display font-extrabold text-3xl text-white tabular-nums mb-1">
                    {fmt12(firing.hour, firing.minute)}
                  </p>
                  <p className="font-display font-bold text-base text-blue-400 mb-2">{firing.label}</p>
                  <p className="text-[10px] font-display font-bold tracking-widest mb-6" style={{ color: '#475569' }}>
                    {repeatLabel(firing.repeat).toUpperCase()}
                  </p>
                  <div className="flex gap-3">
                    <motion.button whileTap={{ scale: 0.95 }} onClick={snoozeFiring}
                      className="flex-1 py-4 rounded-2xl font-display font-bold text-sm tracking-widest"
                      style={{ background: 'rgba(255,255,255,0.08)', color: '#94A3B8', border: '1px solid rgba(255,255,255,0.1)' }}>
                      SNOOZE 5 MIN
                    </motion.button>
                    <motion.button whileTap={{ scale: 0.95 }} onClick={dismissFiring}
                      className="flex-1 py-4 rounded-2xl font-display font-bold text-sm tracking-widest text-white"
                      style={{ background: 'linear-gradient(135deg, #1D4ED8, #3B82F6)', boxShadow: '0 8px 24px rgba(37,99,235,0.4)' }}>
                      DISMISS
                    </motion.button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </>
      )}
    </AnimatePresence>
  )
}
