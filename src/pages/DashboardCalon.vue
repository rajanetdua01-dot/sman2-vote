<template>
  <div class="dashboard-calon">
    <div class="header">
      <h1>Dashboard Calon Kandidat</h1>
      <div class="user-info">
        <p v-if="user">
          Selamat datang, <strong>{{ user.nama_lengkap }}</strong>
        </p>
        <p v-if="user">NIP: {{ user.nip }}</p>
        <p v-if="user">Masa Kerja: {{ masaKerjaTahun }} tahun</p>
      </div>
    </div>

    <div v-if="loading" class="loading">Memuat data...</div>

    <div v-else class="content">
      <!-- STATUS SESSION -->
      <div class="session-info card">
        <h3>Informasi Sesi Pemilihan</h3>
        <div v-if="activeSession">
          <p>
            <strong>{{ activeSession.nama_sesi }}</strong>
          </p>
          <p>Tahun Ajaran: {{ activeSession.tahun_ajaran }}</p>
          <p>
            Status:
            <span :class="'status-' + activeSession.status">
              {{ activeSession.status.toUpperCase() }}
            </span>
          </p>
          <p v-if="activeSession.status === 'pendaftaran'">
            ⏰ Pendaftaran dibuka sampai:
            {{ formatDate(activeSession.waktu_selesai_pendaftaran) }}
          </p>
        </div>
        <div v-else>
          <p>Tidak ada sesi pemilihan aktif</p>
        </div>
      </div>

      <!-- STATUS PENDAFTARAN -->
      <div class="registration-status card">
        <h3>Status Pendaftaran Anda</h3>

        <div v-if="!activeSession || activeSession.status !== 'pendaftaran'" class="not-open">
          <p>⚠️ Pendaftaran calon belum dibuka atau sudah ditutup</p>
        </div>

        <div v-else-if="userRegistration">
          <!-- SUDAH DAFTAR -->
          <div class="already-registered">
            <div class="status-badge" :class="userRegistration.status">
              {{ userRegistration.status.toUpperCase() }}
            </div>

            <div class="registration-details">
              <h4>Data Pendaftaran Anda:</h4>
              <p>
                <strong>Jabatan:</strong> {{ formatJabatan(userRegistration.jabatan_diajukan) }}
              </p>
              <p><strong>Waktu Daftar:</strong> {{ formatDate(userRegistration.dibuat_pada) }}</p>

              <div v-if="userRegistration.status === 'menunggu'">
                <p>⏳ Menunggu verifikasi panitia (masa kerja kurang dari 3 tahun)</p>
              </div>

              <div v-else-if="userRegistration.status === 'disetujui'">
                <p>✅ Pendaftaran Anda telah disetujui!</p>
                <p>Anda akan tampil sebagai kandidat di halaman voting</p>
              </div>

              <div v-else-if="userRegistration.status === 'ditolak'">
                <p>❌ Pendaftaran Anda ditolak</p>
                <p v-if="userRegistration.alasan_ditolak">
                  <strong>Alasan:</strong> {{ userRegistration.alasan_ditolak }}
                </p>
                <button @click="showEditForm = true" class="btn-edit">Ajukan Ulang</button>
              </div>
            </div>
          </div>
        </div>

        <div v-else>
          <!-- BELUM DAFTAR -->
          <div class="not-registered">
            <p>Anda belum mendaftar sebagai calon kandidat</p>

            <div class="approve-info" v-if="user">
              <p v-if="isAutoApprove(user.nip)" class="auto-approve">
                ✅ <strong>AUTO-APPROVE</strong> (Masa kerja minimal 3 tahun)
              </p>
              <p v-else class="manual-approve">
                ⏳ <strong>MENUNGGU VERIFIKASI</strong> (Masa kerja kurang dari 3 tahun)
              </p>
            </div>

            <button @click="showRegistrationForm = true" class="btn-register">
              Daftar Sekarang
            </button>
          </div>
        </div>
      </div>

      <!-- FORM PENDAFTARAN -->
      <div v-if="showRegistrationForm" class="modal-overlay">
        <div class="modal">
          <div class="modal-header">
            <h3>Form Pendaftaran Calon Kandidat</h3>
            <button @click="showRegistrationForm = false" class="btn-close">×</button>
          </div>

          <div class="modal-body">
            <div class="approve-notice" v-if="user">
              <p v-if="isAutoApprove(user.nip)" class="auto-approve-notice">
                ✅ <strong>PENDAFTARAN ANDA AKAN OTOMATIS DISETUJUI</strong><br />
                Karena masa kerja Anda {{ masaKerjaTahun }} tahun (minimal 3 tahun)
              </p>
              <p v-else class="manual-approve-notice">
                ⏳ <strong>PENDAFTARAN ANDA AKAN DITINJAU MANUAL</strong><br />
                Karena masa kerja Anda {{ masaKerjaTahun }} tahun (kurang dari 3 tahun)
              </p>
            </div>

            <form @submit.prevent="submitRegistration">
              <div class="form-group">
                <label>Pilih Jabatan *</label>
                <select v-model="formData.jabatan" required>
                  <option value="">-- Pilih Jabatan --</option>
                  <option value="humas">Waka Humas</option>
                  <option value="sarpras">Waka Sarana Prasarana</option>
                  <option value="kesiswaan">Waka Kesiswaan</option>
                  <option value="kurikulum">Waka Kurikulum</option>
                </select>
              </div>

              <div class="form-group">
                <label>Visi & Misi *</label>
                <textarea
                  v-model="formData.visi_misi"
                  rows="6"
                  placeholder="Tuliskan visi dan misi Anda..."
                  required
                ></textarea>
                <small>Minimal 100 karakter</small>
                <p class="char-count">{{ formData.visi_misi.length }}/100 karakter</p>
              </div>

              <div class="form-actions">
                <button type="button" @click="showRegistrationForm = false" class="btn-cancel">
                  Batal
                </button>
                <button type="submit" :disabled="submitting" class="btn-submit">
                  {{ submitting ? 'Mengirim...' : 'Kirim Pendaftaran' }}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>

      <!-- EDIT FORM -->
      <div v-if="showEditForm" class="modal-overlay">
        <div class="modal">
          <div class="modal-header">
            <h3>Edit Pendaftaran</h3>
            <button @click="showEditForm = false" class="btn-close">×</button>
          </div>
          <div class="modal-body">
            <p>Fitur edit akan segera tersedia...</p>
            <button @click="showEditForm = false" class="btn-cancel">Tutup</button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { supabase } from '@/utils/supabase'

