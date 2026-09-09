import { motion, AnimatePresence } from 'framer-motion'
import { useStore } from '../store/useStore'

export default function LogTab({ onNavigateToTrack }: { onNavigateToTrack: () => void }) {
  const { entries, deleteEntry } = useStore((s: any) => s)

  if (!entries || entries.length === 0) {
    return (
      <div className="p-6 text-center max-w-md mx-auto pt-16 space-y-4">
        <div className="w-16 h-16 rounded-3xl bg-slate-800/80 border border-slate-700/60 flex items-center justify-center mx-auto text-2xl">
          📋
        </div>
        <h3 className="font-sans-ui font-extrabold text-lg text-white">No Shift Logs Recorded</h3>
        <p className="text-xs text-slate-400 font-body">
          Punch in your first shift on the Tracker tab to populate your pay period log.
        </p>
        <button
          onClick={onNavigateToTrack}
          className="px-5 py-3 rounded-xl bg-blue-600 text-white font-sans-ui font-bold text-xs tracking-wider shadow-lg shadow-blue-600/30"
        >
          GO TO TRACKER
        </button>
      </div>
    )
  }

  return (
    <div className="p-4 space-y-3 max-w-md mx-auto pb-24">
      <div className="flex items-center justify-between px-1 mb-2">
        <h2 className="font-sans-ui font-extrabold text-sm text-white tracking-wide">SHIFT HISTORY LOGS</h2>
        <span className="text-[10px] font-sans-ui font-bold text-slate-400 bg-slate-800 px-2 py-0.5 rounded-full">
          {entries.length} ENTRIES
        </span>
      </div>

      <AnimatePresence>
        {entries.map((entry: any) => (
          <motion.div
            key={entry.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, x: -100 }}
            className="bento-card rounded-2xl p-4 flex items-center justify-between border-l-4"
            style={{
              borderLeftColor: entry.type === 'REG' ? '#3B82F6' : '#10B981',
            }}
          >
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span
                  className={`text-[9px] font-sans-ui font-extrabold px-2 py-0.5 rounded ${
                    entry.type === 'REG'
                      ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                      : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                  }`}
                >
                  {entry.type}
                </span>
                <span className="text-xs font-sans-ui font-bold text-white">
                  {new Date(entry.date).toLocaleDateString([], { month: 'short', day: 'numeric', weekday: 'short' })}
                </span>
              </div>
              <p className="text-[11px] text-slate-400 font-body">{entry.note || 'No shift memo recorded'}</p>
            </div>

            <div className="flex items-center gap-3">
              <div className="text-right">
                <p className="numeric-mono font-sans-ui font-black text-lg text-white">
                  {Number(entry.hours).toFixed(1)} <span className="text-xs text-slate-500 font-normal">hrs</span>
                </p>
              </div>

              <button
                onClick={() => deleteEntry(entry.id)}
                className="w-8 h-8 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400 hover:bg-rose-500/20"
                aria-label="Delete entry"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" />
                </svg>
              </button>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  )
}