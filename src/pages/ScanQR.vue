<template>
  <div class="scan-container">
    <h1 class="title">Scan QR Code Voting</h1>
    <p class="subtitle">Arahkan kamera ke QR Code di kartu voting Anda</p>

    <div v-if="!hasCameraPermission" class="permission-box">
      <p>⚠️ Memerlukan akses kamera</p>
      <button @click="requestCamera" class="permission-btn">Izinkan Akses Kamera</button>
    </div>

    <div v-else class="scanner-wrapper">
      <!-- QR Scanner akan ditempatkan di sini -->
      <div ref="scannerElement" class="scanner-area">
        <div class="scanner-frame">
          <div class="corner tl"></div>
          <div class="corner tr"></div>
          <div class="corner bl"></div>
          <div class="corner br"></div>
        </div>
        <p class="scanner-hint">Arahkan QR Code ke dalam frame</p>
      </div>

      <div class="manual-input">
        <p>Atau masukkan token manual:</p>
        <input
          type="text"
          v-model="manualToken"
          placeholder="Masukkan token QR"
          @keyup.enter="submitManualToken"
        />
        <button @click="submitManualToken" :disabled="loading">
          {{ loading ? 'Memproses...' : 'Submit' }}
        </button>
      </div>
    </div>

    <div v-if="error" class="error-message">❌ {{ error }}</div>

    <div v-if="success" class="success-message">
      ✅ Token valid! Redirecting ke halaman voting...
    </div>

    <div class="instructions">
      <h3>Instruksi:</h3>
      <ol>
        <li>Ambil kartu voting dari panitia</li>
        <li>Arahkan QR Code ke kamera</li>
        <li>Tunggu sampai terbaca otomatis</li>
        <li>Atau masukkan token manual jika QR rusak</li>
      </ol>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { Html5QrcodeScanner } from 'html5-qrcode'

const scannerElement = ref(null)
const hasCameraPermission = ref(false)
const manualToken = ref('')
const loading = ref(false)
const error = ref('')
const success = ref(false)
let html5QrcodeScanner = null

const router = useRouter()
const authStore = useAuthStore()

const requestCamera = () => {
  navigator.mediaDevices
    .getUserMedia({ video: true })
    .then(() => {
      hasCameraPermission.value = true
      initScanner()
    })
    .catch((err) => {
      error.value = 'Akses kamera ditolak: ' + err.message
    })
}

const initScanner = () => {
  if (!scannerElement.value) return

  html5QrcodeScanner = new Html5QrcodeScanner(
    'reader', // ID element harus ada
    {
      fps: 10,
      qrbox: { width: 250, height: 250 },
      rememberLastUsedCamera: true,
    },
    false,
  )

  // Tapi kita akan pakai manual scan nanti
  // Karena butuh install library tambahan
}

const submitManualToken = async () => {
  if (!manualToken.value.trim()) {
    error.value = 'Token tidak boleh kosong'
    return
  }

  loading.value = true
  error.value = ''
  success.value = false

  const result = await authStore.loginWithQR(manualToken.value.trim())

  if (result.success) {
    success.value = true
    setTimeout(() => {
      router.push('/voting')
    }, 1500)
  } else {
    error.value = result.error
  }

  loading.value = false
}

onMounted(() => {
  // Cek permission camera
  navigator.permissions
    ?.query({ name: 'camera' })
    .then((permissionStatus) => {
      if (permissionStatus.state === 'granted') {
        hasCameraPermission.value = true
      }
    })
    .catch(() => {
      // Fallback untuk browser lama
      hasCameraPermission.value = false
    })
})

onUnmounted(() => {
  if (html5QrcodeScanner) {
    html5QrcodeScanner.clear()
  }
})
</script>

<style scoped>
.scan-container {
  max-width: 800px;
  margin: 0 auto;
  padding: 2rem;
}

.title {
  color: #1e3a8a;
  text-align: center;
  margin-bottom: 0.5rem;
}

.subtitle {
  color: #666;
  text-align: center;
  margin-bottom: 2rem;
}

.permission-box {
  background: #fff3cd;
  border: 1px solid #ffc107;
  border-radius: 8px;
  padding: 2rem;
  text-align: center;
  margin-bottom: 2rem;
}

.permission-btn {
  background-color: #1e3a8a;
  color: white;
  border: none;
  padding: 0.75rem 1.5rem;
  border-radius: 4px;
  font-size: 1rem;
  cursor: pointer;
  margin-top: 1rem;
}

.scanner-wrapper {
  margin-bottom: 2rem;
}

.scanner-area {
  position: relative;
  width: 300px;
  height: 300px;
  margin: 0 auto 2rem;
  border: 2px solid #ddd;
  border-radius: 8px;
  overflow: hidden;
}

.scanner-frame {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 250px;
  height: 250px;
  border: 2px solid transparent;
}

.corner {
  position: absolute;
  width: 30px;
  height: 30px;
  border-color: #1e3a8a;
  border-style: solid;
}

.corner.tl {
  top: 0;
  left: 0;
  border-width: 4px 0 0 4px;
  border-radius: 8px 0 0 0;
}

.corner.tr {
  top: 0;
  right: 0;
  border-width: 4px 4px 0 0;
  border-radius: 0 8px 0 0;
}

.corner.bl {
  bottom: 0;
  left: 0;
  border-width: 0 0 4px 4px;
  border-radius: 0 0 0 8px;
}

.corner.br {
  bottom: 0;
  right: 0;
  border-width: 0 4px 4px 0;
  border-radius: 0 0 8px 0;
}

.scanner-hint {
  position: absolute;
  bottom: -40px;
  width: 100%;
  text-align: center;
  color: #666;
}

.manual-input {
  background: #f8f9fa;
  padding: 1.5rem;
  border-radius: 8px;
  text-align: center;
}

.manual-input input {
  width: 100%;
  max-width: 300px;
  padding: 0.75rem;
  margin: 1rem 0;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 1rem;
}

.manual-input button {
  background-color: #1e3a8a;
  color: white;
  border: none;
  padding: 0.75rem 1.5rem;
  border-radius: 4px;
  font-size: 1rem;
  cursor: pointer;
}

.manual-input button:disabled {
  background-color: #94a3b8;
  cursor: not-allowed;
}

.error-message,
.success-message {
  margin: 1rem 0;
  padding: 1rem;
  border-radius: 4px;
  text-align: center;
}

.error-message {
  background-color: #fee;
  color: #c00;
}

.success-message {
  background-color: #d4edda;
  color: #155724;
}

.instructions {
  margin-top: 3rem;
  padding: 1.5rem;
  background: #f0f7ff;
  border-radius: 8px;
}

.instructions h3 {
  color: #1e3a8a;
  margin-bottom: 1rem;
}

.instructions ol {
  padding-left: 1.5rem;
}

.instructions li {
  margin-bottom: 0.5rem;
}
</style>
