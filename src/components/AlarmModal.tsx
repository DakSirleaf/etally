import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Alarm, ToneId, RepeatMode, playTone } from '../lib/useAlarm'

interface AlarmModalProps {
  isOpen: boolean
  onClose: () => void
  alarms: Alarm[]
  setAlarms: React.Dispatch<React.SetStateAction<Alarm[]>>
  snoozed: boolean
  cancelSnooze: () => void
  previewTone: (tone?: ToneId) => void
}

const TONES: { id: ToneId; name: string }[] = [
  { id: 'radar', name: 'Radar' },
  { id: 'pulse', name: 'Pulse' },
  { id: 'chime', name: 'Chime' },
  { id: 'buzz', name: 'Buzz' },
  { id: 'beacon', name: 'Beacon' },
  { id: 'alert', name: 'Alert' },
  { id: 'bell', name: 'Bell' },
  { id: 'marimba', name: 'Marimba' },
]

const REPEAT_OPTIONS: { id: RepeatMode; label: string }[] = [
  { id: 'once', label: 'Once' },
  { id: 'daily', label: 'Daily' },
  { id: 'weekdays', label: 'Mon-Fri' },
  { id: 'weekends', label: 'Sat-Sun' },
]

export default function AlarmModal({
  isOpen,
  onClose,
  alarms,
  setAlarms,
  snoozed,
  cancelSnooze,
}: AlarmModalProps) {
  const [editingId, setEditingId] = useState<string | number | null>(null)
  const [hour, setHour] = useState(7)
  const [minute, setMinute] = useState(0)
  const [label, setLabel] = useState('Shift Alert')
  const [tone, setTone] = useState<ToneId>('radar')
  const [repeat, setRepeat] = useState<RepeatMode>('once')
  const [showForm, setShowForm] = useState(false)

  if (!isOpen) return null

  const openNewForm = () => {
    setEditingId(null)
    setHour(7)
    setMinute(0)
    setLabel('Shift Alert')
    setTone('radar')
    setRepeat('once')
    setShowForm(true)
  }

  const openEditForm = (alarm: Alarm) => {
    setEditingId(alarm.id)
    setHour(alarm.hour)
    setMinute(alarm.minute)
    setLabel(alarm.label)
    setTone(alarm.tone || 'radar')
    setRepeat(alarm.repeat || 'once')
    setShowForm(true)
  }

  const handleSave = () => {
    if (editingId !== null) {
      setAlarms((prev) =>
        prev.map((a) =>
          a.id === editingId
            ? { ...a, hour, minute, label, tone, repeat, enabled: true, fired: false }
            : a
        )
      );
    } else {
      const newAlarm: Alarm = {
        id: Date.now().toString(),
        hour,
        minute,
        label,
        tone,
        repeat,
        enabled: true,
        fired: false,
      };
      setAlarms((prev) => [...prev, newAlarm]);
    }
    setShowForm(false);
  };

  const toggleAlarm = (id: string | number) => {
    setAlarms((prev) =>
      prev.map((a) => (a.id === id ? { ...a, enabled: !a.enabled } : a))
    )
  }

  const deleteAlarm = (id: string | number) => {
    setAlarms((prev) => prev.filter((a) => a.id !== id))
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-end sm:items-center justify-center"
        onClick={onClose}
      >
        <motion.div
          initial={{ y: '100%' }}
          animate={{ y: 0 }}
          exit={{ y: '100%' }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          onClick={(e) => e.stopPropagation()}
          className="w-full max-w-md bg-[#0F172A] border-t sm:border border-slate-800 sm:rounded-3xl rounded-t-3xl p-6 space-y-4 max-h-[85vh] overflow-y-auto"
        >
          <div className="flex items-center justify-between">
            <h2 className="font-sans-ui font-extrabold text-lg text-white">Shift Alarms</h2>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-slate-800 text-slate-400 flex items-center justify-center"
            >
              ✕
            </button>
          </div>

          {snoozed && (
            <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-between">
              <span className="text-xs text-amber-400 font-sans-ui font-bold">Alarm Snoozed (5 min)</span>
              <button
                onClick={cancelSnooze}
                className="text-[10px] font-sans-ui font-bold bg-amber-500/20 text-amber-300 px-2.5 py-1 rounded-lg"
              >
                Cancel Snooze
              </button>
            </div>
          )}

          {!showForm ? (
            <div className="space-y-3">
              {alarms.length === 0 ? (
                <div className="py-8 text-center text-slate-400 space-y-2">
                  <p className="text-3xl">⏰</p>
                  <p className="text-xs font-sans-ui">No alarms configured.</p>
                </div>
              ) : (
                alarms.map((alarm) => {
                  const h = alarm.hour % 12 || 12
                  const ap = alarm.hour < 12 ? 'AM' : 'PM'
                  const timeStr = `${h}:${String(alarm.minute).padStart(2, '0')} ${ap}`
                  return (
                    <div
                      key={alarm.id}
                      className="p-4 rounded-2xl bg-slate-800/80 border border-slate-700/60 flex items-center justify-between"
                    >
                      <button onClick={() => openEditForm(alarm)} className="text-left flex-1">
                        <p className="numeric-mono font-sans-ui font-black text-2xl text-white">{timeStr}</p>
                        <p className="text-xs text-slate-400 font-body">{alarm.label}</p>
                      </button>

                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => toggleAlarm(alarm.id)}
                          className={`w-12 h-7 rounded-full transition-colors p-1 relative ${
                            alarm.enabled ? 'bg-blue-600' : 'bg-slate-700'
                          }`}
                        >
                          <div
                            className={`w-5 h-5 rounded-full bg-white transition-transform ${
                              alarm.enabled ? 'translate-x-5' : 'translate-x-0'
                            }`}
                          />
                        </button>
                        <button
                          onClick={() => deleteAlarm(alarm.id)}
                          className="text-slate-500 hover:text-rose-400 text-sm p-1"
                        >
                          🗑️
                        </button>
                      </div>
                    </div>
                  )
                })
              )}

              <button
                onClick={openNewForm}
                className="w-full py-3.5 rounded-2xl bg-blue-600 text-white font-sans-ui font-bold text-xs tracking-wider"
              >
                + ADD ALARM
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] text-slate-400 font-sans-ui font-bold block mb-1">HOUR (0-23)</label>
                  <input
                    type="number"
                    min={0}
                    max={23}
                    value={hour}
                    onChange={(e) => setHour(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white font-sans-ui"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-slate-400 font-sans-ui font-bold block mb-1">MINUTE (0-59)</label>
                  <input
                    type="number"
                    min={0}
                    max={59}
                    value={minute}
                    onChange={(e) => setMinute(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white font-sans-ui"
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] text-slate-400 font-sans-ui font-bold block mb-1">LABEL</label>
                <input
                  type="text"
                  value={label}
                  onChange={(e) => setLabel(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white font-sans-ui"
                />
              </div>

              <div>
                <label className="text-[10px] text-slate-400 font-sans-ui font-bold block mb-1">TONE</label>
                <div className="grid grid-cols-4 gap-1.5">
                  {TONES.map((t) => (
                    <button
                      key={t.id}
                      onClick={() => {
                        setTone(t.id)
                        playTone(t.id)
                      }}
                      className={`py-2 rounded-xl text-[11px] font-sans-ui font-bold ${
                        tone === t.id
                          ? 'bg-blue-600 text-white'
                          : 'bg-slate-800 text-slate-400 hover:text-white'
                      }`}
                    >
                      {t.name}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-[10px] text-slate-400 font-sans-ui font-bold block mb-1">REPEAT</label>
                <div className="grid grid-cols-4 gap-1.5">
                  {REPEAT_OPTIONS.map((r) => (
                    <button
                      key={r.id}
                      onClick={() => setRepeat(r.id)}
                      className={`py-2 rounded-xl text-[11px] font-sans-ui font-bold ${
                        repeat === r.id
                          ? 'bg-blue-600 text-white'
                          : 'bg-slate-800 text-slate-400 hover:text-white'
                      }`}
                    >
                      {r.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  onClick={() => setShowForm(false)}
                  className="flex-1 py-3 rounded-xl bg-slate-800 text-slate-300 font-sans-ui font-bold text-xs"
                >
                  CANCEL
                </button>
                <button
                  onClick={handleSave}
                  className="flex-1 py-3 rounded-xl bg-blue-600 text-white font-sans-ui font-bold text-xs"
                >
                  SAVE
                </button>
              </div>
            </div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}