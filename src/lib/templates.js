import { supabase } from './supabaseClient'

export async function fetchTemplates() {
  const { data, error } = await supabase
    .from('templates')
    .select('*')
    .eq('is_active', true)
    .order('sort_order', { ascending: true })

  if (error) {
    console.error('Gagal ambil template:', error)
    throw error
  }

  return data
}