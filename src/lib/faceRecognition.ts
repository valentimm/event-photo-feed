const MODEL_URL = '/models'
const MATCH_DISTANCE_THRESHOLD = 0.55

let modelsLoaded = false
let faceApiModule: typeof import('@vladmandic/face-api') | null = null

async function getFaceApi() {
  if (!faceApiModule) {
    faceApiModule = await import('@vladmandic/face-api')
  }
  return faceApiModule
}

export async function loadFaceModels(): Promise<void> {
  if (modelsLoaded) return
  const faceapi = await getFaceApi()
  await Promise.all([
    faceapi.nets.ssdMobilenetv1.loadFromUri(MODEL_URL),
    faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
    faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL),
  ])
  modelsLoaded = true
}

export function descriptorToArray(descriptor: Float32Array): number[] {
  return Array.from(descriptor)
}

async function imageFromSource(source: string | HTMLImageElement) {
  if (typeof source !== 'string') return source
  const faceapi = await getFaceApi()
  return faceapi.fetchImage(source)
}

/** Extrai descritores de todos os rostos detectados na imagem. */
export async function extractFaceDescriptors(
  source: string | HTMLImageElement,
): Promise<Float32Array[]> {
  await loadFaceModels()
  const faceapi = await getFaceApi()
  const img = await imageFromSource(source)
  const detections = await faceapi
    .detectAllFaces(img)
    .withFaceLandmarks()
    .withFaceDescriptors()
  return detections.map((d) => d.descriptor)
}

/** Usa o maior rosto detectado (referência de cadastro). */
export async function extractPrimaryFaceDescriptor(
  source: string | HTMLImageElement,
): Promise<Float32Array | null> {
  await loadFaceModels()
  const faceapi = await getFaceApi()
  const img = await imageFromSource(source)
  const detection = await faceapi
    .detectSingleFace(img)
    .withFaceLandmarks()
    .withFaceDescriptor()
  return detection?.descriptor ?? null
}

export interface KnownFace {
  id: string
  descriptor: number[]
}

export interface FaceMatchResult {
  eventFaceId: string
  distance: number
  confidence: number
}

/** Compara um descritor com rostos cadastrados. */
export function matchDescriptor(
  descriptor: Float32Array,
  knownFaces: KnownFace[],
): FaceMatchResult | null {
  if (knownFaces.length === 0) return null

  let best: FaceMatchResult | null = null

  for (const known of knownFaces) {
    const knownDesc = new Float32Array(known.descriptor)
    let sum = 0
    for (let i = 0; i < descriptor.length; i++) {
      const diff = descriptor[i] - knownDesc[i]
      sum += diff * diff
    }
    const distance = Math.sqrt(sum)
    if (distance < MATCH_DISTANCE_THRESHOLD && (!best || distance < best.distance)) {
      best = {
        eventFaceId: known.id,
        distance,
        confidence: Math.max(0, Math.min(1, 1 - distance / MATCH_DISTANCE_THRESHOLD)),
      }
    }
  }

  return best
}

/** Detecta rostos na foto e retorna correspondências com rostos cadastrados. */
export async function matchImageToKnownFaces(
  imageUrl: string,
  knownFaces: KnownFace[],
): Promise<FaceMatchResult[]> {
  const descriptors = await extractFaceDescriptors(imageUrl)
  const matches: FaceMatchResult[] = []
  const seen = new Set<string>()

  for (const descriptor of descriptors) {
    const match = matchDescriptor(descriptor, knownFaces)
    if (match && !seen.has(match.eventFaceId)) {
      seen.add(match.eventFaceId)
      matches.push(match)
    }
  }

  return matches
}
