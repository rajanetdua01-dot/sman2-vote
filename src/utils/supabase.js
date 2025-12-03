// File: src/utils/supabase.js
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY

// Create Supabase client
export const supabase = createClient(supabaseUrl, supabaseKey)

// Test function
export const testConnection = async () => {
  try {
    const { data, error } = await supabase
      .from('pengguna')
      .select('count', { count: 'exact', head: true })

    if (error) throw error
    return { success: true, count: data }
  } catch (error) {
    return { success: false, error: error.message }
  }
}
