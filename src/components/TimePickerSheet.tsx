import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { to24hr, parse24hr } from '../lib/timeFormat'

interface TimePickerSheetProps {
  isOpen: boolean
  title: string
  value: string
  accentColor: string
  onClose: () => void
  onConfirm: (time24: string) => void
}

const HOURS   = Array.from({ length: 12 }, (_, i) => (i + 1).toString())
const MINUTES = Array.from({ length: 60 }, (_, i) => i.toString().padStart(2, '0'))
const AMPM    = ['AM', 'PM']

function pad(n: string) { return n.padStart(2, '0') }

interface SpinnerProps {
  items: string[]
  selected: string
  onChange: (v: string) => void
  label: string
  accentColor: string
  wide?: boolean
}

function Spinner({ items, selected, onChange, label, accentColor, wide }: SpinnerProps) {
  const idx = items.indexOf(selected)

  const prev = () => {
    const next = (idx - 1 + items.length) % items.length
    onChange(items[next])
  }
  const next = () => {
    const n = (idx + 1) % items.length
    onChange(items[n])
  }

  return (
    <div className="flex flex-col items-center gap-1" style={{ minWidth: wide ? 72 : 60 }}>
      <span className="text-[9px] font-display font-bold tracking-widest text-slate-400 uppercase mb-1">
        {label}
      </span>

      {/* Up button */}
      <motion.button
        whileTap={{ scale: 0.85 }}
        onClick={prev}
        className="w-full flex items-center justify-center rounded-2xl py-2"
        style={{ background: 'rgba(15,23,42,0.05)' }}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
          <path d="M18 15l-6-6-6 6" stroke="#94A3B8" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </motion.button>

      {/* Value display */}
      <div
        className="w-full flex items-center justify-center rounded-2xl py-3"
        style={{ background: `${accentColor}12`, border: `1.5px solid ${accentColor}30` }}
      >
        <span
          className="font-display font-extrabold tabular-nums"
          style={{ fontSize: wide ? '1.6rem' : '1.8rem', color: accentColor, lineHeight: 1 }}
        >
          {selected}
        </span>
      </div>

      {/* Down button */}
      <motion.button
        whileTap={{ scale: 0.85 }}
        onClick={next}
        className="w-full flex items-center justify-center rounded-2xl py-2"
        style={{ background: 'rgba(15,23,42,0.05)' }}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
          <path d="M6 9l6 6 6-6" stroke="#94A3B8" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </motion.button>
    </div>
  )
}

export default function TimePickerSheet({
  isOpen, title, value, accentColor, onClose, onConfirm,
}: TimePickerSheetProps) {
  const [hour,   setHour]   = useState('10')
  const [minute, setMinute] = useState('45')
  const [ampm,   setAmpm]   = useState('PM')

  useEffect(() => {
    if (isOpen) {
      const parsed = parse24hr(value)
      setHour(parsed.hour)
      setMinute(parsed.minute)
      setAmpm(parsed.ampm)
    }
  }, [value, isOpen])

  const handleConfirm = () => {
    onConfirm(to24hr(hour, minute, ampm))
    onClose()
  }

  const displayTime = `${pad(hour)}:${minute} ${ampm}`

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            transition={{ duration: 0.35 }}
            className="fixed inset-0 z-40"
            style={{ background: 'rgba(15,23,42,0.5)', backdropFilter: 'blur(4px)' }}
            onClick={onClose}
          />

          <motion.div
            initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
            transition={{ type: 'spring', stiffness: 320, damping: 32 }}
            className="fixed bottom-0 left-0 right-0 z-50 bg-white rounded-t-3xl"
            style={{ paddingBottom: 'max(2rem, env(safe-area-inset-bottom, 2rem))' }}
          >
            <div className="flex justify-center pt-3 pb-1">
              <div className="w-10 h-1 bg-slate-200 rounded-full" />
            </div>

            <div className="px-6 pt-3 pb-4 text-center">
              <p className="text-[10px] font-display font-bold tracking-widest text-slate-400 uppercase">{title}</p>
              <p className="font-display font-bold text-2xl mt-1" style={{ color: accentColor }}>
                {displayTime}
              </p>
            </div>

            <div className="mx-6 h-px bg-slate-100 mb-4" />

            {/* Tap spinners */}
            <div className="flex items-center justify-center gap-3 px-6 mb-6">
              <Spinner items={HOURS}   selected={hour}   onChange={setHour}   label="Hour"  accentColor={accentColor} />
              <div className="mt-8">
                <span className="font-display font-bold text-3xl text-slate-300">:</span>
              </div>
              <Spinner items={MINUTES} selected={minute} onChange={setMinute} label="Min"   accentColor={accentColor} />
              <div className="mt-8 w-2" />
              <Spinner items={AMPM}    selected={ampm}   onChange={setAmpm}   label="AM/PM" accentColor={accentColor} wide />
            </div>

            <div className="px-6 flex gap-3">
              <motion.button
                whileTap={{ scale: 0.97 }} onClick={onClose}
                className="flex-1 py-3.5 rounded-2xl border border-slate-200 text-slate-500 font-display font-bold text-xs tracking-widest"
              >
                CANCEL
              </motion.button>
              <motion.button
                whileTap={{ scale: 0.97 }} onClick={handleConfirm}
                className="flex-[2] py-3.5 rounded-2xl text-white font-display font-bold text-xs tracking-widest shadow-lg"
                style={{ background: accentColor }}
              >
                SET TIME
              </motion.button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
