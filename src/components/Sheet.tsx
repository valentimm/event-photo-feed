import { useEffect, type CSSProperties, type ReactNode } from 'react'
import { createPortal } from 'react-dom'

interface SheetProps {
  open: boolean
  onClose: () => void
  title: string
  children: ReactNode
  /** Variáveis de tema do evento (necessário quando renderizado via portal). */
  themeStyle?: CSSProperties
}

/** Sheet responsivo: sobe de baixo no celular, painel lateral no desktop. */
export function Sheet({ open, onClose, title, children, themeStyle }: SheetProps) {
  useEffect(() => {
    if (!open) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prev
    }
  }, [open])

  useEffect(() => {
    if (!open) return
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  if (!open) return null

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-end justify-center md:items-stretch md:justify-end">
      <button
        type="button"
        className="absolute inset-0 bg-black/25 backdrop-blur-xs"
        onClick={onClose}
        aria-label="Fechar"
      />
      <div
        role="dialog"
        aria-modal
        aria-labelledby="sheet-title"
        className="event-theme relative z-10 flex w-full min-h-0 max-h-[50vh] flex-col rounded-t-2xl ev-surface shadow-2xl animate-[sheet-up_0.3s_ease-out] md:h-screen md:max-h-screen md:max-w-sm md:rounded-none md:rounded-l-2xl md:animate-[sheet-right_0.3s_ease-out]"
        style={themeStyle}
      >
        <div className="flex shrink-0 items-center justify-between border-b ev-border-subtle px-5 py-4">
          <h2 id="sheet-title" className="text-lg font-semibold ev-text">
            {title}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="ev-btn-ghost rounded-lg px-2 py-1 text-xl leading-none"
            aria-label="Fechar"
          >
            ×
          </button>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">{children}</div>
      </div>
    </div>,
    document.body,
  )
}
