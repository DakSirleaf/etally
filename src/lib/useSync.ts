import { useEffect, useRef } from 'react'
import { supabase } from './supabase'
import { useStore } from '../store/useStore'
import { useAuth } from './useAuth'

export function useSync() {
  const { user } = useAuth()
  const initialized = useRef(false)
  const syncTimeout = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (!user) { initialized.current = false; return }

    const load = async () => {
      const { data, error } = await supabase
        .from('user_data')
        .select('*')
        .eq('user_id', user.id)
        .single()

      if (data && !error) {
        useStore.setState({
          entries: data.entries ?? [],
          schedule: data.schedule ?? [],
          vault: data.vault ?? [],
        })
      }

      initialized.current = true
    }

    load()
  }, [user])

  useEffect(() => {
    const unsub = useStore.subscribe((state) => {
      if (!user || !initialized.current) return

      if (syncTimeout.current) clearTimeout(syncTimeout.current)

      syncTimeout.current = setTimeout(async () => {
        await supabase
          .from('user_data')
          .upsert({
            user_id: user.id,
            entries: state.entries,
            schedule: state.schedule,
            vault: state.vault,
            updated_at: new Date().toISOString(),
          }, { onConflict: 'user_id' })
      }, 1000)
    })

    return () => {
      unsub()
      if (syncTimeout.current) clearTimeout(syncTimeout.current)
    }
  }, [user])
}