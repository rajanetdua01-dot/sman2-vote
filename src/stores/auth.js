import { defineStore } from 'pinia'
import { supabase } from '@/utils/supabase'

export const useAuthStore = defineStore('auth', {
  state: () => ({
    user: null,
    session: null,
    loading: false,
    error: null
  }),

  actions: {
    // Login untuk calon kandidat (NIP + tanggal lahir)
    async loginCalon(nip, tanggalLahir) {
      this.loading = true
      this.error = null
      
      try {
        // 1. Cari user by NIP
        const { data: user, error: userError } = await supabase
          .from('pengguna')
          .select('*')
          .eq('nip', nip)
          .single()
        
        if (userError) throw new Error('NIP tidak ditemukan')
        
        // 2. Validasi tanggal lahir (format: DDMMYYYY)
        const birthDate = new Date(user.tanggal_lahir)
        const day = String(birthDate.getDate()).padStart(2, '0')
        const month = String(birthDate.getMonth() + 1).padStart(2, '0')
        const year = birthDate.getFullYear()
        const birthPassword = `${day}${month}${year}`
        
        if (tanggalLahir !== birthPassword) {
          throw new Error('Tanggal lahir tidak sesuai')
        }
        
        // 3. Set user ke state
        this.user = user
        this.session = { type: 'calon' }
        
        // 4. Simpan ke localStorage
        localStorage.setItem('smanda_user', JSON.stringify(user))
        localStorage.setItem('smanda_session', JSON.stringify({ type: 'calon' }))
        
        return { success: true, user }
        
      } catch (error) {
        this.error = error.message
        return { success: false, error: error.message }
      } finally {
        this.loading = false
      }
    },
    
    // Login dengan QR token (untuk pemilih)
    async loginWithQR(token) {
      this.loading = true
      
      try {
        // 1. Validasi token di database
        const { data: tokenData, error: tokenError } = await supabase
          .from('token_qr')
          .select('*, pengguna(*)')
          .eq('token', token)
          .eq('sudah_digunakan', false)
          .gt('kadaluarsa_pada', new Date().toISOString())
          .single()
        
        if (tokenError) throw new Error('Token tidak valid atau sudah kadaluarsa')
        
        // 2. Update token jadi used
        await supabase
          .from('token_qr')
          .update({ 
            sudah_digunakan: true, 
            digunakan_pada: new Date().toISOString() 
          })
          .eq('id', tokenData.id)
        
        // 3. Set user ke state
        this.user = tokenData.pengguna
        this.session = { type: 'pemilih', token: token }
        
        // 4. Simpan ke localStorage
        localStorage.setItem('smanda_user', JSON.stringify(tokenData.pengguna))
        localStorage.setItem('smanda_session', JSON.stringify({ 
          type: 'pemilih', 
          token: token 
        }))
        
        return { success: true, user: tokenData.pengguna }
        
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
      this.session = null
      localStorage.removeItem('smanda_user')
      localStorage.removeItem('smanda_session')
    },
    
    // Check auth dari localStorage (saat refresh)
    checkAuth() {
      const user = localStorage.getItem('smanda_user')
      const session = localStorage.getItem('smanda_session')
      
      if (user && session) {
        try {
          this.user = JSON.parse(user)
          this.session = JSON.parse(session)
        } catch (e) {
          // Clear invalid data
          localStorage.removeItem('smanda_user')
          localStorage.removeItem('smanda_session')
        }
      }
    }
  },
  
  getters: {
    isLoggedIn: (state) => !!state.user,
    isCalon: (state) => state.session?.type === 'calon',
    isPemilih: (state) => state.session?.type === 'pemilih',
    userRole: (state) => state.user?.peran,
    userName: (state) => state.user?.nama_lengkap || 'User'
  }
})