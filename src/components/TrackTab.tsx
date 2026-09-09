import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useStore } from '../store/useStore'

export default function TrackTab() {
  const { entries, activeShift, startShift, stopShift } = useStore((s: any) => s)
  const [shiftType, setShiftType] = useState<'REG' | 'OT'>('REG')
  const [note, setNote] = useState('')
  const [elapsedSeconds, setElapsedSeconds] = useState(0)

  useEffect(() => {
    let interval: any = null
    if (activeShift) {
      interval = setInterval(() => {
        const now = Math.floor(Date.now() / 1000)
        const start = Math.floor(new Date(activeShift.startTime).getTime() / 1000)
        setElapsedSeconds(Math.max(0, now - start))
      }, 1000)
    } else {
      setElapsedSeconds(0)
    }
    return () => clearInterval(interval)
  }, [activeShift])

  const formatTimer = (totalSecs: number) => {
    const hrs = Math.floor(totalSecs / 3600)
    const mins = Math.floor((totalSecs % 3600) / 60)
    const secs = totalSecs % 60
    return `${String(hrs).padStart(2, '0')}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`
  }

  const regHours = entries
    ? entries.filter((e: any) => e.type === 'REG').reduce((sum: number, e: any) => sum + (e.hours || 0), 0)
    : 0
  const otHours = entries
    ? entries.filter((e: any) => e.type === 'OT').reduce((sum: number, e: any) => sum + (e.hours || 0), 0)
    : 0

  return (
    <div className="p-4 space-y-4 max-w-md mx-auto pb-24">
      {/* 1. Bento Card: Active Shift & Punch Action */}
      <div className="bento-card rounded-3xl p-5 relative overflow-hidden">
        {activeShift && (
          <div className="absolute -right-10 -top-10 w-40 h-40 bg-orange-500/15 rounded-full blur-2xl pointer-events-none" />
        )}

        <div className="flex items-center justify-between mb-3">
          <span className="text-[10px] font-sans-ui font-extrabold tracking-widest text-slate-400 uppercase">
            {activeShift ? 'Active Shift Running' : 'Shift Tracker'}
          </span>
          {activeShift && (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-orange-500/20 border border-orange-500/40 text-orange-400 text-[10px] font-sans-ui font-bold animate-pulse">
              <span className="w-1.5 h-1.5 rounded-full bg-orange-500" />
              LIVE eCAT SHIFT
            </span>
          )}
        </div>

        <div className="my-4 text-center">
          <p className="numeric-mono font-sans-ui font-black text-5xl tracking-tight text-white">
            {activeShift ? formatTimer(elapsedSeconds) : '00:00:00'}
          </p>
          <p className="text-xs text-slate-400 mt-1 font-body">
            {activeShift
              ? `Started at ${new Date(activeShift.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
              : 'Ready to punch shift into system'}
          </p>
        </div>

        {!activeShift && (
          <div className="grid grid-cols-2 gap-2 p-1 bg-slate-900/90 rounded-2xl border border-slate-800 mb-4">
            <button
              onClick={() => setShiftType('REG')}
              className={`py-2.5 rounded-xl text-xs font-sans-ui font-bold transition-all ${
                shiftType === 'REG'
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              REGULAR (REG)
            </button>
            <button
              onClick={() => setShiftType('OT')}
              className={`py-2.5 rounded-xl text-xs font-sans-ui font-bold transition-all ${
                shiftType === 'OT'
                  ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              OVERTIME (OT)
            </button>
          </div>
        )}

        {activeShift ? (
          <motion.button
            whileTap={{ scale: 0.96 }}
            onClick={() => stopShift()}
            className="w-full py-4 rounded-2xl font-sans-ui font-extrabold text-sm tracking-widest text-white bg-rose-600 shadow-lg shadow-rose-600/30 border border-rose-500/40"
          >
            END & PUNCH SHIFT LOG
          </motion.button>
        ) : (
          <motion.button
            whileTap={{ scale: 0.96 }}
            onClick={() => startShift(shiftType, note)}
            className="w-full py-4 rounded-2xl font-sans-ui font-extrabold text-sm tracking-widest text-white bg-gradient-to-r from-orange-500 to-amber-500 shadow-lg shadow-orange-500/35 border border-orange-400/40"
          >
            PUNCH IN ({shiftType})
          </motion.button>
        )}
      </div>

      {/* 2. Bento Card: Pay Period Totals */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bento-card rounded-2xl p-4 border-l-4 border-l-blue-500">
          <p className="text-[10px] font-sans-ui font-bold tracking-wider text-slate-400">REGULAR HOURS</p>
          <p className="numeric-mono font-sans-ui font-extrabold text-2xl text-blue-400 mt-1">
            {regHours.toFixed(1)} <span className="text-xs text-slate-500">hrs</span>
          </p>
          <div className="w-full bg-slate-800 h-1.5 rounded-full mt-3 overflow-hidden">
            <div
              className="bg-blue-500 h-full rounded-full"
              style={{ width: `${Math.min(100, (regHours / 80) * 100)}%` }}
            />
          </div>
        </div>

        <div className="bento-card rounded-2xl p-4 border-l-4 border-l-emerald-500">
          <p className="text-[10px] font-sans-ui font-bold tracking-wider text-slate-400">OVERTIME HOURS</p>
          <p className="numeric-mono font-sans-ui font-extrabold text-2xl text-emerald-400 mt-1">
            {otHours.toFixed(1)} <span className="text-xs text-slate-500">hrs</span>
          </p>
          <div className="w-full bg-slate-800 h-1.5 rounded-full mt-3 overflow-hidden">
            <div
              className="bg-emerald-500 h-full rounded-full"
              style={{ width: `${Math.min(100, (otHours / 20) * 100)}%` }}
            />
          </div>
        </div>
      </div>

      {/* 3. Bento Card: Floor Notes */}
      <div className="bento-card rounded-2xl p-4 space-y-2">
        <label className="text-[10px] font-sans-ui font-bold text-slate-400 tracking-wider block">
          SHIFT MEMO / FLOOR NOTE
        </label>
        <input
          type="text"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="e.g. Unit 3 North, Med Cart 2..."
          className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900/80 border border-slate-700/70 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-orange-500 transition-colors"
        />
      </div>
    </div>
  )
}