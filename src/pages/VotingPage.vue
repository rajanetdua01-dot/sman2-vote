<template>
  <div class="voting-container">
    <!-- Header -->
    <div class="voting-header">
      <h1 class="title">Voting Pemilihan Waka</h1>
      <p class="subtitle">SMAN 2 Bandar Lampung</p>

      <div class="session-info" v-if="activeSession">
        <span class="session-name">{{ activeSession.nama_sesi }}</span>
        <span class="session-status voting">VOTING BERLANGSUNG</span>
      </div>

      <div class="voter-info" v-if="voterData">
        <div class="voter-avatar">
          {{ getInitials(voterData.pengguna.nama_lengkap) }}
        </div>
        <div class="voter-details">
          <strong>{{ voterData.pengguna.nama_lengkap }}</strong>
          <span class="voter-token">Token: {{ voterData.token }}</span>
        </div>
      </div>
    </div>

    <!-- Voting Steps - DIUBAH: 2 step saja -->
    <div class="voting-steps">
      <div class="step" :class="{ active: currentStep === 1 }">
        <div class="step-number">1</div>
        <div class="step-label">Waka Kesiswaan</div>
      </div>
      <div class="step" :class="{ active: currentStep === 2 }">
        <div class="step-number">2</div>
        <div class="step-label">Waka Sarpras</div>
      </div>
    </div>

    <!-- Main Content - DIUBAH: 2 step saja -->
    <div class="voting-content">
      <!-- Step 1: Waka Kesiswaan -->
      <div v-if="currentStep === 1" class="step-content">
        <h2 class="step-title">Pilih Waka Kesiswaan</h2>
        <p class="step-description">
          Pilih satu calon untuk jabatan Wakil Kepala Sekolah Bidang Kesiswaan
        </p>

        <div class="candidates-grid">
          <div
            v-for="candidate in kesiswaanCandidates"
            :key="candidate.id"
            class="candidate-card"
            :class="{ selected: selectedKesiswaan?.id === candidate.id }"
            @click="selectKesiswaan(candidate)"
          >
            <div class="candidate-photo">
              <img
                v-if="candidate.foto_kampanye"
                :src="candidate.foto_kampanye"
                :alt="candidate.pengguna.nama_lengkap"
              />
              <div v-else class="photo-placeholder">
                {{ getInitials(candidate.pengguna.nama_lengkap) }}
              </div>
            </div>
            <div class="candidate-info">
              <h3 class="candidate-name">{{ candidate.pengguna.nama_lengkap }}</h3>
              <div class="candidate-number">
                <span class="number-badge">#{{ candidate.nomor_urut }}</span>
              </div>
              <div class="candidate-visi">
                <p><strong>Visi:</strong> {{ truncateText(candidate.visi_misi, 100) }}</p>
              </div>
            </div>
          </div>
        </div>

        <div v-if="kesiswaanCandidates.length === 0" class="empty-candidates">
          <p>Belum ada calon untuk jabatan ini</p>
        </div>
      </div>

      <!-- Step 2: Waka Sarpras -->
      <div v-if="currentStep === 2" class="step-content">
        <h2 class="step-title">Pilih Waka Sarpras</h2>
        <p class="step-description">
          Pilih satu calon untuk jabatan Wakil Kepala Sekolah Bidang Sarana Prasarana
        </p>

        <div class="candidates-grid">
          <div
            v-for="candidate in sarprasCandidates"
            :key="candidate.id"
            class="candidate-card"
            :class="{ selected: selectedSarpras?.id === candidate.id }"
            @click="selectSarpras(candidate)"
          >
            <div class="candidate-photo">
              <img
                v-if="candidate.foto_kampanye"
                :src="candidate.foto_kampanye"
                :alt="candidate.pengguna.nama_lengkap"
              />
              <div v-else class="photo-placeholder">
                {{ getInitials(candidate.pengguna.nama_lengkap) }}
              </div>
            </div>
            <div class="candidate-info">
              <h3 class="candidate-name">{{ candidate.pengguna.nama_lengkap }}</h3>
              <div class="candidate-number">
                <span class="number-badge">#{{ candidate.nomor_urut }}</span>
              </div>
              <div class="candidate-visi">
                <p><strong>Visi:</strong> {{ truncateText(candidate.visi_misi, 100) }}</p>
              </div>
            </div>
          </div>
        </div>

        <div v-if="sarprasCandidates.length === 0" class="empty-candidates">
          <p>Belum ada calon untuk jabatan ini</p>
        </div>
      </div>
    </div>

    <!-- Navigation Buttons - DIUBAH: max step = 2 -->
    <div class="navigation-buttons">
      <button
        v-if="currentStep > 1"
        @click="prevStep"
        class="nav-btn prev-btn"
        :disabled="submitting"
      >
        ← Kembali
      </button>

      <button
        v-if="currentStep < 2"
        @click="nextStep"
        class="nav-btn next-btn"
        :disabled="!isCurrentStepValid || submitting"
      >
        Lanjut →
      </button>

      <button
        v-if="currentStep === 2"
        @click="submitVote"
        class="nav-btn submit-btn"
        :disabled="!isAllStepsValid || submitting"
      >
        {{ submitting ? 'Mengirim...' : 'Submit Voting' }}
      </button>
    </div>

    <!-- Selection Summary - DIUBAH: 2 item saja -->
    <div class="selection-summary">
      <h3>Ringkasan Pilihan Anda:</h3>
      <div class="summary-grid">
        <div class="summary-item" :class="{ filled: selectedKesiswaan }">
          <span class="summary-label">Waka Kesiswaan</span>
          <span class="summary-value">
            {{ selectedKesiswaan ? selectedKesiswaan.pengguna.nama_lengkap : 'Belum dipilih' }}
          </span>
        </div>
        <div class="summary-item" :class="{ filled: selectedSarpras }">
          <span class="summary-label">Waka Sarpras</span>
          <span class="summary-value">
            {{ selectedSarpras ? selectedSarpras.pengguna.nama_lengkap : 'Belum dipilih' }}
          </span>
        </div>
      </div>
    </div>

    <!-- Error & Success Messages -->
    <div v-if="error" class="error-message">❌ {{ error }}</div>

    <div v-if="success" class="success-message">
      <div class="success-content">
        <h3>✅ Voting Berhasil!</h3>
        <p>Terima kasih telah menggunakan hak pilih Anda.</p>
        <p>Redirecting ke halaman utama...</p>
      </div>
    </div>

    <!-- Confirmation Modal - DIUBAH: Hanya 2 item -->
    <div v-if="showConfirmModal" class="modal-overlay">
      <div class="modal">
        <div class="modal-header">
          <h3>Konfirmasi Voting</h3>
          <button @click="showConfirmModal = false" class="modal-close">×</button>
        </div>
        <div class="modal-body">
          <p>Anda akan mengirim pilihan Anda:</p>
          <ul class="modal-selections">
            <li v-if="selectedKesiswaan">
              <strong>Waka Kesiswaan:</strong> {{ selectedKesiswaan.pengguna.nama_lengkap }}
            </li>
            <li v-if="selectedSarpras">
              <strong>Waka Sarpras:</strong> {{ selectedSarpras.pengguna.nama_lengkap }}
            </li>
          </ul>
          <p class="modal-warning">
            ⚠️ <strong>PERHATIAN:</strong> Voting tidak dapat diubah setelah disubmit!
          </p>
        </div>
        <div class="modal-footer">
          <button @click="showConfirmModal = false" class="modal-btn cancel-btn">Batal</button>
          <button @click="confirmSubmit" class="modal-btn confirm-btn">Ya, Submit Voting</button>
        </div>
      </div>
    </div>

    <!-- Debug Info (Hanya untuk development) -->
    <div v-if="isDevelopment" class="debug-info">
      <h4>Debug Info:</h4>
      <p>Voter Session: {{ voterSessionExists ? 'Found' : 'Not Found' }}</p>
      <p>Current Step: {{ currentStep }}</p>
      <p>Session Age: {{ sessionAge }} ms</p>
      <button @click="clearSessionAndRedirect" class="debug-btn">Clear Session & Redirect</button>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { supabase } from '@/utils/supabase'

