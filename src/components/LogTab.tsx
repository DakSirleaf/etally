import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useStore } from '../store/useStore'
import { useTheme } from '../lib/useTheme'
import EntryCard from './EntryCard'
import ReportModal from './ReportModal'
import EditEntrySheet from './EditEntrySheet'
import type { LogEntry } from '../types'

function formatDateShort(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00')
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

// Detect callout streaks: 3+ callouts within any 30-day window
function detectCalloutStreak(entries: LogEntry[]): boolean {
  const callouts = entries
    .filter(e => e.type === 'CALLOUT')
    .map(e => new Date(e.date + 'T00:00:00').getTime())
    .sort((a, b) => a - b)
  for (let i = 0; i < callouts.length - 2; i++) {
    if (callouts[i + 2] - callouts[i] <= 30 * 24 * 60 * 60 * 1000) return true
  }
  return false
}

type ClearStep = 'idle' | 'warn' | 'options'

export default function LogTab() {
  const entries = useStore((s: any) => s.entries)
  const removeEntry = useStore((s: any) => s.removeEntry)
  const clearAll = useStore((s: any) => s.clearAll)
  const saveSnapshot = useStore((s: any) => s.saveSnapshot)
  const snapshots = useStore((s: any) => s.snapshots)
  const deleteSnapshot = useStore((s: any) => s.deleteSnapshot)
  const role = useStore((s: any) => s.role)
  const { isDark, surface, surfaceBorder, textPrimary, textSecondary, labelColor } = useTheme()

  const [reportOpen, setReportOpen] = useState(false)
  const [editEntry, setEditEntry] = useState<LogEntry | null>(null)
  const [clearStep, setClearStep] = useState<ClearStep>('idle')
  const [showSnapshots, setShowSnapshots] = useState(false)

  const currentYear = new Date().getFullYear()
  const calloutEntries = entries.filter((e: LogEntry) => e.type === 'CALLOUT')
  const alUsed = entries.filter((e: LogEntry) => e.calloutPayType === 'AL Day' && e.date.startsWith(String(currentYear))).length
  const alRemaining = Math.max(0, 3 - alUsed)
  const sickCount = calloutEntries.filter((e: LogEntry) => e.calloutPayType === 'Sick Time').length
  const vacCount = calloutEntries.filter((e: LogEntry) => e.calloutPayType === 'Vacation Time').length
  const hasStreak = detectCalloutStreak(entries)

  const workEntries = entries.filter((e: LogEntry) => e.reason !== 'OFF' && e.type !== 'CALLOUT')
  const totalReg = workEntries.reduce((s: number, e: LogEntry) => s + parseFloat(e.reg), 0)
  const totalOT = workEntries.reduce((s: number, e: LogEntry) => s + parseFloat(e.ot), 0)

  const sorted = [...entries].sort((a: LogEntry, b: LogEntry) => b.date.localeCompare(a.date))

  const handleCSVAndClear = () => {
    // Generate CSV
    const headers = ['Date', 'Type', 'Start', 'End', 'REG hrs', 'OT hrs', 'Callout Pay', 'Reason']
    const rows = [...entries].sort((a: LogEntry, b: LogEntry) => a.date.localeCompare(b.date)).map((e: LogEntry) => [
      e.date,
      e.type,
      e.startTime,
      e.endTime,
      e.reg,
      e.ot,
      e.calloutPayType || '',
      e.reason,
    ])
    const csv = [headers, ...rows].map((r: any[]) => r.map((v: any) => `"${v}"`).join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `eTally_archive_${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    URL.revokeObjectURL(url)
    clearAll()
    setClearStep('idle')
  }

  const handleSnapshotAndClear = () => {
    saveSnapshot(`Snapshot ${new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`)
    clearAll()
    setClearStep('idle')
  }

  return (
    <div className="px-4 pt-4 pb-32">

      {/* Callout streak warning */}
      <AnimatePresence>
        {hasStreak && (
          <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="rounded-2xl px-4 py-3 mb-3 flex items-start gap-3"
            style={{ background: isDark ? 'rgba(239,68,68,0.1)' : '#FFF1F2', border: isDark ? '1px solid rgba(239,68,68,0.2)' : '1px solid #FECDD3' }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="mt-0.5 flex-shrink-0">
              <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" stroke="#F43F5E" strokeWidth="1.8" strokeLinecap="round"/>
              <line x1="12" y1="9" x2="12" y2="13" stroke="#F43F5E" strokeWidth="1.8" strokeLinecap="round"/>
              <line x1="12" y1="17" x2="12.01" y2="17" stroke="#F43F5E" strokeWidth="2.5" strokeLinecap="round"/>
            </svg>
            <div>
              <div className="text-[10px] font-display font-bold tracking-widest" style={{ color: '#F43F5E' }}>CALLOUT STREAK DETECTED</div>
              <div className="text-[10px] font-body mt-0.5" style={{ color: isDark ? '#FDA4AF' : '#BE123C' }}>
                3 or more callouts within a 30-day window. This may trigger HR review.
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Summary tiles */}
      {entries.length > 0 && (
        <div className="grid grid-cols-3 gap-2 mb-3">
          {[
            { label: 'REG HRS', value: totalReg.toFixed(1), color: '#2563EB' },
            { label: 'OT HRS', value: totalOT.toFixed(1), color: '#DB2777' },
            { label: 'ENTRIES', value: entries.length, color: isDark ? '#94A3B8' : '#64748B' },
          ].map(tile => (
            <div key={tile.label} className="rounded-2xl px-3 py-3 text-center" style={{ background: surface, border: surfaceBorder }}>
              <div className="font-display font-extrabold text-lg" style={{ color: tile.color }}>{tile.value}</div>
              <div className="text-[8px] font-display font-bold tracking-widest mt-0.5" style={{ color: labelColor }}>{tile.label}</div>
            </div>
          ))}
        </div>
      )}

      {/* Callout summary tile */}
      {calloutEntries.length > 0 && (
        <div className="rounded-2xl px-4 py-3 mb-3" style={{ background: isDark ? 'rgba(217,119,6,0.08)' : '#FFFBEB', border: isDark ? '1px solid rgba(217,119,6,0.2)' : '1px solid #FDE68A' }}>
          <div className="text-[9px] font-display font-bold tracking-widest mb-2" style={{ color: '#D97706' }}>CALLOUT SUMMARY</div>
          <div className="grid grid-cols-2 gap-1">
            {[
              ['Total Callouts', calloutEntries.length],
              sickCount > 0 ? ['Sick Time', sickCount] : null,
              vacCount > 0 ? ['Vacation', vacCount] : null,
              ['AL Used', `${alUsed} of 3`],
              ['AL Remaining', alRemaining],
            ].filter(Boolean).map(([l, v]: any) => (
              <div key={l} className="flex justify-between">
                <span className="text-[10px] font-body" style={{ color: textSecondary }}>{l}</span>
                <span className="text-[10px] font-display font-bold" style={{ color: textPrimary }}>{v}</span>
              </div>
            ))}
            <div className="col-span-2 flex gap-1 mt-1">
              {[0, 1, 2].map(i => (
                <div key={i} className="w-3 h-3 rounded-full" style={{ background: i < alUsed ? '#D97706' : isDark ? '#1E293B' : '#E2E8F0' }} />
              ))}
              <span className="text-[9px] font-body ml-1" style={{ color: labelColor }}>{alRemaining} AL day{alRemaining !== 1 ? 's' : ''} remaining this year</span>
            </div>
          </div>
        </div>
      )}

      {/* Entry list */}
      {sorted.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20">
          <div className="text-4xl mb-3">📋</div>
          <p className="font-display font-bold text-sm" style={{ color: labelColor }}>No entries yet</p>
          <p className="text-xs font-body mt-1" style={{ color: isDark ? '#1E293B' : '#CBD5E1' }}>Log a shift from the Track tab</p>
        </div>
      ) : (
        sorted.map((entry: LogEntry) => (
          <EntryCard key={entry.id} entry={entry} onDelete={removeEntry} onEdit={(e) => setEditEntry(e)} />
        ))
      )}

      {/* Actions */}
      {entries.length > 0 && (
        <div className="flex flex-col gap-2 mt-2">
          <motion.button whileTap={{ scale: 0.97 }} onClick={() => setReportOpen(true)}
            className="w-full py-4 rounded-3xl font-display font-bold text-xs tracking-widest"
            style={{ background: isDark ? 'rgba(16,185,129,0.08)' : '#ECFDF5', border: isDark ? '1px solid rgba(16,185,129,0.2)' : '1px solid #A7F3D0', color: '#10B981' }}>
            EXPORT REPORT
          </motion.button>

          {/* Snapshots */}
          {snapshots.length > 0 && (
            <motion.button whileTap={{ scale: 0.97 }} onClick={() => setShowSnapshots(!showSnapshots)}
              className="w-full py-3 rounded-3xl font-display font-bold text-xs tracking-widest"
              style={{ background: surface, border: surfaceBorder, color: textSecondary }}>
              {showSnapshots ? 'HIDE ARCHIVES' : `VIEW ARCHIVES (${snapshots.length})`}
            </motion.button>
          )}

          <AnimatePresence>
            {showSnapshots && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}>
                {snapshots.map((snap: any) => (
                  <div key={snap.id} className="rounded-2xl px-4 py-3 mb-2 flex items-center justify-between"
                    style={{ background: surface, border: surfaceBorder }}>
                    <div>
                      <div className="text-xs font-display font-bold" style={{ color: textPrimary }}>{snap.label}</div>
                      <div className="text-[9px] font-body mt-0.5" style={{ color: textSecondary }}>
                        {snap.entries.length} entries · Saved {snap.date}
                      </div>
                    </div>
                    <motion.button whileTap={{ scale: 0.9 }} onClick={() => deleteSnapshot(snap.id)}
                      className="w-7 h-7 rounded-xl flex items-center justify-center"
                      style={{ background: isDark ? 'rgba(239,68,68,0.1)' : '#FFF1F2' }}>
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
                        <path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6" stroke="#F43F5E" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </motion.button>
                  </div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Clear log */}
          <AnimatePresence mode="wait">
            {clearStep === 'idle' && (
              <motion.button key="idle" whileTap={{ scale: 0.97 }} onClick={() => setClearStep('warn')}
                className="w-full py-3 rounded-3xl font-display font-bold text-xs tracking-widest"
                style={{ color: isDark ? '#334155' : '#94A3B8' }}>
                CLEAR LOG
              </motion.button>
            )}
            {clearStep === 'warn' && (
              <motion.div key="warn" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="rounded-2xl px-4 py-4 flex flex-col gap-3"
                style={{ background: isDark ? 'rgba(239,68,68,0.08)' : '#FFF1F2', border: isDark ? '1px solid rgba(239,68,68,0.2)' : '1px solid #FECDD3' }}>
                <div className="text-[10px] font-display font-bold tracking-widest" style={{ color: '#F43F5E' }}>
                  ⚠ THIS WILL DELETE ALL {entries.length} ENTRIES
                </div>
                <div className="text-[10px] font-body" style={{ color: textSecondary }}>
                  Save your data first — you cannot undo this.
                </div>
                <div className="flex gap-2">
                  <motion.button whileTap={{ scale: 0.97 }} onClick={() => setClearStep('options')}
                    className="flex-1 py-3 rounded-xl font-display font-bold text-[10px] tracking-widest text-white"
                    style={{ background: '#EF4444' }}>
                    CONTINUE →
                  </motion.button>
                  <motion.button whileTap={{ scale: 0.97 }} onClick={() => setClearStep('idle')}
                    className="py-3 px-4 rounded-xl font-display font-bold text-[10px] tracking-widest"
                    style={{ background: surface, border: surfaceBorder, color: textSecondary }}>
                    CANCEL
                  </motion.button>
                </div>
              </motion.div>
            )}
            {clearStep === 'options' && (
              <motion.div key="options" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="rounded-2xl px-4 py-4 flex flex-col gap-2"
                style={{ background: surface, border: surfaceBorder }}>
                <div className="text-[9px] font-display font-bold tracking-widest mb-1" style={{ color: labelColor }}>
                  BEFORE YOU CLEAR — SAVE YOUR DATA?
                </div>
                <motion.button whileTap={{ scale: 0.97 }} onClick={handleCSVAndClear}
                  className="w-full py-3 rounded-xl font-display font-bold text-[10px] tracking-widest"
                  style={{ background: isDark ? 'rgba(16,185,129,0.1)' : '#ECFDF5', border: isDark ? '1px solid rgba(16,185,129,0.2)' : '1px solid #A7F3D0', color: '#10B981' }}>
                  DOWNLOAD CSV THEN CLEAR
                </motion.button>
                <motion.button whileTap={{ scale: 0.97 }} onClick={handleSnapshotAndClear}
                  className="w-full py-3 rounded-xl font-display font-bold text-[10px] tracking-widest"
                  style={{ background: isDark ? 'rgba(37,99,235,0.1)' : '#EFF6FF', border: isDark ? '1px solid rgba(37,99,235,0.2)' : '1px solid #BFDBFE', color: '#3B82F6' }}>
                  SAVE SNAPSHOT THEN CLEAR
                </motion.button>
                <motion.button whileTap={{ scale: 0.97 }} onClick={() => { clearAll(); setClearStep('idle') }}
                  className="w-full py-3 rounded-xl font-display font-bold text-[10px] tracking-widest"
                  style={{ color: '#EF4444' }}>
                  CLEAR WITHOUT SAVING
                </motion.button>
                <motion.button whileTap={{ scale: 0.97 }} onClick={() => setClearStep('idle')}
                  className="w-full py-2 rounded-xl font-display font-bold text-[10px] tracking-widest"
                  style={{ color: labelColor }}>
                  CANCEL
                </motion.button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}

      <ReportModal isOpen={reportOpen} onClose={() => setReportOpen(false)} entries={entries} role={role} />
      <EditEntrySheet entry={editEntry} onClose={() => setEditEntry(null)} />
    </div>
  )
}
