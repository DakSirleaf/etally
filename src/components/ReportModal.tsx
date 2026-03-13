import { useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useTheme } from '../lib/useTheme'
import { getCurrentPayPeriod, getPreviousPayPeriod } from '../lib/payPeriod'
import type { LogEntry, StaffRole } from '../types'

interface ReportModalProps {
  isOpen: boolean
  onClose: () => void
  entries: LogEntry[]
  role: StaffRole | null
}

function formatDateShort(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00')
  return d.toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' })
}
function formatDay(dateStr: string): string {
  return new Date(dateStr + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'short' }).toUpperCase()
}
function to12hr(t: string): string {
  if (!t || t === '--') return '--'
  const [h, m] = t.split(':').map(Number)
  const ampm = h >= 12 ? 'PM' : 'AM'
  return `${h % 12 || 12}:${String(m).padStart(2, '0')} ${ampm}`
}
function getShiftLabel(e: LogEntry): string {
  if (e.reason === 'OFF') return 'Day Off'
  if (e.type === 'CALLOUT') return 'Callout'
  if (e.type === 'OT') return 'OT Pickup'
  return 'Regular'
}

type FilterType = 'current' | 'previous' | 'all' | 'custom'

export default function ReportModal({ isOpen, onClose, entries, role }: ReportModalProps) {
  const [name, setName] = useState('')
  const [step, setStep] = useState<'name' | 'preview'>('name')
  const [filter, setFilter] = useState<FilterType>('all')
  const [customStart, setCustomStart] = useState('')
  const [customEnd, setCustomEnd] = useState('')
  const printRef = useRef<HTMLDivElement>(null)
  const { isDark, surface, surfaceBorder, textPrimary, textSecondary, labelColor, selectColor } = useTheme()

  const currentPeriod = getCurrentPayPeriod()
  const previousPeriod = getPreviousPayPeriod()

  const getFilteredEntries = () => {
    const sorted = [...entries].sort((a, b) => a.date.localeCompare(b.date))
    if (filter === 'current') return sorted.filter(e => e.date >= currentPeriod.start && e.date <= currentPeriod.end)
    if (filter === 'previous') return sorted.filter(e => e.date >= previousPeriod.start && e.date <= previousPeriod.end)
    if (filter === 'custom' && customStart && customEnd) return sorted.filter(e => e.date >= customStart && e.date <= customEnd)
    return sorted
  }

  const filtered = getFilteredEntries()
  const currentYear = new Date().getFullYear()
  const workEntries = filtered.filter(e => e.reason !== 'OFF' && e.type !== 'CALLOUT')
  const totalReg = workEntries.reduce((s, e) => s + parseFloat(e.reg), 0)
  const totalOT = workEntries.reduce((s, e) => s + parseFloat(e.ot), 0)
  const calloutEntries = filtered.filter(e => e.type === 'CALLOUT')
  const sickCount = calloutEntries.filter(e => e.calloutPayType === 'Sick Time').length
  const vacCount = calloutEntries.filter(e => e.calloutPayType === 'Vacation Time').length
  const alUsed = entries.filter(e => e.calloutPayType === 'AL Day' && e.date.startsWith(String(currentYear))).length
  const alRemaining = Math.max(0, 3 - alUsed)
  const dateGenerated = new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })

  const getPeriodLabel = () => {
    if (filter === 'current') return `${formatDateShort(currentPeriod.start)} – ${formatDateShort(currentPeriod.end)}`
    if (filter === 'previous') return `${formatDateShort(previousPeriod.start)} – ${formatDateShort(previousPeriod.end)}`
    if (filter === 'custom' && customStart && customEnd) return `${formatDateShort(customStart)} – ${formatDateShort(customEnd)}`
    return 'All Entries'
  }

  // Build running total
  let cumReg = 0
  let cumOT = 0
  const rows = filtered.map(e => {
    if (e.type !== 'CALLOUT' && e.reason !== 'OFF') {
      cumReg += parseFloat(e.reg)
      cumOT += parseFloat(e.ot)
    }
    return { entry: e, cumReg, cumOT }
  })

  const reportHTML = `
    <div class="report-header">
      <div class="header-top">
        <div>
          <h1>eTally Time Report</h1>
          <div class="sub">A time tracker for eCats</div>
        </div>
      </div>
      <div class="meta">
        <span><strong>Name:</strong> ${name}</span>
        <span><strong>Role:</strong> ${role || 'N/A'}</span>
        <span><strong>Period:</strong> ${getPeriodLabel()}</span>
        <span><strong>Generated:</strong> ${dateGenerated}</span>
      </div>
    </div>

    <div class="summary">
      <div class="summary-box">
        <div class="label">Regular Hours</div>
        <div class="value">${totalReg.toFixed(2)}</div>
        <div class="unit">hrs</div>
      </div>
      <div class="summary-box">
        <div class="label">Overtime Hours</div>
        <div class="value" style="color:#be185d">${totalOT.toFixed(2)}</div>
        <div class="unit">hrs</div>
      </div>
      <div class="summary-box">
        <div class="label">Total Hours</div>
        <div class="value">${(totalReg + totalOT).toFixed(2)}</div>
        <div class="unit">hrs</div>
      </div>
      <div class="summary-box">
        <div class="label">Shifts Worked</div>
        <div class="value">${workEntries.length}</div>
        <div class="unit">shifts</div>
      </div>
    </div>

    ${calloutEntries.length > 0 ? `
    <div class="callout-summary">
      <div class="label">CALLOUT SUMMARY</div>
      <div class="callout-row">
        <span><strong>Total:</strong> ${calloutEntries.length}</span>
        ${sickCount > 0 ? `<span><strong>Sick Time:</strong> ${sickCount}</span>` : ''}
        ${vacCount > 0 ? `<span><strong>Vacation:</strong> ${vacCount}</span>` : ''}
        <span><strong>AL Days Used (YTD):</strong> ${alUsed} of 3</span>
        <span><strong>AL Remaining:</strong> ${alRemaining}</span>
      </div>
    </div>` : ''}

    <table>
      <thead>
        <tr>
          <th>#</th>
          <th>Date</th>
          <th>Day</th>
          <th>Type</th>
          <th>Start</th>
          <th>End</th>
          <th>REG hrs</th>
          <th>OT hrs</th>
          <th>Cum. REG</th>
          <th>Cum. OT</th>
          <th>Callout Pay</th>
          <th>Reason</th>
        </tr>
      </thead>
      <tbody>
        ${rows.map(({ entry: e, cumReg: cr, cumOT: co }, i) => `
          <tr class="${e.type === 'OT' || parseFloat(e.ot) > 0 ? 'ot-row' : ''}">
            <td>${i + 1}</td>
            <td>${formatDateShort(e.date)}</td>
            <td>${formatDay(e.date)}</td>
            <td class="${e.type === 'CALLOUT' ? 'type-callout' : e.type === 'OT' ? 'type-ot' : e.reason === 'OFF' ? 'type-off' : ''}">${getShiftLabel(e)}</td>
            <td>${to12hr(e.startTime)}</td>
            <td>${to12hr(e.endTime)}</td>
            <td>${e.type === 'CALLOUT' || e.reason === 'OFF' ? '—' : e.reg}</td>
            <td class="${parseFloat(e.ot) > 0 ? 'type-ot' : ''}">${e.type === 'CALLOUT' || e.reason === 'OFF' ? '—' : e.ot}</td>
            <td>${e.type === 'CALLOUT' || e.reason === 'OFF' ? '—' : cr.toFixed(2)}</td>
            <td class="${co > 0 ? 'type-ot' : ''}">${e.type === 'CALLOUT' || e.reason === 'OFF' ? '—' : co.toFixed(2)}</td>
            <td>${e.calloutPayType || '—'}</td>
            <td>${e.reason === 'OFF' ? 'Day Off' : e.type === 'CALLOUT' ? (e.calloutPayType || '') : e.reason}</td>
          </tr>
        `).join('')}
      </tbody>
      <tfoot>
        <tr>
          <td colspan="6" style="text-align:right;font-weight:700;">TOTALS</td>
          <td style="font-weight:700">${totalReg.toFixed(2)}</td>
          <td style="font-weight:700;color:#be185d">${totalOT.toFixed(2)}</td>
          <td colspan="4"></td>
        </tr>
      </tfoot>
    </table>

    <div class="disclaimer">
      This report is generated from self-reported data for personal reference only. 
      It does not constitute an official payroll record.
    </div>

    <div class="signature-block">
      <div class="sig-line">
        <div class="line"></div>
        <div class="sig-label">Employee Signature</div>
      </div>
      <div class="sig-line">
        <div class="line"></div>
        <div class="sig-label">Supervisor Signature</div>
      </div>
      <div class="sig-line">
        <div class="line"></div>
        <div class="sig-label">Date</div>
      </div>
    </div>

    <div class="footer">
      <span>eTally — Kola Technology Laboratory</span>
      <span>Generated ${dateGenerated}</span>
    </div>
  `

  const printStyles = `
    * { margin:0; padding:0; box-sizing:border-box; }
    body { font-family:Arial,sans-serif; font-size:10px; color:#000; background:#fff; padding:20px; }
    .report-header { border-bottom:2px solid #000; padding-bottom:10px; margin-bottom:14px; }
    .header-top { display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:6px; }
    h1 { font-size:18px; font-weight:900; }
    .sub { font-size:9px; color:#555; margin-top:1px; }
    .meta { font-size:9px; display:flex; flex-wrap:wrap; gap:14px; }
    .summary { display:grid; grid-template-columns:repeat(4,1fr); gap:8px; margin-bottom:12px; }
    .summary-box { border:1px solid #ccc; padding:7px 9px; border-radius:3px; }
    .summary-box .label { font-size:7px; font-weight:700; letter-spacing:1px; color:#666; text-transform:uppercase; }
    .summary-box .value { font-size:16px; font-weight:900; margin-top:2px; }
    .summary-box .unit { font-size:8px; color:#666; }
    .callout-summary { border:1px solid #f59e0b; background:#fffbeb; padding:7px 10px; border-radius:3px; margin-bottom:12px; }
    .callout-summary .label { font-size:7px; font-weight:700; letter-spacing:1px; color:#92400e; text-transform:uppercase; margin-bottom:4px; }
    .callout-row { display:flex; flex-wrap:wrap; gap:16px; font-size:9px; }
    table { width:100%; border-collapse:collapse; font-size:9px; margin-bottom:12px; }
    th { background:#f0f0f0; border:1px solid #ccc; padding:4px 5px; text-align:left; font-size:7px; font-weight:700; letter-spacing:0.5px; text-transform:uppercase; }
    td { border:1px solid #ddd; padding:4px 5px; }
    tr:nth-child(even) td { background:#fafafa; }
    tfoot td { background:#f0f0f0 !important; border-top:2px solid #999; }
    .ot-row td { background:#fff7ed !important; }
    .type-callout { color:#b45309; font-weight:700; }
    .type-ot { color:#be185d; font-weight:700; }
    .type-off { color:#64748b; }
    .disclaimer { font-size:8px; color:#999; font-style:italic; border-top:1px solid #eee; padding-top:8px; margin-bottom:16px; }
    .signature-block { display:grid; grid-template-columns:repeat(3,1fr); gap:20px; margin-bottom:12px; }
    .sig-line .line { border-bottom:1px solid #000; height:28px; margin-bottom:3px; }
    .sig-label { font-size:8px; color:#555; }
    .footer { border-top:1px solid #ccc; padding-top:8px; font-size:8px; color:#999; display:flex; justify-content:space-between; }
  `

  const handlePrint = () => {
    const win = window.open('', '_blank')
    if (!win) return
    win.document.write(`<!DOCTYPE html><html><head><title>eTally Report — ${name}</title><style>${printStyles}</style></head><body>${reportHTML}</body></html>`)
    win.document.close()
    win.focus()
    setTimeout(() => win.print(), 400)
  }

  const handleCSV = () => {
    const headers = ['#','Date','Day','Type','Start','End','REG hrs','OT hrs','Cum REG','Cum OT','Callout Pay','Reason']
    const csvRows = rows.map(({ entry: e, cumReg: cr, cumOT: co }, i) => [
      i + 1,
      formatDateShort(e.date),
      formatDay(e.date),
      getShiftLabel(e),
      to12hr(e.startTime),
      to12hr(e.endTime),
      e.type === 'CALLOUT' || e.reason === 'OFF' ? '0.00' : e.reg,
      e.type === 'CALLOUT' || e.reason === 'OFF' ? '0.00' : e.ot,
      e.type === 'CALLOUT' || e.reason === 'OFF' ? '' : cr.toFixed(2),
      e.type === 'CALLOUT' || e.reason === 'OFF' ? '' : co.toFixed(2),
      e.calloutPayType || '',
      e.reason === 'OFF' ? 'Day Off' : e.type === 'CALLOUT' ? (e.calloutPayType || '') : e.reason,
    ])
    const csv = [headers, ...csvRows].map(r => r.map(v => `"${v}"`).join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `eTally_${name.replace(/\s+/g,'_')}_${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  const filterOptions: { value: FilterType; label: string; sub: string }[] = [
    { value: 'current', label: 'Current Period', sub: `${formatDateShort(currentPeriod.start)} – ${formatDateShort(currentPeriod.end)}` },
    { value: 'previous', label: 'Previous Period', sub: `${formatDateShort(previousPeriod.start)} – ${formatDateShort(previousPeriod.end)}` },
    { value: 'all', label: 'All Entries', sub: `${entries.length} total entries` },
    { value: 'custom', label: 'Custom Range', sub: 'Pick start & end date' },
  ]

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-40"
            style={{ background: 'rgba(5,9,18,0.8)', backdropFilter: 'blur(6px)' }}
            onClick={onClose}
          />
          <motion.div
            initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
            transition={{ type: 'spring', stiffness: 420, damping: 42 }}
            className="fixed bottom-0 left-0 right-0 z-50 rounded-t-3xl overflow-hidden"
            style={{
              background: isDark ? '#0A0F1E' : '#FFFFFF',
              paddingBottom: 'max(2rem, env(safe-area-inset-bottom, 2rem))',
              maxHeight: '92dvh',
              borderTop: isDark ? '1px solid rgba(255,255,255,0.08)' : 'none',
            }}
          >
            <div className="flex justify-center pt-3 pb-2">
              <div className="w-10 h-1 rounded-full" style={{ background: isDark ? '#1E293B' : '#E2E8F0' }} />
            </div>

            <div className="overflow-y-auto px-5 pb-4" style={{ maxHeight: 'calc(92dvh - 3rem)' }}>
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-display font-extrabold text-lg" style={{ color: textPrimary }}>Export Report</h2>
                {step === 'preview' && (
                  <motion.button whileTap={{ scale: 0.95 }} onClick={() => setStep('name')}
                    className="text-[10px] font-display font-bold tracking-widest px-3 py-1.5 rounded-xl"
                    style={{ background: surface, border: surfaceBorder, color: textSecondary }}>
                    ← BACK
                  </motion.button>
                )}
              </div>

              {step === 'name' ? (
                <div className="flex flex-col gap-3">
                  {/* Name input */}
                  <label className="text-[9px] font-display font-bold tracking-widest block" style={{ color: labelColor }}>YOUR NAME</label>
                  <input
                    type="text" value={name} onChange={e => setName(e.target.value)}
                    placeholder="e.g. Jane Smith"
                    className="w-full rounded-2xl px-4 py-3 text-sm font-body focus:outline-none"
                    style={{ background: surface, border: surfaceBorder, color: textPrimary }}
                    autoFocus
                  />

                  {/* Period filter */}
                  <label className="text-[9px] font-display font-bold tracking-widest block mt-1" style={{ color: labelColor }}>REPORT PERIOD</label>
                  <div className="grid grid-cols-2 gap-2">
                    {filterOptions.map(opt => (
                      <motion.button key={opt.value} whileTap={{ scale: 0.97 }}
                        onClick={() => setFilter(opt.value)}
                        className="rounded-2xl px-3 py-3 text-left transition-all"
                        style={{
                          background: filter === opt.value ? (isDark ? 'rgba(37,99,235,0.15)' : '#EFF6FF') : surface,
                          border: filter === opt.value ? '1.5px solid #2563EB60' : surfaceBorder,
                        }}>
                        <div className="text-[10px] font-display font-bold" style={{ color: filter === opt.value ? '#3B82F6' : textPrimary }}>{opt.label}</div>
                        <div className="text-[9px] font-body mt-0.5" style={{ color: textSecondary }}>{opt.sub}</div>
                      </motion.button>
                    ))}
                  </div>

                  {filter === 'custom' && (
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-[9px] font-display font-bold tracking-widest block mb-1" style={{ color: labelColor }}>FROM</label>
                        <input type="date" value={customStart} onChange={e => setCustomStart(e.target.value)}
                          className="w-full rounded-2xl px-3 py-2.5 text-sm font-body focus:outline-none"
                          style={{ background: surface, border: surfaceBorder, color: selectColor }} />
                      </div>
                      <div>
                        <label className="text-[9px] font-display font-bold tracking-widest block mb-1" style={{ color: labelColor }}>TO</label>
                        <input type="date" value={customEnd} onChange={e => setCustomEnd(e.target.value)}
                          className="w-full rounded-2xl px-3 py-2.5 text-sm font-body focus:outline-none"
                          style={{ background: surface, border: surfaceBorder, color: selectColor }} />
                      </div>
                    </div>
                  )}

                  <div className="rounded-2xl px-4 py-3" style={{ background: surface, border: surfaceBorder }}>
                    <div className="text-[9px] font-display font-bold tracking-widest mb-2" style={{ color: labelColor }}>PREVIEW SUMMARY</div>
                    <div className="grid grid-cols-2 gap-1">
                      {[
                        ['Entries', filtered.length],
                        ['REG hrs', totalReg.toFixed(2)],
                        ['OT hrs', totalOT.toFixed(2)],
                        ['Callouts', calloutEntries.length],
                      ].map(([l, v]) => (
                        <div key={l} className="flex justify-between">
                          <span className="text-[10px] font-body" style={{ color: textSecondary }}>{l}</span>
                          <span className="text-[10px] font-display font-bold" style={{ color: textPrimary }}>{v}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <motion.button whileTap={{ scale: 0.97 }}
                    onClick={() => name.trim() && filtered.length > 0 && setStep('preview')}
                    className="w-full py-4 rounded-2xl font-display font-bold text-sm tracking-widest text-white"
                    style={{ background: name.trim() && filtered.length > 0 ? '#2563EB' : '#1E293B', opacity: name.trim() && filtered.length > 0 ? 1 : 0.4 }}>
                    PREVIEW REPORT →
                  </motion.button>
                </div>
              ) : (
                <div className="flex flex-col gap-3">
                  {/* Print Preview */}
                  <div className="text-[9px] font-display font-bold tracking-widest mb-1" style={{ color: labelColor }}>PRINT PREVIEW</div>
                  <div
                    className="rounded-2xl overflow-hidden"
                    style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', maxHeight: '45dvh', overflowY: 'auto' }}
                  >
                    <div style={{ padding: '16px', fontFamily: 'Arial, sans-serif', fontSize: '9px', color: '#000' }}>
                      {/* Preview Header */}
                      <div style={{ borderBottom: '2px solid #000', paddingBottom: '8px', marginBottom: '10px' }}>
                        <div style={{ fontSize: '15px', fontWeight: 900 }}>eTally Time Report</div>
                        <div style={{ fontSize: '8px', color: '#555' }}>A time tracker for eCats</div>
                        <div style={{ fontSize: '8px', marginTop: '4px', display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
                          <span><strong>Name:</strong> {name}</span>
                          <span><strong>Role:</strong> {role}</span>
                          <span><strong>Period:</strong> {getPeriodLabel()}</span>
                        </div>
                      </div>
                      {/* Summary */}
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '6px', marginBottom: '10px' }}>
                        {[['REG', totalReg.toFixed(2),'hrs'], ['OT', totalOT.toFixed(2),'hrs'], ['Total', (totalReg+totalOT).toFixed(2),'hrs'], ['Shifts', String(workEntries.length),'']].map(([l,v,u]) => (
                          <div key={l} style={{ border: '1px solid #ccc', padding: '5px', borderRadius: '3px' }}>
                            <div style={{ fontSize: '6px', fontWeight: 700, color: '#666', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{l}</div>
                            <div style={{ fontSize: '13px', fontWeight: 900, color: l === 'OT' && parseFloat(v) > 0 ? '#be185d' : '#000' }}>{v}</div>
                            <div style={{ fontSize: '7px', color: '#666' }}>{u}</div>
                          </div>
                        ))}
                      </div>
                      {/* Table */}
                      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '8px' }}>
                        <thead>
                          <tr>{['#','Date','Day','Type','Start','End','REG','OT','∑REG','∑OT','Pay','Reason'].map(h => (
                            <th key={h} style={{ background: '#f0f0f0', border: '1px solid #ccc', padding: '3px 4px', fontSize: '6px', fontWeight: 700, textTransform: 'uppercase' }}>{h}</th>
                          ))}</tr>
                        </thead>
                        <tbody>
                          {rows.map(({ entry: e, cumReg: cr, cumOT: co }, i) => (
                            <tr key={e.id} style={{ background: (e.type === 'OT' || parseFloat(e.ot) > 0) ? '#fff7ed' : i % 2 === 0 ? '#fff' : '#fafafa' }}>
                              <td style={{ border: '1px solid #ddd', padding: '3px 4px' }}>{i+1}</td>
                              <td style={{ border: '1px solid #ddd', padding: '3px 4px' }}>{formatDateShort(e.date)}</td>
                              <td style={{ border: '1px solid #ddd', padding: '3px 4px' }}>{formatDay(e.date)}</td>
                              <td style={{ border: '1px solid #ddd', padding: '3px 4px', color: e.type === 'CALLOUT' ? '#b45309' : e.type === 'OT' ? '#be185d' : '#000', fontWeight: e.type !== 'REG' ? 700 : 400 }}>{getShiftLabel(e)}</td>
                              <td style={{ border: '1px solid #ddd', padding: '3px 4px' }}>{to12hr(e.startTime)}</td>
                              <td style={{ border: '1px solid #ddd', padding: '3px 4px' }}>{to12hr(e.endTime)}</td>
                              <td style={{ border: '1px solid #ddd', padding: '3px 4px' }}>{e.type === 'CALLOUT' || e.reason === 'OFF' ? '—' : e.reg}</td>
                              <td style={{ border: '1px solid #ddd', padding: '3px 4px', color: parseFloat(e.ot) > 0 ? '#be185d' : '#000' }}>{e.type === 'CALLOUT' || e.reason === 'OFF' ? '—' : e.ot}</td>
                              <td style={{ border: '1px solid #ddd', padding: '3px 4px' }}>{e.type === 'CALLOUT' || e.reason === 'OFF' ? '—' : cr.toFixed(2)}</td>
                              <td style={{ border: '1px solid #ddd', padding: '3px 4px', color: co > 0 ? '#be185d' : '#000' }}>{e.type === 'CALLOUT' || e.reason === 'OFF' ? '—' : co.toFixed(2)}</td>
                              <td style={{ border: '1px solid #ddd', padding: '3px 4px' }}>{e.calloutPayType || '—'}</td>
                              <td style={{ border: '1px solid #ddd', padding: '3px 4px' }}>{e.reason === 'OFF' ? 'Day Off' : e.type === 'CALLOUT' ? (e.calloutPayType || '') : e.reason}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                      <div style={{ fontSize: '7px', color: '#999', fontStyle: 'italic', marginTop: '8px', borderTop: '1px solid #eee', paddingTop: '6px' }}>
                        This report is generated from self-reported data for personal reference only. It does not constitute an official payroll record.
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '16px', marginTop: '12px' }}>
                        {['Employee Signature', 'Supervisor Signature', 'Date'].map(label => (
                          <div key={label}>
                            <div style={{ borderBottom: '1px solid #000', height: '22px', marginBottom: '3px' }} />
                            <div style={{ fontSize: '7px', color: '#555' }}>{label}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Hidden print ref */}
                  <div ref={printRef} style={{ display: 'none' }} dangerouslySetInnerHTML={{ __html: reportHTML }} />

                  {/* Export buttons */}
                  <div className="flex flex-col gap-2 mt-1">
                    <motion.button whileTap={{ scale: 0.97 }} onClick={handlePrint}
                      className="w-full py-4 rounded-2xl font-display font-bold text-sm tracking-widest text-white flex items-center justify-center gap-2"
                      style={{ background: 'linear-gradient(135deg,#1D4ED8,#3B82F6)' }}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                        <path d="M6 9V3h12v6M6 18H4a2 2 0 01-2-2v-5a2 2 0 012-2h16a2 2 0 012 2v5a2 2 0 01-2 2h-2" stroke="white" strokeWidth="1.8" strokeLinecap="round"/>
                        <rect x="6" y="13" width="12" height="8" rx="1" stroke="white" strokeWidth="1.8"/>
                      </svg>
                      PRINT REPORT
                    </motion.button>

                    <motion.button whileTap={{ scale: 0.97 }} onClick={handlePrint}
                      className="w-full py-4 rounded-2xl font-display font-bold text-sm tracking-widest text-white flex items-center justify-center gap-2"
                      style={{ background: 'linear-gradient(135deg,#DC2626,#EF4444)' }}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                        <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6z" stroke="white" strokeWidth="1.8" strokeLinecap="round"/>
                        <path d="M14 2v6h6M16 13H8M16 17H8" stroke="white" strokeWidth="1.8" strokeLinecap="round"/>
                      </svg>
                      SAVE AS PDF
                    </motion.button>

                    <motion.button whileTap={{ scale: 0.97 }} onClick={handleCSV}
                      className="w-full py-4 rounded-2xl font-display font-bold text-sm tracking-widest flex items-center justify-center gap-2"
                      style={{ background: isDark ? 'rgba(16,185,129,0.1)' : '#ECFDF5', border: isDark ? '1px solid rgba(16,185,129,0.2)' : '1px solid #A7F3D0', color: '#10B981' }}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                        <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3" stroke="#10B981" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                      DOWNLOAD CSV (EXCEL)
                    </motion.button>
                  </div>
                </div>
              )}

              <motion.button whileTap={{ scale: 0.97 }} onClick={onClose}
                className="w-full mt-3 py-3 rounded-2xl font-display font-bold text-xs tracking-widest"
                style={{ color: isDark ? '#334155' : '#94A3B8' }}>
                CLOSE
              </motion.button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
