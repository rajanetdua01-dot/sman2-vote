<template>
  <div class="voting-page">
    <!-- Step 1: Scan QR -->
    <div v-if="step === 'scan'" class="scan-step">
      <div class="step-header">
        <h1>🎫 Scan QR Code</h1>
        <p>Scan QR Code dari kartu voting Anda</p>
      </div>

      <div class="scanner-container">
        <div v-if="!hasCamera" class="camera-permission">
          <p>⚠️ Membutuhkan akses kamera</p>
          <button @click="initCamera" class="btn-enable-camera">Izinkan Kamera</button>
        </div>

        <div v-else class="scanner-active">
          <div ref="scannerElement" class="scanner-box"></div>
          <p class="scanner-hint">Arahkan QR Code ke dalam frame</p>
        </div>

        <div class="manual-token">
          <p>Atau masukkan token manual:</p>
          <input
            type="text"
            v-model="manualToken"
            placeholder="Masukkan token dari kartu"
            @keyup.enter="useManualToken"
          />
          <button @click="useManualToken" :disabled="!manualToken.trim()">Gunakan Token</button>
        </div>
      </div>
    </div>

    <!-- Step 2: Pilih Kandidat -->
    <div v-if="step === 'vote'" class="vote-step">
      <div class="vote-header">
        <h1>🗳️ PEMILIHAN WAKA SMANDA</h1>
        <div class="voter-info">
          <p>
            Pemilih: <strong>{{ voter.nama_lengkap }}</strong>
          </p>
          <p class="timer" v-if="timeLeft > 0">⏰ Waktu tersisa: {{ formatTime(timeLeft) }}</p>
          <p v-else class="timer-expired">⏰ Waktu habis!</p>
        </div>
      </div>

      <!-- 4 Jabatan dalam tabs -->
      <div class="position-tabs">
        <button
          v-for="pos in positions"
          :key="pos.value"
          :class="{ active: activePosition === pos.value }"
          @click="activePosition = pos.value"
          class="position-tab"
        >
          {{ pos.label }}
        </button>
      </div>

      <!-- Daftar Kandidat per Jabatan -->
      <div class="candidates-container">
        <h3>{{ getPositionLabel(activePosition) }}</h3>
        <p class="position-subtitle">Pilih 1 kandidat untuk posisi ini</p>

        <div v-if="loadingCandidates" class="loading-candidates">
          <p>Memuat kandidat...</p>
        </div>

        <div v-else class="candidates-grid">
          <div
            v-for="candidate in candidatesByPosition"
            :key="candidate.id"
            :class="{ selected: selectedCandidates[activePosition] === candidate.id }"
            class="candidate-card"
            @click="selectCandidate(activePosition, candidate.id)"
          >
            <div class="candidate-photo">
              <div v-if="candidate.foto_kampanye" class="photo-real">
                <img :src="candidate.foto_kampanye" :alt="candidate.pengguna.nama_lengkap" />
              </div>
              <div v-else class="photo-placeholder">
                {{ getInitials(candidate.pengguna.nama_lengkap) }}
              </div>
            </div>
            <div class="candidate-info">
              <div class="candidate-number">{{ candidate.nomor_urut }}</div>
              <h4>{{ candidate.pengguna.nama_lengkap }}</h4>
              <p class="candidate-nip">{{ candidate.pengguna.nip }}</p>
              <div class="candidate-visi">
                <p><strong>Visi & Misi:</strong></p>
                <p class="visi-preview">{{ truncateText(candidate.visi_misi, 100) }}</p>
              </div>
            </div>
            <div v-if="selectedCandidates[activePosition] === candidate.id" class="selected-badge">
              ✅ TERPILIH
            </div>
          </div>

          <div v-if="candidatesByPosition.length === 0" class="no-candidates">
            <p>Belum ada kandidat untuk posisi ini</p>
          </div>
        </div>
      </div>

      <!-- Navigation -->
      <div class="vote-navigation">
        <div class="progress-indicator">
          <div class="progress-text">
            Langkah {{ Object.keys(selectedCandidates).length }} dari 4
          </div>
          <div class="progress-bar">
            <div
              class="progress-fill"
              :style="{ width: (Object.keys(selectedCandidates).length / 4) * 100 + '%' }"
            ></div>
          </div>
        </div>

        <div class="nav-buttons">
          <button @click="previousPosition" :disabled="positionIndex === 0" class="btn-prev">
            ← Sebelumnya
          </button>

          <button
            v-if="positionIndex < 3"
            @click="nextPosition"
            :disabled="!selectedCandidates[activePosition]"
            class="btn-next"
          >
            Selanjutnya →
          </button>

          <button v-else @click="showReview" :disabled="!isAllSelected" class="btn-submit">
            👁️ Review Pilihan
          </button>
        </div>
      </div>
    </div>

    <!-- Step 3: Review & Submit -->
    <div v-if="step === 'review'" class="review-step">
      <div class="review-header">
        <h1>📋 REVIEW PILIHAN ANDA</h1>
        <p>Pastikan pilihan Anda sudah benar sebelum submit</p>
      </div>

      <div class="review-choices">
        <div v-for="pos in positions" :key="pos.value" class="review-choice">
          <h4>{{ pos.label }}</h4>
          <div v-if="getSelectedCandidateName(pos.value)" class="choice-detail">
            <p>
              <strong>{{ getSelectedCandidateName(pos.value) }}</strong>
            </p>
            <p>No. {{ getSelectedCandidateNumber(pos.value) }}</p>
            <button @click="goToPosition(pos.value)" class="btn-change">Ubah Pilihan</button>
          </div>
          <div v-else class="choice-empty">
            <p>Belum dipilih</p>
            <button @click="goToPosition(pos.value)" class="btn-change">Pilih Sekarang</button>
          </div>
        </div>
      </div>

      <div class="review-warning">
        <p>⚠️ <strong>PERHATIAN:</strong> Setelah submit, pilihan tidak dapat diubah!</p>
      </div>

      <div class="review-actions">
        <button @click="step = 'vote'" class="btn-back">← Kembali Memilih</button>
        <button @click="submitVotes" :disabled="submitting" class="btn-confirm">
          {{ submitting ? 'Menyimpan...' : '✅ KONFIRMASI & SUBMIT' }}
        </button>
      </div>
    </div>

    <!-- Step 4: Thank You -->
    <div v-if="step === 'thanks'" class="thanks-step">
      <div class="thanks-content">
        <div class="thanks-icon">✅</div>
        <h1>TERIMA KASIH!</h1>
        <p class="thanks-message">Suara Anda telah tercatat dalam sistem</p>
        <p class="thanks-detail">
          Anda telah memilih untuk 4 posisi Waka. Hasil pemilihan akan diumumkan setelah sesi voting
          berakhir.
        </p>
        <div class="thanks-info">
          <p>Waktu submit: {{ formatDate(new Date()) }}</p>
          <p>ID Voting: {{ voteId }}</p>
        </div>
        <button @click="goToHome" class="btn-home">Kembali ke Halaman Utama</button>
      </div>
    </div>

    <!-- Error & Loading -->
    <div v-if="error" class="error-message">{{ error }}</div>
    <div v-if="loading" class="loading-overlay">Memproses...</div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, computed, watch } from 'vue'
