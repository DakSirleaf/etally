import { motion } from 'framer-motion'
import { useTheme } from '../lib/useTheme'

type Tab = 'track' | 'log'

interface BottomNavProps {
  active: Tab
  setActive: (tab: Tab) => void
}

const TrackIcon = ({ active }: { active: boolean }) => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
    <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth={active ? 2 : 1.5} />
    <path d="M12 7v5l3 3" stroke="currentColor" strokeWidth={active ? 2 : 1.5} strokeLinecap="round" />
  </svg>
)

const LogIcon = ({ active }: { active: boolean }) => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
    <rect x="4" y="3" width="16" height="18" rx="2" stroke="currentColor" strokeWidth={active ? 2 : 1.5} />
    <path d="M8 8h8M8 12h8M8 16h5" stroke="currentColor" strokeWidth={active ? 2 : 1.5} strokeLinecap="round" />
  </svg>
)

export default function BottomNav({ active, setActive }: BottomNavProps) {
  const { isDark, navBg, navBorder } = useTheme()
  const tabs: { id: Tab; label: string }[] = [
    { id: 'track', label: 'Track' },
    { id: 'log', label: 'Log' },
  ]

  return (
    <nav
      className="flex-shrink-0 flex"
      style={{
        background: navBg,
        borderTop: `1px solid ${navBorder}`,
        paddingBottom: 'env(safe-area-inset-bottom, 0px)',
      }}
    >
      {tabs.map((tab) => {
        const isActive = active === tab.id
        const color = tab.id === 'track' ? '#2563EB' : '#DB2777'
        const inactiveColor = isDark ? '#1E293B' : '#CBD5E1'

        return (
          <motion.button
            key={tab.id}
            onClick={() => setActive(tab.id)}
            whileTap={{ scale: 0.92 }}
            className="flex-1 flex flex-col items-center justify-center gap-1 h-16 relative"
          >
            {isActive && (
              <motion.div
                layoutId="nav-pill"
                className="absolute top-0 left-6 right-6 h-0.5 rounded-full"
                style={{ background: color }}
                transition={{ type: 'spring', stiffness: 500, damping: 42 }}
              />
            )}
            <span style={{ color: isActive ? color : inactiveColor }} className="transition-colors duration-150">
              {tab.id === 'track' ? <TrackIcon active={isActive} /> : <LogIcon active={isActive} />}
            </span>
            <span
              className="text-[10px] font-display font-bold tracking-widest transition-colors duration-150"
              style={{ color: isActive ? color : inactiveColor }}
            >
              {tab.label.toUpperCase()}
            </span>
          </motion.button>
        )
      })}
    </nav>
  )
}
