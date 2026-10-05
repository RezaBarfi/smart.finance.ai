import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import type { Session, User } from '@supabase/supabase-js'
import { supabase } from './supabase'

type AuthCtx = {
  session: Session | null
  user: User | null
  loading: boolean
  signOut: () => Promise<void>
  passwordRecovery: boolean
  clearPasswordRecovery: () => void
}

const Ctx = createContext<AuthCtx>({ session: null, user: null, loading: true, signOut: async () => {}, passwordRecovery: false, clearPasswordRecovery: () => {} })

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)
  const [passwordRecovery, setPasswordRecovery] = useState(false)

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session)
      setLoading(false)
    })
    const { data: sub } = supabase.auth.onAuthStateChange((event, sess) => {
      setSession(sess)
      if (event === 'PASSWORD_RECOVERY') {
        setPasswordRecovery(true)
      }
    })
    return () => sub.subscription.unsubscribe()
  }, [])

  const signOut = async () => { await supabase.auth.signOut() }
  const clearPasswordRecovery = () => setPasswordRecovery(false)

  return <Ctx.Provider value={{ session, user: session?.user ?? null, loading, signOut, passwordRecovery, clearPasswordRecovery }}>{children}</Ctx.Provider>
}

export function useAuth() { return useContext(Ctx) }
