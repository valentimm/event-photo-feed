import { useInView } from '../hooks/useInView'
import type { EventFeedPeekFace } from '../lib/types'

interface FeedPeekFaceProps {
  face: EventFeedPeekFace
  side: 'left' | 'right'
  index: number
}

export function FeedPeekFace({ face, side, index }: FeedPeekFaceProps) {
  const { ref, inView } = useInView(0.35)
  const tilt = side === 'left' ? -5 + (index % 3) * 2 : 5 - (index % 3) * 2
  const bobDelay = `${(index % 4) * 0.4}s`

  return (
    <div
      ref={ref}
      className={`feed-peek-face pointer-events-none absolute top-[22%] z-0 ${
        side === 'left' ? '-left-5 sm:-left-6' : '-right-5 sm:-right-6'
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
          className="feed-peek-face-img h-[4.5rem] w-[4.5rem] rounded-full object-cover sm:h-[5.25rem] sm:w-[5.25rem]"
        />
      </div>
    </div>
  )
}
