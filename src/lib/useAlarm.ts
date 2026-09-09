import { useState, useEffect, useRef, useCallback } from 'react'

export interface Alarm {
  id: string
  label: string
  hour: number // 0-23
  minute: number // 0-59
  enabled: boolean
  days?: number[] // 0=Sun, 1=Mon...
}

export function useAlarm() {
  const [alarms, setAlarms] = useState<Alarm[]>(() => {
    try {
      const saved = localStorage.getItem('etally_alarms')
      return saved ? JSON.parse(saved) : []
    } catch {
      return []
    }
  })

  const [firing, setFiring] = useState<Alarm | null>(null)
  const [snoozed, setSnoozed] = useState<Alarm | null>(null)
  const audioCtxRef = useRef<AudioContext | null>(null)
  const oscIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // 1. Save alarms to local storage whenever modified
  useEffect(() => {
    localStorage.setItem('etally_alarms', JSON.stringify(alarms))
  }, [alarms])

  // 2. Initialize and unlock Web Audio API on first user interaction
  useEffect(() => {
    const initAudio = () => {
      if (!audioCtxRef.current) {
        const AudioCtx = window.AudioContext || (window as any).webkitAudioContext
        if (AudioCtx) {
          audioCtxRef.current = new AudioCtx()
        }
      }
      if (audioCtxRef.current && audioCtxRef.current.state === 'suspended') {
        audioCtxRef.current.resume()
      }
    }

    window.addEventListener('touchstart', initAudio, { once: true })
    window.addEventListener('click', initAudio, { once: true })
    return () => {
      window.removeEventListener('touchstart', initAudio)
      window.removeEventListener('click', initAudio)
    }
  }, [])

  // 3. Audio Alarm Beep Synthesizer (No external mp3 files required)
  const startAlarmSound = useCallback(() => {
    if (!audioCtxRef.current) return

    const playBeep = () => {
      try {
        const ctx = audioCtxRef.current
        if (!ctx) return
        if (ctx.state === 'suspended') ctx.resume()

        const osc = ctx.createOscillator()
        const gain = ctx.createGain()

        osc.type = 'sine'
        osc.frequency.setValueAtTime(880, ctx.currentTime) // High pitch A5 tone

        gain.gain.setValueAtTime(0.3, ctx.currentTime)
        gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.4)

        osc.connect(gain)
        gain.connect(ctx.destination)

        osc.start()
        osc.stop(ctx.currentTime + 0.4)
      } catch (e) {
        console.error('Audio play error:', e)
      }
    }

    playBeep()
    setTimeout(playBeep, 200)

    if (oscIntervalRef.current) clearInterval(oscIntervalRef.current)
    oscIntervalRef.current = setInterval(() => {
      playBeep()
      setTimeout(playBeep, 200)
    }, 1000)
  }, [])

  const stopAlarmSound = useCallback(() => {
    if (oscIntervalRef.current) {
      clearInterval(oscIntervalRef.current)
      oscIntervalRef.current = null
    }
  }, [])

  // 4. Background-resilient Timer Worker
  useEffect(() => {
    const workerCode = `
      let timer = null;
      self.onmessage = function(e) {
        if (e.data === 'start') {
          if (!timer) {
            timer = setInterval(() => self.postMessage('tick'), 10000);
          }
        } else if (e.data === 'stop') {
          if (timer) clearInterval(timer);
          timer = null;
        }
      };
    `
    const blob = new Blob([workerCode], { type: 'application/javascript' })
    const worker = new Worker(URL.createObjectURL(blob))

    const checkAlarms = () => {
      const now = new Date()
      const curH = now.getHours()
      const curM = now.getMinutes()
      const curDay = now.getDay()

      if (firing) return

      for (const alarm of alarms) {
        if (!alarm.enabled) continue

        if (alarm.days && alarm.days.length > 0 && !alarm.days.includes(curDay)) {
          continue
        }

        if (alarm.hour === curH && alarm.minute === curM) {
          setFiring(alarm)
          startAlarmSound()

          if ('Notification' in window && Notification.permission === 'granted') {
            new Notification(`⏰ eTally Alarm: ${alarm.label}`, {
              body: `It is ${alarm.hour}:${String(alarm.minute).padStart(2, '0')}. Shift alert!`,
              icon: '/pwa-192x192.png',
            })
          }
          break
        }
      }
    }

    worker.onmessage = () => checkAlarms()
    worker.postMessage('start')
    checkAlarms()

    return () => {
      worker.postMessage('stop')
      worker.terminate()
    }
  }, [alarms, firing, startAlarmSound])

  const dismissFiring = () => {
    stopAlarmSound()
    setFiring(null)
  }

  const snoozeFiring = () => {
    stopAlarmSound()
    if (firing) {
      setSnoozed(firing)
      setFiring(null)
      setTimeout(() => {
        setFiring(firing)
        startAlarmSound()
      }, 5 * 60 * 1000)
    }
  }

  const cancelSnooze = () => {
    setSnoozed(null)
  }

  const previewTone = () => {
    startAlarmSound()
    setTimeout(() => stopAlarmSound(), 1200)
  }

  return {
    alarms,
    setAlarms,
    firing,
    snoozed,
    previewTone,
    dismissFiring,
    snoozeFiring,
    cancelSnooze,
  }
}