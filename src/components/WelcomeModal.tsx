import { motion } from 'framer-motion'

interface WelcomeModalProps {
  onDismiss: () => void
}

const ease = 'easeOut'
const dur = 0.6

function FadeUp({ delay, children }: { delay: number; children: React.ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: dur, delay, ease }}
    >
      {children}
    </motion.div>
  )
}

export default function WelcomeModal({ onDismiss }: WelcomeModalProps) {
  const handleEnter = () => {
    try { localStorage.setItem('etally-welcomed', 'true') } catch {}
    onDismiss()
  }

  return (
    <motion.div
      initial={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.4, ease: 'easeInOut' }}
      className="fixed inset-0 z-[100] flex flex-col items-center justify-center overflow-hidden"
      style={{ background: '#050912' }}
    >
      {/* Floating geometric blobs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none select-none" aria-hidden="true">
        <div className="welcome-blob-1 absolute rounded-full"
          style={{ width: 340, height: 340, background: '#2563EB', opacity: 0.1, filter: 'blur(90px)', top: -80, left: -100 }} />
        <div className="welcome-blob-2 absolute rounded-full"
          style={{ width: 280, height: 200, background: '#7C3AED', opacity: 0.11, filter: 'blur(70px)', bottom: 120, right: -50 }} />
        <div className="welcome-blob-3 absolute rounded-full"
          style={{ width: 220, height: 220, background: '#EC0677', opacity: 0.07, filter: 'blur(80px)', top: '38%', left: '28%' }} />
        <div className="welcome-blob-4 absolute rounded-full"
          style={{ width: 200, height: 300, background: '#2563EB', opacity: 0.09, filter: 'blur(60px)', bottom: -70, left: '8%' }} />
        <div className="welcome-blob-5 absolute rounded-full"
          style={{ width: 160, height: 160, background: '#7C3AED', opacity: 0.12, filter: 'blur(50px)', top: '18%', right: '8%' }} />
        <div className="welcome-blob-6 absolute rounded-full"
          style={{ width: 320, height: 130, background: '#EC0677', opacity: 0.06, filter: 'blur(75px)', top: '72%', right: '15%' }} />
      </div>

      {/* Scrollable content container */}
      <div className="relative z-10 flex flex-col items-center w-full max-w-sm px-6 overflow-y-auto py-10"
        style={{ maxHeight: '100dvh' }}>

        {/* Logo mark */}
        <motion.div
          initial={{ opacity: 0, scale: 0.6 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: dur, delay: 0.1, ease }}
          className="mb-5"
        >
          <svg width="64" height="64" viewBox="0 0 64 64" fill="none">
            <circle cx="32" cy="32" r="29" stroke="white" strokeWidth="2.5" strokeOpacity="0.85" />
            <circle cx="32" cy="32" r="2.5" fill="white" />
            <path d="M32 16v16l9 9" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </motion.div>

        {/* Wordmark */}
        <FadeUp delay={0.22}>
          <h1 className="font-display font-extrabold text-6xl text-white tracking-tight leading-none text-center">
            eTally
          </h1>
        </FadeUp>

        {/* v2.0 badge */}
        <FadeUp delay={0.36}>
          <span
            className="mt-2.5 font-display font-bold tracking-widest px-3 py-1 rounded-full block text-center"
            style={{ background: '#1E293B', color: '#94A3B8', fontSize: '10px' }}
          >
            v2.0
          </span>
        </FadeUp>

        {/* Tagline */}
        <FadeUp delay={0.5}>
          <p className="mt-3 font-body text-base text-center" style={{ color: '#60A5FA' }}>
            A time tracker for eCats
          </p>
        </FadeUp>

        {/* Divider */}
        <motion.div
          initial={{ opacity: 0, scaleX: 0 }}
          animate={{ opacity: 1, scaleX: 1 }}
          transition={{ duration: 0.5, delay: 0.65, ease }}
          className="mt-6 mb-6"
          style={{ width: 64, height: 1, background: '#1E293B', transformOrigin: 'center' }}
        />

        {/* Developer card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: dur, delay: 0.82, ease }}
          className="flex flex-col items-center text-center"
        >
          <span
            className="font-display font-bold tracking-widest"
            style={{ fontSize: '9px', color: '#475569' }}
          >
            DEVELOPED BY
          </span>

          <span className="mt-2 font-display font-extrabold text-2xl text-white leading-tight">
            A. Ace Sirleaf
          </span>

          <span className="mt-1 font-body text-sm" style={{ color: '#60A5FA' }}>
            Kola Technology Laboratory
          </span>

          <p
            className="mt-4 font-body text-xs text-center leading-relaxed"
            style={{ color: '#64748B', maxWidth: '18rem' }}
          >
            Founder · Software Developer · Psychiatric Nursing Professional
          </p>

          <p
            className="mt-1 font-body text-xs text-center leading-relaxed"
            style={{ color: '#64748B', maxWidth: '18rem' }}
          >
            Building tools that bridge clinical practice and modern technology
          </p>

          <p className="mt-4 font-body text-xs italic" style={{ color: '#475569' }}>
            "Dare to build it yourself."
          </p>
        </motion.div>

        {/* Enter app button */}
        <motion.button
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: dur, delay: 1.02, ease }}
          whileTap={{ scale: 0.98 }}
          onClick={handleEnter}
          className="mt-10 w-full py-4 rounded-2xl font-display font-bold tracking-widest text-white"
          style={{ background: 'linear-gradient(135deg, #1D4ED8, #7C3AED)' }}
        >
          ENTER APP
        </motion.button>

        {/* Privacy note */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: dur, delay: 1.18, ease }}
          className="mt-3 font-body text-center"
          style={{ fontSize: '10px', color: '#334155' }}
        >
          eTally is free. Your data stays on your device.
        </motion.p>
      </div>
    </motion.div>
  )
}
