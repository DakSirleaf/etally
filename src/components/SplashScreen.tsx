import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

interface SplashScreenProps {
  onEnter: () => void
}

export default function SplashScreen({ onEnter }: SplashScreenProps) {
  const [tapped, setTapped] = useState(false)

  const handleTap = () => {
    if (tapped) return
    setTapped(true)
    setTimeout(onEnter, 600)
  }

  return (
    <AnimatePresence>
      {!tapped ? (
        <motion.div
          key="splash"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0, scale: 1.05 }}
          transition={{ duration: 0.5 }}
          className="fixed inset-0 z-[100] flex flex-col items-center justify-center cursor-pointer select-none"
          style={{ background: 'linear-gradient(160deg, #050912 0%, #0A1128 50%, #080D1E 100%)' }}
          onClick={handleTap}
        >
          {/* Glow ring behind logo */}
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: [0, 1.4, 1.1], opacity: [0, 0.3, 0.15] }}
            transition={{ duration: 1.2, ease: 'easeOut', delay: 0.2 }}
            className="absolute rounded-full"
            style={{ width: 220, height: 220, background: 'radial-gradient(circle, #3B82F6 0%, transparent 70%)' }}
          />

          {/* Outer pulse ring */}
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: [0.8, 1.6], opacity: [0.4, 0] }}
            transition={{ duration: 2, repeat: Infinity, ease: 'easeOut', delay: 1 }}
            className="absolute rounded-full border"
            style={{ width: 160, height: 160, borderColor: 'rgba(59,130,246,0.4)' }}
          />

          {/* Logo */}
          <motion.div
            initial={{ scale: 0.3, opacity: 0, y: 30 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            transition={{ type: 'spring', stiffness: 260, damping: 20, delay: 0.3 }}
            className="relative z-10 mb-8"
          >
            <motion.img
              src="/icon-512.png"
              alt="eTally"
              style={{ width: 110, height: 110, borderRadius: 28 }}
              animate={{ boxShadow: ['0 0 0px rgba(59,130,246,0)', '0 0 40px rgba(59,130,246,0.5)', '0 0 20px rgba(59,130,246,0.3)'] }}
              transition={{ duration: 2, repeat: Infinity, repeatType: 'reverse', delay: 1 }}
            />
          </motion.div>

          {/* App name */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7, type: 'spring', stiffness: 280, damping: 24 }}
            className="relative z-10 text-center mb-2"
          >
            <h1 className="font-display font-extrabold text-white tracking-tight" style={{ fontSize: 42, lineHeight: 1 }}>
              eTally
            </h1>
            <motion.div
              initial={{ scaleX: 0 }}
              animate={{ scaleX: 1 }}
              transition={{ delay: 1.0, duration: 0.5, ease: 'easeOut' }}
              style={{ height: 2, background: 'linear-gradient(90deg, transparent, #3B82F6, transparent)', marginTop: 8, borderRadius: 2 }}
            />
          </motion.div>

          {/* Tagline */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.1 }}
            className="font-body text-center relative z-10"
            style={{ color: '#3B82F6', fontSize: 13, letterSpacing: '0.05em' }}
          >
            Time tracking for eCats
          </motion.p>

          {/* Developer credit */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.4 }}
            className="absolute bottom-16 text-center z-10"
          >
            <p className="font-display font-bold text-[10px] tracking-widest" style={{ color: '#334155' }}>
              DEVELOPED BY
            </p>
            <p className="font-display font-bold text-sm mt-1" style={{ color: '#475569' }}>
              A. Ace Sirleaf
            </p>
            <p className="font-body text-[10px] mt-0.5" style={{ color: '#334155' }}>
              Kola Technology Laboratory
            </p>
          </motion.div>

          {/* Tap to enter */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: [0, 1, 0.5, 1] }}
            transition={{ delay: 1.6, duration: 1.5, repeat: Infinity, repeatType: 'reverse' }}
            className="absolute bottom-6 z-10"
          >
            <p className="font-display font-bold text-[9px] tracking-widest" style={{ color: '#334155' }}>
              TAP TO ENTER
            </p>
          </motion.div>
        </motion.div>
      ) : (
        <motion.div
          key="exit"
          initial={{ opacity: 1 }}
          animate={{ opacity: 0 }}
          transition={{ duration: 0.5 }}
          className="fixed inset-0 z-[100]"
          style={{ background: '#050912' }}
        />
      )}
    </AnimatePresence>
  )
}
