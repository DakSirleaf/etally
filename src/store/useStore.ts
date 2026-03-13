import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { LogEntry, StaffRole, Theme } from '../types'

interface StoreState {
  entries: LogEntry[]
  role: StaffRole | null
  theme: Theme
  addEntry: (entry: LogEntry) => void
  removeEntry: (id: number) => void
  clearAll: () => void
  setRole: (role: StaffRole) => void
  toggleTheme: () => void
}

export const useStore = create<StoreState>()(
  persist(
    (set) => ({
      entries: [],
      role: null,
      theme: 'dark',
      addEntry: (entry) =>
        set((state) => ({ entries: [...state.entries, entry] })),
      removeEntry: (id) =>
        set((state) => ({
          entries: state.entries.filter((e) => e.id !== id),
        })),
      clearAll: () => set({ entries: [] }),
      setRole: (role) => set({ role }),
      toggleTheme: () =>
        set((state) => ({ theme: state.theme === 'dark' ? 'light' : 'dark' })),
    }),
    { name: 'etally-v1' }
  )
)