const router = useRouter()
const authStore = useAuthStore()

// State - semua harus pake ref()
const loading = ref(true)
const activeSession = ref(null)
const userRegistration = ref(null)
const showRegistrationForm = ref(false)
const showEditForm = ref(false)
const submitting = ref(false)

// Form data
const formData = ref({
  jabatan: '',
  visi_misi: '',
})

// Computed properties
const user = computed(() => {
  return authStore.user || null
})

const masaKerjaTahun = computed(() => {
  return user.value ? hitungMasaKerja(user.value.nip) : 0
})

// Load data saat component mounted
onMounted(async () => {
  // Cek apakah user ada
  if (!user.value) {
    console.log('User not authenticated, redirecting to login...')
    router.push('/login-calon')
    return
  }

  await loadData()
})

const loadData = async () => {
  if (!user.value) {
    loading.value = false
    return
  }

  loading.value = true
  try {
    // Get active session
    const { data: sessions } = await supabase
      .from('sesi_pemilihan')
      .select('*')
      .eq('status', 'pendaftaran')
      .order('dibuat_pada', { ascending: false })
      .limit(1)

    if (sessions && sessions.length > 0) {
      activeSession.value = sessions[0]

      // Check user registration
      const { data: registration } = await supabase
        .from('pendaftaran_kandidat')
        .select('*')
        .eq('pengguna_id', user.value.id)
        .eq('sesi_id', activeSession.value.id)
        .single()

      if (registration) {
        userRegistration.value = registration
      }
    }
  } catch (error) {
    console.error('Error loading data:', error)
  } finally {
    loading.value = false
  }
}

