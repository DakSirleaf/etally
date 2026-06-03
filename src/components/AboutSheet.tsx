import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useStore } from '../store/useStore'
import { useTheme } from '../lib/useTheme'
import { useAuth } from '../lib/useAuth'
import type { StaffRole } from '../types'
import type { ShiftPreference } from '../store/useStore'

interface AboutSheetProps {
  isOpen: boolean
  onClose: () => void
}

const roles: { role: StaffRole; label: string }[] = [
  { role: 'RN', label: 'RN' },
  { role: 'LPN', label: 'LPN' },
  { role: 'HST', label: 'HST' },
  { role: 'HSA', label: 'HSA' },
  { role: 'POOL_RN', label: 'Pool' },
]

const shifts: { id: ShiftPreference; label: string }[] = [
  { id: 'night', label: 'Night' },
  { id: 'evening', label: 'Evening' },
  { id: 'day', label: 'Day' },
]

const timeoutOptions = [
  { value: 0, label: 'Off' },
  { value: 5, label: '5 min' },
  { value: 10, label: '10 min' },
  { value: 20, label: '20 min' },
]

const steps = [
  { step: '01', title: 'Select Shift Type', desc: 'Toggle REGULAR for a scheduled shift, OVERTIME for a pickup shift where all time counts as OT, or CALLOUT to log a missed day.' },
  { step: '02', title: 'Set Your Date', desc: 'Tap the Date tile to open the date picker and select the shift date.' },
  { step: '03', title: 'Set Start & End Times', desc: 'Tap START or END to open the time wheel. Your shift defaults are pre-filled based on your shift preference. Scroll to adjust, then tap SET TIME.' },
  { step: '04', title: 'Review Your Hours', desc: 'REG and OT hours calculate automatically. Regular shifts cap at 8.0 hrs paid; OT kicks in after 8.5 hrs clock time. OT pickup shifts count all time as OT.' },
  { step: '05', title: 'Select a Reason', desc: 'Choose from the dropdown: Standard Shift, Late Relief, Patient Care, Incident Report, CPR Training, Nursing Ed, or Mandatory - State of Emergency.' },
  { step: '06', title: 'Log a Callout', desc: 'Switch to CALLOUT and pick your pay type. RNs use Sick Time or AL Day. LPN/HST/HSA can also use Vacation Time. AL Days are capped at 3 per calendar year. Pool RNs have no callout coverage.' },
  { step: '07', title: 'Duplicate Last Entry', desc: 'Tap DUPLICATE LAST ENTRY to pre-fill the form with your most recent shift times and type — great for back-to-back similar shifts.' },
  { step: '08', title: 'OT Alert — Pool RN', desc: 'If you are a Pool RN, a live weekly hour counter appears as you approach 40 hours. A yellow warning fires at 35 hrs projected; red fires at 40. All hours beyond 40 in the same week are OT rate.' },
  { step: '09', title: 'Schedule Conflict Detection', desc: 'If your imported schedule shows a different shift type for a date you are logging, a purple conflict banner appears. Review before saving. Tap X to dismiss if the conflict is intentional.' },
  { step: '10', title: 'Import Your Schedule', desc: 'In the Calendar tab, tap the camera IMPORT button. Upload a photo of your printed monthly schedule and eTally will read all your shift dates automatically.' },
  { step: '11', title: 'View & Edit the Log', desc: 'Switch to the LOG tab to see all entries. Tap the pencil icon to edit any entry. Tap the trash icon and confirm to delete — always confirmed before deleting.' },
  { step: '12', title: 'Export Your Report', desc: 'Tap the green download icon in the header anytime to generate a pay period report. Preview, print, save as PDF, or download as CSV for Excel.' },
  { step: '13', title: 'Vault & Pay Period Archive', desc: 'Tap the gold vault icon in the header to view archived pay periods. Past periods are automatically moved to the Vault when a new pay period begins.' },
  { step: '14', title: 'Alarm Clock', desc: 'Tap the clock icon in the header to open the Alarm Clock. Set up to 3 alarms with custom labels, tones, and repeat modes (Once, Daily, Weekdays). Tap SNOOZE for 5 extra minutes or DISMISS to clear.' },
  { step: '15', title: 'Auto-Lock', desc: 'If you set an inactivity timeout during setup, the app locks automatically after the chosen time with no activity. Tap UNLOCK to resume. Change the timeout anytime using the AUTO-LOCK TIMER section above.' },
  { step: '16', title: 'Developer Credit', desc: 'Tap the KTL button in the header to view the developer credit screen for eTally by Kola Technology Laboratory.' },
  { step: '17', title: 'Reset Onboarding', desc: 'Tap RESET ONBOARDING below to re-run the role, shift, and auto-lock setup from scratch. Your logged data is not affected.' },
  { step: '18', title: 'Change Your Role or Shift', desc: 'Use the YOUR ROLE and YOUR SHIFT sections above to update your role or default shift times anytime without losing your data.' },
]

