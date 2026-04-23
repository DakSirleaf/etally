import { useEffect } from 'react'
import { useStore } from '../store/useStore'

export function useAutoArchive() {
  const migrationHandled = useStore((s) => s.migrationHandled)
  const archiveClosedPeriods = useStore((s) => s.archiveClosedPeriods)

  useEffect(() => {
    if (migrationHandled) {
      archiveClosedPeriods()
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
}