const router = useRouter()

// State
const currentStep = ref(1) // DIUBAH: Max 2 step
const voterData = ref(null)
const activeSession = ref(null)
const submitting = ref(false)
const error = ref('')
const success = ref(false)
const showConfirmModal = ref(false)
const isDevelopment = import.meta.env.DEV || window.location.hostname === 'localhost'

// Candidates data - DIUBAH: Hanya 2 array
const kesiswaanCandidates = ref([])
const sarprasCandidates = ref([])

// Selections - DIUBAH: Hanya 2 selection
const selectedKesiswaan = ref(null)
const selectedSarpras = ref(null)

// Computed - DIUBAH: Hanya 2 step validasi
const isCurrentStepValid = computed(() => {
  switch (currentStep.value) {
    case 1:
      return selectedKesiswaan.value !== null
    case 2:
      return selectedSarpras.value !== null
    default:
      return false
  }
})

const isAllStepsValid = computed(() => {
  return selectedKesiswaan.value !== null && selectedSarpras.value !== null
})

const voterSessionExists = computed(() => {
  return !!localStorage.getItem('smanda_voter')
})

const sessionAge = computed(() => {
  if (!voterData.value?.timestamp) return 0
  return new Date() - new Date(voterData.value.timestamp)
})

// Methods
const getInitials = (name) => {
  if (!name) return '??'
  return name
    .split(' ')
    .map((word) => word[0])
    .join('')
    .toUpperCase()
    .substring(0, 2)
}

