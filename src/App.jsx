import { useEffect, useState } from 'react'
import { getOrCreateSession } from './lib/session'
import SelectTemplate from './pages/SelectTemplate'
import TakePhoto from './pages/TakePhoto'
import PhotoStripEditor from './components/PhotoStrip/PhotoStripEditor'

function App() {
  const [sessionId, setSessionId] = useState(null)
  const [sessionError, setSessionError] = useState(null)

  const [selectedTemplate, setSelectedTemplate] = useState(null)
  const [finalPhotos, setFinalPhotos] = useState(null)

  useEffect(() => {
    getOrCreateSession()
      .then(setSessionId)
      .catch((err) => {
        console.error('Gagal membuat session:', err)
        setSessionError(err.message || 'Terjadi kesalahan saat menyiapkan sesi.')
      })
  }, [])

  // Restart total: balik ke pilih template dari awal
  const handleRestart = () => {
    setSelectedTemplate(null)
    setFinalPhotos(null)
  }

  // Ganti template saja: balik ke pilih template, tapi belum sampai hasil akhir
  const handleChangeTemplate = () => {
    setSelectedTemplate(null)
  }

  if (sessionError) {
    return <div className="p-8 text-center text-red-500">Error: {sessionError}</div>
  }

  if (!sessionId) {
    return <div className="p-8 text-center">Menyiapkan sesi...</div>
  }

  if (!selectedTemplate) {
    return (
      <div className="min-h-screen bg-gray-100">
        <SelectTemplate onTemplateSelected={setSelectedTemplate} />
      </div>
    )
  }

  if (!finalPhotos) {
    return (
      <div className="min-h-screen bg-gray-100">
        <TakePhoto
          sessionId={sessionId}
          template={selectedTemplate}
          onAllPhotosReady={setFinalPhotos}
          onChangeTemplate={handleChangeTemplate}
        />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <PhotoStripEditor
        photos={finalPhotos}
        template={selectedTemplate}
        onRestart={handleRestart}
      />
    </div>
  )
}

export default App