import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { buildDetailSentence } from '../lib/calculations'
import { to12hr } from '../lib/timeFormat'
import { useTheme } from '../lib/useTheme'
import type { LogEntry } from '../types'

interface EntryCardProps {
  entry: LogEntry
  onDelete: (id: number) => void
  onEdit: (entry: LogEntry) => void
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00')
  return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }).toUpperCase()
}

export default function EntryCard({ entry, onDelete, onEdit }: EntryCardProps) {
  const [confirmDelete, setConfirmDelete] = useState(false)
  const { isDark, surface, surfaceBorder, textSecondary, labelColor } = useTheme()

  const isOff = entry.reason === 'OFF'
  const isCallout = entry.type === 'CALLOUT'
  const hasOT = parseFloat(entry.ot) > 0
  const isOTShift = entry.type === 'OT'

  // Color scheme per entry type
  let accentColor = '#2563EB'
  let accentBg = isDark ? 'rgba(37,99,235,0.08)' : 'rgba(37,99,235,0.04)'
  if (isCallout) { accentColor = '#D97706'; accentBg = isDark ? 'rgba(217,119,6,0.08)' : 'rgba(217,119,6,0.04)' }
  else if (isOTShift || hasOT) { accentColor = '#DB2777'; accentBg = isDark ? 'rgba(219,39,119,0.08)' : 'rgba(219,39,119,0.04)' }
  else if (isOff) { accentColor = '#94A3B8'; accentBg = 'transparent' }

  const detail = isCallout
    ? `Callout · ${entry.calloutPayType || entry.reason}`
    : buildDetailSentence({
        ...entry,
        startTime: to12hr(entry.startTime),
        endTime: to12hr(entry.endTime),
        normalEnd: to12hr(entry.normalEnd),
      })

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.96 }}
      className="relative rounded-2xl overflow-hidden mb-2.5"
      style={{
        background: surface,
        border: surfaceBorder,
        boxShadow: isDark ? '0 2px 12px rgba(0,0,0,0.2)' : '0 1px 8px rgba(15,23,42,0.06)',
      }}
    >
      <div className="px-4 py-3.5">
        {/* Top row — date + badges + actions */}
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-[10px] font-display font-bold tracking-widest" style={{ color: isDark ? '#475569' : '#94A3B8' }}>
            {formatDate(entry.date)}
          </span>

          <div className="flex items-center gap-1.5">
            {isOff ? (
              <span className="text-[9px] font-display font-bold tracking-wider px-2 py-1 rounded-lg"
                style={{ background: isDark ? 'rgba(255,255,255,0.06)' : '#F1F5F9', color: isDark ? '#334155' : '#94A3B8' }}>
                DAY OFF
              </span>
            ) : isCallout ? (
              <span className="text-[9px] font-display font-bold tracking-wider px-2 py-1 rounded-lg"
                style={{ background: isDark ? 'rgba(217,119,6,0.12)' : '#FEF3C7', color: '#D97706' }}>
                CALLOUT · {entry.calloutPayType}
              </span>
            ) : (
              <div className="flex gap-1 items-center">
                {parseFloat(entry.reg) > 0 && (
                  <span className="text-[10px] font-display font-bold px-2 py-1 rounded-lg"
                    style={{ background: isDark ? 'rgba(37,99,235,0.12)' : '#EFF6FF', color: '#3B82F6' }}>
                    R {entry.reg}
                  </span>
                )}
                {hasOT && (
                  <span className="text-[10px] font-display font-bold px-2 py-1 rounded-lg"
                    style={{ background: isDark ? 'rgba(219,39,119,0.12)' : '#FDF2F8', color: '#DB2777' }}>
                    OT {entry.ot}
                  </span>
                )}
              </div>
            )}

            <motion.button
              whileTap={{ scale: 0.85 }}
              onClick={() => { setConfirmDelete(false); onEdit(entry) }}
              className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ background: isDark ? 'rgba(148,163,184,0.1)' : '#F8FAFC' }}
              aria-label="Edit entry"
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none">
                <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" stroke="#94A3B8" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" stroke="#94A3B8" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </motion.button>

            <motion.button
              whileTap={{ scale: 0.85 }}
              onClick={() => setConfirmDelete(!confirmDelete)}
              className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ background: confirmDelete ? 'rgba(239,68,68,0.12)' : (isDark ? 'rgba(255,255,255,0.05)' : '#F8FAFC') }}
              aria-label="Delete entry"
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none">
                <path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6" stroke={confirmDelete ? '#F43F5E' : (isDark ? '#475569' : '#94A3B8')} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </motion.button>
          </div>
        </div>

        {/* Detail line */}
        {!isOff && (
          <p className="text-[11px] font-body leading-relaxed" style={{ color: textSecondary }}>{detail}</p>
        )}

        {/* Delete confirmation */}
        <AnimatePresence>
          {confirmDelete && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden"
            >
              <div className="mt-3 pt-3" style={{ borderTop: isDark ? '1px solid rgba(255,255,255,0.06)' : '1px solid #F1F5F9' }}>
                <div className="mb-2">
                  <span className="text-[10px] font-display font-bold tracking-widest" style={{ color: '#F43F5E' }}>DELETE THIS ENTRY?</span>
                  <div className="text-[10px] font-body mt-1" style={{ color: isDark ? '#64748B' : '#94A3B8' }}>
                    {formatDate(entry.date)}
                    {!isOff && !isCallout && (parseFloat(entry.reg) > 0 || parseFloat(entry.ot) > 0) && (
                      <span>
                        {parseFloat(entry.reg) > 0 && ` · ${entry.reg}h REG`}
                        {parseFloat(entry.ot) > 0 && ` · ${entry.ot}h OT`}
                      </span>
                    )}
                    {isCallout && ` · Callout (${entry.calloutPayType})`}
                    {isOff && ' · Day Off'}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <motion.button
                    whileTap={{ scale: 0.92 }}
                    onClick={() => onDelete(entry.id)}
                    className="flex-1 py-2 rounded-xl font-display font-bold text-[10px] tracking-widest text-white"
                    style={{ background: '#EF4444' }}
                  >
                    YES, DELETE
                  </motion.button>
                  <motion.button
                    whileTap={{ scale: 0.92 }}
                    onClick={() => setConfirmDelete(false)}
                    className="flex-1 py-2 rounded-xl font-display font-bold text-[10px] tracking-widest"
                    style={{ background: isDark ? 'rgba(255,255,255,0.06)' : '#F1F5F9', color: isDark ? '#475569' : '#94A3B8' }}
                  >
                    CANCEL
                  </motion.button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  )
}
