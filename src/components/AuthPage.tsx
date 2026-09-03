import { useState } from 'react'
import { supabase } from '../lib/supabase'
import { Wallet, Mail, Lock, User as UserIcon } from 'lucide-react'

export function AuthPage() {
  const [mode, setMode] = useState<'signin' | 'signup'>('signin')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      if (mode === 'signup') {
        const { error } = await supabase.auth.signUp({ email, password })
        if (error) throw error
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password })
        if (error) throw error
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'خطایی رخ داد'
      const fa: Record<string,string> = {
        'Invalid login credentials': 'ایمیل یا رمز عبور اشتباه است',
        'User already registered': 'این ایمیل قبلاً ثبت شده است',
      }
      setError(fa[msg] ?? msg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-50 via-brand-50/40 to-slate-100 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 p-4">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-600 text-white shadow-lg shadow-brand-600/30">
            <Wallet size={28} />
          </div>
          <h1 className="text-2xl font-extrabold text-slate-800 dark:text-slate-100">هوش دفتر مالی من</h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">مدیریت درآمد، هزینه، پس‌انداز و سرمایه‌گذاری</p>
        </div>

        <div className="card">
          <div className="mb-5 flex rounded-xl bg-slate-100 p-1">
            <button
              onClick={() => setMode('signin')}
              className={`flex-1 rounded-lg py-2 text-sm font-semibold transition-all ${mode==='signin' ? 'bg-white text-brand-700 shadow-sm' : 'text-slate-500'}`}
            >ورود</button>
            <button
              onClick={() => setMode('signup')}
              className={`flex-1 rounded-lg py-2 text-sm font-semibold transition-all ${mode==='signup' ? 'bg-white text-brand-700 shadow-sm' : 'text-slate-500'}`}
            >ثبت‌نام</button>
          </div>

          <form onSubmit={submit} className="space-y-4">
            <div>
              <label className="label">ایمیل</label>
              <div className="relative">
                <Mail size={18} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input type="email" required value={email} onChange={e=>setEmail(e.target.value)}
                  className="input pr-10" placeholder="you@example.com" />
              </div>
            </div>
            <div>
              <label className="label">رمز عبور</label>
              <div className="relative">
                <Lock size={18} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input type="password" required minLength={6} value={password} onChange={e=>setPassword(e.target.value)}
                  className="input pr-10" placeholder="حداقل ۶ کاراکتر" />
              </div>
            </div>

            {error && (
              <div className="rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-600 animate-fade-in">{error}</div>
            )}

            <button type="submit" disabled={loading} className="btn-primary w-full">
              {loading ? 'لطفاً صبر کنید…' : mode === 'signin' ? 'ورود به حساب' : 'ساخت حساب'}
            </button>
          </form>

          <div className="mt-5 flex items-center gap-2 rounded-xl bg-brand-50/60 px-4 py-3 text-xs text-brand-700">
            <UserIcon size={16} />
            <span>اطلاعات شما کاملاً شخصی و امن است و فقط روی حساب شما قابل مشاهده است.</span>
          </div>
        </div>
      </div>
    </div>
  )
}
