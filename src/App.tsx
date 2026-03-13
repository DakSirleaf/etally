import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import TrackTab from './components/TrackTab'
import LogTab from './components/LogTab'
import BottomNav from './components/BottomNav'
import AboutSheet from './components/AboutSheet'
import RoleSetup from './components/RoleSetup'
import { useStore } from './store/useStore'
import { getCurrentPayPeriod } from './lib/payPeriod'

type Tab = 'track' | 'log'

export default function App() {
  const [tab, setTab] = useState<Tab>('track')
  const [direction, setDirection] = useState(1)
  const [aboutOpen, setAboutOpen] = useState(false)
  const role = useStore((s) => s.role)
  const theme = useStore((s) => s.theme)
  const toggleTheme = useStore((s) => s.toggleTheme)
  const isDark = theme === 'dark'

  const currentPeriod = getCurrentPayPeriod()

  const handleTabChange = (newTab: Tab) => {
    setDirection(newTab === 'log' ? 1 : -1)
    setTab(newTab)
  }

  const mainBg = isDark
    ? 'linear-gradient(160deg, #050912 0%, #0A1128 50%, #080D1E 100%)'
    : '#F1F5F9'

  return (
    <div
      className="flex flex-col"
      style={{ height: '100dvh', overflow: 'hidden' }}
      data-theme={theme}
    >
      {/* Role setup overlay */}
      <AnimatePresence>{!role && <RoleSetup />}</AnimatePresence>

      {/* Header */}
      <header
        className="flex-shrink-0 px-5 pb-4"
        style={{
          paddingTop: 'max(1.1rem, env(safe-area-inset-top, 1.1rem))',
          background: isDark ? '#050912' : '#0F172A',
          borderBottom: isDark ? '1px solid rgba(255,255,255,0.05)' : 'none',
        }}
      >
        <div className="flex items-center justify-between">
          <div>
            <motion.div
              className="flex items-center gap-2"
              initial={{ opacity: 0, y: -18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ type: 'spring', stiffness: 280, damping: 22, delay: 0.05 }}
            >
              <h1 className="font-display font-extrabold text-2xl text-white tracking-tight leading-none">
                eTally
              </h1>
              <span className="text-[9px] font-display font-bold tracking-widest text-slate-600 bg-slate-800 px-2 py-0.5 rounded-lg">
                v2
              </span>
            </motion.div>
            <motion.p
              className="font-body text-[11px] mt-1 tracking-wide"
              style={{ color: isDark ? '#3B82F6' : '#64748B' }}
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ type: 'spring', stiffness: 280, damping: 22, delay: 0.13 }}
            >
              Current Pay Period: {new Date(currentPeriod.start + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} – {new Date(currentPeriod.end + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
            </motion.p>
          </div>

          <div className="flex items-center gap-2">
            {/* Theme toggle */}
            <motion.button
              whileTap={{ scale: 0.88 }}
              onClick={toggleTheme}
              initial={{ opacity: 0, scale: 0.7 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.22, type: 'spring', stiffness: 320, damping: 28 }}
              className="w-10 h-10 rounded-2xl flex items-center justify-center"
              style={{ background: 'rgba(255,255,255,0.07)' }}
              aria-label="Toggle theme"
            >
              {isDark ? (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                  <circle cx="12" cy="12" r="4" stroke="#94A3B8" strokeWidth="1.8" />
                  <path
                    d="M12 2v2M12 20v2M2 12h2M20 12h2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41"
                    stroke="#94A3B8"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                  />
                </svg>
              ) : (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                  <path
                    d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z"
                    stroke="#94A3B8"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              )}
            </motion.button>

            {/* About button */}
            <motion.button
              whileTap={{ scale: 0.88 }}
              onClick={() => setAboutOpen(true)}
              initial={{ opacity: 0, scale: 0.7 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.28, type: 'spring', stiffness: 320, damping: 28 }}
              className="w-10 h-10 rounded-2xl flex items-center justify-center"
              style={{ background: 'rgba(255,255,255,0.07)' }}
              aria-label="About eTally"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="9" stroke="#475569" strokeWidth="1.8" />
                <path d="M12 11v6" stroke="#475569" strokeWidth="1.8" strokeLinecap="round" />
                <circle cx="12" cy="8" r="0.5" fill="#475569" stroke="#475569" strokeWidth="1.5" />
              </svg>
            </motion.button>
          </div>
        </div>
      </header>

      {/* Tab content */}
      <main className="flex-1 overflow-hidden relative" style={{ background: mainBg }}>
        <AnimatePresence mode="wait" custom={direction}>
          <motion.div
            key={tab}
            custom={direction}
            initial={{ x: direction > 0 ? 40 : -40, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: direction > 0 ? -40 : 40, opacity: 0 }}
            transition={{ type: 'tween', duration: 0.22, ease: 'easeInOut' }}
            className="absolute inset-0"
          >
            {tab === 'track' ? <TrackTab /> : <LogTab />}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Bottom nav */}
      <BottomNav active={tab} setActive={handleTabChange} />

      {/* About sheet */}
      <AboutSheet isOpen={aboutOpen} onClose={() => setAboutOpen(false)} />
    </div>
  )
}