import { useRouter } from 'vue-router'
import { Html5QrcodeScanner } from 'html5-qrcode'
import { supabase } from '@/utils/supabase'

const router = useRouter()

// State
const step = ref('scan')
const hasCamera = ref(false)
const scannerElement = ref(null)
const html5QrcodeScanner = ref(null)
const manualToken = ref('')
const voter = ref(null)
const timeLeft = ref(15 * 60) // 15 menit
const activePosition = ref('humas')
const positions = ref([
  { value: 'humas', label: 'Waka HUMAS' },
  { value: 'sarpras', label: 'Waka SARPRAS' },
  { value: 'kesiswaan', label: 'Waka KESISWAAN' },
  { value: 'kurikulum', label: 'Waka KURIKULUM' },
])
const candidates = ref([])
const selectedCandidates = ref({})
const loading = ref(false)
const loadingCandidates = ref(false)
const submitting = ref(false)
const error = ref('')
const voteId = ref('')
const timerInterval = ref(null)

// Computed
const positionIndex = computed(() =>
  positions.value.findIndex((pos) => pos.value === activePosition.value),
)

const candidatesByPosition = computed(() => {
  return candidates.value.filter((c) => c.jabatan === activePosition.value)
})

const isAllSelected = computed(() => {
  return positions.value.every((pos) => selectedCandidates.value[pos.value])
})

