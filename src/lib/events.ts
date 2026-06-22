import { PHOTOS_BUCKET, supabase } from './supabase'
import { DEFAULT_EVENT_THEME, normalizeHexColor } from './eventTheme'
import type { Event, EventChallenge, EventFace, EventStats, EventTeam, EventUserRow, EventWithStats, FaceAlbumEntry, Photo } from './types'
import { matchImageToKnownFaces } from './faceRecognition'

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
    color_background: string
    color_text: string
    color_text_muted: string
    color_primary: string
    color_accent: string
    color_gradient_start: string
    color_gradient_end: string
    logo_url?: string | null
  },
): Promise<Event> {
  const payload = {
    color_background: normalizeHexColor(input.color_background, DEFAULT_EVENT_THEME.color_background),
    color_text: normalizeHexColor(input.color_text, DEFAULT_EVENT_THEME.color_text),
    color_text_muted: normalizeHexColor(
      input.color_text_muted,
      DEFAULT_EVENT_THEME.color_text_muted,
    ),
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

export async function updateEventChallengesSettings(
  eventId: string,
  input: { challenges_enabled: boolean; challenges_title: string },
): Promise<Event> {
  const { data, error } = await supabase
    .from('events')
    .update({
      challenges_enabled: input.challenges_enabled,
      challenges_title: input.challenges_title.trim() || 'Desafios',
    })
    .eq('id', eventId)
    .select('*')
    .single()
  if (error) throw error
  return data as Event
}

export async function fetchEventChallenges(eventId: string): Promise<EventChallenge[]> {
  const { data, error } = await supabase
    .from('event_challenges')
    .select('*')
    .eq('event_id', eventId)
    .order('sort_order', { ascending: true })
  if (error) throw error
  return (data as EventChallenge[]) ?? []
}

export async function addEventChallenge(eventId: string, text: string): Promise<EventChallenge> {
  const trimmed = text.trim()
  if (!trimmed) throw new Error('Digite o texto do desafio.')

  const { data: existing } = await supabase
    .from('event_challenges')
    .select('sort_order')
    .eq('event_id', eventId)
    .order('sort_order', { ascending: false })
    .limit(1)

  const nextOrder = existing?.length ? (existing[0].sort_order as number) + 1 : 0

  const { data, error } = await supabase
    .from('event_challenges')
    .insert({ event_id: eventId, text: trimmed, sort_order: nextOrder })
    .select('*')
    .single()
  if (error) throw error
  return data as EventChallenge
}

export async function removeEventChallenge(challengeId: string): Promise<void> {
  const { error } = await supabase.from('event_challenges').delete().eq('id', challengeId)
  if (error) throw error
}

export async function updateEventTeamsSettings(
  eventId: string,
  teamsEnabled: boolean,
): Promise<Event> {
  const { data, error } = await supabase
    .from('events')
    .update({ teams_enabled: teamsEnabled })
    .eq('id', eventId)
    .select('*')
    .single()
  if (error) throw error
  return data as Event
}

export async function fetchEventTeams(eventId: string): Promise<EventTeam[]> {
  const { data, error } = await supabase
    .from('event_teams')
    .select('*')
    .eq('event_id', eventId)
    .order('sort_order', { ascending: true })
  if (error) throw error
  return (data as EventTeam[]) ?? []
}

export async function addEventTeam(eventId: string, name: string): Promise<EventTeam> {
  const trimmed = name.trim()
  if (!trimmed) throw new Error('Digite o nome do time.')

  const { data: existing } = await supabase
    .from('event_teams')
    .select('sort_order')
    .eq('event_id', eventId)
    .order('sort_order', { ascending: false })
    .limit(1)

  const nextOrder = existing?.length ? (existing[0].sort_order as number) + 1 : 0

  const { data, error } = await supabase
    .from('event_teams')
    .insert({ event_id: eventId, name: trimmed, sort_order: nextOrder })
    .select('*')
    .single()
  if (error) throw error
  return data as EventTeam
}

export async function removeEventTeam(teamId: string): Promise<void> {
  const { error } = await supabase.from('event_teams').delete().eq('id', teamId)
  if (error) throw error
}

export async function fetchUserMembershipTeam(
  eventId: string,
  userId: string,
): Promise<string | null> {
  const { data, error } = await supabase
    .from('event_memberships')
    .select('team_id')
    .eq('event_id', eventId)
    .eq('user_id', userId)
    .maybeSingle()
  if (error) throw error
  return (data?.team_id as string | null) ?? null
}

export async function setUserTeam(
  eventId: string,
  userId: string,
  teamId: string,
): Promise<void> {
  const { error } = await supabase
    .from('event_memberships')
    .update({ team_id: teamId })
    .eq('event_id', eventId)
    .eq('user_id', userId)
  if (error) throw error
}

export async function fetchUserChallengeCompletions(
  userId: string,
  challengeIds: string[],
): Promise<Set<string>> {
  if (challengeIds.length === 0) return new Set()
  const { data, error } = await supabase
    .from('challenge_completions')
    .select('challenge_id')
    .eq('user_id', userId)
    .in('challenge_id', challengeIds)
  if (error) throw error
  return new Set((data ?? []).map((r) => r.challenge_id as string))
}

export async function setChallengeCompleted(
  challengeId: string,
  userId: string,
  completed: boolean,
): Promise<void> {
  if (completed) {
    const { error } = await supabase
      .from('challenge_completions')
      .upsert({ challenge_id: challengeId, user_id: userId }, { onConflict: 'challenge_id,user_id' })
    if (error) throw error
  } else {
    const { error } = await supabase
      .from('challenge_completions')
      .delete()
      .eq('challenge_id', challengeId)
      .eq('user_id', userId)
    if (error) throw error
  }
}

export async function updateFaceAlbumSettings(
  eventId: string,
  faceAlbumEnabled: boolean,
): Promise<Event> {
  const { data, error } = await supabase
    .from('events')
    .update({ face_album_enabled: faceAlbumEnabled })
    .eq('id', eventId)
    .select('*')
    .single()
  if (error) throw error
  return data as Event
}

export async function fetchEventFaces(eventId: string): Promise<EventFace[]> {
  const { data, error } = await supabase
    .from('event_faces')
    .select('*')
    .eq('event_id', eventId)
    .order('created_at', { ascending: true })
  if (error) throw error
  return (data as EventFace[]) ?? []
}

export async function fetchFaceAlbumRanking(eventId: string): Promise<FaceAlbumEntry[]> {
  const faces = await fetchEventFaces(eventId)
  if (faces.length === 0) return []

  const faceIds = faces.map((f) => f.id)
  const { data: matches, error } = await supabase
    .from('photo_face_matches')
    .select('event_face_id')
    .in('event_face_id', faceIds)
  if (error) throw error

  const counts = new Map<string, number>()
  for (const m of matches ?? []) {
    const id = m.event_face_id as string
    counts.set(id, (counts.get(id) ?? 0) + 1)
  }

  return faces
    .map((face) => ({ ...face, photoCount: counts.get(face.id) ?? 0 }))
    .sort((a, b) => b.photoCount - a.photoCount)
}

export async function createEventFace(input: {
  eventId: string
  name: string
  referenceImageUrl: string
  referenceImagePath: string
  descriptor: number[]
}): Promise<EventFace> {
  const trimmed = input.name.trim()
  if (!trimmed) throw new Error('Digite o nome da pessoa.')

  const { data, error } = await supabase
    .from('event_faces')
    .insert({
      event_id: input.eventId,
      name: trimmed,
      reference_image_url: input.referenceImageUrl,
      reference_image_path: input.referenceImagePath,
      descriptor: input.descriptor,
    })
    .select('*')
    .single()
  if (error) throw error
  return data as EventFace
}

export async function uploadEventFaceReference(
  eventId: string,
  file: Blob,
  ext: string,
): Promise<{ publicUrl: string; path: string }> {
  const path = `${eventId}/faces/${crypto.randomUUID()}.${ext}`
  const { error: uploadError } = await supabase.storage
    .from(PHOTOS_BUCKET)
    .upload(path, file, {
      cacheControl: '3600',
      contentType: file.type || `image/${ext}`,
      upsert: false,
    })
  if (uploadError) throw uploadError

  const {
    data: { publicUrl },
  } = supabase.storage.from(PHOTOS_BUCKET).getPublicUrl(path)
  return { publicUrl, path }
}

export async function deleteEventFace(face: EventFace): Promise<void> {
  if (face.reference_image_path) {
    await supabase.storage.from(PHOTOS_BUCKET).remove([face.reference_image_path])
  }
  const { error } = await supabase.from('event_faces').delete().eq('id', face.id)
  if (error) throw error
}

export async function savePhotoFaceMatches(
  photoId: string,
  matches: { eventFaceId: string; confidence: number }[],
): Promise<void> {
  await supabase.from('photo_face_matches').delete().eq('photo_id', photoId)
  if (matches.length === 0) return

  const { error } = await supabase.from('photo_face_matches').insert(
    matches.map((m) => ({
      photo_id: photoId,
      event_face_id: m.eventFaceId,
      confidence: m.confidence,
    })),
  )
  if (error) throw error
}

export async function matchPhotoToRegisteredFaces(
  photoId: string,
  imageUrl: string,
  eventId: string,
): Promise<void> {
  const faces = await fetchEventFaces(eventId)
  if (faces.length === 0) return

  const known = faces.map((f) => ({ id: f.id, descriptor: f.descriptor }))
  const matches = await matchImageToKnownFaces(imageUrl, known)
  await savePhotoFaceMatches(
    photoId,
    matches.map((m) => ({ eventFaceId: m.eventFaceId, confidence: m.confidence })),
  )
}

const PHOTO_FACE_QUERY =
  '*, user:users(id, username), likes(user_id), comments(*, user:users(id, username))'

export async function fetchPhotosForFace(
  eventFaceId: string,
  eventId: string,
): Promise<Photo[]> {
  const { data: matchRows, error: matchError } = await supabase
    .from('photo_face_matches')
    .select('photo_id')
    .eq('event_face_id', eventFaceId)
  if (matchError) throw matchError

  const photoIds = (matchRows ?? []).map((r) => r.photo_id as string)
  if (photoIds.length === 0) return []

  const { data, error } = await supabase
    .from('photos')
    .select(PHOTO_FACE_QUERY)
    .eq('event_id', eventId)
    .in('id', photoIds)
    .order('created_at', { ascending: false })
  if (error) throw error
  return (data as Photo[]) ?? []
}

export async function reprocessAllEventFaceMatches(
  eventId: string,
  onProgress?: (current: number, total: number) => void,
): Promise<void> {
  const faces = await fetchEventFaces(eventId)
  if (faces.length === 0) return

  const { data: photos, error } = await supabase
    .from('photos')
    .select('id, image_url')
    .eq('event_id', eventId)
    .eq('media_type', 'image')
    .order('created_at', { ascending: true })
  if (error) throw error

  const items = photos ?? []
  for (let i = 0; i < items.length; i++) {
    const photo = items[i]
    await matchPhotoToRegisteredFaces(photo.id as string, photo.image_url as string, eventId)
    onProgress?.(i + 1, items.length)
  }
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
      .select('joined_at, event_teams(name), user:users(id, username)')
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
    const rawTeam = row.event_teams as unknown
    const team = (Array.isArray(rawTeam) ? rawTeam[0] : rawTeam) as { name: string } | null
    return {
      userId: user?.id ?? '',
      username: user?.username ?? '—',
      teamName: team?.name ?? null,
      joinedAt: row.joined_at as string,
      posts: postCounts.get(user?.id ?? '') ?? 0,
      likesGiven: likeCounts.get(user?.id ?? '') ?? 0,
      comments: commentCounts.get(user?.id ?? '') ?? 0,
    }
  })
}
