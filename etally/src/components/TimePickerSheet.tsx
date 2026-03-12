import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import WheelPicker from './WheelPicker'

interface TimePickerSheetProps {
  isOpen: boolean
  title: string
  value: string
  accentColor: string
  onClose: () => void
  onConfirm: (time: string) => void
}

const HOURS = Array.from({ length: 24 }, (_, i) => i.toString().padStart(2, '0'))
const MINUTES = Array.from({ length: 60 }, (_, i) => i.toString().padStart(2, '0'))

export default function TimePickerSheet({
  isOpen,
  title,
  value,
  accentColor,
  onClose,
  onConfirm,
}: TimePickerSheetProps) {
  const [hour, setHour] = useState('22')
  const [minute, setMinute] = useState('45')

  useEffect(() => {
    if (value && value.includes(':')) {
      const [hh, mm] = value.split(':')
      setHour(hh || '22')
      setMinute(mm || '45')
    }
  }, [value, isOpen])

  const handleConfirm = () => {
    onConfirm(`${hour}:${minute}`)
    onClose()
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-40"
            style={{ background: 'rgba(15,23,42,0.5)', backdropFilter: 'blur(4px)' }}
            onClick={onClose}
          />

          {/* Sheet */}
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', stiffness: 420, damping: 42 }}
            className="fixed bottom-0 left-0 right-0 z-50 bg-white rounded-t-3xl"
            style={{ paddingBottom: 'max(2rem, env(safe-area-inset-bottom, 2rem))' }}
          >
            {/* Handle bar */}
            <div className="flex justify-center pt-3 pb-1">
              <div className="w-10 h-1 bg-slate-200 rounded-full" />
            </div>

            {/* Title */}
            <div className="px-6 pt-3 pb-4">
              <p className="text-[10px] font-display font-bold tracking-widest text-slate-400 text-center uppercase">
                {title}
              </p>
              <p
                className="text-center font-display font-bold text-2xl mt-1 tabular-nums"
                style={{ color: accentColor }}
              >
                {hour}:{minute}
              </p>
            </div>

            {/* Divider */}
            <div className="mx-6 h-px bg-slate-100" />

            {/* Wheels */}
            <div className="flex items-center justify-center gap-2 py-4 px-6">
              <WheelPicker
                items={HOURS}
                selected={hour}
                onChange={setHour}
                label="Hour"
              />

              <div className="mb-0 mt-6 px-1">
                <span className="font-display font-bold text-2xl text-slate-300">:</span>
              </div>

              <WheelPicker
                items={MINUTES}
                selected={minute}
                onChange={setMinute}
                label="Min"
              />
            </div>

            {/* Actions */}
            <div className="px-6 pt-2 flex gap-3">
              <motion.button
                whileTap={{ scale: 0.97 }}
                onClick={onClose}
                className="flex-1 py-3.5 rounded-2xl border border-slate-200 text-slate-500 font-display font-bold text-xs tracking-widest"
              >
                CANCEL
              </motion.button>
              <motion.button
                whileTap={{ scale: 0.97 }}
                onClick={handleConfirm}
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
