import { defineStore } from 'pinia'
import { supabase } from '@/utils/supabase'

export const useAuthStore = defineStore('auth', () => {
  // Login Calon Kandidat
  const loginCalon = async (nip, tanggalLahir) => {
    try {
      // Cari user berdasarkan NIP
      const { data: user, error: userError } = await supabase
        .from('pengguna')
        .select('*')
        .eq('nip', nip)
        .eq('peran', 'guru')
        .single()

      if (userError || !user) {
        return { success: false, error: 'NIP tidak ditemukan' }
      }

      // Validasi password (format: DDMMYYYY)
      const birthDate = new Date(user.tanggal_lahir)
      const day = String(birthDate.getDate()).padStart(2, '0')
      const month = String(birthDate.getMonth() + 1).padStart(2, '0')
      const year = birthDate.getFullYear()
      const expectedPassword = `${day}${month}${year}`

      if (tanggalLahir !== expectedPassword) {
        return { success: false, error: 'Password salah' }
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

      return { success: true, user }
    } catch (error) {
      return { success: false, error: error.message }
    }
  }

  // Login dengan QR Token
  const loginWithQR = async (token) => {
    try {
      // Cari token yang valid dan belum digunakan
      const { data: tokenData, error: tokenError } = await supabase
        .from('token_qr')
        .select('*, pengguna(*)')
        .eq('token', token)
        .eq('sudah_digunakan', false)
        .gt('kadaluarsa_pada', new Date().toISOString())
        .single()

      if (tokenError || !tokenData) {
        return { success: false, error: 'Token tidak valid atau sudah digunakan' }
      }

      // Update token sebagai digunakan
      await supabase
        .from('token_qr')
        .update({
          sudah_digunakan: true,
          digunakan_pada: new Date().toISOString(),
        })
        .eq('id', tokenData.id)

      // Simpan session pemilih
      localStorage.setItem('smanda_voter', JSON.stringify(tokenData.pengguna))
      localStorage.setItem(
        'smanda_voter_token',
        JSON.stringify({
          token: token,
          timestamp: new Date().toISOString(),
        }),
      )

      return { success: true, user: tokenData.pengguna }
    } catch (error) {
      return { success: false, error: error.message }
    }
  }

  // Logout
  const logout = () => {
    localStorage.removeItem('smanda_user')
    localStorage.removeItem('smanda_admin')
    localStorage.removeItem('smanda_session')
    localStorage.removeItem('smanda_voter')
    localStorage.removeItem('smanda_voter_token')
  }

  return {
    loginCalon,
    loginWithQR,
    logout,
  }
})