// Methods
const initCamera = async () => {
  try {
    await navigator.mediaDevices.getUserMedia({ video: true })
    hasCamera.value = true
    initQRScanner()
  } catch (error) {
    error.value = 'Tidak dapat mengakses kamera'
  }
}

const initQRScanner = () => {
  if (!scannerElement.value || !hasCamera.value) return

  html5QrcodeScanner.value = new Html5QrcodeScanner(
    'reader',
    { fps: 10, qrbox: { width: 250, height: 250 } },
    false,
  )

  html5QrcodeScanner.value.render(
    onQRCodeScanned,
    () => {}, // error callback
  )
}

const onQRCodeScanned = async (token) => {
  if (loading.value) return
  loading.value = true
  error.value = ''

  try {
    // Validasi token
    const { data: tokenData, error: tokenError } = await supabase
      .from('token_qr')
      .select('*, pengguna(*)')
      .eq('token', token.trim())
      .eq('sudah_digunakan', false)
      .single()

    if (tokenError) throw new Error('Token tidak valid')

    // Update token
    await supabase
      .from('token_qr')
      .update({
        sudah_digunakan: true,
        digunakan_pada: new Date().toISOString(),
      })
      .eq('id', tokenData.id)

    voter.value = tokenData.pengguna
    await loadCandidates()
    step.value = 'vote'
    startTimer()
  } catch (error) {
    error.value = error.message
  } finally {
    loading.value = false
  }
}

const useManualToken = () => {
  if (!manualToken.value.trim()) return
  onQRCodeScanned(manualToken.value.trim())
}

const loadCandidates = async () => {
  loadingCandidates.value = true
  try {
    const { data, error: candidatesError } = await supabase
      .from('kandidat')
      .select('*, pengguna(*)')
      .eq('status', 'disetujui')
      .order('nomor_urut')

    if (candidatesError) throw candidatesError
    candidates.value = data || []
  } catch (error) {
    error.value = 'Gagal memuat kandidat'
  } finally {
    loadingCandidates.value = false
  }
}

const selectCandidate = (position, candidateId) => {
  selectedCandidates.value[position] = candidateId
}

const getPositionLabel = (value) => {
  const pos = positions.value.find((p) => p.value === value)
  return pos ? pos.label : value
}

const getInitials = (name) => {
  return name
    .split(' ')
    .map((w) => w[0])
    .join('')
    .toUpperCase()
    .substring(0, 2)
}

const truncateText = (text, length) => {
  return text && text.length > length ? text.substring(0, length) + '...' : text
}

const nextPosition = () => {
  if (positionIndex.value < positions.value.length - 1) {
    activePosition.value = positions.value[positionIndex.value + 1].value
  }
}

const previousPosition = () => {
  if (positionIndex.value > 0) {
    activePosition.value = positions.value[positionIndex.value - 1].value
  }
}

const showReview = () => {
  step.value = 'review'
}

const goToPosition = (position) => {
  activePosition.value = position
  step.value = 'vote'
}

const getSelectedCandidateName = (position) => {
  const candidateId = selectedCandidates.value[position]
  if (!candidateId) return null
  const candidate = candidates.value.find((c) => c.id === candidateId)
  return candidate ? candidate.pengguna.nama_lengkap : null
}

