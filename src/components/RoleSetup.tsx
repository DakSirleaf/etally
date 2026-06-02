import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useStore } from '../store/useStore'
import type { StaffRole } from '../types'
import type { ShiftPreference } from '../store/useStore'

const ROLES = [
  { role: 'RN' as StaffRole, label: 'Registered Nurse', abbr: 'RN', desc: 'Callout: Sick Time or AL Day' },
  { role: 'LPN' as StaffRole, label: 'Licensed Practical Nurse', abbr: 'LPN', desc: 'Callout: Sick Time, Vacation Time, or AL Day' },
  { role: 'HST' as StaffRole, label: 'Health Services Technician', abbr: 'HST', desc: 'Callout: Sick Time, Vacation Time, or AL Day' },
  { role: 'HSA' as StaffRole, label: 'Health Services Assistant', abbr: 'HSA', desc: 'Callout: Sick Time, Vacation Time, or AL Day' },
  { role: 'POOL_RN' as StaffRole, label: 'Pool Registered Nurse', abbr: 'Pool', desc: 'Per diem · OT after 40 hrs/week · No callout coverage' },
]

const SHIFTS = [
  { id: 'night' as ShiftPreference, label: 'Night Shift', time: '10:45 PM – 7:15 AM' },
  { id: 'evening' as ShiftPreference, label: 'Evening Shift', time: '2:45 PM – 11:15 PM' },
  { id: 'day' as ShiftPreference, label: 'Day Shift', time: '6:45 AM – 3:15 PM' },
]

const TIMEOUTS = [
  { value: 0, label: 'Off', desc: 'App stays open until you sign out' },
  { value: 5, label: '5 min', desc: 'Recommended for shared devices' },
  { value: 10, label: '10 min', desc: 'Good balance of security and convenience' },
  { value: 20, label: '20 min', desc: 'Relaxed — personal device use' },
]

const cardStyle = {
  background: '#ffffff',
  border: '1px solid rgba(15,17,38,0.08)',
  borderRadius: '16px',
  padding: '16px',
  cursor: 'pointer',
  width: '100%',
  textAlign: 'left' as const,
  display: 'flex',
  alignItems: 'center',
  gap: '16px',
}

