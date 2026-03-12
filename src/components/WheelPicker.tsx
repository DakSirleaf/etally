import { useEffect } from 'react'
import { motion, useMotionValue, animate } from 'framer-motion'

interface WheelPickerProps {
  items: string[]
  selected: string
  onChange: (value: string) => void
  label: string
}

const ITEM_HEIGHT = 48
const VISIBLE = 5

export default function WheelPicker({ items, selected, onChange, label }: WheelPickerProps) {
  const containerHeight = ITEM_HEIGHT * VISIBLE
  const offset = Math.floor(VISIBLE / 2) * ITEM_HEIGHT

  const initialIndex = Math.max(0, items.indexOf(selected))
  const y = useMotionValue(-initialIndex * ITEM_HEIGHT)

  useEffect(() => {
    const idx = items.indexOf(selected)
    if (idx >= 0) {
      animate(y, -idx * ITEM_HEIGHT, {
        type: 'spring',
        stiffness: 350,
        damping: 35,
      })
    }
  }, [selected, items, y])

  const snapToIndex = (index: number) => {
    const clamped = Math.max(0, Math.min(index, items.length - 1))
    animate(y, -clamped * ITEM_HEIGHT, {
      type: 'spring',
      stiffness: 350,
      damping: 35,
    })
    onChange(items[clamped])
  }

  const handleDragEnd = () => {
    const currentY = y.get()
    const nearestIndex = Math.round(-currentY / ITEM_HEIGHT)
    snapToIndex(nearestIndex)
  }

  return (
    <div className="flex flex-col items-center gap-3">
      <span className="text-[9px] font-display font-bold tracking-widest text-slate-400 uppercase">
        {label}
      </span>

      <div
        className="relative overflow-hidden"
        style={{ height: containerHeight, width: 76 }}
      >
        {/* Selection highlight tile */}
        <div
          className="absolute inset-x-1 z-10 pointer-events-none rounded-2xl"
          style={{
            top: offset,
            height: ITEM_HEIGHT,
            background: 'rgba(15,23,42,0.06)',
            border: '1px solid rgba(15,23,42,0.08)',
          }}
        />

        {/* Top gradient mask */}
        <div
          className="absolute inset-x-0 top-0 z-20 pointer-events-none"
          style={{
            height: offset,
            background: 'linear-gradient(to bottom, rgba(255,255,255,1) 0%, rgba(255,255,255,0.05) 100%)',
          }}
        />

        {/* Bottom gradient mask */}
        <div
          className="absolute inset-x-0 bottom-0 z-20 pointer-events-none"
          style={{
            height: offset,
            background: 'linear-gradient(to top, rgba(255,255,255,1) 0%, rgba(255,255,255,0.05) 100%)',
          }}
        />

        <motion.div
          drag="y"
          dragConstraints={{
            top: -(items.length - 1) * ITEM_HEIGHT,
            bottom: 0,
          }}
          dragElastic={0.06}
          style={{ y, paddingTop: offset }}
          onDragEnd={handleDragEnd}
          className="cursor-grab active:cursor-grabbing select-none"
        >
          {items.map((item, i) => {
            const isSelected = item === selected
            return (
              <div
                key={item}
                className="flex items-center justify-center"
                style={{ height: ITEM_HEIGHT }}
                onClick={() => snapToIndex(i)}
              >
                <span
                  className="font-display font-bold tabular-nums transition-all duration-150"
                  style={{
                    fontSize: isSelected ? '1.25rem' : '1rem',
                    color: isSelected ? '#0F172A' : '#94A3B8',
                    transform: isSelected ? 'scale(1.05)' : 'scale(0.9)',
                    display: 'block',
                    transition: 'color 0.15s, transform 0.15s',
                  }}
                >
                  {item}
                </span>
              </div>
            )
          })}
        </motion.div>
      </div>
    </div>
  )
}
