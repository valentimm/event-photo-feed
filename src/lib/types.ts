export interface User {
  id: string
  username: string
  created_at: string
}

export interface Comment {
  id: string
  photo_id: string
  user_id: string
  text: string
  created_at: string
  user?: Pick<User, 'id' | 'username'> | null
}

export interface Photo {
  id: string
  user_id: string
  image_url: string
  image_path: string | null
  caption: string | null
  created_at: string
  user?: Pick<User, 'id' | 'username'> | null
  likes: { user_id: string }[]
  comments: Comment[]
}
