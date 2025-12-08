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
        <div class="voter-details">
          <strong>{{ voterData.pengguna.nama_lengkap }}</strong>
          <span class="voter-token">Token: {{ voterData.token }}</span>
        </div>
      </div>
    </div>

    <!-- Voting Steps - 2 step saja -->
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

    <!-- Main Content - 2 step saja -->
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
            <div class="candidate-info">
              <h3 class="candidate-name">{{ candidate.pengguna.nama_lengkap }}</h3>
              <div class="candidate-number">
                <span class="number-badge">#{{ candidate.nomor_urut }}</span>
              </div>
              <div class="candidate-simple-info">
                <span class="candidate-role">Calon Waka Kesiswaan</span>
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
            <div class="candidate-info">
              <h3 class="candidate-name">{{ candidate.pengguna.nama_lengkap }}</h3>
              <div class="candidate-number">
                <span class="number-badge">#{{ candidate.nomor_urut }}</span>
              </div>
              <div class="candidate-simple-info">
                <span class="candidate-role">Calon Waka Sarpras</span>
              </div>
            </div>
          </div>
        </div>

        <div v-if="sarprasCandidates.length === 0" class="empty-candidates">
          <p>Belum ada calon untuk jabatan ini</p>
        </div>
      </div>
    </div>

    <!-- Navigation Buttons -->
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

    <!-- Selection Summary -->
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

    <!-- Confirmation Modal -->
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
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { supabase } from '@/utils/supabase'

const router = useRouter()

// State
const currentStep = ref(1)
const voterData = ref(null)
const activeSession = ref(null)
const submitting = ref(false)
const error = ref('')
const success = ref(false)
const showConfirmModal = ref(false)
const isDevelopment = import.meta.env.DEV || window.location.hostname === 'localhost'

// Candidates data
const kesiswaanCandidates = ref([])
const sarprasCandidates = ref([])

// Selections
const selectedKesiswaan = ref(null)
const selectedSarpras = ref(null)

// Computed
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

// Selection handlers
const selectKesiswaan = (candidate) => {
  selectedKesiswaan.value = candidate
}

const selectSarpras = (candidate) => {
  selectedSarpras.value = candidate
}

// =============================================
// AUTO-SAVE DRAFT FUNCTIONS
// =============================================

// Save draft to localStorage
const saveDraft = () => {
  if (!voterData.value || !activeSession.value) return

  const draft = {
    sessionId: activeSession.value.id,
    voterId: voterData.value.pengguna.id,
    token: voterData.value.token,
    step: currentStep.value,
    kesiswaanId: selectedKesiswaan.value?.id,
    sarprasId: selectedSarpras.value?.id,
    timestamp: new Date().toISOString(),
  }

  localStorage.setItem('smanda_vote_draft', JSON.stringify(draft))
  console.log('💾 Draft saved:', draft)
}

// Load draft from localStorage
const loadDraft = () => {
  try {
    const saved = localStorage.getItem('smanda_vote_draft')
    if (!saved) {
      console.log('ℹ️ No draft found')
      return
    }

    const draft = JSON.parse(saved)
    console.log('📂 Found draft:', draft)

    // Validasi: harus sama session & voter
    if (!activeSession.value || draft.sessionId !== activeSession.value.id) {
      console.log('❌ Draft session mismatch, clearing...')
      localStorage.removeItem('smanda_vote_draft')
      return
    }

    if (!voterData.value || draft.voterId !== voterData.value.pengguna.id) {
      console.log('❌ Draft voter mismatch, clearing...')
      localStorage.removeItem('smanda_vote_draft')
      return
    }

    // Validasi usia draft (max 30 menit)
    const draftAge = new Date() - new Date(draft.timestamp)
    if (draftAge > 30 * 60 * 1000) {
      console.log('❌ Draft expired (30 mins), clearing...')
      localStorage.removeItem('smanda_vote_draft')
      return
    }

    // Restore step
    currentStep.value = draft.step || 1
    console.log('↩️ Restored step:', currentStep.value)

    // Restore selections (harus tunggu candidates loaded)
    return draft
  } catch (err) {
    console.error('❌ Error loading draft:', err)
    localStorage.removeItem('smanda_vote_draft')
    return null
  }
}

