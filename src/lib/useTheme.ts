import { useStore } from '../store/useStore'

export function useTheme() {
  const theme = useStore((s) => s.theme)
  const isDark = theme === 'dark'
  return {
    isDark,
    surface: isDark ? 'rgba(255,255,255,0.07)' : '#FFFFFF',
    surfaceBorder: isDark ? '1px solid rgba(255,255,255,0.1)' : '1px solid rgba(241,245,249,1)',
    textPrimary: isDark ? '#F8FAFC' : '#0F172A',
    textSecondary: isDark ? '#94A3B8' : '#64748B',
    textMuted: isDark ? '#475569' : '#94A3B8',
    labelColor: isDark ? '#64748B' : '#94A3B8',
    toggleBg: isDark ? 'rgba(255,255,255,0.08)' : '#F1F5F9',
    selectColor: isDark ? '#F8FAFC' : '#334155',
    navBg: isDark ? '#080D1A' : '#FFFFFF',
    navBorder: isDark ? 'rgba(255,255,255,0.07)' : '#F1F5F9',
  }
}
