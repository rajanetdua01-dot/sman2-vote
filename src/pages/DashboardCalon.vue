<template>
  <div class="dashboard-calon">
    <!-- HEADER -->
    <div class="header">
      <h1>Pendaftaran Calon Kandidat</h1>
      <div class="user-info" v-if="user">
        <p>
          Selamat datang, <strong>{{ user.nama_lengkap }}</strong>
        </p>
        <p>NIP: {{ user.nip }}</p>
        <p>Masa Kerja: {{ masaKerjaTahun }} tahun</p>
      </div>
    </div>

    <!-- LOADING STATE -->
    <div v-if="loading" class="loading">Memuat data...</div>

    <!-- MAIN CONTENT -->
    <div v-else class="content">
      <!-- SESSION INFO -->
      <div class="session-info card">
        <h3>Sesi Pemilihan Saat Ini</h3>
        <div v-if="activeSession">
          <p>
            <strong>{{ activeSession.nama_sesi }}</strong>
          </p>
          <p>Tahun Ajaran: {{ activeSession.tahun_ajaran }}</p>
          <p>
            Status:
            <span :class="'status-' + activeSession.status">
              {{ formatStatus(activeSession.status) }}
            </span>
          </p>
          <!-- INFO BATASAN -->
          <div class="limit-info" v-if="activeSession.status === 'pendaftaran'">
            <p><strong>📋 Ketentuan:</strong></p>
            <p>• Setiap guru boleh mendaftarkan <strong>1 calon per jabatan</strong></p>
            <p>• Calon harus memiliki masa kerja <strong>minimal 3 tahun</strong></p>
            <p>• Anda sudah mendaftarkan:</p>
            <ul>
              <li v-if="myRegistrations.sarpras">
                ✅ Waka Sarpras: {{ myRegistrations.sarpras.nama_lengkap }}
              </li>
              <li v-else>❌ Waka Sarpras: Belum ada</li>
              <li v-if="myRegistrations.kesiswaan">
                ✅ Waka Kesiswaan: {{ myRegistrations.kesiswaan.nama_lengkap }}
              </li>
              <li v-else>❌ Waka Kesiswaan: Belum ada</li>
            </ul>
          </div>
        </div>
        <div v-else>
          <p>Tidak ada sesi pemilihan aktif</p>
        </div>
      </div>

      <!-- CURRENT CANDIDATES -->
      <div
        class="current-candidates card"
        v-if="
          activeSession &&
          (activeSession.status === 'pendaftaran' || activeSession.status === 'voting')
        "
      >
        <h3>Kandidat yang Sudah Terdaftar</h3>
        <div class="candidates-grid">
          <div v-for="candidate in currentCandidates" :key="candidate.id" class="candidate-item">
            <div class="candidate-avatar">{{ getInitials(candidate.nama_lengkap) }}</div>
            <div class="candidate-details">
              <p class="candidate-name">{{ candidate.nama_lengkap }}</p>
              <p class="candidate-position">{{ formatJabatan(candidate.jabatan) }}</p>
              <p class="candidate-number">#{{ candidate.nomor_urut }}</p>
              <p v-if="candidate.didaftarkan_oleh" class="registered-by">
                Didaftarkan oleh: {{ candidate.didaftarkan_oleh }}
              </p>
            </div>
          </div>
        </div>
        <div v-if="currentCandidates.length === 0" class="no-candidates">
          <p>Belum ada kandidat yang terdaftar</p>
        </div>
      </div>

      <!-- REGISTRATION FORM -->
      <div class="registration-form card" v-if="canRegister">
        <h3>Daftarkan Calon Kandidat</h3>

        <!-- INFO BATASAN ANDA -->
        <div class="my-limit-info">
          <p v-if="remainingQuota === 0" class="limit-full">
            ⚠️ Anda sudah mendaftarkan calon untuk <strong>kedua jabatan</strong>. Tidak bisa
            mendaftarkan lagi.
          </p>
          <p v-else class="limit-remaining">
            Anda masih bisa mendaftarkan calon untuk:
            <span v-if="!myRegistrations.sarpras" class="available-position">✅ Waka Sarpras</span>
            <span v-if="!myRegistrations.kesiswaan" class="available-position"
              >✅ Waka Kesiswaan</span
            >
          </p>
        </div>

        <!-- REGISTRATION FORM -->
        <div class="form-container" v-if="remainingQuota > 0">
          <form @submit.prevent="submitRegistration">
            <!-- SELECT CANDIDATE -->
            <div class="form-group">
              <label>Pilih Guru yang Akan Didaftarkan</label>
              <select v-model="form.pengguna_id" required class="form-select">
                <option value="">Pilih Guru</option>
                <option
                  v-for="guru in eligibleGuruList"
                  :key="guru.id"
                  :value="guru.id"
                  :disabled="isAlreadyCandidate(guru.id)"
                >
                  {{ guru.nama_lengkap }} (NIP: {{ guru.nip }}) - Masa Kerja:
                  {{ hitungMasaKerja(guru.nip) }} tahun
                </option>
              </select>
              <p v-if="selectedGuru" class="guru-info">
                <strong>Informasi Calon:</strong><br />
                Nama: {{ selectedGuru.nama_lengkap }}<br />
                NIP: {{ selectedGuru.nip }}<br />
                Masa Kerja: {{ hitungMasaKerja(selectedGuru.nip) }} tahun<br />
                <span v-if="hitungMasaKerja(selectedGuru.nip) >= 3" class="eligible-text">
                  <span style="color: #10b981">✅</span> Memenuhi syarat (≥ 3 tahun)
                </span>
                <span v-else class="not-eligible-text">
                  <span style="color: #ef4444">❌</span> Tidak memenuhi syarat (&lt; 3 tahun)
                </span>
              </p>
            </div>

            <!-- POSITION SELECTION (HANYA JABATAN YANG BELUM DIDAFTARKAN) -->
            <div class="form-group">
              <label>Pilih Jabatan</label>
              <select v-model="form.jabatan" required class="form-select">
                <option value="">Pilih Jabatan</option>
                <option v-if="!myRegistrations.sarpras" value="sarpras">
                  Waka Sarana Prasarana (Sarpras)
                </option>
                <option v-if="!myRegistrations.kesiswaan" value="kesiswaan">Waka Kesiswaan</option>
              </select>
              <p class="position-help">
                <span v-if="myRegistrations.sarpras" class="position-taken">
                  ❌ Anda sudah mendaftarkan calon untuk Waka Sarpras </span
                ><br />
                <span v-if="myRegistrations.kesiswaan" class="position-taken">
                  ❌ Anda sudah mendaftarkan calon untuk Waka Kesiswaan
                </span>
              </p>
            </div>

            <!-- PENDAFTAR INFO -->
            <div class="registrant-info">
              <p><strong>Anda sebagai pendaftar:</strong> {{ user.nama_lengkap }}</p>
              <p><strong>Masa kerja Anda:</strong> {{ masaKerjaTahun }} tahun</p>
              <p class="note-text">
                <em>Catatan: Anda mendaftarkan calon, bukan diri sendiri.</em>
              </p>
            </div>

            <!-- SUBMIT BUTTON -->
            <div class="form-actions">
              <button type="submit" :disabled="!canSubmit || submitting" class="btn-submit">
                {{ submitting ? 'Mendaftarkan...' : 'Daftarkan Calon' }}
              </button>
            </div>
          </form>
        </div>

        <!-- REGISTRATION STATUS -->
        <div v-if="registrationResult" class="registration-result" :class="registrationResult.type">
          <h4>{{ registrationResult.title }}</h4>
          <p>{{ registrationResult.message }}</p>
        </div>
      </div>

      <!-- CANNOT REGISTER -->
      <div v-else class="cannot-register card">
        <h3>Tidak Dapat Mendaftar</h3>
        <div v-if="!activeSession">
          <p><span style="color: #ef4444">❌</span> Tidak ada sesi pemilihan aktif saat ini</p>
        </div>
        <div v-else-if="activeSession.status !== 'pendaftaran'">
          <p>
            <span style="color: #ef4444">❌</span> Pendaftaran hanya bisa dilakukan saat sesi
            PENDAFTARAN berlangsung
          </p>
          <p v-if="activeSession.status === 'voting'">
            <em>Sesi saat ini: VOTING (tidak bisa tambah kandidat lagi)</em>
          </p>
        </div>
        <div v-else-if="remainingQuota === 0">
          <p>
            <span style="color: #ef4444">❌</span> Anda sudah mendaftarkan calon untuk kedua jabatan
          </p>
          <p><strong>Waka Sarpras:</strong> {{ myRegistrations.sarpras?.nama_lengkap || '-' }}</p>
          <p>
            <strong>Waka Kesiswaan:</strong> {{ myRegistrations.kesiswaan?.nama_lengkap || '-' }}
          </p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue' // HAPUS watch
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { supabase } from '@/utils/supabase'

