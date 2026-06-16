import { useAuth } from '../lib/auth'

export function Header() {
  const { user, logout } = useAuth()

  return (
    <header className="sticky top-0 z-10 border-b border-white/10 bg-zinc-950/80 backdrop-blur">
      <div className="mx-auto flex max-w-xl items-center justify-between px-4 py-3">
        <div className="flex items-center gap-2">
          <span className="text-xl">📸</span>
          <span className="font-bold text-white">Feed do Evento</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm text-zinc-400">
            Olá, <span className="font-semibold text-white">{user?.username}</span>
          </span>
          <button
            onClick={logout}
            className="rounded-lg border border-white/10 px-3 py-1.5 text-sm text-zinc-300 transition hover:border-white/20 hover:text-white"
          >
            Sair
          </button>
        </div>
      </div>
    </header>
  )
}
