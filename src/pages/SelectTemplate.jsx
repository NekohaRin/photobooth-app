import { useEffect, useState } from 'react'
import { fetchTemplates } from '../lib/templates'

export default function SelectTemplate({ onTemplateSelected }) {
  const [templates, setTemplates] = useState([])
  const [selectedId, setSelectedId] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    fetchTemplates()
      .then((data) => {
        setTemplates(data)
        if (data.length > 0) setSelectedId(data[0].id)
      })
      .catch(() => setError('Gagal memuat template. Coba refresh halaman.'))
      .finally(() => setLoading(false))
  }, [])

  const handleContinue = () => {
    const template = templates.find((t) => t.id === selectedId)
    if (template) onTemplateSelected(template)
  }

  if (loading) {
    return <div className="p-8 text-center text-gray-400">Memuat template...</div>
  }

  if (error) {
    return <div className="p-8 text-center text-red-500">{error}</div>
  }

  return (
    <div className="mx-auto max-w-md px-4 py-6">
      <h1 className="mb-1 text-center text-xl font-bold text-gray-800">
        Pilih Gaya Photobooth
      </h1>
      <p className="mb-6 text-center text-sm text-gray-400">
        Pilih template dulu, nanti foto kamu otomatis pakai gaya ini
      </p>

      <div className="mb-6 grid grid-cols-2 gap-4">
      {templates.map((tpl) => {
  const previewImage = tpl.overlay_image_url || tpl.background_image_url

  return (
    <button
      key={tpl.id}
      onClick={() => setSelectedId(tpl.id)}
      className={`overflow-hidden rounded-xl border-2 transition-transform ${
        selectedId === tpl.id
          ? 'scale-[1.03] border-yellow-400 shadow-md'
          : 'border-gray-200'
      }`}
    >
      {previewImage ? (
        <div
          className="aspect-[3/4] w-full overflow-hidden"
          style={{
            backgroundColor: tpl.background_color || '#f3f4f6',
            backgroundImage: tpl.background_image_url
              ? `url(${tpl.background_image_url})`
              : undefined,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}
        >
          <img
            src={previewImage}
            alt={tpl.name}
            className="h-full w-full object-cover object-top"
          />
        </div>
      ) : (
        <div
          className="flex aspect-[3/4] w-full items-center justify-center text-sm font-medium"
          style={{ backgroundColor: tpl.background_color, color: tpl.text_color }}
        >
          {tpl.name}
        </div>
      )}
      <p className="bg-white py-1.5 text-center text-xs font-medium text-gray-700">
        {tpl.name}
      </p>
    </button>
  )
})}
      </div>

      <button
        onClick={handleContinue}
        disabled={!selectedId}
        className="w-full rounded-full bg-yellow-400 py-3 font-semibold text-black shadow-md active:scale-95 disabled:opacity-40"
      >
        Take Photo →
      </button>
    </div>
  )
}