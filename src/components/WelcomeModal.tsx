import { motion } from 'framer-motion'

interface WelcomeModalProps {
  onDismiss: () => void
}

const features = [
  { icon: '⏱', text: 'REG & OT hours calculated automatically' },
  { icon: '📅', text: 'Import your monthly schedule by photo' },
  { icon: '☁️', text: 'Data syncs securely to your account' },
]

export default function WelcomeModal({ onDismiss }: WelcomeModalProps) {
  const handleEnter = () => {
    try { localStorage.setItem('etally-welcomed', 'true') } catch {}
    onDismiss()
  }

  return (
    <motion.div
      initial={{ opacity: 1 }}
      exit={{ opacity: 0, y: -16 }}
      transition={{ duration: 0.4, ease: 'easeInOut' }}
      className="fixed inset-0 z-[100] flex flex-col overflow-y-auto"
      style={{ background: '#eef0f8' }}
    >
      <div style={{ height: '4px', background: '#0a0a14', flexShrink: 0 }} />

      <div className="flex-1 flex flex-col items-center justify-center px-6 py-12">

        <motion.div
          initial={{ opacity: 0, scale: 0.85 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.45, delay: 0.1 }}
          className="mb-5"
        >
          <div
            className="w-16 h-16 rounded-2xl flex items-center justify-center"
            style={{ background: '#0a0a14' }}
          >
            <svg width="30" height="30" viewBox="0 0 32 32" fill="none">
              <circle cx="16" cy="16" r="10" stroke="white" strokeWidth="1.5" />
              <circle cx="16" cy="16" r="1.5" fill="white" />
              <path d="M16 9v7l5 5" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="text-center"
          style={{ fontFamily: 'DM Serif Display, serif', fontSize: '52px', color: '#0a0a14', lineHeight: 1, letterSpacing: '-1px' }}
        >
          eTally
        </motion.h1>

        <motion.span
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="mt-2.5 font-display font-bold tracking-widest"
          style={{ fontSize: '9px', color: '#8a8a95', background: 'rgba(15,17,38,0.06)', padding: '4px 12px', borderRadius: '100px' }}
        >
          v2.0
        </motion.span>

        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.38 }}
          className="text-center mt-4"
          style={{ fontFamily: 'DM Sans, sans-serif', fontSize: '17px', color: '#4a4a55', lineHeight: 1.5 }}
        >
          Track your shifts.<br />Know your hours.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, scaleX: 0 }}
          animate={{ opacity: 1, scaleX: 1 }}
          transition={{ delay: 0.46, duration: 0.4 }}
          className="mt-6 mb-5"
          style={{ width: '40px', height: '1px', background: 'rgba(15,17,38,0.12)' }}
        />

        <div style={{ width: '100%', maxWidth: '300px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {features.map(({ icon, text }, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -12 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.5 + i * 0.08 }}
              style={{
                background: '#ffffff',
                border: '1px solid rgba(15,17,38,0.08)',
                borderRadius: '14px',
                padding: '12px 16px',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
              }}
            >
              <span style={{ fontSize: '16px', flexShrink: 0 }}>{icon}</span>
              <span style={{ fontFamily: 'DM Sans, sans-serif', fontSize: '13px', color: '#4a4a55', lineHeight: 1.4 }}>{text}</span>
            </motion.div>
          ))}
        </div>

        <motion.button
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.74 }}
          whileTap={{ scale: 0.98 }}
          onClick={handleEnter}
          style={{
            marginTop: '28px',
            width: '100%',
            maxWidth: '300px',
            padding: '15px',
            borderRadius: '14px',
            background: '#0a0a14',
            color: '#ffffff',
            fontFamily: 'DM Sans, sans-serif',
            fontSize: '13px',
            fontWeight: 700,
            letterSpacing: '2px',
            border: 'none',
            cursor: 'pointer',
          }}
        >
          GET STARTED
        </motion.button>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.88 }}
          className="mt-3 text-center"
          style={{ fontFamily: 'DM Sans, sans-serif', fontSize: '11px', color: '#8a8a95' }}
        >
          Free to use · Your data stays private
        </motion.p>
      </div>
    </motion.div>
  )
}