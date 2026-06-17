import { PHOTOS_BUCKET, supabase } from './supabase'
import { DEFAULT_EVENT_THEME, normalizeHexColor } from './eventTheme'
import type { Event, EventStats, EventUserRow, EventWithStats } from './types'

export async function fetchEvent(eventId: string): Promise<Event | null> {
  const { data, error } = await supabase
    .from('events')
    .select('*')
    .eq('id', eventId)
    .maybeSingle()
  if (error) throw error
  return data as Event | null
}

export async function fetchEventStats(eventId: string): Promise<EventStats> {
  const [members, photosRes] = await Promise.all([
    supabase
      .from('event_memberships')
      .select('*', { count: 'exact', head: true })
      .eq('event_id', eventId),
    supabase.from('photos').select('id, media_type').eq('event_id', eventId),
  ])

  const photos = photosRes.data ?? []
  const photoIds = photos.map((p) => p.id)

  let likes = 0
  let comments = 0
  if (photoIds.length > 0) {
    const [likesRes, commentsRes] = await Promise.all([
      supabase.from('likes').select('*', { count: 'exact', head: true }).in('photo_id', photoIds),
      supabase
        .from('comments')
        .select('*', { count: 'exact', head: true })
        .in('photo_id', photoIds),
    ])
    likes = likesRes.count ?? 0
    comments = commentsRes.count ?? 0
  }

  return {
    members: members.count ?? 0,
    photos: photos.filter((p) => p.media_type === 'image').length,
    videos: photos.filter((p) => p.media_type === 'video').length,
    likes,
    comments,
  }
}

export async function fetchEventsWithStats(): Promise<EventWithStats[]> {
  const { data: events, error } = await supabase
    .from('events')
    .select('*')
    .order('created_at', { ascending: false })
  if (error) throw error
  if (!events?.length) return []

  return Promise.all(
    (events as Event[]).map(async (event) => ({
      ...event,
      stats: await fetchEventStats(event.id),
    })),
  )
}

export async function createEvent(input: {
  name: string
  eventType?: string
  eventDate?: string | null
  description?: string | null
}): Promise<Event> {
  const trimmed = input.name.trim()
  if (!trimmed) throw new Error('Digite o nome do evento.')
  const { data, error } = await supabase
    .from('events')
    .insert({
      name: trimmed,
      event_type: input.eventType ?? 'other',
      event_date: input.eventDate || null,
      description: input.description?.trim() || null,
    })
    .select('*')
    .single()
  if (error) throw error
  return data as Event
}

export interface EventMediaExport {
  url: string
  media_type: string
  created_at: string
  username: string
}

export async function fetchEventMediaExport(eventId: string): Promise<EventMediaExport[]> {
  const { data, error } = await supabase
    .from('photos')
    .select('image_url, media_type, created_at, user:users(username)')
    .eq('event_id', eventId)
    .order('created_at', { ascending: true })
  if (error) throw error

  return (data ?? []).map((row) => {
    const rawUser = row.user as unknown
    const user = (Array.isArray(rawUser) ? rawUser[0] : rawUser) as { username: string } | null
    return {
      url: row.image_url as string,
      media_type: row.media_type as string,
      created_at: row.created_at as string,
      username: user?.username ?? '—',
    }
  })
}

export async function updateEventBranding(
  eventId: string,
  input: {
    color_primary: string
    color_accent: string
    color_gradient_start: string
    color_gradient_end: string
    logo_url?: string | null
  },
): Promise<Event> {
  const payload = {
    color_primary: normalizeHexColor(input.color_primary, DEFAULT_EVENT_THEME.color_primary),
    color_accent: normalizeHexColor(input.color_accent, DEFAULT_EVENT_THEME.color_accent),
    color_gradient_start: normalizeHexColor(
      input.color_gradient_start,
      DEFAULT_EVENT_THEME.color_gradient_start,
    ),
    color_gradient_end: normalizeHexColor(
      input.color_gradient_end,
      DEFAULT_EVENT_THEME.color_gradient_end,
    ),
    ...(input.logo_url !== undefined ? { logo_url: input.logo_url } : {}),
  }
  const { data, error } = await supabase
    .from('events')
    .update(payload)
    .eq('id', eventId)
    .select('*')
    .single()
  if (error) throw error
  return data as Event
}

export async function uploadEventLogo(eventId: string, file: File): Promise<string> {
  const ext = file.name.includes('.') ? file.name.split('.').pop()!.toLowerCase() : 'png'
  const path = `logos/${eventId}/logo.${ext}`

  const { error: uploadError } = await supabase.storage
    .from(PHOTOS_BUCKET)
    .upload(path, file, {
      cacheControl: '3600',
      contentType: file.type || `image/${ext}`,
      upsert: true,
    })
  if (uploadError) throw uploadError

  const {
    data: { publicUrl },
  } = supabase.storage.from(PHOTOS_BUCKET).getPublicUrl(path)

  const { error } = await supabase
    .from('events')
    .update({ logo_url: publicUrl })
    .eq('id', eventId)
  if (error) throw error
  return publicUrl
}

export async function setEventActive(eventId: string, isActive: boolean): Promise<void> {
  const { error } = await supabase
    .from('events')
    .update({ is_active: isActive })
    .eq('id', eventId)
  if (error) throw error
}

export async function joinEvent(eventId: string, userId: string): Promise<void> {
  const { error } = await supabase.from('event_memberships').upsert(
    { event_id: eventId, user_id: userId },
    { onConflict: 'event_id,user_id' },
  )
  if (error) throw error
}

export async function fetchEventUsers(eventId: string): Promise<EventUserRow[]> {
  const [membershipsRes, photosRes] = await Promise.all([
    supabase
      .from('event_memberships')
      .select('joined_at, user:users(id, username)')
      .eq('event_id', eventId)
      .order('joined_at', { ascending: false }),
    supabase.from('photos').select('id, user_id').eq('event_id', eventId),
  ])

  if (membershipsRes.error) throw membershipsRes.error

  const photos = photosRes.data ?? []
  const photoIds = photos.map((p) => p.id)

  const [likesRes, commentsRes] = photoIds.length
    ? await Promise.all([
        supabase.from('likes').select('user_id, photo_id').in('photo_id', photoIds),
        supabase.from('comments').select('user_id, photo_id').in('photo_id', photoIds),
      ])
    : [{ data: [] }, { data: [] }]

  const postCounts = new Map<string, number>()
  for (const p of photos) {
    postCounts.set(p.user_id, (postCounts.get(p.user_id) ?? 0) + 1)
  }

  const likeCounts = new Map<string, number>()
  for (const l of likesRes.data ?? []) {
    likeCounts.set(l.user_id, (likeCounts.get(l.user_id) ?? 0) + 1)
  }

  const commentCounts = new Map<string, number>()
  for (const c of commentsRes.data ?? []) {
    commentCounts.set(c.user_id, (commentCounts.get(c.user_id) ?? 0) + 1)
  }

  return (membershipsRes.data ?? []).map((row) => {
    const rawUser = row.user as unknown
    const user = (Array.isArray(rawUser) ? rawUser[0] : rawUser) as
      | { id: string; username: string }
      | null
      | undefined
    return {
      userId: user?.id ?? '',
      username: user?.username ?? '—',
      joinedAt: row.joined_at as string,
      posts: postCounts.get(user?.id ?? '') ?? 0,
      likesGiven: likeCounts.get(user?.id ?? '') ?? 0,
      comments: commentCounts.get(user?.id ?? '') ?? 0,
    }
  })
}