const truncateText = (text, maxLength) => {
  if (!text) return ''
  if (text.length <= maxLength) return text
  return text.substring(0, maxLength) + '...'
}

// Selection handlers - DIUBAH: Hanya 2 fungsi
const selectKesiswaan = (candidate) => {
  selectedKesiswaan.value = candidate
}

const selectSarpras = (candidate) => {
  selectedSarpras.value = candidate
}

// Navigation - DIUBAH: Max step = 2
const nextStep = () => {
  if (currentStep.value < 2 && isCurrentStepValid.value) {
    currentStep.value++
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }
}

const prevStep = () => {
  if (currentStep.value > 1) {
    currentStep.value--
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }
}

// Load data
const loadVoterData = () => {
  console.log('🔍 Loading voter data from localStorage...')
  const voterSession = localStorage.getItem('smanda_voter')

  if (!voterSession) {
    console.error('❌ No voter session found in localStorage')
    error.value = 'Session tidak ditemukan. Silakan scan token kembali.'

    // Redirect setelah delay
    setTimeout(() => {
      router.push('/scan')
    }, 2000)
    return
  }

  try {
    console.log('📦 Parsing voter session:', voterSession)
    voterData.value = JSON.parse(voterSession)
    console.log('✅ Voter data loaded:', voterData.value)

    // Validasi struktur data
    if (!voterData.value.token || !voterData.value.pengguna || !voterData.value.sesi_id) {
      throw new Error('Data session tidak valid')
    }

    // Optional: Validasi session expiry (30 menit)
    const maxAge = 30 * 60 * 1000 // 30 menit
    if (sessionAge.value > maxAge) {
      console.warn('⚠️ Voter session expired, clearing...')
      localStorage.removeItem('smanda_voter')
      error.value = 'Session telah kadaluarsa. Silakan scan token kembali.'

      setTimeout(() => {
        router.push('/scan')
      }, 2000)
      return
    }
  } catch (err) {
    console.error('❌ Error parsing voter session:', err)
    localStorage.removeItem('smanda_voter')
    error.value = 'Error memuat data session. Silakan scan token kembali.'

    setTimeout(() => {
      router.push('/scan')
    }, 2000)
  }
}

