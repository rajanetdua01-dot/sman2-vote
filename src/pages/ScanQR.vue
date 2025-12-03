<template>
  <div class="scan-container">
    <h1 class="title">Scan QR Code Voting</h1>
    <p class="subtitle">Arahkan kamera ke QR Code di kartu voting Anda</p>

    <div v-if="!hasCamera" class="permission-box">
      <p>⚠️ Membutuhkan akses kamera</p>
      <button @click="initCamera" class="permission-btn">Izinkan Kamera</button>
    </div>

    <div v-else>
      <div ref="scannerElement" class="scanner-box"></div>
      <p class="scanner-hint">Arahkan QR Code ke dalam frame</p>
    </div>

    <div class="manual-input">
      <p>Atau masukkan token manual:</p>
      <input
        type="text"
        v-model="manualToken"
        placeholder="Masukkan token dari kartu"
        @keyup.enter="submitManualToken"
      />
      <button @click="submitManualToken" :disabled="loading">
        {{ loading ? 'Memproses...' : 'Submit Token' }}
      </button>
    </div>

    <div v-if="error" class="error-message">❌ {{ error }}</div>
    <div v-if="success" class="success-message">✅ Token valid! Redirecting ke voting...</div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { Html5QrcodeScanner } from 'html5-qrcode'
import { supabase } from '@/utils/supabase'

const router = useRouter()
const scannerElement = ref(null)
const hasCamera = ref(false)
const manualToken = ref('')
const loading = ref(false)
const error = ref('')
const success = ref(false)
let html5QrcodeScanner = null

const initCamera = async () => {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ video: true })
    hasCamera.value = true

    // Stop the stream (we'll let the scanner handle it)
    stream.getTracks().forEach((track) => track.stop())

    // Initialize scanner after a brief delay
    setTimeout(initQRScanner, 100)
  } catch (err) {
    error.value = 'Tidak dapat mengakses kamera: ' + err.message
  }
}

const initQRScanner = () => {
  if (!scannerElement.value || html5QrcodeScanner) return

  html5QrcodeScanner = new Html5QrcodeScanner(
    'scanner-box', // Target element ID
    {
      fps: 10,
      qrbox: { width: 250, height: 250 },
      rememberLastUsedCamera: true,
    },
    false,
  )

  html5QrcodeScanner.render(onQRCodeScanned, (error) => {
    console.log('QR Scanner error:', error)
  })
}

const onQRCodeScanned = async (token) => {
  if (loading.value) return
  loading.value = true
  error.value = ''
  success.value = false

  try {
    // Validasi token
    const { data: tokenData, error: tokenError } = await supabase
      .from('token_qr')
      .select('*, pengguna(*)')
      .eq('token', token.trim())
      .eq('sudah_digunakan', false)
      .gt('kadaluarsa_pada', new Date().toISOString())
      .single()

    if (tokenError) throw new Error('Token tidak valid')

    // Update token sebagai digunakan
    await supabase
      .from('token_qr')
      .update({
        sudah_digunakan: true,
        digunakan_pada: new Date().toISOString(),
      })
      .eq('id', tokenData.id)

    // Simpan session
    localStorage.setItem('smanda_voter', JSON.stringify(tokenData.pengguna))
    localStorage.setItem(
      'smanda_voter_token',
      JSON.stringify({
        token: token,
        timestamp: new Date().toISOString(),
      }),
    )

    success.value = true
    setTimeout(() => {
      router.push('/voting')
    }, 1500)
  } catch (err) {
    error.value = 'Gagal memproses token: ' + err.message
  } finally {
    loading.value = false
  }
}

const submitManualToken = () => {
  if (!manualToken.value.trim()) {
    error.value = 'Token tidak boleh kosong'
    return
  }
  onQRCodeScanned(manualToken.value.trim())
}

onMounted(() => {
  // Check camera availability
  if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
    hasCamera.value = true
    initQRScanner()
  }
})

onUnmounted(() => {
  if (html5QrcodeScanner) {
    html5QrcodeScanner.clear()
    html5QrcodeScanner = null
  }
})
</script>

<style scoped>
.scan-container {
  max-width: 500px;
  margin: 0 auto;
  padding: 2rem;
  text-align: center;
}

.permission-box {
  background: #fff3cd;
  border: 1px solid #ffc107;
  border-radius: 8px;
  padding: 2rem;
  margin: 2rem 0;
}

.permission-btn {
  background: #1e3a8a;
  color: white;
  border: none;
  padding: 0.75rem 1.5rem;
  border-radius: 6px;
  font-size: 1rem;
  cursor: pointer;
  margin-top: 1rem;
}

.scanner-box {
  width: 300px;
  height: 300px;
  margin: 2rem auto;
  border: 2px solid #ddd;
  border-radius: 8px;
  overflow: hidden;
}

.manual-input {
  margin-top: 2rem;
  padding-top: 2rem;
  border-top: 1px solid #e2e8f0;
}

.manual-input input {
  width: 100%;
  max-width: 300px;
  padding: 0.75rem;
  border: 1px solid #ddd;
  border-radius: 6px;
  margin: 1rem 0;
  font-size: 1rem;
}

.manual-input button {
  background: #1e3a8a;
  color: white;
  border: none;
  padding: 0.75rem 1.5rem;
  border-radius: 6px;
  font-size: 1rem;
  cursor: pointer;
}

.manual-input button:disabled {
  background: #94a3b8;
  cursor: not-allowed;
}

.error-message,
.success-message {
  margin: 1rem 0;
  padding: 1rem;
  border-radius: 6px;
}

.error-message {
  background: #fee;
  color: #c00;
  border: 1px solid #fcc;
}

.success-message {
  background: #d4edda;
  color: #155724;
  border: 1px solid #c3e6cb;
}
</style>
