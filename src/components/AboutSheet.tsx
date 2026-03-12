import { motion, AnimatePresence } from 'framer-motion'

interface AboutSheetProps {
  isOpen: boolean
  onClose: () => void
}

export default function AboutSheet({ isOpen, onClose }: AboutSheetProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-40"
            style={{ background: 'rgba(15,23,42,0.6)', backdropFilter: 'blur(4px)' }}
            onClick={onClose}
          />

          {/* Sheet */}
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', stiffness: 420, damping: 42 }}
            className="fixed bottom-0 left-0 right-0 z-50 bg-white rounded-t-3xl overflow-hidden"
            style={{ paddingBottom: 'max(2rem, env(safe-area-inset-bottom, 2rem))', maxHeight: '90dvh' }}
          >
            {/* Handle */}
            <div className="flex justify-center pt-3 pb-1">
              <div className="w-10 h-1 bg-slate-200 rounded-full" />
            </div>

            <div className="overflow-y-auto" style={{ maxHeight: 'calc(90dvh - 2rem)' }}>

              {/* Hero credit block */}
              <div
                className="mx-4 mt-3 mb-4 rounded-3xl px-5 py-6 flex flex-col"
                style={{ background: 'linear-gradient(135deg, #0F172A 0%, #1E293B 100%)' }}
              >
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h1 className="font-display font-extrabold text-2xl text-white tracking-tight">eTally</h1>
                    <p className="text-[11px] text-slate-400 font-body mt-0.5">A time tracker for eCat</p>
                  </div>
                  <span className="text-[9px] font-display font-bold tracking-widest text-slate-600 bg-slate-800 px-2 py-1 rounded-lg">v2</span>
                </div>

                <div className="h-px bg-slate-700 mb-4" />

                <p className="text-[9px] font-display font-bold tracking-widest text-slate-500 mb-1">DEVELOPED BY</p>
                <p className="font-display font-bold text-lg text-white leading-tight">A. Ace Sirleaf</p>
                <p className="text-[11px] text-blue-400 font-body mt-0.5">Kola Technology Laboratory</p>

                <div className="mt-4 pt-4 border-t border-slate-700">
                  <p className="text-[10px] font-display font-bold tracking-widest text-slate-500 italic">
                    "Dare to build it yourself."
                  </p>
                </div>
              </div>

              {/* How to use */}
              <div className="px-4 pb-2">
                <p className="text-[9px] font-display font-bold tracking-widest text-slate-400 mb-3 px-1">HOW TO USE</p>

                <div className="space-y-2">

                  {[
                    {
                      step: '01',
                      title: 'Select Shift Type',
                      desc: 'Toggle REGULAR for your scheduled shift, or OVERTIME PICKUP for an extra shift where all time is OT.',
                      color: '#2563EB',
                    },
                    {
                      step: '02',
                      title: 'Set Your Date',
                      desc: 'Tap the Date tile to open the calendar and select the shift date.',
                      color: '#2563EB',
                    },
                    {
                      step: '03',
                      title: 'Set Start & End Times',
                      desc: 'Tap the START or END tile to open the time wheel. Scroll the hour and minute drums with your thumb, then tap SET TIME.',
                      color: '#2563EB',
                    },
                    {
                      step: '04',
                      title: 'Review Your Hours',
                      desc: 'REGULAR and OVERTIME hours are calculated automatically. For a standard 8-hour shift with a 1-hour break, regular = 8.00 and OT kicks in after 8.5 hours worked.',
                      color: '#2563EB',
                    },
                    {
                      step: '05',
                      title: 'Select a Reason',
                      desc: 'Choose the reason for the entry from the dropdown — Standard Shift, Late Relief, Patient Care, etc.',
                      color: '#2563EB',
                    },
                    {
                      step: '06',
                      title: 'Save to Log',
                      desc: 'Tap SAVE TO LOG. The button flashes a checkmark to confirm. Switch to the LOG tab to review all entries.',
                      color: '#2563EB',
                    },
                    {
                      step: '07',
                      title: 'Log Tab',
                      desc: 'The Log tab shows total Regular and OT hours, shift count, and every entry. Swipe any entry left to delete it.',
                      color: '#DB2777',
                    },
                    {
                      step: '08',
                      title: 'Day Off',
                      desc: 'Tap MARK DAY OFF to log a scheduled day off with zero hours — keeps your records complete.',
                      color: '#64748B',
                    },
                  ].map(({ step, title, desc, color }) => (
                    <div key={step} className="flex gap-3 bento-tile px-4 py-3">
                      <span
                        className="font-display font-extrabold text-sm tabular-nums flex-shrink-0 mt-0.5"
                        style={{ color }}
                      >
                        {step}
                      </span>
                      <div>
                        <p className="font-display font-bold text-sm text-slate-800 leading-tight">{title}</p>
                        <p className="font-body text-[11px] text-slate-500 mt-1 leading-relaxed">{desc}</p>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Close button */}
                <motion.button
                  whileTap={{ scale: 0.97 }}
                  onClick={onClose}
                  className="w-full mt-4 py-4 rounded-2xl font-display font-bold text-xs tracking-widest text-white"
                  style={{ background: '#0F172A' }}
                >
                  CLOSE
                </motion.button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
