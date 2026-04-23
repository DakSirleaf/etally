import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { LogEntry, StaffRole, Theme, VaultPeriod } from '../types'
import {
  getCurrentPayPeriod,
  getPayPeriodForDate,
  isDateInPeriod,
  periodId,
} from '../lib/payPeriod'

export interface Snapshot {
  id: number
  label: string
  date: string
  entries: LogEntry[]
}

function computeTotals(entries: LogEntry[]) {
  const work = entries.filter((e) => e.type !== 'CALLOUT' && e.reason !== 'OFF')
  return {
    reg: work.reduce((s, e) => s + parseFloat(e.reg), 0),
    ot: work.reduce((s, e) => s + parseFloat(e.ot), 0),
    shifts: work.length,
    callouts: entries.filter((e) => e.type === 'CALLOUT').length,
  }
}

interface StoreState {
  entries: LogEntry[]
  snapshots: Snapshot[]
  vault: VaultPeriod[]
  migrationHandled: boolean
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

  archiveClosedPeriods: () => void
  updateVaultPeriod: (period: VaultPeriod) => void
  deleteVaultPeriod: (id: string) => void
  moveAllActiveToLegacy: () => void
  setMigrationHandled: (value: boolean) => void
}

export const useStore = create<StoreState>()(
  persist(
    (set, get) => ({
      entries: [],
      snapshots: [],
      vault: [],
      migrationHandled: false,
      role: null,
      theme: 'dark',

      addEntry: (entry) =>
        set((state) => ({ entries: [...state.entries, entry] })),
      removeEntry: (id) =>
        set((state) => ({ entries: state.entries.filter((e) => e.id !== id) })),
      updateEntry: (entry) =>
        set((state) => ({ entries: state.entries.map((e) => (e.id === entry.id ? entry : e)) })),
      clearAll: () => set({ entries: [] }),

      saveSnapshot: (label) => {
        const entries = get().entries
        set((state) => ({
          snapshots: [
            ...state.snapshots,
            {
              id: Date.now(),
              label,
              date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
              entries: [...entries],
            },
          ],
        }))
      },
      deleteSnapshot: (id) =>
        set((state) => ({ snapshots: state.snapshots.filter((s) => s.id !== id) })),
      setRole: (role) => set({ role }),
      toggleTheme: () =>
        set((state) => ({ theme: state.theme === 'dark' ? 'light' : 'dark' })),

      archiveClosedPeriods: () => {
        const state = get()
        const current = getCurrentPayPeriod()
        const toArchive = state.entries.filter((e) => !isDateInPeriod(e.date, current))
        if (toArchive.length === 0) return

        const remaining = state.entries.filter((e) => isDateInPeriod(e.date, current))

        const groups = new Map<string, { start: string; end: string; entries: LogEntry[] }>()
        for (const entry of toArchive) {
          const period = getPayPeriodForDate(entry.date)
          const pid = periodId(period)
          if (!groups.has(pid)) {
            groups.set(pid, { start: period.start, end: period.end, entries: [] })
          }
          groups.get(pid)!.entries.push(entry)
        }

        const newVault = [...state.vault]
        const now = new Date().toISOString()

        for (const [pid, { start, end, entries }] of groups) {
          const existingIdx = newVault.findIndex((v) => v.id === pid)
          const allEntries =
            existingIdx >= 0 ? [...newVault[existingIdx].entries, ...entries] : entries

          const vaultPeriod: VaultPeriod = {
            id: pid,
            start,
            end,
            closedAt: existingIdx >= 0 ? newVault[existingIdx].closedAt : now,
            entries: allEntries,
            totals: computeTotals(allEntries),
            edited: existingIdx >= 0 ? true : undefined,
            label: existingIdx >= 0 ? newVault[existingIdx].label : undefined,
          }

          if (existingIdx >= 0) {
            newVault[existingIdx] = vaultPeriod
          } else {
            newVault.push(vaultPeriod)
          }
        }

        set({ entries: remaining, vault: newVault })
      },

      updateVaultPeriod: (period) =>
        set((state) => ({
          vault: state.vault.map((v) => (v.id === period.id ? period : v)),
        })),

      deleteVaultPeriod: (id) =>
        set((state) => ({ vault: state.vault.filter((v) => v.id !== id) })),

      moveAllActiveToLegacy: () => {
        const { entries, vault } = get()
        if (entries.length === 0) {
          set({ migrationHandled: true })
          return
        }
        const sortedDates = entries.map((e) => e.date).sort()
        const legacy: VaultPeriod = {
          id: 'legacy_' + Date.now(),
          start: sortedDates[0],
          end: sortedDates[sortedDates.length - 1],
          closedAt: new Date().toISOString(),
          entries,
          totals: computeTotals(entries),
          label: 'Legacy Log',
        }
        set({ entries: [], vault: [...vault, legacy], migrationHandled: true })
      },

      setMigrationHandled: (value) => set({ migrationHandled: value }),
    }),
    {
      name: 'etally-v1',
      version: 2,
      migrate: (persistedState: any, version: number) => {
        if (version < 2) {
          return {
            ...persistedState,
            vault: persistedState.vault ?? [],
            migrationHandled: persistedState.migrationHandled ?? false,
          }
        }
        return persistedState as StoreState
      },
    }
  )
)