export default function RoleSetup() {
  const setRole = useStore((s) => s.setRole)
  const setShiftPreference = useStore((s: any) => s.setShiftPreference)
  const setLockTimeout = useStore((s: any) => s.setLockTimeout)
  const [step, setStep] = useState<1 | 2 | 3>(1)
  const [pendingRole, setPendingRole] = useState<StaffRole | null>(null)
  const [pendingShift, setPendingShift] = useState<ShiftPreference | null>(null)

  const handleRoleSelect = (role: StaffRole) => {
    setPendingRole(role)
    setStep(2)
  }

  const handleShiftSelect = (pref: ShiftPreference) => {
    setPendingShift(pref)
    setStep(3)
  }

  const handleTimeoutSelect = (minutes: number) => {
    if (pendingRole && pendingShift) {
      setRole(pendingRole)
      setShiftPreference(pendingShift)
      setLockTimeout(minutes)
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex flex-col overflow-y-auto"
      style={{ background: '#eef0f8' }}
    >
      <div style={{ height: '4px', background: '#0a0a14', flexShrink: 0 }} />

      <div className="flex-1 flex flex-col items-center justify-center px-6 py-10">

        {/* Step indicator */}
        <div className="flex gap-2 mb-8">
          {[1, 2, 3].map(s => (
            <div key={s} style={{
              width: s === step ? '24px' : '8px',
              height: '8px',
              borderRadius: '100px',
              background: s === step ? '#0a0a14' : s < step ? 'rgba(15,17,38,0.4)' : 'rgba(15,17,38,0.15)',
              transition: 'all 0.3s ease',
            }} />
          ))}
        </div>

        <AnimatePresence mode="wait">
          {step === 1 ? (
            <motion.div
              key="step1"
              initial={{ opacity: 0, x: -16 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -16 }}
              transition={{ type: 'spring', stiffness: 300, damping: 28 }}
              style={{ width: '100%', maxWidth: '340px' }}
            >
              <h2 style={{ fontFamily: 'DM Serif Display, serif', fontSize: '28px', color: '#0a0a14', marginBottom: '6px' }}>What is your role?</h2>
              <p style={{ fontFamily: 'DM Sans, sans-serif', fontSize: '14px', color: '#4a4a55', marginBottom: '24px' }}>This sets your callout pay options.</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {ROLES.map(({ role, label, abbr, desc }, i) => (
                  <motion.button
                    key={role}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.07 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => handleRoleSelect(role)}
                    style={cardStyle}
                  >
                    <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: '#0a0a14', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <span style={{ fontFamily: 'DM Sans, sans-serif', fontSize: '10px', fontWeight: 700, color: '#fff', letterSpacing: '0.5px' }}>{abbr}</span>
                    </div>
                    <div style={{ flex: 1 }}>
                      <p style={{ fontFamily: 'DM Sans, sans-serif', fontSize: '14px', fontWeight: 600, color: '#0a0a14', margin: 0 }}>{label}</p>
                      <p style={{ fontFamily: 'DM Sans, sans-serif', fontSize: '11px', color: '#8a8a95', margin: '2px 0 0' }}>{desc}</p>
                    </div>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                      <path d="M9 18l6-6-6-6" stroke="#8a8a95" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </motion.button>
                ))}
              </div>
            </motion.div>

          ) : step === 2 ? (
            <motion.div
              key="step2"
              initial={{ opacity: 0, x: 16 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 16 }}
              transition={{ type: 'spring', stiffness: 300, damping: 28 }}
              style={{ width: '100%', maxWidth: '340px' }}
            >
              <button
                onClick={() => setStep(1)}
                style={{ fontFamily: 'DM Sans, sans-serif', fontSize: '12px', color: '#8a8a95', background: 'none', border: 'none', cursor: 'pointer', padding: 0, marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '6px' }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                  <path d="M15 18l-6-6 6-6" stroke="#8a8a95" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                Back
              </button>
              <h2 style={{ fontFamily: 'DM Serif Display, serif', fontSize: '28px', color: '#0a0a14', marginBottom: '6px' }}>Which shift do you work?</h2>
              <p style={{ fontFamily: 'DM Sans, sans-serif', fontSize: '14px', color: '#4a4a55', marginBottom: '24px' }}>Sets your default start and end times.</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {SHIFTS.map(({ id, label, time }, i) => (
                  <motion.button
                    key={id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.07 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => handleShiftSelect(id)}
                    style={{ ...cardStyle, justifyContent: 'space-between' }}
                  >
                    <div>
                      <p style={{ fontFamily: 'DM Sans, sans-serif', fontSize: '15px', fontWeight: 600, color: '#0a0a14', margin: 0 }}>{label}</p>
                      <p style={{ fontFamily: 'ui-monospace, monospace', fontSize: '12px', color: '#8a8a95', margin: '3px 0 0' }}>{time}</p>
                    </div>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                      <path d="M9 18l6-6-6-6" stroke="#8a8a95" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </motion.button>
                ))}
              </div>
            </motion.div>

          ) : (
            <motion.div
              key="step3"
              initial={{ opacity: 0, x: 16 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 16 }}
              transition={{ type: 'spring', stiffness: 300, damping: 28 }}
              style={{ width: '100%', maxWidth: '340px' }}
            >
              <button
                onClick={() => setStep(2)}
                style={{ fontFamily: 'DM Sans, sans-serif', fontSize: '12px', color: '#8a8a95', background: 'none', border: 'none', cursor: 'pointer', padding: 0, marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '6px' }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                  <path d="M15 18l-6-6 6-6" stroke="#8a8a95" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                Back
              </button>
              <h2 style={{ fontFamily: 'DM Serif Display, serif', fontSize: '28px', color: '#0a0a14', marginBottom: '6px' }}>Auto-lock timer</h2>
              <p style={{ fontFamily: 'DM Sans, sans-serif', fontSize: '14px', color: '#4a4a55', marginBottom: '8px' }}>Lock the app after inactivity.</p>
              <p style={{ fontFamily: 'DM Sans, sans-serif', fontSize: '12px', color: '#8a8a95', marginBottom: '24px' }}>Recommended for shared or hospital devices. You can change this in Help anytime.</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {TIMEOUTS.map(({ value, label, desc }, i) => (
                  <motion.button
                    key={value}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.07 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => handleTimeoutSelect(value)}
                    style={{ ...cardStyle, justifyContent: 'space-between' }}
                  >
                    <div style={{ flex: 1 }}>
                      <p style={{ fontFamily: 'DM Sans, sans-serif', fontSize: '15px', fontWeight: 600, color: '#0a0a14', margin: 0 }}>{label}</p>
                      <p style={{ fontFamily: 'DM Sans, sans-serif', fontSize: '11px', color: '#8a8a95', margin: '2px 0 0' }}>{desc}</p>
                    </div>
                    {value === 5 && (
                      <span style={{ fontFamily: 'DM Sans, sans-serif', fontSize: '9px', fontWeight: 700, color: '#2563EB', background: '#EFF6FF', borderRadius: '6px', padding: '2px 7px', letterSpacing: '0.5px', flexShrink: 0 }}>
                        RECOMMENDED
                      </span>
                    )}
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" style={{ flexShrink: 0, marginLeft: '8px' }}>
                      <path d="M9 18l6-6-6-6" stroke="#8a8a95" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </motion.button>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  )
}
