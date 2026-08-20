import { useRef, useState, useEffect, useCallback } from 'react'

export default function CameraCapture({ onCapture, countdownSeconds = 3 }) {
  const videoRef = useRef(null)
  const canvasRef = useRef(null)
  const streamRef = useRef(null)

  const [facingMode, setFacingMode] = useState('user') // 'user' = depan, 'environment' = belakang
  const [isReady, setIsReady] = useState(false)
  const [countdown, setCountdown] = useState(null)
  const [error, setError] = useState(null)

  const startCamera = useCallback(async () => {
    setError(null)
    setIsReady(false)

    // Matikan stream lama kalau ada (misal saat switch kamera)
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop())
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode,
          width: { ideal: 1280 },
          height: { ideal: 960 },
        },
        audio: false,
      })

      streamRef.current = stream
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        setIsReady(true)
      }
    } catch (err) {
      console.error('Gagal akses kamera:', err)
      setError(
        err.name === 'NotAllowedError'
          ? 'Izin kamera ditolak. Aktifkan izin kamera di pengaturan browser.'
          : 'Tidak bisa mengakses kamera. Coba upload foto sebagai gantinya.'
      )
    }
  }, [facingMode])

  useEffect(() => {
    startCamera()
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop())
      }
    }
  }, [startCamera])

  const switchCamera = () => {
    setFacingMode((prev) => (prev === 'user' ? 'environment' : 'user'))
  }

  const capturePhoto = () => {
    const video = videoRef.current
    const canvas = canvasRef.current
    if (!video || !canvas) return

    canvas.width = video.videoWidth
    canvas.height = video.videoHeight

    const ctx = canvas.getContext('2d')

    // Kalau kamera depan, mirror hasilnya biar natural (seperti cermin)
    if (facingMode === 'user') {
      ctx.translate(canvas.width, 0)
      ctx.scale(-1, 1)
    }
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height)

    canvas.toBlob(
      (blob) => {
        const imageUrl = URL.createObjectURL(blob)
        onCapture({ blob, url: imageUrl })
      },
      'image/jpeg',
      0.92
    )
  }

  const startCountdown = () => {
    if (countdown !== null) return // cegah double click
    let current = countdownSeconds
    setCountdown(current)

    const interval = setInterval(() => {
      current -= 1
      if (current <= 0) {
        clearInterval(interval)
        setCountdown(null)
        capturePhoto()
      } else {
        setCountdown(current)
      }
    }, 1000)
  }

  return (
    <div className="relative w-full max-w-md mx-auto">
      <div className="relative aspect-[3/4] w-full overflow-hidden rounded-2xl bg-black shadow-lg">
        {error ? (
          <div className="flex h-full items-center justify-center p-6 text-center text-white">
            {error}
          </div>
        ) : (
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className={`h-full w-full object-cover ${
              facingMode === 'user' ? 'scale-x-[-1]' : ''
            }`}
          />
        )}

        {countdown !== null && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/40">
            <span className="text-8xl font-bold text-white drop-shadow-lg">
              {countdown}
            </span>
          </div>
        )}

        {/* Tombol switch kamera, pojok kanan atas */}
        <button
          onClick={switchCamera}
          className="absolute right-3 top-3 rounded-full bg-white/20 p-2 backdrop-blur-sm active:scale-95"
          aria-label="Ganti kamera"
        >
          🔄
        </button>
      </div>

      <canvas ref={canvasRef} className="hidden" />

      <div className="mt-4 flex justify-center">
        <button
          onClick={startCountdown}
          disabled={!isReady || countdown !== null}
          className="rounded-full bg-yellow-400 px-8 py-3 font-semibold text-black shadow-md active:scale-95 disabled:opacity-50"
        >
          📸 Ambil Foto
        </button>
      </div>
    </div>
  )
}