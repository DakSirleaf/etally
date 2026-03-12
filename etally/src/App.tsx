import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import TrackTab from './components/TrackTab'
import LogTab from './components/LogTab'
import BottomNav from './components/BottomNav'

type Tab = 'track' | 'log'

export default function App() {
  const [tab, setTab] = useState<Tab>('track')
  const [direction, setDirection] = useState(1)

  const handleTabChange = (newTab: Tab) => {
    setDirection(newTab === 'log' ? 1 : -1)
    setTab(newTab)
  }

  return (
    <div className="flex flex-col" style={{ height: '100dvh', overflow: 'hidden' }}>
      {/* Header */}
      <header
        className="bg-slate-900 flex-shrink-0 px-5 pb-4"
        style={{ paddingTop: 'max(1.1rem, env(safe-area-inset-top, 1.1rem))' }}
      >
        <div className="flex items-end justify-between">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-display font-extrabold text-2xl text-white tracking-tight leading-none">
                eTally
              </h1>
              <span className="text-[9px] font-display font-bold tracking-widest text-slate-600 bg-slate-800 px-2 py-0.5 rounded-lg">
                v2
              </span>
            </div>
            <p className="font-body text-[11px] text-slate-500 mt-1 tracking-wide">
              A time tracker for eCat
            </p>
          </div>
          <div
            className="w-9 h-9 rounded-2xl flex items-center justify-center"
            style={{ background: 'rgba(255,255,255,0.06)' }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="12" r="9" stroke="#475569" strokeWidth="1.8" />
              <path d="M12 7v5l3 3" stroke="#475569" strokeWidth="1.8" strokeLinecap="round" />
            </svg>
          </div>
        </div>
      </header>

      {/* Tab content */}
      <main className="flex-1 overflow-hidden relative" style={{ background: '#F1F5F9' }}>
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
    </div>
  )
}
