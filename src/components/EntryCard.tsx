import { motion, useMotionValue, useTransform, animate } from 'framer-motion'
import { useRef } from 'react'
import { buildDetailSentence } from '../lib/calculations'
import { to12hr } from '../lib/timeFormat'
import { useTheme } from '../lib/useTheme'
import type { LogEntry } from '../types'

interface EntryCardProps {
  entry: LogEntry
  onDelete: (id: number) => void
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00')
  return d
    .toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
    .toUpperCase()
}

export default function EntryCard({ entry, onDelete }: EntryCardProps) {
  const x = useMotionValue(0)
  const deleteOpacity = useTransform(x, [-90, -30], [1, 0])
  const cardOpacity = useTransform(x, [-110, -80], [0, 1])
  const constraintsRef = useRef(null)
  const { isDark, surface, surfaceBorder, textPrimary, textSecondary } = useTheme()

  const isOff = entry.reason === 'OFF'
  const isCallout = entry.type === 'CALLOUT'
  const hasOT = parseFloat(entry.ot) > 0
  const isOTShift = entry.type === 'OT'

  let accentColor = '#2563EB'
  if (isCallout) accentColor = '#D97706'
  else if (isOTShift || hasOT) accentColor = '#DB2777'
  else if (isOff) accentColor = '#CBD5E1'

  const detail = isCallout
    ? `Callout · ${entry.calloutPayType || entry.reason}`
    : buildDetailSentence({
        ...entry,
        startTime: to12hr(entry.startTime),
        endTime: to12hr(entry.endTime),
        normalEnd: to12hr(entry.normalEnd),
      })

  const handleDragEnd = () => {
    if (x.get() < -80) {
      animate(x, -420, { duration: 0.22 }).then(() => onDelete(entry.id))
    } else {
      animate(x, 0, { type: 'spring', stiffness: 420, damping: 40 })
    }
  }

  return (
    <div ref={constraintsRef} className="relative overflow-hidden rounded-3xl mb-3">
      {/* Delete layer */}
      <motion.div
        className="absolute inset-0 flex items-center justify-end pr-5 rounded-3xl"
        style={{ background: isDark ? 'rgba(239,68,68,0.15)' : '#FFF1F2', opacity: deleteOpacity }}
      >
        <div className="flex items-center gap-2">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
            <path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6" stroke="#F43F5E" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <span className="text-rose-500 text-xs font-display font-bold tracking-widest">DELETE</span>
        </div>
      </motion.div>

      {/* Card */}
      <motion.div
        drag="x"
        dragConstraints={{ left: -130, right: 0 }}
        dragElastic={0.08}
        onDragEnd={handleDragEnd}
        style={{
          x,
          opacity: cardOpacity,
          background: surface,
          border: surfaceBorder,
          boxShadow: isDark ? '0 4px 20px rgba(0,0,0,0.3)' : '0 2px 12px rgba(15,23,42,0.06)',
        }}
        className="relative rounded-3xl overflow-hidden cursor-grab active:cursor-grabbing"
      >
        {/* Left accent stripe */}
        <div
          className="absolute left-0 top-0 bottom-0 w-1 rounded-l-3xl"
          style={{ background: accentColor }}
        />

        <div className="pl-5 pr-4 py-4">
          <div className="flex items-start justify-between mb-2">
            <span className="text-[10px] font-display font-bold tracking-widest" style={{ color: isDark ? '#475569' : '#94A3B8' }}>
              {formatDate(entry.date)}
            </span>

            {isOff ? (
              <span
                className="text-[9px] font-display font-bold tracking-wider px-2.5 py-1 rounded-xl"
                style={{ background: isDark ? 'rgba(255,255,255,0.06)' : '#F1F5F9', color: isDark ? '#334155' : '#94A3B8' }}
              >
                DAY OFF
              </span>
            ) : isCallout ? (
              <span
                className="text-[9px] font-display font-bold tracking-wider px-2.5 py-1 rounded-xl"
                style={{ background: isDark ? 'rgba(217,119,6,0.15)' : '#FEF3C7', color: '#D97706' }}
              >
                CALLOUT · {entry.calloutPayType}
              </span>
            ) : (
              <div className="flex gap-1.5 items-center">
                {parseFloat(entry.reg) > 0 && (
                  <span
                    className="text-[10px] font-display font-bold px-2.5 py-1 rounded-xl"
                    style={{ background: isDark ? 'rgba(37,99,235,0.15)' : '#EFF6FF', color: '#3B82F6' }}
                  >
                    R {entry.reg}
                  </span>
                )}
                {hasOT && (
                  <span
                    className="text-[10px] font-display font-bold px-2.5 py-1 rounded-xl"
                    style={{ background: isDark ? 'rgba(219,39,119,0.15)' : '#FDF2F8', color: '#DB2777' }}
                  >
                    OT {entry.ot}
                  </span>
                )}
              </div>
            )}
          </div>

          {!isOff && (
            <p className="text-[11px] font-body leading-relaxed" style={{ color: textSecondary }}>
              {detail}
            </p>
          )}
        </div>
      </motion.div>
    </div>
  )
}
