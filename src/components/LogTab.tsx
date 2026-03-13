import { motion, AnimatePresence } from 'framer-motion'
import { useStore } from '../store/useStore'
import { useTheme } from '../lib/useTheme'
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
  const entries = useStore((s: any) => s.entries)
  const removeEntry = useStore((s: any) => s.removeEntry)
  const clearAll = useStore((s: any) => s.clearAll)
  const { isDark, surface, surfaceBorder, textPrimary, textSecondary, labelColor } = useTheme()

  const sorted = [...entries].sort((a: any, b: any) => a.date.localeCompare(b.date))
  const currentYear = new Date().getFullYear()

  const workEntries = entries.filter((e: any) => e.reason !== 'OFF' && e.type !== 'CALLOUT')
  const totalReg = workEntries.reduce((sum: number, e: any) => sum + parseFloat(e.reg), 0)
  const totalOT = workEntries.reduce((sum: number, e: any) => sum + parseFloat(e.ot), 0)
  const totalHours = totalReg + totalOT
  const shiftCount = workEntries.length
  const offCount = entries.filter((e: any) => e.reason === 'OFF').length

  const calloutEntries = entries.filter((e: any) => e.type === 'CALLOUT')
  const sickCount = calloutEntries.filter((e: any) => e.calloutPayType === 'Sick Time').length
  const vacCount = calloutEntries.filter((e: any) => e.calloutPayType === 'Vacation Time').length
  const alUsedThisYear = entries.filter(
    (e: any) => e.calloutPayType === 'AL Day' && e.date.startsWith(String(currentYear))
  ).length
  const alRemaining = Math.max(0, 3 - alUsedThisYear)

  const handleClear = () => {
    if (window.confirm('Clear all log entries?')) clearAll()
  }

  const tileBg = surface
  const tileBorder = surfaceBorder

  return (
    <div className="h-full flex flex-col">
      {/* Summary bento grid */}
      <motion.div
        className="px-4 pt-4 pb-3 space-y-2 flex-shrink-0"
        variants={containerVariants}
        initial="hidden"
        animate="show"
      >
        {/* REG + OT */}
        <div className="grid grid-cols-2 gap-2">
          <motion.div variants={tileVariants} className="rounded-2xl p-4" style={{ background: tileBg, border: tileBorder }}>
            <span className="text-[9px] font-display font-bold tracking-widest block mb-1" style={{ color: labelColor }}>REGULAR</span>
            <span className="text-3xl font-display font-bold text-blue-500 tabular-nums leading-none">
              {totalReg.toFixed(2)}
            </span>
            <span className="text-[10px] font-display font-semibold ml-1" style={{ color: labelColor }}>hrs</span>
          </motion.div>

          <motion.div variants={tileVariants} className="rounded-2xl p-4" style={{ background: tileBg, border: tileBorder }}>
            <span className="text-[9px] font-display font-bold tracking-widest block mb-1" style={{ color: labelColor }}>OVERTIME</span>
            <span
              className="text-3xl font-display font-bold tabular-nums leading-none"
              style={{ color: totalOT > 0 ? '#DB2777' : isDark ? '#1E293B' : '#CBD5E1' }}
            >
              {totalOT.toFixed(2)}
            </span>
            <span className="text-[10px] font-display font-semibold ml-1" style={{ color: labelColor }}>hrs</span>
          </motion.div>
        </div>

        {/* Total hours + shift count */}
        <div className="grid grid-cols-3 gap-2">
          <motion.div
            variants={tileVariants}
            className="rounded-2xl p-3 col-span-2 flex items-center gap-3"
            style={{ background: tileBg, border: tileBorder }}
          >
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ background: isDark ? 'rgba(37,99,235,0.15)' : '#EFF6FF' }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="9" stroke="#2563EB" strokeWidth="1.8" />
                <path d="M12 7v5l3 3" stroke="#2563EB" strokeWidth="1.8" strokeLinecap="round" />
              </svg>
            </div>
            <div>
              <span className="text-[9px] font-display font-bold tracking-widest block" style={{ color: labelColor }}>TOTAL HOURS</span>
              <span className="text-xl font-display font-bold tabular-nums" style={{ color: textPrimary }}>{totalHours.toFixed(2)}</span>
            </div>
          </motion.div>

          <motion.div
            variants={tileVariants}
            className="rounded-2xl p-3 flex flex-col items-center justify-center"
            style={{ background: tileBg, border: tileBorder }}
          >
            <span className="text-2xl font-display font-bold" style={{ color: textPrimary }}>{shiftCount}</span>
            <span className="text-[9px] font-display font-bold tracking-widest text-center leading-tight mt-0.5" style={{ color: labelColor }}>
              {shiftCount === 1 ? 'SHIFT' : 'SHIFTS'}
            </span>
            {offCount > 0 && (
              <span className="text-[8px] font-display font-bold mt-0.5" style={{ color: isDark ? '#1E293B' : '#CBD5E1' }}>
                {offCount} OFF
              </span>
            )}
          </motion.div>
        </div>

        {/* Callout summary — only show if there are callouts */}
        {calloutEntries.length > 0 && (
          <motion.div
            variants={tileVariants}
            className="rounded-2xl px-4 py-3"
            style={{ background: tileBg, border: tileBorder }}
          >
            <span className="text-[9px] font-display font-bold tracking-widest block mb-2" style={{ color: '#D97706' }}>
              CALLOUTS
            </span>
            <div className="flex gap-3 flex-wrap">
              {sickCount > 0 && (
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-red-400 flex-shrink-0" />
                  <span className="text-[11px] font-display font-bold" style={{ color: textSecondary }}>
                    {sickCount} Sick
                  </span>
                </div>
              )}
              {vacCount > 0 && (
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 flex-shrink-0" />
                  <span className="text-[11px] font-display font-bold" style={{ color: textSecondary }}>
                    {vacCount} Vacation
                  </span>
                </div>
              )}
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-amber-400 flex-shrink-0" />
                <span className="text-[11px] font-display font-bold" style={{ color: textSecondary }}>
                  {alUsedThisYear} AL Used · {alRemaining} Remaining
                </span>
              </div>
            </div>
          </motion.div>
        )}
      </motion.div>

      {/* List header */}
      <div className="px-4 flex items-center justify-between mb-2 flex-shrink-0">
        <span className="text-[9px] font-display font-bold tracking-widest" style={{ color: labelColor }}>
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
              <div
                className="w-16 h-16 rounded-3xl flex items-center justify-center mb-4"
                style={{ background: isDark ? 'rgba(255,255,255,0.05)' : '#F1F5F9' }}
              >
                <svg width="26" height="26" viewBox="0 0 24 24" fill="none">
                  <rect x="4" y="3" width="16" height="18" rx="2" stroke={isDark ? '#1E293B' : '#CBD5E1'} strokeWidth="1.5" />
                  <path d="M8 8h8M8 12h8M8 16h5" stroke={isDark ? '#1E293B' : '#CBD5E1'} strokeWidth="1.5" strokeLinecap="round" />
                </svg>
              </div>
              <p className="font-display font-bold text-sm tracking-widest" style={{ color: isDark ? '#1E293B' : '#94A3B8' }}>NO ENTRIES</p>
              <p className="font-body text-xs mt-1" style={{ color: isDark ? '#0F172A' : '#CBD5E1' }}>Track a shift to get started</p>
            </motion.div>
          ) : (
            sorted.map((entry: any, i: number) => (
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
            className="w-full mt-2 py-4 rounded-3xl font-display font-bold text-xs tracking-widest text-emerald-500"
            style={{
              background: isDark ? 'rgba(16,185,129,0.08)' : 'white',
              border: isDark ? '1px solid rgba(16,185,129,0.2)' : '1px solid #D1FAE5',
            }}
          >
            PRINT REPORT
          </motion.button>
        )}
      </div>
    </div>
  )
}