const router = useRouter()
const authStore = useAuthStore()

// State
const loading = ref(true)
const activeSession = ref(null)
const myRegistrations = ref({ sarpras: null, kesiswaan: null })
const guruList = ref([])
const currentCandidates = ref([])
const submitting = ref(false)
const registrationResult = ref(null)

// Form data (TIDAK ADA VISI MISI LAGI)
const form = ref({
  pengguna_id: '',
  jabatan: '',
})

// Computed
const user = computed(() => authStore.user || null)

const masaKerjaTahun = computed(() => {
  return user.value ? hitungMasaKerja(user.value.nip) : 0
})

// BISA daftar jika: ada sesi + status pendaftaran + masih ada kuota
const canRegister = computed(() => {
  if (!user.value) return false
  if (!activeSession.value) return false
  if (activeSession.value.status !== 'pendaftaran') return false
  return true
})

// Kuota tersisa
const remainingQuota = computed(() => {
  let count = 2 // maksimal 2 jabatan
  if (myRegistrations.value.sarpras) count--
  if (myRegistrations.value.kesiswaan) count--
  return count
})

// List guru yang eligible (≥3 tahun dan belum jadi kandidat)
const eligibleGuruList = computed(() => {
  return guruList.value.filter((guru) => {
    const masaKerja = hitungMasaKerja(guru.nip)
    return masaKerja >= 3 && !isAlreadyCandidate(guru.id)
  })
})

