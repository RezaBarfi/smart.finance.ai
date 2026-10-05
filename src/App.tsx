import { AuthProvider, useAuth } from './lib/auth'
import { ThemeProvider } from './lib/theme'
import { I18nProvider } from './lib/i18n'
import { AuthPage } from './components/AuthPage'
import { Dashboard } from './components/Dashboard'
import { Spinner } from './components/ui'

function Gate() {
  const { session, loading, passwordRecovery } = useAuth()
  if (loading) {
    return <div className="flex min-h-screen items-center justify-center"><Spinner /></div>
  }
  if (passwordRecovery) return <AuthPage forceMode="reset" />
  return session ? <Dashboard /> : <AuthPage />
}

export default function App() {
  return (
    <I18nProvider>
      <ThemeProvider>
        <AuthProvider>
          <Gate />
        </AuthProvider>
      </ThemeProvider>
    </I18nProvider>
  )
}