const loadActiveSession = async () => {
  try {
    console.log('🔍 Loading active session...')
    const { data, error: sessionError } = await supabase
      .from('sesi_pemilihan')
      .select('*')
      .order('dibuat_pada', { ascending: false })
      .limit(1)

    if (sessionError) {
      console.error('❌ Error loading session:', sessionError)
      throw sessionError
    }

    activeSession.value = data?.[0] || null
    console.log('✅ Active session loaded:', activeSession.value)

    // Check if session is voting
    if (!activeSession.value) {
      error.value = 'Tidak ada sesi pemilihan aktif'
      return
    }

    if (activeSession.value.status !== 'voting') {
      error.value = `Sesi voting tidak aktif. Status saat ini: ${activeSession.value.status.toUpperCase()}`
      console.warn('⚠️ Session not in voting status:', activeSession.value.status)
    }
  } catch (err) {
    console.error('❌ Error loading session:', err)
    error.value = 'Gagal memuat data sesi. Silakan coba lagi nanti.'
  }
}

const loadCandidates = async () => {
  try {
    if (!activeSession.value?.id) {
      console.warn('⚠️ No active session ID, skipping candidates load')
      return
    }

    console.log('🔍 Loading candidates for session:', activeSession.value.id)

    // Load all candidates for current session - DIUBAH: Filter hanya 2 jabatan
    const { data: candidates, error: candidatesError } = await supabase
      .from('kandidat')
      .select(
        `
        *,
        pengguna:pengguna_id (
          id,
          nama_lengkap
        )
      `,
      )
      .eq('sesi_id', activeSession.value.id)
      .in('jabatan', ['kesiswaan', 'sarpras']) // DIUBAH: Hanya ambil 2 jabatan
      .order('jabatan', { ascending: true })
      .order('nomor_urut', { ascending: true })

    if (candidatesError) {
      console.error('❌ Error loading candidates:', candidatesError)
      throw candidatesError
    }

    console.log('✅ Candidates loaded:', candidates?.length || 0)

    // Filter by position - DIUBAH: Hanya 2 filter
    kesiswaanCandidates.value = candidates?.filter((c) => c.jabatan === 'kesiswaan') || []
    sarprasCandidates.value = candidates?.filter((c) => c.jabatan === 'sarpras') || []

    console.log('🎯 Kesiswaan candidates:', kesiswaanCandidates.value.length)
    console.log('🎯 Sarpras candidates:', sarprasCandidates.value.length)
  } catch (err) {
    console.error('❌ Error loading candidates:', err)
    error.value = 'Gagal memuat data calon'
  }
}

// Voting submission
const submitVote = () => {
  if (!isAllStepsValid.value) {
    error.value = 'Harap pilih semua calon terlebih dahulu'
    return
  }
  showConfirmModal.value = true
}

const confirmSubmit = async () => {
  showConfirmModal.value = false
  submitting.value = true
  error.value = ''
  success.value = false

  try {
    console.log('🚀 Submitting vote...')

    // Validate session and voter
    if (!activeSession.value) {
      throw new Error('Data sesi tidak valid')
    }

    if (!voterData.value) {
      throw new Error('Data pemilih tidak valid')
    }

    if (activeSession.value.status !== 'voting') {
      throw new Error(`Sesi voting tidak aktif. Status: ${activeSession.value.status}`)
    }

    console.log('📝 Preparing votes data...')
    // Prepare votes data - DIUBAH: Hanya 2 vote
    const votes = []

    if (selectedKesiswaan.value) {
      votes.push({
        sesi_id: activeSession.value.id,
        pemilih_id: voterData.value.pengguna.id,
        kandidat_id: selectedKesiswaan.value.id,
        jabatan: 'kesiswaan',
        is_draft: false,
        is_valid: true,
        disubmit_pada: new Date().toISOString(),
        info_perangkat: navigator.userAgent,
      })
    }

    if (selectedSarpras.value) {
      votes.push({
        sesi_id: activeSession.value.id,
        pemilih_id: voterData.value.pengguna.id,
        kandidat_id: selectedSarpras.value.id,
        jabatan: 'sarpras',
        is_draft: false,
        is_valid: true,
        disubmit_pada: new Date().toISOString(),
        info_perangkat: navigator.userAgent,
      })
    }

    console.log('💾 Inserting votes:', votes)
    // Insert votes
    const { error: insertError } = await supabase.from('suara').insert(votes)

    if (insertError) {
      console.error('❌ Error inserting votes:', insertError)
      throw insertError
    }

    console.log('✅ Votes submitted successfully')
    // Success
    success.value = true

    // Clear voter session
    localStorage.removeItem('smanda_voter')
    console.log('🗑️ Cleared voter session from localStorage')

    // Redirect after delay
    setTimeout(() => {
      console.log('🔄 Redirecting to home page...')
      router.push('/')
    }, 3000)
  } catch (err) {
    console.error('❌ Error submitting vote:', err)
    error.value = err.message || 'Gagal mengirim voting'

    // Clear error after 5 seconds
    setTimeout(() => {
      if (error.value === err.message) {
        error.value = ''
      }
    }, 5000)
  } finally {
    submitting.value = false
  }
}

