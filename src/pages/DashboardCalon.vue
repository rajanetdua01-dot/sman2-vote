<template>
  <div class="dashboard-calon">
    <div class="header">
      <h1>Dashboard Calon Kandidat</h1>
      <div class="user-info">
        <p>
          Selamat datang, <strong>{{ user.nama_lengkap }}</strong>
        </p>
        <p>NIP: {{ user.nip }}</p>
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
            <span
              :class="{
                'status-draft': activeSession.status === 'draft',
                'status-pendaftaran': activeSession.status === 'pendaftaran',
                'status-voting': activeSession.status === 'voting',
                'status-selesai': activeSession.status === 'selesai',
              }"
            >
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

      <!-- STATUS PENDAFTARAN USER -->
      <div class="registration-status card">
        <h3>Status Pendaftaran Anda</h3>

        <div v-if="!activeSession || activeSession.status !== 'pendaftaran'" class="not-open">
          <p>⚠️ Pendaftaran calon belum dibuka atau sudah ditutup</p>
        </div>

        <div v-else-if="userRegistration">
          <!-- SUDAH DAFTAR -->
          <div class="already-registered">
            <div
              class="status-badge"
              :class="{
                pending: userRegistration.status === 'menunggu',
                approved: userRegistration.status === 'disetujui',
                rejected: userRegistration.status === 'ditolak',
              }"
            >
              {{ userRegistration.status.toUpperCase() }}
            </div>

            <div class="registration-details">
              <h4>Data Pendaftaran Anda:</h4>
              <p>
                <strong>Jabatan:</strong> {{ formatJabatan(userRegistration.jabatan_diajukan) }}
              </p>
              <p><strong>Waktu Daftar:</strong> {{ formatDate(userRegistration.dibuat_pada) }}</p>

              <div v-if="userRegistration.status === 'menunggu'">
                <p>⏳ Menunggu verifikasi panitia</p>
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
            <button @click="showRegistrationForm = true" class="btn-register">
              Daftar Sekarang
            </button>
          </div>
        </div>
      </div>

      <!-- FORM PENDAFTARAN (Modal) -->
      <div v-if="showRegistrationForm" class="modal-overlay">
        <div class="modal">
          <div class="modal-header">
            <h3>Form Pendaftaran Calon Kandidat</h3>
            <button @click="showRegistrationForm = false" class="btn-close">×</button>
          </div>

          <div class="modal-body">
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
              </div>

              <div class="form-group">
                <label>Foto Kampanye (Opsional)</label>
                <input type="file" @change="handleFileUpload" accept="image/*" />
                <small>Format: JPG/PNG, maks 2MB</small>
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

      <!-- EDIT FORM (Modal) -->
      <div v-if="showEditForm" class="modal-overlay">
        <!-- Similar to registration form but for editing -->
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
import { ref, onMounted } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { supabase } from '@/utils/supabase'

const authStore = useAuthStore()
const user = authStore.user

// State
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
  foto: null,
})

// Load data saat component mounted
onMounted(async () => {
  await loadData()
})