const selectedGuru = computed(() => {
  if (!form.value.pengguna_id) return null
  return guruList.value.find((g) => g.id === form.value.pengguna_id)
})

const canSubmit = computed(() => {
  if (!form.value.jabatan || !form.value.pengguna_id) return false

  const guru = selectedGuru.value
  if (!guru) return false

  // Validasi: calon harus ≥3 tahun
  return hitungMasaKerja(guru.nip) >= 3
})

// Lifecycle
onMounted(async () => {
  if (!user.value) {
    router.push('/login-calon')
    return
  }
  await loadData()
})

// Functions
const loadData = async () => {
  loading.value = true
  try {
    // Get current session
    const { data: sessions } = await supabase
      .from('sesi_pemilihan')
      .select('*')
      .in('status', ['pendaftaran', 'voting'])
      .order('dibuat_pada', { ascending: false })
      .limit(1)

    if (sessions && sessions.length > 0) {
      activeSession.value = sessions[0]

      // Load current candidates
      await loadCandidates()

      // Load registrations saya
      await loadMyRegistrations()
    }

    // Load all active teachers
    const { data: guru } = await supabase
      .from('pengguna')
      .select('*')
      .eq('peran', 'guru')
      .eq('is_active', true)
      .order('nama_lengkap')

    guruList.value = guru || []
  } catch (error) {
    console.error('Error loading data:', error)
  } finally {
    loading.value = false
  }
}

