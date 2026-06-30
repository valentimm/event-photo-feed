import { useInView } from '../hooks/useInView'
import type { EventFeedPeekFace } from '../lib/types'

interface FeedPeekFaceProps {
  face: EventFeedPeekFace
  side: 'left' | 'right'
  index: number
}

export function FeedPeekFace({ face, side, index }: FeedPeekFaceProps) {
  const { ref, inView } = useInView(0.4)
  const tilt = side === 'left' ? -12 + (index % 3) * 4 : 12 - (index % 3) * 4
  const bobDelay = `${(index % 4) * 0.15}s`

  return (
    <div
      ref={ref}
      className={`feed-peek-face pointer-events-none absolute top-[18%] z-0 ${
        side === 'left' ? '-left-2 sm:-left-4' : '-right-2 sm:-right-4'
      }`}
      aria-hidden
    >
      <div
        className={`feed-peek-face-inner ${
          side === 'left' ? 'feed-peek-face-left' : 'feed-peek-face-right'
        } ${inView ? 'feed-peek-face-visible' : ''}`}
        style={{
          ['--peek-tilt' as string]: `${tilt}deg`,
          ['--peek-delay' as string]: bobDelay,
        }}
      >
        <img
          src={face.image_url}
          alt=""
          className="feed-peek-face-img h-[4.5rem] w-[4.5rem] rounded-full object-cover sm:h-20 sm:w-20"
        />
        <span className="feed-peek-eyes absolute -right-0.5 -top-1 text-base sm:text-lg">👀</span>
      </div>
    </div>
  )
}
