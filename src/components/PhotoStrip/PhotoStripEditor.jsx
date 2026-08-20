import { useRef, useEffect, useState, useCallback } from 'react'

const PHOTO_FILTERS = [
  { name: 'Normal', value: 'none' },
  { name: 'Retro', value: 'sepia(0.5) saturate(1.4) contrast(1.1) brightness(1.05)' },
  { name: 'B&W Klasik', value: 'grayscale(1) contrast(1.15)' },
  { name: 'Vintage', value: 'sepia(0.35) contrast(0.9) brightness(1.1) saturate(0.8)' },
  { name: 'Cerah', value: 'saturate(1.5) contrast(1.05) brightness(1.08)' },
  { name: 'Dingin', value: 'saturate(1.1) hue-rotate(-10deg) brightness(1.05) contrast(1.05)' },
]

export default function PhotoStripEditor({ photos, template, onDownloadReady, onRestart }) {
  const canvasRef = useRef(null)

  const [selectedFilter, setSelectedFilter] = useState(PHOTO_FILTERS[0])
  const [caption, setCaption] = useState('')
  const [showDate, setShowDate] = useState(true)

  const [loadedPhotos, setLoadedPhotos] = useState(null)
  const [loadedBgImage, setLoadedBgImage] = useState(null)
  const [loadedOverlayImage, setLoadedOverlayImage] = useState(null)

  useEffect(() => {
    let cancelled = false
    Promise.all(photos.map(loadImage)).then((imgs) => {
      if (!cancelled) setLoadedPhotos(imgs)
    })
    return () => { cancelled = true }
  }, [photos])

useEffect(() => {
  let cancelled = false
  setLoadedBgImage(null)
  setLoadedOverlayImage(null)

  if (template.background_image_url) {
    loadImage({ url: template.background_image_url })
      .then((img) => { if (!cancelled) setLoadedBgImage(img) })
      .catch((err) => console.error('Gagal load background image:', template.background_image_url, err))
  }
  if (template.overlay_image_url) {
    loadImage({ url: template.overlay_image_url })
      .then((img) => { if (!cancelled) setLoadedOverlayImage(img) })
      .catch((err) => console.error('Gagal load overlay image:', template.overlay_image_url, err))
  }
  return () => { cancelled = true }
}, [template])

  const draw = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas || !loadedPhotos) return

    const width = template.canvas_width || 600
    const height = template.canvas_height || 2320
    canvas.width = width
    canvas.height = height
    const ctx = canvas.getContext('2d')

    // 1. Background
    if (loadedBgImage) {
      drawImageCover(ctx, loadedBgImage, 0, 0, width, height)
    } else {
      ctx.fillStyle = template.background_color || '#ffffff'
      ctx.fillRect(0, 0, width, height)
    }

    // 2. Foto-foto sesuai photo_slots (posisi, ukuran, rotasi masing-masing)
    ctx.filter = selectedFilter.value
    const slots = template.photo_slots || []

    slots.forEach((slot, i) => {
      const img = loadedPhotos[i]
      if (!img) return

      const cx = slot.x + slot.width / 2
      const cy = slot.y + slot.height / 2
      const rotationRad = ((slot.rotation || 0) * Math.PI) / 180

      ctx.save()
      ctx.translate(cx, cy)
      ctx.rotate(rotationRad)
      drawImageCover(ctx, img, -slot.width / 2, -slot.height / 2, slot.width, slot.height)
      ctx.restore()
    })

    ctx.filter = 'none'

    // 3. Overlay dekorasi (di atas foto)
    if (loadedOverlayImage) {
      ctx.drawImage(loadedOverlayImage, 0, 0, width, height)
    }

    // 4. Teks caption + tanggal (hanya kalau template punya posisi teks)
    ctx.fillStyle = template.text_color || '#1a1a1a'
    ctx.textAlign = 'center'

    if (caption.trim() && template.caption_x != null && template.caption_y != null) {
      ctx.font = `bold ${Math.round(width * 0.053)}px sans-serif`
      ctx.fillText(caption.trim(), template.caption_x, template.caption_y)
    }
    if (showDate && template.date_x != null && template.date_y != null) {
      ctx.font = `${Math.round(width * 0.033)}px sans-serif`
      const dateStr = new Date().toLocaleDateString('id-ID', {
        day: 'numeric', month: 'long', year: 'numeric',
      })
      ctx.fillText(dateStr, template.date_x, template.date_y)
    }
  }, [loadedPhotos, loadedBgImage, loadedOverlayImage, template, caption, showDate, selectedFilter])

  useEffect(() => { draw() }, [draw])

  const handleDownload = () => {
    const canvas = canvasRef.current
    if (!canvas) return
    canvas.toBlob((blob) => {
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `photobooth-${Date.now()}.png`
      a.click()
      URL.revokeObjectURL(url)
      onDownloadReady?.(blob)
    }, 'image/png')
  }

  const aspectRatio = `${template.canvas_width || 600} / ${template.canvas_height || 2320}`

  return (
    <div className="mx-auto max-w-md px-4 py-6">
      <div className="mb-6 flex justify-center">
        {!loadedPhotos ? (
          <div
            className="flex w-full max-w-[300px] items-center justify-center rounded-xl bg-gray-100 text-gray-400"
            style={{ aspectRatio }}
          >
            Memuat...
          </div>
        ) : (
          <canvas
            ref={canvasRef}
            className="w-full max-w-[300px] rounded-xl shadow-lg"
            style={{ aspectRatio }}
          />
        )}
      </div>

      <p className="mb-2 text-sm font-medium text-gray-600">Filter Foto</p>
      <div className="mb-5 flex gap-3 overflow-x-auto pb-1">
        {PHOTO_FILTERS.map((filter) => (
          <button
            key={filter.name}
            onClick={() => setSelectedFilter(filter)}
            className={`flex-shrink-0 overflow-hidden rounded-lg border-2 transition-transform ${
              selectedFilter.name === filter.name ? 'scale-105 border-yellow-400' : 'border-gray-200'
            }`}
          >
            <img src={photos[0].url} alt={filter.name} className="h-16 w-16 object-cover" style={{ filter: filter.value }} />
            <p className="bg-white py-0.5 text-center text-[10px] font-medium text-gray-600">{filter.name}</p>
          </button>
        ))}
      </div>

      {template.caption_x != null && (
        <>
          <label className="mb-1 block text-sm font-medium text-gray-600">Teks (opsional)</label>
          <input
            type="text"
            value={caption}
            onChange={(e) => setCaption(e.target.value.slice(0, 30))}
            placeholder="misal: Bestie Trip 2026"
            className="mb-3 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-yellow-400 focus:outline-none"
          />
        </>
      )}

      {template.date_x != null && (
        <label className="mb-5 flex items-center gap-2 text-sm text-gray-600">
          <input type="checkbox" checked={showDate} onChange={(e) => setShowDate(e.target.checked)} className="h-4 w-4" />
          Tampilkan tanggal
        </label>
      )}

      <button
        onClick={handleDownload}
        disabled={!loadedPhotos}
        className="w-full rounded-full bg-yellow-400 py-3 font-semibold text-black shadow-md active:scale-95 disabled:opacity-40"
      >
        ⬇️ Download Photostrip
      </button>

      {/* Tombol restart — BARU */}
<button
  onClick={onRestart}
  className="mt-3 w-full rounded-full border-2 border-gray-300 py-3 font-semibold text-gray-600 active:scale-95"
>
  🔄 Buat Photobooth Baru
</button>
    </div>
  )
}

function loadImage({ url }) {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => resolve(img)
    img.onerror = reject
    img.src = url
  })
}

function drawImageCover(ctx, img, x, y, w, h) {
  const imgRatio = img.width / img.height
  const boxRatio = w / h
  let sx, sy, sw, sh
  if (imgRatio > boxRatio) {
    sh = img.height; sw = sh * boxRatio; sx = (img.width - sw) / 2; sy = 0
  } else {
    sw = img.width; sh = sw / boxRatio; sx = 0; sy = (img.height - sh) / 2
  }
  ctx.drawImage(img, sx, sy, sw, sh, x, y, w, h)
}