const loadMyRegistrations = async () => {
  try {
    // Ambil semua pendaftaran yang saya buat
    // KOLOM didaftarkan_oleh harus ada di database
    const { data: registrations } = await supabase
      .from('pendaftaran_kandidat')
      .select(
        `
        *,
        calon:pengguna_id (id, nama_lengkap)
      `,
      )
      .eq('sesi_id', activeSession.value.id)
      .eq('didaftarkan_oleh', user.value.id)

    if (registrations) {
      // Reset
      myRegistrations.value = { sarpras: null, kesiswaan: null }

      // Pisahkan per jabatan
      registrations.forEach((reg) => {
        if (reg.jabatan_diajukan === 'sarpras') {
          myRegistrations.value.sarpras = {
            id: reg.calon.id,
            nama_lengkap: reg.calon.nama_lengkap,
            pendaftaran_id: reg.id,
          }
        } else if (reg.jabatan_diajukan === 'kesiswaan') {
          myRegistrations.value.kesiswaan = {
            id: reg.calon.id,
            nama_lengkap: reg.calon.nama_lengkap,
            pendaftaran_id: reg.id,
          }
        }
      })
    }
  } catch (error) {
    console.error('Error loading my registrations:', error)
  }
}

const loadCandidates = async () => {
  try {
    // Query dengan join untuk dapatkan nama pendaftar
    const { data: candidates } = await supabase
      .from('kandidat')
      .select(
        `
        *,
        pengguna:pengguna_id (id, nama_lengkap, nip),
        pendaftaran:pendaftaran_id (
          didaftarkan_oleh,
          pendaftar:pengguna!pendaftaran_kandidat_didaftarkan_oleh_fkey (nama_lengkap)
        )
      `,
      )
      .eq('sesi_id', activeSession.value.id)
      .order('jabatan')
      .order('nomor_urut')

    currentCandidates.value = (candidates || []).map((c) => ({
      id: c.pengguna?.id || c.id,
      nama_lengkap: c.pengguna?.nama_lengkap || 'Unknown',
      jabatan: c.jabatan,
      nomor_urut: c.nomor_urut,
      didaftarkan_oleh: c.pendaftaran?.pendaftar?.nama_lengkap || 'Admin',
    }))
  } catch (error) {
    console.error('Error loading candidates:', error)
  }
}

const hitungMasaKerja = (nip) => {
  if (!nip) return 0
  try {
    const cleanNIP = nip.replace(/\s/g, '')
    if (cleanNIP.length < 12) return 0
    const tahunPengangkatan = parseInt(cleanNIP.substring(8, 12))
    const tahunSekarang = new Date().getFullYear()
    return tahunSekarang - tahunPengangkatan
  } catch {
    return 0
  }
}

const isAlreadyCandidate = (penggunaId) => {
  return currentCandidates.value.some((c) => c.id === penggunaId)
}

const getInitials = (name) => {
  if (!name) return '??'
  return name
    .split(' ')
    .map((word) => word[0])
    .join('')
    .toUpperCase()
    .substring(0, 2)
}

const formatJabatan = (jabatan) => {
  const map = {
    sarpras: 'Waka Sarana Prasarana',
    kesiswaan: 'Waka Kesiswaan',
  }
  return map[jabatan] || jabatan
}

const formatStatus = (status) => {
  const map = {
    draft: 'Draft',
    pendaftaran: 'Pendaftaran',
    voting: 'Voting Berlangsung',
    selesai: 'Selesai',
  }
  return map[status] || status
}

