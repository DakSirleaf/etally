import { motion, AnimatePresence } from 'framer-motion'
import { useStore } from '../store/useStore'
import { useTheme } from '../lib/useTheme'
import type { StaffRole } from '../types'

interface AboutSheetProps {
  isOpen: boolean
  onClose: () => void
}

const roles: { role: StaffRole; label: string; color: string }[] = [
  { role: 'RN', label: 'RN', color: '#3B82F6' },
  { role: 'HST', label: 'HST', color: '#8B5CF6' },
  { role: 'HSA', label: 'HSA', color: '#06B6D4' },
]

export default function AboutSheet({ isOpen, onClose }: AboutSheetProps) {
  const role = useStore((s: any) => s.role) as StaffRole | null
  const setRole = useStore((s: any) => s.setRole)
  const { isDark, surface, surfaceBorder, textPrimary, textSecondary, labelColor } = useTheme()

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
            style={{ background: 'rgba(5,9,18,0.75)', backdropFilter: 'blur(6px)' }}
            onClick={onClose}
          />

          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', stiffness: 420, damping: 42 }}
            className="fixed bottom-0 left-0 right-0 z-50 rounded-t-3xl overflow-hidden"
            style={{
              background: isDark ? '#0A0F1E' : '#FFFFFF',
              paddingBottom: 'max(2rem, env(safe-area-inset-bottom, 2rem))',
              maxHeight: '92dvh',
              borderTop: isDark ? '1px solid rgba(255,255,255,0.08)' : 'none',
            }}
          >
            <div className="flex justify-center pt-3 pb-1">
              <div className="w-10 h-1 rounded-full" style={{ background: isDark ? '#1E293B' : '#E2E8F0' }} />
            </div>

            <div className="overflow-y-auto" style={{ maxHeight: 'calc(92dvh - 2rem)' }}>

              {/* Hero credit block */}
              <div
                className="mx-4 mt-3 mb-4 rounded-3xl px-5 py-6 flex flex-col"
                style={{ background: 'linear-gradient(135deg, #050912 0%, #0F172A 100%)' }}
              >
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h1 className="font-display font-extrabold text-2xl text-white tracking-tight">eTally</h1>
                    <p className="text-[11px] text-blue-400 font-body mt-0.5">A time tracker for eCats</p>
                  </div>
                  <span className="text-[9px] font-display font-bold tracking-widest text-slate-600 bg-slate-800 px-2 py-1 rounded-lg">v2</span>
                </div>
                <div className="h-px bg-slate-800 mb-4" />
                <p className="text-[9px] font-display font-bold tracking-widest text-slate-500 mb-1">DEVELOPED BY</p>
                <p className="font-display font-bold text-lg text-white leading-tight">A. Ace Sirleaf</p>
                <p className="text-[11px] text-blue-400 font-body mt-0.5">Kola Technology Laboratory</p>
                <div className="mt-4 pt-4 border-t border-slate-800">
                  <p className="text-[10px] font-display font-bold tracking-widest text-slate-500 italic">
                    "Dare to build it yourself."
                  </p>
                </div>
              </div>

              {/* Role change */}
              <div className="px-4 mb-4">
                <p className="text-[9px] font-display font-bold tracking-widest mb-3 px-1" style={{ color: labelColor }}>
                  YOUR ROLE
                </p>
                <div className="flex gap-2">
                  {roles.map(({ role: r, label, color }) => (
                    <motion.button
                      key={r}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setRole(r)}
                      className="flex-1 py-3 rounded-2xl font-display font-extrabold text-sm transition-all"
                      style={{
                        background: role === r
                          ? `${color}22`
                          : isDark ? 'rgba(255,255,255,0.04)' : '#F8FAFC',
                        border: role === r ? `1.5px solid ${color}60` : isDark ? '1px solid rgba(255,255,255,0.08)' : '1px solid #E2E8F0',
                        color: role === r ? color : isDark ? '#334155' : '#94A3B8',
                      }}
                    >
                      {label}
                    </motion.button>
                  ))}
                </div>
                <p className="text-[10px] font-body mt-2 px-1" style={{ color: isDark ? '#1E293B' : '#CBD5E1' }}>
                  {role === 'RN'
                    ? 'RN callout coverage: Sick Time or AL Day'
                    : `${role} callout coverage: Sick Time, Vacation Time, or AL Day`}
                </p>
              </div>

              {/* How to use */}
              <div className="px-4 pb-2">
                <p className="text-[9px] font-display font-bold tracking-widest mb-3 px-1" style={{ color: labelColor }}>HOW TO USE</p>
                <div className="space-y-2">
                  {[
                    { step: '01', title: 'Select Shift Type', desc: 'Toggle REGULAR for a scheduled shift, OVERTIME PICKUP for an extra shift where all time is OT, or CALLOUT to log a missed day.', color: '#2563EB' },
                    { step: '02', title: 'Set Your Date', desc: 'Tap the Date tile to open the calendar and select the shift date.', color: '#2563EB' },
                    { step: '03', title: 'Set Start & End Times', desc: 'Tap START or END to open the time wheel. Scroll the drums with your thumb then tap SET TIME.', color: '#2563EB' },
                    { step: '04', title: 'Review Your Hours', desc: 'Regular and Overtime hours calculate automatically. REG shifts: 8.0 hrs max, OT kicks in after 8.5 hrs clock time.', color: '#2563EB' },
                    { step: '05', title: 'Select a Reason', desc: 'Choose the reason from the dropdown — Standard Shift, Late Relief, Patient Care, Mandatory - State of Emergency, etc.', color: '#2563EB' },
                    { step: '06', title: 'Log a Callout', desc: 'Switch to CALLOUT, choose your pay type (Sick Time, Vacation Time, or AL Day based on your role). AL Days are limited to 3 per year.', color: '#D97706' },
                    { step: '07', title: 'Save to Log', desc: 'Tap SAVE TO LOG. Switch to LOG tab to review. Swipe any entry left to delete it.', color: '#2563EB' },
                    { step: '08', title: 'Print Report', desc: 'Tap PRINT REPORT in the Log tab for a full summary of hours, OT, callouts, and AL Days used.', color: '#DB2777' },
                  ].map(({ step, title, desc, color }) => (
                    <div
                      key={step}
                      className="flex gap-3 rounded-2xl px-4 py-3"
                      style={{ background: surface, border: surfaceBorder }}
                    >
                      <span className="font-display font-extrabold text-sm tabular-nums flex-shrink-0 mt-0.5" style={{ color }}>
                        {step}
                      </span>
                      <div>
                        <p className="font-display font-bold text-sm leading-tight" style={{ color: textPrimary }}>{title}</p>
                        <p className="font-body text-[11px] mt-1 leading-relaxed" style={{ color: textSecondary }}>{desc}</p>
                      </div>
                    </div>
                  ))}
                </div>

                <motion.button
                  whileTap={{ scale: 0.97 }}
                  onClick={onClose}
                  className="w-full mt-4 py-4 rounded-2xl font-display font-bold text-xs tracking-widest text-white"
                  style={{ background: '#0F172A' }}
                >
                  CLOSE
                </motion.button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