// Debug utility
const clearSessionAndRedirect = () => {
  console.log('🧹 Clearing session and redirecting...')
  localStorage.removeItem('smanda_voter')
  router.push('/scan')
}

// Prevent accidental page leave
const beforeUnloadHandler = (event) => {
  if (!success.value && !submitting.value) {
    event.preventDefault()
    event.returnValue = 'Voting Anda belum disimpan. Yakin ingin keluar?'
  }
}

// Lifecycle
onMounted(async () => {
  console.log('🚀 VotingPage mounted')

  // Load voter data first
  loadVoterData()

  // Only load session and candidates if voter data is valid
  if (voterData.value) {
    await loadActiveSession()
    await loadCandidates()
  }

  // Add beforeunload listener
  window.addEventListener('beforeunload', beforeUnloadHandler)
})

onUnmounted(() => {
  console.log('♻️ VotingPage unmounted')
  window.removeEventListener('beforeunload', beforeUnloadHandler)
})
</script>

<style scoped>
.voting-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 1rem;
  min-height: 100vh;
  background: #f8f9fa;
}

/* Header */
.voting-header {
  background: white;
  border-radius: 16px;
  padding: 1.5rem;
  margin-bottom: 1.5rem;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
  text-align: center;
}

.title {
  color: #1e3a8a;
  margin-bottom: 0.25rem;
  font-size: 1.8rem;
}

.subtitle {
  color: #6b7280;
  margin-bottom: 1rem;
}

.session-info {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 1rem;
  margin-bottom: 1.5rem;
  flex-wrap: wrap;
}

.session-name {
  font-weight: 600;
  color: #1e40af;
  background: #e0f2fe;
  padding: 0.5rem 1rem;
  border-radius: 8px;
}

.session-status.voting {
  background: linear-gradient(135deg, #059669, #10b981);
  color: white;
  padding: 0.5rem 1rem;
  border-radius: 20px;
  font-weight: 700;
  font-size: 0.9rem;
}

.voter-info {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 1rem;
  padding: 1rem;
  background: #f0f7ff;
  border-radius: 12px;
  border: 1px solid #dbeafe;
}

.voter-avatar {
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

.voter-details {
  display: flex;
  flex-direction: column;
  text-align: left;
}

.voter-token {
  font-size: 0.85rem;
  color: #6b7280;
  font-family: monospace;
  margin-top: 0.25rem;
}

/* Voting Steps - DIUBAH: Grid 2 kolom */
.voting-steps {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 1rem;
  margin-bottom: 2rem;
}

.step {
  text-align: center;
  padding: 1.5rem;
  background: white;
  border-radius: 12px;
  border: 2px solid #e5e7eb;
  transition: all 0.3s;
}

.step.active {
  border-color: #1e3a8a;
  background: #f0f7ff;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(30, 58, 138, 0.15);
}

.step-number {
  width: 40px;
  height: 40px;
  background: #e5e7eb;
  color: #6b7280;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
  margin: 0 auto 0.75rem;
  font-size: 1.1rem;
}

.step.active .step-number {
  background: #1e3a8a;
  color: white;
}

.step-label {
  font-weight: 600;
  color: #4b5563;
  font-size: 1rem;
}

.step.active .step-label {
  color: #1e3a8a;
}

/* Step Content */
.step-content {
  background: white;
  border-radius: 16px;
  padding: 2rem;
  margin-bottom: 1.5rem;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
}

.step-title {
  color: #1e3a8a;
  margin-bottom: 0.5rem;
  text-align: center;
  font-size: 1.5rem;
}

.step-description {
  color: #6b7280;
  text-align: center;
  margin-bottom: 2rem;
  font-size: 1rem;
}

/* Candidates Grid */
.candidates-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 1.5rem;
  margin-top: 1.5rem;
}

.candidate-card {
  border: 2px solid #e5e7eb;
  border-radius: 12px;
  padding: 1.5rem;
  cursor: pointer;
  transition: all 0.3s;
  background: white;
}

.candidate-card:hover {
  border-color: #93c5fd;
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.1);
}

