<template>
  <div class="scan-container">
    <h1 class="title">Input Token Voting</h1>
    <p class="subtitle">Masukkan token 6 digit dari kartu voting Anda</p>

    <!-- Session Status Info -->
    <div v-if="activeSession" class="session-info">
      <span class="session-name">{{ activeSession.nama_sesi }}</span>
      <span class="session-status" :class="activeSession.status">
        {{ activeSession.status.toUpperCase() }}
      </span>
    </div>

    <div v-if="activeSession?.status !== 'voting'" class="warning-box">
      <p>⚠️ Voting belum dibuka atau sudah ditutup</p>
      <p>
        Status saat ini: <strong>{{ activeSession?.status || 'Tidak ada sesi' }}</strong>
      </p>
      <router-link to="/" class="btn-home">Kembali ke Home</router-link>
    </div>

    <div v-else class="token-input-container">
      <div class="token-input-box">
        <input
          type="text"
          v-model="manualToken"
          placeholder="123456"
          maxlength="6"
          :disabled="loading"
          class="token-input"
          @keyup.enter="submitManualToken"
          @input="formatTokenInput"
        />
        <p class="token-hint">Masukkan 6 digit token dari kartu voting</p>

        <div class="token-preview" v-if="manualToken">
          <span class="digit" v-for="(digit, index) in tokenDigits" :key="index">
            {{ digit }}
          </span>
        </div>
      </div>

      <button
        @click="submitManualToken"
        :disabled="loading || !manualToken.trim() || manualToken.length !== 6"
        class="submit-btn"
      >
        {{ loading ? 'Memproses...' : 'Masuk ke Voting' }}
      </button>
    </div>

    <div v-if="error" class="error-message">
      <span class="error-icon">❌</span>
      <span>{{ error }}</span>
    </div>

    <div v-if="success" class="success-message">
      <span class="success-icon">✅</span>
      <span>Token valid! Mengarahkan ke voting page...</span>
    </div>

    <div class="info-box">
      <h3><span class="info-icon">ℹ️</span> Panduan Voting</h3>
      <ol>
        <li>Dapatkan token 6 digit dari panitia</li>
        <li>Input token di kolom atas (contoh: 123456)</li>
        <li>Pastikan token 6 digit lengkap</li>
        <li>Klik "Masuk ke Voting"</li>
        <li>Pilih calon Wakil Kepala Sekolah untuk 2 jabatan (Kesiswaan, Sarpras)</li>
        <li>Submit suara Anda</li>
      </ol>

      <div class="token-example">
        <p><strong>Contoh token:</strong></p>
        <div class="example-tokens">
          <span class="example-token" @click="fillExampleToken('123456')">123456</span>
          <span class="example-token" @click="fillExampleToken('789012')">789012</span>
          <span class="example-token" @click="fillExampleToken('345678')">345678</span>
        </div>
        <p class="example-note">Klik contoh untuk mengisi otomatis</p>
      </div>
    </div>

    <div class="footer-links">
      <router-link to="/" class="footer-link"> ← Kembali ke Home </router-link>
      <span class="separator">•</span>
      <router-link to="/login-calon" class="footer-link"> Login Calon Kandidat → </router-link>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { supabase } from '@/utils/supabase'

const router = useRouter()
const manualToken = ref('')
const loading = ref(false)
const error = ref('')
const success = ref(false)
const activeSession = ref(null)

// Load active session
const loadActiveSession = async () => {
  try {
    const { data, error: sessionError } = await supabase
      .from('sesi_pemilihan')
      .select('*')
      .order('dibuat_pada', { ascending: false })
      .limit(1)

    if (sessionError) throw sessionError
    activeSession.value = data?.[0] || null
  } catch (err) {
    console.error('Error loading session:', err)
  }
}

// Format token input (only allow numbers)
const formatTokenInput = (event) => {
  let value = event.target.value
  // Remove non-numeric characters
  value = value.replace(/\D/g, '')
  // Limit to 6 digits
  value = value.substring(0, 6)
  manualToken.value = value
}

