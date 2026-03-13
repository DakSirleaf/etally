import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { LogEntry, StaffRole, Theme } from '../types'

export interface Snapshot {
  id: number
  label: string
  date: string
  entries: LogEntry[]
}

interface StoreState {
  entries: LogEntry[]
  snapshots: Snapshot[]
  role: StaffRole | null
  theme: Theme
  addEntry: (entry: LogEntry) => void
  removeEntry: (id: number) => void
  updateEntry: (entry: LogEntry) => void
  clearAll: () => void
  saveSnapshot: (label: string) => void
  deleteSnapshot: (id: number) => void
  setRole: (role: StaffRole) => void
  toggleTheme: () => void
}

export const useStore = create<StoreState>()(
  persist(
    (set, get) => ({
      entries: [],
      snapshots: [],
      role: null,
      theme: 'dark',
      addEntry: (entry) =>
        set((state) => ({ entries: [...state.entries, entry] })),
      removeEntry: (id) =>
        set((state) => ({ entries: state.entries.filter((e) => e.id !== id) })),
      updateEntry: (entry) =>
        set((state) => ({ entries: state.entries.map((e) => e.id === entry.id ? entry : e) })),
      clearAll: () => set({ entries: [] }),
      saveSnapshot: (label) => {
        const entries = get().entries
        set((state) => ({
          snapshots: [...state.snapshots, {
            id: Date.now(),
            label,
            date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
            entries: [...entries],
          }]
        }))
      },
      deleteSnapshot: (id) =>
        set((state) => ({ snapshots: state.snapshots.filter((s) => s.id !== id) })),
      setRole: (role) => set({ role }),
      toggleTheme: () =>
        set((state) => ({ theme: state.theme === 'dark' ? 'light' : 'dark' })),
    }),
    { name: 'etally-v1' }
  )
)