// Restore selections after candidates are loaded
const restoreSelections = (draft) => {
  if (!draft) return

  // Restore kesiswaan selection
  if (draft.kesiswaanId && kesiswaanCandidates.value.length > 0) {
    const candidate = kesiswaanCandidates.value.find((c) => c.id === draft.kesiswaanId)
    if (candidate) {
      selectedKesiswaan.value = candidate
      console.log('✅ Restored kesiswaan selection:', candidate.pengguna.nama_lengkap)
    }
  }

  // Restore sarpras selection
  if (draft.sarprasId && sarprasCandidates.value.length > 0) {
    const candidate = sarprasCandidates.value.find((c) => c.id === draft.sarprasId)
    if (candidate) {
      selectedSarpras.value = candidate
      console.log('✅ Restored sarpras selection:', candidate.pengguna.nama_lengkap)
    }
  }
}

// Navigation
const nextStep = () => {
  if (currentStep.value < 2 && isCurrentStepValid.value) {
    currentStep.value++
    saveDraft()
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }
}

const prevStep = () => {
  if (currentStep.value > 1) {
    currentStep.value--
    saveDraft()
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

    setTimeout(() => {
      router.push('/scan')
    }, 2000)
    return false
  }

  try {
    console.log('📦 Parsing voter session:', voterSession)
    voterData.value = JSON.parse(voterSession)
    console.log('✅ Voter data loaded:', voterData.value)

    // Validasi struktur data
    if (!voterData.value.token || !voterData.value.pengguna || !voterData.value.sesi_id) {
      throw new Error('Data session tidak valid')
    }

    // Validasi session expiry (30 menit)
    const maxAge = 30 * 60 * 1000
    if (sessionAge.value > maxAge) {
      console.warn('⚠️ Voter session expired, clearing...')
      localStorage.removeItem('smanda_voter')
      localStorage.removeItem('smanda_vote_draft')
      error.value = 'Session telah kadaluarsa. Silakan scan token kembali.'

      setTimeout(() => {
        router.push('/scan')
      }, 2000)
      return false
    }

    return true
  } catch (err) {
    console.error('❌ Error parsing voter session:', err)
    localStorage.removeItem('smanda_voter')
    localStorage.removeItem('smanda_vote_draft')
    error.value = 'Error memuat data session. Silakan scan token kembali.'

    setTimeout(() => {
      router.push('/scan')
    }, 2000)
    return false
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
      return false
    }

    if (activeSession.value.status !== 'voting') {
      error.value = `Sesi voting tidak aktif. Status saat ini: ${activeSession.value.status.toUpperCase()}`
      console.warn('⚠️ Session not in voting status:', activeSession.value.status)
      return false
    }

    return true
  } catch (err) {
    console.error('❌ Error loading session:', err)
    error.value = 'Gagal memuat data sesi. Silakan coba lagi nanti.'
    return false
  }
}

