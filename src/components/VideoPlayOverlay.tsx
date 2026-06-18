interface VideoPlayOverlayProps {
  className?: string
}

export function VideoPlayOverlay({ className = '' }: VideoPlayOverlayProps) {
  return (
    <div
      className={`pointer-events-none absolute inset-0 flex items-center justify-center ${className}`}
      aria-hidden
    >
      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-black/50 backdrop-blur-sm">
        <svg viewBox="0 0 24 24" fill="white" className="ml-1 h-7 w-7">
          <path d="M8 5v14l11-7z" />
        </svg>
      </div>
    </div>
  )
}
