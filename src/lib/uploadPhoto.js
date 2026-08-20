import { supabase } from './supabaseClient'

/**
 * Upload 1 foto (blob) ke Supabase Storage, lalu catat metadata-nya
 * ke tabel session_photos.
 */
export async function uploadSessionPhoto({ sessionId, blob, order }) {
  const fileName = `${sessionId}/photo_${order}_${Date.now()}.jpg`

  const { error: uploadError } = await supabase.storage
    .from('photobooth-temp')
    .upload(fileName, blob, {
      contentType: 'image/jpeg',
      upsert: false,
    })

  if (uploadError) {
    console.error('Gagal upload foto:', uploadError)
    throw uploadError
  }

  const { data: publicUrlData } = supabase.storage
    .from('photobooth-temp')
    .getPublicUrl(fileName)

  const { error: dbError } = await supabase.from('session_photos').insert({
    session_id: sessionId,
    photo_url: publicUrlData.publicUrl,
    photo_order: order,
  })

  if (dbError) {
    console.error('Gagal simpan metadata foto:', dbError)
    throw dbError
  }

  return publicUrlData.publicUrl
}