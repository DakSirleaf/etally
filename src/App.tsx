import { useState, useEffect, useRef } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import TrackTab from './components/TrackTab'
import LogTab from './components/LogTab'
import CalendarTab from './components/CalendarTab'
import BottomNav from './components/BottomNav'
import AboutSheet from './components/AboutSheet'
import RoleSetup from './components/RoleSetup'
import ReportModal from './components/ReportModal'
import VaultSheet from './components/VaultSheet'
import LegacyMigrationPrompt from './components/LegacyMigrationPrompt'
import AuthScreen from './components/AuthScreen'
import AlarmModal from './components/AlarmModal'
import SplashScreen from './components/SplashScreen'
import { useStore } from './store/useStore'
import { useAutoArchive } from './lib/useAutoArchive'
import { useSync } from './lib/useSync'
import { useAuth } from './lib/useAuth'
import { getCurrentPayPeriod, formatPeriodRange } from './lib/payPeriod'
import { useAlarm } from './lib/useAlarm'

type Tab = 'track' | 'log' | 'cal'

export default function App() {
  const [showSplash, setShowSplash] = useState(true)
  if (showSplash) {
    return <SplashScreen onEnter={() => setShowSplash(false)} />
  }
  return <MainApp />
}

function MainApp() {
  const { user, loading, signOut } = useAuth()
  const { alarms, setAlarms, firing, snoozed, previewTone, dismissFiring, snoozeFiring, cancelSnooze } = useAlarm()
  
  const [tab, setTab] = useState<Tab>('track')
  const [reportOpen, setReportOpen] = useState(false)
  const [vaultOpen, setVaultOpen] = useState(false)
  const [alarmOpen, setAlarmOpen] = useState(false)
  const [aboutOpen, setAboutOpen] = useState(false)
  const [creditOpen, setCreditOpen] = useState(false)
  const [menuDrawerOpen, setMenuDrawerOpen] = useState(false)
  
  const [locked, setLocked] = useState(false)
  const lockTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  
  const role = useStore((s) => s.role)
  const entries = useStore((s: any) => s.entries)
  const vault = useStore((s) => s.vault)
  const theme = useStore((s) => s.theme)
  const toggleTheme = useStore((s) => s.toggleTheme)
  const clearSession = useStore((s) => s.clearSession)
  const lockTimeout = useStore((s: any) => s.lockTimeout) as number
  const isDark = theme === 'dark'

  useEffect(() => {
    if (!user || lockTimeout === 0) {
      if (lockTimerRef.current) clearTimeout(lockTimerRef.current)
      return
    }
    const ms = lockTimeout * 60 * 1000
    const reset = () => {
      if (lockTimerRef.current) clearTimeout(lockTimerRef.current)
      lockTimerRef.current = setTimeout(() => setLocked(true), ms)
    }
    const events = ['mousemove', 'mousedown', 'keydown', 'touchstart', 'scroll']
    events.forEach(e => window.addEventListener(e, reset, { passive: true }))
    reset()
    return () => {
      events.forEach(e => window.removeEventListener(e, reset))
      if (lockTimerRef.current) clearTimeout(lockTimerRef.current)
    }
  }, [user, lockTimeout])

  useAutoArchive()
  useSync(user)

  const goHome = () => setTab('track')
  const currentPeriod = getCurrentPayPeriod()

  const handleSignOut = async () => {
    await signOut()
    clearSession()
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[100dvh] bg-[#050912]">
        <div className="flex flex-col items-center gap-3">
          <h1 className="font-display font-extrabold text-2xl text-white tracking-tight">eTally</h1>
          <div className="w-6 h-6 border-2 border-white/10 border-t-blue-500 rounded-full animate-spin" />
        </div>
      </div>
    )
  }

  if (!user) return <AuthScreen />

  if (locked) {
    return (
      <div className="flex flex-col items-center justify-center h-[100dvh] bg-[#050912] px-6">
        <div className="flex flex-col items-center gap-4 w-full max-w-sm">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center bg-blue-500/10 border border-blue-500/20">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
              <rect x="3" y="11" width="18" height="11" rx="2" stroke="#3B82F6" strokeWidth="1.8" />
              <path d="M7 11V7a5 5 0 0110 0v4" stroke="#3B82F6" strokeWidth="1.8" strokeLinecap="round" />
            </svg>
          </div>
          <h1 className="font-display font-extrabold text-2xl text-white">eTally</h1>
          <p className="text-sm text-slate-400">Locked due to inactivity</p>
          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={() => {
              setLocked(false)
              if (lockTimerRef.current) clearTimeout(lockTimerRef.current)
              if (lockTimeout > 0) {
                lockTimerRef.current = setTimeout(() => setLocked(true), lockTimeout * 60 * 1000)
              }
            }}
            className="w-full py-4 rounded-2xl font-display font-bold text-sm tracking-widest text-white mt-4 bg-gradient-to-r from-blue-700 to-blue-500 shadow-lg shadow-blue-500/30"
          >
            UNLOCK
          </motion.button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-[100dvh] overflow-hidden bg-[#050912]" data-theme={theme}>
      <AnimatePresence>{!role && <RoleSetup />}</AnimatePresence>
      <LegacyMigrationPrompt />

      {/* Streamlined Header */}
      <header className="flex-shrink-0 px-5 pt-4 pb-3 bg-[#0F172A] border-b border-slate-800/80">
        <div className="flex items-center justify-between">
          <button onClick={goHome} className="text-left flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center font-display font-black text-blue-400 text-lg">
              e
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-display font-extrabold text-xl text-white tracking-tight leading-none">eTally</h1>
                <span className="text-[9px] font-display font-bold tracking-widest text-slate-400 bg-slate-800 px-1.5 py-0.5 rounded">
                  v2.0
                </span>
              </div>
              <p className="font-body text-[11px] text-blue-400 mt-0.5">{formatPeriodRange(currentPeriod)}</p>
            </div>
          </button>

          <div className="flex items-center gap-2">
            <motion.button
              whileTap={{ scale: 0.92 }}
              onClick={() => setReportOpen(true)}
              className="px-3 h-9 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-xs font-sans-ui font-bold flex items-center gap-1.5"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                <path d="M7 10l5 5 5-5M12 15V3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              </svg>
              EXPORT
            </motion.button>

            <motion.button
              whileTap={{ scale: 0.92 }}
              onClick={() => setMenuDrawerOpen(true)}
              className="w-9 h-9 rounded-xl bg-slate-800 border border-slate-700/60 flex items-center justify-center text-slate-200"
              aria-label="Settings and Tools"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="3" y1="12" x2="21" y2="12" />
                <line x1="3" y1="6" x2="21" y2="6" />
                <line x1="3" y1="18" x2="21" y2="18" />
              </svg>
            </motion.button>
          </div>
        </div>
      </header>

      <main className="flex-1 overflow-hidden relative">
        <div className="absolute inset-0 overflow-y-auto">
          {tab === 'track' ? (
            <TrackTab />
          ) : tab === 'log' ? (
            <LogTab onNavigateToTrack={goHome} />
          ) : (
            <CalendarTab onNavigateToTrack={goHome} />
          )}
        </div>
      </main>

      <BottomNav active={tab} setActive={(t: Tab) => setTab(t)} />

      {/* Utilities Drawer */}
      <AnimatePresence>
        {menuDrawerOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-40 bg-black/70 backdrop-blur-sm"
              onClick={() => setMenuDrawerOpen(false)}
            />
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              className="fixed bottom-0 left-0 right-0 z-50 rounded-t-3xl bg-[#0F172A] border-t border-slate-800 p-6 pb-8"
            >
              <div className="flex justify-center mb-4">
                <div className="w-10 h-1 rounded-full bg-slate-700" />
              </div>

              <div className="grid grid-cols-2 gap-3 mb-4">
                <button
                  onClick={() => { setMenuDrawerOpen(false); setVaultOpen(true) }}
                  className="p-3.5 rounded-2xl bg-slate-800/80 border border-slate-700/60 flex items-center gap-3 text-left"
                >
                  <span className="text-xl">📦</span>
                  <div>
                    <p className="text-xs font-sans-ui font-bold text-white">Vault</p>
                    <p className="text-[10px] text-slate-400">{vault.length} items saved</p>
                  </div>
                </button>

                <button
                  onClick={() => { setMenuDrawerOpen(false); setAlarmOpen(true) }}
                  className="p-3.5 rounded-2xl bg-slate-800/80 border border-slate-700/60 flex items-center gap-3 text-left"
                >
                  <span className="text-xl">⏰</span>
                  <div>
                    <p className="text-xs font-sans-ui font-bold text-white">Shift Alarms</p>
                    <p className="text-[10px] text-slate-400">{alarms.length} active</p>
                  </div>
                </button>

                <button
                  onClick={toggleTheme}
                  className="p-3.5 rounded-2xl bg-slate-800/80 border border-slate-700/60 flex items-center gap-3 text-left"
                >
                  <span className="text-xl">{isDark ? '🌙' : '☀️'}</span>
                  <div>
                    <p className="text-xs font-sans-ui font-bold text-white">Theme</p>
                    <p className="text-[10px] text-slate-400">{isDark ? 'Dark Mode' : 'Light Mode'}</p>
                  </div>
                </button>

                <button
                  onClick={() => { setMenuDrawerOpen(false); setAboutOpen(true) }}
                  className="p-3.5 rounded-2xl bg-slate-800/80 border border-slate-700/60 flex items-center gap-3 text-left"
                >
                  <span className="text-xl">❓</span>
                  <div>
                    <p className="text-xs font-sans-ui font-bold text-white">Help & Guide</p>
                    <p className="text-[10px] text-slate-400">PWA usage tips</p>
                  </div>
                </button>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => { setMenuDrawerOpen(false); setCreditOpen(true) }}
                  className="flex-1 py-3.5 rounded-2xl bg-slate-800 border border-slate-700/60 text-xs font-sans-ui font-bold text-slate-300"
                >
                  About Developer
                </button>
                <button
                  onClick={handleSignOut}
                  className="flex-1 py-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-xs font-sans-ui font-bold text-rose-400"
                >
                  Sign Out
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Alarm Firing Overlay */}
      <AnimatePresence>
        {firing && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="fixed inset-0 z-[100] flex items-center justify-center px-6"
            style={{ background: 'rgba(5,9,18,0.85)', backdropFilter: 'blur(12px)' }}
          >
            <div
              className="rounded-3xl px-6 py-8 text-center w-full max-w-sm"
              style={{ background: '#0F172A', border: '1px solid rgba(37,99,235,0.3)' }}
            >
              <motion.div
                animate={{ scale: [1, 1.15, 1] }}
                transition={{ repeat: Infinity, duration: 1 }}
                className="text-5xl mb-4"
              >
                ⏰
              </motion.div>
              <p className="font-display font-extrabold text-3xl text-white numeric-mono mb-1">
                {(() => {
                  const h = firing.hour % 12 || 12
                  const ap = firing.hour < 12 ? 'AM' : 'PM'
                  return `${h}:${String(firing.minute).padStart(2, '0')} ${ap}`
                })()}
              </p>
              <p className="font-sans-ui font-bold text-base text-blue-400 mb-6">{firing.label}</p>
              <div className="flex gap-3">
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  onClick={snoozeFiring}
                  className="flex-1 py-4 rounded-2xl font-sans-ui font-bold text-xs tracking-widest"
                  style={{
                    background: 'rgba(255,255,255,0.08)',
                    color: '#94A3B8',
                    border: '1px solid rgba(255,255,255,0.1)',
                  }}
                >
                  SNOOZE 5 MIN
                </motion.button>
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  onClick={dismissFiring}
                  className="flex-1 py-4 rounded-2xl font-sans-ui font-bold text-xs tracking-widest text-white"
                  style={{
                    background: 'linear-gradient(135deg, #1D4ED8, #3B82F6)',
                    boxShadow: '0 8px 24px rgba(37,99,235,0.4)',
                  }}
                >
                  DISMISS
                </motion.button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AlarmModal
        isOpen={alarmOpen}
        onClose={() => setAlarmOpen(false)}
        alarms={alarms}
        setAlarms={setAlarms}
        snoozed={snoozed}
        cancelSnooze={cancelSnooze}
        previewTone={previewTone}
      />

      {/* Developer Credit Sheet */}
      <AnimatePresence>
        {creditOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-40 bg-black/70 backdrop-blur-sm"
              onClick={() => setCreditOpen(false)}
            />
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', stiffness: 320, damping: 32 }}
              className="fixed bottom-0 left-0 right-0 z-50 rounded-t-3xl bg-slate-900 border-t border-slate-800 p-6 pb-8"
            >
              <div className="flex justify-center mb-4">
                <div className="w-10 h-1 rounded-full bg-slate-700" />
              </div>
              <div className="flex flex-col items-center text-center">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center font-display font-black text-2xl text-white mb-3">
                  AS
                </div>
                <p className="text-[10px] font-sans-ui font-bold tracking-widest text-slate-400 uppercase mb-1">
                  ABOUT THE DEVELOPER
                </p>
                <h3 className="font-sans-ui font-extrabold text-xl text-white">A. Ace Sirleaf</h3>
                <p className="text-xs text-blue-400 mt-0.5">Founder · Kola Technology Laboratory</p>
                
                <div className="h-px w-full bg-slate-800 my-4" />

                <div className="flex flex-wrap justify-center gap-1.5 mb-3">
                  {['BSc Mathematics', 'BA Economics', 'BSN Nursing', 'MSN · PMHNP'].map((d) => (
                    <span key={d} className="text-[9px] font-sans-ui font-bold tracking-wide px-2 py-1 rounded-lg bg-slate-800 text-slate-300">
                      {d}
                    </span>
                  ))}
                </div>
                <p className="text-xs text-slate-400 leading-relaxed max-w-xs mb-4">
                  Psychiatric nursing professional and software developer building clinical tools that bridge direct patient care and modern technology.
                </p>
                <p className="text-[11px] font-sans-ui font-bold tracking-widest text-slate-500 italic mb-5">
                  "Dare to build it yourself."
                </p>

                <button
                  onClick={() => setCreditOpen(false)}
                  className="w-full py-3.5 rounded-2xl bg-slate-800 border border-slate-700/60 font-sans-ui font-bold text-xs tracking-wider text-white"
                >
                  CLOSE
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <ReportModal
        isOpen={reportOpen}
        onClose={() => { setReportOpen(false); goHome() }}
        entries={entries}
        role={role}
      />

      <VaultSheet isOpen={vaultOpen} onClose={() => setVaultOpen(false)} />
      <AboutSheet isOpen={aboutOpen} onClose={() => setAboutOpen(false)} />
    </div>
  )
}