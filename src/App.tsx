import { useState } from 'react'
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
import { useStore } from './store/useStore'
import { useAutoArchive } from './lib/useAutoArchive'
import { useSync } from './lib/useSync'
import { useAuth } from './lib/useAuth'
import { getCurrentPayPeriod, formatPeriodRange } from './lib/payPeriod'

type Tab = 'track' | 'log' | 'cal'

export default function App() {
  const { user, loading, signOut } = useAuth()
  const [tab, setTab] = useState<Tab>('track')
  const [aboutOpen, setAboutOpen] = useState(false)
  const [reportOpen, setReportOpen] = useState(false)
  const [vaultOpen, setVaultOpen] = useState(false)
  const role = useStore((s) => s.role)
  const entries = useStore((s: any) => s.entries)
  const vault = useStore((s) => s.vault)
  const theme = useStore((s) => s.theme)
  const toggleTheme = useStore((s) => s.toggleTheme)
  const clearSession = useStore((s) => s.clearSession)
  const isDark = theme === 'dark'

  useAutoArchive()
  useSync(user)

  const handleTabChange = (newTab: Tab) => setTab(newTab)
  const goHome = () => handleTabChange('track')

  const currentPeriod = getCurrentPayPeriod()

  const mainBg = isDark
    ? 'linear-gradient(160deg, #050912 0%, #0A1128 50%, #080D1E 100%)'
    : '#F1F5F9'

  const handleSignOut = async () => {
    await signOut()
    clearSession()
  }

  // Show loading splash while session resolves
  if (loading) {
    return (
      <div
        className="flex items-center justify-center"
        style={{ height: '100dvh', background: '#050912' }}
      >
        <div className="flex flex-col items-center gap-3">
          <h1 className="font-display font-extrabold text-2xl text-white tracking-tight">eTally</h1>
          <div
            style={{
              width: 24,
              height: 24,
              border: '2px solid rgba(255,255,255,0.1)',
              borderTopColor: '#3B82F6',
              borderRadius: '50%',
              animation: 'spin 0.7s linear infinite',
            }}
          />
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
      </div>
    )
  }

  // Gate entire app behind auth
  if (!user) {
    return <AuthScreen />
  }

  return (
    <div
      className="flex flex-col"
      style={{ height: '100dvh', overflow: 'hidden' }}
      data-theme={theme}
    >
      <AnimatePresence>{!role && <RoleSetup />}</AnimatePresence>
      <LegacyMigrationPrompt />

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

          <motion.button
            onClick={goHome}
            whileTap={{ scale: 0.96 }}
            initial={{ opacity: 0, y: -18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ type: 'spring', stiffness: 280, damping: 22, delay: 0.05 }}
            className="text-left"
          >
            <div className="flex items-center gap-2">
              <h1 className="font-display font-extrabold text-2xl text-white tracking-tight leading-none">
                eTally
              </h1>
              <span className="text-[9px] font-display font-bold tracking-widest text-slate-500 bg-slate-800 px-2 py-0.5 rounded-lg">
                v2.0
              </span>
            </div>
            <p
              className="font-body text-[11px] mt-0.5 tracking-wide"
              style={{ color: isDark ? '#3B82F6' : '#64748B' }}
            >
              {formatPeriodRange(currentPeriod)}
            </p>
          </motion.button>

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
                  <path d="M12 2v2M12 20v2M2 12h2M20 12h2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" stroke="#94A3B8" strokeWidth="1.8" strokeLinecap="round" />
                </svg>
              ) : (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                  <path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z" stroke="#94A3B8" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              )}
            </motion.button>

            {/* Vault button */}
            <motion.button
              whileTap={{ scale: 0.88 }}
              onClick={() => setVaultOpen(true)}
              initial={{ opacity: 0, scale: 0.7 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.24, type: 'spring', stiffness: 320, damping: 28 }}
              className="w-10 h-10 rounded-2xl flex items-center justify-center relative"
              style={{ background: vault.length > 0 ? 'rgba(139,92,246,0.15)' : 'rgba(255,255,255,0.07)' }}
              aria-label="Vault"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                <path d="M3 7v13a1 1 0 001 1h16a1 1 0 001-1V7M3 7l2-4h14l2 4M3 7h18M10 11h4" stroke={vault.length > 0 ? '#8B5CF6' : '#94A3B8'} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              {vault.length > 0 && (
                <span
                  className="absolute -top-1 -right-1 min-w-[16px] h-4 px-1 rounded-full text-[9px] font-display font-bold flex items-center justify-center text-white"
                  style={{ background: '#8B5CF6' }}
                >
                  {vault.length}
                </span>
              )}
            </motion.button>

            {/* Export */}
            <motion.button
              whileTap={{ scale: 0.88 }}
              onClick={() => setReportOpen(true)}
              initial={{ opacity: 0, scale: 0.7 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.26, type: 'spring', stiffness: 320, damping: 28 }}
              className="w-10 h-10 rounded-2xl flex items-center justify-center"
              style={{ background: entries.length > 0 ? 'rgba(16,185,129,0.15)' : 'rgba(255,255,255,0.07)' }}
              aria-label="Export report"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" stroke={entries.length > 0 ? '#10B981' : '#94A3B8'} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M7 10l5 5 5-5M12 15V3" stroke={entries.length > 0 ? '#10B981' : '#94A3B8'} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </motion.button>

            {/* Help */}
            <motion.button
              whileTap={{ scale: 0.88 }}
              onClick={() => setAboutOpen(true)}
              initial={{ opacity: 0, scale: 0.7 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.28, type: 'spring', stiffness: 320, damping: 28 }}
              className="h-10 px-3 rounded-2xl flex items-center justify-center gap-1.5"
              style={{ background: 'rgba(255,255,255,0.07)' }}
              aria-label="Help"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="9" stroke="#94A3B8" strokeWidth="1.8" />
                <path d="M9.09 9a3 3 0 015.83 1c0 2-3 3-3 3" stroke="#94A3B8" strokeWidth="1.8" strokeLinecap="round" />
                <circle cx="12" cy="17" r="0.5" fill="#94A3B8" stroke="#94A3B8" strokeWidth="1.5" />
              </svg>
              <span className="text-[10px] font-display font-bold tracking-widest" style={{ color: '#94A3B8' }}>HELP</span>
            </motion.button>

            {/* Sign Out */}
            <motion.button
              whileTap={{ scale: 0.88 }}
              onClick={handleSignOut}
              initial={{ opacity: 0, scale: 0.7 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.30, type: 'spring', stiffness: 320, damping: 28 }}
              className="w-10 h-10 rounded-2xl flex items-center justify-center"
              style={{ background: 'rgba(255,255,255,0.07)' }}
              aria-label="Sign out"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" stroke="#94A3B8" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M16 17l5-5-5-5" stroke="#94A3B8" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M21 12H9" stroke="#94A3B8" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </motion.button>
          </div>
        </div>
      </header>

      <main className="flex-1 overflow-hidden relative" style={{ background: mainBg }}>
        <div className="absolute inset-0 overflow-y-auto">
          {tab === 'track' ? <TrackTab /> : tab === 'log' ? <LogTab onNavigateToTrack={goHome} /> : <CalendarTab onNavigateToTrack={goHome} />}
        </div>
      </main>

      <BottomNav active={tab} setActive={(t: any) => handleTabChange(t)} />

      <AboutSheet isOpen={aboutOpen} onClose={() => setAboutOpen(false)} />
      <ReportModal
        isOpen={reportOpen}
        onClose={() => { setReportOpen(false); goHome() }}
        entries={entries}
        role={role}
      />
      <VaultSheet isOpen={vaultOpen} onClose={() => setVaultOpen(false)} />
    </div>
  )
}
