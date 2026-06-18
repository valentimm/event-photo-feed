import { useEffect, useRef, useState } from 'react'
import { useInView } from '../hooks/useInView'
import { VideoPlayOverlay } from './VideoPlayOverlay'

interface FeedVideoProps {
  src: string
  onClick?: () => void
  className?: string
}

/** Vídeo estilo Instagram: autoplay mudo quando visível, pausa ao sair da tela. */
export function FeedVideo({ src, onClick, className = '' }: FeedVideoProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const { ref, inView } = useInView(0.55)
  const [playing, setPlaying] = useState(false)

  useEffect(() => {
    const video = videoRef.current
    if (!video) return

    if (inView) {
      void video.play().then(() => setPlaying(true)).catch(() => setPlaying(false))
    } else {
      video.pause()
      setPlaying(false)
    }
  }, [inView])

  return (
    <div ref={ref} className={`relative ${className}`}>
      <video
        ref={videoRef}
        src={src}
        muted
        loop
        playsInline
        preload="metadata"
        className="w-full cursor-pointer bg-black"
        onClick={onClick}
      />
      {!playing && <VideoPlayOverlay />}
    </div>
  )
}
