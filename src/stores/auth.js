import { defineStore } from 'pinia'
import { supabase } from '@/utils/supabase'

export const useAuthStore = defineStore('auth', {
  state: () => ({
    user: null,
    loading: false,
    error: null,
  }),

  actions: {
    // Login Admin
    async loginAdmin(nip, password) {
      this.loading = true
      this.error = null

      try {
        // Cari admin di database
        const { data: user, error: userError } = await supabase
          .from('pengguna')
          .select('*')
          .eq('nip', nip)
          .eq('peran', 'admin')
          .single()

        if (userError || !user) {
          throw new Error('Admin tidak ditemukan')
        }

        // Validasi password (format DDMMYYYY)
        const birthDate = new Date(user.tanggal_lahir)
        const day = String(birthDate.getDate()).padStart(2, '0')
        const month = String(birthDate.getMonth() + 1).padStart(2, '0')
        const year = birthDate.getFullYear()
        const expectedPassword = `${day}${month}${year}`

        if (password !== expectedPassword) {
          throw new Error('Password salah')
        }

        // Simpan session
        const adminSession = {
          user,
          type: 'admin',
          role: user.peran,
          timestamp: new Date().toISOString(),
        }

        localStorage.setItem('smanda_admin', JSON.stringify(adminSession))
        this.user = user

        return { success: true, user }
      } catch (error) {
        this.error = error.message
        return { success: false, error: error.message }
      } finally {
        this.loading = false
      }
    },

    // Login Calon (guru)
    async loginCalon(nip, tanggalLahir) {
      this.loading = true
      this.error = null

      try {
        const { data: user, error: userError } = await supabase
          .from('pengguna')
          .select('*')
          .eq('nip', nip)
          .eq('peran', 'guru')
          .single()

        if (userError || !user) {
          throw new Error('NIP tidak ditemukan')
        }

        // Validasi password
        const birthDate = new Date(user.tanggal_lahir)
        const day = String(birthDate.getDate()).padStart(2, '0')
        const month = String(birthDate.getMonth() + 1).padStart(2, '0')
        const year = birthDate.getFullYear()
        const expectedPassword = `${day}${month}${year}`

        if (tanggalLahir !== expectedPassword) {
          throw new Error('Password salah')
        }

        // Simpan session
        localStorage.setItem('smanda_user', JSON.stringify(user))
        localStorage.setItem(
          'smanda_session',
          JSON.stringify({
            type: 'calon',
            timestamp: new Date().toISOString(),
          }),
        )

        this.user = user
        return { success: true, user }
      } catch (error) {
        this.error = error.message
        return { success: false, error: error.message }
      } finally {
        this.loading = false
      }
    },

    // Logout
    logout() {
      this.user = null
      this.error = null
      localStorage.removeItem('smanda_admin')
      localStorage.removeItem('smanda_user')
      localStorage.setItem('smanda_session')
    },

    // Check if user is authenticated
    checkAuth() {
      try {
        const adminSession = localStorage.getItem('smanda_admin')
        const userSession = localStorage.getItem('smanda_user')

        if (adminSession) {
          const session = JSON.parse(adminSession)
          this.user = session.user
          return { isAuthenticated: true, role: 'admin', user: session.user }
        }

        if (userSession) {
          const user = JSON.parse(userSession)
          this.user = user
          return { isAuthenticated: true, role: 'guru', user }
        }

        return { isAuthenticated: false, role: null, user: null }
      } catch (error) {
        console.error('Auth check error:', error)
        this.logout()
        return { isAuthenticated: false, role: null, user: null }
      }
    },
  },
})