const loadData = async () => {
  loading.value = true
  try {
    // 1. Get active session (pendaftaran)
    const { data: sessions } = await supabase
      .from('sesi_pemilihan')
      .select('*')
      .eq('status', 'pendaftaran')
      .order('dibuat_pada', { ascending: false })
      .limit(1)

    if (sessions && sessions.length > 0) {
      activeSession.value = sessions[0]

      // 2. Check user registration for this session
      const { data: registration } = await supabase
        .from('pendaftaran_kandidat')
        .select('*')
        .eq('pengguna_id', user.id)
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
  return new Date(dateString).toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

const handleFileUpload = (event) => {
  const file = event.target.files[0]
  if (file) {
    // Validate file size (2MB max)
    if (file.size > 2 * 1024 * 1024) {
      alert('File terlalu besar. Maksimal 2MB')
      event.target.value = ''
      return
    }
    formData.value.foto = file
  }
}

const submitRegistration = async () => {
  if (!formData.value.jabatan || !formData.value.visi_misi) {
    alert('Harap isi semua field yang wajib')
    return
  }

  if (formData.value.visi_misi.length < 100) {
    alert('Visi & misi minimal 100 karakter')
    return
  }

  submitting.value = true

  try {
    let fotoUrl = null

    // Upload foto jika ada
    if (formData.value.foto) {
      // TODO: Implement file upload to Supabase Storage
      console.log('Upload foto:', formData.value.foto.name)
      // For now, we'll skip actual upload
    }

    // Insert registration to database
    const { data, error } = await supabase
      .from('pendaftaran_kandidat')
      .insert({
        pengguna_id: user.id,
        sesi_id: activeSession.value.id,
        jabatan_diajukan: formData.value.jabatan,
        visi_misi: formData.value.visi_misi,
        foto_kampanye: fotoUrl,
        status: 'menunggu',
      })
      .select()
      .single()

    if (error) throw error

    // Update local state
    userRegistration.value = data
    showRegistrationForm.value = false
    alert('Pendaftaran berhasil dikirim! Menunggu verifikasi panitia.')
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
  max-width: 1000px;
  margin: 0 auto;
  padding: 2rem 1rem;
}

.header {
  margin-bottom: 2rem;
  padding-bottom: 1rem;
  border-bottom: 2px solid #e2e8f0;
}

.header h1 {
  color: #1e3a8a;
  margin-bottom: 1rem;
}

.user-info {
  background: #f8f9fa;
  padding: 1rem;
  border-radius: 8px;
  display: inline-block;
}

.card {
  background: white;
  border-radius: 12px;
  padding: 1.5rem;
  margin-bottom: 1.5rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.card h3 {
  color: #333;
  margin-bottom: 1rem;
  padding-bottom: 0.5rem;
  border-bottom: 1px solid #e2e8f0;
}

.status-draft {
  color: #6b7280;
}
.status-pendaftaran {
  color: #3b82f6;
}
.status-voting {
  color: #10b981;
}
.status-selesai {
  color: #ef4444;
}

.status-badge {
  display: inline-block;
  padding: 0.25rem 0.75rem;
  border-radius: 20px;
  font-weight: bold;
  font-size: 0.85rem;
  margin-bottom: 1rem;
}

.status-badge.pending {
  background: #fef3c7;
  color: #92400e;
}

.status-badge.approved {
  background: #d1fae5;
  color: #065f46;
}

.status-badge.rejected {
  background: #fee2e2;
  color: #991b1b;
}

.registration-details {
  margin-top: 1rem;
}

.registration-details h4 {
  margin-bottom: 0.5rem;
  color: #4b5563;
}

.not-registered,
.not-open {
  text-align: center;
  padding: 2rem;
}

.btn-register,
.btn-edit {
  background: #1e3a8a;
  color: white;
  border: none;
  padding: 0.75rem 1.5rem;
  border-radius: 6px;
  font-weight: 600;
  cursor: pointer;
  margin-top: 1rem;
}

.btn-register:hover,
.btn-edit:hover {
  background: #1e40af;
}

/* Modal Styles */
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
  border-radius: 12px;
  width: 90%;
  max-width: 500px;
  max-height: 90vh;
  overflow-y: auto;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem;
  border-bottom: 1px solid #e2e8f0;
}

.modal-header h3 {
  margin: 0;
  color: #1e3a8a;
}

.btn-close {
  background: none;
  border: none;
  font-size: 1.5rem;
  cursor: pointer;
  color: #6b7280;
}

.modal-body {
  padding: 1.5rem;
}

.form-group {
  margin-bottom: 1.5rem;
}

.form-group label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 600;
  color: #374151;
}

.form-group select,
.form-group textarea {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 1rem;
}

.form-group textarea {
  resize: vertical;
}

.form-group small {
  display: block;
  margin-top: 0.25rem;
  color: #6b7280;
  font-size: 0.85rem;
}

.form-actions {
  display: flex;
  gap: 1rem;
  justify-content: flex-end;
  margin-top: 2rem;
}

.btn-cancel {
  background: #6b7280;
  color: white;
  border: none;
  padding: 0.75rem 1.5rem;
  border-radius: 6px;
  cursor: pointer;
}

.btn-submit {
  background: #1e3a8a;
  color: white;
  border: none;
  padding: 0.75rem 1.5rem;
  border-radius: 6px;
  font-weight: 600;
  cursor: pointer;
}

.btn-submit:disabled {
  background: #9ca3af;
  cursor: not-allowed;
}

.loading {
  text-align: center;
  padding: 3rem;
  color: #6b7280;
}
</style>
