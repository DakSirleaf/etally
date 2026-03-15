import { motion } from 'framer-motion'
import { useStore } from '../store/useStore'
import type { StaffRole } from '../types'

const roles: { role: StaffRole; label: string; desc: string; color: string }[] = [
  {
    role: 'RN',
    label: 'RN',
    desc: 'Registered Nurse — Callout coverage: Sick Time or AL Day',
    color: '#3B82F6',
  },
  {
    role: 'LPN',
    label: 'LPN',
    desc: 'Licensed Practical Nurse — Callout coverage: Sick Time, Vacation Time, or AL Day',
    color: '#6366F1',
  },
  {
    role: 'HST',
    label: 'HST',
    desc: 'Health Services Technician — Callout coverage: Sick Time, Vacation Time, or AL Day',
    color: '#8B5CF6',
  },
  {
    role: 'HSA',
    label: 'HSA',
    desc: 'Health Services Assistant — Callout coverage: Sick Time, Vacation Time, or AL Day',
    color: '#06B6D4',
  },
]

export default function RoleSetup() {
  const setRole = useStore((s) => s.setRole)

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, scale: 0.97 }}
      transition={{ duration: 0.3 }}
      className="fixed inset-0 z-50 flex flex-col items-center justify-center px-6"
      style={{ background: 'linear-gradient(160deg, #050912 0%, #0A1128 60%, #080D1E 100%)' }}
    >
      {/* Ambient glow */}
      <div
        className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-72 h-72 rounded-full pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgba(37,99,235,0.15) 0%, transparent 70%)' }}
      />

      <motion.div
        initial={{ opacity: 0, y: 40, scale: 0.94 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ type: 'spring', stiffness: 240, damping: 26, delay: 0.1 }}
        className="w-full max-w-sm relative z-10"
      >
        <motion.div
          initial={{ opacity: 0, y: -24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.18, type: 'spring', stiffness: 300, damping: 28 }}
        >
          <h1 className="font-display font-extrabold text-5xl text-white tracking-tight mb-1 leading-none">
            eTally
          </h1>
          <p className="font-body text-sm text-blue-400 mb-8 tracking-wide">
            A time tracker for eCats
          </p>
        </motion.div>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="text-[10px] font-display font-bold tracking-widest mb-4"
          style={{ color: '#475569' }}
        >
          SELECT YOUR ROLE TO GET STARTED
        </motion.p>

        <div className="flex flex-col gap-3">
          {roles.map(({ role, label, desc, color }, i) => (
            <motion.button
              key={role}
              initial={{ opacity: 0, x: -28 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.36 + i * 0.09, type: 'spring', stiffness: 260, damping: 26 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => setRole(role)}
              className="w-full text-left px-5 py-4 rounded-2xl flex items-center gap-4 transition-all"
              style={{
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(255,255,255,0.09)',
              }}
            >
              <span
                className="font-display font-extrabold text-2xl w-12 flex-shrink-0"
                style={{ color }}
              >
                {label}
              </span>
              <span className="font-body text-xs leading-relaxed" style={{ color: '#94A3B8' }}>
                {desc}
              </span>
            </motion.button>
          ))}
        </div>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.65 }}
          className="text-center text-[10px] font-body mt-6"
          style={{ color: '#334155' }}
        >
          You can change your role anytime via the ⓘ button
        </motion.p>
      </motion.div>
    </motion.div>
  )
}