const submitRegistration = async () => {
  if (!canSubmit.value) return

  submitting.value = true
  registrationResult.value = null

  try {
    // Validasi: calon harus ≥3 tahun
    const candidateGuru = guruList.value.find((g) => g.id === form.value.pengguna_id)
    const candidateMasaKerja = hitungMasaKerja(candidateGuru.nip)
    if (candidateMasaKerja < 3) {
      throw new Error('Calon tidak memenuhi syarat masa kerja (minimal 3 tahun)')
    }

    // Validasi: jabatan belum didaftarkan
    if (form.value.jabatan === 'sarpras' && myRegistrations.value.sarpras) {
      throw new Error('Anda sudah mendaftarkan calon untuk Waka Sarpras')
    }
    if (form.value.jabatan === 'kesiswaan' && myRegistrations.value.kesiswaan) {
      throw new Error('Anda sudah mendaftarkan calon untuk Waka Kesiswaan')
    }

    // Get last candidate number for this position
    const { data: lastCandidate } = await supabase
      .from('kandidat')
      .select('nomor_urut')
      .eq('jabatan', form.value.jabatan)
      .eq('sesi_id', activeSession.value.id)
      .order('nomor_urut', { ascending: false })
      .limit(1)

    const nomorUrut = lastCandidate?.length > 0 ? lastCandidate[0].nomor_urut + 1 : 1

    // 1. Buat pendaftaran_kandidat (TANPA VISI MISI)
    const { data: pendaftaran, error: pendaftaranError } = await supabase
      .from('pendaftaran_kandidat')
      .insert({
        pengguna_id: form.value.pengguna_id,
        sesi_id: activeSession.value.id,
        jabatan_diajukan: form.value.jabatan,
        visi_misi: '-', // Kosong atau placeholder
        status: 'disetujui',
        didaftarkan_oleh: user.value.id, // Track siapa yang daftarkan
        dibuat_pada: new Date().toISOString(),
        diperbarui_pada: new Date().toISOString(),
      })
      .select('id')
      .single()

    if (pendaftaranError) throw pendaftaranError

    // 2. Buat kandidat (TANPA VISI MISI)
    const { error: kandidatError } = await supabase.from('kandidat').insert({
      pendaftaran_id: pendaftaran.id,
      pengguna_id: form.value.pengguna_id,
      sesi_id: activeSession.value.id,
      jabatan: form.value.jabatan,
      nomor_urut: nomorUrut,
      visi_misi: '-',
      total_suara: 0,
      dibuat_pada: new Date().toISOString(),
    })

    if (kandidatError) throw kandidatError

    // Success
    registrationResult.value = {
      success: true,
      type: 'success',
      title: '✅ Pendaftaran Berhasil!',
      message: `Anda berhasil mendaftarkan ${candidateGuru.nama_lengkap} sebagai calon ${formatJabatan(form.value.jabatan)} (No. ${nomorUrut})`,
    }

    // Reset form
    form.value = { pengguna_id: '', jabatan: '' }

    // Reload data
    await loadData()
  } catch (error) {
    console.error('Registration error:', error)
    registrationResult.value = {
      success: false,
      type: 'error',
      title: '❌ Gagal Mendaftarkan',
      message: error.message || 'Terjadi kesalahan saat mendaftarkan',
    }
  } finally {
    submitting.value = false
  }
}
</script>

<style scoped>
.limit-info {
  margin-top: 15px;
  padding: 12px;
  background: #f0f7ff;
  border-radius: 8px;
  border-left: 4px solid #3b82f6;
}

.limit-info ul {
  margin: 8px 0 0 20px;
}

.limit-info li {
  margin: 4px 0;
}

.my-limit-info {
  margin-bottom: 20px;
  padding: 12px;
  border-radius: 8px;
}

.limit-full {
  background: #fee2e2;
  border: 1px solid #fca5a5;
  color: #991b1b;
  padding: 10px;
}

.limit-remaining {
  background: #d1fae5;
  border: 1px solid #a7f3d0;
  color: #065f46;
  padding: 10px;
}

.available-position {
  display: inline-block;
  margin: 0 8px;
  padding: 4px 8px;
  background: white;
  border-radius: 6px;
  font-weight: bold;
}

.position-help {
  margin-top: 8px;
  font-size: 0.9rem;
}

.position-taken {
  color: #ef4444;
  font-weight: 600;
}

.registrant-info {
  margin: 20px 0;
  padding: 15px;
  background: #f8fafc;
  border-radius: 8px;
  border: 1px solid #e2e8f0;
}

.note-text {
  color: #6b7280;
  font-size: 0.9rem;
  margin-top: 10px;
}

.registered-by {
  font-size: 0.8rem;
  color: #6b7280;
  margin-top: 4px;
}