// AUTO-APPROVE FUNCTIONS
const hitungMasaKerja = (nip) => {
  if (!nip) return 0

  try {
    // Clean NIP (remove spaces)
    const cleanNIP = nip.replace(/\s/g, '')

    if (cleanNIP.length < 12) return 0

    // Ambil tahun pengangkatan (karakter 9-12)
    const tahunPengangkatan = parseInt(cleanNIP.substring(8, 12))
    const tahunSekarang = new Date().getFullYear()

    return tahunSekarang - tahunPengangkatan
  } catch {
    return 0
  }
}

const isAutoApprove = (nip) => {
  return hitungMasaKerja(nip) >= 3
}

// Helper functions
const formatJabatan = (jabatan) => {
  const map = {
    humas: 'Waka Humas',
    sarpras: 'Waka Sarana Prasarana',
    kesiswaan: 'Waka Kesiswaan',
    kurikulum: 'Waka Kurikulum',
  }
  return map[jabatan] || jabatan
}

const formatDate = (dateString) => {
  if (!dateString) return '-'
  return new Date(dateString).toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

// Main registration function
const submitRegistration = async () => {
  if (!user.value) {
    alert('User tidak terautentikasi. Silahkan login ulang.')
    router.push('/login-calon')
    return
  }

  if (!formData.value.jabatan || !formData.value.visi_misi) {
    alert('Harap isi semua field yang wajib')
    return
  }

  if (formData.value.visi_misi.length < 100) {
    alert('Visi & misi minimal 100 karakter')
    return
  }

  if (!activeSession.value) {
    alert('Tidak ada sesi pemilihan aktif')
    return
  }

  submitting.value = true

  try {
    // Check auto-approve
    const autoApprove = isAutoApprove(user.value.nip)
    const status = autoApprove ? 'disetujui' : 'menunggu'

    console.log(`Status: ${status}, Masa kerja: ${hitungMasaKerja(user.value.nip)} tahun`)

    // Insert registration
    const { data, error } = await supabase
      .from('pendaftaran_kandidat')
      .insert({
        pengguna_id: user.value.id,
        sesi_id: activeSession.value.id,
        jabatan_diajukan: formData.value.jabatan,
        visi_misi: formData.value.visi_misi,
        status: status,
        dibuat_pada: new Date().toISOString(),
        diperbarui_pada: new Date().toISOString(),
      })
      .select()
      .single()

    if (error) throw error

    // If auto-approve, create candidate automatically
    if (autoApprove) {
      try {
        // Generate nomor urut
        const { data: lastCandidate } = await supabase
          .from('kandidat')
          .select('nomor_urut')
          .eq('jabatan', formData.value.jabatan)
          .eq('sesi_id', activeSession.value.id)
          .order('nomor_urut', { ascending: false })
          .limit(1)

        const nomorUrut = lastCandidate?.length > 0 ? lastCandidate[0].nomor_urut + 1 : 1

        // Create candidate
        await supabase.from('kandidat').insert({
          pendaftaran_id: data.id,
          pengguna_id: user.value.id,
          sesi_id: activeSession.value.id,
          jabatan: formData.value.jabatan,
          nomor_urut: nomorUrut,
          visi_misi: formData.value.visi_misi,
          total_suara: 0,
          dibuat_pada: new Date().toISOString(),
        })
      } catch (candidateError) {
        console.error('Error creating candidate:', candidateError)
        // Continue anyway
      }
    }

    // Update UI
    userRegistration.value = data
    showRegistrationForm.value = false

    // Reset form
    formData.value = {
      jabatan: '',
      visi_misi: '',
    }

    // Show success message
    if (autoApprove) {
      alert(
        '✅ Pendaftaran berhasil! Status: DISETUJUI OTOMATIS\n\nAnda sudah menjadi kandidat resmi.',
      )
    } else {
      alert(
        '📝 Pendaftaran berhasil dikirim! Status: MENUNGGU VERIFIKASI\n\nPanitia akan meninjau pendaftaran Anda.',
      )
    }

    // Refresh data
    await loadData()
  } catch (error) {
    console.error('Error submitting registration:', error)
    alert('Gagal mengirim pendaftaran: ' + error.message)
  } finally {
    submitting.value = false
  }
}
</script>

<style scoped>
.dashboard-calon {
  max-width: 800px;
  margin: 0 auto;
  padding: 20px;
}

.header {
  margin-bottom: 30px;
  text-align: center;
}

.header h1 {
  color: #1e3a8a;
  margin-bottom: 10px;
}

.user-info {
  background: #f8f9fa;
  padding: 15px;
  border-radius: 8px;
  display: inline-block;
  text-align: left;
}

.card {
  background: white;
  border-radius: 10px;
  padding: 20px;
  margin-bottom: 20px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
}

.card h3 {
  color: #333;
  margin-bottom: 15px;
  border-bottom: 2px solid #f0f0f0;
  padding-bottom: 10px;
}

.status-pendaftaran {
  color: #3b82f6;
  font-weight: bold;
}
.status-voting {
  color: #10b981;
  font-weight: bold;
}
.status-selesai {
  color: #ef4444;
  font-weight: bold;
}

.not-open {
  text-align: center;
  padding: 30px;
  color: #666;
}

.already-registered {
  padding: 20px 0;
}

.status-badge {
  display: inline-block;
  padding: 5px 15px;
  border-radius: 20px;
  font-weight: bold;
  margin-bottom: 15px;
}

.status-badge.menunggu {
  background: #fef3c7;
  color: #92400e;
}

.status-badge.disetujui {
  background: #d1fae5;
  color: #065f46;
}

.status-badge.ditolak {
  background: #fee2e2;
  color: #991b1b;
}

.registration-details h4 {
  color: #555;
  margin-bottom: 10px;
}

.registration-details p {
  margin: 5px 0;
  color: #666;
}

.not-registered {
  text-align: center;
  padding: 30px;
}

.approve-info {
  margin: 20px 0;
}

.auto-approve {
  color: #065f46;
  background: #d1fae5;
  padding: 10px;
  border-radius: 5px;
  display: inline-block;
}

.manual-approve {
  color: #92400e;
  background: #fef3c7;
  padding: 10px;
  border-radius: 5px;
  display: inline-block;
}

.btn-register,
.btn-edit {
  background: #1e3a8a;
  color: white;
  border: none;
  padding: 12px 24px;
  border-radius: 5px;
  font-weight: bold;
  cursor: pointer;
  margin-top: 10px;
}

.btn-register:hover,
.btn-edit:hover {
  background: #1e40af;
}

/* Modal */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal {
  background: white;
  border-radius: 10px;
  width: 90%;
  max-width: 500px;
  max-height: 90vh;
  overflow-y: auto;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px;
  border-bottom: 1px solid #eee;
}

.modal-header h3 {
  margin: 0;
  color: #1e3a8a;
}

.btn-close {
  background: none;
  border: none;
  font-size: 24px;
  cursor: pointer;
  color: #666;
}

.modal-body {
  padding: 20px;
}

.approve-notice {
  margin-bottom: 20px;
  padding: 15px;
  border-radius: 8px;
}

.auto-approve-notice {
  background: #d1fae5;
  color: #065f46;
  border: 1px solid #a7f3d0;
}

.manual-approve-notice {
  background: #fef3c7;
  color: #92400e;
  border: 1px solid #fde68a;
}

.form-group {
  margin-bottom: 20px;
}

.form-group label {
  display: block;
  margin-bottom: 8px;
  font-weight: bold;
  color: #333;
}

.form-group select,
.form-group textarea {
  width: 100%;
  padding: 10px;
  border: 1px solid #ddd;
  border-radius: 5px;
  font-size: 16px;
}

.form-group textarea {
  min-height: 150px;
  resize: vertical;
}

.char-count {
  text-align: right;
  color: #666;
  font-size: 14px;
  margin-top: 5px;
}

.form-actions {
  display: flex;
  gap: 10px;
  justify-content: flex-end;
  margin-top: 30px;
}

.btn-cancel {
  background: #6b7280;
  color: white;
  border: none;
  padding: 12px 24px;
  border-radius: 5px;
  cursor: pointer;
}

.btn-submit {
  background: #1e3a8a;
  color: white;
  border: none;
  padding: 12px 24px;
  border-radius: 5px;
  font-weight: bold;
  cursor: pointer;
}

.btn-submit:disabled {
  background: #9ca3af;
  cursor: not-allowed;
}

.loading {
  text-align: center;
  padding: 50px;
  color: #666;
  font-size: 18px;
}
</style>
