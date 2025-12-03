// src/stores/auth.js - FIXED VERSION
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
// HAPUS import supabase karena gak dipakai di auth store
// import { supabase } from '@/utils/supabase'  // <- HAPUS BARIS INI

export const useAuthStore = defineStore('auth', () => {
  const user = ref(null)
  const session = ref(null)
  const loading = ref(false)
  const error = ref(null)

  // COMPUTED WITH NULL CHECKS
  const isLoggedIn = computed(() => {
    return !!session.value && !!user.value
  })

  const userName = computed(() => {
    return user.value?.nama_lengkap || 'Guest'
  })

  const userRole = computed(() => {
    return user.value?.peran || 'guest'
  })

  // FUNCTIONS WITH TRY-CATCH
  const checkAuth = async () => {
    try {
      loading.value = true

      // Check localStorage dengan safety
      const adminSession = localStorage.getItem('smanda_admin')
      const userSession = localStorage.getItem('smanda_user')

      if (adminSession) {
        try {
          session.value = { type: 'admin' }
          user.value = JSON.parse(adminSession).user || JSON.parse(userSession)
        } catch (e) {
          console.error('Error parsing session:', e)
          clearAuth()
        }
      } else if (userSession) {
        try {
          user.value = JSON.parse(userSession)
          session.value = { type: 'calon' }
        } catch (e) {
          console.error('Error parsing user:', e)
          clearAuth()
        }
      }
    } catch (err) {
      console.error('Auth check error:', err)
      error.value = err.message
    } finally {
      loading.value = false
    }
  }

  const clearAuth = () => {
    user.value = null
    session.value = null
    localStorage.removeItem('smanda_admin')
    localStorage.removeItem('smanda_user')
    localStorage.removeItem('smanda_session')
  }

  // Tambah fungsi logout untuk dipakai di App.vue
  const logout = () => {
    clearAuth()
    window.location.href = '/#/'
  }

  return {
    user,
    session,
    loading,
    error,
    isLoggedIn,
    userName,
    userRole,
    checkAuth,
    clearAuth,
    logout, // Export logout function
  }
})