export default function AboutSheet({ isOpen, onClose }: AboutSheetProps) {
  const role = useStore((s: any) => s.role) as StaffRole | null
  const setRole = useStore((s: any) => s.setRole)
  const shiftPreference = useStore((s: any) => s.shiftPreference) as ShiftPreference | null
  const setShiftPreference = useStore((s: any) => s.setShiftPreference)
  const lockTimeout = useStore((s: any) => s.lockTimeout) as number
  const setLockTimeout = useStore((s: any) => s.setLockTimeout)
  const resetOnboarding = useStore((s: any) => s.resetOnboarding)
  const { isDark, surface, surfaceBorder, textPrimary, textSecondary, labelColor } = useTheme()
  const { signOut } = useAuth()
  const clearSession = useStore((s: any) => s.clearSession)
  const [confirmSignOut, setConfirmSignOut] = useState(false)
  const [confirmReset, setConfirmReset] = useState(false)

  const handleSignOut = async () => {
    await signOut()
    clearSession()
    setConfirmSignOut(false)
    onClose()
  }

  const handleResetOnboarding = () => {
    resetOnboarding()
    setConfirmReset(false)
    onClose()
  }

  const shiftLabel =
    shiftPreference === 'evening' ? 'Default times: 2:45 PM – 11:15 PM' :
    shiftPreference === 'day' ? 'Default times: 6:45 AM – 3:15 PM' :
    'Default times: 10:45 PM – 7:15 AM'

  const roleDesc =
    role === 'RN' ? 'RN callout coverage: Sick Time or AL Day' :
    role === 'POOL_RN' ? 'Pool RN: Per diem · OT after 40 hrs/week · No callout coverage' :
    `${role} callout coverage: Sick Time, Vacation Time, or AL Day`

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            transition={{ duration: 0.35 }}
            className="fixed inset-0 z-40"
            style={{ background: 'rgba(5,9,18,0.6)', backdropFilter: 'blur(6px)' }}
            onClick={onClose}
          />
          <motion.div
            initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
            transition={{ type: 'spring', stiffness: 320, damping: 32 }}
            className="fixed bottom-0 left-0 right-0 z-50 rounded-t-3xl overflow-hidden"
            style={{
              background: isDark ? '#0A0F1E' : '#ffffff',
              paddingBottom: 'max(2rem, env(safe-area-inset-bottom, 2rem))',
              maxHeight: '92dvh',
              borderTop: isDark ? '1px solid rgba(255,255,255,0.08)' : '1px solid rgba(15,17,38,0.08)',
            }}
          >
            <div className="flex justify-center pt-3 pb-1">
              <div className="w-10 h-1 rounded-full" style={{ background: isDark ? '#1E293B' : '#E2E8F0' }} />
            </div>

            <div className="overflow-y-auto px-4" style={{ maxHeight: 'calc(92dvh - 2rem)' }}>

              {/* Header */}
              <div className="mt-3 mb-4 text-center">
                <h2 className="font-display font-extrabold text-xl" style={{ color: textPrimary }}>Help & Settings</h2>
                <p className="text-[11px] font-body mt-1" style={{ color: textSecondary }}>eTally v2.0</p>
              </div>

              {/* Role */}
              <div className="mb-4">
                <p className="text-[9px] font-display font-bold tracking-widest mb-3 px-1" style={{ color: labelColor }}>YOUR ROLE</p>
                <div className="flex gap-2 flex-wrap">
                  {roles.map(({ role: r, label }) => (
                    <motion.button key={r} whileTap={{ scale: 0.95 }} onClick={() => setRole(r)}
                      className="flex-1 py-3 rounded-2xl font-display font-extrabold text-sm transition-all"
                      style={{
                        minWidth: '60px',
                        background: role === r ? 'rgba(15,17,38,0.08)' : isDark ? 'rgba(255,255,255,0.04)' : '#F8FAFC',
                        border: role === r ? '1.5px solid rgba(15,17,38,0.2)' : isDark ? '1px solid rgba(255,255,255,0.08)' : '1px solid #E2E8F0',
                        color: role === r ? '#0a0a14' : isDark ? '#334155' : '#94A3B8',
                      }}>
                      {label}
                    </motion.button>
                  ))}
                </div>
                <p className="text-[10px] font-body mt-2 px-1" style={{ color: textSecondary }}>{roleDesc}</p>
              </div>

              {/* Shift */}
              <div className="mb-4">
                <p className="text-[9px] font-display font-bold tracking-widest mb-3 px-1" style={{ color: labelColor }}>YOUR SHIFT</p>
                <div className="flex gap-2">
                  {shifts.map(({ id, label }) => (
                    <motion.button key={id} whileTap={{ scale: 0.95 }} onClick={() => setShiftPreference(id)}
                      className="flex-1 py-3 rounded-2xl font-display font-bold text-xs transition-all"
                      style={{
                        background: shiftPreference === id ? 'rgba(15,17,38,0.08)' : isDark ? 'rgba(255,255,255,0.04)' : '#F8FAFC',
                        border: shiftPreference === id ? '1.5px solid rgba(15,17,38,0.2)' : isDark ? '1px solid rgba(255,255,255,0.08)' : '1px solid #E2E8F0',
                        color: shiftPreference === id ? '#0a0a14' : isDark ? '#334155' : '#94A3B8',
                      }}>
                      {label}
                    </motion.button>
                  ))}
                </div>
                <p className="text-[10px] font-body mt-2 px-1" style={{ color: textSecondary }}>{shiftLabel}</p>
              </div>

              {/* Auto-lock */}
              <div className="mb-4">
                <p className="text-[9px] font-display font-bold tracking-widest mb-3 px-1" style={{ color: labelColor }}>AUTO-LOCK TIMER</p>
                <div className="flex gap-2">
                  {timeoutOptions.map(({ value, label }) => (
                    <motion.button key={value} whileTap={{ scale: 0.95 }} onClick={() => setLockTimeout(value)}
                      className="flex-1 py-3 rounded-2xl font-display font-bold text-xs transition-all"
                      style={{
                        background: lockTimeout === value ? 'rgba(15,17,38,0.08)' : isDark ? 'rgba(255,255,255,0.04)' : '#F8FAFC',
                        border: lockTimeout === value ? '1.5px solid rgba(15,17,38,0.2)' : isDark ? '1px solid rgba(255,255,255,0.08)' : '1px solid #E2E8F0',
                        color: lockTimeout === value ? '#0a0a14' : isDark ? '#334155' : '#94A3B8',
                      }}>
                      {label}
                    </motion.button>
                  ))}
                </div>
                <p className="text-[10px] font-body mt-2 px-1" style={{ color: textSecondary }}>
                  {lockTimeout === 0 ? 'App stays open until you sign out.' : `App locks after ${lockTimeout} minutes of inactivity.`}
                </p>
              </div>

              {/* Support */}
              <div className="mb-4 rounded-3xl px-4 py-4" style={{ background: surface, border: surfaceBorder }}>
                <p className="text-[9px] font-display font-bold tracking-widest mb-3" style={{ color: labelColor }}>HELP & SUPPORT</p>
                <p className="text-[11px] font-body mb-3" style={{ color: textSecondary }}>Have a question, found a bug, or want to suggest a feature?</p>
                <div className="flex flex-col gap-2">
                  <motion.button whileTap={{ scale: 0.97 }}
                    onClick={() => { window.location.href = 'tel:6092712288' }}
                    className="flex items-center gap-3 rounded-2xl px-4 py-3 w-full text-left"
                    style={{ background: isDark ? 'rgba(37,99,235,0.1)' : '#EFF6FF', border: isDark ? '1px solid rgba(37,99,235,0.2)' : '1px solid #BFDBFE' }}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                      <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 9.8 19.79 19.79 0 01.06 1.18 2 2 0 012.03 0h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L6.09 7.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 14.92z" stroke="#3B82F6" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    <div>
                      <p className="text-[9px] font-display font-bold tracking-widest" style={{ color: '#3B82F6' }}>CALL</p>
                      <p className="text-xs font-display font-bold" style={{ color: textPrimary }}>609-271-2288</p>
                    </div>
                  </motion.button>
                  <motion.button whileTap={{ scale: 0.97 }}
                    onClick={() => { window.location.href = 'mailto:aasirleaf@gmail.com' }}
                    className="flex items-center gap-3 rounded-2xl px-4 py-3 w-full text-left"
                    style={{ background: isDark ? 'rgba(16,185,129,0.08)' : '#ECFDF5', border: isDark ? '1px solid rgba(16,185,129,0.2)' : '1px solid #A7F3D0' }}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                      <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" stroke="#10B981" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                      <polyline points="22,6 12,13 2,6" stroke="#10B981" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    <div>
                      <p className="text-[9px] font-display font-bold tracking-widest" style={{ color: '#10B981' }}>EMAIL</p>
                      <p className="text-xs font-display font-bold" style={{ color: textPrimary }}>aasirleaf@gmail.com</p>
                    </div>
                  </motion.button>
                </div>
              </div>

              {/* How to use */}
              <div className="mb-4">
                <p className="text-[9px] font-display font-bold tracking-widest mb-3 px-1" style={{ color: labelColor }}>HOW TO USE</p>
                <div className="space-y-2">
                  {steps.map(({ step, title, desc }) => (
                    <div key={step} className="flex gap-3 rounded-2xl px-4 py-3" style={{ background: surface, border: surfaceBorder }}>
                      <span className="font-display font-extrabold text-sm tabular-nums flex-shrink-0 mt-0.5" style={{ color: '#0a0a14' }}>{step}</span>
                      <div>
                        <p className="font-display font-bold text-sm leading-tight" style={{ color: textPrimary }}>{title}</p>
                        <p className="font-body text-[11px] mt-1 leading-relaxed" style={{ color: textSecondary }}>{desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Reset Onboarding */}
              <div className="mb-3">
                <AnimatePresence mode="wait">
                  {!confirmReset ? (
                    <motion.button key="reset-btn" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                      whileTap={{ scale: 0.97 }} onClick={() => setConfirmReset(true)}
                      className="w-full py-3.5 rounded-2xl font-display font-bold text-xs tracking-widest"
                      style={{ background: isDark ? 'rgba(245,158,11,0.08)' : '#FFFBEB', border: isDark ? '1px solid rgba(245,158,11,0.15)' : '1px solid #FDE68A', color: '#D97706' }}>
                      RESET ONBOARDING
                    </motion.button>
                  ) : (
                    <motion.div key="reset-confirm" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                      className="rounded-2xl px-4 py-4"
                      style={{ background: isDark ? 'rgba(245,158,11,0.08)' : '#FFFBEB', border: isDark ? '1px solid rgba(245,158,11,0.2)' : '1px solid #FDE68A' }}>
                      <p className="text-[10px] font-display font-bold tracking-widest mb-1" style={{ color: '#D97706' }}>RESET ONBOARDING?</p>
                      <p className="text-[11px] font-body mb-3" style={{ color: textSecondary }}>This will clear your role, shift, and auto-lock settings. Your logged data is not affected.</p>
                      <div className="flex gap-2">
                        <motion.button whileTap={{ scale: 0.97 }} onClick={handleResetOnboarding}
                          className="flex-1 py-2.5 rounded-xl font-display font-bold text-[10px] tracking-widest text-white"
                          style={{ background: '#D97706' }}>
                          YES, RESET
                        </motion.button>
                        <motion.button whileTap={{ scale: 0.97 }} onClick={() => setConfirmReset(false)}
                          className="flex-1 py-2.5 rounded-xl font-display font-bold text-[10px] tracking-widest"
                          style={{ background: surface, border: surfaceBorder, color: textSecondary }}>
                          CANCEL
                        </motion.button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Sign out */}
              <div className="mb-4">
                <AnimatePresence mode="wait">
                  {!confirmSignOut ? (
                    <motion.button key="signout-btn" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                      whileTap={{ scale: 0.97 }} onClick={() => setConfirmSignOut(true)}
                      className="w-full py-3.5 rounded-2xl font-display font-bold text-xs tracking-widest"
                      style={{ background: isDark ? 'rgba(239,68,68,0.08)' : '#FFF1F2', border: isDark ? '1px solid rgba(239,68,68,0.15)' : '1px solid #FECDD3', color: '#b42318' }}>
                      SIGN OUT
                    </motion.button>
                  ) : (
                    <motion.div key="signout-confirm" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                      className="rounded-2xl px-4 py-4"
                      style={{ background: isDark ? 'rgba(239,68,68,0.08)' : '#FFF1F2', border: isDark ? '1px solid rgba(239,68,68,0.2)' : '1px solid #FECDD3' }}>
                      <p className="text-[10px] font-display font-bold tracking-widest mb-1" style={{ color: '#b42318' }}>SIGN OUT?</p>
                      <p className="text-[11px] font-body mb-3" style={{ color: textSecondary }}>Your data is saved to the cloud and will be here when you sign back in.</p>
                      <div className="flex gap-2">
                        <motion.button whileTap={{ scale: 0.97 }} onClick={handleSignOut}
                          className="flex-1 py-2.5 rounded-xl font-display font-bold text-[10px] tracking-widest text-white"
                          style={{ background: '#b42318' }}>
                          YES, SIGN OUT
                        </motion.button>
                        <motion.button whileTap={{ scale: 0.97 }} onClick={() => setConfirmSignOut(false)}
                          className="flex-1 py-2.5 rounded-xl font-display font-bold text-[10px] tracking-widest"
                          style={{ background: surface, border: surfaceBorder, color: textSecondary }}>
                          CANCEL
                        </motion.button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <motion.button whileTap={{ scale: 0.97 }} onClick={onClose}
                className="w-full mb-2 py-4 rounded-2xl font-display font-bold text-xs tracking-widest text-white"
                style={{ background: '#0a0a14' }}>
                CLOSE
              </motion.button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
