import { useStore } from '../store/useStore'

export function useTheme() {
  const theme = useStore((s) => s.theme)
  const isDark = theme === 'dark'
  return {
    isDark,
    surface: isDark ? 'rgba(255,255,255,0.07)' : '#ffffff',
    surfaceBorder: isDark ? '1px solid rgba(255,255,255,0.1)' : '1px solid rgba(15,17,38,0.08)',
    textPrimary: isDark ? '#F8FAFC' : '#0a0a14',
    textSecondary: isDark ? '#94A3B8' : '#4a4a55',
    textMuted: isDark ? '#475569' : '#8a8a95',
    labelColor: isDark ? '#64748B' : '#8a8a95',
    toggleBg: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(15,17,38,0.05)',
    selectColor: isDark ? '#F8FAFC' : '#0a0a14',
    navBg: isDark ? '#080D1A' : '#ffffff',
    navBorder: isDark ? 'rgba(255,255,255,0.07)' : 'rgba(15,17,38,0.06)',
  }
}