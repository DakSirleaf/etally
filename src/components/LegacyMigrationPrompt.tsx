import { motion, AnimatePresence } from 'framer-motion'
import { useStore } from '../store/useStore'
import { useTheme } from '../lib/useTheme'

export default function LegacyMigrationPrompt() {
  const entries = useStore((s) => s.entries)
  const migrationHandled = useStore((s) => s.migrationHandled)
  const archiveClosedPeriods = useStore((s) => s.archiveClosedPeriods)
  const moveAllActiveToLegacy = useStore((s) => s.moveAllActiveToLegacy)
  const setMigrationHandled = useStore((s) => s.setMigrationHandled)
  const { isDark } = useTheme()

  const show = !migrationHandled && entries.length > 0
  const count = entries.length
  const word = count === 1 ? 'entry' : 'entries'

  const handleSort = () => {
    archiveClosedPeriods()
    setMigrationHandled(true)
  }

  return (
    <AnimatePresence>
      {show && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.35 }}
            className="fixed inset-0 z-[80]"
            style={{ background: 'rgba(5,9,18,0.88)', backdropFilter: 'blur(8px)' }}
          />
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', stiffness: 320, damping: 32 }}
            className="fixed bottom-0 left-0 right-0 z-[90] rounded-t-3xl"
            style={{
              background: isDark ? '#0A0F1E' : '#FFFFFF',
              paddingBottom: 'max(2.5rem, env(safe-area-inset-bottom, 2.5rem))',
              borderTop: isDark ? '1px solid rgba(255,255,255,0.1)' : 'none',
            }}
          >
            <div className="flex justify-center pt-3 pb-1">
              <div className="w-10 h-1 rounded-full" style={{ background: isDark ? '#1E293B' : '#E2E8F0' }} />
            </div>

            <div className="px-5 pt-3 pb-2">
              <div
                className="w-12 h-12 rounded-2xl flex items-center justify-center mb-4"
                style={{ background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.2)' }}
              >
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                  <path d="M21 8v13H3V8" stroke="#F59E0B" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M23 3H1v5h22V3z" stroke="#F59E0B" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M10 12h4" stroke="#F59E0B" strokeWidth="1.8" strokeLinecap="round" />
                </svg>
              </div>

              <h2 className="font-display font-extrabold text-xl text-white tracking-tight mb-1">
                eTally v2.0 — Auto-Vault
              </h2>
              <p className="font-body text-sm text-slate-400 leading-relaxed mb-5">
                You have <span className="font-semibold" style={{ color: isDark ? '#ffffff' : '#0F172A' }}>{count} {word}</span> in your active log. How would you like to handle them?
              </p>

              <div className="flex flex-col gap-3">
                <motion.button
                  whileTap={{ scale: 0.98 }}
                  onClick={handleSort}
                  className="w-full rounded-2xl p-4 text-left"
                  style={{ background: 'rgba(37,99,235,0.12)', border: '1.5px solid rgba(37,99,235,0.25)' }}
                >
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5" style={{ background: 'rgba(37,99,235,0.2)' }}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                        <path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01" stroke="#3B82F6" strokeWidth="2" strokeLinecap="round" />
                      </svg>
                    </div>
                    <div>
                      <div className="font-display font-bold text-sm tracking-wide" style={{ color: '#3B82F6' }}>Sort into historical periods</div>
                      <div className="font-body text-xs text-slate-500 mt-0.5 leading-relaxed">Entries are moved to the Vault grouped by their pay period. Recommended.</div>
                    </div>
                  </div>
                </motion.button>

                <motion.button
                  whileTap={{ scale: 0.98 }}
                  onClick={moveAllActiveToLegacy}
                  className="w-full rounded-2xl p-4 text-left"
                  style={{ background: 'rgba(245,158,11,0.08)', border: '1.5px solid rgba(245,158,11,0.2)' }}
                >
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5" style={{ background: 'rgba(245,158,11,0.1)' }}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                        <path d="M21 8v13H3V8" stroke="#F59E0B" strokeWidth="2" strokeLinecap="round" />
                        <path d="M23 3H1v5h22V3z" stroke="#F59E0B" strokeWidth="2" strokeLinecap="round" />
                      </svg>
                    </div>
                    <div>
                      <div className="font-display font-bold text-sm tracking-wide" style={{ color: '#F59E0B' }}>Keep as one Legacy Log</div>
                      <div className="font-body text-xs text-slate-500 mt-0.5 leading-relaxed">All entries are archived together as a single "Legacy Log" in the Vault.</div>
                    </div>
                  </div>
                </motion.button>

                <motion.button
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setMigrationHandled(true)}
                  className="w-full rounded-2xl p-4 text-left"
                  style={{ background: isDark ? 'rgba(255,255,255,0.03)' : '#F8FAFC', border: isDark ? '1.5px solid rgba(255,255,255,0.07)' : '1.5px solid #E2E8F0' }}
                >
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5" style={{ background: isDark ? 'rgba(255,255,255,0.05)' : '#F1F5F9' }}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                        <path d="M5 12h14" stroke="#64748B" strokeWidth="2" strokeLinecap="round" />
                      </svg>
                    </div>
                    <div>
                      <div className="font-display font-bold text-sm tracking-wide text-slate-400">Leave in active log</div>
                      <div className="font-body text-xs text-slate-500 mt-0.5 leading-relaxed">Keep everything as-is. Auto-Vault will manage future periods going forward.</div>
                    </div>
                  </div>
                </motion.button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
