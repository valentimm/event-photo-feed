import type { EventFeedPeekFace, Photo } from '../lib/types'
import { FeedPeekFace } from './FeedPeekFace'
import { PhotoCard } from './PhotoCard'

interface PhotoCardWithPeekProps {
  photo: Photo
  face: EventFeedPeekFace | null
  cardIndex: number
  onDeleted: (photoId: string) => void
  onMediaClick?: () => void
}

export function PhotoCardWithPeek({
  photo,
  face,
  cardIndex,
  onDeleted,
  onMediaClick,
}: PhotoCardWithPeekProps) {
  const side = cardIndex % 2 === 0 ? 'left' : 'right'

  return (
    <div className="feed-peek-card-wrap relative">
      {face && <FeedPeekFace face={face} side={side} index={cardIndex} />}
      <div className="relative z-10">
        <PhotoCard photo={photo} onDeleted={onDeleted} onMediaClick={onMediaClick} />
      </div>
    </div>
  )
}

interface FeedCardsListProps {
  photos: Photo[]
  peekFaces: EventFeedPeekFace[]
  onDeleted: (photoId: string) => void
  onMediaClick: (photoId: string) => void
}

export function FeedCardsList({ photos, peekFaces, onDeleted, onMediaClick }: FeedCardsListProps) {
  const usePeek = peekFaces.length > 0

  return (
    <>
      {photos.map((photo, index) => {
        const face = usePeek ? peekFaces[index % peekFaces.length] : null
        if (usePeek && face) {
          return (
            <PhotoCardWithPeek
              key={photo.id}
              photo={photo}
              face={face}
              cardIndex={index}
              onDeleted={onDeleted}
              onMediaClick={() => onMediaClick(photo.id)}
            />
          )
        }
        return (
          <PhotoCard
            key={photo.id}
            photo={photo}
            onDeleted={onDeleted}
            onMediaClick={() => onMediaClick(photo.id)}
          />
        )
      })}
    </>
  )
}

interface TimelineCardsListProps {
  groups: { label: string; items: Photo[] }[]
  peekFaces: EventFeedPeekFace[]
  onDeleted: (photoId: string) => void
  onMediaClick: (photoId: string) => void
}

export function TimelineCardsList({
  groups,
  peekFaces,
  onDeleted,
  onMediaClick,
}: TimelineCardsListProps) {
  const usePeek = peekFaces.length > 0
  let cardIndex = 0

  return (
    <>
      {groups.map((group) => (
        <section key={group.label}>
          <div className="ev-sticky-bar sticky top-[57px] z-[5] mb-3 border-b ev-border-accent-soft py-2">
            <h3 className="text-sm font-semibold capitalize ev-text-accent-strong">{group.label}</h3>
          </div>
          <div className="space-y-4">
            {group.items.map((photo) => {
              const index = cardIndex++
              const face = usePeek ? peekFaces[index % peekFaces.length] : null
              if (usePeek && face) {
                return (
                  <PhotoCardWithPeek
                    key={photo.id}
                    photo={photo}
                    face={face}
                    cardIndex={index}
                    onDeleted={onDeleted}
                    onMediaClick={() => onMediaClick(photo.id)}
                  />
                )
              }
              return (
                <PhotoCard
                  key={photo.id}
                  photo={photo}
                  onDeleted={onDeleted}
                  onMediaClick={() => onMediaClick(photo.id)}
                />
              )
            })}
          </div>
        </section>
      ))}
    </>
  )
}
