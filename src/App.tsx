import { AuthProvider, useAuth } from './lib/auth'
import { ThemeProvider } from './lib/theme'
import { AuthPage } from './components/AuthPage'
import { Dashboard } from './components/Dashboard'
import { Spinner } from './components/ui'

function Gate() {
  const { session, loading } = useAuth()
  if (loading) {
    return <div className="flex min-h-screen items-center justify-center"><Spinner /></div>
  }
  return session ? <Dashboard /> : <AuthPage />
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <Gate />
      </AuthProvider>
    </ThemeProvider>
  )
}
