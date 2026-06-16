import { AuthProvider, useAuth } from './lib/auth'
import { Feed } from './components/Feed'
import { Header } from './components/Header'
import { LoginScreen } from './components/LoginScreen'

function AppContent() {
  const { user } = useAuth()

  if (!user) return <LoginScreen />

  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      <Header />
      <Feed />
    </div>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  )
}