const getSelectedCandidateNumber = (position) => {
  const candidateId = selectedCandidates.value[position]
  if (!candidateId) return null
  const candidate = candidates.value.find((c) => c.id === candidateId)
  return candidate ? candidate.nomor_urut : null
}

const startTimer = () => {
  timerInterval.value = setInterval(() => {
    if (timeLeft.value > 0) {
      timeLeft.value--
    } else {
      clearInterval(timerInterval.value)
      if (step.value === 'vote' || step.value === 'review') {
        alert('Waktu voting habis!')
        router.push('/')
      }
    }
  }, 1000)
}

const formatTime = (seconds) => {
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
}

const formatDate = (date) => {
  return new Date(date).toLocaleTimeString('id-ID', {
    hour: '2-digit',
    minute: '2-digit',
    day: 'numeric',
    month: 'short',
  })
}

const submitVotes = async () => {
  if (!isAllSelected.value || submitting.value) return

  submitting.value = true
  error.value = ''

  try {
    // Get session ID
    const { data: sessionData, error: sessionError } = await supabase
      .from('sesi_pemilihan')
      .select('id')
      .eq('status', 'voting')
      .single()

    if (sessionError) throw new Error('Tidak ada sesi voting aktif')

    const sessionId = sessionData.id

    // Prepare votes
    const votesToInsert = positions.value.map((pos) => ({
      sesi_id: sessionId,
      pemilih_id: voter.value.id,
      kandidat_id: selectedCandidates.value[pos.value],
      jabatan: pos.value,
      is_draft: false,
      is_valid: true,
      submitted_at: new Date().toISOString(),
    }))

    // Insert votes
    const { error: votesError } = await supabase.from('suara').insert(votesToInsert)

    if (votesError) throw votesError

    // Generate vote ID
    voteId.value = 'VOTE-' + Date.now().toString(36).toUpperCase()

    // Show success
    step.value = 'thanks'
  } catch (error) {
    error.value = 'Gagal menyimpan pilihan: ' + error.message
  } finally {
    submitting.value = false
  }
}

const goToHome = () => {
  router.push('/')
}

// Lifecycle
onMounted(() => {
  // Check camera
  navigator.mediaDevices
    ?.enumerateDevices()
    .then((devices) => {
      hasCamera.value = devices.some((d) => d.kind === 'videoinput')
    })
    .catch(() => {
      hasCamera.value = false
    })
})

onUnmounted(() => {
  if (html5QrcodeScanner.value) {
    html5QrcodeScanner.value.clear()
  }
  if (timerInterval.value) {
    clearInterval(timerInterval.value)
  }
})

// Watch
watch(activePosition, () => {
  window.scrollTo({ top: 0, behavior: 'smooth' })
})
</script>

<style scoped>
/* CSS SEDERHANA - PAKAI YANG LAMA ATAU BASIC STYLE */
.voting-page {
  min-height: 100vh;
  background: #f8fafc;
}

.step-header,
.vote-header,
.review-header {
  background: white;
  padding: 2rem;
  text-align: center;
  border-bottom: 1px solid #e2e8f0;
}
.step-header h1,
.vote-header h1,
.review-header h1 {
  color: #1e3a8a;
  margin-bottom: 0.5rem;
}