const loadCandidates = async () => {
  try {
    if (!activeSession.value?.id) {
      console.warn('⚠️ No active session ID, skipping candidates load')
      return
    }

    console.log('🔍 Loading candidates for session:', activeSession.value.id)

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
      .in('jabatan', ['kesiswaan', 'sarpras'])
      .order('jabatan', { ascending: true })
      .order('nomor_urut', { ascending: true })

    if (candidatesError) {
      console.error('❌ Error loading candidates:', candidatesError)
      throw candidatesError
    }

    console.log('✅ Candidates loaded:', candidates?.length || 0)

    kesiswaanCandidates.value = candidates?.filter((c) => c.jabatan === 'kesiswaan') || []
    sarprasCandidates.value = candidates?.filter((c) => c.jabatan === 'sarpras') || []

    console.log('🎯 Kesiswaan candidates:', kesiswaanCandidates.value.length)
    console.log('🎯 Sarpras candidates:', sarprasCandidates.value.length)

    return true
  } catch (err) {
    console.error('❌ Error loading candidates:', err)
    error.value = 'Gagal memuat data calon'
    return false
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

// Mark Token After Vote Success
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
    const { error: insertError } = await supabase.from('suara').insert(votes)

    if (insertError) {
      console.error('❌ Error inserting votes:', insertError)
      throw insertError
    }

    console.log('✅ Votes submitted successfully')

    // MARK TOKEN AS USED AFTER VOTE SUCCESS
    console.log('🏷️ Marking token as used...')
    const { error: tokenError } = await supabase
      .from('token_qr')
      .update({
        sudah_digunakan: true,
        digunakan_pada: new Date().toISOString(),
        info_perangkat: navigator.userAgent,
      })
      .eq('token', voterData.value.token)
      .eq('sesi_id', activeSession.value.id)

    if (tokenError) {
      console.error('❌ Error marking token:', tokenError)
    } else {
      console.log('✅ Token successfully marked as used')
    }

    // Clear all local data
    localStorage.removeItem('smanda_voter')
    localStorage.removeItem('smanda_vote_draft')
    console.log('🗑️ Cleared all local session data')

    // Success
    success.value = true

    // Redirect after delay
    setTimeout(() => {
      console.log('🔄 Redirecting to home page...')
      router.push('/')
    }, 3000)
  } catch (err) {
    console.error('❌ Error submitting vote:', err)
    error.value = err.message || 'Gagal mengirim voting'

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
  localStorage.removeItem('smanda_vote_draft')
  router.push('/scan')
}

// =============================================
// WATCHERS FOR AUTO-SAVE
// =============================================

// Watch for selection changes and auto-save
watch(
  [selectedKesiswaan, selectedSarpras],
  () => {
    if (selectedKesiswaan.value || selectedSarpras.value) {
      saveDraft()
    }
  },
  { deep: true },
)

// Watch for step changes and auto-save
watch(currentStep, () => {
  saveDraft()
})

// Prevent accidental page leave
const beforeUnloadHandler = (event) => {
  if ((selectedKesiswaan.value || selectedSarpras.value) && !success.value && !submitting.value) {
    event.preventDefault()
    event.returnValue = 'Voting Anda belum disimpan. Yakin ingin keluar?'
  }
}

// Lifecycle
onMounted(async () => {
  console.log('🚀 VotingPage mounted')

  // Load voter data first
  const voterLoaded = loadVoterData()
  if (!voterLoaded) return

  // Only load session and candidates if voter data is valid
  const sessionLoaded = await loadActiveSession()
  if (!sessionLoaded) return

  const candidatesLoaded = await loadCandidates()
  if (!candidatesLoaded) return

  // Load draft (if exists)
  const draft = loadDraft()

  // Restore selections after candidates are loaded
  if (draft && kesiswaanCandidates.value.length > 0 && sarprasCandidates.value.length > 0) {
    restoreSelections(draft)
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
/* ============================================
   MOBILE-FIRST STYLES FOR VOTING PAGE
   ============================================ */

.voting-container {
  width: 100%;
  min-height: 100vh;
  background: var(--color-bg);
  padding: 0;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
}

/* ============================================
   HEADER - SIMPLIFIED FOR MOBILE
   ============================================ */
.voting-header {
  background: linear-gradient(135deg, var(--color-primary) 0%, #1e40af 100%);
  border-radius: 0 0 20px 20px;
  padding: 1.2rem 1rem;
  margin-bottom: 1.2rem;
  box-shadow: var(--shadow-lg);
  color: white;
  text-align: center;
}

.title {
  font-size: 1.4rem;
  margin-bottom: 0.3rem;
  font-weight: 800;
  line-height: 1.2;
}

.subtitle {
  font-size: 0.85rem;
  opacity: 0.9;
  margin-bottom: 1.2rem;
}

.session-info {
  display: flex;
  flex-direction: column;
  gap: 0.8rem;
  align-items: center;
  margin-bottom: 1.2rem;
  padding: 0.8rem;
  background: rgba(255, 255, 255, 0.15);
  border-radius: 12px;
  backdrop-filter: blur(10px);
}

.session-name {
  font-weight: 700;
  font-size: 0.95rem;
  color: white;
}

.session-status.voting {
  background: linear-gradient(135deg, #059669, #10b981);
  color: white;
  padding: 0.4rem 1rem;
  border-radius: 20px;
  font-weight: 700;
  font-size: 0.8rem;
  display: inline-block;
}

/* VOTER INFO - SIMPLIFIED */
.voter-info {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.6rem;
  padding: 0.8rem;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 12px;
  border: 1px solid rgba(255, 255, 255, 0.3);
  text-align: center;
}

.voter-info strong {
  font-size: 1rem;
  color: white;
  display: block;
  margin-bottom: 0.3rem;
}

.voter-token {
  font-size: 0.85rem;
  color: rgba(255, 255, 255, 0.8);
  font-family: 'Courier New', monospace;
  background: rgba(0, 0, 0, 0.2);
  padding: 0.3rem 0.8rem;
  border-radius: 6px;
  display: inline-block;
}

/* ============================================
   VOTING STEPS - MOBILE OPTIMIZED
   ============================================ */
.voting-steps {
  display: flex;
  gap: 0.8rem;
  margin: 0 1rem 1.5rem;
  padding: 0.8rem;
  background: var(--color-bg-soft);
  border-radius: 16px;
  box-shadow: var(--shadow-sm);
}

.step {
  flex: 1;
  text-align: center;
  padding: 1rem 0.5rem;
  background: white;
  border-radius: 10px;
  border: 2px solid var(--color-border);
  transition: all 0.3s;
  min-height: 80px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
}

.step.active {
  border-color: var(--color-primary);
  background: linear-gradient(135deg, var(--color-primary-light), var(--color-primary));
  color: white;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(30, 58, 138, 0.25);
}

.step-number {
  width: 32px;
  height: 32px;
  background: var(--color-bg-mute);
  color: var(--color-text-mute);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
  margin: 0 auto 0.5rem;
  font-size: 1rem;
}

.step.active .step-number {
  background: white;
  color: var(--color-primary);
}

.step-label {
  font-weight: 600;
  color: var(--color-text-soft);
  font-size: 0.85rem;
  line-height: 1.2;
}

.step.active .step-label {
  color: white;
  font-weight: 700;
}

/* ============================================
   STEP CONTENT - MOBILE OPTIMIZED
   ============================================ */
.voting-content {
  flex: 1;
  padding: 0 1rem;
  margin-bottom: 1.5rem;
}

.step-content {
  background: white;
  border-radius: 16px;
  padding: 1.5rem;
  margin-bottom: 1.2rem;
  box-shadow: var(--shadow-md);
  border: 1px solid var(--color-border);
}

.step-title {
  color: var(--color-primary);
  margin-bottom: 0.5rem;
  text-align: center;
  font-size: 1.3rem;
  font-weight: 700;
}

.step-description {
  color: var(--color-text-soft);
  text-align: center;
  margin-bottom: 1.5rem;
  font-size: 0.9rem;
  line-height: 1.4;
}

/* ============================================
   CANDIDATES - SIMPLIFIED (NO PHOTO, NO VISI)
   ============================================ */
.candidates-grid {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  margin-top: 1.2rem;
}

.candidate-card {
  border: 2px solid var(--color-border);
  border-radius: 12px;
  padding: 1.2rem;
  cursor: pointer;
  transition: all 0.3s;
  background: white;
  position: relative;
  overflow: hidden;
}

.candidate-card:hover {
  border-color: var(--color-primary-light);
  transform: translateY(-2px);
  box-shadow: var(--shadow-md);
}

.candidate-card.selected {
  border-color: var(--color-primary);
  background: linear-gradient(135deg, rgba(30, 58, 138, 0.05), rgba(30, 58, 138, 0.1));
  box-shadow: 0 0 0 3px rgba(30, 58, 138, 0.1);
}

.candidate-info {
  text-align: center;
}

.candidate-name {
  color: var(--color-text);
  margin-bottom: 0.5rem;
  font-size: 1.1rem;
  font-weight: 700;
  line-height: 1.2;
}

.candidate-number {
  margin-bottom: 0.8rem;
  display: inline-block;
}

.number-badge {
  display: inline-block;
  padding: 0.3rem 0.8rem;
  background: linear-gradient(135deg, var(--color-primary), var(--color-primary-light));
  color: white;
  border-radius: 15px;
  font-size: 0.9rem;
  font-weight: 700;
  min-width: 60px;
  text-align: center;
}

.candidate-simple-info {
  margin-top: 0.8rem;
  padding-top: 0.8rem;
  border-top: 1px dashed var(--color-border);
  text-align: center;
}

.candidate-role {
  display: inline-block;
  padding: 0.3rem 0.8rem;
  background: var(--color-bg-mute);
  color: var(--color-text-soft);
  border-radius: 12px;
  font-size: 0.8rem;
  font-weight: 600;
}

.dark-mode .candidate-role {
  background: var(--color-bg);
  color: var(--color-text);
}

.candidate-card.selected .candidate-role {
  background: rgba(255, 255, 255, 0.2);
  color: white;
}

.empty-candidates {
  text-align: center;
  padding: 2rem 1rem;
  color: var(--color-text-mute);
  background: var(--color-bg-soft);
  border-radius: 12px;
  border: 2px dashed var(--color-border);
  margin: 1rem 0;
}

/* ============================================
   NAVIGATION BUTTONS - MOBILE OPTIMIZED
   ============================================ */
.navigation-buttons {
  display: flex;
  justify-content: space-between;
  gap: 0.8rem;
  margin: 0 1rem 1.5rem;
  padding: 0 0.5rem;
}

.nav-btn {
  flex: 1;
  padding: 1rem 0;
  border: none;
  border-radius: 12px;
  font-size: 1rem;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.3s;
  min-height: 56px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
}

.prev-btn {
  background: var(--color-text-soft);
  color: white;
  order: 1;
}

.prev-btn:hover:not(:disabled) {
  background: var(--color-text-mute);
  transform: translateY(-2px);
}

.next-btn {
  background: linear-gradient(135deg, var(--color-primary), var(--color-primary-light));
  color: white;
  order: 3;
}

.next-btn:hover:not(:disabled) {
  background: linear-gradient(135deg, #1e40af, #3b82f6);
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(30, 58, 138, 0.3);
}

.submit-btn {
  background: linear-gradient(135deg, #059669, #10b981);
  color: white;
  order: 3;
  flex: 2;
}

.submit-btn:hover:not(:disabled) {
  background: linear-gradient(135deg, #047857, #0d9c6d);
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(5, 150, 105, 0.3);
}

.nav-btn:disabled {
  background: var(--color-border);
  color: var(--color-text-mute);
  cursor: not-allowed;
  transform: none;
  box-shadow: none;
  opacity: 0.7;
}

/* ============================================
   SELECTION SUMMARY - MOBILE OPTIMIZED
   ============================================ */
.selection-summary {
  background: white;
  border-radius: 16px;
  padding: 1.2rem;
  margin: 0 1rem 1.5rem;
  border: 1px solid var(--color-border);
  box-shadow: var(--shadow-sm);
}

.selection-summary h3 {
  color: var(--color-primary);
  margin-bottom: 1rem;
  text-align: center;
  font-size: 1.1rem;
  font-weight: 700;
}

.summary-grid {
  display: flex;
  flex-direction: column;
  gap: 0.8rem;
}

.summary-item {
  padding: 1rem;
  border-radius: 10px;
  border: 2px solid var(--color-border);
  transition: all 0.3s;
  background: var(--color-bg-soft);
}

.summary-item.filled {
  border-color: var(--color-secondary);
  background: linear-gradient(135deg, rgba(16, 185, 129, 0.05), rgba(16, 185, 129, 0.1));
}

.summary-label {
  display: block;
  font-weight: 600;
  color: var(--color-text-soft);
  margin-bottom: 0.5rem;
  font-size: 0.9rem;
}

.summary-item.filled .summary-label {
  color: var(--color-secondary);
  font-weight: 700;
}

.summary-value {
  color: var(--color-text-mute);
  font-size: 0.95rem;
  min-height: 24px;
  font-weight: 500;
}

.summary-item.filled .summary-value {
  color: var(--color-text);
  font-weight: 700;
  font-size: 1rem;
}

/* ============================================
   MESSAGES - MOBILE OPTIMIZED
   ============================================ */
.error-message,
.success-message {
  margin: 1rem;
  padding: 1.2rem;
  border-radius: 12px;
  animation: slideDown 0.3s ease;
  text-align: center;
  font-size: 0.95rem;
  line-height: 1.4;
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
}

.success-message {
  background: linear-gradient(135deg, #d1fae5, #a7f3d0);
  color: #065f46;
  border: 2px solid #6ee7b7;
}

.success-content h3 {
  margin-bottom: 0.5rem;
  font-size: 1.2rem;
}

/* ============================================
   MODAL - MOBILE OPTIMIZED
   ============================================ */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2000;
  padding: 1rem;
  backdrop-filter: blur(5px);
}

.modal {
  background: white;
  border-radius: 16px;
  width: 100%;
  max-width: 400px;
  max-height: 80vh;
  overflow-y: auto;
  box-shadow: var(--shadow-lg);
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
  padding: 1.2rem;
  border-bottom: 1px solid var(--color-border);
  background: linear-gradient(135deg, var(--color-primary), var(--color-primary-light));
  color: white;
  border-radius: 16px 16px 0 0;
}

.modal-header h3 {
  margin: 0;
  font-size: 1.2rem;
  font-weight: 700;
}

.modal-close {
  background: rgba(255, 255, 255, 0.2);
  border: none;
  font-size: 1.5rem;
  line-height: 1;
  cursor: pointer;
  color: white;
  padding: 0.25rem;
  border-radius: 50%;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.modal-close:hover {
  background: rgba(255, 255, 255, 0.3);
}

.modal-body {
  padding: 1.2rem;
}

.modal-selections {
  margin: 1rem 0;
  padding-left: 1.2rem;
  color: var(--color-text);
}

.modal-selections li {
  margin-bottom: 0.8rem;
  font-size: 1rem;
  line-height: 1.4;
}

.modal-warning {
  background: #fff3cd;
  border: 1px solid #ffc107;
  border-radius: 8px;
  padding: 1rem;
  margin-top: 1rem;
  color: #856404;
  font-size: 0.9rem;
  line-height: 1.4;
}

.modal-footer {
  display: flex;
  gap: 0.8rem;
  padding: 1.2rem;
  border-top: 1px solid var(--color-border);
}

.modal-btn {
  flex: 1;
  padding: 0.9rem;
  border: none;
  border-radius: 10px;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.2s;
  font-size: 0.95rem;
  min-height: 48px;
}

.cancel-btn {
  background: var(--color-text-soft);
  color: white;
}

.cancel-btn:hover {
  background: var(--color-text-mute);
  transform: translateY(-1px);
}

.confirm-btn {
  background: linear-gradient(135deg, var(--color-primary), var(--color-primary-light));
  color: white;
}

.confirm-btn:hover {
  background: linear-gradient(135deg, #1e40af, #3b82f6);
  transform: translateY(-1px);
}

/* ============================================
   DEBUG INFO - MOBILE OPTIMIZED
   ============================================ */
.debug-info {
  background: var(--color-bg-mute);
  border: 1px dashed var(--color-border);
  border-radius: 12px;
  padding: 1rem;
  margin: 1rem;
  font-family: monospace;
  font-size: 0.8rem;
  display: none;
}

.isDevelopment .debug-info {
  display: block;
}

.debug-info h4 {
  color: var(--color-text-soft);
  margin-bottom: 0.5rem;
  font-size: 0.9rem;
}

.debug-info p {
  color: var(--color-text-mute);
  margin: 0.2rem 0;
}

.debug-btn {
  margin-top: 0.8rem;
  padding: 0.6rem 1rem;
  background: var(--color-danger);
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-size: 0.8rem;
  width: 100%;
  font-weight: 600;
}

.debug-btn:hover {
  background: #dc2626;
}

/* ============================================
   TOUCH DEVICE OPTIMIZATIONS
   ============================================ */
@media (hover: none) and (pointer: coarse) {
  .candidate-card {
    min-height: 100px;
    padding: 1rem;
  }

  .nav-btn,
  .modal-btn {
    min-height: 56px;
    font-size: 1.1rem;
  }

  .step {
    min-height: 90px;
  }

  .step-number {
    width: 36px;
    height: 36px;
    font-size: 1.1rem;
  }

  .step-label {
    font-size: 0.9rem;
  }

  /* Increase tap target size */
  .candidate-card,
  .nav-btn,
  .modal-btn,
  .modal-close {
    cursor: pointer;
    -webkit-tap-highlight-color: rgba(0, 0, 0, 0.1);
  }
}

/* ============================================
   RESPONSIVE BREAKPOINTS
   ============================================ */

/* Tablet (768px ke atas) */
@media (min-width: 768px) {
  .voting-container {
    max-width: 600px;
    margin: 0 auto;
    padding: 0.5rem;
  }

  .voting-header {
    padding: 1.5rem;
    margin-bottom: 1.5rem;
  }

  .title {
    font-size: 1.6rem;
  }

  .voting-steps {
    margin: 0 0 2rem;
  }

  .step {
    padding: 1.2rem 0.8rem;
    min-height: 90px;
  }

  .step-label {
    font-size: 0.9rem;
  }

  .voting-content {
    padding: 0;
  }

  .step-content {
    padding: 2rem;
  }

  .step-title {
    font-size: 1.5rem;
  }

  .candidate-card {
    padding: 1.5rem;
  }

  .candidate-name {
    font-size: 1.2rem;
  }

  .navigation-buttons {
    margin: 0 0 2rem;
  }

  .selection-summary {
    margin: 0 0 2rem;
  }

  .summary-grid {
    flex-direction: row;
    gap: 1rem;
  }

  .summary-item {
    flex: 1;
  }
}

/* Desktop kecil (1024px ke atas) */
@media (min-width: 1024px) {
  .voting-container {
    max-width: 800px;
  }

  .candidates-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 1.2rem;
  }

  .candidate-card {
    min-height: 180px;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
  }
}

/* Desktop besar (1200px ke atas) */
@media (min-width: 1200px) {
  .voting-container {
    max-width: 1000px;
  }

  .candidates-grid {
    grid-template-columns: repeat(3, 1fr);
  }
}

/* ============================================
   DARK MODE OVERRIDES
   ============================================ */
.dark-mode .voting-header {
  background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%);
}

.dark-mode .session-info {
  background: rgba(255, 255, 255, 0.1);
}

.dark-mode .voter-info {
  background: rgba(255, 255, 255, 0.15);
  border-color: rgba(255, 255, 255, 0.2);
}

.dark-mode .step {
  background: var(--color-bg-mute);
  border-color: var(--color-border);
}

.dark-mode .step.active {
  background: linear-gradient(135deg, #3b82f6, #60a5fa);
}

.dark-mode .step-content {
  background: var(--color-bg-soft);
  border-color: var(--color-border);
}

.dark-mode .candidate-card {
  background: var(--color-bg-soft);
  border-color: var(--color-border);
}

.dark-mode .candidate-card.selected {
  background: linear-gradient(135deg, rgba(59, 130, 246, 0.1), rgba(59, 130, 246, 0.2));
}

.dark-mode .candidate-name {
  color: var(--color-text);
}

.dark-mode .empty-candidates {
  background: var(--color-bg-mute);
  border-color: var(--color-border);
}

.dark-mode .selection-summary {
  background: var(--color-bg-soft);
  border-color: var(--color-border);
}

.dark-mode .summary-item {
  background: var(--color-bg-mute);
}

.dark-mode .modal {
  background: var(--color-bg-soft);
  color: var(--color-text);
}

.dark-mode .modal-header {
  background: linear-gradient(135deg, #1e293b, #0f172a);
}

/* ============================================
   PRINT STYLES
   ============================================ */
@media print {
  .voting-header,
  .voting-steps,
  .navigation-buttons,
  .selection-summary,
  .debug-info,
  .error-message,
  .success-message,
  .modal-overlay {
    display: none !important;
  }

  .voting-container {
    padding: 0;
    background: white !important;
    color: black !important;
  }

  .step-content {
    box-shadow: none !important;
    border: 1px solid #ccc !important;
    page-break-inside: avoid;
  }

  .candidate-card {
    border: 1px solid #ccc !important;
    margin-bottom: 0.5rem;
  }
}
</style>
