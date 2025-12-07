// stores/auth.js
import { defineStore } from 'pinia'
import { supabase } from '@/utils/supabase'

export const useAuthStore = defineStore('auth', {
  state: () => ({
    user: null,
    admin: null,
    loading: false,
    error: null,
    loginType: null, // 'admin', 'peserta'
  }),

  actions: {
    // ==================== ADMIN LOGIN (Supabase Auth) ====================
    async loginAdmin(email, password) {
      this.loading = true
      this.error = null

      try {
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        })

        if (error) throw error

        this.user = data.user
        this.loginType = 'admin'

        localStorage.setItem('auth_type', 'admin')
        localStorage.setItem('admin_user', JSON.stringify(data.user))

        return { success: true, user: data.user }
      } catch (error) {
        this.error = error.message
        return { success: false, error: error.message }
      } finally {
        this.loading = false
      }
    },

    // ==================== PESERTA LOGIN (Semua Bisa Login) ====================
    async loginPeserta(nip, password) {
      this.loading = true
      this.error = null

      try {
        // 1. Validasi input
        if (!nip || !password) {
          throw new Error('NIP dan Password harus diisi')
        }

        // 2. Query ke tabel 'pengguna'
        const { data: peserta, error: queryError } = await supabase
          .from('pengguna')
          .select('*')
          .eq('nip', nip)
          .single()

        if (queryError) {
          if (queryError.code === 'PGRST116') {
            throw new Error('NIP tidak ditemukan di database')
          }
          throw new Error('Error database: ' + queryError.message)
        }

        if (!peserta) {
          throw new Error('Data peserta tidak ditemukan')
        }

        // 3. Check active status
        if (peserta.is_active === false) {
          throw new Error('Akun tidak aktif. Hubungi administrator.')
        }

        // 4. Tentukan cara validasi berdasarkan status kepegawaian
        const status = peserta.status_kepegawaian
        let isValidPassword = false
        let tanggalLahirFromNIP = null
        let tanggalLahirString = null

        // LOGIKA VALIDASI PASSWORD BERDASARKAN JENIS PEGAWAI:
        if (['PNS', 'PPPK'].includes(status)) {
          // A. PNS & PPPK: Password = Tanggal Lahir dari NIP (DDMMYYYY)

          // Ambil tanggal lahir dari NIP (8 digit pertama)
          if (nip.length >= 8) {
            const yyyymmdd = nip.substring(0, 8)
            if (/^\d{8}$/.test(yyyymmdd)) {
              const year = yyyymmdd.substring(0, 4)
              const month = yyyymmdd.substring(4, 6)
              const day = yyyymmdd.substring(6, 8)

              // Format tanggal lahir yang diharapkan: DDMMYYYY
              const expectedPassword = `${day}${month}${year}`
              tanggalLahirFromNIP = { year, month, day }
              tanggalLahirString = `${year}-${month}-${day}`

              // Validasi password
              if (password === expectedPassword) {
                isValidPassword = true
              } else {
                // Coba format alternatif untuk user-friendly
                const altFormats = [
                  `${day}${month}${year.substring(2)}`, // DDMMYY
                  `${year}${month}${day}`, // YYYYMMDD
                  `${day}/${month}/${year}`, // DD/MM/YYYY
                  `${day}-${month}-${year}`, // DD-MM-YYYY
                ]

                if (altFormats.includes(password)) {
                  isValidPassword = true
                } else {
                  // Beri petunjuk yang jelas
                  throw new Error(
                    `Password salah. Untuk ${status} (${peserta.nama_lengkap}), gunakan: ${expectedPassword}`,
                  )
                }
              }
            }
          }

          if (!isValidPassword && !tanggalLahirFromNIP) {
            throw new Error('Format NIP tidak valid. Tidak dapat mengambil tanggal lahir')
          }
        } else {
          // B. PTT, GTT, Honorer: Password Default
          // List default passwords yang diperbolehkan
          const defaultPasswords = [
            'smanda123',
            'sman2bandarlampung',
            nip, // NIP sebagai password
            '12345678',
            'password',
            'sman2vote',
            'smanda2024',
          ]

          // Cek apakah password termasuk dalam default
          if (defaultPasswords.includes(password)) {
            isValidPassword = true
          } else {
            // Beri petunjuk default password
            throw new Error(
              `Password salah. Untuk ${status}, gunakan salah satu: smanda123, ${nip}`,
            )
          }
        }

        if (!isValidPassword) {
          throw new Error('Password tidak valid')
        }

        // 5. TENTUKAN PERMISSION BERDASARKAN PERAN & STATUS
        // ✅ PERUBAHAN PENTING: Validasi peran untuk bisa dicalonkan
        const isGuru = peserta.peran === 'guru'
        const isPNSatauPPPK = ['PNS', 'PPPK'].includes(status)

        // CEK ELIGIBILITY FLAG (hanya untuk PNS/PPPK yang bisa JADI CALON)
        let eligibilityMessage = null
        let canBeCandidate = false

        if (isGuru && isPNSatauPPPK) {
          // Hanya GURU PNS/PPPK yang dicek eligibility
          if (peserta.is_manual_noneligible) {
            eligibilityMessage = `Status: Tidak eligible - ${peserta.manual_noneligible_reason || 'Alasan tidak ditentukan'}`
            canBeCandidate = false
            console.warn(eligibilityMessage)
          } else {
            canBeCandidate = true
          }
        } else if (isGuru && !isPNSatauPPPK) {
          // GURU tapi bukan PNS/PPPK (PTT/GTT/Honorer)
          eligibilityMessage = `Status: ${status} - Tidak bisa dicalonkan (hanya PNS/PPPK)`
          canBeCandidate = false
        } else if (!isGuru) {
          // TENAGA KEPENDIDIKAN (tendik)
          eligibilityMessage = `Peran: ${peserta.peran === 'tendik' ? 'Tenaga Kependidikan' : peserta.peran} - Tidak bisa dicalonkan`
          canBeCandidate = false
        }

        // 6. Set user data - DENGAN PERBAIKAN VALIDASI PERAN
        this.user = {
          id: peserta.id,
          nip: peserta.nip,
          nama_lengkap: peserta.nama_lengkap,
          peran: peserta.peran,
          pangkat: peserta.pangkat,
          golongan_ruang: peserta.golongan_ruang,
          status_kepegawaian: peserta.status_kepegawaian,
          tanggal_lahir: tanggalLahirString,
          is_peserta: true,

          // ✅ PERUBAHAN: SEMUA PESERTA BISA MENDAPATKAN CALON
          can_register_candidate: true, // SEMUA BISA MENDAPATKAN

          // ✅ PERBAIKAN: Hanya GURU PNS/PPPK tanpa flag manual yang bisa dicalonkan
          can_be_candidate: canBeCandidate,

          // ✅ Info tambahan untuk tampilan
          is_guru: isGuru,
          is_pns_or_pppk: isPNSatauPPPK,

          can_vote: true, // Semua bisa voting (nanti pakai token QR)
          eligibility_message: eligibilityMessage,
          last_login: new Date().toISOString(),
        }

        this.loginType = 'peserta'

        // 7. Simpan ke localStorage
        localStorage.setItem('auth_type', 'peserta')
        localStorage.setItem('peserta_user', JSON.stringify(this.user))

        return {
          success: true,
          user: this.user,
          message: eligibilityMessage
            ? `Login berhasil. ${eligibilityMessage}`
            : 'Login berhasil sebagai peserta pemilihan',
        }
      } catch (error) {
        this.error = error.message
        return {
          success: false,
          error: error.message,
        }
      } finally {
        this.loading = false
      }
    },

    // ==================== BACKWARD COMPATIBILITY ====================
    async loginCalon(nip, tanggalLahir) {
      // Untuk backward compatibility dengan LoginCalon.vue yang lama
      return await this.loginPeserta(nip, tanggalLahir)
    },

    // ==================== SESSION MANAGEMENT ====================
    async checkSession() {
      try {
        const authType = localStorage.getItem('auth_type')

        if (authType === 'admin') {
          const { data } = await supabase.auth.getSession()
          if (data.session) {
            this.user = data.session.user
            this.loginType = 'admin'
            return this.user
          }
        } else if (authType === 'peserta') {
          const storedUser = localStorage.getItem('peserta_user')
          if (storedUser) {
            this.user = JSON.parse(storedUser)
            this.loginType = 'peserta'
            return this.user
          }
        }

        return null
      } catch (error) {
        console.error('Check session error:', error)
        return null
      }
    },

    async logout() {
      try {
        const authType = localStorage.getItem('auth_type')

        if (authType === 'admin') {
          await supabase.auth.signOut()
          localStorage.removeItem('admin_user')
        } else if (authType === 'peserta') {
          localStorage.removeItem('peserta_user')
        }

        localStorage.removeItem('auth_type')
        this.user = null
        this.admin = null
        this.loginType = null
        this.error = null

        return true
      } catch (error) {
        console.error('Logout error:', error)
        return false
      }
    },

    // ==================== PASSWORD UTILITIES ====================
    getExpectedPasswordFromNIP(nip, status) {
      if (!['PNS', 'PPPK'].includes(status) || !nip || nip.length < 8) {
        return null
      }

      const yyyymmdd = nip.substring(0, 8)
      if (!/^\d{8}$/.test(yyyymmdd)) {
        return null
      }

      const year = yyyymmdd.substring(0, 4)
      const month = yyyymmdd.substring(4, 6)
      const day = yyyymmdd.substring(6, 8)

      return {
        DDMMYYYY: `${day}${month}${year}`,
        DDMMYY: `${day}${month}${year.substring(2)}`,
        YYYYMMDD: `${year}${month}${day}`,
        display: `${day}-${month}-${year}`,
      }
    },

    // ==================== CHECK PERMISSIONS ====================
    isAdmin() {
      return this.loginType === 'admin'
    },

    isPeserta() {
      return this.loginType === 'peserta'
    },

    // ✅ PERUBAHAN: SEMUA PESERTA BISA MENDAPATKAN CALON
    canRegisterCandidate() {
      return this.isPeserta() // Semua peserta bisa
    },

    canVote() {
      return this.isPeserta() && this.user?.can_vote === true
    },

    // ✅ PERBAIKAN: VALIDASI LENGKAP UNTUK BISA DICALONKAN
    isEligibleCandidate() {
      return (
        this.isPeserta() &&
        this.user?.is_guru === true && // ✅ HARUS GURU
        this.user?.is_pns_or_pppk === true && // ✅ HARUS PNS/PPPK
        !this.user?.eligibility_message // ✅ TIDAK ADA PESAN ELIGIBILITY
      )
    },

    // ✅ PERBAIKAN: Apakah user bisa dicalonkan
    canBeCandidate() {
      return this.user?.can_be_candidate === true
    },

    // ✅ FUNGSI BARU: Cek apakah user adalah guru
    isGuru() {
      return this.user?.is_guru === true
    },

    // ✅ FUNGSI BARU: Cek apakah user adalah tenaga kependidikan
    isTenagaKependidikan() {
      return this.user?.peran === 'tendik'
    },

    // ==================== GET USER INFO ====================
    getUserInfo() {
      return this.user
    },

    getUserId() {
      return this.user?.id
    },

    getUserNIP() {
      return this.user?.nip
    },

    getUserName() {
      return this.user?.nama_lengkap
    },

    getUserStatus() {
      return this.user?.status_kepegawaian
    },

    getUserGolongan() {
      return this.user?.golongan_ruang
    },

    // ==================== UPDATE USER DATA ====================
    async updateUserProfile(updates) {
      try {
        if (!this.user?.id) {
          throw new Error('User tidak ditemukan')
        }

        const { data, error } = await supabase
          .from('pengguna')
          .update({
            ...updates,
            diperbarui_pada: new Date().toISOString(),
          })
          .eq('id', this.user.id)
          .select()
          .single()

        if (error) throw error

        // Update local user data
        this.user = { ...this.user, ...data }
        localStorage.setItem('peserta_user', JSON.stringify(this.user))

        return { success: true, user: this.user }
      } catch (error) {
        return { success: false, error: error.message }
      }
    },

    // ==================== CHECK IF USER IS CANDIDATE ====================
    async checkIfUserIsCandidate(sesiId = null) {
      try {
        if (!this.user?.id) return { isCandidate: false, data: null }

        let query = supabase
          .from('kandidat')
          .select('*, sesi_pemilihan(*)')
          .eq('pengguna_id', this.user.id)

        if (sesiId) {
          query = query.eq('sesi_id', sesiId)
        }

        const { data, error } = await query

        if (error) throw error

        return {
          isCandidate: data && data.length > 0,
          data: data || [],
          count: data?.length || 0,
        }
      } catch (error) {
        console.error('Error checking candidate status:', error)
        return { isCandidate: false, data: null, error: error.message }
      }
    },
  },

  getters: {
    // ==================== BASIC GETTERS ====================
    isAuthenticated: (state) => !!state.user,
    userEmail: (state) => state.user?.email || null,
    userId: (state) => state.user?.id || null,
    userName: (state) => state.user?.nama_lengkap || null,
    userNIP: (state) => state.user?.nip || null,
    userRole: (state) => state.user?.peran || null,
    authType: (state) => state.loginType,

    // ==================== PERAN GETTERS ====================
    isGuru: (state) => state.user?.is_guru === true,
    isTenagaKependidikan: (state) => state.user?.peran === 'tendik',

    // ==================== STATUS KEPEGAWAIAN GETTERS ====================
    isPNS: (state) => state.user?.status_kepegawaian === 'PNS',
    isPPPK: (state) => state.user?.status_kepegawaian === 'PPPK',
    isPTT: (state) => state.user?.status_kepegawaian === 'PTT',
    isGTT: (state) => state.user?.status_kepegawaian === 'GTT',
    isHonorer: (state) => state.user?.status_kepegawaian === 'Honorer',

    // ==================== DISPLAY INFO ====================
    userDisplayInfo: (state) => {
      if (!state.user) return null

      // Tentukan label peran
      let peranLabel = 'Unknown'
      if (state.user.peran === 'guru') {
        peranLabel = 'Guru'
      } else if (state.user.peran === 'tendik') {
        peranLabel = 'Tenaga Kependidikan'
      }

      return {
        nama: state.user.nama_lengkap,
        nip: state.user.nip,
        status: state.user.status_kepegawaian,
        pangkat: state.user.pangkat,
        golongan: state.user.golongan_ruang,
        peran: peranLabel,
        dapat_mendaftarkan: 'Ya', // ✅ Semua bisa mendaftarkan
        dapat_dicalonkan: state.user.can_be_candidate ? 'Ya' : 'Tidak', // ✅ Hanya yang eligible
      }
    },

    // ==================== AUTH STATUS ====================
    isLoggedInAsPeserta: (state) => state.loginType === 'peserta',
    isLoggedInAsAdmin: (state) => state.loginType === 'admin',

    // ==================== ELIGIBILITY SUMMARY ====================
    eligibilitySummary: (state) => {
      if (!state.user) return null

      const summaries = []

      // Cek peran
      if (state.user.peran !== 'guru') {
        summaries.push('❌ Bukan guru (Tenaga Kependidikan tidak bisa dicalonkan)')
      }

      // Cek status kepegawaian
      if (!['PNS', 'PPPK'].includes(state.user.status_kepegawaian)) {
        summaries.push(`❌ Status kepegawaian: ${state.user.status_kepegawaian} (harus PNS/PPPK)`)
      }

      // Cek eligibility message
      if (state.user.eligibility_message) {
        summaries.push(`❌ ${state.user.eligibility_message}`)
      }

      // Jika semua lolos
      if (summaries.length === 0) {
        summaries.push('✅ Memenuhi semua syarat untuk dicalonkan')
      }

      return summaries
    },
  },
})
