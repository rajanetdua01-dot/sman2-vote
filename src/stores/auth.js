import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export const useAuthStore = defineStore('auth', () => {
  const user = ref(null)
  const isLoading = ref(false)

  const isLoggedIn = computed(() => !!user.value)

  function login(userData) {
    user.value = userData
  }

  function logout() {
    user.value = null
    localStorage.clear()
  }

  function checkAuth() {
    const adminData = localStorage.getItem('smanda_admin')
    const userData = localStorage.getItem('smanda_user')

    if (adminData) {
      try {
        user.value = JSON.parse(adminData).user
      } catch (e) {
        console.error('Error parsing admin data:', e)
      }
    } else if (userData) {
      try {
        user.value = JSON.parse(userData)
      } catch (e) {
        console.error('Error parsing user data:', e)
      }
    }
  }

  return {
    user,
    isLoading,
    isLoggedIn,
    login,
    logout,
    checkAuth,
  }
})
