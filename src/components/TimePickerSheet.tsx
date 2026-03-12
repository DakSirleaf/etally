import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import WheelPicker from './WheelPicker'
import { to24hr, parse24hr } from '../lib/timeFormat'

interface TimePickerSheetProps {
  isOpen: boolean
  title: string
  value: string        // stored as 24hr "HH:MM"
  accentColor: string
  onClose: () => void
  onConfirm: (time24: string) => void
}

const HOURS   = Array.from({ length: 12 }, (_, i) => (i + 1).toString())
const MINUTES = Array.from({ length: 60 }, (_, i) => i.toString().padStart(2, '0'))
const AMPM    = ['AM', 'PM']

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

  const displayTime = `${hour}:${minute} ${ampm}`

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-40"
            style={{ background: 'rgba(15,23,42,0.5)', backdropFilter: 'blur(4px)' }}
            onClick={onClose}
          />

          {/* Sheet */}
          <motion.div
            initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
            transition={{ type: 'spring', stiffness: 420, damping: 42 }}
            className="fixed bottom-0 left-0 right-0 z-50 bg-white rounded-t-3xl"
            style={{ paddingBottom: 'max(2rem, env(safe-area-inset-bottom, 2rem))' }}
          >
            {/* Handle */}
            <div className="flex justify-center pt-3 pb-1">
              <div className="w-10 h-1 bg-slate-200 rounded-full" />
            </div>

            {/* Title + preview */}
            <div className="px-6 pt-3 pb-4 text-center">
              <p className="text-[10px] font-display font-bold tracking-widest text-slate-400 uppercase">{title}</p>
              <p className="font-display font-bold text-2xl mt-1" style={{ color: accentColor }}>
                {displayTime}
              </p>
            </div>

            <div className="mx-6 h-px bg-slate-100" />

            {/* Wheels: Hour | : | Minute | AM/PM */}
            <div className="flex items-center justify-center gap-1 py-4 px-4">
              <WheelPicker items={HOURS}   selected={hour}   onChange={setHour}   label="Hour" />
              <div className="mt-6 px-0.5">
                <span className="font-display font-bold text-2xl text-slate-300">:</span>
              </div>
              <WheelPicker items={MINUTES} selected={minute} onChange={setMinute} label="Min" />
              <div className="mt-6 px-1" />
              <WheelPicker items={AMPM}    selected={ampm}   onChange={setAmpm}   label="AM/PM" />
            </div>

            {/* Actions */}
            <div className="px-6 pt-2 flex gap-3">
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