.scan-step {
  max-width: 500px;
  margin: 0 auto;
  padding: 2rem;
}
.scanner-container {
  background: white;
  border-radius: 12px;
  padding: 2rem;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  margin-top: 2rem;
}
.camera-permission {
  text-align: center;
  padding: 3rem 2rem;
}
.btn-enable-camera {
  background: #1e3a8a;
  color: white;
  border: none;
  padding: 1rem 2rem;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  margin-top: 1rem;
}
.scanner-box {
  width: 300px;
  height: 300px;
  margin: 0 auto;
  border: 2px solid #ddd;
  border-radius: 8px;
  overflow: hidden;
}
.scanner-hint {
  margin-top: 1rem;
  color: #666;
}
.manual-token {
  margin-top: 2rem;
  padding-top: 2rem;
  border-top: 1px solid #e2e8f0;
  text-align: center;
}
.manual-token input {
  width: 100%;
  max-width: 300px;
  padding: 0.75rem;
  border: 1px solid #ddd;
  border-radius: 6px;
  margin: 1rem 0;
  font-size: 1rem;
}
.manual-token button {
  background: #1e3a8a;
  color: white;
  border: none;
  padding: 0.75rem 1.5rem;
  border-radius: 6px;
  cursor: pointer;
}
.manual-token button:disabled {
  background: #94a3b8;
  cursor: not-allowed;
}

.voter-info {
  margin-top: 1rem;
  padding: 1rem;
  background: #f0f7ff;
  border-radius: 8px;
  display: inline-block;
}
.timer {
  color: #dc2626;
  font-weight: 600;
  margin-top: 0.5rem;
}
.timer-expired {
  color: #ef4444;
  font-weight: 600;
}

.position-tabs {
  display: flex;
  background: white;
  border-bottom: 1px solid #e2e8f0;
  overflow-x: auto;
}
.position-tab {
  flex: 1;
  padding: 1rem;
  background: none;
  border: none;
  border-bottom: 3px solid transparent;
  cursor: pointer;
  font-weight: 600;
  color: #64748b;
  white-space: nowrap;
  min-width: 120px;
}
.position-tab.active {
  color: #1e3a8a;
  border-bottom-color: #1e3a8a;
}

.candidates-container {
  padding: 2rem;
  max-width: 1200px;
  margin: 0 auto;
}
.position-subtitle {
  color: #666;
  margin-bottom: 2rem;
  text-align: center;
}

.candidates-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 1.5rem;
  margin-top: 2rem;
}
.candidate-card {
  background: white;
  border: 2px solid #e2e8f0;
  border-radius: 12px;
  padding: 1.5rem;
  cursor: pointer;
  transition: all 0.3s;
  position: relative;
  overflow: hidden;
}
.candidate-card:hover {
  border-color: #93c5fd;
  transform: translateY(-2px);
}
.candidate-card.selected {
  border-color: #1e3a8a;
  background: #f0f7ff;
}

.candidate-photo {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  overflow: hidden;
  margin: 0 auto 1rem;
}
.photo-real img {
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
  font-size: 1.5rem;
  font-weight: bold;
}

.candidate-info {
  text-align: center;
}
.candidate-number {
  display: inline-block;
  background: #1e3a8a;
  color: white;
  width: 36px;
  height: 36px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
  margin: 0 auto 1rem;
}
.candidate-card h4 {
  color: #1e3a8a;
  margin-bottom: 0.5rem;
}
.candidate-nip {
  color: #64748b;
  font-size: 0.9rem;
  margin-bottom: 1rem;
}
.candidate-visi {
  background: #f8fafc;
  padding: 0.75rem;
  border-radius: 6px;
  text-align: left;
  font-size: 0.9rem;
  color: #4b5563;
}
.visi-preview {
  margin-top: 0.5rem;
  line-height: 1.4;
}

.selected-badge {
  position: absolute;
  top: 1rem;
  right: 1rem;
  background: #10b981;
  color: white;
  padding: 0.25rem 0.75rem;
  border-radius: 4px;
  font-size: 0.75rem;
  font-weight: 600;
}

.no-candidates {
  grid-column: 1 / -1;
  text-align: center;
  padding: 3rem;
  color: #9ca3af;
}

.vote-navigation {
  background: white;
  padding: 1.5rem 2rem;
  border-top: 1px solid #e2e8f0;
  position: sticky;
  bottom: 0;
}
.progress-indicator {
  margin-bottom: 1rem;
}
.progress-text {
  text-align: center;
  color: #64748b;
  margin-bottom: 0.5rem;
}
.progress-bar {
  height: 6px;
  background: #e2e8f0;
  border-radius: 3px;
  overflow: hidden;
}
.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #1e3a8a, #3b82f6);
  transition: width 0.3s ease;
}

