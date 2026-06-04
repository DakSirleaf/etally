import { useState, useEffect, useRef, useCallback } from 'react'

export type RepeatMode = 'once' | 'daily' | 'weekdays'
export type ToneId = 'pulse' | 'bell' | 'buzz' | 'chime' | 'alert'

export interface Alarm {
  id: number
  hour: number
  minute: number
  label: string
  tone: ToneId
  enabled: boolean
  fired: boolean
  repeat: RepeatMode
}

export function playTone(toneId: ToneId, ctx: AudioContext) {
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

export function useAlarm() {
  const [alarms, setAlarms] = useState<Alarm[]>([])
  const [firing, setFiring] = useState<Alarm | null>(null)
  const [snoozed, setSnoozed] = useState(false)
  const audioCtxRef = useRef<AudioContext | null>(null)
  const fireIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const snoozeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Warm up AudioContext on first user interaction so it's ready when alarm fires
  useEffect(() => {
    const warmUp = () => {
      if (!audioCtxRef.current) {
        audioCtxRef.current = new AudioContext()
      }
      if (audioCtxRef.current.state === 'suspended') {
        audioCtxRef.current.resume().catch(() => {})
      }
      window.removeEventListener('touchstart', warmUp)
      window.removeEventListener('mousedown', warmUp)
    }
    window.addEventListener('touchstart', warmUp, { passive: true })
    window.addEventListener('mousedown', warmUp, { passive: true })
    return () => {
      window.removeEventListener('touchstart', warmUp)
      window.removeEventListener('mousedown', warmUp)
    }
  }, [])

  // Alarm checker — runs always at app level
  useEffect(() => {
    const check = setInterval(() => {
      const n = new Date()
      const dayOfWeek = n.getDay()
      const isWeekday = dayOfWeek >= 1 && dayOfWeek <= 5

      setAlarms(prev => prev.map(a => {
        if (!a.enabled || a.fired) return a
        if (a.repeat === 'weekdays' && !isWeekday) return a
        if (a.hour === n.getHours() && a.minute === n.getMinutes() && n.getSeconds() === 0) {
          setFiring(a)
          return { ...a, fired: a.repeat === 'once' }
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
    const trigger = async () => {
      try {
        if (!audioCtxRef.current || audioCtxRef.current.state === 'closed') {
          audioCtxRef.current = new AudioContext()
        }
        // Resume if suspended — required after page load without interaction
        if (audioCtxRef.current.state === 'suspended') {
          await audioCtxRef.current.resume()
        }
        playTone(firing.tone, audioCtxRef.current)
      } catch (e) {
        console.warn('Audio play failed:', e)
      }
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
    const currentFiring = firing
    if (fireIntervalRef.current) clearInterval(fireIntervalRef.current)
    setSnoozed(true)
    setFiring(null)
    snoozeTimerRef.current = setTimeout(() => {
      if (currentFiring) {
        setSnoozed(false)
        setFiring(currentFiring)
      }
    }, 5 * 60 * 1000)
  }

  const cancelSnooze = () => {
    setSnoozed(false)
    if (snoozeTimerRef.current) clearTimeout(snoozeTimerRef.current)
  }

  return {
    alarms, setAlarms,
    firing, snoozed,
    previewTone, dismissFiring, snoozeFiring, cancelSnooze,
  }
}
