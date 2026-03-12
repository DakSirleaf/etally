import { motion, AnimatePresence } from 'framer-motion'
import { useStore } from '../store/useStore'
import EntryCard from './EntryCard'

const containerVariants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.06 } },
}

const tileVariants = {
  hidden: { opacity: 0, y: 12, scale: 0.97 },
  show: { opacity: 1, y: 0, scale: 1, transition: { type: 'spring', stiffness: 320, damping: 28 } },
}

export default function LogTab() {
  const entries = useStore((s) => s.entries)
  const removeEntry = useStore((s) => s.removeEntry)
  const clearAll = useStore((s) => s.clearAll)

  const sorted = [...entries].sort((a, b) => a.date.localeCompare(b.date))
  const totalReg = entries.reduce((sum, e) => sum + parseFloat(e.reg), 0)
  const totalOT = entries.reduce((sum, e) => sum + parseFloat(e.ot), 0)
  const shiftCount = entries.filter((e) => e.reason !== 'OFF').length
  const offCount = entries.filter((e) => e.reason === 'OFF').length
  const totalHours = totalReg + totalOT

  const handleClear = () => {
    if (window.confirm('Clear all log entries?')) clearAll()
  }

  return (
    <div className="h-full flex flex-col">
      {/* Summary bento grid */}
      <motion.div
        className="px-4 pt-4 pb-3 space-y-3 flex-shrink-0"
        variants={containerVariants}
        initial="hidden"
        animate="show"
      >
        {/* Top row: REG + OT */}
        <div className="grid grid-cols-2 gap-3">
          <motion.div variants={tileVariants} className="bento-tile p-4">
            <span className="text-[9px] font-display font-bold tracking-widest text-slate-400 block mb-1">REGULAR</span>
            <span className="text-3xl font-display font-bold text-blue-600 tabular-nums leading-none">
              {totalReg.toFixed(2)}
            </span>
            <span className="text-[10px] text-slate-400 font-display font-semibold ml-1">hrs</span>
          </motion.div>

          <motion.div variants={tileVariants} className="bento-tile p-4">
            <span className="text-[9px] font-display font-bold tracking-widest text-slate-400 block mb-1">OVERTIME</span>
            <span
              className="text-3xl font-display font-bold tabular-nums leading-none"
              style={{ color: totalOT > 0 ? '#DB2777' : '#CBD5E1' }}
            >
              {totalOT.toFixed(2)}
            </span>
            <span className="text-[10px] text-slate-400 font-display font-semibold ml-1">hrs</span>
          </motion.div>
        </div>

        {/* Bottom row: Total hours + shifts stat */}
        <div className="grid grid-cols-3 gap-3">
          <motion.div variants={tileVariants} className="bento-tile p-3 col-span-2 flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-2xl flex items-center justify-center flex-shrink-0"
              style={{ background: '#F0F9FF' }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="9" stroke="#2563EB" strokeWidth="1.8" />
                <path d="M12 7v5l3 3" stroke="#2563EB" strokeWidth="1.8" strokeLinecap="round" />
              </svg>
            </div>
            <div>
              <span className="text-[9px] font-display font-bold tracking-widest text-slate-400 block">TOTAL HOURS</span>
              <span className="text-xl font-display font-bold text-slate-800 tabular-nums">{totalHours.toFixed(2)}</span>
            </div>
          </motion.div>

          <motion.div variants={tileVariants} className="bento-tile p-3 flex flex-col items-center justify-center">
            <span className="text-2xl font-display font-bold text-slate-800">{shiftCount}</span>
            <span className="text-[9px] font-display font-bold tracking-widest text-slate-400 text-center leading-tight mt-0.5">
              {shiftCount === 1 ? 'SHIFT' : 'SHIFTS'}
            </span>
            {offCount > 0 && (
              <span className="text-[8px] text-slate-300 font-display font-bold mt-0.5">{offCount} OFF</span>
            )}
          </motion.div>
        </div>
      </motion.div>

      {/* List header */}
      <div className="px-4 flex items-center justify-between mb-2 flex-shrink-0">
        <span className="text-[9px] font-display font-bold tracking-widest text-slate-400">
          {entries.length > 0 ? 'SWIPE LEFT TO DELETE' : 'NO ENTRIES YET'}
        </span>
        {entries.length > 0 && (
          <button
            onClick={handleClear}
            className="text-[9px] font-display font-bold tracking-widest text-rose-400 active:text-rose-600 transition-colors"
          >
            CLEAR ALL
          </button>
        )}
      </div>

      {/* Entry list */}
      <div className="flex-1 overflow-y-auto px-4 pb-6">
        <AnimatePresence>
          {sorted.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex flex-col items-center justify-center py-14 text-center"
            >
              <div className="w-16 h-16 rounded-3xl bg-slate-100 flex items-center justify-center mb-4">
                <svg width="26" height="26" viewBox="0 0 24 24" fill="none">
                  <rect x="4" y="3" width="16" height="18" rx="2" stroke="#CBD5E1" strokeWidth="1.5" />
                  <path d="M8 8h8M8 12h8M8 16h5" stroke="#CBD5E1" strokeWidth="1.5" strokeLinecap="round" />
                </svg>
              </div>
              <p className="font-display font-bold text-slate-400 text-sm tracking-widest">NO ENTRIES</p>
              <p className="font-body text-slate-300 text-xs mt-1">Track a shift to get started</p>
            </motion.div>
          ) : (
            sorted.map((entry, i) => (
              <motion.div
                key={entry.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ delay: i * 0.03, duration: 0.22 }}
              >
                <EntryCard entry={entry} onDelete={removeEntry} />
              </motion.div>
            ))
          )}
        </AnimatePresence>

        {entries.length > 0 && (
          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={() => window.print()}
            className="w-full mt-2 py-4 rounded-3xl font-display font-bold text-xs tracking-widest text-emerald-600 border border-emerald-200 bg-white"
          >
            PRINT REPORT
          </motion.button>
        )}
      </div>
    </div>
  )
}
