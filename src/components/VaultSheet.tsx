import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useStore } from '../store/useStore'
import { useTheme } from '../lib/useTheme'
import { formatPeriodRange } from '../lib/payPeriod'
import type { VaultPeriod } from '../types'

interface VaultSheetProps {
  isOpen: boolean
  onClose: () => void
}

function periodRangeStr(period: VaultPeriod): string {
  return formatPeriodRange({ label: '', start: period.start, end: period.end })
}

function formatDate(dateStr: string): string {
  return new Date(dateStr + 'T00:00:00')
    .toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
    .toUpperCase()
}

function to12hr(t: string): string {
  if (!t || t === '--') return '--'
  const [h, m] = t.split(':').map(Number)
  const ampm = h >= 12 ? 'PM' : 'AM'
  return `${h % 12 || 12}:${String(m).padStart(2, '0')} ${ampm}`
}

// ─── Period row ──────────────────────────────────────────────────────────────

function PeriodRow({
  period,
  isDark,
  onClick,
}: {
  period: VaultPeriod
  isDark: boolean
  onClick: () => void
}) {
  const label = period.label ?? periodRangeStr(period)
  const { reg, ot, shifts, callouts } = period.totals
  const total = reg + ot

  return (
    <motion.button
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className="w-full rounded-2xl p-4 text-left mb-3"
      style={{
        background: isDark ? 'rgba(255,255,255,0.04)' : '#F8FAFC',
        border: isDark ? '1px solid rgba(255,255,255,0.07)' : '1px solid #E2E8F0',
      }}
    >
      <div className="flex items-start justify-between mb-3">
        <div>
          <div className="font-display font-bold text-sm" style={{ color: isDark ? '#F1F5F9' : '#0F172A' }}>
            {label}
          </div>
          {period.label && (
            <div className="text-[9px] font-display font-bold tracking-widest mt-0.5 uppercase" style={{ color: isDark ? '#475569' : '#94A3B8' }}>
              {periodRangeStr(period)}
            </div>
          )}
        </div>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="flex-shrink-0 mt-0.5">
          <path d="M9 18l6-6-6-6" stroke={isDark ? '#475569' : '#CBD5E1'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>
      <div className="grid grid-cols-4 gap-2">
        {[
          { label: 'REG', value: reg.toFixed(2), color: '#3B82F6' },
          { label: 'OT', value: ot.toFixed(2), color: '#DB2777' },
          { label: 'TOTAL', value: total.toFixed(2), color: isDark ? '#94A3B8' : '#64748B' },
          { label: 'SHIFTS', value: String(shifts + callouts), color: isDark ? '#94A3B8' : '#64748B' },
        ].map(({ label: l, value, color }) => (
          <div key={l}>
            <div className="text-[8px] font-display font-bold tracking-widest mb-0.5" style={{ color: isDark ? '#475569' : '#94A3B8' }}>{l}</div>
            <div className="font-display font-bold text-sm tabular-nums" style={{ color }}>{value}</div>
          </div>
        ))}
      </div>
    </motion.button>
  )
}

// ─── Detail view ─────────────────────────────────────────────────────────────

function DetailView({
  period,
  isDark,
  surface,
  surfaceBorder,
  textPrimary,
  textSecondary,
  onBack,
  onDelete,
}: {
  period: VaultPeriod
  isDark: boolean
  surface: string
  surfaceBorder: string
  textPrimary: string
  textSecondary: string
  onBack: () => void
  onDelete: () => void
}) {
  const [confirmDelete, setConfirmDelete] = useState(false)
  const label = period.label ?? periodRangeStr(period)
  const sorted = [...period.entries].sort((a, b) => a.date.localeCompare(b.date))

  return (
    <div className="flex flex-col" style={{ minHeight: '60dvh' }}>
      {/* Back + title */}
      <div className="flex items-center gap-3 mb-4">
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={onBack}
          className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{ background: surface, border: surfaceBorder }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
            <path d="M15 18l-6-6 6-6" stroke={textSecondary} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </motion.button>
        <div>
          <h3 className="font-display font-extrabold text-base leading-tight" style={{ color: textPrimary }}>{label}</h3>
          {period.label && (
            <div className="text-[9px] font-display font-bold tracking-widest mt-0.5" style={{ color: textSecondary }}>
              {periodRangeStr(period)}
            </div>
          )}
        </div>
      </div>

      {/* Historical banner */}
      <div
        className="rounded-2xl px-4 py-2.5 mb-4 flex items-center gap-2"
        style={{ background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.25)' }}
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" className="flex-shrink-0">
          <path d="M12 9v4M12 17h.01" stroke="#F59E0B" strokeWidth="2" strokeLinecap="round" />
          <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" stroke="#F59E0B" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        <span className="text-[10px] font-display font-bold tracking-widest text-amber-400">
          HISTORICAL PAY PERIOD — READ ONLY
        </span>
      </div>

      {/* Totals bento */}
      <div className="grid grid-cols-4 gap-2 mb-4">
        {[
          { label: 'REG', value: period.totals.reg.toFixed(2), color: '#3B82F6' },
          { label: 'OT', value: period.totals.ot.toFixed(2), color: '#DB2777' },
          { label: 'TOTAL', value: (period.totals.reg + period.totals.ot).toFixed(2), color: textPrimary },
          { label: 'SHIFTS', value: String(period.totals.shifts + period.totals.callouts), color: textPrimary },
        ].map(({ label, value, color }) => (
          <div key={label} className="rounded-xl p-3" style={{ background: surface, border: surfaceBorder }}>
            <div className="text-[7px] font-display font-bold tracking-widest mb-1" style={{ color: textSecondary }}>{label}</div>
            <div className="font-display font-bold text-sm tabular-nums" style={{ color }}>{value}</div>
          </div>
        ))}
      </div>

      {/* Entries list */}
      <div className="flex-1 overflow-y-auto -mx-5 px-5 mb-4">
        {sorted.length === 0 ? (
          <div className="text-center py-8 font-body text-sm" style={{ color: textSecondary }}>No entries</div>
        ) : (
          sorted.map((entry) => {
            const isOff = entry.reason === 'OFF'
            const isCallout = entry.type === 'CALLOUT'
            return (
              <div
                key={entry.id}
                className="rounded-2xl p-3.5 mb-2.5"
                style={{ background: surface, border: surfaceBorder }}
              >
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-display font-bold tracking-widest" style={{ color: textSecondary }}>
                    {formatDate(entry.date)}
                  </span>
                  {isOff ? (
                    <span className="text-[9px] font-display font-bold tracking-wider px-2 py-1 rounded-lg"
                      style={{ background: isDark ? 'rgba(255,255,255,0.05)' : '#F1F5F9', color: textSecondary }}>
                      DAY OFF
                    </span>
                  ) : isCallout ? (
                    <span className="text-[9px] font-display font-bold tracking-wider px-2 py-1 rounded-lg"
                      style={{ background: 'rgba(217,119,6,0.12)', color: '#F59E0B' }}>
                      CALLOUT
                    </span>
                  ) : (
                    <div className="flex gap-1.5">
                      <span className="text-[9px] font-display font-bold text-blue-400 bg-blue-500/10 px-2 py-1 rounded-lg">
                        R {entry.reg}
                      </span>
                      {parseFloat(entry.ot) > 0 && (
                        <span className="text-[9px] font-display font-bold text-pink-500 bg-pink-500/10 px-2 py-1 rounded-lg">
                          OT {entry.ot}
                        </span>
                      )}
                    </div>
                  )}
                </div>
                {!isOff && (
                  <div className="text-[10px] font-body mt-1.5" style={{ color: textSecondary }}>
                    {isCallout
                      ? entry.calloutPayType ?? entry.reason
                      : `${to12hr(entry.startTime)} – ${to12hr(entry.endTime)} · ${entry.reason}`}
                  </div>
                )}
              </div>
            )
          })
        )}
      </div>

      {/* Delete button */}
      <div className="pt-1">
        {confirmDelete ? (
          <div className="flex gap-2">
            <motion.button
              whileTap={{ scale: 0.97 }}
              onClick={onDelete}
              className="flex-1 py-3.5 rounded-2xl font-display font-bold text-sm tracking-widest text-white"
              style={{ background: '#DC2626' }}
            >
              CONFIRM DELETE
            </motion.button>
            <motion.button
              whileTap={{ scale: 0.97 }}
              onClick={() => setConfirmDelete(false)}
              className="py-3.5 px-5 rounded-2xl font-display font-bold text-sm tracking-widest"
              style={{ background: surface, border: surfaceBorder, color: textSecondary }}
            >
              NO
            </motion.button>
          </div>
        ) : (
          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={() => setConfirmDelete(true)}
            className="w-full py-3.5 rounded-2xl font-display font-bold text-sm tracking-widest"
            style={{ background: 'rgba(220,38,38,0.08)', border: '1px solid rgba(220,38,38,0.2)', color: '#EF4444' }}
          >
            DELETE PERIOD
          </motion.button>
        )}
      </div>
    </div>
  )
}

// ─── Main sheet ──────────────────────────────────────────────────────────────

export default function VaultSheet({ isOpen, onClose }: VaultSheetProps) {
  const vault = useStore((s) => s.vault)
  const deleteVaultPeriod = useStore((s) => s.deleteVaultPeriod)
  const { isDark, surface, surfaceBorder, textPrimary, textSecondary } = useTheme()
  const [selected, setSelected] = useState<VaultPeriod | null>(null)

  const sorted = [...vault].sort((a, b) => b.end.localeCompare(a.end))

  const handleDelete = (id: string) => {
    deleteVaultPeriod(id)
    setSelected(null)
  }

  const handleClose = () => {
    setSelected(null)
    onClose()
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.35 }}
            className="fixed inset-0 z-40"
            style={{ background: 'rgba(5,9,18,0.75)', backdropFilter: 'blur(6px)' }}
            onClick={handleClose}
          />
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', stiffness: 320, damping: 32 }}
            className="fixed bottom-0 left-0 right-0 z-50 rounded-t-3xl flex flex-col"
            style={{
              background: isDark ? '#0A0F1E' : '#FFFFFF',
              paddingBottom: 'max(2rem, env(safe-area-inset-bottom, 2rem))',
              maxHeight: '92dvh',
              borderTop: isDark ? '1px solid rgba(255,255,255,0.08)' : 'none',
            }}
          >
            {/* Handle */}
            <div className="flex justify-center pt-3 pb-1 flex-shrink-0">
              <div className="w-10 h-1 rounded-full" style={{ background: isDark ? '#1E293B' : '#E2E8F0' }} />
            </div>

            <div className="flex-1 overflow-y-auto px-5 pb-4" style={{ minHeight: 0 }}>
              {/* Header */}
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-3">
                  <div
                    className="w-9 h-9 rounded-xl flex items-center justify-center"
                    style={{ background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.15)' }}
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                      <path d="M21 8v13H3V8" stroke="#F59E0B" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                      <path d="M23 3H1v5h22V3z" stroke="#F59E0B" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                      <path d="M10 12h4" stroke="#F59E0B" strokeWidth="1.8" strokeLinecap="round" />
                    </svg>
                  </div>
                  <div>
                    <h2 className="font-display font-extrabold text-lg" style={{ color: textPrimary }}>Vault</h2>
                    <div className="text-[9px] font-display font-bold tracking-widest" style={{ color: textSecondary }}>
                      {vault.length} ARCHIVED {vault.length === 1 ? 'PERIOD' : 'PERIODS'}
                    </div>
                  </div>
                </div>
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  onClick={handleClose}
                  className="text-[10px] font-display font-bold tracking-widest px-3 py-1.5 rounded-xl"
                  style={{ background: surface, border: surfaceBorder, color: textSecondary }}
                >
                  CLOSE
                </motion.button>
              </div>

              <AnimatePresence mode="wait">
                {selected ? (
                  <motion.div
                    key="detail"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    transition={{ duration: 0.35 }}
                  >
                    <DetailView
                      period={selected}
                      isDark={isDark}
                      surface={surface}
                      surfaceBorder={surfaceBorder}
                      textPrimary={textPrimary}
                      textSecondary={textSecondary}
                      onBack={() => setSelected(null)}
                      onDelete={() => handleDelete(selected.id)}
                    />
                  </motion.div>
                ) : (
                  <motion.div
                    key="list"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.35 }}
                  >
                    {sorted.length === 0 ? (
                      <div className="flex flex-col items-center justify-center py-16 text-center">
                        <div
                          className="w-14 h-14 rounded-2xl flex items-center justify-center mb-4"
                          style={{ background: surface, border: surfaceBorder }}
                        >
                          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                            <path d="M21 8v13H3V8" stroke={isDark ? '#334155' : '#CBD5E1'} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                            <path d="M23 3H1v5h22V3z" stroke={isDark ? '#334155' : '#CBD5E1'} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                        </div>
                        <p className="font-display font-bold text-sm tracking-wide" style={{ color: textSecondary }}>
                          VAULT IS EMPTY
                        </p>
                        <p className="font-body text-xs mt-1" style={{ color: isDark ? '#334155' : '#CBD5E1' }}>
                          Completed pay periods will appear here
                        </p>
                      </div>
                    ) : (
                      sorted.map((period) => (
                        <PeriodRow
                          key={period.id}
                          period={period}
                          isDark={isDark}
                          onClick={() => setSelected(period)}
                        />
                      ))
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
