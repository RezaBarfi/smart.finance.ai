import { useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../lib/auth'
import { useI18n } from '../lib/i18n'
import { Wallet, Mail, Lock, User as UserIcon, ArrowLeft } from 'lucide-react'

export function AuthPage({ forceMode }: { forceMode?: 'reset' }) {
  const { t } = useI18n()
  const { passwordRecovery, clearPasswordRecovery } = useAuth()
  const [mode, setMode] = useState<'signin' | 'signup' | 'forgot' | 'reset'>(forceMode ?? 'signin')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [newPwd, setNewPwd] = useState('')
  const [confirmPwd, setConfirmPwd] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const isReset = mode === 'reset' || (forceMode === 'reset')

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSuccess(null)
    setLoading(true)
    try {
      if (mode === 'signup') {
        const { error } = await supabase.auth.signUp({ email, password })
        if (error) throw error
      } else if (mode === 'signin') {
        const { error } = await supabase.auth.signInWithPassword({ email, password })
        if (error) throw error
      } else if (mode === 'forgot') {
        const redirectTo = window.location.origin
        const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo })
        if (error) throw error
        setSuccess(t('auth.forgotSuccess'))
      } else if (mode === 'reset') {
        if (newPwd.length < 6) {
          setError(t('auth.pwdMin'))
          return
        }
        if (newPwd !== confirmPwd) {
          setError(t('settings.pwdMismatch'))
          return
        }
        const { error } = await supabase.auth.updateUser({ password: newPwd })
        if (error) throw error
        setSuccess(t('settings.pwdSuccess'))
        clearPasswordRecovery()
        setTimeout(() => { setMode('signin') }, 2000)
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : t('auth.errGeneric')
      const fa: Record<string,string> = {
        'Invalid login credentials': t('auth.errInvalid'),
        'User already registered': t('auth.errExists'),
      }
      setError(fa[msg] ?? msg)
    } finally {
      setLoading(false)
    }
  }

  const switchMode = (m: 'signin' | 'signup') => { setMode(m); setError(null); setSuccess(null) }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-50 via-brand-50/40 to-slate-100 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 p-4">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <div className="glass-icon glass-icon-brand mx-auto mb-4 h-14 w-14 text-brand-600 dark:text-brand-400">
            <Wallet size={28} />
          </div>
          <h1 className="text-2xl font-extrabold text-slate-800 dark:text-slate-100">{t('app.title')}</h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{t('app.subtitle')}</p>
        </div>

        <div className="card">
          {!isReset && mode !== 'forgot' && (
            <div className="mb-5 flex rounded-xl bg-slate-100 p-1">
              <button onClick={() => switchMode('signin')} className={`flex-1 rounded-lg py-2 text-sm font-semibold transition-all ${mode==='signin' ? 'bg-white text-brand-700 shadow-sm' : 'text-slate-500'}`}>{t('auth.signin')}</button>
              <button onClick={() => switchMode('signup')} className={`flex-1 rounded-lg py-2 text-sm font-semibold transition-all ${mode==='signup' ? 'bg-white text-brand-700 shadow-sm' : 'text-slate-500'}`}>{t('auth.signup')}</button>
            </div>
          )}

          {(mode === 'forgot' || isReset) && (
            <button onClick={() => { if (isReset) { clearPasswordRecovery() } setMode('signin'); setError(null); setSuccess(null) }} className="mb-4 flex items-center gap-1.5 text-sm text-brand-600 hover:text-brand-700 transition-colors">
              <ArrowLeft size={16} /> {t('auth.forgotBack')}
            </button>
          )}

          <form onSubmit={submit} className="space-y-4">
            {isReset ? (
              <>
                <div>
                  <label className="label">{t('settings.newPwd')}</label>
                  <div className="relative">
                    <Lock size={18} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input type="password" required minLength={6} value={newPwd} onChange={e=>setNewPwd(e.target.value)} className="input pr-10" placeholder={t('auth.pwdPlaceholder')} />
                  </div>
                </div>
                <div>
                  <label className="label">{t('settings.newPwdConfirm')}</label>
                  <div className="relative">
                    <Lock size={18} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input type="password" required minLength={6} value={confirmPwd} onChange={e=>setConfirmPwd(e.target.value)} className="input pr-10" placeholder={t('auth.pwdPlaceholder')} />
                  </div>
                </div>
              </>
            ) : (
              <>
                <div>
                  <label className="label">{t('auth.email')}</label>
                  <div className="relative">
                    <Mail size={18} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input type="email" required value={email} onChange={e=>setEmail(e.target.value)} className="input pr-10" placeholder="you@example.com" />
                  </div>
                </div>
                {mode !== 'forgot' && (
                  <div>
                    <label className="label">{t('auth.password')}</label>
                    <div className="relative">
                      <Lock size={18} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input type="password" required minLength={6} value={password} onChange={e=>setPassword(e.target.value)} className="input pr-10" placeholder={t('auth.pwdPlaceholder')} />
                    </div>
                  </div>
                )}
              </>
            )}

            {error && <div className="rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-600 animate-fade-in">{error}</div>}
            {success && <div className="rounded-xl bg-emerald-50 px-4 py-3 text-sm text-emerald-600 animate-fade-in">{success}</div>}

            <button type="submit" disabled={loading} className="btn-primary w-full">
              {loading ? t('auth.loading') : mode === 'signin' ? t('auth.signinBtn') : mode === 'signup' ? t('auth.signupBtn') : mode === 'forgot' ? t('auth.forgotBtn') : t('settings.changePwdBtn')}
            </button>
          </form>

          {mode === 'signin' && (
            <button onClick={() => { setMode('forgot'); setError(null) }} className="mt-4 block w-full text-center text-sm text-brand-600 hover:text-brand-700 transition-colors">
              {t('auth.forgot')}
            </button>
          )}

          {!isReset && mode !== 'forgot' && (
            <div className="mt-5 flex items-center gap-2 rounded-xl bg-brand-50/60 px-4 py-3 text-xs text-brand-700">
              <UserIcon size={16} />
              <span>{t('auth.privacy')}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
