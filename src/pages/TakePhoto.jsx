import { useState } from 'react'
import CameraCapture from '../components/Camera/CameraCapture'
import PhotoUpload from '../components/Upload/PhotoUpload'
import { uploadSessionPhoto } from '../lib/uploadPhoto'

const MAX_POOL = 9

export default function TakePhoto({ sessionId, template, onAllPhotosReady, onChangeTemplate }) {
  const TOTAL_PHOTOS = template.photo_slots?.length || 3
  console.log('Template:', template.name, '| Jumlah slot:', TOTAL_PHOTOS) // sementara, buat cek
  const [mode, setMode] = useState(null)
  const [pool, setPool] = useState([])
  const [selectedIds, setSelectedIds] = useState([])
  const [isUploading, setIsUploading] = useState(false)
  const [uploadError, setUploadError] = useState(null)

  const isSelectionComplete = selectedIds.length === TOTAL_PHOTOS
  const isPoolFull = pool.length >= MAX_POOL

  const handleAddToPool = ({ blob, url }) => {
    const id = crypto.randomUUID()
    setPool((prev) => [...prev, { id, url, blob }])
    setMode(null)
  }

  const handleDeleteFromPool = (id) => {
    setPool((prev) => prev.filter((p) => p.id !== id))
    setSelectedIds((prev) => prev.filter((sid) => sid !== id))
  }

  const toggleSelect = (id) => {
    setSelectedIds((prev) => {
      if (prev.includes(id)) return prev.filter((sid) => sid !== id)
      if (prev.length >= TOTAL_PHOTOS) return prev
      return [...prev, id]
    })
  }

  const handleContinue = async () => {
    if (!isSelectionComplete) return
    setUploadError(null)
    setIsUploading(true)

    try {
      const orderedPhotos = selectedIds.map((id) => pool.find((p) => p.id === id))
      await Promise.all(
        orderedPhotos.map((photo, i) =>
          uploadSessionPhoto({ sessionId, blob: photo.blob, order: i + 1 })
        )
      )
      onAllPhotosReady(orderedPhotos)
    } catch (err) {
      setUploadError('Gagal menyimpan foto terpilih. Coba lagi ya.')
    } finally {
      setIsUploading(false)
    }
  }

  return (
    <div
      className="min-h-screen px-4 py-6"
      style={{ backgroundColor: template.background_color || '#f3f4f6' }}
    >
      <div className="mx-auto max-w-md">
        <div className="mb-5 text-center">
          <span
            className="inline-block rounded-full px-4 py-1.5 text-xs font-semibold"
            style={{
              backgroundColor: template.text_color || '#1a1a1a',
              color: template.background_color || '#ffffff',
            }}
          >
            ✨ Template: {template.name}
          </span>

          <button
            onClick={onChangeTemplate}
            className="mt-2 block w-full text-xs underline opacity-60"
            style={{ color: template.text_color }}
          >
            Ganti template lain?
          </button>
        </div>

        <p className="mb-1 text-center text-sm font-medium" style={{ color: template.text_color }}>
          {selectedIds.length}/{TOTAL_PHOTOS} foto dipilih
        </p>
        <p className="mb-4 text-center text-xs opacity-60" style={{ color: template.text_color }}>
          Ambil beberapa foto, lalu pilih {TOTAL_PHOTOS} terbaikmu
        </p>

        {uploadError && (
          <p className="mb-3 text-center text-sm text-red-500">{uploadError}</p>
        )}

        {mode === 'camera' && (
          <div className="mb-4">
            <CameraCapture onCapture={handleAddToPool} />
            <button onClick={() => setMode(null)} className="mt-3 w-full text-center text-sm text-gray-400 underline">
              Batal
            </button>
          </div>
        )}

        {mode === 'upload' && (
          <div className="mb-4">
            <PhotoUpload onCapture={handleAddToPool} />
            <button onClick={() => setMode(null)} className="mt-3 w-full text-center text-sm text-gray-400 underline">
              Batal
            </button>
          </div>
        )}

        {mode === null && (
          <div className="mb-5 flex flex-col gap-3">
            <button
              onClick={() => setMode('camera')}
              disabled={isPoolFull}
              className="rounded-xl bg-yellow-400 py-3 font-semibold text-black active:scale-95 disabled:opacity-40"
            >
              📷 Take Photo
            </button>
            <button
              onClick={() => setMode('upload')}
              disabled={isPoolFull}
              className="rounded-xl border-2 border-gray-300 py-3 font-semibold text-gray-700 active:scale-95 disabled:opacity-40"
            >
              🖼️ Upload from Gallery
            </button>
            {isPoolFull && (
              <p className="text-center text-xs text-gray-400">
                Sudah mencapai batas maksimal {MAX_POOL} sample foto.
              </p>
            )}
          </div>
        )}

        {pool.length > 0 && (
          <div className="mb-6">
            <p className="mb-2 text-sm font-medium" style={{ color: template.text_color }}>
              Sample foto ({pool.length})
            </p>
            <div className="grid grid-cols-3 gap-3">
              {pool.map((photo) => {
                const selectedIndex = selectedIds.indexOf(photo.id)
                const isSelected = selectedIndex !== -1
                return (
                  <div key={photo.id} className="relative">
                    <button
                      onClick={() => toggleSelect(photo.id)}
                      className={`aspect-square w-full overflow-hidden rounded-lg border-2 ${
                        isSelected ? 'border-yellow-400' : 'border-transparent'
                      }`}
                    >
                      <img src={photo.url} alt="Sample" className="h-full w-full object-cover" />
                    </button>
                    {isSelected && (
                      <span className="absolute left-1 top-1 flex h-6 w-6 items-center justify-center rounded-full bg-yellow-400 text-xs font-bold text-black shadow">
                        {selectedIndex + 1}
                      </span>
                    )}
                    <button
                      onClick={() => handleDeleteFromPool(photo.id)}
                      className="absolute right-1 top-1 flex h-6 w-6 items-center justify-center rounded-full bg-black/60 text-xs text-white"
                      aria-label="Hapus foto"
                    >
                      ✕
                    </button>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        <button
          onClick={handleContinue}
          disabled={!isSelectionComplete || isUploading}
          className="w-full rounded-full bg-yellow-400 py-3 font-semibold text-black shadow-md active:scale-95 disabled:opacity-40"
        >
          {isUploading ? 'Menyimpan...' : `Lanjutkan (${selectedIds.length}/${TOTAL_PHOTOS})`}
        </button>
      </div>
    </div>
  )
}