// Fill example token
const fillExampleToken = (token) => {
  manualToken.value = token
}

// Token digits for preview
const tokenDigits = computed(() => {
  const digits = []
  const token = manualToken.value || ''

  for (let i = 0; i < 6; i++) {
    digits.push(token[i] || '')
  }

  return digits
})

// Process token validation
const processToken = async (token) => {
  if (loading.value) return

  // Clean token
  const cleanToken = token.trim()

  if (!/^\d{6}$/.test(cleanToken)) {
    error.value = 'Token harus 6 digit angka'
    return
  }

  loading.value = true
  error.value = ''
  success.value = false

  try {
    // 1. Check if session exists and is in voting status
    if (!activeSession.value || activeSession.value.status !== 'voting') {
      throw new Error('Sesi voting tidak aktif')
    }

    console.log('Validating token:', cleanToken, 'for session:', activeSession.value.id)

    // 2. Validate token
    const { data: tokenData, error: tokenError } = await supabase
      .from('token_qr')
      .select(
        `
        *,
        pengguna:pengguna_id (
          id,
          nama_lengkap,
          peran
        )
      `,
      )
      .eq('token', cleanToken)
      .eq('sesi_id', activeSession.value.id)
      .eq('sudah_digunakan', false) // Token belum digunakan
      .gt('kadaluarsa_pada', new Date().toISOString())
      .single()

    if (tokenError) {
      console.log('Token query error:', tokenError)

      // Check if token exists but already used or expired
      const { data: existingToken } = await supabase
        .from('token_qr')
        .select('*')
        .eq('token', cleanToken)
        .eq('sesi_id', activeSession.value.id)
        .single()

      if (existingToken) {
        if (existingToken.sudah_digunakan) {
          throw new Error('Token sudah digunakan')
        }
        if (new Date(existingToken.kadaluarsa_pada) < new Date()) {
          throw new Error('Token sudah kadaluarsa')
        }
      }

      throw new Error('Token tidak ditemukan')
    }

    // 3. Check if user already voted
    const { data: existingVote } = await supabase
      .from('suara')
      .select('id')
      .eq('pemilih_id', tokenData.pengguna_id)
      .eq('sesi_id', activeSession.value.id)
      .limit(1)

    if (existingVote && existingVote.length > 0) {
      throw new Error('Anda sudah melakukan voting')
    }

    // 4. Check if there's existing draft for this token
    const existingDraft = localStorage.getItem('smanda_vote_draft')
    if (existingDraft) {
      try {
        const draft = JSON.parse(existingDraft)
        // Check if draft is for same token and session
        if (draft.token === cleanToken && draft.sessionId === activeSession.value.id) {
          console.log('🎯 Found existing draft for token, checking age...')

          // Check draft age (max 30 minutes)
          const draftAge = new Date() - new Date(draft.timestamp)
          if (draftAge < 30 * 60 * 1000) {
            // 30 minutes
            console.log('✅ Draft valid, continuing voting session')

            // Save voter session (refresh timestamp)
            const voterSession = {
              token: tokenData.token,
              pengguna: tokenData.pengguna,
              sesi_id: activeSession.value.id,
              timestamp: new Date().toISOString(),
            }

            localStorage.setItem('smanda_voter', JSON.stringify(voterSession))

            success.value = true
            console.log('Redirecting to voting page with existing draft...')

            setTimeout(() => {
              router.push('/voting')
            }, 500)
            return
          } else {
            console.log('⚠️ Draft expired, clearing...')
            localStorage.removeItem('smanda_vote_draft')
          }
        }
      } catch (draftErr) {
        console.error('Error parsing draft:', draftErr)
        localStorage.removeItem('smanda_vote_draft')
      }
    }

    // 5. Save voter session (NEW - tanpa mark token)
    const voterSession = {
      token: tokenData.token,
      pengguna: tokenData.pengguna,
      sesi_id: activeSession.value.id,
      timestamp: new Date().toISOString(),
    }

    localStorage.setItem('smanda_voter', JSON.stringify(voterSession))

    // 6. Success - redirect to voting page
    success.value = true
    console.log('✅ Token valid, redirecting to voting...')
    console.log('ℹ️ Token NOT marked as used yet (will be marked after vote submission)')

    setTimeout(() => {
      router.push('/voting')
    }, 1500)
  } catch (err) {
    console.error('Token processing error:', err)
    error.value = err.message || 'Gagal memproses token'

    // Auto-clear error after 5 seconds
    setTimeout(() => {
      if (error.value === err.message) {
        error.value = ''
      }
    }, 5000)
  } finally {
    loading.value = false
  }
}

