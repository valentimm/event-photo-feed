import { Link } from 'react-router-dom'

export function HomePage() {
  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-b from-fuchsia-950/30 via-zinc-950 to-zinc-950">
      <div className="flex flex-1 flex-col items-center justify-center px-6 py-16 text-center">
        <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-3xl bg-fuchsia-500/20 text-5xl">
          📸
        </div>
        <h1 className="text-4xl font-bold text-white">Feed do Evento</h1>
        <p className="mt-4 max-w-md text-lg text-zinc-400">
          Um álbum colaborativo para casamentos, festas e celebrações — como o Dots
          Memories, direto no navegador.
        </p>

        <div className="mt-10 grid max-w-sm gap-4 text-left text-sm text-zinc-400">
          <div className="flex gap-3 rounded-xl border border-white/10 bg-white/5 p-4">
            <span className="text-2xl">📱</span>
            <div>
              <p className="font-medium text-white">Escaneie o QR Code</p>
              <p>Sem baixar app — convidados entram pelo link do evento.</p>
            </div>
          </div>
          <div className="flex gap-3 rounded-xl border border-white/10 bg-white/5 p-4">
            <span className="text-2xl">🤝</span>
            <div>
              <p className="font-medium text-white">Álbum colaborativo</p>
              <p>Todos postam fotos e vídeos no mesmo lugar, em tempo real.</p>
            </div>
          </div>
          <div className="flex gap-3 rounded-xl border border-white/10 bg-white/5 p-4">
            <span className="text-2xl">📅</span>
            <div>
              <p className="font-medium text-white">Linha do tempo</p>
              <p>Memórias organizadas por dia — reviva cada momento.</p>
            </div>
          </div>
        </div>

        <Link
          to="/admin"
          className="mt-10 rounded-2xl bg-indigo-500 px-8 py-4 font-semibold text-white shadow-lg transition hover:bg-indigo-400"
        >
          Sou organizador →
        </Link>
      </div>
    </div>
  )
}
