import { supabase } from './supabaseClient'

const SESSION_KEY = 'photobooth_session_id'

/**
 * Ambil session id yang sudah ada di browser,
 * atau bikin session baru kalau belum ada / sudah expired.
 */
export async function getOrCreateSession() {
  const existingId = sessionStorage.getItem(SESSION_KEY)

  if (existingId) {
    // Cek apakah session ini masih ada & belum expired di database
    const { data, error } = await supabase
      .from('sessions')
      .select('id, expires_at')
      .eq('id', existingId)
      .single()

    if (data && new Date(data.expires_at) > new Date()) {
      return data.id
    }
    // Kalau expired atau gak ketemu, lanjut bikin baru di bawah
  }

  // Bikin session baru
  const { data: newSession, error } = await supabase
    .from('sessions')
    .insert({})
    .select('id')
    .single()

  if (error) {
    console.error('Gagal membuat session:', error)
    throw error
  }

  sessionStorage.setItem(SESSION_KEY, newSession.id)
  return newSession.id
}

/**
 * Hapus session dari sessionStorage (misal saat user klik "Restart")
 */
export function clearLocalSession() {
  sessionStorage.removeItem(SESSION_KEY)
}