.nav-buttons {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.btn-prev,
.btn-next,
.btn-submit {
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 6px;
  font-weight: 600;
  cursor: pointer;
}
.btn-prev {
  background: #6b7280;
  color: white;
}
.btn-prev:disabled {
  background: #9ca3af;
  cursor: not-allowed;
}
.btn-next,
.btn-submit {
  background: #1e3a8a;
  color: white;
}
.btn-next:disabled,
.btn-submit:disabled {
  background: #94a3b8;
  cursor: not-allowed;
}

.review-step {
  max-width: 800px;
  margin: 0 auto;
  padding: 2rem;
}
.review-choices {
  background: white;
  border-radius: 12px;
  padding: 2rem;
  margin: 2rem 0;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}
.review-choice {
  padding: 1.5rem;
  border-bottom: 1px solid #e2e8f0;
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.review-choice:last-child {
  border-bottom: none;
}
.review-choice h4 {
  color: #1e3a8a;
  min-width: 150px;
}
.btn-change {
  background: #3b82f6;
  color: white;
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 4px;
  cursor: pointer;
  margin-top: 0.5rem;
}

.review-warning {
  background: #fef3c7;
  border: 1px solid #f59e0b;
  border-radius: 8px;
  padding: 1rem;
  margin: 2rem 0;
  text-align: center;
  color: #92400e;
}

.review-actions {
  display: flex;
  justify-content: space-between;
  margin-top: 2rem;
}
.btn-back {
  background: #6b7280;
  color: white;
  border: none;
  padding: 0.75rem 1.5rem;
  border-radius: 6px;
  cursor: pointer;
}
.btn-confirm {
  background: #10b981;
  color: white;
  border: none;
  padding: 0.75rem 2rem;
  border-radius: 6px;
  font-weight: 600;
  cursor: pointer;
  font-size: 1.1rem;
}
.btn-confirm:disabled {
  background: #a7f3d0;
  cursor: not-allowed;
}

.thanks-step {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2rem;
}
.thanks-content {
  background: white;
  border-radius: 16px;
  padding: 3rem;
  text-align: center;
  max-width: 600px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
}
.thanks-icon {
  font-size: 4rem;
  margin-bottom: 1rem;
}
.thanks-message {
  font-size: 1.5rem;
  color: #1e3a8a;
  margin-bottom: 1rem;
}
.thanks-detail {
  color: #666;
  line-height: 1.6;
  margin-bottom: 2rem;
}
.thanks-info {
  background: #f8fafc;
  padding: 1rem;
  border-radius: 8px;
  margin-bottom: 2rem;
  text-align: left;
}
.thanks-info p {
  margin: 0.5rem 0;
  font-family: monospace;
  font-size: 0.9rem;
}
.btn-home {
  background: #1e3a8a;
  color: white;
  border: none;
  padding: 1rem 2rem;
  border-radius: 8px;
  font-size: 1.1rem;
  font-weight: 600;
  cursor: pointer;
}

.error-message {
  position: fixed;
  top: 1rem;
  right: 1rem;
  background: #fee;
  color: #c00;
  padding: 1rem;
  border-radius: 6px;
  border: 1px solid #fcc;
  z-index: 1000;
  max-width: 300px;
}

.loading-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(255, 255, 255, 0.9);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.loading-candidates {
  text-align: center;
  padding: 3rem;
  color: #64748b;
}

@media (max-width: 768px) {
  .candidates-grid {
    grid-template-columns: 1fr;
  }
  .position-tab {
    min-width: 100px;
    padding: 0.75rem 0.5rem;
    font-size: 0.9rem;
  }
  .review-choice {
    flex-direction: column;
    align-items: flex-start;
  }
  .review-choice h4 {
    margin-bottom: 0.5rem;
  }
}
</style>
