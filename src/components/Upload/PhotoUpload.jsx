import { useRef, useState } from 'react'

const MAX_FILE_SIZE_MB = 10

export default function PhotoUpload({ onCapture }) {
  const fileInputRef = useRef(null)
  const [error, setError] = useState(null)
  const [isDragging, setIsDragging] = useState(false)

  const validateAndProcessFile = (file) => {
    setError(null)

    if (!file) return

    if (!file.type.startsWith('image/')) {
      setError('File harus berupa gambar (JPG, PNG, dll).')
      return
    }

    const fileSizeMB = file.size / (1024 * 1024)
    if (fileSizeMB > MAX_FILE_SIZE_MB) {
      setError(`Ukuran file maksimal ${MAX_FILE_SIZE_MB}MB.`)
      return
    }

    const url = URL.createObjectURL(file)
    onCapture({ blob: file, url })
  }

  const handleFileChange = (e) => {
    const file = e.target.files?.[0]
    validateAndProcessFile(file)
    // reset input biar bisa pilih file yang sama lagi kalau perlu
    e.target.value = ''
  }

  const handleDrop = (e) => {
    e.preventDefault()
    setIsDragging(false)
    const file = e.dataTransfer.files?.[0]
    validateAndProcessFile(file)
  }

  return (
    <div className="w-full max-w-md mx-auto">
      <div
        onClick={() => fileInputRef.current?.click()}
        onDragOver={(e) => {
          e.preventDefault()
          setIsDragging(true)
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        className={`flex aspect-[3/4] w-full cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed transition-colors ${
          isDragging
            ? 'border-yellow-400 bg-yellow-50'
            : 'border-gray-300 bg-gray-50'
        }`}
      >
        <span className="text-5xl">🖼️</span>
        <p className="mt-3 px-6 text-center font-medium text-gray-600">
          Ketuk untuk pilih foto dari galeri
        </p>
        <p className="mt-1 text-xs text-gray-400">
          atau tarik & lepas file di sini
        </p>
      </div>

      {error && (
        <p className="mt-2 text-center text-sm text-red-500">{error}</p>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        className="hidden"
      />
    </div>
  )
}