.dashboard-calon {
  max-width: 900px;
  margin: 0 auto;
  padding: 20px;
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
  color: #000000; /* Tambah ini untuk default text color hitam */
}

/* HEADER */
.header {
  background: linear-gradient(135deg, #1e3a8a, #3b82f6);
  color: white; /* Tetap putih untuk header */
  padding: 25px;
  border-radius: 15px;
  margin-bottom: 25px;
  box-shadow: 0 5px 15px rgba(30, 58, 138, 0.2);
}

.header h1 {
  margin: 0 0 15px 0;
  font-size: 1.8rem;
  text-align: center;
}

.user-info {
  background: rgba(255, 255, 255, 0.15);
  padding: 15px;
  border-radius: 10px;
  text-align: center;
  backdrop-filter: blur(10px);
}

.user-info p {
  margin: 8px 0;
}

.warning-text {
  color: #fbbf24;
  font-weight: 600;
  background: rgba(251, 191, 36, 0.1);
  padding: 8px;
  border-radius: 6px;
  margin-top: 10px !important;
}

.success-text {
  color: #10b981;
  font-weight: 600;
  background: rgba(16, 185, 129, 0.1);
  padding: 8px;
  border-radius: 6px;
  margin-top: 10px !important;
}

/* CARDS */
.card {
  background: white;
  border-radius: 12px;
  padding: 25px;
  margin-bottom: 20px;
  box-shadow: 0 3px 10px rgba(0, 0, 0, 0.08);
  border: 1px solid #eef2ff;
}

.card h3 {
  color: #000000; /* UBAH JADI HITAM */
  margin-bottom: 18px;
  padding-bottom: 10px;
  border-bottom: 2px solid #eef2ff;
  font-size: 1.3rem;
  font-weight: 700;
}

/* SESSION INFO - TEKS HITAM SEMUA */
.session-info p {
  color: #000000 !important;
  margin: 8px 0;
}

.session-info strong {
  color: #000000;
  font-weight: 700;
}

.session-info .status-pendaftaran {
  background: #fef3c7;
  color: #000000; /* UBAH JADI HITAM */
  padding: 5px 12px;
  border-radius: 20px;
  font-weight: 700;
  margin-left: 8px;
  border: 1px solid #fbbf24;
}

/* CURRENT CANDIDATES */
.candidates-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 15px;
  margin-top: 15px;
}

.candidate-item {
  display: flex;
  align-items: center;
  gap: 15px;
  padding: 15px;
  background: #f8fafc;
  border-radius: 10px;
  border: 1px solid #e2e8f0;
  transition: transform 0.2s;
}

.candidate-item:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

