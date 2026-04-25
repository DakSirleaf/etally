import { useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

interface SplashScreenProps {
  visible: boolean
  onComplete: () => void
}

export default function SplashScreen({ visible, onComplete }: SplashScreenProps) {
  useEffect(() => {
    if (!visible) return
    const t = setTimeout(onComplete, 2500)
    return () => clearTimeout(t)
  }, [visible, onComplete])

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.45, ease: 'easeInOut' }}
          className="fixed inset-0 z-[200] flex flex-col items-center justify-center"
          style={{ background: '#050912' }}
        >
          {/* Wordmark */}
          <motion.h1
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1, ease: 'easeOut' }}
            className="font-display font-black text-white leading-none tracking-tight"
            style={{ fontSize: '56px', letterSpacing: '-2px' }}
          >
            eTally
          </motion.h1>

          {/* Tagline */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.4, delay: 0.4 }}
            className="font-body"
            style={{ color: '#3B82F6', fontSize: '13px', marginTop: '10px' }}
          >
            A time tracker for eCats
          </motion.p>

          {/* Progress line */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="relative overflow-hidden rounded-full"
            style={{ width: '120px', height: '1px', background: 'rgba(255,255,255,0.08)', marginTop: '36px' }}
          >
            <motion.div
              className="absolute inset-y-0 left-0 rounded-full"
              style={{ background: '#3B82F6' }}
              initial={{ width: '0%' }}
              animate={{ width: '100%' }}
              transition={{ duration: 2, delay: 0.5, ease: 'linear' }}
            />
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
