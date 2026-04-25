import { useState } from 'react'
import { useTheme } from '../lib/useTheme'
import { useStore } from '../store/useStore'
import { getCurrentPayPeriod, periodId, formatPeriodRange, isDateInPeriod } from '../lib/payPeriod'
import {
  getEcatsDeadline,
  getDeadlineStatus,
  formatDeadlineDate,
} from '../lib/ecatsAlerts'
import type { DeadlineStatus } from '../lib/ecatsAlerts'

function statusPalette(status: DeadlineStatus, isDark: boolean) {
  switch (status) {
    case 'upcoming':
      return {
        bg: isDark ? 'rgba(37,99,235,0.12)' : 'rgba(219,234,254,0.9)',
        border: isDark ? '1px solid rgba(37,99,235,0.25)' : '1px solid rgba(147,197,253,0.9)',
        accent: '#2563EB',
        dot: '#3B82F6',
        label: isDark ? '#93C5FD' : '#1D4ED8',
      }
    case 'warning':
      return {
        bg: isDark ? 'rgba(180,83,9,0.12)' : 'rgba(254,243,199,0.9)',
        border: isDark ? '1px solid rgba(217,119,6,0.25)' : '1px solid rgba(252,211,77,0.9)',
        accent: '#D97706',
        dot: '#F59E0B',
        label: isDark ? '#FCD34D' : '#92400E',
      }
    case 'critical':
      return {
        bg: isDark ? 'rgba(185,28,28,0.12)' : 'rgba(254,226,226,0.9)',
        border: isDark ? '1px solid rgba(220,38,38,0.25)' : '1px solid rgba(252,165,165,0.9)',
        accent: '#DC2626',
        dot: '#EF4444',
        label: isDark ? '#FCA5A5' : '#991B1B',
      }
    case 'overdue':
      return {
        bg: isDark ? 'rgba(30,41,59,0.4)' : 'rgba(241,245,249,0.9)',
        border: isDark ? '1px solid rgba(71,85,105,0.25)' : '1px solid rgba(203,213,225,0.9)',
        accent: '#64748B',
        dot: '#94A3B8',
        label: isDark ? '#64748B' : '#475569',
      }
  }
}

export default function EcatsBanner() {
  const { isDark, textPrimary, textSecondary } = useTheme()
  const entries = useStore((s) => s.entries)

  const period = getCurrentPayPeriod()
  const pid = periodId(period)

  const [dismissedPid, setDismissedPid] = useState<string | null>(null)

  if (dismissedPid === pid) return null

  const { deadline, isHolidayWeek, holidays, supplementalDeadline } = getEcatsDeadline(period)
  const status = getDeadlineStatus(deadline)
  const palette = statusPalette(status, isDark)

  const hasOTInPeriod = entries.some(
    (e: any) => e.type === 'OT' && isDateInPeriod(e.date, period)
  )

  const periodRange = formatPeriodRange(period)
  const deadlineStr = formatDeadlineDate(deadline)
  const supplementalStr = formatDeadlineDate(supplementalDeadline)
  const holidayNames = holidays.map((h) => h.name).join(', ')

  return (
    <div
      className="mx-4 mt-3 rounded-2xl px-4 py-3 flex flex-col gap-1 relative"
      style={{ background: palette.bg, border: palette.border }}
    >
      {/* Dismiss */}
      <button
        onClick={() => setDismissedPid(pid)}
        className="absolute top-2.5 right-3 opacity-40 hover:opacity-80 transition-opacity"
        aria-label="Dismiss ECATS banner"
      >
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none">
          <path d="M18 6L6 18M6 6l12 12" stroke={palette.accent} strokeWidth="2.2" strokeLinecap="round" />
        </svg>
      </button>

      {/* Header */}
      <div className="flex items-center gap-1.5 pr-5">
        <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: palette.dot }} />
        <span
          className="text-[8px] font-display font-bold tracking-widest"
          style={{ color: palette.label }}
        >
          ECATS DEADLINE
        </span>
      </div>

      {/* Period range */}
      <span className="text-[9px] font-body" style={{ color: textSecondary }}>
        Pay Period: {periodRange}
      </span>

      {/* Deadline date/time */}
      <span className="text-sm font-display font-bold leading-snug" style={{ color: textPrimary }}>
        {deadlineStr}
      </span>

      {/* Holiday week details */}
      {isHolidayWeek && (
        <>
          <span
            className="text-[9px] font-body mt-0.5 leading-relaxed"
            style={{ color: palette.accent }}
          >
            Deadline moved to Tuesday — {holidayNames} falls this period
          </span>

          {/* Supplemental note */}
          <div
            className="mt-1 rounded-xl px-3 py-2"
            style={{
              background: hasOTInPeriod
                ? isDark ? 'rgba(180,83,9,0.18)' : 'rgba(254,243,199,0.95)'
                : isDark ? 'rgba(255,255,255,0.05)' : 'rgba(241,245,249,0.9)',
              border: hasOTInPeriod
                ? isDark ? '1px solid rgba(217,119,6,0.3)' : '1px solid rgba(252,211,77,0.7)'
                : 'none',
            }}
          >
            <span
              className="text-[9px] font-body leading-relaxed"
              style={{ color: hasOTInPeriod ? (isDark ? '#FCD34D' : '#92400E') : textSecondary }}
            >
              Pre-scheduled OT worked Wed–Fri after deadline? File supplemental by {supplementalStr}
            </span>
          </div>
        </>
      )}
    </div>
  )
}
