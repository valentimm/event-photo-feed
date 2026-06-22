export interface User {
  id: string
  username: string
  created_at: string
}

export interface Event {
  id: string
  name: string
  event_type: string
  event_date: string | null
  description: string | null
  color_background: string
  color_text: string
  color_text_muted: string
  color_primary: string
  color_accent: string
  color_gradient_start: string
  color_gradient_end: string
  logo_url: string | null
  is_active: boolean
  challenges_enabled: boolean
  challenges_title: string
  face_album_enabled: boolean
  teams_enabled: boolean
  created_at: string
}

export interface EventFace {
  id: string
  event_id: string
  name: string
  reference_image_url: string
  reference_image_path: string | null
  descriptor: number[]
  created_at: string
}

export interface FaceAlbumEntry extends EventFace {
  photoCount: number
}

export interface EventChallenge {
  id: string
  event_id: string
  text: string
  sort_order: number
  created_at: string
}

export interface EventTeam {
  id: string
  event_id: string
  name: string
  sort_order: number
  created_at: string
}

export interface EventMembership {
  id: string
  event_id: string
  user_id: string
  team_id: string | null
  joined_at: string
  user?: Pick<User, 'id' | 'username' | 'created_at'> | null
}

export interface EventStats {
  members: number
  photos: number
  videos: number
  likes: number
  comments: number
}

export interface EventWithStats extends Event {
  stats: EventStats
}

export interface EventUserRow {
  userId: string
  username: string
  teamName: string | null
  joinedAt: string
  posts: number
  likesGiven: number
  comments: number
}

export interface Comment {
  id: string
  photo_id: string
  user_id: string
  text: string
  created_at: string
  user?: Pick<User, 'id' | 'username'> | null
}

export type MediaType = 'image' | 'video'

export interface Photo {
  id: string
  event_id: string
  user_id: string
  image_url: string
  image_path: string | null
  media_type: MediaType
  caption: string | null
  created_at: string
  user?: Pick<User, 'id' | 'username'> | null
  likes: { user_id: string }[]
  comments: Comment[]
}

export interface Admin {
  id: string
  username: string
}
