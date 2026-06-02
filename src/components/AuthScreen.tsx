import { useState } from 'react'
import { useAuth } from '../lib/useAuth'
import { supabase } from '../lib/supabase'

export default function AuthScreen() {
  const { signIn, signUp } = useAuth()
  const [mode, setMode] = useState<'signin' | 'signup' | 'reset'>('signin')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)

  const handle = async () => {
    setError(null)
    setLoading(true)
    try {
      if (mode === 'reset') {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: 'https://etally-lyart.vercel.app',
        })
        if (error) throw error
        setSuccess(true)
      } else if (mode === 'signin') {
        const { error } = await signIn(email, password)
        if (error) throw error
      } else {
        const { error } = await signUp(email, password, fullName)
        if (error) throw error
        setSuccess(true)
      }
    } catch (err: any) {
      setError(err.message ?? 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  if (success) return (
    <div className="flex flex-col items-center justify-center h-dvh px-6" style={{ background: '#eef0f8' }}>
      <div style={{ background: '#fff', borderRadius: 24, padding: '40px 32px', maxWidth: 360, width: '100%', textAlign: 'center', border: '1px solid rgba(15,17,38,0.08)' }}>
        <div style={{ width: 48, height: 48, borderRadius: 16, background: '#F0FDF4', border: '1px solid #BBF7D0', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
            <path d="M20 6L9 17l-5-5" stroke="#16A34A" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
        <p style={{ fontFamily: 'DM Serif Display, serif', fontSize: 22, color: '#0a0a14', margin: 0 }}>
          {mode === 'reset' ? 'Check your email' : 'Account created'}
        </p>
        <p style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 14, color: '#4a4a55', marginTop: 8, lineHeight: 1.5 }}>
          {mode === 'reset'
            ? `A password reset link was sent to ${email}. Check your inbox and spam folder.`
            : `A confirmation link was sent to ${email}. Click it to activate your account.`}
        </p>
        <button
          onClick={() => { setMode('signin'); setSuccess(false); setError(null) }}
          style={{ marginTop: 24, width: '100%', padding: '13px', borderRadius: 12, background: '#0a0a14', color: '#fff', fontFamily: 'DM Sans, sans-serif', fontSize: 14, fontWeight: 600, border: 'none', cursor: 'pointer' }}
        >
          Back to Sign In
        </button>
      </div>
    </div>
  )

  return (
    <div className="flex flex-col items-center justify-center h-dvh px-6" style={{ background: '#eef0f8' }}>
      <div style={{ background: '#fff', borderRadius: 24, padding: '40px 32px', maxWidth: 360, width: '100%', border: '1px solid rgba(15,17,38,0.08)' }}>

        {/* Logo */}
        <div style={{ marginBottom: 32, textAlign: 'center' }}>
          <h1 style={{ fontFamily: 'DM Serif Display, serif', fontSize: 32, color: '#0a0a14', margin: 0 }}>eTally</h1>
          <p style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 12, color: '#8a8a95', marginTop: 4 }}>
            {mode === 'signin' ? 'Sign in to your account' : mode === 'signup' ? 'Create your account' : 'Reset your password'}
          </p>
        </div>

        {/* Fields */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {mode === 'signup' && (
            <input
              type="text"
              placeholder="Full name"
              value={fullName}
              onChange={e => setFullName(e.target.value)}
              style={{ padding: '12px 16px', borderRadius: 12, border: '1px solid rgba(15,17,38,0.12)', fontFamily: 'DM Sans, sans-serif', fontSize: 14, color: '#0a0a14', background: '#eef0f8', outline: 'none' }}
            />
          )}
          <input
            type="email"
            placeholder="Email address"
            value={email}
            onChange={e => setEmail(e.target.value)}
            style={{ padding: '12px 16px', borderRadius: 12, border: '1px solid rgba(15,17,38,0.12)', fontFamily: 'DM Sans, sans-serif', fontSize: 14, color: '#0a0a14', background: '#eef0f8', outline: 'none' }}
          />
          {mode !== 'reset' && (
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              style={{ padding: '12px 16px', borderRadius: 12, border: '1px solid rgba(15,17,38,0.12)', fontFamily: 'DM Sans, sans-serif', fontSize: 14, color: '#0a0a14', background: '#eef0f8', outline: 'none' }}
            />
          )}
        </div>

        {/* Forgot password link */}
        {mode === 'signin' && (
          <div style={{ textAlign: 'right', marginTop: 8 }}>
            <button
              onClick={() => { setMode('reset'); setError(null) }}
              style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 12, color: '#8a8a95', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
            >
              Forgot password?
            </button>
          </div>
        )}

        {/* Error */}
        {error && (
          <p style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 12, color: '#b42318', marginTop: 12 }}>{error}</p>
        )}

        {/* Submit */}
        <button
          onClick={handle}
          disabled={loading}
          style={{ marginTop: 20, width: '100%', padding: '13px', borderRadius: 12, background: '#0a0a14', color: '#fff', fontFamily: 'DM Sans, sans-serif', fontSize: 14, fontWeight: 600, border: 'none', cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.6 : 1 }}
        >
          {loading ? 'Please wait…' : mode === 'signin' ? 'Sign in' : mode === 'signup' ? 'Create account' : 'Send reset link'}
        </button>

        {/* Toggle */}
        <p style={{ textAlign: 'center', marginTop: 20, fontFamily: 'DM Sans, sans-serif', fontSize: 13, color: '#4a4a55' }}>
          {mode === 'reset' ? (
            <>
              Remember your password?{' '}
              <button
                onClick={() => { setMode('signin'); setError(null) }}
                style={{ color: '#0a0a14', fontWeight: 600, background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
              >
                Sign in
              </button>
            </>
          ) : mode === 'signin' ? (
            <>
              Don't have an account?{' '}
              <button
                onClick={() => { setMode('signup'); setError(null) }}
                style={{ color: '#0a0a14', fontWeight: 600, background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
              >
                Sign up
              </button>
            </>
          ) : (
            <>
              Already have an account?{' '}
              <button
                onClick={() => { setMode('signin'); setError(null) }}
                style={{ color: '#0a0a14', fontWeight: 600, background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
              >
                Sign in
              </button>
            </>
          )}
        </p>

      </div>
    </div>
  )
}