const submitManualToken = () => {
  if (!manualToken.value.trim()) {
    error.value = 'Masukkan token 6 digit'
    return
  }
  processToken(manualToken.value)
}

// Auto-focus input when page loads
const focusTokenInput = () => {
  setTimeout(() => {
    const input = document.querySelector('.token-input')
    if (input) input.focus()
  }, 100)
}

// Load session on mount
onMounted(async () => {
  await loadActiveSession()
  focusTokenInput()
})
</script>

<style scoped>
.scan-container {
  max-width: 500px;
  margin: 0 auto;
  padding: 1.5rem;
  text-align: center;
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.title {
  color: #1e3a8a;
  margin-bottom: 0.5rem;
  font-size: 1.8rem;
  font-weight: 700;
}

.subtitle {
  color: #6b7280;
  margin-bottom: 2rem;
  font-size: 1rem;
}

.session-info {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 1rem;
  margin: 1rem 0 2rem;
  padding: 1rem;
  background: linear-gradient(135deg, #f0f7ff, #e6f0ff);
  border-radius: 12px;
  border: 1px solid #dbeafe;
  flex-wrap: wrap;
}

.session-name {
  font-weight: 600;
  color: #1e40af;
  font-size: 0.95rem;
}

.session-status {
  padding: 0.4rem 1rem;
  border-radius: 20px;
  font-size: 0.8rem;
  font-weight: 700;
  letter-spacing: 0.5px;
  text-transform: uppercase;
}

.session-status.draft {
  background: #f1f5f9;
  color: #64748b;
  border: 1px solid #e2e8f0;
}

.session-status.pendaftaran {
  background: #fef3c7;
  color: #92400e;
  border: 1px solid #fde68a;
}

.session-status.voting {
  background: linear-gradient(135deg, #d1fae5, #a7f3d0);
  color: #065f46;
  border: 1px solid #6ee7b7;
}

.session-status.selesai {
  background: linear-gradient(135deg, #fee2e2, #fecaca);
  color: #991b1b;
  border: 1px solid #fca5a5;
}

.warning-box {
  background: #fff3cd;
  border: 2px solid #ffc107;
  border-radius: 12px;
  padding: 1.5rem;
  margin: 1.5rem 0;
  color: #856404;
  text-align: center;
}

.warning-box p {
  margin: 0.5rem 0;
}

.btn-home {
  display: inline-block;
  margin-top: 1rem;
  padding: 0.75rem 1.5rem;
  background: #1e3a8a;
  color: white;
  text-decoration: none;
  border-radius: 8px;
  font-weight: 600;
  transition: all 0.2s;
}

.btn-home:hover {
  background: #1e40af;
  transform: translateY(-1px);
}

.token-input-container {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
}

.token-input-box {
  margin-bottom: 2rem;
}

.token-input {
  width: 100%;
  max-width: 300px;
  padding: 1.25rem;
  border: 3px solid #d1d5db;
  border-radius: 12px;
  font-size: 1.5rem;
  text-align: center;
  letter-spacing: 4px;
  font-family: 'Courier New', monospace;
  font-weight: 700;
  color: #1e3a8a;
  background: #f9fafb;
  transition: all 0.3s;
  margin-bottom: 1rem;
}

.token-input:focus {
  outline: none;
  border-color: #1e3a8a;
  box-shadow: 0 0 0 4px rgba(30, 58, 138, 0.15);
  background: white;
}

.token-input:disabled {
  background: #f3f4f6;
  cursor: not-allowed;
  opacity: 0.7;
}

.token-hint {
  color: #6b7280;
  font-size: 0.9rem;
  margin-bottom: 1.5rem;
}

.token-preview {
  display: flex;
  justify-content: center;
  gap: 0.5rem;
  margin-top: 1rem;
}

.digit {
  width: 50px;
  height: 60px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #1e3a8a, #3b82f6);
  color: white;
  font-size: 1.8rem;
  font-weight: 700;
  border-radius: 8px;
  font-family: 'Courier New', monospace;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

.submit-btn {
  width: 100%;
  max-width: 300px;
  padding: 1.25rem;
  background: linear-gradient(135deg, #059669, #10b981);
  color: white;
  border: none;
  border-radius: 12px;
  font-size: 1.1rem;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.3s;
  margin: 0 auto;
  box-shadow: 0 4px 12px rgba(5, 150, 105, 0.3);
}

.submit-btn:hover:not(:disabled) {
  background: linear-gradient(135deg, #047857, #0d9c6d);
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(5, 150, 105, 0.4);
}

.submit-btn:disabled {
  background: #94a3b8;
  cursor: not-allowed;
  transform: none;
  box-shadow: none;
}

.error-message,
.success-message {
  margin: 1.5rem 0;
  padding: 1.25rem;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.75rem;
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
}

.success-message {
  background: linear-gradient(135deg, #d1fae5, #a7f3d0);
  color: #065f46;
  border: 2px solid #6ee7b7;
}

.error-icon,
.success-icon {
  font-size: 1.2rem;
}

.info-box {
  margin-top: 2rem;
  padding: 1.5rem;
  background: linear-gradient(135deg, #f8fafc, #f1f5f9);
  border-radius: 12px;
  text-align: left;
  border: 1px solid #e2e8f0;
}

.info-box h3 {
  color: #1e3a8a;
  margin-bottom: 1rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.info-icon {
  font-size: 1.2rem;
}

.info-box ol {
  margin: 0 0 1.5rem;
  padding-left: 1.5rem;
  color: #4b5563;
}

.info-box li {
  margin-bottom: 0.5rem;
  line-height: 1.5;
}

.token-example {
  border-top: 1px solid #e2e8f0;
  padding-top: 1.5rem;
}

.token-example p {
  color: #4b5563;
  margin-bottom: 0.75rem;
}

.example-tokens {
  display: flex;
  gap: 0.75rem;
  margin-bottom: 0.5rem;
  flex-wrap: wrap;
}

.example-token {
  padding: 0.5rem 1rem;
  background: white;
  border: 2px solid #dbeafe;
  border-radius: 8px;
  color: #1e40af;
  font-family: 'Courier New', monospace;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  user-select: none;
}

.example-token:hover {
  background: #dbeafe;
  border-color: #1e40af;
  transform: translateY(-1px);
}

.example-note {
  color: #9ca3af;
  font-size: 0.85rem;
  font-style: italic;
  margin-top: 0.25rem;
}

.footer-links {
  margin-top: 2rem;
  padding-top: 1.5rem;
  border-top: 1px solid #e2e8f0;
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 1rem;
  flex-wrap: wrap;
}

.footer-link {
  color: #1e3a8a;
  text-decoration: none;
  font-weight: 600;
  transition: color 0.2s;
}

.footer-link:hover {
  color: #1e40af;
  text-decoration: underline;
}

.separator {
  color: #9ca3af;
}

@media (max-width: 480px) {
  .scan-container {
    padding: 1rem;
  }

  .title {
    font-size: 1.5rem;
  }

  .token-input {
    max-width: 280px;
    font-size: 1.3rem;
    padding: 1rem;
  }

  .digit {
    width: 40px;
    height: 50px;
    font-size: 1.5rem;
  }

  .submit-btn {
    max-width: 280px;
    padding: 1rem;
  }

  .session-info {
    flex-direction: column;
    gap: 0.5rem;
    text-align: center;
  }

  .footer-links {
    flex-direction: column;
    gap: 0.5rem;
  }

  .separator {
    display: none;
  }
}
</style>
