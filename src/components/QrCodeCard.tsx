import { useEffect, useState } from 'react'
import QRCode from 'qrcode'

interface QrCodeCardProps {
  url: string
  title?: string
}

export function QrCodeCard({ url, title = 'QR Code do evento' }: QrCodeCardProps) {
  const [dataUrl, setDataUrl] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    void QRCode.toDataURL(url, { width: 280, margin: 2, color: { dark: '#000000', light: '#ffffff' } })
      .then((result) => {
        if (!cancelled) setDataUrl(result)
      })
      .catch(() => {
        if (!cancelled) setError('Não foi possível gerar o QR Code.')
      })
    return () => {
      cancelled = true
    }
  }, [url])

  function downloadQr() {
    if (!dataUrl) return
    const link = document.createElement('a')
    link.href = dataUrl
    link.download = 'qr-code-evento.png'
    link.click()
  }

  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
      <h3 className="mb-3 text-sm font-semibold text-zinc-300">{title}</h3>
      <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-start">
        <div className="rounded-xl bg-white p-3">
          {dataUrl ? (
            <img src={dataUrl} alt="QR Code do evento" className="h-[280px] w-[280px]" />
          ) : error ? (
            <p className="p-8 text-sm text-red-400">{error}</p>
          ) : (
            <div className="flex h-[280px] w-[280px] items-center justify-center text-zinc-500">
              Gerando…
            </div>
          )}
        </div>
        <div className="min-w-0 flex-1 space-y-3">
          <p className="text-xs text-zinc-500">
            Escaneie para abrir o feed deste evento no celular.
          </p>
          <div className="rounded-xl border border-white/10 bg-zinc-900/60 p-3">
            <p className="break-all text-sm text-zinc-300">{url}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => navigator.clipboard.writeText(url)}
              className="rounded-lg border border-white/10 px-3 py-2 text-sm text-zinc-300 transition hover:text-white"
            >
              Copiar link
            </button>
            <button
              onClick={downloadQr}
              disabled={!dataUrl}
              className="rounded-lg bg-fuchsia-500 px-3 py-2 text-sm font-semibold text-white transition hover:bg-fuchsia-400 disabled:opacity-50"
            >
              Baixar QR
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
