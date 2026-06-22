import { useCallback, useEffect, useRef, useState, type CSSProperties } from 'react'
import { createPortal } from 'react-dom'

interface VideoRecorderModalProps {
  open: boolean
  maxSeconds: number
  themeStyle?: CSSProperties
  onClose: () => void
  onRecorded: (blob: Blob, previewUrl: string) => void
}

function pickRecorderMime(): string {
  const candidates = [
    'video/mp4',
    'video/webm;codecs=vp9,opus',
    'video/webm;codecs=vp8,opus',
    'video/webm',
  ]
  return candidates.find((t) => MediaRecorder.isTypeSupported(t)) ?? ''
}

export function VideoRecorderModal({
  open,
  maxSeconds,
  themeStyle,
  onClose,
  onRecorded,
}: VideoRecorderModalProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const recorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const stopTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const [recording, setRecording] = useState(false)
  const [elapsed, setElapsed] = useState(0)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [starting, setStarting] = useState(false)
  const [cameraReady, setCameraReady] = useState(false)

  const clearTimers = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current)
      timerRef.current = null
    }
    if (stopTimerRef.current) {
      clearTimeout(stopTimerRef.current)
      stopTimerRef.current = null
    }
  }, [])

  const stopStream = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop())
    streamRef.current = null
    if (videoRef.current) videoRef.current.srcObject = null
  }, [])

  const resetRecording = useCallback(() => {
    clearTimers()
    recorderRef.current = null
    chunksRef.current = []
    setRecording(false)
    setElapsed(0)
    if (previewUrl) URL.revokeObjectURL(previewUrl)
    setPreviewUrl(null)
    setRecordedBlob(null)
  }, [clearTimers, previewUrl])

  const stopRecording = useCallback(() => {
    clearTimers()
    if (recorderRef.current?.state === 'recording') {
      recorderRef.current.stop()
    }
  }, [clearTimers])

  const startCamera = useCallback(async () => {
    setError(null)
    setStarting(true)
    setCameraReady(false)
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' },
        audio: true,
      })
      streamRef.current = stream
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        await videoRef.current.play()
      }
      setCameraReady(true)
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Não foi possível acessar a câmera. Verifique as permissões.',
      )
    } finally {
      setStarting(false)
    }
  }, [])

  const startRecording = useCallback(() => {
    const stream = streamRef.current
    if (!stream || recording) return

    const mimeType = pickRecorderMime()
    if (!mimeType) {
      setError('Gravação de vídeo não suportada neste dispositivo.')
      return
    }

    chunksRef.current = []
    const recorder = new MediaRecorder(stream, { mimeType })
    recorderRef.current = recorder

    recorder.ondataavailable = (e) => {
      if (e.data.size > 0) chunksRef.current.push(e.data)
    }

    recorder.onstop = () => {
      const blob = new Blob(chunksRef.current, { type: mimeType })
      const url = URL.createObjectURL(blob)
      setRecordedBlob(blob)
      setPreviewUrl(url)
      setRecording(false)
      stopStream()
    }

    recorder.start(250)
    setRecording(true)
    setElapsed(0)

    timerRef.current = setInterval(() => {
      setElapsed((s) => s + 1)
    }, 1000)

    stopTimerRef.current = setTimeout(() => {
      stopRecording()
    }, maxSeconds * 1000)
  }, [maxSeconds, recording, stopRecording, stopStream])

  useEffect(() => {
    if (!open) return
    document.body.style.overflow = 'hidden'
    void startCamera()
    return () => {
      document.body.style.overflow = ''
      clearTimers()
      if (recorderRef.current?.state === 'recording') {
        recorderRef.current.stop()
      }
      stopStream()
      setCameraReady(false)
    }
  }, [open, clearTimers, startCamera, stopStream])

  function handleClose() {
    if (previewUrl) URL.revokeObjectURL(previewUrl)
    resetRecording()
    stopStream()
    setCameraReady(false)
    onClose()
  }

  function handleConfirm() {
    if (!recordedBlob || !previewUrl) return
    onRecorded(recordedBlob, previewUrl)
    setRecordedBlob(null)
    setPreviewUrl(null)
    onClose()
  }

  function handleRetry() {
    resetRecording()
    void startCamera()
  }

  if (!open) return null

  const remaining = Math.max(0, maxSeconds - elapsed)

  return createPortal(
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-xs" aria-hidden />
      <div
        role="dialog"
        aria-modal
        aria-labelledby="video-recorder-title"
        className="event-theme relative z-10 flex w-full max-w-sm flex-col overflow-hidden rounded-2xl ev-surface shadow-2xl"
        style={themeStyle}
      >
        <div className="flex items-center justify-between border-b ev-border-subtle px-4 py-3">
          <h2 id="video-recorder-title" className="text-lg font-semibold ev-text">
            Gravar vídeo
          </h2>
          <button
            type="button"
            onClick={handleClose}
            className="ev-btn-ghost rounded-lg px-2 py-1 text-xl leading-none"
            aria-label="Fechar"
          >
            ×
          </button>
        </div>

        <div className="relative aspect-[3/4] bg-black">
          {previewUrl ? (
            <video
              src={previewUrl}
              controls
              playsInline
              className="h-full w-full object-cover"
            />
          ) : (
            <video
              ref={videoRef}
              playsInline
              muted
              className="h-full w-full object-cover"
            />
          )}

          {recording && (
            <div className="absolute left-3 top-3 flex items-center gap-2 rounded-full bg-black/60 px-3 py-1 text-sm font-medium text-white">
              <span className="h-2 w-2 animate-pulse rounded-full bg-red-500" />
              {elapsed}s / {maxSeconds}s
            </div>
          )}

          {!recording && !previewUrl && !starting && cameraReady && (
            <p className="absolute bottom-3 left-0 right-0 text-center text-xs text-white/80">
              Máximo de {maxSeconds} segundos — a gravação para automaticamente.
            </p>
          )}
        </div>

        <div className="space-y-3 p-4">
          {error && <p className="text-sm text-red-500">{error}</p>}

          {previewUrl && recordedBlob ? (
            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleConfirm}
                className="flex-1 rounded-xl px-4 py-3 font-semibold ev-bg-primary ev-bg-primary-hover"
              >
                Usar este vídeo
              </button>
              <button
                type="button"
                onClick={handleRetry}
                className="ev-btn-ghost rounded-xl px-4 py-3"
              >
                Gravar de novo
              </button>
            </div>
          ) : recording ? (
            <button
              type="button"
              onClick={stopRecording}
              className="w-full rounded-xl bg-red-600 px-4 py-3 font-semibold text-white hover:bg-red-500"
            >
              Parar ({remaining}s restantes)
            </button>
          ) : (
            <button
              type="button"
              onClick={startRecording}
              disabled={starting || !cameraReady || !!error}
              className="w-full rounded-xl px-4 py-3 font-semibold disabled:cursor-not-allowed disabled:opacity-50 ev-bg-primary ev-bg-primary-hover"
            >
              {starting ? 'Abrindo câmera…' : 'Iniciar gravação'}
            </button>
          )}
        </div>
      </div>
    </div>,
    document.body,
  )
}
