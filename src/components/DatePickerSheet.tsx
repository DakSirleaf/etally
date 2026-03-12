import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import WheelPicker from './WheelPicker'

interface DatePickerSheetProps {
  isOpen: boolean
  value: string
  onClose: () => void
  onConfirm: (date: string) => void
}

const MONTHS = [
  '01','02','03','04','05','06',
  '07','08','09','10','11','12'
]

const MONTH_NAMES: Record<string, string> = {
  '01':'JAN','02':'FEB','03':'MAR','04':'APR',
  '05':'MAY','06':'JUN','07':'JUL','08':'AUG',
  '09':'SEP','10':'OCT','11':'NOV','12':'DEC'
}

const DAYS = Array.from({ length: 31 }, (_, i) => (i + 1).toString().padStart(2, '0'))

const currentYear = new Date().getFullYear()
const YEARS = Array.from({ length: 5 }, (_, i) => (currentYear - 1 + i).toString())

export default function DatePickerSheet({ isOpen, value, onClose, onConfirm }: DatePickerSheetProps) {
  const [month, setMonth] = useState('01')
  const [day, setDay] = useState('01')
  const [year, setYear] = useState(currentYear.toString())

  useEffect(() => {
    if (value && value.length === 10) {
      const [y, m, d] = value.split('-')
      setYear(y || currentYear.toString())
      setMonth(m || '01')
      setDay(d || '01')
    }
  }, [value, isOpen])

  const handleConfirm = () => {
    onConfirm(`${year}-${month}-${day}`)
    onClose()
  }

  const displayDate = `${MONTH_NAMES[month]} ${day}, ${year}`

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
            style={{ background: 'rgba(15,23,42,0.5)', backdropFilter: 'blur(4px)' }}
            onClick={onClose}
          />
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', stiffness: 420, damping: 42 }}
            className="fixed bottom-0 left-0 right-0 z-50 bg-white rounded-t-3xl"
            style={{ paddingBottom: 'max(2rem, env(safe-area-inset-bottom, 2rem))' }}
          >
            {/* Handle */}
            <div className="flex justify-center pt-3 pb-1">
              <div className="w-10 h-1 bg-slate-200 rounded-full" />
            </div>

            {/* Title */}
            <div className="px-6 pt-3 pb-4 text-center">
              <p className="text-[10px] font-display font-bold tracking-widest text-slate-400 uppercase">Select Date</p>
              <p className="font-display font-bold text-2xl text-slate-800 mt-1">{displayDate}</p>
            </div>

            <div className="mx-6 h-px bg-slate-100" />

            {/* Wheels */}
            <div className="flex items-center justify-center gap-1 py-4 px-4">
              <WheelPicker items={MONTHS} selected={month} onChange={setMonth} label="Month" />
              <div className="mb-0 mt-6 px-1">
                <span className="font-display font-bold text-xl text-slate-300">/</span>
              </div>
              <WheelPicker items={DAYS} selected={day} onChange={setDay} label="Day" />
              <div className="mb-0 mt-6 px-1">
                <span className="font-display font-bold text-xl text-slate-300">/</span>
              </div>
              <WheelPicker items={YEARS} selected={year} onChange={setYear} label="Year" />
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
                className="flex-[2] py-3.5 rounded-2xl text-white font-display font-bold text-xs tracking-widest"
                style={{ background: '#2563EB' }}
              >
                SET DATE
              </motion.button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
