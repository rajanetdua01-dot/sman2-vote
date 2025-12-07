// File: src/utils/supabase.js
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY

// Create Supabase client with better auth config
export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    storage: localStorage,
    storageKey: 'smanda-supabase-auth',
    flowType: 'pkce',
  },
  global: {
    headers: {
      'x-application-name': 'smanda-vote',
    },
  },
})

// Auth state change listener
supabase.auth.onAuthStateChange((event, session) => {
  console.log(`[Supabase Auth] ${event}`, session?.user?.email)

  switch (event) {
    case 'SIGNED_IN':
      console.log('✅ User signed in:', session.user.email)
      break
    case 'SIGNED_OUT':
      console.log('👋 User signed out')
      localStorage.removeItem('smanda_user_level')
      localStorage.removeItem('smanda_user_name')
      break
    case 'TOKEN_REFRESHED':
      console.log('🔄 Token refreshed')
      break
    case 'USER_UPDATED':
      console.log('📝 User updated:', session.user)
      break
  }
})

// Test connection function
export const testConnection = async () => {
  try {
    console.log('Testing Supabase connection...')

    // Test 1: Check auth session
    const { data: sessionData } = await supabase.auth.getSession()
    console.log('Session check:', sessionData.session ? 'Active' : 'No session')

    // Test 2: Simple query - hanya ambil count
    const { count, error } = await supabase
      .from('pengguna')
      .select('*', { count: 'exact', head: true })

    if (error) throw error

    return {
      success: true,
      message: '✅ Supabase connected successfully',
      userCount: count || 0,
      hasSession: !!sessionData.session,
    }
  } catch (error) {
    console.error('Connection test failed:', error)
    return {
      success: false,
      error: error.message,
      message: '❌ Failed to connect to Supabase',
    }
  }
}

// Helper function untuk check role cepat
export const getCurrentUserRole = async () => {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return null

    const { data: profile } = await supabase
      .from('pengguna')
      .select('user_level, peran')
      .eq('id', user.id)
      .single()

    return profile
  } catch (error) {
    console.error('Get role error:', error)
    return null
  }
}

// Helper untuk check if user is admin
export const isUserAdmin = async () => {
  const role = await getCurrentUserRole()
  return role && ['superadmin', 'admin', 'operator'].includes(role.user_level)
}