.candidate-card.selected {
  border-color: #1e3a8a;
  background: #f0f7ff;
  box-shadow: 0 0 0 3px rgba(30, 58, 138, 0.1);
}

.candidate-photo {
  width: 120px;
  height: 120px;
  margin: 0 auto 1.5rem;
  border-radius: 50%;
  overflow: hidden;
  border: 4px solid #e5e7eb;
}

.candidate-photo img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.photo-placeholder {
  width: 100%;
  height: 100%;
  background: linear-gradient(135deg, #1e3a8a, #3b82f6);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 2.5rem;
  font-weight: bold;
}

.candidate-info {
  text-align: center;
}

.candidate-name {
  color: #1e293b;
  margin-bottom: 0.5rem;
  font-size: 1.2rem;
}

.candidate-number {
  margin-bottom: 1rem;
}

.number-badge {
  display: inline-block;
  padding: 0.4rem 1rem;
  background: #1e3a8a;
  color: white;
  border-radius: 20px;
  font-size: 1rem;
  font-weight: 700;
}

.candidate-visi {
  color: #4b5563;
  font-size: 0.95rem;
  line-height: 1.5;
  min-height: 60px;
}

.empty-candidates {
  text-align: center;
  padding: 3rem;
  color: #9ca3af;
  background: #f9fafb;
  border-radius: 8px;
  border: 2px dashed #d1d5db;
}

/* Navigation Buttons */
.navigation-buttons {
  display: flex;
  justify-content: space-between;
  gap: 1rem;
  margin-bottom: 2rem;
}

.nav-btn {
  padding: 1rem 2rem;
  border: none;
  border-radius: 10px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s;
  min-width: 150px;
}

.prev-btn {
  background: #6b7280;
  color: white;
}

.prev-btn:hover:not(:disabled) {
  background: #4b5563;
}

.next-btn {
  background: #1e3a8a;
  color: white;
  margin-left: auto;
}

.next-btn:hover:not(:disabled) {
  background: #1e40af;
}

.submit-btn {
  background: linear-gradient(135deg, #059669, #10b981);
  color: white;
  margin-left: auto;
}

.submit-btn:hover:not(:disabled) {
  background: linear-gradient(135deg, #047857, #0d9c6d);
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(5, 150, 105, 0.3);
}

.nav-btn:disabled {
  background: #94a3b8;
  cursor: not-allowed;
  transform: none;
  box-shadow: none;
}

/* Selection Summary - DIUBAH: Grid 2 kolom */
.selection-summary {
  background: white;
  border-radius: 16px;
  padding: 1.5rem;
  margin-bottom: 1.5rem;
  border: 1px solid #e2e8f0;
}

.selection-summary h3 {
  color: #1e3a8a;
  margin-bottom: 1.5rem;
  text-align: center;
  font-size: 1.3rem;
}

.summary-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 1.5rem;
}

.summary-item {
  padding: 1.25rem;
  border-radius: 10px;
  border: 2px solid #e5e7eb;
  transition: all 0.3s;
}

.summary-item.filled {
  border-color: #10b981;
  background: #f0fdf4;
}

.summary-label {
  display: block;
  font-weight: 600;
  color: #4b5563;
  margin-bottom: 0.75rem;
  font-size: 1rem;
}

.summary-item.filled .summary-label {
  color: #065f46;
}

.summary-value {
  color: #9ca3af;
  font-size: 0.95rem;
  min-height: 24px;
}

.summary-item.filled .summary-value {
  color: #065f46;
  font-weight: 600;
}

/* Messages */
.error-message,
.success-message {
  margin: 1.5rem 0;
  padding: 1.5rem;
  border-radius: 12px;
  animation: slideDown 0.3s ease;
}

@keyframes slideDown {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.error-message {
  background: linear-gradient(135deg, #fee, #fecaca);
  color: #dc2626;
  border: 2px solid #fca5a5;
  text-align: center;
}

.success-message {
  background: linear-gradient(135deg, #d1fae5, #a7f3d0);
  color: #065f46;
  border: 2px solid #6ee7b7;
  text-align: center;
}

.success-content h3 {
  margin-bottom: 0.5rem;
  font-size: 1.3rem;
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
  padding: 1rem;
}

.modal {
  background: white;
  border-radius: 16px;
  width: 100%;
  max-width: 500px;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
  animation: modalSlideIn 0.3s ease;
}

@keyframes modalSlideIn {
  from {
    opacity: 0;
    transform: translateY(-20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem;
  border-bottom: 1px solid #e5e7eb;
}

.modal-header h3 {
  margin: 0;
  color: #1e3a8a;
  font-size: 1.3rem;
}

.modal-close {
  background: none;
  border: none;
  font-size: 1.5rem;
  line-height: 1;
  cursor: pointer;
  color: #6b7280;
  padding: 0.25rem;
  border-radius: 4px;
}

.modal-close:hover {
  background: #f3f4f6;
  color: #374151;
}

.modal-body {
  padding: 1.5rem;
}

.modal-selections {
  margin: 1rem 0;
  padding-left: 1.5rem;
  color: #4b5563;
}

.modal-selections li {
  margin-bottom: 0.75rem;
  font-size: 1rem;
}

.modal-warning {
  background: #fff3cd;
  border: 1px solid #ffc107;
  border-radius: 8px;
  padding: 1rem;
  margin-top: 1rem;
  color: #856404;
  font-size: 0.95rem;
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
  padding: 1.5rem;
  border-top: 1px solid #e5e7eb;
}

.modal-btn {
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.2s;
  font-size: 0.95rem;
}

.cancel-btn {
  background: #6b7280;
  color: white;
}

.cancel-btn:hover {
  background: #4b5563;
}

.confirm-btn {
  background: #1e3a8a;
  color: white;
}

.confirm-btn:hover {
  background: #1e40af;
}

/* Debug Info (Hanya untuk development) */
.debug-info {
  background: #f1f5f9;
  border: 2px dashed #64748b;
  border-radius: 12px;
  padding: 1rem;
  margin-top: 2rem;
  font-family: monospace;
  font-size: 0.85rem;
}

.debug-info h4 {
  color: #475569;
  margin-bottom: 0.5rem;
}

.debug-info p {
  color: #64748b;
  margin: 0.25rem 0;
}

.debug-btn {
  margin-top: 0.5rem;
  padding: 0.5rem 1rem;
  background: #ef4444;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.8rem;
}

.debug-btn:hover {
  background: #dc2626;
}

/* Responsive */
@media (max-width: 768px) {
  .voting-steps {
    grid-template-columns: 1fr;
    gap: 0.75rem;
  }

  .candidates-grid {
    grid-template-columns: 1fr;
  }

  .summary-grid {
    grid-template-columns: 1fr;
    gap: 1rem;
  }

  .navigation-buttons {
    flex-direction: column;
  }

  .nav-btn {
    width: 100%;
  }

  .step {
    padding: 1.25rem;
  }
}

@media (max-width: 480px) {
  .voting-container {
    padding: 0.75rem;
  }

  .step-content {
    padding: 1.25rem;
  }

  .candidate-card {
    padding: 1.25rem;
  }

  .candidate-photo {
    width: 100px;
    height: 100px;
  }

  .modal-body {
    padding: 1.25rem;
  }

  .modal-footer {
    flex-direction: column;
  }

  .modal-btn {
    width: 100%;
  }
}
</style>