.candidate-avatar {
  width: 50px;
  height: 50px;
  background: linear-gradient(135deg, #1e3a8a, #3b82f6);
  color: white;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
  font-size: 1.2rem;
}

.candidate-name {
  font-weight: 600;
  color: #000000; /* UBAH JADI HITAM */
  margin-bottom: 4px;
}

.candidate-position {
  font-size: 0.9rem;
  color: #000000; /* UBAH JADI HITAM */
  background: #e2e8f0;
  padding: 3px 8px;
  border-radius: 12px;
  display: inline-block;
  margin-bottom: 3px;
  font-weight: 600;
}

.candidate-number {
  font-size: 0.85rem;
  color: #1e3a8a;
  font-weight: bold;
}

.no-candidates p {
  color: #000000; /* UBAH JADI HITAM */
  font-weight: 600;
}

/* REGISTER TYPE SELECTION */
.register-type {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 15px;
  margin-bottom: 25px;
}

.type-option {
  display: flex;
  align-items: center;
  gap: 15px;
  padding: 20px;
  background: #f8fafc;
  border: 2px solid #e2e8f0;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.3s;
}

.type-option:hover {
  border-color: #93c5fd;
  background: #f0f7ff;
}

.type-option.selected {
  border-color: #1e3a8a;
  background: #e0f2fe;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(30, 58, 138, 0.15);
}

.type-icon {
  font-size: 2rem;
}

.type-content h4 {
  margin: 0 0 5px 0;
  color: #000000; /* UBAH JADI HITAM */
}

.type-content p {
  margin: 0;
  color: #000000; /* UBAH JADI HITAM */
  font-size: 0.9rem;
  opacity: 0.8;
}

/* FORM */
.form-container {
  margin-top: 25px;
}

.form-group {
  margin-bottom: 20px;
}

.form-group label {
  display: block;
  margin-bottom: 8px;
  font-weight: 600;
  color: #000000; /* UBAH JADI HITAM */
}

.form-select,
.form-textarea {
  width: 100%;
  padding: 12px;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  font-size: 1rem;
  font-family: inherit;
  transition: border 0.3s;
  color: #000000; /* UBAH JADI HITAM */
}

.form-select:focus,
.form-textarea:focus {
  outline: none;
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.form-textarea {
  min-height: 120px;
  resize: vertical;
  line-height: 1.5;
}

/* GURU INFO */
.guru-info {
  margin-top: 10px;
  padding: 12px;
  background: #f8fafc;
  border-radius: 8px;
  border-left: 4px solid #3b82f6;
  font-size: 0.9rem;
  line-height: 1.6;
  color: #000000; /* UBAH JADI HITAM */
}

.guru-info strong {
  color: #000000;
}

.eligible-text {
  color: #10b981;
  font-weight: 600;
  margin-top: 5px;
  display: inline-block;
}

.not-eligible-text {
  color: #ef4444;
  font-weight: 600;
  margin-top: 5px;
  display: inline-block;
}

/* CHARACTER COUNT */
.char-count {
  text-align: right;
  color: #000000; /* UBAH JADI HITAM */
  font-size: 0.9rem;
  margin-top: 5px;
  font-weight: 600;
}

.char-warning {
  color: #f59e0b;
}

/* FORM ACTIONS */
.form-actions {
  margin-top: 30px;
  text-align: center;
}

.btn-submit {
  background: linear-gradient(135deg, #1e3a8a, #3b82f6);
  color: white;
  border: none;
  padding: 14px 40px;
  border-radius: 10px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s;
  min-width: 200px;
}

.btn-submit:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 5px 15px rgba(30, 58, 138, 0.3);
}

.btn-submit:disabled {
  background: #94a3b8;
  cursor: not-allowed;
  transform: none;
  box-shadow: none;
}

/* REGISTRATION RESULT */
.registration-result {
  margin-top: 25px;
  padding: 20px;
  border-radius: 10px;
  text-align: center;
}

.registration-result.success {
  background: #d1fae5;
  border: 1px solid #a7f3d0;
}

.registration-result.error {
  background: #fee2e2;
  border: 1px solid #fca5a5;
}

.registration-result h4 {
  margin: 0 0 10px 0;
  font-size: 1.2rem;
  color: #000000; /* UBAH JADI HITAM */
}

.registration-result p {
  margin: 0 0 15px 0;
  color: #000000; /* UBAH JADI HITAM */
  font-weight: 600;
}

/* CANNOT REGISTER */
.cannot-register h3 {
  color: #000000; /* UBAH JADI HITAM */
}

.cannot-register p {
  margin: 10px 0;
  color: #000000 !important; /* UBAH JADI HITAM */
  font-weight: 600;
}

.cannot-register em {
  color: #000000; /* UBAH JADI HITAM */
  opacity: 0.8;
}

/* LOADING */
.loading {
  text-align: center;
  padding: 50px;
  color: #000000; /* UBAH JADI HITAM */
  font-size: 1.1rem;
  background: #f9fafb;
  border-radius: 10px;
  margin: 20px 0;
  font-weight: 600;
}

/* RESPONSIVE */
@media (max-width: 768px) {
  .dashboard-calon {
    padding: 15px;
  }

  .header,
  .card {
    padding: 20px;
  }

  .register-type {
    grid-template-columns: 1fr;
  }

  .candidates-grid {
    grid-template-columns: 1fr;
  }

  .btn-submit {
    width: 100%;
  }
}
</style>
