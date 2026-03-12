import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { LogEntry } from '../types'

interface StoreState {
  entries: LogEntry[]
  addEntry: (entry: LogEntry) => void
  removeEntry: (id: number) => void
  clearAll: () => void
}

export const useStore = create<StoreState>()(
  persist(
    (set) => ({
      entries: [],
      addEntry: (entry) =>
        set((state) => ({ entries: [...state.entries, entry] })),
      removeEntry: (id) =>
        set((state) => ({
          entries: state.entries.filter((e) => e.id !== id),
        })),
      clearAll: () => set({ entries: [] }),
    }),
    { name: 'etally-v1' }
  )
)
